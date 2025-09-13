
import React, { useState, useEffect } from 'react';
import { NetworkContact } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function NetworkContactForm({ open, onOpenChange, contact, onSave }) {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        secondary_phone: '',
        role_title: '', // Added new field
        role_type: 'network_employee'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (contact) {
            setFormData({
                ...contact,
                role_title: contact.role_title || '' // Initialize role_title, ensuring it's a string
            });
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                phone: '',
                secondary_phone: '',
                role_title: '', // Initialize for new contacts
                role_type: 'network_employee'
            });
        }
    }, [contact, open]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, role_type: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (contact) {
                await NetworkContact.update(contact.id, formData);
            } else {
                await NetworkContact.create(formData);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save contact:", error);
            alert("שגיאה בשמירת איש הקשר.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>{contact ? 'עריכת איש קשר' : 'יצירת איש קשר חדש'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="first_name">שם פרטי</Label>
                            <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="last_name">שם משפחה</Label>
                            <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="phone">טלפון</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label htmlFor="secondary_phone">טלפון נוסף (אופציונלי)</Label>
                        <Input id="secondary_phone" name="secondary_phone" value={formData.secondary_phone} onChange={handleChange} />
                    </div>
                     <div>
                        <Label htmlFor="role_title">תפקיד</Label>
                        <Input id="role_title" name="role_title" value={formData.role_title} onChange={handleChange} required placeholder="לדוגמה: מנהל תפעול, אינסטלטור..." />
                    </div>
                    <div>
                        <Label htmlFor="role_type">סיווג תפקיד</Label> {/* Updated label */}
                        <Select value={formData.role_type} onValueChange={handleSelectChange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="network_employee">עובד רשת</SelectItem>
                                <SelectItem value="external_supplier">ספק חיצוני</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'שומר...' : 'שמור'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
