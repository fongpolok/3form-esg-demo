import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageDriverImpl } from './storage-driver.interface';

// S3-compatible driver, backed by MinIO in Compose (plan §2, §10) —
// pointing STORAGE_S3_ENDPOINT at a real AWS S3 endpoint later needs no
// code change, only env vars.
export class S3StorageDriver implements StorageDriverImpl {
  private readonly client: S3Client;
  // A second client, used ONLY to sign download URLs, pointed at whatever
  // host the actual downloader (a browser outside the Docker network) can
  // reach — the internal `http://minio:9000` the backend itself uses to
  // talk to MinIO is not that host. Without this split, every signed URL
  // this service issues is unreachable outside the compose network.
  // Defaults to STORAGE_S3_ENDPOINT so nothing breaks against a real S3
  // deployment, where the same public endpoint serves both purposes.
  private readonly signingClient: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.STORAGE_S3_BUCKET ?? 'esg-platform';
    const endpoint = process.env.STORAGE_S3_ENDPOINT ?? 'http://minio:9000';
    const publicEndpoint = process.env.STORAGE_S3_PUBLIC_ENDPOINT ?? endpoint;
    const forcePathStyle = (process.env.STORAGE_S3_FORCE_PATH_STYLE ?? 'true') === 'true';
    const region = process.env.STORAGE_S3_REGION ?? 'us-east-1';
    const credentials = {
      accessKeyId: process.env.STORAGE_S3_ACCESS_KEY ?? '',
      secretAccessKey: process.env.STORAGE_S3_SECRET_KEY ?? '',
    };

    this.client = new S3Client({ region, endpoint, forcePathStyle, credentials });
    this.signingClient =
      publicEndpoint === endpoint
        ? this.client
        : new S3Client({ region, endpoint: publicEndpoint, forcePathStyle, credentials });
  }

  // MinIO doesn't pre-create buckets the way a real AWS account's
  // Terraform/console setup would — creating it here on boot keeps the PoC
  // working from a clean `docker compose up` without a separate bootstrap
  // step. A real S3 bucket in production would already exist.
  async init() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket })).catch(() => undefined);
    }
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.signingClient, command, { expiresIn: expiresInSeconds });
  }
}
