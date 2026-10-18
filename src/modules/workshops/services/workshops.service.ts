import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { isUUID } from 'class-validator';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import {
  InvalidRequestException,
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import type { UploadedFileData } from '@/core/types/uploaded-file.types';
import { Media } from '@/internals/media/entity/media.entity';
import { MediaService } from '@/internals/media/services/media.service';
import { WorkshopUpdateMeDto } from '../dto/update-me.dto';
import { WorkshopAgreementsDto } from '../dto/workshop-agreements.dto';
import { WorkshopWorkingHourDto } from '../dto/workshop-working-hour.dto';
import { WorkshopAddress } from '../entities/workshop-address.entity';
import { WorkshopAgreement } from '../entities/workshop-agreement.entity';
import { WorkshopApplication } from '../entities/workshop-application.entity';
import { WorkshopDocument } from '../entities/workshop-document.entity';
import { WorkshopImage } from '../entities/workshop-image.entity';
import { WorkshopWorkingHour } from '../entities/workshop-working-hour.entity';
import { Workshop } from '../entities/workshop.entity';
import {
  WeekDay,
  WORKSHOP_AGREEMENT_VERSIONS,
  WorkshopAgreementType,
  WorkshopApplicationStatus,
} from '../types/workshops.types';
import type {
  WorkshopAgreementTypeValue,
  WorkshopDocumentRequirementSnapshot,
  WorkshopView,
} from '../types/workshops.types';

@Injectable()
export class WorkshopsService {
  /** Postgres `unique_violation`. */
  private static readonly UNIQUE_VIOLATION = '23505';

  private static readonly EMAIL_UNIQUE_INDEX = 'UQ_workshops_email';

  private static readonly IMAGE_DIR = 'workshops';

  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
    @InjectRepository(WorkshopApplication)
    private readonly applicationRepo: Repository<WorkshopApplication>,
    private readonly dataSource: DataSource,
    private readonly mediaService: MediaService,
  ) {}

  async findById(workshopId: string): Promise<WorkshopView> {
    const workshop = await this.workshopRepo.findOne({
      where: { id: workshopId },
      order: {
        images: { position: 'ASC' },
        documents: { document_key: 'ASC', sort_order: 'ASC' },
      },
      relations: {
        address: true,
        images: { media: true },
        documents: { media: true },
        working_hours: true,
        agreements: true,
      },
    });
    if (!workshop) {
      throw new RecordNotFoundException(
        ErrorMessage.WORKSHOP_NOT_FOUND,
        ErrorCode.WORKSHOP_NOT_FOUND,
      );
    }
    const application = await this.applicationRepo.findOne({
      where: { workshop_id: workshopId },
      select: { id: true, document_requirements: true },
    });
    return this.toView(workshop, application?.document_requirements ?? []);
  }

  async updateById(
    workshopId: string,
    dto: WorkshopUpdateMeDto,
  ): Promise<WorkshopView> {
    const {
      address,
      image_ids,
      documents,
      working_hours,
      agreements,
      ...fields
    } = dto;

    const application = await this.assertEditable(workshopId);
    if (working_hours) {
      this.assertWorkingHours(working_hours);
    }
    if (documents) {
      this.assertDocuments(documents, application?.document_requirements ?? []);
    }
    const mediaIds = [
      ...(image_ids ?? []),
      ...Object.values(documents ?? {}).flat(),
    ];
    await this.assertClaimable(mediaIds, workshopId);

    try {
      await this.dataSource.transaction(async (manager) => {
        if (Object.keys(fields).length > 0) {
          await manager.update(Workshop, { id: workshopId }, fields);
        }
        if (address) {
          await manager.delete(WorkshopAddress, { workshop_id: workshopId });
          await manager.insert(WorkshopAddress, {
            ...address,
            landmark: address.landmark ?? null,
            city: address.city ?? null,
            state: address.state ?? null,
            postal_code: address.postal_code ?? null,
            country: address.country ?? null,
            workshop_id: workshopId,
          });
        }
        if (image_ids) {
          await this.replaceImages(manager, workshopId, image_ids);
        }
        if (documents) {
          await this.replaceDocuments(manager, workshopId, documents);
        }
        if (working_hours) {
          await this.replaceWorkingHours(manager, workshopId, working_hours);
        }
        if (agreements) {
          await this.applyAgreements(manager, workshopId, agreements);
        }
      });
    } catch (error: unknown) {
      // Only the email index maps to this 409; any other violation is a bug, not a conflict.
      const driverError = (error as QueryFailedError).driverError as
        { code?: string; constraint?: string } | undefined;
      if (
        error instanceof QueryFailedError &&
        driverError?.code === WorkshopsService.UNIQUE_VIOLATION &&
        driverError.constraint === WorkshopsService.EMAIL_UNIQUE_INDEX
      ) {
        throw new RecordConflictException(
          ErrorMessage.EMAIL_ALREADY_IN_USE,
          ErrorCode.EMAIL_ALREADY_IN_USE,
          error,
        );
      }
      throw error;
    }

    return this.findById(workshopId);
  }

  /** Unclaimed until `PATCH workshops/me` links the returned id, as a shop photo or a document. */
  uploadImage(file: UploadedFileData): Promise<Media> {
    return this.mediaService.upload(
      file,
      { user_id: null },
      WorkshopsService.IMAGE_DIR,
    );
  }

  /** Under review or approved, the details an admin is looking at must not move. */
  private async assertEditable(
    workshopId: string,
  ): Promise<WorkshopApplication | null> {
    const application = await this.applicationRepo.findOne({
      where: { workshop_id: workshopId },
      select: { id: true, status: true, document_requirements: true },
    });
    if (
      application?.status === WorkshopApplicationStatus.SUBMITTED ||
      application?.status === WorkshopApplicationStatus.APPROVED
    ) {
      throw new RecordConflictException(
        ErrorMessage.WORKSHOP_APPLICATION_LOCKED,
        ErrorCode.WORKSHOP_APPLICATION_LOCKED,
      );
    }
    return application;
  }

  /** `HH:mm` strings compare correctly as strings. */
  private assertWorkingHours(hours: WorkshopWorkingHourDto[]): void {
    const invalid = hours.some(
      (hour) => hour.is_open && (hour.closes_at ?? '') <= (hour.opens_at ?? ''),
    );
    if (invalid) {
      throw new InvalidRequestException(
        ErrorMessage.WORKING_HOURS_INVALID,
        ErrorCode.WORKING_HOURS_INVALID,
      );
    }
  }

  /**
   * Each id must be a workshop upload (no customer owns it) and not already
   * linked to a different workshop.
   */
  private async assertClaimable(
    mediaIds: string[],
    workshopId: string,
  ): Promise<void> {
    const ids = [...new Set(mediaIds)];
    if (ids.length === 0) {
      return;
    }
    const media = await this.mediaService.findUnclaimedMany(ids);
    const elsewhere = { media_id: In(ids), workshop_id: Not(workshopId) };
    const linkedElsewhere =
      media.length === ids.length &&
      ((await this.dataSource.getRepository(WorkshopImage).exists({
        where: elsewhere,
      })) ||
        (await this.dataSource.getRepository(WorkshopDocument).exists({
          where: elsewhere,
        })));

    if (media.length !== ids.length || linkedElsewhere) {
      throw new RecordNotFoundException(
        ErrorMessage.MEDIA_NOT_FOUND,
        ErrorCode.MEDIA_NOT_FOUND,
      );
    }
  }

  /**
   * The keys come from data, so the DTO can only check that `documents` is an
   * object; the shape and the counts are checked here against the snapshot.
   */
  private assertDocuments(
    documents: Record<string, unknown>,
    requirements: WorkshopDocumentRequirementSnapshot[],
  ): void {
    const entries = Object.entries(documents);
    const ids = entries.flatMap(([, imageIds]) =>
      Array.isArray(imageIds) ? (imageIds as unknown[]) : [null],
    );
    const wellFormed =
      ids.every((id) => typeof id === 'string' && isUUID(id)) &&
      new Set(ids).size === ids.length;
    if (!wellFormed) {
      throw new InvalidRequestException(
        ErrorMessage.DOCUMENTS_FORMAT,
        ErrorCode.INVALID_REQUEST,
      );
    }

    for (const [key, imageIds] of entries as [string, string[]][]) {
      const requirement = requirements.find((r) => r.key === key);
      if (!requirement) {
        throw new InvalidRequestException(
          ErrorMessage.WORKSHOP_DOCUMENT_UNKNOWN,
          ErrorCode.WORKSHOP_DOCUMENT_UNKNOWN,
        );
      }
      if (
        imageIds.length < requirement.min_images ||
        imageIds.length > requirement.max_images
      ) {
        throw new InvalidRequestException(
          ErrorMessage.WORKSHOP_DOCUMENT_IMAGE_COUNT,
          ErrorCode.WORKSHOP_DOCUMENT_IMAGE_COUNT,
        );
      }
    }
  }

  private async replaceImages(
    manager: EntityManager,
    workshopId: string,
    imageIds: string[],
  ): Promise<void> {
    await manager.delete(WorkshopImage, { workshop_id: workshopId });
    if (imageIds.length === 0) {
      return;
    }
    await manager.insert(
      WorkshopImage,
      imageIds.map((mediaId, position) => ({
        workshop_id: workshopId,
        media_id: mediaId,
        position,
      })),
    );
  }

  /**
   * Only the keys that were sent are replaced. A photo moved from another
   * key is taken off that key too, as one photo files under one document.
   */
  private async replaceDocuments(
    manager: EntityManager,
    workshopId: string,
    documents: Record<string, string[]>,
  ): Promise<void> {
    const keys = Object.keys(documents);
    const mediaIds = Object.values(documents).flat();
    if (keys.length === 0) {
      return;
    }
    await manager.delete(WorkshopDocument, {
      workshop_id: workshopId,
      document_key: In(keys),
    });
    if (mediaIds.length === 0) {
      return;
    }
    await manager.delete(WorkshopDocument, {
      workshop_id: workshopId,
      media_id: In(mediaIds),
    });
    await manager.insert(
      WorkshopDocument,
      Object.entries(documents).flatMap(([document_key, imageIds]) =>
        imageIds.map((mediaId, sort_order) => ({
          workshop_id: workshopId,
          media_id: mediaId,
          document_key,
          sort_order,
        })),
      ),
    );
  }

  private async replaceWorkingHours(
    manager: EntityManager,
    workshopId: string,
    hours: WorkshopWorkingHourDto[],
  ): Promise<void> {
    await manager.delete(WorkshopWorkingHour, { workshop_id: workshopId });
    await manager.insert(
      WorkshopWorkingHour,
      hours.map((hour) => ({
        workshop_id: workshopId,
        day: hour.day,
        is_open: hour.is_open,
        opens_at: hour.is_open ? hour.opens_at : null,
        closes_at: hour.is_open ? hour.closes_at : null,
      })),
    );
  }

  /** Accepting keeps an existing acceptance of the same version, and its original time. */
  private async applyAgreements(
    manager: EntityManager,
    workshopId: string,
    agreements: WorkshopAgreementsDto,
  ): Promise<void> {
    for (const type of Object.values(WorkshopAgreementType)) {
      const accepted = agreements[type];
      if (accepted === undefined) {
        continue;
      }
      const row = {
        workshop_id: workshopId,
        type,
        version: WORKSHOP_AGREEMENT_VERSIONS[type],
      };
      if (accepted) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(WorkshopAgreement)
          .values(row)
          .orIgnore()
          .execute();
      } else {
        await manager.delete(WorkshopAgreement, row);
      }
    }
  }

  private toView(
    workshop: Workshop,
    documentRequirements: WorkshopDocumentRequirementSnapshot[],
  ): WorkshopView {
    const {
      address,
      images = [],
      documents = [],
      working_hours = [],
      agreements = [],
      ...fields
    } = workshop;

    const dayOrder: string[] = Object.values(WeekDay);
    const accepted = new Set(
      agreements
        .filter((a) => a.version === WORKSHOP_AGREEMENT_VERSIONS[a.type])
        .map((a) => a.type),
    );

    return {
      ...fields,
      address: address
        ? {
            name: address.name,
            formatted_address: address.formatted_address,
            latitude: address.latitude,
            longitude: address.longitude,
            shop_no: address.shop_no,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
            created_at: address.created_at,
            updated_at: address.updated_at,
          }
        : null,
      images: images.map(({ position, media }) => ({
        id: media.id,
        path: media.path,
        position,
      })),
      document_requirements: documentRequirements,
      documents: documents.map(({ document_key, sort_order, media }) => ({
        id: media.id,
        path: media.path,
        document_key,
        sort_order,
      })),
      working_hours: [...working_hours]
        .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
        .map(({ day, is_open, opens_at, closes_at }) => ({
          day,
          is_open,
          // Postgres returns `time` as `HH:mm:ss`; answer in the `HH:mm` the app sends.
          opens_at: opens_at?.slice(0, 5) ?? null,
          closes_at: closes_at?.slice(0, 5) ?? null,
        })),
      agreements: {
        terms_of_service: accepted.has(WorkshopAgreementType.TERMS_OF_SERVICE),
        commission_agreement: accepted.has(
          WorkshopAgreementType.COMMISSION_AGREEMENT,
        ),
        data_privacy_consent: accepted.has(
          WorkshopAgreementType.DATA_PRIVACY_CONSENT,
        ),
      } satisfies Record<WorkshopAgreementTypeValue, boolean>,
    };
  }
}
