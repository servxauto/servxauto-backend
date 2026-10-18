import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '@/internals/media/media.module';
import { WorkshopApplicationController } from './controllers/workshop-application.controller';
import { WorkshopsController } from './controllers/workshops.controller';
import { WorkshopAddress } from './entities/workshop-address.entity';
import { WorkshopAgreement } from './entities/workshop-agreement.entity';
import { WorkshopApplication } from './entities/workshop-application.entity';
import { WorkshopDocumentRequirement } from './entities/workshop-document-requirement.entity';
import { WorkshopDocument } from './entities/workshop-document.entity';
import { WorkshopImage } from './entities/workshop-image.entity';
import { WorkshopWorkingHour } from './entities/workshop-working-hour.entity';
import { Workshop } from './entities/workshop.entity';
import { WorkshopApplicationService } from './services/workshop-application.service';
import { WorkshopsService } from './services/workshops.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workshop,
      WorkshopApplication,
      WorkshopAddress,
      WorkshopImage,
      WorkshopDocument,
      WorkshopDocumentRequirement,
      WorkshopWorkingHour,
      WorkshopAgreement,
    ]),
    MediaModule,
  ],
  controllers: [WorkshopsController, WorkshopApplicationController],
  providers: [WorkshopsService, WorkshopApplicationService],
  exports: [WorkshopsService, WorkshopApplicationService],
})
export class WorkshopsModule {}
