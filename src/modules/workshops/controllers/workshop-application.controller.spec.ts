import { Test, TestingModule } from '@nestjs/testing';
import { WorkshopAuthGuard } from '@/core/guards/workshop-auth.guard';
import { WorkshopApplication } from '../entities/workshop-application.entity';
import { Workshop } from '../entities/workshop.entity';
import { WorkshopApplicationService } from '../services/workshop-application.service';
import { WorkshopApplicationController } from './workshop-application.controller';

describe('WorkshopApplicationController', () => {
  let controller: WorkshopApplicationController;
  let service: {
    find: jest.Mock;
    update: jest.Mock;
    submit: jest.Mock;
  };

  const workshop = { id: 'workshop-1' } as Workshop;
  const application = { id: 'app-1' } as WorkshopApplication;

  beforeEach(async () => {
    service = {
      find: jest.fn().mockResolvedValue(application),
      update: jest.fn().mockResolvedValue(application),
      submit: jest.fn().mockResolvedValue(application),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkshopApplicationController],
      providers: [{ provide: WorkshopApplicationService, useValue: service }],
    })
      // The real guard needs JwtService and has its own spec; here we only
      // care that each route delegates with the token's workshop id.
      .overrideGuard(WorkshopAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkshopApplicationController>(
      WorkshopApplicationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // No route may take an id from the client; it always comes from the token.
  it('finds the signed-in workshop application', async () => {
    await expect(controller.findMyApplication(workshop)).resolves.toBe(
      application,
    );
    expect(service.find).toHaveBeenCalledWith(workshop.id);
  });

  it('updates the signed-in workshop application', async () => {
    const dto = {};

    await expect(controller.updateMyApplication(workshop, dto)).resolves.toBe(
      application,
    );
    expect(service.update).toHaveBeenCalledWith(workshop.id, dto);
  });

  it('submits the signed-in workshop application', async () => {
    await expect(controller.submitMyApplication(workshop)).resolves.toBe(
      application,
    );
    expect(service.submit).toHaveBeenCalledWith(workshop.id);
  });
});
