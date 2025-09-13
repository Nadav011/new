
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Audit, Branch, QuestionnaireSettings, User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import DynamicAuditForm from '../components/DynamicAuditForm';
import FullPageError from '../components/FullPageError';

export default function EditAudit() {
    const location = useLocation();
    const navigate = useNavigate();
    const [auditId, setAuditId] = useState(null);
    const [audit, setAudit] = useState(null);
    const [branches, setBranches] = useState([]);
    const [questionnaireSettings, setQuestionnaireSettings] = useState({});
    const [formData, setFormData] = useState({});
    const [auditScore, setAuditScore] = useState({ totalScore: 0, maxPossibleScore: 0 });
    const [questionResponses, setQuestionResponses] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const checkPermissions = useCallback(async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
            if (user.user_type !== 'admin') {
                setError('אין לך הרשאה לגשת לעמוד זה.');
                // Redirect after a short delay to allow the user to see the message
                setTimeout(() => navigate(createPageUrl('Audits')), 2000);
                return false;
            }
            return true;
        } catch (e) {
            setError('לא ניתן לאמת את הרשאותיך. הנך מועבר/ת לדף הראשי.');
            setTimeout(() => navigate(createPageUrl('Dashboard')), 2000);
            return false;
        }
    }, [navigate]);

    const loadInitialData = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedAudit, branchData, settingsData] = await Promise.all([
                Audit.get(id),
                Branch.list(),
                QuestionnaireSettings.list()
            ]);

            setAudit(fetchedAudit);
            setFormData({
                branch_id: fetchedAudit.branch_id,
                audit_type: fetchedAudit.audit_type,
                audit_date: fetchedAudit.audit_date,
                auditor_name: fetchedAudit.auditor_name,
                summary: fetchedAudit.summary || '',
                positive_points: fetchedAudit.positive_points || '',
                points_for_improvement: fetchedAudit.points_for_improvement || ''
            });
            setBranches(branchData);
            const settingsMap = {};
            settingsData.forEach(setting => {
                settingsMap[setting.questionnaire_type] = setting;
            });
            setQuestionnaireSettings(settingsMap);

            // Note: Audit responses are not loaded here for direct editing or persistence on this page
            // The DynamicAuditForm will start with an empty state for responses,
            // allowing the auditor to re-enter/update if necessary, but these are not persisted
            // via this form's submission based on the current entity structure.
            setQuestionResponses({}); // Reset or initialize question responses

        } catch (err) {
            console.error("Failed to load audit data:", err);
            setError("שגיאה בטעינת נתוני הביקורת.");
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        const initialize = async () => {
            const hasPermission = await checkPermissions();
            if (hasPermission) {
                const params = new URLSearchParams(location.search);
                const id = params.get('id');
                if (id) {
                    setAuditId(id);
                    await loadInitialData(id);
                } else {
                    setError("מזהה ביקורת לא נמצא.");
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        initialize();
    }, [location.search, checkPermissions, loadInitialData]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleScoreChange = (score) => {
        setAuditScore(score);
    };

    const calculateOverallScore = () => {
        if (auditScore.maxPossibleScore === 0) return 0;
        const percentage = (auditScore.totalScore / auditScore.maxPossibleScore) * 10;
        return Math.round(percentage * 10) / 10;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const overallScore = calculateOverallScore();
            
            // Update audit main details and overall score
            await Audit.update(auditId, {
                ...formData,
                overall_score: overallScore
            });

            // Note: The persistence of individual question responses is not handled here
            // based on the updated entity structure and outline. This form primarily updates
            // the main audit metadata and calculated overall score.

            alert('הביקורת עודכנה בהצלחה!');
            navigate(createPageUrl('Audits'));
        } catch (error) {
            console.error("Failed to update audit:", error);
            alert('שגיאה בעדכון הביקורת.');
        } finally {
            setIsSaving(false);
        }
    };

    const questionnaireTypes = [
        "גלויה", "סמויה", "לקוח סמוי - ביקור בעסק", "לקוח סמוי - משלוח",
        "לקוח סמוי - איסוף עצמי", "ריאיון עם מנהל סניף", "ריאיונות עם לקוחות הסניף",
        "ריאיונות עם עובדי הסניף"
    ];

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><RefreshCw className="w-8 h-8 animate-spin" /> טוען...</div>;
    }

    if (error) {
        return <FullPageError errorTitle="שגיאת גישה" errorMessage={error} />;
    }
    
    if (!audit) {
        return <FullPageError errorTitle="שגיאה" errorMessage="לא נמצאה ביקורת." />;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to={createPageUrl('Audits')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowRight className="w-4 h-4" />
                    חזרה לביקורות
                </Link>
                <h1 className="text-2xl font-bold">עריכת ביקורת</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>פרטי הביקורת הכללים</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="branch_id">סניף</Label>
                                    <Select onValueChange={(value) => handleChange('branch_id', value)} value={formData.branch_id || ''} required>
                                        <SelectTrigger><SelectValue placeholder="בחר סניף..." /></SelectTrigger>
                                        <SelectContent>
                                            {branches.map(branch => (
                                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="audit_type">סוג ביקורת</Label>
                                    <Select onValueChange={(value) => handleChange('audit_type', value)} value={formData.audit_type || ''} required>
                                        <SelectTrigger><SelectValue placeholder="בחר סוג ביקורת..." /></SelectTrigger>
                                        <SelectContent>
                                            {questionnaireTypes.map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {questionnaireSettings[type]?.custom_name || type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="audit_date">תאריך ושעת ביקורת</Label>
                                    <Input 
                                        type="datetime-local" 
                                        id="audit_date" 
                                        value={formData.audit_date ? formData.audit_date.slice(0, 16) : ''} 
                                        onChange={e => handleChange('audit_date', new Date(e.target.value).toISOString())} 
                                        required 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="auditor_name">שם המבקר</Label>
                                    <Input id="auditor_name" value={formData.auditor_name || ''} onChange={e => handleChange('auditor_name', e.target.value)} required />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {formData.audit_type && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>שאלון: {questionnaireSettings[formData.audit_type]?.custom_name || formData.audit_type}</CardTitle>
                                <CardDescription>
                                    ציון מחושב (מתוך 10):
                                    <span className="font-bold text-lg text-green-600 ml-2">{calculateOverallScore()}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DynamicAuditForm
                                    auditType={formData.audit_type}
                                    onResponsesChange={setQuestionResponses}
                                    onScoreChange={handleScoreChange}
                                    initialResponses={questionResponses} // This will be an empty object based on loadInitialData
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>סיכום ומשוב</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="summary">סיכום מנהלים</Label>
                                    <Textarea id="summary" value={formData.summary || ''} onChange={e => handleChange('summary', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="positive_points">נקודות לשימור</Label>
                                    <Textarea id="positive_points" value={formData.positive_points || ''} onChange={e => handleChange('positive_points', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="points_for_improvement">נקודות לשיפור</Label>
                                    <Textarea id="points_for_improvement" value={formData.points_for_improvement || ''} onChange={e => handleChange('points_for_improvement', e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                                <Save className="ml-2 h-4 w-4" />
                                {isSaving ? 'שומר...' : 'עדכן ביקורת'}
                            </Button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
