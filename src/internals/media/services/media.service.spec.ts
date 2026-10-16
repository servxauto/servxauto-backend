import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityType, Media } from '../entity/media.entity';
import { AwsS3Service } from './aws-s3.service';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo: jest.Mocked<Pick<Repository<Media>, 'create' | 'save'>>;
  let awsS3Service: jest.Mocked<Pick<AwsS3Service, 'getObjectKey' | 'upload'>>;

  const file = {
    originalname: 'me.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('x'),
  };

  beforeEach(async () => {
    mediaRepo = {
      create: jest.fn().mockImplementation((data) => data as Media),
      save: jest.fn().mockImplementation((media) => Promise.resolve(media)),
    };
    awsS3Service = {
      getObjectKey: jest.fn().mockReturnValue('avatars/me-abc123.png'),
      upload: jest.fn().mockResolvedValue('https://cdn.test/avatars/me.png'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Media), useValue: mediaRepo },
        { provide: AwsS3Service, useValue: awsS3Service },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  describe('upload', () => {
    it('records the row with the column names the table actually has', async () => {
      await service.upload(
        file,
        { user_id: 'u1', entity_id: 'u1', entity_type: EntityType.USER },
        'avatars',
      );

      // Keys that do not match a column are silently dropped by `create`,
      // which is how a NOT NULL `user_id` ended up null once.
      expect(mediaRepo.create).toHaveBeenCalledWith({
        user_id: 'u1',
        entity_id: 'u1',
        entity_type: EntityType.USER,
        name: 'me.png',
        path: 'https://cdn.test/avatars/me.png',
        mime: 'image/png',
        size: 1024,
      });
    });

    it('puts the object in the bucket under the given folder', async () => {
      await service.upload(file, { user_id: 'u1' }, 'avatars');

      expect(awsS3Service.getObjectKey).toHaveBeenCalledWith(
        'me.png',
        'png',
        'avatars',
      );
      expect(awsS3Service.upload).toHaveBeenCalledWith(
        file.buffer,
        'avatars/me-abc123.png',
        'image/png',
      );
    });

    it('does not record a row when the upload fails', async () => {
      awsS3Service.upload.mockRejectedValue(new Error('bucket unreachable'));

      await expect(
        service.upload(file, { user_id: 'u1' }, 'avatars'),
      ).rejects.toThrow('bucket unreachable');
      expect(mediaRepo.save).not.toHaveBeenCalled();
    });
  });
});
