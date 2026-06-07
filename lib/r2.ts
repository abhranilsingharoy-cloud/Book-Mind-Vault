import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET;

const isR2Configured = accountId && accessKeyId && secretAccessKey && bucketName;

export const s3Client = isR2Configured ? new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId as string,
    secretAccessKey: secretAccessKey as string,
  },
}) : null;

export async function uploadHtmlSnapshot(bookmarkId: string, htmlContent: string) {
  if (!s3Client || !bucketName) {
    console.warn('R2 is not configured, skipping HTML snapshot upload.');
    return null;
  }

  const key = `snapshots/${bookmarkId}.html`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: htmlContent,
      ContentType: 'text/html',
    });

    await s3Client.send(command);
    return `https://${bucketName}.r2.dev/${key}`; // Assumes public bucket, adjust if private
  } catch (error) {
    console.error('Failed to upload HTML snapshot to R2:', error);
    return null;
  }
}
