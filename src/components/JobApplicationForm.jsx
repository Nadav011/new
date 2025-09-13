import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from 'lucide-react';

const genderOptions = ["זכר", "נקבה", "אחר / לא מעוניינ/ת לרשום"];
const applicantStatusOptions = ["תלמיד/סטודנט", "לפני צבא", "חייל/ת", "אחרי צבא"];

export default function JobApplicationForm({ open, onOpenChange, onSave, application, branches, defaultBranchId }) {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (application) {
            setFormData(application);
        } else {
            setFormData({
                branch_id: defaultBranchId || (branches?.length > 0 ? branches[0].id : ''),
                full_name: '',
                phone_number: '',
                gender: genderOptions[0],
                age: '',
                city: '',
                applicant_status: applicantStatusOptions[0],
                availability: '',
                experience: '',
                process_status: 'חדש',
                notes: ''
            });
        }
    }, [application, open, defaultBranchId, branches]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = { ...formData, age: parseInt(formData.age, 10) };
        if (!application) {
             dataToSave.application_date = new Date().toISOString();
        }
        onSave(dataToSave);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{application ? 'עריכת פרטי מועמד' : 'הוספת מועמד חדש'}</DialogTitle>
                    <DialogDescription>
                        {application ? `עדכון פרטים עבור ${application.full_name}` : "מלא את פרטי המועמד. שדות עם כוכבית (*) הינם שדות חובה."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto px-2">
                        {branches && branches.length > 1 && (
                            <div>
                                <Label htmlFor="branch_id">סניף רלוונטי *</Label>
                                <Select value={formData.branch_id} onValueChange={(value) => handleChange('branch_id', value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="full_name">שם ושם משפחה *</Label>
                                <Input id="full_name" value={formData.full_name || ''} onChange={(e) => handleChange('full_name', e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="phone_number">מספר נייד *</Label>
                                <Input id="phone_number" value={formData.phone_number || ''} onChange={(e) => handleChange('phone_number', e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="gender">מגדר *</Label>
                                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {genderOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="age">גיל *</Label>
                                <Input id="age" type="number" value={formData.age || ''} onChange={(e) => handleChange('age', e.target.value)} required />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="city">עיר מגורים *</Label>
                            <Input id="city" value={formData.city || ''} onChange={(e) => handleChange('city', e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="applicant_status">סטטוס *</Label>
                            <Select value={formData.applicant_status} onValueChange={(value) => handleChange('applicant_status', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {applicantStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="availability">זמינות *</Label>
                            <Textarea id="availability" placeholder="אם תלמיד/סטודנט - שעות סיום לימודים. אם חייל/ת - מאיזו שעה פנוי ובאילו ימים." value={formData.availability || ''} onChange={(e) => handleChange('availability', e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="experience">ניסיון *</Label>
                            <Textarea id="experience" placeholder="נא לרשום ניסיון בכל עבודה שהיא, סוג העבודה ומשך הזמן." value={formData.experience || ''} onChange={(e) => handleChange('experience', e.target.value)} required />
                        </div>
                         <div>
                            <Label htmlFor="notes">הערות פנימיות</Label>
                            <Textarea id="notes" placeholder="הערות לגבי המועמד, סטטוס טיפול וכו'..." value={formData.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter className="border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
                        <Button type="submit"><Save className="ml-2 h-4 w-4" /> שמור</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}