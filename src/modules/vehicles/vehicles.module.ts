import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '@/internals/media/media.module';
import { User } from '@/modules/users/entities/user.entity';
import { VehicleImage } from './entities/vehicle-image.entity';
import { Vehicle } from './entities/vehicle.entity';
import { UserVehiclesController } from './controllers/user-vehicles.controller';
import { VehiclesController } from './controllers/vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  // `User` is here for UserAuthGuard, which proves the token by finding the row.
  imports: [
    TypeOrmModule.forFeature([Vehicle, VehicleImage, User]),
    MediaModule,
  ],
  controllers: [VehiclesController, UserVehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
