import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MinistryAudit } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Building, FileText, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function MinistryAuditDetails() {
    const [audit, setAudit] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const auditId = urlParams.get('id');
        if (auditId) {
            loadAudit(auditId);
        }
    }, [location]);

    const loadAudit = async (auditId) => {
        try {
            const auditData = await MinistryAudit.get(auditId);
            setAudit(auditData);
        } catch (error) {
            console.error('Error loading audit:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div>טוען פרטי ביקורת...</div>;
    if (!audit) return <div>ביקורת לא נמצאה</div>;

    const responses = audit.ministry_responses?.responses || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to={createPageUrl('MinistryAudits')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4" />
                    חזרה לביקורות משרד התמ״ת
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6 text-purple-600" />
                    פרטי ביקורת משרד התמ״ת פנימית
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>פרטי הביקורת</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">סניף</p>
                                <p className="font-medium">{audit.branchName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">תאריך ביקורת</p>
                                <p className="font-medium">{format(new Date(audit.audit_date), 'dd/MM/yyyy')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-sm text-gray-500">מבקר</p>
                                <p className="font-medium">{audit.auditor_name}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>שאלות ותשובות משרד התמ״ת</CardTitle>
                </CardHeader>
                <CardContent>
                    {responses.length > 0 ? (
                        <div className="space-y-4">
                            {responses.map((response, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="font-medium mb-3">{response.question_text}</h3>
                                    <div className="flex items-center justify-between">
                                        <Badge variant={response.response_value === "לא תקין" ? "destructive" : "secondary"}>
                                            {response.response_value || 'לא נרשמה תשובה'}
                                        </Badge>
                                        {response.file_urls && response.file_urls.length > 0 && (
                                            <div className="flex gap-2">
                                                {response.file_urls.map((url, fileIndex) => (
                                                    <a key={fileIndex} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                        <FileText className="w-5 h-5" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">אין תשובות רלוונטיות</p>
                            <p className="text-sm">לא נמצאו תשובות מביקורת הרשת הקשורות למשרד התמ״ת</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}