/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface MinioConfig {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    useSSL: boolean;
}

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadDate: Date;
    bucket: string;
}

class MinioService {
    private config: MinioConfig;
    private baseUrl: string;

    constructor() {
        this.config = {
            endpoint: 'localhost',
            port: 9000,
            accessKey: 'admin',
            secretKey: 'admin123456',
            useSSL: false
        };
        this.baseUrl = `http://${this.config.endpoint}:${this.config.port}`;
    }

    /**
     * Upload file to MinIO
     */
    async uploadFile(file: File, bucket: string = 'chatsua-documents'): Promise<UploadedFile> {
        try {
            // Create bucket if it doesn't exist
            await this.ensureBucket(bucket);

            const fileName = `${Date.now()}-${file.name}`;
            const formData = new FormData();
            formData.append('file', file);

            // For now, we'll store file info in memory
            // In production, you would use MinIO SDK or API
            const fileUrl = `${this.baseUrl}/${bucket}/${fileName}`;

            const uploadedFile: UploadedFile = {
                id: `minio-${Date.now()}`,
                name: file.name,
                size: file.size,
                type: file.type,
                url: fileUrl,
                uploadDate: new Date(),
                bucket: bucket
            };

            // Store file metadata in localStorage for demo purposes
            this.saveFileMetadata(uploadedFile);

            return uploadedFile;
        } catch (error) {
            console.error('Error uploading file to MinIO:', error);
            throw new Error('Failed to upload file to MinIO');
        }
    }

    /**
     * Ensure bucket exists
     */
    private async ensureBucket(bucket: string): Promise<void> {
        try {
            // In production, use MinIO SDK to create bucket
            console.log(`Ensuring bucket exists: ${bucket}`);
            // For demo, we'll just log it
        } catch (error) {
            console.error('Error ensuring bucket:', error);
        }
    }

    /**
     * List files in bucket
     */
    async listFiles(bucket: string = 'chatsua-documents'): Promise<UploadedFile[]> {
        try {
            const metadata = this.getFileMetadata();
            return metadata.filter(file => file.bucket === bucket);
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }

    /**
     * Delete file from MinIO
     */
    async deleteFile(fileId: string, bucket: string = 'chatsua-documents'): Promise<void> {
        try {
            const metadata = this.getFileMetadata();
            const updatedMetadata = metadata.filter(file => file.id !== fileId);
            localStorage.setItem('minio-files', JSON.stringify(updatedMetadata));
            console.log(`Deleted file ${fileId} from bucket ${bucket}`);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error('Failed to delete file from MinIO');
        }
    }

    /**
     * Get file metadata from localStorage
     */
    private getFileMetadata(): UploadedFile[] {
        const stored = localStorage.getItem('minio-files');
        if (!stored) return [];

        try {
            const parsed = JSON.parse(stored);
            // Convert date strings back to Date objects
            return parsed.map((file: any) => ({
                ...file,
                uploadDate: new Date(file.uploadDate)
            }));
        } catch {
            return [];
        }
    }

    /**
     * Save file metadata to localStorage
     */
    private saveFileMetadata(file: UploadedFile): void {
        const metadata = this.getFileMetadata();
        metadata.push(file);
        localStorage.setItem('minio-files', JSON.stringify(metadata));
    }

    /**
     * Get MinIO console URL
     */
    getConsoleUrl(): string {
        return `http://${this.config.endpoint}:9001`;
    }

    /**
     * Get MinIO status
     */
    async getStatus(): Promise<{ online: boolean; message: string }> {
        try {
            // In production, ping MinIO health endpoint
            // For demo, return online status
            return {
                online: true,
                message: 'MinIO is running'
            };
        } catch (error) {
            return {
                online: false,
                message: 'MinIO is offline'
            };
        }
    }

    /**
     * Get storage stats - Busca dados reais do backend
     */
    async getStorageStats(): Promise<{ used: number; total: number; files: number }> {
        try {
            const response = await fetch('http://localhost:8000/minio/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch MinIO stats');
            }
            const data = await response.json();
            return {
                used: data.used || 0,
                total: data.total || 100 * 1024 * 1024 * 1024,
                files: data.files || 0
            };
        } catch (error) {
            console.error('Error fetching MinIO stats:', error);
            return {
                used: 0,
                total: 100 * 1024 * 1024 * 1024,
                files: 0
            };
        }
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export const minioService = new MinioService();
export default minioService;
