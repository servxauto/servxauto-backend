import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import {
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { EntityType, Media } from '@/internals/media/entity/media.entity';
import { MediaService } from '@/internals/media/services/media.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleLookupDto } from './dto/vehicle-lookup.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleLookupResult } from './types/vehicle.types';
import { VEHICLE_CATALOG } from './vehicle-catalog.constant';
import { UploadedFileData } from '@/core/types/uploaded-file.types';

@Injectable()
export class VehiclesService {
  /** Postgres `unique_violation`. */
  private static readonly UNIQUE_VIOLATION = '23505';

  private static readonly IMAGE_DIR = 'vehicles';

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly mediaService: MediaService,
  ) {}

  /**
   * TODO: replace the catalog pick with the registration-details provider.
   * Until then the result is derived from the number itself, so the same
   * number always answers the same way and a client can be built against it.
   */
  lookup({ vehicle_no }: VehicleLookupDto): VehicleLookupResult {
    const seed = this.seedOf(vehicle_no);

    const brand = VEHICLE_CATALOG[seed % VEHICLE_CATALOG.length];
    const model = brand.models[(seed >>> 5) % brand.models.length];
    const fuel_type = model.fuel_types[(seed >>> 11) % model.fuel_types.length];

    return {
      vehicle_no,
      brand: brand.name,
      model: model.name,
      fuel_type,
    };
  }

  async create(userId: string, dto: CreateVehicleDto): Promise<Vehicle> {
    const { image_ids = [], ...data } = dto;

    const images = await this.mediaService.findOwnedMany(image_ids, userId);
    if (images.length !== image_ids.length) {
      throw new RecordNotFoundException(
        ErrorMessage.MEDIA_NOT_FOUND,
        ErrorCode.MEDIA_NOT_FOUND,
      );
    }

    let vehicle: Vehicle;
    try {
      vehicle = await this.vehicleRepo.save(
        this.vehicleRepo.create({ ...data, user_id: userId }),
      );
    } catch (error: unknown) {
      // The partial unique index on (user_id, vehicle_no) lands here.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code ===
          VehiclesService.UNIQUE_VIOLATION
      ) {
        throw new RecordConflictException(
          ErrorMessage.VEHICLE_ALREADY_ADDED,
          ErrorCode.VEHICLE_ALREADY_ADDED,
          error,
        );
      }
      throw error;
    }

    await this.mediaService.attachToEntity(
      image_ids,
      vehicle.id,
      EntityType.VEHICLE,
    );

    vehicle.images = images.map(({ id, path }) => ({ id, path }));
    return vehicle;
  }

  async findMine(userId: string): Promise<Vehicle[]> {
    const vehicles = await this.vehicleRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    // `images` cannot be a TypeORM relation: `media` points back through
    // `entity_id` + `entity_type` with no foreign key. One query for the whole
    // page's photos, then hand each vehicle its own.
    const images = await this.mediaService.findByEntity(
      vehicles.map((vehicle) => vehicle.id),
      EntityType.VEHICLE,
    );

    for (const vehicle of vehicles) {
      vehicle.images = images
        .filter((image) => image.entity_id === vehicle.id)
        .map(({ id, path }) => ({ id, path }));
    }

    return vehicles;
  }

  /** Unattached until its id is sent as `image_ids` on `POST users/me/vehicles`. */
  uploadImage(userId: string, file: UploadedFileData): Promise<Media> {
    return this.mediaService.upload(
      file,
      { user_id: userId },
      VehiclesService.IMAGE_DIR,
    );
  }

  /** djb2 — a cheap, stable spread over the catalog. */
  private seedOf(value: string): number {
    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 33) ^ value.charCodeAt(i);
    }
    return hash >>> 0;
  }
}
