import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import {
  ErrorCode,
  ErrorCodeType,
} from '@/common/constants/error-codes.constant';
import {
  AppHttpException,
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { Media } from '@/internals/media/entity/media.entity';
import { MediaService } from '@/internals/media/services/media.service';
import { VehicleImage } from './entities/vehicle-image.entity';
import { Vehicle } from './entities/vehicle.entity';
import { FuelType } from './types/vehicles.types';
import { VEHICLE_CATALOG } from './vehicle-catalog.constant';
import { VehiclesService } from './vehicles.service';
import { UploadedFileData } from '@/core/types/uploaded-file.types';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepo: jest.Mocked<
    Pick<
      Repository<Vehicle>,
      'create' | 'save' | 'find' | 'exists' | 'findOneOrFail' | 'softDelete'
    >
  >;
  let vehicleImageRepo: jest.Mocked<
    Pick<Repository<VehicleImage>, 'create' | 'save'>
  >;
  let manager: { update: jest.Mock; delete: jest.Mock; insert: jest.Mock };
  let mediaService: jest.Mocked<Pick<MediaService, 'findOwnedMany' | 'upload'>>;

  const imageId = '0f6b1b3a-6a2f-4f1e-8f2c-1b9a1c2d3e4f';
  const vehicleId = '5c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f';

  const dto = {
    vehicle_no: 'RJ22AD1234',
    brand: 'Maruti',
    model: 'Alto K10',
    fuel_type: FuelType.PETROL,
  };

  /** Checks the class and the `error_code` the client sees. */
  async function expectAppError(
    promise: Promise<unknown>,
    type: abstract new (...args: never[]) => AppHttpException,
    errorCode: ErrorCodeType,
  ): Promise<void> {
    const error: unknown = await promise.then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(type);
    expect((error as AppHttpException).getResponse()).toMatchObject({
      error_code: errorCode,
    });
  }

  beforeEach(async () => {
    vehicleRepo = {
      create: jest.fn().mockImplementation((data) => data as Vehicle),
      save: jest
        .fn()
        .mockImplementation((v) => Promise.resolve({ id: 'v1', ...v })),
      find: jest.fn().mockResolvedValue([]),
      exists: jest.fn().mockResolvedValue(true),
      findOneOrFail: jest.fn().mockResolvedValue({ id: vehicleId, images: [] }),
      softDelete: jest.fn(),
    };
    vehicleImageRepo = {
      create: jest.fn().mockImplementation((data) => data as VehicleImage),
      save: jest.fn().mockImplementation((rows) => Promise.resolve(rows)),
    };
    manager = { update: jest.fn(), delete: jest.fn(), insert: jest.fn() };
    const dataSource = {
      transaction: jest.fn((run: (m: typeof manager) => Promise<unknown>) =>
        run(manager),
      ),
    };
    mediaService = {
      findOwnedMany: jest.fn().mockResolvedValue([]),
      upload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepo },
        {
          provide: getRepositoryToken(VehicleImage),
          useValue: vehicleImageRepo,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: MediaService, useValue: mediaService },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('lookup', () => {
    it('echoes back the number it was asked about', () => {
      expect(service.lookup({ vehicle_no: 'MH12AB1234' })).toMatchObject({
        vehicle_no: 'MH12AB1234',
      });
    });

    it('answers the same way every time for the same number', () => {
      const first = service.lookup({ vehicle_no: 'DL8CAF5055' });
      const second = service.lookup({ vehicle_no: 'DL8CAF5055' });

      expect(first).toEqual(second);
    });

    it('returns a brand / model / fuel combination that exists in the catalog', () => {
      const numbers = ['MH12AB1234', 'KA05MN9087', 'TN22BC4455', '22BH1234AA'];

      for (const vehicle_no of numbers) {
        const result = service.lookup({ vehicle_no });

        const brand = VEHICLE_CATALOG.find((b) => b.name === result.brand);
        expect(brand).toBeDefined();

        const model = brand?.models.find((m) => m.name === result.model);
        expect(model).toBeDefined();
        expect(model?.fuel_types).toContain(result.fuel_type);
      }
    });

    it('only ever reports a known fuel type', () => {
      const fuelTypes: string[] = Object.values(FuelType);

      expect(fuelTypes).toContain(
        service.lookup({ vehicle_no: 'GJ01HH5566' }).fuel_type,
      );
    });
  });

  describe('create', () => {
    it('saves the vehicle against the signed-in customer', async () => {
      const result = await service.create('u1', dto);

      expect(vehicleRepo.create).toHaveBeenCalledWith({
        ...dto,
        user_id: 'u1',
      });
      expect(result.id).toBe('v1');
    });

    it('links the photos to the saved vehicle in the order they were sent', async () => {
      const other = 'aaaaaaaa-6a2f-4f1e-8f2c-1b9a1c2d3e4f';
      mediaService.findOwnedMany.mockResolvedValue([
        { id: imageId, path: 'a.png' } as Media,
        { id: other, path: 'b.png' } as Media,
      ]);

      const result = await service.create('u1', {
        ...dto,
        image_ids: [other, imageId],
      });

      expect(vehicleImageRepo.save).toHaveBeenCalledWith([
        { vehicle_id: 'v1', media_id: other, position: 0 },
        { vehicle_id: 'v1', media_id: imageId, position: 1 },
      ]);
      expect(result.images).toEqual([
        { id: other, path: 'b.png', position: 0 },
        { id: imageId, path: 'a.png', position: 1 },
      ]);
    });

    it('refuses photos that are not the uploader’s', async () => {
      mediaService.findOwnedMany.mockResolvedValue([]);

      await expect(
        service.create('u1', { ...dto, image_ids: [imageId] }),
      ).rejects.toThrow(RecordNotFoundException);
      expect(vehicleRepo.save).not.toHaveBeenCalled();
    });

    it('reports a plate already in the garage as a conflict', async () => {
      vehicleRepo.save.mockRejectedValue(
        new QueryFailedError('insert', [], {
          code: '23505',
        } as unknown as Error),
      );

      await expect(service.create('u1', dto)).rejects.toThrow(
        RecordConflictException,
      );
    });

    it('lets an unrelated database error through', async () => {
      vehicleRepo.save.mockRejectedValue(new Error('connection lost'));

      await expect(service.create('u1', dto)).rejects.toThrow(
        'connection lost',
      );
    });
  });

  describe('findMine', () => {
    it('only asks for the signed-in customer’s vehicles, newest first', async () => {
      await service.findMine('u1');

      expect(vehicleRepo.find).toHaveBeenCalledWith({
        where: { user_id: 'u1' },
        order: { created_at: 'DESC', images: { position: 'ASC' } },
        relations: { images: { media: true } },
        // `images.id` must be selected, or TypeORM cannot build the link rows.
        select: {
          images: {
            id: true,
            position: true,
            media: { id: true, path: true },
          },
        },
      });
    });

    it('reduces each photo to its media id, path and position', async () => {
      vehicleRepo.find.mockResolvedValue([
        {
          id: 'v1',
          images: [
            { position: 0, media: { id: 'm1', path: 'a.png', user_id: 'u1' } },
            { position: 1, media: { id: 'm2', path: 'b.png', user_id: 'u1' } },
          ],
        },
        { id: 'v2' },
      ] as unknown as Vehicle[]);

      const result = await service.findMine('u1');

      expect(result[0].images).toEqual([
        { id: 'm1', path: 'a.png', position: 0 },
        { id: 'm2', path: 'b.png', position: 1 },
      ]);
      expect(result[1].images).toEqual([]);
    });
  });

  describe('update', () => {
    it('404s for a vehicle outside the signed-in customer’s garage', async () => {
      vehicleRepo.exists.mockResolvedValue(false);

      await expectAppError(
        service.update('u1', vehicleId, { brand: 'Tata' }),
        RecordNotFoundException,
        ErrorCode.VEHICLE_NOT_FOUND,
      );
      expect(vehicleRepo.exists).toHaveBeenCalledWith({
        where: { id: vehicleId, user_id: 'u1' },
      });
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('changes only the fields that were sent and leaves the photos alone', async () => {
      await service.update('u1', vehicleId, { brand: 'Tata', model: 'Punch' });

      expect(manager.update).toHaveBeenCalledWith(
        Vehicle,
        { id: vehicleId },
        { brand: 'Tata', model: 'Punch' },
      );
      expect(manager.delete).not.toHaveBeenCalled();
      expect(mediaService.findOwnedMany).not.toHaveBeenCalled();
    });

    it('replaces the photo list in the order it was sent', async () => {
      const other = 'aaaaaaaa-6a2f-4f1e-8f2c-1b9a1c2d3e4f';
      mediaService.findOwnedMany.mockResolvedValue([
        { id: imageId } as Media,
        { id: other } as Media,
      ]);

      await service.update('u1', vehicleId, { image_ids: [other, imageId] });

      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.delete).toHaveBeenCalledWith(VehicleImage, {
        vehicle_id: vehicleId,
      });
      expect(manager.insert).toHaveBeenCalledWith(VehicleImage, [
        { vehicle_id: vehicleId, media_id: other, position: 0 },
        { vehicle_id: vehicleId, media_id: imageId, position: 1 },
      ]);
    });

    it('removes every photo when sent an empty list', async () => {
      await service.update('u1', vehicleId, { image_ids: [] });

      expect(manager.delete).toHaveBeenCalledWith(VehicleImage, {
        vehicle_id: vehicleId,
      });
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('refuses photos that are not the uploader’s', async () => {
      mediaService.findOwnedMany.mockResolvedValue([]);

      await expectAppError(
        service.update('u1', vehicleId, { image_ids: [imageId] }),
        RecordNotFoundException,
        ErrorCode.MEDIA_NOT_FOUND,
      );
      expect(manager.delete).not.toHaveBeenCalled();
    });

    it('reports a plate already in the garage as a conflict', async () => {
      manager.update.mockRejectedValue(
        new QueryFailedError('update', [], {
          code: '23505',
        } as unknown as Error),
      );

      await expectAppError(
        service.update('u1', vehicleId, { vehicle_no: 'RJ22AD1234' }),
        RecordConflictException,
        ErrorCode.VEHICLE_ALREADY_ADDED,
      );
    });

    it('returns the vehicle as it now is, photos reduced to id, path and position', async () => {
      vehicleRepo.findOneOrFail.mockResolvedValue({
        id: vehicleId,
        brand: 'Tata',
        images: [
          { position: 0, media: { id: 'm1', path: 'a.png', user_id: 'u1' } },
        ],
      } as unknown as Vehicle);

      const result = await service.update('u1', vehicleId, { brand: 'Tata' });

      expect(result).toEqual({
        id: vehicleId,
        brand: 'Tata',
        images: [{ id: 'm1', path: 'a.png', position: 0 }],
      });
    });
  });

  describe('remove', () => {
    it('soft deletes the vehicle, scoped to the signed-in customer', async () => {
      vehicleRepo.softDelete.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      await expect(service.remove('u1', vehicleId)).resolves.toBeUndefined();
      expect(vehicleRepo.softDelete).toHaveBeenCalledWith({
        id: vehicleId,
        user_id: 'u1',
      });
    });

    it('404s when nothing matched: someone else’s, missing or already deleted', async () => {
      vehicleRepo.softDelete.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      });

      await expectAppError(
        service.remove('u1', vehicleId),
        RecordNotFoundException,
        ErrorCode.VEHICLE_NOT_FOUND,
      );
    });
  });

  describe('uploadImage', () => {
    it('stores the photo under the vehicles folder, owned by the uploader', async () => {
      const media = { id: 'm1' } as Media;
      mediaService.upload.mockResolvedValue(media);

      const file = {
        originalname: 'car.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('x'),
      } as UploadedFileData;

      await expect(service.uploadImage('u1', file)).resolves.toBe(media);
      expect(mediaService.upload).toHaveBeenCalledWith(
        file,
        { user_id: 'u1' },
        'vehicles',
      );
    });
  });
});
