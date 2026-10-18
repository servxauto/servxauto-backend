import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import {
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { Media } from '@/internals/media/entity/media.entity';
import { MediaService } from '@/internals/media/services/media.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleLookupDto } from './dto/vehicle-lookup.dto';
import { VehicleImage } from './entities/vehicle-image.entity';
import { Vehicle } from './entities/vehicle.entity';
import type { VehicleLookupView, VehicleView } from './types/vehicles.types';
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
    @InjectRepository(VehicleImage)
    private readonly vehicleImageRepo: Repository<VehicleImage>,
    private readonly mediaService: MediaService,
  ) {}

  /**
   * TODO: replace the catalog pick with the registration-details provider.
   * Until then the result is derived from the number itself, so the same
   * number always answers the same way and a client can be built against it.
   */
  lookup({ vehicle_no }: VehicleLookupDto): VehicleLookupView {
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

  async create(userId: string, dto: CreateVehicleDto): Promise<VehicleView> {
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

    // `findOwnedMany` does not preserve order; `image_ids` does, so it sets `position`.
    const byId = new Map(images.map((image) => [image.id, image]));
    await this.vehicleImageRepo.save(
      image_ids.map((mediaId, position) =>
        this.vehicleImageRepo.create({
          vehicle_id: vehicle.id,
          media_id: mediaId,
          position,
        }),
      ),
    );

    return {
      ...vehicle,
      images: image_ids.map((id, position) => {
        const { path } = byId.get(id)!;
        return { id, path, position };
      }),
    };
  }

  async findMine(userId: string): Promise<VehicleView[]> {
    const vehicles = await this.vehicleRepo.find({
      where: { user_id: userId },
      order: {
        created_at: 'DESC',
        images: { position: 'ASC' },
      },
      relations: { images: { media: true } },
      select: {
        images: {
          id: true,
          position: true,
          media: { id: true, path: true },
        },
      },
    });
    return this.parseToVehicleView(...vehicles);
  }

  async uploadImage(userId: string, file: UploadedFileData): Promise<Media> {
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

  private parseToVehicleView(...vehicles: Vehicle[]): VehicleView[] {
    return vehicles.map(({ images = [], ...vehicle }) => ({
      ...vehicle,
      images: images.map(({ position, media }) => ({
        id: media.id,
        path: media.path,
        position,
      })),
    }));
  }
}
