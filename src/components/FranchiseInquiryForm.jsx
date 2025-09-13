
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from '@/components/ui/date-picker';

export default function FranchiseInquiryForm({ open, onOpenChange, inquiry, onSave }) {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (open) {
            if (inquiry) {
                setFormData({
                    ...inquiry,
                    inquiry_date: inquiry.inquiry_date ? new Date(inquiry.inquiry_date) : new Date(),
                    next_followup_date: inquiry.next_followup_date ? new Date(inquiry.next_followup_date) : null,
                    // New fields for meetings
                    last_meeting_date: inquiry.last_meeting_date ? new Date(inquiry.last_meeting_date) : null,
                    next_meeting_date: inquiry.next_meeting_date ? new Date(inquiry.next_meeting_date) : null,
                    meeting_notes: inquiry.meeting_notes || '' // Ensure it's not undefined
                });
            } else {
                setFormData({
                    full_name: '',
                    phone: '',
                    email: '',
                    city: '',
                    inquiry_date: new Date(),
                    status: 'פנייה חדשה',
                    notes: '',
                    next_followup_date: null,
                    // New fields for meetings
                    last_meeting_date: null,
                    next_meeting_date: null,
                    meeting_notes: ''
                });
            }
        }
    }, [inquiry, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name, date) => {
        setFormData(prev => ({ ...prev, [name]: date }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const statusOptions = ["פנייה חדשה", "בטיפול", "שיחה ראשונית", "פגישה נקבעה", "מתעניין רציני", "מועמד להקמה", "נסגר בהצלחה", "לא רלוונטי"];

    // Determine if meeting fields should be shown based on status
    const showMeetingFields = ['פגישה נקבעה', 'מתעניין רציני', 'מועמד להקמה'].includes(formData.status);

    return (
        <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{inquiry ? 'עריכת פניית זכיינות' : 'הוספת פנייה חדשה'}</DialogTitle>
                    <DialogDescription>
                        {inquiry ? `ערוך את פרטי הפנייה של ${inquiry.full_name}` : 'מלא את פרטי המתעניין החדש.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="full_name">שם מלא</Label>
                            <Input id="full_name" name="full_name" value={formData.full_name || ''} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="phone">טלפון</Label>
                            <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="email">אימייל</Label>
                            <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="city">עיר</Label>
                            <Input id="city" name="city" value={formData.city || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="status">סטטוס</Label>
                            <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                                <SelectTrigger><SelectValue placeholder="בחר סטטוס..." /></SelectTrigger>
                                <SelectContent>{statusOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>תאריך פנייה</Label>
                            <DatePicker date={formData.inquiry_date} setDate={(d) => handleDateChange('inquiry_date', d)} />
                        </div>
                        <div className="md:col-span-2">
                            <Label>תאריך למעקב הבא</Label>
                            <DatePicker date={formData.next_followup_date} setDate={(d) => handleDateChange('next_followup_date', d)} />
                        </div>

                        {showMeetingFields && (
                            <>
                                <div>
                                    <Label>תאריך פגישה אחרונה</Label>
                                    <DatePicker date={formData.last_meeting_date} setDate={(d) => handleDateChange('last_meeting_date', d)} />
                                </div>
                                <div>
                                    <Label>תאריך פגישה הבאה</Label>
                                    <DatePicker date={formData.next_meeting_date} setDate={(d) => handleDateChange('next_meeting_date', d)} />
                                </div>
                            </>
                        )}
                    </div>
                    {showMeetingFields && (
                        <div>
                            <Label htmlFor="meeting_notes">סיכום פגישות</Label>
                            <Textarea id="meeting_notes" name="meeting_notes" value={formData.meeting_notes || ''} onChange={handleChange} rows={3} />
                        </div>
                    )}
                    <div>
                        <Label htmlFor="notes">הערות</Label>
                        <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={5} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
                        <Button type="submit">{inquiry ? 'שמור שינויים' : 'צור פנייה'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
