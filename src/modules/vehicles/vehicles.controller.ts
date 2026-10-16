import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ImageValidationPipe } from '@/core/pipes/image-validation.pipe';
import { UserAuthGuard } from '@/core/guards/user-auth.guard';
import type { User } from '@/modules/users/entities/user.entity';
import { VehicleLookupDto } from './dto/vehicle-lookup.dto';
import { VehiclesService } from './vehicles.service';
import type { UploadedFileData } from '@/core/types/uploaded-file.types';

/** Vehicle operations not scoped to one garage — see `UserVehiclesController` for those. */
@Controller('vehicles')
@UseGuards(UserAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  lookup(@Body() dto: VehicleLookupDto) {
    return this.vehiclesService.lookup(dto);
  }

  /** Send the returned `id` as one of `image_ids` on `POST users/me/vehicles`. */
  @Post('image-upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @CurrentUser() user: User,
    @UploadedFile(new ImageValidationPipe()) image: UploadedFileData,
  ) {
    return this.vehiclesService.uploadImage(user.id, image);
  }
}
