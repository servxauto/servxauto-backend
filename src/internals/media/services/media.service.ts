import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntityTypeValue, Media } from '../entity/media.entity';
import { UploadedFileData } from '@/core/types/uploaded-file.types';
import { CreateMediaData } from '../media.types';
import { AwsS3Service } from './aws-s3.service';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  /** Records the row only after the upload succeeds, so no row points at a missing object. */
  async upload(
    file: UploadedFileData,
    data: Omit<CreateMediaData, 'name' | 'path' | 'mime' | 'size'>,
    dir?: string,
  ): Promise<Media> {
    const ext = file.originalname.split('.').pop() ?? '';
    const key = this.awsS3Service.getObjectKey(file.originalname, ext, dir);
    const path = await this.awsS3Service.upload(
      file.buffer,
      key,
      file.mimetype,
    );

    return this.mediaRepo.save(
      this.mediaRepo.create({
        ...data,
        name: file.originalname,
        path,
        mime: file.mimetype,
        size: file.size,
      }),
    );
  }

  /** Scoped to the uploader, so one user cannot reach another's files. */
  findOwned(id: string, userId: string): Promise<Media | null> {
    return this.mediaRepo.findOne({ where: { id, user_id: userId } });
  }

  /** Callers compare the length against `ids` to spot unknown or foreign ids. */
  findOwnedMany(ids: string[], userId: string): Promise<Media[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.mediaRepo.find({ where: { id: In(ids), user_id: userId } });
  }

  async attachToEntity(
    ids: string[],
    entityId: string,
    entityType: EntityTypeValue,
  ): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.mediaRepo.update(
      { id: In(ids) },
      { entity_id: entityId, entity_type: entityType },
    );
  }

  findByEntity(
    entityIds: string[],
    entityType: EntityTypeValue,
  ): Promise<Media[]> {
    if (entityIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.mediaRepo.find({
      where: { entity_id: In(entityIds), entity_type: entityType },
      order: { uploaded_at: 'ASC' },
    });
  }
}
