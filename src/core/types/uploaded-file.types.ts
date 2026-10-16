/**
 * An uploaded file as `FileInterceptor` hands it over, in memory.
 *
 * Declared here rather than using `Express.Multer.File`: that type is a global
 * augmentation from `@types/multer`, which only exists once TypeScript pulls
 * that package in, so editors disagree with `tsc` about whether it resolves.
 * The fields below are the ones this codebase reads, and the real multer object
 * satisfies them structurally.
 */
export interface UploadedFileData {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
