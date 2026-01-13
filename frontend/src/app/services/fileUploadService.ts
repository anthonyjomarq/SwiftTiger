import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

export class FileUploadService {
  /**
   * Upload multiple files
   */
  static async uploadFiles(files: File[], onProgress?: (progress: number) => void): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      return response.data.files;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload files');
    }
  }

  /**
   * Upload job photos
   */
  static async uploadJobPhotos(
    jobId: string, 
    photos: Array<{ file: File; caption?: string }>,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    photos.forEach((photo, index) => {
      formData.append('photos', photo.file);
      if (photo.caption) {
        formData.append(`caption_${index}`, photo.caption);
      }
    });

    try {
      const response = await axios.post(`${API_URL}/api/jobs/${jobId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      return response.data.photos;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw new Error('Failed to upload photos');
    }
  }

  /**
   * Upload signature
   */
  static async uploadSignature(
    jobId: string,
    signatureData: string,
    signerInfo: { name: string; title?: string }
  ): Promise<{ signatureUrl: string }> {
    try {
      const response = await axios.post(`${API_URL}/api/jobs/${jobId}/signature`, {
        signature: signatureData,
        signerName: signerInfo.name,
        signerTitle: signerInfo.title
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Signature upload error:', error);
      throw new Error('Failed to upload signature');
    }
  }

  /**
   * Delete uploaded file
   */
  static async deleteFile(filename: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/api/upload/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Compress image before upload
   */
  static compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        // Resize canvas
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original file
          }
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Validate file type and size
   */
  static validateFile(file: File, allowedTypes: string[] = ['image/*'], maxSizeMB: number = 10): boolean {
    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.replace('/*', '');
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isValidType) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    return true;
  }

  /**
   * Get file preview URL
   */
  static getPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke preview URL to prevent memory leaks
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Convert base64 to File
   */
  static base64ToFile(base64: string, filename: string, mimeType: string = 'image/png'): File {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    return new File([blob], filename, { type: mimeType });
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default FileUploadService;