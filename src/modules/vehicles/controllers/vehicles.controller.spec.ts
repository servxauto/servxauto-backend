import { Test, TestingModule } from '@nestjs/testing';
import { Media } from '@/internals/media/entity/media.entity';
import { User } from '@/modules/users/entities/user.entity';
import { UserAuthGuard } from '@/core/guards/user-auth.guard';
import { FuelType, VehicleLookupView } from '../types/vehicles.types';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from '../vehicles.service';
import { UploadedFileData } from '@/core/types/uploaded-file.types';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  const vehiclesService = { lookup: jest.fn(), uploadImage: jest.fn() };

  const currentUser = { id: 'u1' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: vehiclesService }],
    })
      .overrideGuard(UserAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VehiclesController>(VehiclesController);
    jest.clearAllMocks();
  });

  it('passes the body to the service and returns its result', () => {
    const result: VehicleLookupView = {
      vehicle_no: 'MH12AB1234',
      brand: 'Tata',
      model: 'Nexon',
      fuel_type: FuelType.PETROL,
    };
    vehiclesService.lookup.mockReturnValue(result);

    const dto = { vehicle_no: 'MH12AB1234' };

    expect(controller.lookup(dto)).toBe(result);
    expect(vehiclesService.lookup).toHaveBeenCalledWith(dto);
  });

  it('uploads the photo against the account in the token', async () => {
    const media = { id: 'm1' } as Media;
    vehiclesService.uploadImage.mockResolvedValue(media);

    const file = { originalname: 'car.png' } as UploadedFileData;

    await expect(controller.uploadImage(currentUser, file)).resolves.toBe(
      media,
    );
    expect(vehiclesService.uploadImage).toHaveBeenCalledWith('u1', file);
  });
});
