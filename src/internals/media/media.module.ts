import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entity/media.entity';
import { AwsS3Service } from './services/aws-s3.service';
import { MediaService } from './services/media.service';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  providers: [AwsS3Service, MediaService],
  exports: [AwsS3Service, MediaService],
})
export class MediaModule {}
