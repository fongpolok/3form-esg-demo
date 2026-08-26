import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3StorageDriver } from './drivers/s3-storage.driver';
import { LocalStorageDriver } from './drivers/local-storage.driver';
import type { StorageDriverImpl } from './drivers/storage-driver.interface';

// Facade over a swappable driver (STORAGE_DRIVER: s3 | local) so
// ReportsModule and everything else keeps depending on this one class —
// put/getSignedDownloadUrl never change shape regardless of which driver is
// active. See drivers/ for the two implementations.
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly driver: StorageDriverImpl;
  readonly localDriver: LocalStorageDriver | null;

  constructor() {
    if ((process.env.STORAGE_DRIVER ?? 's3') === 'local') {
      const local = new LocalStorageDriver();
      this.driver = local;
      this.localDriver = local;
    } else {
      this.driver = new S3StorageDriver();
      this.localDriver = null;
    }
  }

  async onModuleInit() {
    await this.driver.init?.();
  }

  put(key: string, body: Buffer, contentType: string): Promise<void> {
    return this.driver.put(key, body, contentType);
  }

  getSignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
    return this.driver.getSignedDownloadUrl(key, expiresInSeconds);
  }
}
