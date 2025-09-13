
import React, { useState, useEffect } from 'react';
import { CustomerComplaint, Branch, BranchOwnership, Notification, PersonalTask, User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Save, X } from 'lucide-react';
import RatingSelector from './RatingSelector';
import { createPageUrl } from '@/utils';
import { SendEmail } from "@/api/integrations"; // Added for email functionality

export default function InitiatedAuditForm({ open, onOpenChange, auditToEdit, branches, currentUser, onSave }) {
    const [formData, setFormData] = useState({
        branch_id: '',
        customer_name: '',
        customer_phone: '',
        customer_feedback: '',
        delivery_time_rating: null,
        food_quality_rating: null,
        service_quality_rating: null,
        cleanliness_rating: null,
        will_return_rating: null,
        handling_method: '',
        status: 'פתוחה'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            if (auditToEdit) {
                // Editing existing audit - populate form with current data
                setFormData({
                    branch_id: auditToEdit.branch_id || '',
                    customer_name: auditToEdit.customer_name || '',
                    customer_phone: auditToEdit.customer_phone || '',
                    customer_feedback: auditToEdit.customer_feedback || '',
                    delivery_time_rating: auditToEdit.delivery_time_rating || null,
                    food_quality_rating: auditToEdit.food_quality_rating || null,
                    service_quality_rating: auditToEdit.service_quality_rating || null,
                    cleanliness_rating: auditToEdit.cleanliness_rating || null,
                    will_return_rating: auditToEdit.will_return_rating || null,
                    handling_method: auditToEdit.handling_method || '',
                    status: auditToEdit.status || 'פתוחה'
                });
            } else {
                // Creating new audit - reset to defaults
                setFormData({
                    branch_id: '',
                    customer_name: '',
                    customer_phone: '',
                    customer_feedback: '',
                    delivery_time_rating: null,
                    food_quality_rating: null,
                    service_quality_rating: null,
                    cleanliness_rating: null,
                    will_return_rating: null,
                    handling_method: '',
                    status: 'פתוחה'
                });
            }
            setError(null);
        }
    }, [open, auditToEdit]);

    // Helper function for sending emails to branch owners
    const sendNotificationEmailToBranchOwners = async (branchId, subject, body) => {
        try {
            const ownerships = await BranchOwnership.filter({ branch_id: branchId });
            if (!ownerships || ownerships.length === 0) {
                console.log(`No owners found for branch ${branchId}. No email sent.`);
                return;
            }

            const ownerUserIds = ownerships.map(o => o.user_id);
            const allUsers = await User.list();
            const owners = allUsers.filter(u => ownerUserIds.includes(u.id));

            for (const owner of owners) {
                if (owner.email) {
                    const personalizedBody = body.replace(/\[שם בעל הסניף\]/g, owner.full_name);
                    await SendEmail({
                        to: owner.email,
                        subject: subject,
                        body: personalizedBody,
                    });
                }
            }
        } catch (error) {
            console.error("Failed to send notification email to branch owners:", error);
            // This error is caught by the parent try-catch in handleSubmit, but logged here for specific context
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.branch_id || !formData.customer_name || !formData.customer_phone) {
            setError('יש למלא את כל השדות החובה: סניף, שם לקוח וטלפון.');
            return;
        }

        if (!formData.delivery_time_rating || !formData.food_quality_rating || 
            !formData.service_quality_rating || !formData.cleanliness_rating || 
            !formData.will_return_rating) {
            setError('יש למלא את כל הדירוגים.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const auditData = {
                ...formData,
                complaint_date: auditToEdit?.complaint_date || new Date().toISOString(),
                // Ensure ratings are numbers
                delivery_time_rating: parseInt(formData.delivery_time_rating),
                food_quality_rating: parseInt(formData.food_quality_rating),
                service_quality_rating: parseInt(formData.service_quality_rating),
                cleanliness_rating: parseInt(formData.cleanliness_rating),
                will_return_rating: parseInt(formData.will_return_rating)
            };

            if (auditToEdit) {
                // Update existing audit
                await CustomerComplaint.update(auditToEdit.id, auditData);
            } else {
                // Create new audit
                const selectedBranch = branches.find(b => b.id === auditData.branch_id);
                if (selectedBranch) {
                    const createdAudit = await CustomerComplaint.create(auditData);
                    
                    // Create notifications, tasks, and send emails for branch owners (only for new audits)
                    try {
                        // --- Send Email Notification ---
                        const emailSubject = `ביקורת יזומה חדשה התקבלה בסניף ${selectedBranch.name}`;
                        const emailBody = `
שלום [שם בעל הסניף],

ביקורת יזומה חדשה התקבלה עבור סניף "${selectedBranch.name}" מלקוח בשם ${auditData.customer_name}.
נדרשת תגובתך וטיפול בביקורת.

לצפייה בביקורת ולהגשת תגובה, אנא היכנס לקישור הבא:
${window.location.origin}${createPageUrl(`RespondToInitiatedAudit?id=${createdAudit.id}`)}

בברכה,
מערכת בקרת רשת - המקסיקני
`;
                        await sendNotificationEmailToBranchOwners(auditData.branch_id, emailSubject, emailBody);
                        // --- End Email Notification ---

                        const branchOwnerships = await BranchOwnership.filter({ branch_id: auditData.branch_id });
                        
                        for (const ownership of branchOwnerships) {
                            await Notification.create({
                                user_id: ownership.user_id,
                                type: 'initiated_audit_received',
                                message: `התקבלה ביקורת יזומה חדשה מלקוח: ${auditData.customer_name} בסניף: ${selectedBranch.name}`,
                                link: createPageUrl(`RespondToInitiatedAudit?id=${createdAudit.id}`),
                                related_entity_id: createdAudit.id
                            });

                            await PersonalTask.create({
                                text: `ביקורת יזומה מלקוח: ${auditData.customer_name}`,
                                subject: `ביקורת יזומה - ${selectedBranch.name}`,
                                status: 'pending',
                                priority: 'high',
                                task_type: 'branch_initiated_audit',
                                assigned_to_user_id: ownership.user_id,
                                branch_id: auditData.branch_id,
                                branch_name: selectedBranch.name,
                                related_initiated_audit_id: createdAudit.id,
                                created_by: currentUser?.full_name || 'מערכת'
                            });
                        }
                    } catch (notificationError) {
                        console.warn('Failed to create notifications or send emails:', notificationError);
                        // Do not re-throw, allow the main save operation to complete if notifications/emails fail.
                    }
                }
            }

            await onSave(auditData);
            
        } catch (err) {
            console.error("Failed to save audit:", err);
            setError('שגיאה בשמירת הביקורת. אנא נסה שוב.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle>
                        {auditToEdit ? 'עריכת ביקורת יזומה' : 'יצירת ביקורת יזומה חדשה'}
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="branch_id">סניף *</Label>
                            <Select 
                                value={formData.branch_id} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר סניף..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="status">סטטוס</Label>
                            <Select 
                                value={formData.status} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                            >
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

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="customer_name">שם הלקוח *</Label>
                            <Input 
                                id="customer_name" 
                                value={formData.customer_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="customer_phone">טלפון הלקוח *</Label>
                            <Input 
                                id="customer_phone" 
                                value={formData.customer_phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                                required
                            />
                        </div>
                    </div>
                        
                    <div>
                        <Label htmlFor="customer_feedback">משוב הלקוח *</Label>
                        <Textarea 
                            id="customer_feedback" 
                            value={formData.customer_feedback}
                            onChange={(e) => setFormData(prev => ({ ...prev, customer_feedback: e.target.value }))}
                            rows={5} 
                            required
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-semibold">דירוגים (1-5) *</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <RatingSelector 
                                label="זמני אספקה" 
                                value={formData.delivery_time_rating}
                                onChange={(value) => setFormData(prev => ({ ...prev, delivery_time_rating: value }))}
                            />
                            <RatingSelector 
                                label="איכות המזון" 
                                value={formData.food_quality_rating}
                                onChange={(value) => setFormData(prev => ({ ...prev, food_quality_rating: value }))}
                            />
                            <RatingSelector 
                                label="איכות השירות" 
                                value={formData.service_quality_rating}
                                onChange={(value) => setFormData(prev => ({ ...prev, service_quality_rating: value }))}
                            />
                            <RatingSelector 
                                label="ניקיון" 
                                value={formData.cleanliness_rating}
                                onChange={(value) => setFormData(prev => ({ ...prev, cleanliness_rating: value }))}
                            />
                            <RatingSelector 
                                label="האם תחזור אלינו?" 
                                value={formData.will_return_rating}
                                onChange={(value) => setFormData(prev => ({ ...prev, will_return_rating: value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="handling_method">דרך הטיפול</Label>
                        <Textarea 
                            id="handling_method" 
                            value={formData.handling_method}
                            onChange={(e) => setFormData(prev => ({ ...prev, handling_method: e.target.value }))}
                            rows={3} 
                            placeholder="תיאור הפעולות שננקטו לטיפול בביקורת..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            <X className="ml-2 h-4 w-4" />
                            ביטול
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            <Save className="ml-2 h-4 w-4" />
                            {isSaving ? 'שומר...' : (auditToEdit ? 'עדכן ביקורת' : 'צור ביקורת')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
