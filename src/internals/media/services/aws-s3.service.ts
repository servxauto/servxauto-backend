import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { slugifyText } from '@/common/utils/common.util';
import crypto from 'crypto';

@Injectable()
export class AwsS3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(configService: ConfigService) {
    // Read inside the constructor: field initializers run before the injected
    // ConfigService is assigned.
    this.bucket = configService.getOrThrow<string>('S3_BUCKET_NAME');
    this.publicUrl = configService.getOrThrow<string>('S3_PUBLIC_URL');

    const cfAccountId = configService.getOrThrow<string>('CF_ACCOUNT_ID');

    this.s3 = new S3Client({
      endpoint: `https://${cfAccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: configService.getOrThrow<string>('AWS_ACCESS_KEY'),
        secretAccessKey: configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
      region: 'auto',
    });
  }

  public getObjectKey(name: string, ext: string, dir?: string) {
    const hash = crypto
      .createHash('md5')
      .update(name)
      .digest('hex')
      .slice(0, 12);
    const fileName = `${slugifyText(name)}-${hash}.${ext}`;
    return dir ? `${dir}/${fileName}` : fileName;
  }

  public getObjectUrl(key: string) {
    return `${this.publicUrl}/${key}`;
  }

  public async upload(buffer: Buffer, fileName: string, contentType: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return this.getObjectUrl(fileName);
  }

  public async remove(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    return this.getObjectUrl(key);
  }
}
