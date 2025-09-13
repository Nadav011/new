
import React, { useState, useEffect } from 'react';
import { UploadFile } from '@/api/integrations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Upload, Link as LinkIcon, RefreshCw, FileText, X, Eye } from 'lucide-react';
import FileViewer, { useFileViewer } from './FileViewer';

export default function OfficialDocumentForm({ isOpen, onClose, onSave, document: initialDocument, availableCategories = [] }) {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Add file viewer hook
    const { viewerState, openFileViewer, closeFileViewer } = useFileViewer();

    useEffect(() => {
        if (isOpen) {
            setFormData(initialDocument || {
                title: '',
                description: '',
                document_type: 'file',
                file_url: '',
                link_url: '',
                category: availableCategories.length > 0 ? availableCategories[0].name : 'אחר',
                is_active: true
            });
        }
    }, [initialDocument, isOpen, availableCategories]);

    const handleChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        if (field === 'document_type') {
            if (value === 'file') newFormData.link_url = '';
            else newFormData.file_url = '';
        }
        setFormData(newFormData);
    };

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
        if (!formData.title || !formData.document_type) {
            alert('יש למלא כותרת וסוג מסמך');
            return;
        }
        if (formData.document_type === 'file' && !formData.file_url) {
            alert('יש להעלות קובץ');
            return;
        }
        if (formData.document_type === 'link' && !formData.link_url) {
            alert('יש להזין קישור');
            return;
        }

        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        onClose(false);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{initialDocument ? 'עריכת מסמך' : 'הוספת מסמך חדש'}</DialogTitle>
                        <DialogDescription>
                            הוסף מסמך רשמי שיהיה זמין לכל בעלי הסניפים להורדה
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="title">כותרת המסמך*</Label>
                            <Input
                                id="title"
                                value={formData.title || ''}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                                placeholder="הזן כותרת המסמך"
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">תיאור (אופציונלי)</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="תיאור קצר של המסמך"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="document_type">סוג המסמך*</Label>
                                <Select value={formData.document_type} onValueChange={(value) => handleChange('document_type', value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="file">קובץ להעלאה</SelectItem>
                                        <SelectItem value="link">קישור חיצוני</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="category">קטגוריה</Label>
                                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {availableCategories.length > 0 ? (
                                            availableCategories.map(category => (
                                                <SelectItem key={category.id} value={category.name}>
                                                    {category.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="אחר">אחר</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.document_type === 'file' && (
                            <div>
                                <Label htmlFor="file">קובץ להעלאה</Label>
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
                                            onClick={() => {
                                                const fileName = formData.file_url.substring(formData.file_url.lastIndexOf('/') + 1);
                                                openFileViewer(formData.file_url, fileName, formData.title);
                                            }}
                                            className="gap-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            צפה בקובץ
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {formData.document_type === 'link' && (
                            <div>
                                <Label htmlFor="link_url">קישור*</Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        id="link_url"
                                        value={formData.link_url || ''}
                                        onChange={(e) => handleChange('link_url', e.target.value)}
                                        placeholder="https://docs.google.com/..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onClose(false)}>
                                ביטול
                            </Button>
                            <Button type="submit" disabled={isSaving || isUploading}>
                                <Save className="ml-2 h-4 w-4" />
                                {isSaving ? 'שומר...' : 'שמירה'}
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
