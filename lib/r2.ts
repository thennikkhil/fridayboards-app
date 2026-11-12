import "server-only";

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function r2(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: "auto",
    endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

const bucket = () => env("R2_BUCKET");

export function presignUpload(key: string, contentType: string, expiresIn = 300) {
  return getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

export function presignDownload(key: string, fileName: string, expiresIn = 600) {
  return getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }),
    { expiresIn },
  );
}

export async function headObject(key: string) {
  const res = await r2().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
  return { size: res.ContentLength ?? 0 };
}

export async function readFirstBytes(key: string, count = 5): Promise<Uint8Array> {
  const res = await r2().send(
    new GetObjectCommand({ Bucket: bucket(), Key: key, Range: `bytes=0-${count - 1}` }),
  );
  return (await res.Body?.transformToByteArray()) ?? new Uint8Array();
}

export async function deleteObject(key: string) {
  await r2().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

export async function deleteObjects(keys: string[]) {
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    const response = await r2().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    if (response.Errors?.length) {
      throw new Error(`R2 failed to delete ${response.Errors.length} object(s).`);
    }
  }
}
