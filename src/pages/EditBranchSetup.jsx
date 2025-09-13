import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BranchSetup } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, RefreshCw } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function EditBranchSetup() {
    const navigate = useNavigate();
    const location = useLocation();
    const [setupId, setSetupId] = useState(null);
    const [formData, setFormData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('id');
        if (id) {
            setSetupId(id);
            BranchSetup.get(id)
                .then(data => {
                    setFormData({
                        ...data,
                        start_date: data.start_date ? new Date(data.start_date) : null,
                        target_opening_date: data.target_opening_date ? new Date(data.target_opening_date) : null,
                        actual_opening_date: data.actual_opening_date ? new Date(data.actual_opening_date) : null,
                    });
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load setup data:", err);
                    setIsLoading(false);
                });
        }
    }, [location.search]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date, field) => {
        setFormData(prev => ({ ...prev, [field]: date }));
    };

    const handleStatusChange = (value) => {
        setFormData(prev => ({ ...prev, status: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await BranchSetup.update(setupId, formData);
            navigate(createPageUrl('BranchSetupDetails', { id: setupId }));
        } catch (error) {
            console.error("Failed to update branch setup:", error);
            alert('שגיאה בעדכון פרטי ההקמה.');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
    }

    if (!formData) {
        return <div>לא נמצאו נתוני הקמה.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="w-6 h-6" />
                        עריכת פרטי הקמה - {formData.branch_name}
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
                                <Input id="franchisee_email" name="franchisee_email" type="email" value={formData.franchisee_email || ''} onChange={handleChange} placeholder="owner@example.com" />
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
                                <Label htmlFor="status">סטטוס הקמה</Label>
                                <Select value={formData.status} onValueChange={handleStatusChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="בתהליך">בתהליך</SelectItem>
                                        <SelectItem value="הושלם">הושלם</SelectItem>
                                        <SelectItem value="הוקפא">הוקפא</SelectItem>
                                        <SelectItem value="בוטל">בוטל</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="start_date">תאריך תחילת התהליך</Label>
                                <DatePicker date={formData.start_date} setDate={(date) => handleDateChange(date, 'start_date')} />
                            </div>
                             <div>
                                <Label htmlFor="target_opening_date">תאריך יעד לפתיחה</Label>
                                <DatePicker date={formData.target_opening_date} setDate={(date) => handleDateChange(date, 'target_opening_date')} />
                            </div>
                            <div>
                                <Label htmlFor="actual_opening_date">תאריך פתיחה בפועל</Label>
                                <DatePicker date={formData.actual_opening_date} setDate={(date) => handleDateChange(date, 'actual_opening_date')} />
                            </div>
                        </div>
                        
                        <div className="flex justify-end pt-4 gap-2">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)}>ביטול</Button>
                            <Button type="submit">שמור שינויים</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}