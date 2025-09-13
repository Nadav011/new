
import React, { useState, useEffect } from 'react';
import { TrainingRecord } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save } from 'lucide-react';
import { addMonths, formatISO } from 'date-fns';

export default function TrainingRecordForm({ open, onOpenChange, branch, allTrainings, onSave }) {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (branch) {
            setFormData({
                branch_id: branch.id,
                training_id: '',
                completion_date: new Date().toISOString().slice(0, 10),
                trainer_name: '',
                attendees: ''
            });
        }
    }, [branch, open]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.training_id || !formData.completion_date) {
            alert('יש לבחור הדרכה ולציין תאריך.');
            return;
        }
        setIsSaving(true);
        try {
            const selectedTraining = allTrainings.find(t => t.id === formData.training_id);
            let next_due_date = null;
            if (selectedTraining && selectedTraining.frequency_in_months > 0) {
                const completionDate = new Date(formData.completion_date);
                next_due_date = formatISO(addMonths(completionDate, selectedTraining.frequency_in_months), { representation: 'date' });
            }
            
            const dataToSave = {
                ...formData,
                completion_date: new Date(formData.completion_date).toISOString(),
                next_due_date: next_due_date,
            };

            await TrainingRecord.create(dataToSave);
            onSave();
        } catch (error) {
            console.error("Failed to save training record:", error);
            alert("שגיאה ברישום ההדרכה.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!branch) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>רישום הדרכה חדשה</DialogTitle>
                    <DialogDescription>
                        רישום הדרכה עבור סניף: <span className="font-bold">{branch.name}</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="training_id">סוג הדרכה</Label>
                        <Select onValueChange={(v) => handleChange('training_id', v)} value={formData.training_id || ''} required>
                            <SelectTrigger><SelectValue placeholder="בחר סוג הדרכה" /></SelectTrigger>
                            <SelectContent>
                                {allTrainings.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="completion_date">תאריך ביצוע</Label>
                        <Input id="completion_date" type="date" value={formData.completion_date || ''} onChange={(e) => handleChange('completion_date', e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="trainer_name">שם המדריך</Label>
                        <Input id="trainer_name" value={formData.trainer_name || ''} onChange={(e) => handleChange('trainer_name', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="attendees">שמות משתתפים</Label>
                        <Textarea id="attendees" placeholder="רשום כל משתתף בשורה חדשה..." value={formData.attendees || ''} onChange={(e) => handleChange('attendees', e.target.value)} />
                    </div>
                </form>
                 <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
                    <Button type="submit" onClick={handleSubmit} disabled={isSaving}>
                        <Save className="ml-2 h-4 w-4" />
                        {isSaving ? 'שומר...' : 'שמור'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
