import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageFilesController } from './storage-files.controller';

// Provides StorageService.put/getSignedDownloadUrl backed by a swappable
// driver (STORAGE_DRIVER: s3 | local) — see storage.service.ts and drivers/.
// StorageFilesController only ever serves a response when the local driver
// is active; under STORAGE_DRIVER=s3 (the default) it 404s every request,
// since S3-mode download URLs point at MinIO/S3 directly and never reach it.
@Module({
  controllers: [StorageFilesController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
