import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { StorageDriverImpl } from './storage-driver.interface';

// STORAGE_DRIVER=local counterpart to S3StorageDriver — same put/
// getSignedDownloadUrl contract, so StorageService's callers never know
// which one is active. Meant for a hosted demo without a MinIO/S3 service
// running alongside it, not for production: disk is whatever the container
// gives it (ephemeral on most PaaS free tiers — files vanish on redeploy/
// restart, same tradeoff this project already accepts for MySQL's demo
// data), and download URLs are unsigned/unexpiring, unlike the S3 driver's.
export class LocalStorageDriver implements StorageDriverImpl {
  private readonly root = process.env.STORAGE_LOCAL_ROOT ?? join(process.cwd(), 'storage-data');
  private readonly publicBaseUrl = (process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

  async put(key: string, body: Buffer, _contentType: string): Promise<void> {
    const target = this.resolvePath(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body);
  }

  async getSignedDownloadUrl(key: string, _expiresInSeconds = 300): Promise<string> {
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `${this.publicBaseUrl}/api/v1/files/${encodedKey}`;
  }

  // Used by StorageFilesController — the S3 driver has no equivalent
  // because GetObjectCommand/getSignedUrl already know how to find the
  // object themselves.
  resolvePath(key: string): string {
    return join(this.root, key);
  }
}
