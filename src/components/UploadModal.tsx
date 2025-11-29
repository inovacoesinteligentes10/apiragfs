/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback } from 'react';
import UploadCloudIcon from './icons/UploadCloudIcon';
import CarIcon from './icons/CarIcon';
import WashingMachineIcon from './icons/WashingMachineIcon';
import Spinner from './Spinner';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => void;
}

const sampleDocuments = [
    {
        name: 'Hyundai i10 Manual',
        url: 'https://www.hyundai.com/content/dam/hyundai/in/en/data/connect-to-service/owners-manual/2025/i20&i20nlineFromOct2023-Present.pdf',
        icon: <CarIcon />,
        fileName: 'hyundai-i10-manual.pdf'
    },
    {
        name: 'LG Washer Manual',
        url: 'https://www.lg.com/us/support/products/documents/WM2077CW.pdf',
        icon: <WashingMachineIcon />,
        fileName: 'lg-washer-manual.pdf'
    }
];

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [loadingSample, setLoadingSample] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };
    
    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            setFiles(prev => [...prev, ...Array.from(event.dataTransfer.files)]);
        }
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    }, []);
    
    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleSelectSample = async (name: string, url: string, fileName: string) => {
        if (loadingSample) return;
        setLoadingSample(name);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${name}: ${response.statusText}`);
            }
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: blob.type });
            setFiles(prev => [...prev, file]);
        } catch (error) {
            console.error("Error fetching sample file:", error);
            alert(`Could not fetch the sample document. This might be due to CORS policy. Please try uploading a local file.`);
        } finally {
            setLoadingSample(null);
        }
    };

    const handleConfirmUpload = () => {
        onUpload(files);
        handleClose();
    };

    const handleClose = () => {
        setFiles([]);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="upload-title">
            <div className="bg-background p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h2 id="upload-title" className="text-2xl font-bold text-foreground">Upload Documents</h2>
                    <button 
                        onClick={handleClose} 
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close upload modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <UploadCloudIcon />
                    <p className="mt-4 text-foreground font-medium">Drag and drop files here</p>
                    <p className="text-sm text-muted-foreground mt-2">or</p>
                    <label className="mt-4 inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors font-medium">
                        Browse Files
                        <input 
                            type="file" 
                            multiple 
                            onChange={handleFileChange} 
                            className="hidden"
                            accept=".pdf,.txt,.doc,.docx,.md"
                        />
                    </label>
                    <p className="text-xs text-muted-foreground mt-4">Supported formats: PDF, TXT, DOC, DOCX, MD</p>
                </div>

                {files.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-foreground mb-3">Selected Files ({files.length})</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                                    <button 
                                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                                        className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                                        aria-label={`Remove ${file.name}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="font-semibold text-foreground mb-3">Or Try Sample Documents</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {sampleDocuments.map((doc, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectSample(doc.name, doc.url, doc.fileName)}
                                disabled={loadingSample !== null}
                                className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingSample === doc.name ? (
                                    <Spinner />
                                ) : (
                                    <div className="text-primary">{doc.icon}</div>
                                )}
                                <span className="text-sm font-medium text-foreground">{doc.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={handleClose}
                        className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmUpload}
                        disabled={files.length === 0}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        Upload {files.length > 0 && `(${files.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
