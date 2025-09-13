
import React, { useState, useEffect } from 'react';
import { UploadFile } from '@/api/integrations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye } from 'lucide-react';
import FileViewer, { useFileViewer } from './FileViewer';

export default function BranchDocumentForm({ isOpen, onClose, onSave, initialDocument, branchId }) {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Add file viewer hook
    const { viewerState, openFileViewer, closeFileViewer } = useFileViewer();

    useEffect(() => {
        if (isOpen) {
            setFormData(initialDocument || {
                branch_id: branchId,
                title: '',
                file_url: ''
            });
        }
    }, [initialDocument, isOpen, branchId]);

    const handleFileUpload = async (file) => {
        if (!file) return;
        setIsUploading(true);
        try {
            const result = await UploadFile({ file });
            setFormData(prev => ({ ...prev, file_url: result.file_url }));
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('שגיאה בהעלאת הקובץ.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        onClose(false);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{initialDocument ? 'עריכת מסמך' : 'הוספת מסמך חדש'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="title">כותרת המסמך</Label>
                            <Input
                                id="title"
                                value={formData.title || ''}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="לדוגמה: חוזה שכירות"
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="file">קובץ</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="file"
                                    id="file"
                                    onChange={(e) => handleFileUpload(e.target.files[0])}
                                    disabled={isUploading}
                                    className="flex-1"
                                />
                                {isUploading && <span className="text-sm text-blue-600">מעלה...</span>}
                                {formData.file_url && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openFileViewer(formData.file_url, null, formData.title)}
                                        className="gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        צפה בקובץ
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
                            <Button type="submit" disabled={isSaving || isUploading}>
                                {isSaving ? 'שומר...' : (initialDocument ? 'עדכן' : 'הוסף')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <FileViewer
                isOpen={viewerState.isOpen}
                onClose={closeFileViewer}
                fileUrl={viewerState.fileUrl}
                fileName={viewerState.fileName}
                title={viewerState.title}
            />
        </>
    );
}
