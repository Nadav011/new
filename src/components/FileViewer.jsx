import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, FileText, Image, FileX } from 'lucide-react';

export default function FileViewer({ isOpen, onClose, fileUrl, fileName, title }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!fileUrl) return null;

    const getFileExtension = (filename) => {
        if (!filename) return '';
        return filename.split('.').pop()?.toLowerCase() || '';
    };

    const extension = getFileExtension(fileName);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
    const isPdf = extension === 'pdf';

    const handleImageLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const renderFileContent = () => {
        if (hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <FileX className="w-16 h-16 mb-4" />
                    <p className="text-lg mb-2">שגיאה בטעינת הקובץ</p>
                    <p className="text-sm mb-4">לא ניתן להציג את הקובץ בדפדפן</p>
                    <a href={fileUrl} download={fileName}>
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            הורד קובץ
                        </Button>
                    </a>
                </div>
            );
        }

        if (isImage) {
            return (
                <div className="flex flex-col items-center max-h-[80vh] overflow-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-gray-500">טוען תמונה...</div>
                        </div>
                    )}
                    <img
                        src={fileUrl}
                        alt={fileName || 'תמונה'}
                        className={`max-w-full max-h-full object-contain ${isLoading ? 'hidden' : ''}`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                </div>
            );
        }

        if (isPdf) {
            return (
                <div className="w-full h-[80vh]">
                    <iframe
                        src={fileUrl}
                        className="w-full h-full border-0"
                        title={fileName || 'מסמך PDF'}
                        onLoad={() => setIsLoading(false)}
                        onError={() => {
                            setIsLoading(false);
                            setHasError(true);
                        }}
                    />
                    {isLoading && (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-gray-500">טוען מסמך PDF...</div>
                        </div>
                    )}
                </div>
            );
        }

        // For other file types, show download option
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-600">
                <FileText className="w-16 h-16 mb-4" />
                <p className="text-lg mb-2">קובץ {extension.toUpperCase()}</p>
                <p className="text-sm mb-4 text-center">
                    לא ניתן להציג קובץ זה בדפדפן.<br />
                    לחץ להורדה כדי לפתוח אותו במחשב שלך.
                </p>
                <a href={fileUrl} download={fileName}>
                    <Button className="gap-2">
                        <Download className="w-4 h-4" />
                        הורד קובץ ({extension.toUpperCase()})
                    </Button>
                </a>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0" dir="rtl">
                <DialogHeader className="p-4 border-b">
                    <div className="flex justify-between items-center">
                        <DialogTitle className="flex items-center gap-2">
                            {isImage ? <Image className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            {title || fileName || 'צפייה בקובץ'}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <a href={fileUrl} download={fileName}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Download className="w-4 h-4" />
                                    הורד
                                </Button>
                            </a>
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <div className="p-4">
                    {renderFileContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Hook for using the FileViewer
export function useFileViewer() {
    const [viewerState, setViewerState] = useState({
        isOpen: false,
        fileUrl: null,
        fileName: null,
        title: null
    });

    const openFileViewer = (fileUrl, fileName, title) => {
        setViewerState({
            isOpen: true,
            fileUrl,
            fileName,
            title
        });
    };

    const closeFileViewer = () => {
        setViewerState({
            isOpen: false,
            fileUrl: null,
            fileName: null,
            title: null
        });
    };

    return {
        viewerState,
        openFileViewer,
        closeFileViewer
    };
}