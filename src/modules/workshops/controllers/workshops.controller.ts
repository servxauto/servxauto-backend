import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentWorkshop } from '@/core/decorators/current-workshop.decorator';
import { WorkshopAuthGuard } from '@/core/guards/workshop-auth.guard';
import { ImageValidationPipe } from '@/core/pipes/image-validation.pipe';
import type { UploadedFileData } from '@/core/types/uploaded-file.types';
import type { Workshop } from '../entities/workshop.entity';
import { WorkshopUpdateMeDto } from '../dto/update-me.dto';
import { WorkshopsService } from '../services/workshops.service';

@Controller('workshops')
@UseGuards(WorkshopAuthGuard)
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  findMe(@CurrentWorkshop() workshop: Workshop) {
    return this.workshopsService.findById(workshop.id);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  updateMe(
    @CurrentWorkshop() workshop: Workshop,
    @Body() dto: WorkshopUpdateMeDto,
  ) {
    return this.workshopsService.updateById(workshop.id, dto);
  }

  /** Shop photos and document photos alike; send the returned `id` on `PATCH workshops/me`. */
  @Post('me/image-upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @UploadedFile(new ImageValidationPipe()) image: UploadedFileData,
  ) {
    return this.workshopsService.uploadImage(image);
  }
}
