const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

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

      const fileExtension = path.extname(file.name || file.originalname);
      const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
      const s3Key = `userUploadedFilesForPost/${uniqueFilename}`;

      const params = {
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        Body: file.data || file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make the uploaded file publicly accessible
      };

      await s3Client.send(new PutObjectCommand(params));

      const publicUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

      return {
        publicUrl,
        mediaType: file.mimetype.startsWith('image/') ? 'image' : 'video',
      };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  static async deleteFile(fileUrl) {
    try {
      if (!fileUrl || !S3_BUCKET_NAME) {
        console.warn('File URL or S3_BUCKET_NAME not provided for deletion.');
        return;
      }

      // Extract the S3 key from the public URL
      const urlParts = fileUrl.split(`https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`);
      if (urlParts.length < 2) {
        console.warn('Invalid S3 file URL provided for deletion:', fileUrl);
        return;
      }
      const s3Key = urlParts[1];

      const params = {
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
      };

      await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // Don't throw error for delete operations
    }
  }
}

module.exports = UploadService;