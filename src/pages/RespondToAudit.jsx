
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { Audit, Branch, BranchAuditResponse, AuditResponse, User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, FileText, Upload, Trash2, Save, Send, ArrowRight, CheckCircle, Info, Loader2, Building, User as UserIcon } from 'lucide-react';
import FullPageError from '../components/FullPageError';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper to safely format dates
const safeFormatDate = (dateString, formatStr = 'dd/MM/yyyy HH:mm') => {
    if (!dateString) return 'לא זמין';
    try {
        return format(parseISO(dateString), formatStr, { locale: he });
    } catch (e) {
        return 'תאריך לא תקין';
    }
};

// Component for a single response question
const ResponseQuestionItem = ({ question, auditorResponse, branchResponse, onResponseChange, isSubmitting }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            const newFileUrls = [...(branchResponse?.file_urls || []), file_url];
            onResponseChange('file_urls', newFileUrls);
        } catch (uploadError) {
            console.error("File upload failed:", uploadError);
            alert("שגיאה בהעלאת הקובץ.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = (indexToRemove) => {
        const newFileUrls = (branchResponse?.file_urls || []).filter((_, index) => index !== indexToRemove);
        onResponseChange('file_urls', newFileUrls);
    };

    if (question.question_type === 'header') {
        return (
            <div className="py-4 border-b-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">{question.question_text}</h3>
            </div>
        );
    }
    
    return (
        <Card className="my-4">
            <CardHeader>
                <CardTitle className="text-base">{question.question_text}</CardTitle>
                <CardDescription>
                    <div className="mt-2 p-3 bg-blue-50 border-r-4 border-blue-400 rounded">
                        <p className="font-semibold text-blue-800">תשובת המבקר:</p>
                        <p className="text-sm text-gray-700">{auditorResponse?.response_value || "לא ניתנה תשובה טקסטואלית"}</p>
                        {auditorResponse?.file_urls?.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {auditorResponse.file_urls.map((url, index) => (
                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> קובץ מצורף {index + 1}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label>סטטוס טיפול</Label>
                        <Select
                            value={branchResponse?.status || 'טרם בוצע'}
                            onValueChange={(value) => onResponseChange('status', value)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="בחר סטטוס..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="טרם בוצע">טרם בוצע</SelectItem>
                                <SelectItem value="בתהליך">בתהליך</SelectItem>
                                <SelectItem value="בוצע">בוצע</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>הערות / פירוט</Label>
                        <Textarea
                            placeholder="הערות לגבי הטיפול..."
                            value={branchResponse?.comment || ''}
                            onChange={(e) => onResponseChange('comment', e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <Label>קבצים מצורפים</Label>
                        <div className="space-y-2">
                            {(branchResponse?.file_urls || []).map((url, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 truncate hover:underline">
                                        {`קובץ ${index + 1}`}
                                    </a>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)} disabled={isSubmitting}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2">
                            <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {isUploading ? 'מעלה קובץ...' : 'העלה קובץ'}
                                <Input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading || isSubmitting} />
                            </label>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function RespondToAudit() {
    const [audit, setAudit] = useState(null);
    const [branch, setBranch] = useState(null);
    const [auditorResponses, setAuditorResponses] = useState({});
    const [branchAuditResponse, setBranchAuditResponse] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const auditId = params.get('audit_id') || params.get('id');

    const loadData = useCallback(async () => {
        if (!auditId) {
            setError("מזהה הביקורת חסר מהקישור.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const [auditData, user] = await Promise.all([
                Audit.get(auditId),
                User.me()
            ]);

            if (!auditData) throw new Error("לא נמצאה ביקורת עם המזהה שסופק.");
            if (!auditData.response_required) throw new Error("ביקורת זו אינה דורשת מענה.");

            setAudit(auditData);
            setCurrentUser(user);

            const [branchData, existingResponseResult, auditorResponsesResult] = await Promise.all([
                Branch.get(auditData.branch_id),
                BranchAuditResponse.filter({ audit_id: auditId }),
                AuditResponse.filter({ audit_id: auditId })
            ]);
            
            setBranch(branchData);
            const auditorResponsesMap = new Map(auditorResponsesResult.map(r => [r.question_id, r]));
            setAuditorResponses(auditorResponsesMap);
            
            let responseToEdit;
            if (existingResponseResult && existingResponseResult.length > 0) {
                responseToEdit = existingResponseResult[0];
                if (responseToEdit.status === 'submitted') {
                     throw new Error("כבר הוגשה תגובה עבור ביקורת זו. לא ניתן לערוך.");
                }
            } else {
                responseToEdit = {
                    audit_id: auditId,
                    branch_id: auditData.branch_id,
                    responses_by_question: {},
                    response_summary: '',
                    status: 'in_progress',
                };
            }
            setBranchAuditResponse(responseToEdit);

        } catch (err) {
            console.error("Error loading data for response:", err);
            setError(err.message || "שגיאה בטעינת נתוני הביקורת.");
        } finally {
            setIsLoading(false);
        }
    }, [auditId]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleResponseChange = (questionId, field, value) => {
        setBranchAuditResponse(prev => {
            const newResponses = { ...prev.responses_by_question };
            if (!newResponses[questionId]) {
                newResponses[questionId] = { status: 'טרם בוצע', comment: '', file_urls: [] };
            }
            newResponses[questionId][field] = value;
            return { ...prev, responses_by_question: newResponses };
        });
    };
    
    const handleSave = async (isSubmitting = false) => {
        setIsSaving(true);
        try {
            const dataToSave = { ...branchAuditResponse };
            if (isSubmitting) {
                dataToSave.status = 'submitted';
                dataToSave.submitted_by_name = currentUser?.full_name;
                dataToSave.submitted_by_email = currentUser?.email;
            }

            let savedResponse;
            if (dataToSave.id) {
                savedResponse = await BranchAuditResponse.update(dataToSave.id, dataToSave);
            } else {
                savedResponse = await BranchAuditResponse.create(dataToSave);
            }
            setBranchAuditResponse(savedResponse);
            
            if (isSubmitting) {
                alert('התגובה הוגשה בהצלחה!');
                navigate(createPageUrl('AuditDetails') + `?id=${auditId}`);
            } else {
                alert('התקדמותך נשמרה!');
            }
        } catch (err) {
            console.error("Failed to save response:", err);
            alert("שגיאה בשמירת התגובה.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const questions = useMemo(() => 
        audit?.questionnaire_snapshot?.filter(q => q.question_type !== 'header') || [], 
    [audit]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /> <span className="mr-2">טוען...</span></div>;
    }

    if (error) {
        return <FullPageError errorTitle="שגיאה בטעינת מענה לביקורת" errorMessage={error} onRetry={() => navigate(createPageUrl('Audits'))} />;
    }

    if (!audit || !branchAuditResponse) {
        return null; // Should be handled by loading/error states
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6" dir="rtl">
            <Card className="mb-6 bg-gray-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        מענה לביקורת
                    </CardTitle>
                    <CardDescription>
                        ביקורת מסוג "{audit.audit_type}" מתאריך {safeFormatDate(audit.audit_date)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <strong>סניף:</strong> {branch?.name}
                    </div>
                    <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <strong>שם המגיב:</strong> {currentUser?.full_name}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {questions.map(q => (
                    <ResponseQuestionItem
                        key={q.id}
                        question={q}
                        auditorResponse={auditorResponses.get(q.id)}
                        branchResponse={branchAuditResponse.responses_by_question?.[q.id]}
                        onResponseChange={(field, value) => handleResponseChange(q.id, field, value)}
                        isSubmitting={isSaving && branchAuditResponse.status === 'submitted'}
                    />
                ))}
            </div>

            <Card className="mt-6">
                 <CardHeader>
                    <CardTitle>סיכום וסיום</CardTitle>
                </CardHeader>
                <CardContent>
                    <Label>סיכום כללי של התגובה (אופציונלי)</Label>
                    <Textarea 
                        placeholder="כאן ניתן לרשום סיכום כללי של המענה לביקורת..."
                        value={branchAuditResponse.response_summary || ''}
                        onChange={(e) => setBranchAuditResponse(prev => ({...prev, response_summary: e.target.value}))}
                    />
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowRight className="ml-2 w-4 h-4" /> חזרה לפרטי הביקורת
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                            <Save className="ml-2 w-4 h-4" />
                            {isSaving ? 'שומר...' : 'שמור טיוטה'}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
                                    <Send className="ml-2 w-4 h-4" /> הגשה סופית
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>אישור הגשה סופית</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        האם אתה בטוח שברצונך להגיש את התגובה? לאחר ההגשה לא ניתן יהיה לבצע שינויים נוספים.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleSave(true)} className="bg-green-600 hover:bg-green-700">
                                        הגש תגובה
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
