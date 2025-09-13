import React, { useState, useEffect } from 'react';
import { UploadFile } from '@/api/integrations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Save, Upload, FileImage, X } from 'lucide-react';

export default function BusinessLicenseForm({ open, onOpenChange, branch, onSave }) {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (branch) {
            setFormData({
                has_business_license: branch.has_business_license || false,
                business_license_number: branch.business_license_number || '',
                business_license_doc_url: branch.business_license_doc_url || '',
                business_license_start_date: branch.business_license_start_date || '',
                business_license_end_date: branch.business_license_end_date || '',
                business_license_issuing_authority: branch.business_license_issuing_authority || '',
            });
        }
    }, [branch, open]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await UploadFile({ file });
            handleChange('business_license_doc_url', result.file_url);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('שגיאה בהעלאת הקובץ');
        }
        setIsUploading(false);
    };
    
    const removeFile = () => {
        handleChange('business_license_doc_url', '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        // If 'No', clear the related fields
        const dataToSave = formData.has_business_license ? formData : {
            has_business_license: false,
            business_license_number: '',
            business_license_doc_url: '',
            business_license_start_date: '',
            business_license_end_date: '',
            business_license_issuing_authority: '',
        };
        await onSave(dataToSave);
        setIsSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>עדכון רישיון עסק</DialogTitle>
                    <DialogDescription>
                        עדכון פרטי רישיון עסק עבור סניף "{branch?.name}"
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="has_business_license">האם קיים רישיון עסק?</Label>
                        <Select
                            onValueChange={(value) => handleChange('has_business_license', value === 'true')}
                            value={String(formData.has_business_license || false)}
                        >
                            <SelectTrigger id="has_business_license" className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">כן</SelectItem>
                                <SelectItem value="false">לא</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.has_business_license && (
                        <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                            <div>
                                <Label htmlFor="business_license_number">מספר רישיון עסק</Label>
                                <Input
                                    id="business_license_number"
                                    value={formData.business_license_number || ''}
                                    onChange={(e) => handleChange('business_license_number', e.target.value)}
                                    className="mt-1"
                                    placeholder="הזן מספר רישיון"
                                />
                            </div>

                            <div>
                                <Label htmlFor="business_license_issuing_authority">רשות מנפיקה</Label>
                                <Input
                                    id="business_license_issuing_authority"
                                    value={formData.business_license_issuing_authority || ''}
                                    onChange={(e) => handleChange('business_license_issuing_authority', e.target.value)}
                                    className="mt-1"
                                    placeholder="עיריית..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="business_license_start_date">תאריך תחילת תוקף</Label>
                                    <Input
                                        type="date"
                                        id="business_license_start_date"
                                        value={formData.business_license_start_date?.split('T')[0] || ''}
                                        onChange={(e) => handleChange('business_license_start_date', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="business_license_end_date">תאריך סיום תוקף</Label>
                                    <Input
                                        type="date"
                                        id="business_license_end_date"
                                        value={formData.business_license_end_date?.split('T')[0] || ''}
                                        onChange={(e) => handleChange('business_license_end_date', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>מסמך רישיון עסק</Label>
                                {formData.business_license_doc_url ? (
                                    <div className="flex items-center gap-2 p-2 bg-white rounded border">
                                        <FileImage className="w-4 h-4" />
                                        <a
                                            href={formData.business_license_doc_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex-1 truncate"
                                        >
                                            צפה בקובץ
                                        </a>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={removeFile}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileUpload(e.target.files[0])}
                                            className="hidden"
                                            id="business-license-upload"
                                        />
                                        <label
                                            htmlFor="business-license-upload"
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100"
                                        >
                                            {isUploading ? (
                                                <>מעלה...</>
                                            ) : (
                                                <>
                                                    <Upload className="w-4 h-4" />
                                                    העלה קובץ
                                                </>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
                        <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                            <Save className="ml-2 h-4 w-4" />
                            {isSaving ? 'שומר...' : 'שמירה'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}