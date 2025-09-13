
import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintTopic } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Save, Upload, X, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge"; // Added
import { CheckSquare, Square, Plus, BarChart2 } from 'lucide-react'; // Added

export default function FranchiseeComplaintForm({ open, onOpenChange, complaint, onSave, branches, currentUser }) {
    const [formData, setFormData] = useState({});
    const [topics, setTopics] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // Check if current user is a branch owner (including setup branch owner)
    const isBranchOwner = currentUser?.user_type === 'branch_owner' || currentUser?.user_type === 'setup_branch_owner';
    const isAdmin = currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager';

    useEffect(() => {
        if (open) {
            loadTopics();
            if (complaint) {
                setFormData({
                    ...complaint,
                    complaint_date: complaint.complaint_date ? new Date(complaint.complaint_date).toISOString().slice(0, 16) : '',
                    file_urls: complaint.file_urls || []
                });
            } else {
                // For new complaints
                const now = new Date();
                const newComplaintData = {
                    complaint_date: now.toISOString().slice(0, 16),
                    complainant_name: '',
                    complainant_contact: '',
                    complaint_topic: '',
                    complaint_details: '',
                    file_urls: []
                };

                // If user is branch owner, auto-select their branch and set default values
                if (isBranchOwner && currentUser?.assigned_branch_id) {
                    newComplaintData.branch_id = currentUser.assigned_branch_id;
                    // Don't set branch_name here as it will be determined from branches list
                } else {
                    newComplaintData.branch_id = '';
                    newComplaintData.branch_name = ''; // Initialize branch_name for non-branch owners
                }

                // For admin users, include admin-only fields
                if (isAdmin) {
                    newComplaintData.received_by = '';
                    newComplaintData.handling_method = '';
                    newComplaintData.status = 'פתוחה';
                    newComplaintData.resolution_details = '';
                }

                setFormData(newComplaintData);
            }
        }
    }, [open, complaint, currentUser, isBranchOwner, isAdmin]);

    const loadTopics = async () => {
        try {
            const topicsData = await ComplaintTopic.list();
            const activeTopics = topicsData.filter(t => t.is_active).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            setTopics(activeTopics);
        } catch (error) {
            console.error("Failed to load topics:", error);
        }
    };

    const handleBranchChange = (branchId) => {
        const selectedBranch = branches.find(b => b.id === branchId);
        setFormData(prev => ({
            ...prev,
            branch_id: branchId,
            branch_name: selectedBranch ? selectedBranch.name : ''
        }));
    };

    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;

        setUploadingFiles(true);
        try {
            const uploadPromises = Array.from(files).map(file => UploadFile({ file }));
            const results = await Promise.all(uploadPromises);
            const newUrls = results.map(result => result.file_url);
            setFormData(prev => ({
                ...prev,
                file_urls: [...(prev.file_urls || []), ...newUrls]
            }));
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('שגיאה בהעלאת קבצים');
        } finally {
            setUploadingFiles(false);
        }
    };

    const removeFile = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            file_urls: prev.file_urls.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation based on user type
        if (!formData.branch_id || !formData.complaint_topic || !formData.complaint_details) {
            alert('יש למלא את כל השדות החובה');
            return;
        }

        // Additional validation for admin users
        if (isAdmin && !formData.received_by) {
            alert('יש למלא את שדה "נקלט ע"י"');
            return;
        }

        setIsSaving(true);
        try {
            const submitData = {
                ...formData,
                complaint_date: new Date(formData.complaint_date).toISOString()
            };

            // For branch owners, set default values for admin-only fields if not provided or to be defaulted
            if (isBranchOwner) {
                submitData.received_by = currentUser.full_name || 'זכיין';
                submitData.status = 'פתוחה';
                submitData.handling_method = ''; // Ensure these are reset or empty if branch owner is submitting
                submitData.resolution_details = ''; // Ensure these are reset or empty if branch owner is submitting
            }

            if (complaint) {
                await Complaint.update(complaint.id, submitData);
            } else {
                await Complaint.create(submitData);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save complaint:", error);
            alert('שגיאה בשמירת התלונה');
        } finally {
            setIsSaving(false);
        }
    };

    // Get the branch name for display if branch is pre-selected
    const selectedBranch = branches.find(b => b.id === formData.branch_id);
    const displayBranchName = selectedBranch ? selectedBranch.name : formData.branch_name;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{complaint ? 'עריכת תלונת זכיין' : 'הוספת תלונת זכיין חדשה'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="branch_id">סניף *</Label>
                            {isBranchOwner ? (
                                // For branch owners, show the branch name as read-only
                                <div className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                                    {displayBranchName || 'הסניף שלך'}
                                </div>
                            ) : (
                                // For admin users, show the normal branch selection
                                <Select
                                    value={formData.branch_id || ''}
                                    onValueChange={handleBranchChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="בחר סניף" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="complaint_date">תאריך ושעת קבלה *</Label>
                            <Input
                                id="complaint_date"
                                type="datetime-local"
                                value={formData.complaint_date || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, complaint_date: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="complainant_name">שם הזכיין *</Label>
                            <Input
                                id="complainant_name"
                                value={formData.complainant_name || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, complainant_name: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="complainant_contact">פרטי קשר</Label>
                            <Input
                                id="complainant_contact"
                                value={formData.complainant_contact || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, complainant_contact: e.target.value }))}
                                placeholder="טלפון/אימייל"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="complaint_topic">נושא התלונה *</Label>
                        <Select value={formData.complaint_topic || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, complaint_topic: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="בחר נושא" />
                            </SelectTrigger>
                            <SelectContent>
                                {topics.map(topic => (
                                    <SelectItem key={topic.id} value={topic.name}>
                                        {topic.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="complaint_details">פירוט התלונה *</Label>
                        <Textarea
                            id="complaint_details"
                            value={formData.complaint_details || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, complaint_details: e.target.value }))}
                            className="h-24"
                            required
                        />
                    </div>

                    {/* Admin-only fields - hidden for branch owners */}
                    {isAdmin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="received_by">נקלט ע"י *</Label>
                                    <Input
                                        id="received_by"
                                        value={formData.received_by || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, received_by: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="status">סטטוס</Label>
                                    <Select value={formData.status || 'פתוחה'} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="פתוחה">פתוחה</SelectItem>
                                            <SelectItem value="בטיפול">בטיפול</SelectItem>
                                            <SelectItem value="סגורה">סגורה</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="handling_method">דרך הטיפול</Label>
                                <Textarea
                                    id="handling_method"
                                    value={formData.handling_method || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, handling_method: e.target.value }))}
                                    className="h-20"
                                />
                            </div>

                            {formData.status === 'סגורה' && (
                                <div>
                                    <Label htmlFor="resolution_details">פירוט הפתרון וסגירת התלונה</Label>
                                    <Textarea
                                        id="resolution_details"
                                        value={formData.resolution_details || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, resolution_details: e.target.value }))}
                                        className="h-20"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div>
                        <Label>קבצים מצורפים</Label>
                        <div className="space-y-2">
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={(e) => handleFileUpload(e.target.files)}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                            >
                                {uploadingFiles ? (
                                    <>מעלה קבצים...</>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        העלה קבצים
                                    </>
                                )}
                            </label>

                            {formData.file_urls && formData.file_urls.length > 0 && (
                                <div className="space-y-2">
                                    {formData.file_urls.map((url, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                                            <FileText className="w-4 h-4" />
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline flex-1"
                                            >
                                                קובץ מצורף {index + 1}
                                            </a>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFile(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            ביטול
                        </Button>
                        <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                            <Save className="ml-2 h-4 w-4" />
                            {isSaving ? 'שומר...' : 'שמירה'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
