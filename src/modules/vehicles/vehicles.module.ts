import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '@/internals/media/media.module';
import { User } from '@/modules/users/entities/user.entity';
import { Vehicle } from './entities/vehicle.entity';
import { UserVehiclesController } from './user-vehicles.controller';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  // `User` is here for UserAuthGuard, which proves the token by finding the row.
  imports: [TypeOrmModule.forFeature([Vehicle, User]), MediaModule],
  controllers: [VehiclesController, UserVehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
