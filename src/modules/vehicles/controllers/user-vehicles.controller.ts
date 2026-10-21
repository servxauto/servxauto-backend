import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { UserAuthGuard } from '@/core/guards/user-auth.guard';
import { UuidParamPipe } from '@/core/pipes/uuid-param.pipe';
import type { User } from '@/modules/users/entities/user.entity';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
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

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @CurrentUser() user: User,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id', UuidParamPipe) id: string) {
    return this.vehiclesService.remove(user.id, id);
  }
}
