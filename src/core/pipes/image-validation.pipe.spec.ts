import { InvalidRequestException } from '@/core/exceptions/app-http.exception';
import { ImageValidationPipe } from './image-validation.pipe';
import { UploadedFileData } from '@/core/types/uploaded-file.types';

describe('ImageValidationPipe', () => {
  const pipe = new ImageValidationPipe();

  const file = (overrides: Partial<UploadedFileData> = {}) => ({
    originalname: 'me.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('x'),
    ...overrides,
  });

  it('passes an image within the limits through', () => {
    const image = file();
    expect(pipe.transform(image)).toBe(image);
  });

  it('rejects a missing file', () => {
    expect(() => pipe.transform(undefined)).toThrow(InvalidRequestException);
  });

  it('rejects a type we do not serve', () => {
    expect(() => pipe.transform(file({ mimetype: 'application/pdf' }))).toThrow(
      InvalidRequestException,
    );
  });

  it('rejects a file over the default 5MB', () => {
    expect(() => pipe.transform(file({ size: 6 * 1024 * 1024 }))).toThrow(
      InvalidRequestException,
    );
  });

  it('honours a tighter limit', () => {
    const tight = new ImageValidationPipe(1);

    expect(() => tight.transform(file({ size: 2 * 1024 * 1024 }))).toThrow(
      InvalidRequestException,
    );
    expect(tight.transform(file({ size: 512 * 1024 }))).toBeDefined();
  });
});
