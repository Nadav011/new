import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BranchSetup } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Building } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function NewBranchSetup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        branch_name: '',
        franchisee_name: '',
        franchisee_phone: '',
        franchisee_email: '',
        planned_location: '',
        planned_city: '',
        status: 'בתהליך',
        start_date: new Date(),
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date, field) => {
        setFormData(prev => ({ ...prev, [field]: date }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newSetup = await BranchSetup.create(formData);
            navigate(createPageUrl('BranchSetupDetails', { id: newSetup.id }));
        } catch (error) {
            console.error("Failed to create new branch setup:", error);
            alert('שגיאה ביצירת הקמת סניף חדשה.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="w-6 h-6" />
                        הקמת סניף חדש
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="branch_name">שם הסניף</Label>
                                <Input id="branch_name" name="branch_name" value={formData.branch_name} onChange={handleChange} required />
                            </div>
                             <div>
                                <Label htmlFor="franchisee_name">שם הזכיין</Label>
                                <Input id="franchisee_name" name="franchisee_name" value={formData.franchisee_name} onChange={handleChange} required />
                            </div>
                            <div>
                                <Label htmlFor="franchisee_phone">טלפון הזכיין</Label>
                                <Input id="franchisee_phone" name="franchisee_phone" value={formData.franchisee_phone} onChange={handleChange} required />
                            </div>
                            <div>
                                <Label htmlFor="franchisee_email">אימייל הזכיין (לשיוך בעלות)</Label>
                                <Input id="franchisee_email" name="franchisee_email" type="email" value={formData.franchisee_email} onChange={handleChange} placeholder="owner@example.com" />
                            </div>
                            <div>
                                <Label htmlFor="planned_city">עיר מתוכננת</Label>
                                <Input id="planned_city" name="planned_city" value={formData.planned_city} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="planned_location">כתובת מתוכננת</Label>
                                <Input id="planned_location" name="planned_location" value={formData.planned_location} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="start_date">תאריך תחילת התהליך</Label>
                                <DatePicker date={formData.start_date} setDate={(date) => handleDateChange(date, 'start_date')} />
                            </div>
                             <div>
                                <Label htmlFor="target_opening_date">תאריך יעד לפתיחה</Label>
                                <DatePicker date={formData.target_opening_date} setDate={(date) => handleDateChange(date, 'target_opening_date')} />
                            </div>
                        </div>
                        
                        <div className="flex justify-end pt-4">
                            <Button type="submit">המשך וצור הקמה</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}