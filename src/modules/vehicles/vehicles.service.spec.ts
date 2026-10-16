import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { EntityType, Media } from '@/internals/media/entity/media.entity';
import { MediaService } from '@/internals/media/services/media.service';
import { Vehicle } from './entities/vehicle.entity';
import { FuelType } from './types/vehicle.types';
import { VEHICLE_CATALOG } from './vehicle-catalog.constant';
import { VehiclesService } from './vehicles.service';
import { UploadedFileData } from '@/core/types/uploaded-file.types';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepo: jest.Mocked<
    Pick<Repository<Vehicle>, 'create' | 'save' | 'find'>
  >;
  let mediaService: jest.Mocked<
    Pick<
      MediaService,
      'findOwnedMany' | 'attachToEntity' | 'findByEntity' | 'upload'
    >
  >;

  const imageId = '0f6b1b3a-6a2f-4f1e-8f2c-1b9a1c2d3e4f';

  const dto = {
    vehicle_no: 'RJ22AD1234',
    brand: 'Maruti',
    model: 'Alto K10',
    fuel_type: FuelType.PETROL,
  };

  beforeEach(async () => {
    vehicleRepo = {
      create: jest.fn().mockImplementation((data) => data as Vehicle),
      save: jest
        .fn()
        .mockImplementation((v) => Promise.resolve({ id: 'v1', ...v })),
      find: jest.fn().mockResolvedValue([]),
    };
    mediaService = {
      findOwnedMany: jest.fn().mockResolvedValue([]),
      attachToEntity: jest.fn().mockResolvedValue(undefined),
      findByEntity: jest.fn().mockResolvedValue([]),
      upload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepo },
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

    it('attaches the photos to the saved vehicle', async () => {
      const image = { id: imageId } as Media;
      mediaService.findOwnedMany.mockResolvedValue([image]);

      const result = await service.create('u1', {
        ...dto,
        image_ids: [imageId],
      });

      expect(mediaService.attachToEntity).toHaveBeenCalledWith(
        [imageId],
        'v1',
        EntityType.VEHICLE,
      );
      expect(result.images).toEqual([image]);
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
        order: { created_at: 'DESC' },
      });
    });

    it('hands each vehicle its own photos', async () => {
      const vehicles = [{ id: 'v1' }, { id: 'v2' }] as Vehicle[];
      vehicleRepo.find.mockResolvedValue(vehicles);
      mediaService.findByEntity.mockResolvedValue([
        { id: 'm1', entity_id: 'v1' } as Media,
        { id: 'm2', entity_id: 'v2' } as Media,
        { id: 'm3', entity_id: 'v1' } as Media,
      ]);

      const result = await service.findMine('u1');

      expect(mediaService.findByEntity).toHaveBeenCalledWith(
        ['v1', 'v2'],
        EntityType.VEHICLE,
      );
      expect(result[0].images?.map((i) => i.id)).toEqual(['m1', 'm3']);
      expect(result[1].images?.map((i) => i.id)).toEqual(['m2']);
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

    it('leaves the photo unattached until a vehicle claims it', async () => {
      mediaService.upload.mockResolvedValue({ id: 'm1' } as Media);

      await service.uploadImage('u1', {} as UploadedFileData);

      expect(mediaService.attachToEntity).not.toHaveBeenCalled();
    });
  });
});
