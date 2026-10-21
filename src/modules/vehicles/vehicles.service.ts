import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindManyOptions,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import {
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { Media } from '@/internals/media/entity/media.entity';
import { MediaService } from '@/internals/media/services/media.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
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

  /** Loads what `parseToVehicleView` needs, photos in display order. */
  private static readonly VIEW_OPTIONS: FindManyOptions<Vehicle> = {
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
  };

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(VehicleImage)
    private readonly vehicleImageRepo: Repository<VehicleImage>,
    private readonly dataSource: DataSource,
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

    const images = await this.findOwnedImages(image_ids, userId);

    let vehicle: Vehicle;
    try {
      vehicle = await this.vehicleRepo.save(
        this.vehicleRepo.create({ ...data, user_id: userId }),
      );
    } catch (error: unknown) {
      this.rethrowConflict(error);
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
      ...VehiclesService.VIEW_OPTIONS,
    });
    return this.parseToVehicleView(...vehicles);
  }

  /**
   * Only the fields that were sent change. `image_ids`, when sent, replaces
   * the whole photo list; the old link rows go, their media rows stay.
   */
  async update(
    userId: string,
    vehicleId: string,
    dto: UpdateVehicleDto,
  ): Promise<VehicleView> {
    const { image_ids, ...fields } = dto;

    // Scoped to the owner, so another customer's vehicle is a 404 rather than a 403.
    const exists = await this.vehicleRepo.exists({
      where: { id: vehicleId, user_id: userId },
    });
    if (!exists) {
      throw new RecordNotFoundException(
        ErrorMessage.VEHICLE_NOT_FOUND,
        ErrorCode.VEHICLE_NOT_FOUND,
      );
    }
    if (image_ids) {
      await this.findOwnedImages(image_ids, userId);
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        if (Object.keys(fields).length > 0) {
          await manager.update(Vehicle, { id: vehicleId }, fields);
        }
        if (image_ids) {
          await manager.delete(VehicleImage, { vehicle_id: vehicleId });
          if (image_ids.length > 0) {
            await manager.insert(
              VehicleImage,
              image_ids.map((mediaId, position) => ({
                vehicle_id: vehicleId,
                media_id: mediaId,
                position,
              })),
            );
          }
        }
      });
    } catch (error: unknown) {
      this.rethrowConflict(error);
    }

    const vehicle = await this.vehicleRepo.findOneOrFail({
      where: { id: vehicleId },
      ...VehiclesService.VIEW_OPTIONS,
    });
    return this.parseToVehicleView(vehicle)[0];
  }

  /**
   * Soft delete: the row and its photos are kept, and the partial unique index
   * lets the same plate be added again. TypeORM only stamps rows that are not
   * already deleted, so a second delete is a 404.
   */
  async remove(userId: string, vehicleId: string): Promise<void> {
    const { affected } = await this.vehicleRepo.softDelete({
      id: vehicleId,
      user_id: userId,
    });
    if (!affected) {
      throw new RecordNotFoundException(
        ErrorMessage.VEHICLE_NOT_FOUND,
        ErrorCode.VEHICLE_NOT_FOUND,
      );
    }
  }

  async uploadImage(userId: string, file: UploadedFileData): Promise<Media> {
    return this.mediaService.upload(
      file,
      { user_id: userId },
      VehiclesService.IMAGE_DIR,
    );
  }

  /** 404s unless every id is a photo this customer uploaded. */
  private async findOwnedImages(
    imageIds: string[],
    userId: string,
  ): Promise<Media[]> {
    const images = await this.mediaService.findOwnedMany(imageIds, userId);
    if (images.length !== imageIds.length) {
      throw new RecordNotFoundException(
        ErrorMessage.MEDIA_NOT_FOUND,
        ErrorCode.MEDIA_NOT_FOUND,
      );
    }
    return images;
  }

  /** The partial unique index on (user_id, vehicle_no) becomes a 409; anything else is rethrown. */
  private rethrowConflict(error: unknown): never {
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
