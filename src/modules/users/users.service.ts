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
import { EntityType } from '@/internals/media/types/media.types';
import { MediaService } from '@/internals/media/services/media.service';
import { UserUpdateMeDto } from './dto/update-me.dto';
import { User } from './entities/user.entity';
import { UploadedFileData } from '@/core/types/uploaded-file.types';

@Injectable()
export class UsersService {
  /** Postgres `unique_violation`. */
  private static readonly UNIQUE_VIOLATION = '23505';

  private static readonly AVATAR_DIR = 'avatars';

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mediaService: MediaService,
  ) {}

  async findById(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { avatar: true },
      select: { avatar: { id: true, path: true } },
    });
    if (!user) {
      throw new RecordNotFoundException(
        ErrorMessage.USER_NOT_FOUND,
        ErrorCode.USER_NOT_FOUND,
      );
    }
    return user;
  }

  async updateById(userId: string, dto: UserUpdateMeDto): Promise<User> {
    // Loaded without `avatar`: on save a loaded relation outranks `avatar_id`,
    // so a changed or cleared avatar would otherwise be silently kept.
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new RecordNotFoundException(
        ErrorMessage.USER_NOT_FOUND,
        ErrorCode.USER_NOT_FOUND,
      );
    }
    if (dto.avatar_id) {
      const media = await this.mediaService.findOwned(dto.avatar_id, userId);
      if (!media) {
        throw new RecordNotFoundException(
          ErrorMessage.MEDIA_NOT_FOUND,
          ErrorCode.MEDIA_NOT_FOUND,
        );
      }
    }
    Object.assign(user, dto);
    try {
      await this.userRepo.save(user);
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === UsersService.UNIQUE_VIOLATION
      ) {
        throw new RecordConflictException(
          ErrorMessage.EMAIL_ALREADY_IN_USE,
          ErrorCode.EMAIL_ALREADY_IN_USE,
          error,
        );
      }
      throw error;
    }
    // Re-read so the response carries the new avatar, and every field rather
    // than only those sent (unsent DTO fields are own `undefined` properties).
    return this.findById(userId);
  }

  /** Unlinked until `PATCH users/me` sends the id, so an abandoned upload never changes the profile. */
  uploadAvatar(userId: string, file: UploadedFileData): Promise<Media> {
    return this.mediaService.upload(
      file,
      { user_id: userId, entity_id: userId, entity_type: EntityType.USER },
      UsersService.AVATAR_DIR,
    );
  }
}
