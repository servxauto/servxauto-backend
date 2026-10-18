import { Test, TestingModule } from '@nestjs/testing';
import { Media } from '@/internals/media/entity/media.entity';
import { UserAuthGuard } from '@/core/guards/user-auth.guard';
import { User } from './entities/user.entity';
import { Gender } from './types/users.types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UploadedFileData } from '@/core/types/uploaded-file.types';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<
    Pick<UsersService, 'findById' | 'updateById' | 'uploadAvatar'>
  >;

  const currentUser = { id: 'u1' } as User;

  beforeEach(async () => {
    service = {
      findById: jest.fn(),
      updateById: jest.fn(),
      uploadAvatar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    })
      .overrideGuard(UserAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('reads the profile of the account in the token', async () => {
    const user = { id: 'u1' } as User;
    service.findById.mockResolvedValue(user);

    await expect(controller.findMe(currentUser)).resolves.toBe(user);
    expect(service.findById).toHaveBeenCalledWith('u1');
  });

  it('updates the profile of the account in the token', async () => {
    const dto = { name: 'Gokul', gender: Gender.MALE };
    await controller.updateMe(currentUser, dto);

    expect(service.updateById).toHaveBeenCalledWith('u1', dto);
  });

  it('uploads the avatar against the account in the token', async () => {
    const media = { id: 'm1' } as Media;
    service.uploadAvatar.mockResolvedValue(media);

    const file = { originalname: 'me.png' } as UploadedFileData;

    await expect(controller.uploadAvatar(currentUser, file)).resolves.toBe(
      media,
    );
    expect(service.uploadAvatar).toHaveBeenCalledWith('u1', file);
  });
});
