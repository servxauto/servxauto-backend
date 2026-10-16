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
import {
  WorkshopApplication,
  WorkshopApplicationStatus,
  WorkshopApplicationStep,
  WorkshopApplicationStepType,
} from '../entities/workshop-application.entity';

@Injectable()
export class WorkshopApplicationService {
  constructor(
    @InjectRepository(WorkshopApplication)
    private readonly applicationRepo: Repository<WorkshopApplication>,
  ) {}

  async create(workshopId: string): Promise<WorkshopApplication> {
    const existing = await this.applicationRepo.findOne({
      where: { workshop_id: workshopId },
    });
    if (existing) {
      return existing;
    }
    return await this.applicationRepo.save(
      this.applicationRepo.create({ workshop_id: workshopId }),
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

    if (this.pendingSteps(application).length > 0) {
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
}
