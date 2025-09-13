import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Save } from 'lucide-react';

export default function NoteForm({ open, onOpenChange, note, onSave }) {
    const [formData, setFormData] = useState({ title: '', content: '', color: 'default' });

    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title || '',
                content: note.content || '',
                color: note.color || 'default',
            });
        } else {
            setFormData({ title: '', content: '', color: 'default' });
        }
    }, [note, open]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>{note ? 'עריכת פתק' : 'יצירת פתק חדש'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <Input
                        placeholder="כותרת"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="text-lg font-semibold"
                    />
                    <Textarea
                        placeholder="כתוב פתק..."
                        value={formData.content}
                        onChange={(e) => handleChange('content', e.target.value)}
                        rows={8}
                    />
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
                        <Button type="submit">
                            <Save className="ml-2 h-4 w-4" />
                            שמור פתק
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}