// Shared shape both drivers implement — StorageService (one folder up) picks
// one at construction time based on STORAGE_DRIVER and delegates to it, so
// nothing outside this folder needs to know which is active.
export interface StorageDriverImpl {
  init?(): Promise<void>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
}
