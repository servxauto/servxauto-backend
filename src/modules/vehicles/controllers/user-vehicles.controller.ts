import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { UserAuthGuard } from '@/core/guards/user-auth.guard';
import type { User } from '@/modules/users/entities/user.entity';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { VehiclesService } from '../vehicles.service';

@Controller('users/me/vehicles')
@UseGuards(UserAuthGuard)
export class UserVehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: User, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findMine(@CurrentUser() user: User) {
    return this.vehiclesService.findMine(user.id);
  }
}
