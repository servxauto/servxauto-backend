import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@/modules/users/entities/user.entity';
import { UserAuthGuard } from '@/core/guards/user-auth.guard';
import { Vehicle } from './entities/vehicle.entity';
import { UserVehiclesController } from './user-vehicles.controller';
import { FuelType } from './types/vehicle.types';
import { VehiclesService } from './vehicles.service';

describe('UserVehiclesController', () => {
  let controller: UserVehiclesController;
  let service: jest.Mocked<Pick<VehiclesService, 'create' | 'findMine'>>;

  const currentUser = { id: 'u1' } as User;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findMine: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserVehiclesController],
      providers: [{ provide: VehiclesService, useValue: service }],
    })
      .overrideGuard(UserAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserVehiclesController>(UserVehiclesController);
  });

  it('adds the vehicle to the garage of the account in the token', async () => {
    const dto = {
      vehicle_no: 'RJ22AD1234',
      brand: 'Maruti',
      model: 'Alto K10',
      fuel_type: FuelType.PETROL,
    };
    const vehicle = { id: 'v1' } as Vehicle;
    service.create.mockResolvedValue(vehicle);

    await expect(controller.create(currentUser, dto)).resolves.toBe(vehicle);
    expect(service.create).toHaveBeenCalledWith('u1', dto);
  });

  it('lists the garage of the account in the token', async () => {
    const vehicles = [{ id: 'v1' }] as Vehicle[];
    service.findMine.mockResolvedValue(vehicles);

    await expect(controller.findMine(currentUser)).resolves.toBe(vehicles);
    expect(service.findMine).toHaveBeenCalledWith('u1');
  });
});
