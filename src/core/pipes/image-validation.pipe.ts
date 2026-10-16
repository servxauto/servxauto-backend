import { Injectable, PipeTransform } from '@nestjs/common';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { InvalidRequestException } from '@/core/exceptions/app-http.exception';
import { UploadedFileData } from '@/core/types/uploaded-file.types';

/**
 * @example
 * `@UploadedFile(new ImageValidationPipe(5)) image: UploadedFileData`
 */
@Injectable()
export class ImageValidationPipe implements PipeTransform {
  private static readonly MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly maxBytes: number;

  constructor(maxSizeMb = 5) {
    this.maxBytes = maxSizeMb * 1024 * 1024;
  }

  transform(file?: UploadedFileData): UploadedFileData {
    if (!file) {
      throw new InvalidRequestException(
        ErrorMessage.FILE_REQUIRED,
        ErrorCode.INVALID_FILE,
      );
    }

    if (!ImageValidationPipe.MIME_TYPES.includes(file.mimetype)) {
      throw new InvalidRequestException(
        ErrorMessage.IMAGE_TYPE,
        ErrorCode.INVALID_FILE,
      );
    }

    if (file.size > this.maxBytes) {
      throw new InvalidRequestException(
        ErrorMessage.IMAGE_TOO_LARGE,
        ErrorCode.INVALID_FILE,
      );
    }

    return file;
  }
}
