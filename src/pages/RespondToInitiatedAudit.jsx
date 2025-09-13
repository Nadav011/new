import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CustomerComplaint, Branch } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCw, Send, ArrowLeft, User, Phone, Calendar, Star, FileText } from 'lucide-react';
import FullPageError from '../components/FullPageError';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import RatingSelector from '../components/RatingSelector';


export default function RespondToInitiatedAudit() {
    const location = useLocation();
    const navigate = useNavigate();
    const [audit, setAudit] = useState(null);
    const [branch, setBranch] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [response, setResponse] = useState({
        handling_method: '',
        resolution_details: '',
        status: ''
    });

    const auditId = new URLSearchParams(location.search).get('id');

    const fetchData = async () => {
        if (!auditId) {
            setError({ message: 'לא סופק מזהה ביקורת.' });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const auditData = await CustomerComplaint.get(auditId);
            setAudit(auditData);
            setResponse({
                handling_method: auditData.handling_method || '',
                resolution_details: auditData.resolution_details || '',
                status: auditData.status || ''
            });

            if (auditData.branch_id) {
                const branchData = await Branch.get(auditData.branch_id);
                setBranch(branchData);
            }
        } catch (err) {
            console.error("Failed to fetch audit data:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [auditId]);

    const handleChange = (field, value) => {
        setResponse(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!response.status) {
            alert('יש לבחור סטטוס טיפול.');
            return;
        }
        
        try {
            await CustomerComplaint.update(auditId, response);
            alert('התגובה נשמרה בהצלחה!');
            navigate(createPageUrl('MyInitiatedAuditsList'));
        } catch (error) {
            console.error('Error saving response:', error);
            alert('שגיאה בשמירת התגובה.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-600" />
            </div>
        );
    }

    if (error) {
        return <FullPageError errorTitle="שגיאה בטעינת הביקורת" errorMessage={error.message} onRetry={fetchData} />;
    }

    const renderRating = (label, value) => (
        <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">{label}:</span>
            <RatingSelector value={value} readOnly={true} />
        </div>
    );
    
    return (
        <div dir="rtl" className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">מענה לביקורת יזומה - {branch?.name}</h1>
                    <p className="text-gray-500">מסך טיפול במשוב לקוח שהתקבל.</p>
                </div>
                 <Button variant="outline" onClick={() => navigate(createPageUrl('MyInitiatedAuditsList'))}>
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    חזרה לרשימת הביקורות
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>פרטי הביקורת</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                            <User className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="font-semibold">שם הלקוח</p>
                                <p>{audit.customer_name}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                            <Phone className="w-5 h-5 text-gray-600" />
                             <div>
                                <p className="font-semibold">טלפון</p>
                                <p>{audit.customer_phone}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md col-span-full">
                            <Calendar className="w-5 h-5 text-gray-600" />
                             <div>
                                <p className="font-semibold">תאריך קבלת המשוב</p>
                                <p>{format(new Date(audit.complaint_date), 'd MMMM yyyy, HH:mm', { locale: he })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        <h3 className="font-semibold text-lg">דירוגים</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            {audit.delivery_time_rating && renderRating("זמני משלוח", audit.delivery_time_rating)}
                            {audit.food_quality_rating && renderRating("איכות האוכל", audit.food_quality_rating)}
                            {audit.service_quality_rating && renderRating("איכות השירות", audit.service_quality_rating)}
                            {audit.cleanliness_rating && renderRating("ניקיון", audit.cleanliness_rating)}
                            {audit.will_return_rating && renderRating("האם יחזור", audit.will_return_rating)}
                        </div>
                    </div>
                    
                    {audit.customer_feedback && (
                        <div className="space-y-2 pt-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> משוב הלקוח</h3>
                            <div className="p-4 bg-gray-50 border rounded-md">
                                <p className="text-gray-700 whitespace-pre-wrap">{audit.customer_feedback}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>טיפול ותגובת הסניף</CardTitle>
                        <CardDescription>כאן יש למלא את פרטי הטיפול במשוב ולשנות את הסטטוס בהתאם.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="handling_method">דרך הטיפול</Label>
                            <Textarea 
                                id="handling_method" 
                                value={response.handling_method} 
                                onChange={e => handleChange('handling_method', e.target.value)}
                                placeholder="לדוגמה: יצרנו קשר עם הלקוח, הוצע פיצוי, הודרכו העובדים..."
                            />
                        </div>
                        <div>
                            <Label htmlFor="resolution_details">סיכום ופתרון</Label>
                            <Textarea 
                                id="resolution_details" 
                                value={response.resolution_details} 
                                onChange={e => handleChange('resolution_details', e.target.value)}
                                placeholder="סיכום קצר של התהליך והפתרון שניתן."
                            />
                        </div>
                        <div>
                            <Label htmlFor="status">סטטוס טיפול</Label>
                            <Select value={response.status} onValueChange={(value) => handleChange('status', value)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר סטטוס..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="פתוחה">פתוחה</SelectItem>
                                    <SelectItem value="בטיפול">בטיפול</_SelectItem>
                                    <SelectItem value="סגורה">סגורה</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit">
                                <Send className="ml-2 h-4 w-4" />
                                שמור תגובה
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}