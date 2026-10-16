import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentWorkshop } from '@/core/decorators/current-workshop.decorator';
import { WorkshopAuthGuard } from '@/core/guards/workshop-auth.guard';
import type { Workshop } from '../entities/workshop.entity';
import { UpdateWorkshopApplicationDto } from '../dto/update-workshop-application.dto';
import { WorkshopApplicationService } from '../services/workshop-application.service';

/**
 * The signed-in workshop's own onboarding application. Every route takes the
 * workshop id from the token, so a workshop can only ever reach its own — and
 * WorkshopAuthGuard keeps customer and worker tokens out.
 */
@Controller('workshops/me/application')
@UseGuards(WorkshopAuthGuard)
export class WorkshopApplicationController {
  constructor(private workshopApplicationService: WorkshopApplicationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findMyApplication(@CurrentWorkshop() workshop: Workshop) {
    return this.workshopApplicationService.find(workshop.id);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  updateMyApplication(
    @CurrentWorkshop() workshop: Workshop,
    @Body() dto: UpdateWorkshopApplicationDto,
  ) {
    return this.workshopApplicationService.update(workshop.id, dto);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  submitMyApplication(@CurrentWorkshop() workshop: Workshop) {
    return this.workshopApplicationService.submit(workshop.id);
  }

  // TODO: Admin APIs
}
