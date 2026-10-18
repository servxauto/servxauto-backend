import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import {
  InvalidRequestException,
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { UpdateWorkshopApplicationDto } from '../dto/update-workshop-application.dto';
import { WorkshopApplication } from '../entities/workshop-application.entity';
import { WorkshopDocumentRequirement } from '../entities/workshop-document-requirement.entity';
import { WorkshopsService } from './workshops.service';
import {
  WorkshopApplicationStatus,
  WorkshopApplicationStep,
} from '../types/workshops.types';
import type {
  WorkshopApplicationStepType,
  WorkshopView,
} from '../types/workshops.types';

@Injectable()
export class WorkshopApplicationService {
  constructor(
    @InjectRepository(WorkshopApplication)
    private readonly applicationRepo: Repository<WorkshopApplication>,
    @InjectRepository(WorkshopDocumentRequirement)
    private readonly requirementRepo: Repository<WorkshopDocumentRequirement>,
    private readonly workshopsService: WorkshopsService,
  ) {}

  async create(workshopId: string): Promise<WorkshopApplication> {
    const existing = await this.applicationRepo.findOne({
      where: { workshop_id: workshopId },
    });
    if (existing) {
      return existing;
    }
    // Snapshot, so editing a requirement later never changes this application's.
    const requirements = await this.requirementRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
    return await this.applicationRepo.save(
      this.applicationRepo.create({
        workshop_id: workshopId,
        document_requirements: requirements.map(
          ({
            key,
            name,
            description,
            min_images,
            max_images,
            is_required,
            sort_order,
          }) => ({
            key,
            name,
            description,
            min_images,
            max_images,
            is_required,
            sort_order,
          }),
        ),
      }),
    );
  }

  async find(workshopId: string): Promise<WorkshopApplication> {
    const application = await this.applicationRepo.findOne({
      where: { workshop_id: workshopId },
    });
    if (!application) {
      throw new RecordNotFoundException(
        ErrorMessage.WORKSHOP_APPLICATION_NOT_FOUND,
        ErrorCode.WORKSHOP_APPLICATION_NOT_FOUND,
      );
    }
    return application;
  }

  async update(
    workshopId: string,
    dto: UpdateWorkshopApplicationDto,
  ): Promise<WorkshopApplication> {
    const application = await this.find(workshopId);
    Object.assign(application, dto);
    return this.applicationRepo.save(application);
  }

  async submit(workshopId: string): Promise<WorkshopApplication> {
    const application = await this.find(workshopId);

    if (application.status === WorkshopApplicationStatus.SUBMITTED) {
      throw new RecordConflictException(
        ErrorMessage.WORKSHOP_APPLICATION_ALREADY_SUBMITTED,
        ErrorCode.WORKSHOP_APPLICATION_ALREADY_SUBMITTED,
      );
    }

    if (application.status === WorkshopApplicationStatus.APPROVED) {
      throw new RecordConflictException(
        ErrorMessage.WORKSHOP_APPLICATION_ALREADY_APPROVED,
        ErrorCode.WORKSHOP_APPLICATION_ALREADY_APPROVED,
      );
    }

    if (
      this.pendingSteps(application).length > 0 ||
      !this.hasRequiredDetails(await this.workshopsService.findById(workshopId))
    ) {
      throw new InvalidRequestException(
        ErrorMessage.WORKSHOP_APPLICATION_INCOMPLETE,
        ErrorCode.WORKSHOP_APPLICATION_INCOMPLETE,
      );
    }

    application.status = WorkshopApplicationStatus.SUBMITTED;
    application.submitted_at = new Date();
    // Resubmission: the previous rejection no longer describes this version.
    application.rejection_reason = null;

    return this.applicationRepo.save(application);
  }

  /**
   * Steps still missing their completion timestamp. The timestamps are the
   * source of truth here, not `current_step`.
   */
  private pendingSteps(
    application: WorkshopApplication,
  ): WorkshopApplicationStepType[] {
    const completedAt: Record<WorkshopApplicationStepType, Date | null> = {
      [WorkshopApplicationStep.BUSINESS_DETAILS]:
        application.business_details_completed_at,
      [WorkshopApplicationStep.SHOP_LOCATION]:
        application.shop_location_completed_at,
      [WorkshopApplicationStep.DOCUMENTS]: application.documents_completed_at,
      [WorkshopApplicationStep.WORKING_HOURS]:
        application.working_hours_completed_at,
      [WorkshopApplicationStep.REVIEW]: application.reviewed_at,
      [WorkshopApplicationStep.AGREEMENTS]: application.agreements_accepted_at,
    };

    return Object.values(WorkshopApplicationStep).filter(
      (step) => !completedAt[step],
    );
  }

  /**
   * The step timestamps only say the partner moved on; this checks that what
   * an admin needs to review is actually stored.
   */
  private hasRequiredDetails(workshop: WorkshopView): boolean {
    const hasDocuments = workshop.document_requirements
      .filter((requirement) => requirement.is_required)
      .every(
        (requirement) =>
          workshop.documents.filter(
            (document) => document.document_key === requirement.key,
          ).length >= requirement.min_images,
      );
    return (
      !!workshop.business_name &&
      !!workshop.owner_name &&
      !!workshop.email &&
      !!workshop.address &&
      workshop.images.length >= 2 &&
      hasDocuments &&
      workshop.working_hours.length === 7 &&
      Object.values(workshop.agreements).every(Boolean)
    );
  }
}
