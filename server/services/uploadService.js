const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION, // e.g., 'us-east-1'
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

class UploadService {
  static async uploadFile(file) {
    try {
      if (!S3_BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME is not defined in environment variables.');
      }

      // Support multiple shapes (multer memoryStorage => file.buffer, some libs => file.data)
      const body = file?.buffer || file?.data || file;
      if (!body) {
        throw new Error('No file body found on the provided file object.');
      }

      const filenameBase = file?.originalname || file?.name || 'file';
      const fileExtension = path.extname(filenameBase) || '';
      const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
      const s3Key = `userUploadedFilesForPost/${uniqueFilename}`;

      const params = {
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        Body: body,
        ContentType: file?.mimetype || 'application/octet-stream',
      };

      // If body is a Buffer, set ContentLength to help S3 validate upload size
      if (Buffer.isBuffer(body)) {
        params.ContentLength = body.length;
      }

      // Avoid forcing ACL (public-read) because many buckets have Block Public Access enabled
      // and PutObject with ACL will be rejected. Let the bucket policy control access.
      // Try upload, and if S3 responds with a redirect/region-mismatch, retry with the correct region
      let usedClient = s3Client;
      try {
        await usedClient.send(new PutObjectCommand(params));
      } catch (uploadErr) {
        // Detect 'PermanentRedirect' / endpoint mismatch and try to determine correct region
        const metaHeaders = uploadErr && uploadErr.$metadata && uploadErr.$metadata.httpHeaders;
        let bucketRegion = metaHeaders && (metaHeaders['x-amz-bucket-region'] || metaHeaders['x-amz-bucket-region'.toLowerCase()]);

        // If header not present, try GetBucketLocationCommand as a fallback
        if (!bucketRegion) {
          try {
            const locClient = s3Client; // use existing client to ask for bucket location
            const locRes = await locClient.send(new GetBucketLocationCommand({ Bucket: S3_BUCKET_NAME }));
            // AWS returns LocationConstraint; for us-east-1 it may be null or ''
            bucketRegion = locRes && (locRes.LocationConstraint || locRes.LocationConstraint === '' ? locRes.LocationConstraint : null);
            if (bucketRegion === '') bucketRegion = 'us-east-1';
          } catch (locErr) {
            // If we can't determine region, rethrow original error
            console.warn('Unable to determine bucket region from GetBucketLocation:', locErr && locErr.message ? locErr.message : locErr);
          }
        }

        // Only attempt a retry if the detected region looks valid — avoid retrying to bogus regions
        const KNOWN_REGIONS = new Set([
          'us-east-1','us-east-2','us-west-1','us-west-2','ca-central-1','sa-east-1',
          'eu-west-1','eu-west-2','eu-west-3','eu-central-1','eu-north-1',
          'ap-south-1','ap-northeast-1','ap-northeast-2','ap-northeast-3','ap-southeast-1','ap-southeast-2',
          'me-south-1','af-south-1'
        ]);

        if (bucketRegion && bucketRegion !== process.env.AWS_REGION) {
          if (!KNOWN_REGIONS.has(bucketRegion)) {
            console.warn(`Detected bucket region "${bucketRegion}" is not in known region list. Will not retry. Please verify the bucket region in the AWS console and update AWS_REGION in your .env.`);
            // include helpful context on original error
            console.warn('Original upload error metadata:', uploadErr && uploadErr.$metadata ? uploadErr.$metadata : uploadErr);
            throw uploadErr;
          }

          // Recreate client with the correct region and retry once
          const retryClient = new S3Client({
            region: bucketRegion,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          });
          usedClient = retryClient;
          await usedClient.send(new PutObjectCommand(params));
        } else {
          // No region info available or same region; rethrow
          throw uploadErr;
        }
      }

      // Construct a virtual-hosted style public URL (may be blocked by bucket settings)
      const region = (usedClient.config && usedClient.config.region) || process.env.AWS_REGION || 'us-east-1';
      const host = region === 'us-east-1' ? 's3.amazonaws.com' : `s3.${region}.amazonaws.com`;
      const publicUrl = `https://moodfeedbucket.s3.eu-north-1.amazonaws.com/${s3Key}`;

      // Also produce a presigned GET URL as a reliable fallback when objects are not public.
      let signedUrl = null;
      try {
        signedUrl = await getSignedUrl(usedClient, new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: s3Key }), { expiresIn: 60 * 60 * 24 * 7 }); // 7 days
      } catch (signErr) {
        console.warn('Failed to generate presigned URL (this is non-fatal):', signErr && signErr.message ? signErr.message : signErr);
      }

      return {
        publicUrl,
        signedUrl,
        mediaType: (file?.mimetype || '').startsWith('image/') ? 'image' : 'video',
      };
    } catch (error) {
      // Include AWS specific error info when available to make debugging easier
      console.error('Error uploading file to S3:', {
        name: error.name,
        message: error.message,
        code: error.Code || error.code,
        stack: error.stack,
      });
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  static async deleteFile(fileUrl) {
    try {
      if (!fileUrl || !S3_BUCKET_NAME) {
        console.warn('File URL or S3_BUCKET_NAME not provided for deletion.');
        return;
      }

      // Try to robustly extract the S3 key from several URL styles
      let s3Key = null;
      try {
        const urlObj = new URL(fileUrl);
        // Virtual-hosted style: <bucket>.<host>/<key>
        const hostParts = urlObj.hostname.split('.');
        if (hostParts[0] === S3_BUCKET_NAME) {
          s3Key = urlObj.pathname.replace(/^\//, '');
        } else {
          // Path-style or other: look for known pattern after the bucket host
          const marker = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
          if (fileUrl.includes(marker)) {
            s3Key = fileUrl.split(marker)[1];
          } else {
            // Fallback: assume last path segment(s) after first /
            s3Key = urlObj.pathname.replace(/^\//, '');
          }
        }
      } catch (parseErr) {
        console.warn('Failed to parse file URL when deleting from S3:', parseErr && parseErr.message ? parseErr.message : parseErr);
        return;
      }

      const params = {
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
      };

      await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
      console.error('Error deleting file from S3:', error && error.message ? error.message : error);
      // Don't throw error for delete operations
    }
  }
}

module.exports = UploadService;