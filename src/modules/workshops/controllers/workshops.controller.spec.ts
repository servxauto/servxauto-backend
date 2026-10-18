import { Test, TestingModule } from '@nestjs/testing';
import { WorkshopAuthGuard } from '@/core/guards/workshop-auth.guard';
import type { UploadedFileData } from '@/core/types/uploaded-file.types';
import { Media } from '@/internals/media/entity/media.entity';
import { Workshop } from '../entities/workshop.entity';
import { WorkshopsService } from '../services/workshops.service';
import type { WorkshopView } from '../types/workshops.types';
import { WorkshopsController } from './workshops.controller';

describe('WorkshopsController', () => {
  let controller: WorkshopsController;
  let service: jest.Mocked<
    Pick<WorkshopsService, 'findById' | 'updateById' | 'uploadImage'>
  >;

  const currentWorkshop = { id: 's1' } as Workshop;
  const view = { id: 's1', business_name: 'Speed Motors' } as WorkshopView;

  beforeEach(async () => {
    service = {
      findById: jest.fn().mockResolvedValue(view),
      updateById: jest.fn().mockResolvedValue(view),
      uploadImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkshopsController],
      providers: [{ provide: WorkshopsService, useValue: service }],
    })
      // The real guard needs JwtService and has its own spec; here we only
      // care that each route delegates with the token's workshop id.
      .overrideGuard(WorkshopAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkshopsController>(WorkshopsController);
  });

  it('returns the workshop in the token', async () => {
    await expect(controller.findMe(currentWorkshop)).resolves.toBe(view);
    expect(service.findById).toHaveBeenCalledWith('s1');
  });

  it('updates the workshop in the token', async () => {
    const dto = { business_name: 'Speed Motors' };

    await expect(controller.updateMe(currentWorkshop, dto)).resolves.toBe(view);
    expect(service.updateById).toHaveBeenCalledWith('s1', dto);
  });

  it('hands the uploaded image to the service', async () => {
    const media = { id: 'm1' } as Media;
    service.uploadImage.mockResolvedValue(media);
    const file = { originalname: 'shop.png' } as UploadedFileData;

    await expect(controller.uploadImage(file)).resolves.toBe(media);
    expect(service.uploadImage).toHaveBeenCalledWith(file);
  });
});
