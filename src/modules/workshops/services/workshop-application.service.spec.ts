import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  InvalidRequestException,
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { WorkshopApplication } from '../entities/workshop-application.entity';
import { WorkshopDocumentRequirement } from '../entities/workshop-document-requirement.entity';
import {
  WorkshopApplicationStatus,
  WorkshopApplicationStep,
} from '../types/workshops.types';
import type { WorkshopView } from '../types/workshops.types';
import { WorkshopApplicationService } from './workshop-application.service';
import { WorkshopsService } from './workshops.service';

describe('WorkshopApplicationService', () => {
  let service: WorkshopApplicationService;
  let applicationRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const workshopId = '3f6c1d1e-6a3b-4c2f-9d10-7b4e2a9c5f81';
  let workshopsService: { findById: jest.Mock };
  let requirementRepo: { find: jest.Mock };

  /** Everything an admin needs to review, stored. */
  const details = (overrides: Partial<WorkshopView> = {}): WorkshopView =>
    ({
      id: workshopId,
      business_name: 'Sharma Auto Works',
      owner_name: 'Ramesh Sharma',
      email: 'sharma@autoworks.com',
      address: { name: 'Guru Nanak Pura' },
      images: [{ id: 'm1' }, { id: 'm2' }],
      document_requirements: [
        { key: 'aadhaar_card', min_images: 2, is_required: true },
        { key: 'pan_card', min_images: 1, is_required: true },
        { key: 'passport', min_images: 1, is_required: false },
      ],
      documents: [
        { id: 'a1', path: 'a1.png', document_key: 'aadhaar_card' },
        { id: 'a2', path: 'a2.png', document_key: 'aadhaar_card' },
        { id: 'p1', path: 'p1.png', document_key: 'pan_card' },
      ],
      working_hours: Array.from({ length: 7 }, () => ({})),
      agreements: {
        terms_of_service: true,
        commission_agreement: true,
        data_privacy_consent: true,
      },
      ...overrides,
    }) as unknown as WorkshopView;

  beforeEach(async () => {
    applicationRepo = {
      findOne: jest.fn(),
      create: jest.fn((v: WorkshopApplication) => v),
      save: jest.fn((v: WorkshopApplication) => Promise.resolve(v)),
    };
    workshopsService = { findById: jest.fn().mockResolvedValue(details()) };
    requirementRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopApplicationService,
        {
          provide: getRepositoryToken(WorkshopApplication),
          useValue: applicationRepo,
        },
        { provide: WorkshopsService, useValue: workshopsService },
        {
          provide: getRepositoryToken(WorkshopDocumentRequirement),
          useValue: requirementRepo,
        },
      ],
    }).compile();

    service = module.get<WorkshopApplicationService>(
      WorkshopApplicationService,
    );
  });

  describe('create', () => {
    it('starts an application when the workshop has none', async () => {
      applicationRepo.findOne.mockResolvedValue(null);

      const result = await service.create(workshopId);

      expect(applicationRepo.create).toHaveBeenCalledWith({
        workshop_id: workshopId,
        document_requirements: [],
      });
      expect(result.workshop_id).toBe(workshopId);
    });

    it('snapshots the active document requirements onto the new application', async () => {
      applicationRepo.findOne.mockResolvedValue(null);
      requirementRepo.find.mockResolvedValue([
        {
          id: 'r1',
          key: 'pan_card',
          name: 'PAN card',
          description: 'Photo of front & back',
          min_images: 1,
          max_images: 2,
          is_required: true,
          sort_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const result = await service.create(workshopId);

      expect(requirementRepo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { sort_order: 'ASC' },
      });
      expect(result.document_requirements).toEqual([
        {
          key: 'pan_card',
          name: 'PAN card',
          description: 'Photo of front & back',
          min_images: 1,
          max_images: 2,
          is_required: true,
          sort_order: 1,
        },
      ]);
    });

    it('returns the existing application instead of a second one', async () => {
      const existing = {
        id: 'app-1',
        workshop_id: workshopId,
        current_step: WorkshopApplicationStep.DOCUMENTS,
      } as WorkshopApplication;
      applicationRepo.findOne.mockResolvedValue(existing);

      await expect(service.create(workshopId)).resolves.toBe(existing);
      expect(applicationRepo.create).not.toHaveBeenCalled();
      expect(applicationRepo.save).not.toHaveBeenCalled();
    });

    it('surfaces an insert failure', async () => {
      applicationRepo.findOne.mockResolvedValue(null);
      applicationRepo.save.mockRejectedValue(new Error('connection lost'));

      await expect(service.create(workshopId)).rejects.toThrow(
        'connection lost',
      );
    });
  });

  describe('find', () => {
    it('returns the application', async () => {
      const application = {
        id: 'app-1',
        workshop_id: workshopId,
        status: WorkshopApplicationStatus.IN_PROGRESS,
      } as WorkshopApplication;
      applicationRepo.findOne.mockResolvedValue(application);

      await expect(service.find(workshopId)).resolves.toBe(application);
      expect(applicationRepo.findOne).toHaveBeenCalledWith({
        where: { workshop_id: workshopId },
      });
    });

    it('throws when the application has not been started', async () => {
      applicationRepo.findOne.mockResolvedValue(null);

      await expect(service.find(workshopId)).rejects.toThrow(
        RecordNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('applies the changed fields and saves', async () => {
      applicationRepo.findOne.mockResolvedValue({
        id: 'app-1',
        workshop_id: workshopId,
        current_step: WorkshopApplicationStep.BUSINESS_DETAILS,
      });

      const result = await service.update(workshopId, {
        current_step: WorkshopApplicationStep.DOCUMENTS,
      });

      expect(result.current_step).toBe(WorkshopApplicationStep.DOCUMENTS);
      expect(applicationRepo.save).toHaveBeenCalled();
    });

    it('marks a step complete', async () => {
      applicationRepo.findOne.mockResolvedValue({
        id: 'app-1',
        workshop_id: workshopId,
        current_step: WorkshopApplicationStep.BUSINESS_DETAILS,
        business_details_completed_at: null,
      });
      const completedAt = new Date('2026-10-12T10:00:00.000Z');

      const result = await service.update(workshopId, {
        business_details_completed_at: completedAt,
        current_step: WorkshopApplicationStep.SHOP_LOCATION,
      });

      expect(result.business_details_completed_at).toBe(completedAt);
      expect(result.current_step).toBe(WorkshopApplicationStep.SHOP_LOCATION);
    });

    // Sending null reopens a step the partner wants to redo.
    it('clears a completed step', async () => {
      applicationRepo.findOne.mockResolvedValue({
        id: 'app-1',
        workshop_id: workshopId,
        documents_completed_at: new Date('2026-10-12T10:00:00.000Z'),
      });

      const result = await service.update(workshopId, {
        documents_completed_at: null,
      });

      expect(result.documents_completed_at).toBeNull();
    });

    it('leaves fields the dto omits untouched', async () => {
      applicationRepo.findOne.mockResolvedValue({
        id: 'app-1',
        workshop_id: workshopId,
        current_step: WorkshopApplicationStep.SHOP_LOCATION,
        status: WorkshopApplicationStatus.IN_PROGRESS,
      });

      const result = await service.update(workshopId, {});

      expect(result.current_step).toBe(WorkshopApplicationStep.SHOP_LOCATION);
      expect(result.status).toBe(WorkshopApplicationStatus.IN_PROGRESS);
    });

    it('throws when there is no application to update', async () => {
      applicationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(workshopId, {
          current_step: WorkshopApplicationStep.DOCUMENTS,
        }),
      ).rejects.toThrow(RecordNotFoundException);
      expect(applicationRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    /** An application with every step completed. */
    const completed = (
      overrides: Partial<WorkshopApplication> = {},
    ): WorkshopApplication => {
      const now = new Date('2026-10-12T10:00:00.000Z');
      return {
        id: 'app-1',
        workshop_id: workshopId,
        status: WorkshopApplicationStatus.IN_PROGRESS,
        current_step: WorkshopApplicationStep.AGREEMENTS,
        business_details_completed_at: now,
        shop_location_completed_at: now,
        documents_completed_at: now,
        working_hours_completed_at: now,
        reviewed_at: now,
        agreements_accepted_at: now,
        submitted_at: null,
        approved_at: null,
        rejection_reason: null,
        ...overrides,
      } as WorkshopApplication;
    };

    it('does not need photos for a document that is not required', async () => {
      applicationRepo.findOne.mockResolvedValue(completed());

      await expect(service.submit(workshopId)).resolves.toMatchObject({
        status: WorkshopApplicationStatus.SUBMITTED,
      });
    });

    it('submits a completed application', async () => {
      applicationRepo.findOne.mockResolvedValue(completed());

      const result = await service.submit(workshopId);

      expect(result.status).toBe(WorkshopApplicationStatus.SUBMITTED);
      expect(result.submitted_at).toBeInstanceOf(Date);
      expect(applicationRepo.save).toHaveBeenCalled();
    });

    it('allows resubmission after a rejection and clears the reason', async () => {
      applicationRepo.findOne.mockResolvedValue(
        completed({
          status: WorkshopApplicationStatus.REJECTED,
          rejection_reason: 'Shop photos were unreadable',
        }),
      );

      const result = await service.submit(workshopId);

      expect(result.status).toBe(WorkshopApplicationStatus.SUBMITTED);
      expect(result.rejection_reason).toBeNull();
    });

    it.each([
      ['business_details', { business_details_completed_at: null }],
      ['shop_location', { shop_location_completed_at: null }],
      ['documents', { documents_completed_at: null }],
      ['working_hours', { working_hours_completed_at: null }],
      ['review', { reviewed_at: null }],
      ['agreements', { agreements_accepted_at: null }],
    ])('refuses to submit while %s is incomplete', async (_step, missing) => {
      applicationRepo.findOne.mockResolvedValue(completed(missing));

      await expect(service.submit(workshopId)).rejects.toThrow(
        InvalidRequestException,
      );
      expect(applicationRepo.save).not.toHaveBeenCalled();
    });

    it.each([
      ['the business name', { business_name: null }],
      ['the owner name', { owner_name: null }],
      ['the email', { email: null }],
      ['the address', { address: null }],
      ['a second shop photo', { images: [{ id: 'm1' }] }],
      [
        'enough photos of a required document',
        {
          documents: [
            { id: 'a1', path: 'a1.png', document_key: 'aadhaar_card' },
            { id: 'p1', path: 'p1.png', document_key: 'pan_card' },
          ],
        },
      ],
      ['a full week of hours', { working_hours: [] }],
      [
        'an accepted agreement',
        {
          agreements: {
            terms_of_service: true,
            commission_agreement: false,
            data_privacy_consent: true,
          },
        },
      ],
    ])(
      'refuses to submit without %s, even with every step marked done',
      async (_missing, overrides) => {
        applicationRepo.findOne.mockResolvedValue(completed());
        workshopsService.findById.mockResolvedValue(
          details(overrides as Partial<WorkshopView>),
        );

        await expect(service.submit(workshopId)).rejects.toThrow(
          InvalidRequestException,
        );
        expect(applicationRepo.save).not.toHaveBeenCalled();
      },
    );

    it('refuses a second submission', async () => {
      applicationRepo.findOne.mockResolvedValue(
        completed({ status: WorkshopApplicationStatus.SUBMITTED }),
      );

      await expect(service.submit(workshopId)).rejects.toThrow(
        RecordConflictException,
      );
      expect(applicationRepo.save).not.toHaveBeenCalled();
    });

    it('refuses to submit an approved application', async () => {
      applicationRepo.findOne.mockResolvedValue(
        completed({ status: WorkshopApplicationStatus.APPROVED }),
      );

      await expect(service.submit(workshopId)).rejects.toThrow(
        RecordConflictException,
      );
    });

    it('throws when there is no application', async () => {
      applicationRepo.findOne.mockResolvedValue(null);

      await expect(service.submit(workshopId)).rejects.toThrow(
        RecordNotFoundException,
      );
    });
  });
});
