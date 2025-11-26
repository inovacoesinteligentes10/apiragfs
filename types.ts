/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export interface RagStore {
    name: string;
    displayName: string;
}

export interface CustomMetadata {
  key?: string;
  stringValue?: string;
  stringListValue?: string[];
  numericValue?: number;
}

export interface Document {
    name: string;
    displayName: string;
    customMetadata?: CustomMetadata[];
}

export interface GroundingChunk {
    retrievedContext?: {
        text?: string;
    };
}

export interface QueryResult {
    text: string;
    groundingChunks: GroundingChunk[];
}

export enum AppStatus {
    Initializing,
    Welcome,
    Uploading,
    Chatting,
    Error,
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    groundingChunks?: GroundingChunk[];
}

export interface ProcessedDocument {
    id: string;
    name: string;
    type: string;
    size: number;
    textLength: number | null;
    extractionMethod: string | null;
    department?: string | null;
    departmentDisplayName?: string | null;
    chunks: number | null;
    processingTime: number | null;
    status: 'uploaded' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'completed' | 'error';
    progressPercent: number | null;
    statusMessage: string | null;
    ragStoreName?: string | null;
    uploadDate: Date;
    error?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'professor' | 'admin';
    is_active: boolean;
    created_at: string;
    last_login: string | null;
    stats?: UserStats;
}

export interface UserStats {
    total_documents: number;
    total_sessions: number;
    total_messages: number;
}

export interface UserFormData {
    email: string;
    name: string;
    role: 'student' | 'professor' | 'admin';
    password?: string;
    is_active?: boolean;
}
