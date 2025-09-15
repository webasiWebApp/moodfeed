const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class UploadService {
  static uploadDir = path.join(__dirname, '..', 'userUploadedFilesForPost');

  static async initialize() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  static async uploadFile(file) {
    try {
      // Ensure upload directory exists
      await this.initialize();

      // Generate unique filename using date and random bytes for uniqueness
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);
      const publicUrl = `/userUploadedFilesForPost/${uniqueFilename}`;

      // Move file to upload directory
      await fs.writeFile(filePath, file.buffer);

      // Return both the public URL and local file path
      return {
        publicUrl,
        localPath: filePath,
        mediaType: file.mimetype.startsWith('image/') ? 'image' : 'video'
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  static async deleteFile(fileUrl) {
    try {
      if (!fileUrl) return;

      // Extract filename from URL
      const filename = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, filename);

      // Check if file exists before attempting to delete
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error for delete operations
    }
  }
}

module.exports = UploadService;
