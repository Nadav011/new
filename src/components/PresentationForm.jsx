import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { UploadFile } from '@/api/integrations';
import { Upload, File, Loader2 } from 'lucide-react';

export default function PresentationForm({ isOpen, onClose, onSave, presentation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [existingFileUrl, setExistingFileUrl] = useState('');
    const [existingFileName, setExistingFileName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (presentation) {
            setTitle(presentation.title || '');
            setDescription(presentation.description || '');
            setExistingFileUrl(presentation.file_url || '');
            setExistingFileName(presentation.file_name || '');
            setFile(null); // Reset file input when editing
        } else {
            setTitle('');
            setDescription('');
            setExistingFileUrl('');
            setExistingFileName('');
            setFile(null);
        }
        setError('');
    }, [presentation, isOpen]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file && !presentation) {
            setError('חובה לבחור קובץ.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            let fileData = {
                file_url: existingFileUrl,
                file_name: existingFileName
            };

            if (file) {
                const uploadResponse = await UploadFile({ file });
                if (uploadResponse.file_url) {
                    fileData.file_url = uploadResponse.file_url;
                    fileData.file_name = file.name;
                } else {
                    throw new Error('Upload failed');
                }
            }

            await onSave({
                title,
                description,
                ...fileData
            });
            onClose();
        } catch (err) {
            console.error("Failed to save presentation:", err);
            setError("שגיאה בשמירת המצגת. נסה שוב.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>{presentation ? 'עריכת פרטי מצגת' : 'העלאת מצגת / תוכנית חדשה'}</DialogTitle>
                    <DialogDescription>
                        {presentation ? 'עדכן את הכותרת והתיאור של הקובץ.' : 'בחר קובץ מהמחשב והוסף לו כותרת ותיאור.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="title">כותרת</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="description">תיאור</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="file-upload">קובץ</Label>
                        {!presentation && (
                            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                                <div className="text-center">
                                    {file ? (
                                        <>
                                            <File className="mx-auto h-12 w-12 text-gray-300" />
                                            <p className="mt-2 text-sm font-semibold text-gray-900">{file.name}</p>
                                        </>
                                    ) : (
                                        <Upload className="mx-auto h-12 w-12 text-gray-300" />
                                    )}
                                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                                        >
                                            <span>בחר קובץ להעלאה</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">או גרור לכאן</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {presentation && (
                             <div className="mt-2 text-sm text-gray-600">
                                <p><strong>קובץ קיים:</strong> {existingFileName}</p>
                                <p className="text-xs text-gray-500">לא ניתן להחליף קובץ קיים. למחיקה והעלאה מחדש, אנא מחק את הרשומה והעלה חדשה.</p>
                             </div>
                        )}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>ביטול</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'שומר...' : 'שמור'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}