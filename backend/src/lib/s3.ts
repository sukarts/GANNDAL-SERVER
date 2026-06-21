import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

export const s3 = new S3Client({
  endpoint: env.s3.endpoint,
  region: env.s3.region,
  forcePathStyle: env.s3.forcePathStyle,
  credentials: {
    accessKeyId: env.s3.accessKey,
    secretAccessKey: env.s3.secretKey,
  },
});

export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `${env.s3.publicUrl}/${key}`;
}

export async function presignDownload(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }), { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key }));
}
