import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import {
  InvalidRequestException,
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { Media } from '@/internals/media/entity/media.entity';
import { MediaService } from '@/internals/media/services/media.service';
import type { UploadedFileData } from '@/core/types/uploaded-file.types';
import { WorkshopWorkingHourDto } from '../dto/workshop-working-hour.dto';
import { WorkshopAddress } from '../entities/workshop-address.entity';
import { WorkshopAgreement } from '../entities/workshop-agreement.entity';
import { WorkshopApplication } from '../entities/workshop-application.entity';
import { WorkshopDocument } from '../entities/workshop-document.entity';
import { WorkshopImage } from '../entities/workshop-image.entity';
import { WorkshopWorkingHour } from '../entities/workshop-working-hour.entity';
import { Workshop } from '../entities/workshop.entity';
import {
  WORKSHOP_AGREEMENT_VERSIONS,
  WeekDay,
  WorkshopApplicationStatus,
} from '../types/workshops.types';
import type { WorkshopDocumentRequirementSnapshot } from '../types/workshops.types';
import { WorkshopsService } from './workshops.service';

describe('WorkshopsService', () => {
  let service: WorkshopsService;
  let workshopRepo: jest.Mocked<Pick<Repository<Workshop>, 'findOne'>>;
  let applicationRepo: jest.Mocked<
    Pick<Repository<WorkshopApplication>, 'findOne'>
  >;
  let mediaService: jest.Mocked<
    Pick<MediaService, 'upload' | 'findUnclaimedMany'>
  >;
  let linkExists: jest.Mock;
  let manager: {
    update: jest.Mock;
    delete: jest.Mock;
    insert: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let insertOrIgnore: { values: jest.Mock; execute: jest.Mock };

  const workshopId = 's1';
  const imageA = '0f6b1b3a-6a2f-4f1e-8f2c-1b9a1c2d3e4f';
  const imageB = '1f6b1b3a-6a2f-4f1e-8f2c-1b9a1c2d3e4f';

  const stored = (overrides: Partial<Workshop> = {}) =>
    ({
      id: workshopId,
      phone_no: '+919876543210',
      email: null,
      business_name: null,
      owner_name: null,
      gst_no: null,
      address: null,
      images: [],
      documents: [],
      working_hours: [],
      agreements: [],
      ...overrides,
    }) as unknown as Workshop;

  const requirements: WorkshopDocumentRequirementSnapshot[] = [
    {
      key: 'aadhaar_card',
      name: 'Aadhaar card',
      description: 'Photo of front & back',
      min_images: 1,
      max_images: 2,
      is_required: true,
      sort_order: 1,
    },
    {
      key: 'pan_card',
      name: 'PAN card',
      description: null,
      min_images: 1,
      max_images: 1,
      is_required: true,
      sort_order: 2,
    },
  ];

  const week = (): WorkshopWorkingHourDto[] =>
    Object.values(WeekDay).map((day) => ({
      day,
      is_open: day !== WeekDay.SUN,
      opens_at: '09:00',
      closes_at: '20:00',
    }));

  beforeEach(async () => {
    workshopRepo = { findOne: jest.fn().mockResolvedValue(stored()) };
    applicationRepo = {
      findOne: jest.fn().mockResolvedValue({
        status: WorkshopApplicationStatus.IN_PROGRESS,
        document_requirements: requirements,
      }),
    };
    mediaService = {
      upload: jest.fn(),
      findUnclaimedMany: jest
        .fn()
        .mockImplementation((ids: string[]) =>
          Promise.resolve(ids.map((id) => ({ id }) as Media)),
        ),
    };
    linkExists = jest.fn().mockResolvedValue(false);
    insertOrIgnore = {
      values: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    manager = {
      update: jest.fn(),
      delete: jest.fn(),
      insert: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        insert: () => ({
          into: () => ({
            values: (v: unknown) => {
              insertOrIgnore.values(v);
              return { orIgnore: () => insertOrIgnore };
            },
          }),
        }),
      })),
    };
    const dataSource = {
      transaction: jest.fn((run: (m: typeof manager) => Promise<unknown>) =>
        run(manager),
      ),
      getRepository: jest.fn(() => ({ exists: linkExists })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopsService,
        { provide: getRepositoryToken(Workshop), useValue: workshopRepo },
        {
          provide: getRepositoryToken(WorkshopApplication),
          useValue: applicationRepo,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: MediaService, useValue: mediaService },
      ],
    }).compile();

    service = module.get<WorkshopsService>(WorkshopsService);
  });

  describe('findById', () => {
    it('404s when the account is gone', async () => {
      workshopRepo.findOne.mockResolvedValue(null);

      await expect(service.findById(workshopId)).rejects.toThrow(
        RecordNotFoundException,
      );
    });

    it('reduces photos to id and path, and lists the week Monday first', async () => {
      workshopRepo.findOne.mockResolvedValue(
        stored({
          images: [
            { position: 0, media: { id: 'm1', path: 'a.png', size: 1 } },
          ],
          documents: [
            {
              document_key: 'pan_card',
              sort_order: 0,
              media: { id: 'm2', path: 'b.png' },
            },
          ],
          working_hours: [
            { day: 'sun', is_open: false, opens_at: null, closes_at: null },
            {
              day: 'mon',
              is_open: true,
              opens_at: '09:00:00',
              closes_at: '20:00:00',
            },
          ],
        } as unknown as Partial<Workshop>),
      );

      const view = await service.findById(workshopId);

      expect(view.images).toEqual([{ id: 'm1', path: 'a.png', position: 0 }]);
      expect(view.documents).toEqual([
        { id: 'm2', path: 'b.png', document_key: 'pan_card', sort_order: 0 },
      ]);
      expect(view.document_requirements).toBe(requirements);
      expect(view.working_hours).toEqual([
        { day: 'mon', is_open: true, opens_at: '09:00', closes_at: '20:00' },
        { day: 'sun', is_open: false, opens_at: null, closes_at: null },
      ]);
    });

    it('only counts agreements accepted at their current version', async () => {
      workshopRepo.findOne.mockResolvedValue(
        stored({
          agreements: [
            {
              type: 'terms_of_service',
              version: WORKSHOP_AGREEMENT_VERSIONS.terms_of_service,
            },
            { type: 'commission_agreement', version: '2020-01-01' },
          ],
        } as unknown as Partial<Workshop>),
      );

      const view = await service.findById(workshopId);

      expect(view.agreements).toEqual({
        terms_of_service: true,
        commission_agreement: false,
        data_privacy_consent: false,
      });
    });
  });

  describe('updateById', () => {
    it('updates only the plain fields that were sent', async () => {
      await service.updateById(workshopId, { business_name: 'Speed Motors' });

      expect(manager.update).toHaveBeenCalledWith(
        Workshop,
        { id: workshopId },
        { business_name: 'Speed Motors' },
      );
      expect(manager.delete).not.toHaveBeenCalled();
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('replaces the address, clearing optional fields that were left out', async () => {
      const address = {
        name: 'Guru Nanak Pura',
        formatted_address: 'Guru Nanak Pura, Jaipur',
        latitude: 26.9,
        longitude: 75.8,
        shop_no: 'Shop 4',
      };

      await service.updateById(workshopId, { address });

      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.delete).toHaveBeenCalledWith(WorkshopAddress, {
        workshop_id: workshopId,
      });
      expect(manager.insert).toHaveBeenCalledWith(WorkshopAddress, {
        ...address,
        landmark: null,
        city: null,
        state: null,
        postal_code: null,
        country: null,
        workshop_id: workshopId,
      });
    });

    it('replaces the shop photos in the order they were sent', async () => {
      await service.updateById(workshopId, { image_ids: [imageB, imageA] });

      expect(manager.delete).toHaveBeenCalledWith(WorkshopImage, {
        workshop_id: workshopId,
      });
      expect(manager.insert).toHaveBeenCalledWith(WorkshopImage, [
        { workshop_id: workshopId, media_id: imageB, position: 0 },
        { workshop_id: workshopId, media_id: imageA, position: 1 },
      ]);
    });

    it('files the photos under their key in the order sent, replacing only that key', async () => {
      await service.updateById(workshopId, {
        documents: { aadhaar_card: [imageB, imageA] },
      });

      expect(manager.delete).toHaveBeenCalledWith(WorkshopDocument, {
        workshop_id: workshopId,
        document_key: In(['aadhaar_card']),
      });
      // A photo filed under another key moves rather than tripping the unique index.
      expect(manager.delete).toHaveBeenCalledWith(WorkshopDocument, {
        workshop_id: workshopId,
        media_id: In([imageB, imageA]),
      });
      expect(manager.insert).toHaveBeenCalledWith(WorkshopDocument, [
        {
          workshop_id: workshopId,
          media_id: imageB,
          document_key: 'aadhaar_card',
          sort_order: 0,
        },
        {
          workshop_id: workshopId,
          media_id: imageA,
          document_key: 'aadhaar_card',
          sort_order: 1,
        },
      ]);
    });

    it.each([
      ['a key the application does not ask for', { passport: [imageA] }],
      [
        'more photos than the requirement allows',
        { pan_card: [imageA, imageB] },
      ],
      ['fewer photos than the requirement needs', { aadhaar_card: [] }],
      ['a value that is not a list', { pan_card: imageA }],
      ['an id that is not a UUID', { pan_card: ['nope'] }],
      [
        'the same photo under two keys',
        { aadhaar_card: [imageA], pan_card: [imageA] },
      ],
    ])('rejects documents with %s', async (_case, documents) => {
      await expect(
        service.updateById(workshopId, {
          documents: documents as unknown as Record<string, string[]>,
        }),
      ).rejects.toThrow(InvalidRequestException);
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('stores a closed day without times', async () => {
      await service.updateById(workshopId, { working_hours: week() });

      const rows = (
        manager.insert.mock.calls.find(
          ([entity]) => entity === WorkshopWorkingHour,
        ) as [unknown, { day: string; opens_at: string | null }[]]
      )[1];
      expect(rows).toHaveLength(7);
      expect(rows.find((r) => r.day === 'sun')?.opens_at).toBeNull();
      expect(rows.find((r) => r.day === 'mon')?.opens_at).toBe('09:00');
    });

    it('rejects an open day that closes before it opens', async () => {
      const hours = week();
      hours[0] = { ...hours[0], opens_at: '20:00', closes_at: '09:00' };

      await expect(
        service.updateById(workshopId, { working_hours: hours }),
      ).rejects.toThrow(InvalidRequestException);
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('accepts an agreement at its current version, and withdraws one sent as false', async () => {
      await service.updateById(workshopId, {
        agreements: { terms_of_service: true, data_privacy_consent: false },
      });

      expect(insertOrIgnore.values).toHaveBeenCalledWith({
        workshop_id: workshopId,
        type: 'terms_of_service',
        version: WORKSHOP_AGREEMENT_VERSIONS.terms_of_service,
      });
      expect(manager.delete).toHaveBeenCalledWith(WorkshopAgreement, {
        workshop_id: workshopId,
        type: 'data_privacy_consent',
        version: WORKSHOP_AGREEMENT_VERSIONS.data_privacy_consent,
      });
    });

    it('404s on an upload that is not a workshop upload', async () => {
      mediaService.findUnclaimedMany.mockResolvedValue([]);

      await expect(
        service.updateById(workshopId, { image_ids: [imageA] }),
      ).rejects.toThrow(RecordNotFoundException);
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('404s on an upload another workshop already linked', async () => {
      linkExists.mockResolvedValue(true);

      await expect(
        service.updateById(workshopId, { image_ids: [imageA] }),
      ).rejects.toThrow(RecordNotFoundException);
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it.each([
      WorkshopApplicationStatus.SUBMITTED,
      WorkshopApplicationStatus.APPROVED,
    ])('refuses changes while the application is %s', async (status) => {
      applicationRepo.findOne.mockResolvedValue({
        status,
      } as WorkshopApplication);

      await expect(
        service.updateById(workshopId, { business_name: 'X Motors' }),
      ).rejects.toThrow(RecordConflictException);
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('reports an email taken by another workshop as a conflict', async () => {
      manager.update.mockRejectedValue(
        new QueryFailedError('update', [], {
          code: '23505',
          constraint: 'UQ_workshops_email',
        } as unknown as Error),
      );

      await expect(
        service.updateById(workshopId, { email: 'taken@garage.in' }),
      ).rejects.toThrow(RecordConflictException);
    });

    it('does not report another unique violation as an email conflict', async () => {
      const error = new QueryFailedError('insert', [], {
        code: '23505',
        constraint: 'UQ_workshop_images_workshop_id_media_id',
      } as unknown as Error);
      manager.update.mockRejectedValue(error);

      await expect(
        service.updateById(workshopId, { business_name: 'X Motors' }),
      ).rejects.toBe(error);
    });

    it('lets an unrelated database error through', async () => {
      manager.update.mockRejectedValue(new Error('connection lost'));

      await expect(
        service.updateById(workshopId, { business_name: 'X Motors' }),
      ).rejects.toThrow('connection lost');
    });
  });

  describe('uploadImage', () => {
    it('stores the photo under the workshops folder with no customer owner', async () => {
      const media = { id: 'm1' } as Media;
      mediaService.upload.mockResolvedValue(media);
      const file = {
        originalname: 'shop.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('x'),
      } as UploadedFileData;

      await expect(service.uploadImage(file)).resolves.toBe(media);
      expect(mediaService.upload).toHaveBeenCalledWith(
        file,
        { user_id: null },
        'workshops',
      );
    });
  });
});
