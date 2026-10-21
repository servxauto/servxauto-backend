import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  RecordConflictException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { Media } from '@/internals/media/entity/media.entity';
import { EntityType } from '@/internals/media/types/media.types';
import { MediaService } from '@/internals/media/services/media.service';
import { User } from './entities/user.entity';
import { Gender } from './types/users.types';
import { UsersService } from './users.service';
import { UploadedFileData } from '@/core/types/uploaded-file.types';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save'>>;
  let mediaService: jest.Mocked<Pick<MediaService, 'upload' | 'findOwned'>>;

  const phone_no = '+919876543210';
  const avatarId = '0f6b1b3a-6a2f-4f1e-8f2c-1b9a1c2d3e4f';

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), save: jest.fn() };
    mediaService = { upload: jest.fn(), findOwned: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: MediaService, useValue: mediaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('returns the account the token points at', async () => {
      const user = { id: 'u1', phone_no } as User;
      userRepo.findOne.mockResolvedValue(user);

      await expect(service.findById('u1')).resolves.toBe(user);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'u1' },
        relations: { avatar: true },
        select: { avatar: { id: true, path: true } },
      });
    });

    it('404s when the account is gone', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('u1')).rejects.toThrow(
        RecordNotFoundException,
      );
    });
  });

  describe('updateById', () => {
    it('applies only the fields that were sent', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        phone_no,
        name: null,
        email: null,
        gender: null,
      } as User);
      userRepo.save.mockImplementation((user) => Promise.resolve(user as User));

      const result = await service.updateById('u1', {
        name: 'Gokul',
        gender: Gender.MALE,
      });

      expect(result.name).toBe('Gokul');
      expect(result.gender).toBe(Gender.MALE);
      expect(result.email).toBeNull();
      expect(result.phone_no).toBe(phone_no);
    });

    it('links an avatar the user uploaded', async () => {
      const media = { id: avatarId, path: 'https://cdn.test/a.png' } as Media;
      userRepo.findOne.mockResolvedValue({ id: 'u1', phone_no } as User);
      mediaService.findOwned.mockResolvedValue(media);
      userRepo.save.mockImplementation((user) => Promise.resolve(user as User));

      const result = await service.updateById('u1', { avatar_id: avatarId });

      expect(result.avatar_id).toBe(avatarId);
      expect(mediaService.findOwned).toHaveBeenCalledWith(avatarId, 'u1');
    });

    it('replaces an existing avatar and returns the re-read account', async () => {
      const reread = {
        id: 'u1',
        avatar_id: avatarId,
        avatar: { id: avatarId, path: 'https://cdn.test/a.png' },
      } as User;
      userRepo.findOne
        .mockResolvedValueOnce({ id: 'u1', phone_no, avatar_id: 'old' } as User)
        .mockResolvedValueOnce(reread);
      mediaService.findOwned.mockResolvedValue({ id: avatarId } as Media);
      userRepo.save.mockImplementation((user) => Promise.resolve(user as User));

      await expect(
        service.updateById('u1', { avatar_id: avatarId }),
      ).resolves.toBe(reread);
      // A loaded `avatar` relation would win over `avatar_id` on save.
      expect(userRepo.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: 'u1' },
      });
      const saved = userRepo.save.mock.calls[0][0];
      expect(saved).toMatchObject({ avatar_id: avatarId });
      expect(saved).not.toHaveProperty('avatar');
    });

    it('clears the avatar id without looking a file up', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        phone_no,
        avatar_id: avatarId,
      } as User);
      userRepo.save.mockImplementation((user) => Promise.resolve(user as User));

      const result = await service.updateById('u1', { avatar_id: null });

      expect(result.avatar_id).toBeNull();
      expect(mediaService.findOwned).not.toHaveBeenCalled();
    });

    it('refuses an avatar belonging to someone else', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', phone_no } as User);
      mediaService.findOwned.mockResolvedValue(null);

      await expect(
        service.updateById('u1', { avatar_id: avatarId }),
      ).rejects.toThrow(RecordNotFoundException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('turns a duplicate email into a conflict', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', phone_no } as User);
      userRepo.save.mockRejectedValue(
        new QueryFailedError('insert', [], {
          code: '23505',
        } as unknown as Error),
      );

      await expect(
        service.updateById('u1', { email: 'taken@example.com' }),
      ).rejects.toThrow(RecordConflictException);
    });

    it('lets an unrelated database error through', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', phone_no } as User);
      userRepo.save.mockRejectedValue(new Error('connection lost'));

      await expect(
        service.updateById('u1', { email: 'new@example.com' }),
      ).rejects.toThrow('connection lost');
    });

    it('404s without saving when the account is gone', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateById('u1', { gender: Gender.MALE }),
      ).rejects.toThrow(RecordNotFoundException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('uploadAvatar', () => {
    it('stores the file under the avatars folder, owned by the uploader', async () => {
      const media = { id: avatarId } as Media;
      mediaService.upload.mockResolvedValue(media);

      const file = {
        originalname: 'me.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('x'),
      } as UploadedFileData;

      await expect(service.uploadAvatar('u1', file)).resolves.toBe(media);
      expect(mediaService.upload).toHaveBeenCalledWith(
        file,
        { user_id: 'u1', entity_id: 'u1', entity_type: EntityType.USER },
        'avatars',
      );
    });
  });
});
