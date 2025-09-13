
import React, { useState, useEffect } from 'react';
import { BranchSetup } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, StickyNote } from 'lucide-react';

export default function BranchSetupNotesDialog({ open, onOpenChange, setup, onSave }) {
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (setup) {
            setNotes(setup.notes || '');
        }
    }, [setup]);

    const handleSave = async () => {
        if (!setup) return;
        setIsSaving(true);
        try {
            await BranchSetup.update(setup.id, { notes: notes });
            onSave(); // This will trigger a refresh in the parent component
        } catch (error) {
            console.error("Failed to save notes:", error);
            alert("שגיאה בשמירת ההערות.");
        } finally {
            setIsSaving(false);
            onOpenChange(false);
        }
    };

    if (!setup) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <StickyNote className="w-5 h-5 text-blue-500" />
                        הערות להקמה: {setup.branch_name}
                    </DialogTitle>
                    <DialogDescription>
                        כאן ניתן להוסיף ולערוך הערות כלליות על תהליך ההקמה.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="notes-textarea">תוכן ההערות</Label>
                    <Textarea
                        id="notes-textarea"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="כתוב כאן את ההערות שלך..."
                        rows={10}
                        className="resize-y"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="ml-2 h-4 w-4" />
                        {isSaving ? 'שומר...' : 'שמור הערות'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
