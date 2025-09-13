import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar, Clock, User, Type } from 'lucide-react';

export default function MeetingForm({ isOpen, onClose, onSave, meeting }) {
    const [formData, setFormData] = useState({
        meeting_date: new Date(),
        attendees: '',
        title: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (meeting) {
            setFormData({
                meeting_date: new Date(meeting.meeting_date),
                attendees: meeting.attendees || '',
                title: meeting.title || '',
                notes: meeting.notes || ''
            });
        } else {
            setFormData({
                meeting_date: new Date(),
                attendees: '',
                title: '',
                notes: ''
            });
        }
    }, [meeting, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave({
                ...formData,
                meeting_date: formData.meeting_date.toISOString(),
            });
            onClose();
        } catch (error) {
            console.error("Failed to save meeting:", error);
            alert("שגיאה בשמירת הפגישה.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{ 'align': [] }],
            ['link'],
            ['clean']
        ],
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] md:max-w-3xl lg:max-w-5xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{meeting ? 'עריכת פגישה' : 'יצירת פגישה חדשה'}</DialogTitle>
                    <DialogDescription>
                        תעד כאן את פרטי הפגישה כדי שתוכל לחזור אליהם בעתיד.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        <Calendar className="w-4 h-4" />
                        <span>תאריך:</span>
                        <span className="font-semibold">{format(formData.meeting_date, 'd MMMM yyyy', { locale: he })}</span>
                        <Clock className="w-4 h-4 ml-4" />
                        <span>שעה:</span>
                         <span className="font-semibold">{format(formData.meeting_date, 'HH:mm')}</span>
                    </div>

                    <div>
                        <Label htmlFor="title" className="flex items-center gap-2 mb-1"><Type className="w-4 h-4" />כותרת הפגישה</Label>
                        <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                    </div>

                    <div>
                        <Label htmlFor="attendees" className="flex items-center gap-2 mb-1"><User className="w-4 h-4" />עם מי הפגישה?</Label>
                        <Input id="attendees" value={formData.attendees} onChange={(e) => setFormData({ ...formData, attendees: e.target.value })} required />
                    </div>

                    <div>
                         <Label className="flex items-center gap-2 mb-1">סיכום הפגישה</Label>
                        <ReactQuill
                            theme="snow"
                            value={formData.notes}
                            onChange={(value) => setFormData({ ...formData, notes: value })}
                            modules={modules}
                            className="bg-white"
                            style={{ height: '300px' }}
                        />
                    </div>
                    
                    <DialogFooter className="pt-12">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>ביטול</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'שומר...' : (meeting ? 'שמור שינויים' : 'צור פגישה')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}