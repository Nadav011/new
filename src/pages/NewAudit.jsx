
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Branch, Audit, AuditResponse, BranchAuditResponse, QuestionnaireSettings, QuestionTopic, AuditQuestion, AccessibilityAudit, HealthAudit, PlannedVisit, Notification, BranchOwnership, PersonalTask, NetworkContact, User, BusinessLocation } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, AlertTriangle, ListPlus, TestTube2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import DynamicAuditForm from '../components/DynamicAuditForm';
import SystemManagerTaskForm from '../components/SystemManagerTaskForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SendEmail } from "@/api/integrations";
import { format } from 'date-fns'; // New import for date formatting

export default function NewAudit() {
    const [branches, setBranches] = useState([]);
    const [questionnaireSettings, setQuestionnaireSettings] = useState({});
    const [availableAuditTypes, setAvailableAuditTypes] = useState([]);
    const [formData, setFormData] = useState({
        branch_id: '',
        audit_type: '',
        audit_date: new Date().toISOString(),
        auditor_name: '',
        summary: '',
        positive_points: '',
        points_for_improvement: ''
    });
    const [auditScore, setAuditScore] = useState({ totalScore: 0, maxPossibleScore: 0 });
    const [questionResponses, setQuestionResponses] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [networkContacts, setNetworkContacts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requiresResponse, setRequiresResponse] = useState('no');

    const navigate = useNavigate();

    // New states for data consolidation
    const [allQuestions, setAllQuestions] = useState([]);
    const [allTopics, setAllTopics] = useState([]);
    const [allLocations, setAllLocations] = useState([]);
    const [currentAuditQuestions, setCurrentAuditQuestions] = useState([]);

    // Helper function for sending emails
    const sendNotificationEmailToBranchOwners = async (branchId, subject, body, auditId) => {
        try {
            const ownerships = await BranchOwnership.filter({ branch_id: branchId });
            if (!ownerships || ownerships.length === 0) {
                console.log(`No owners found for branch ${branchId}. No email sent.`);
                return;
            }

            const allUsers = await User.list(); // Fetch all users once
            const ownerUserIds = ownerships.map(o => o.user_id);
            const owners = allUsers.filter(u => ownerUserIds.includes(u.id));
            const selectedBranch = branches.find(b => b.id === branchId);

            for (const owner of owners) {
                if (owner.email) {
                    const personalizedBody = body
                        .replace(/\[שם בעל הסניף\]/g, owner.full_name || 'מנהל/ת יקר/ה')
                        .replace(/\[קישור לביקורת\]/g, `${window.location.origin}${createPageUrl(`RespondToAudit?auditId=${auditId}`)}`);
                        
                    const personalizedSubject = subject.replace(/\[שם סניף\]/g, selectedBranch?.name || 'הסניף');

                    await SendEmail({
                        to: owner.email,
                        subject: personalizedSubject,
                        body: personalizedBody,
                    });
                    console.log(`Email sent to ${owner.email} for audit ${auditId}`);
                }
            }
        } catch (error) {
            console.error("Failed to send notification email to branch owners:", error);
        }
    };


    useEffect(() => {
        async function loadInitialData() {
            setIsLoading(true);
            setError(null); 
            
            try {
                // Fetch data using Promise.all for concurrency
                const [branchData, questionsData, settingsData, topicsData, locationsData, networkContactData, userData] = await Promise.all([
                    Branch.list(),
                    AuditQuestion.list(),
                    QuestionnaireSettings.list(),
                    QuestionTopic.list(),
                    BusinessLocation.list(),
                    NetworkContact.list(),
                    User.me()
                ]);
                
                setBranches(Array.isArray(branchData) ? branchData : []);
                setAllQuestions(Array.isArray(questionsData) ? questionsData : []);
                setAllTopics(Array.isArray(topicsData) ? topicsData : []);
                setAllLocations(Array.isArray(locationsData) ? locationsData : []);
                setNetworkContacts(Array.isArray(networkContactData) ? networkContactData : []);
                setCurrentUser(userData);

                // Process settings and available types...
                const safeSettingsData = Array.isArray(settingsData) ? settingsData : [];
                const settingsMap = {};
                safeSettingsData.forEach(setting => {
                    settingsMap[setting.questionnaire_type] = setting;
                });
                setQuestionnaireSettings(settingsMap);
                
                const safeAllQuestions = Array.isArray(questionsData) ? questionsData : [];
                const typesFromSettings = safeSettingsData.map(s => s.questionnaire_type);
                const typesFromQuestions = safeAllQuestions.map(q => q.audit_type);
                const allTypeKeys = [...new Set([...typesFromSettings, ...typesFromQuestions])].filter(Boolean);

                const dynamicTypes = allTypeKeys.map(type => ({
                    key: type,
                    name: settingsMap[type]?.custom_name || type
                })).filter(item => item.key && item.name).sort((a, b) => {
                    const nameA = a.name || '';
                    const nameB = b.name || '';
                    return nameA.localeCompare(nameB, 'he');
                });
                
                setAvailableAuditTypes(dynamicTypes);
                
            } catch (err) { 
                console.error("Failed to load initial data:", err);
                setError(err.message || 'שגיאה בטעינת הנתונים הבסיסיים'); 
            } finally {
                setIsLoading(false);
            }
        }
        
        loadInitialData();
    }, []);

    useEffect(() => { // Effect to filter questions when audit_type changes
        if (formData.audit_type && allQuestions.length > 0) {
            const filtered = allQuestions
                .filter(q => q.audit_type === formData.audit_type && q.is_active)
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            setCurrentAuditQuestions(filtered);
            // Only clear responses if the user changes the type, not when dummy data is being set.
            // When dummy data is set, questionResponses will already be populated correctly for the new audit_type.
            if (Object.keys(questionResponses).length === 0) {
                 setQuestionResponses({});
            }
            setAuditScore({ totalScore: 0, maxPossibleScore: 0 });
        } else {
            setCurrentAuditQuestions([]);
        }
    }, [formData.audit_type, allQuestions]);

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
    }

    const fillSampleData = () => {
        const sampleData = {
            auditor_name: "עוז כהן",
            audit_date: new Date().toISOString().slice(0, 16),
            summary: "הביקורת בוצעה בהצלחה עם תוצאות חיוביות בסה\"כ. נמצאו כמה נקודות לשיפור קל שיטופלו בקרוב.",
            positive_points: "• שירות מהיר ואדיב של הצוות\n• ניקיון מעולה של המקום\n• עמידה בנהלי בטיחות",
            points_for_improvement: "• שיפור זמני המתנה בשעות העומס\n• עדכון חלק מהציוד\n• הדרכת צוות נוספת בנושא השירות"
        };
        
        setFormData(prev => ({
            ...prev,
            ...sampleData
        }));
        
        alert("נתוני דמה נוספו בהצלחה!\n\nשים לב: יש לבחור סניף וסוג ביקורת באופן ידני.");
    };

    const processAccessibilityAudit = async (audit, allQuestionResponses) => {
        try {
            console.log('=== Processing Accessibility Audit ===');
            
            const allTopics = await QuestionTopic.list();
            console.log('All available topics:', allTopics.map(t => ({ id: t.id, name: t.name })));
            
            const accessibilityTopicNames = ['נגישות', 'נגישות לנכים', 'accessibility', 'נגיש'];
            console.log('Looking for accessibility topics with names:', accessibilityTopicNames);
            
            const accessibilityTopics = allTopics.filter(t => 
                accessibilityTopicNames.some(name => 
                    t.name.toLowerCase().includes(name.toLowerCase()) || 
                    name.toLowerCase().includes(t.name.toLowerCase())
                )
            );
            
            console.log('Found accessibility topics:', accessibilityTopics.map(t => ({ id: t.id, name: t.name })));

            if (accessibilityTopics.length === 0) {
                console.warn("Accessibility topics not found. All available topics:", allTopics.map(t => t.name));
                return;
            }

            const accessibilityTopicIds = accessibilityTopics.map(t => t.id);
            console.log('Accessibility topic IDs:', accessibilityTopicIds);
            
            const questionsForAudit = await AuditQuestion.filter({ audit_type: audit.audit_type });
            console.log('Total questions for audit type:', questionsForAudit.length);
            console.log('Questions with topics:', questionsForAudit.map(q => ({ id: q.id, text: q.question_text, topic_id: q.topic_id })));
            
            const questionMap = new Map(questionsForAudit.map(q => [q.id, q]));

            const accessibilityResponses = [];
            console.log('Processing responses:', Object.keys(allQuestionResponses));
            
            for (const [questionId, responseData] of Object.entries(allQuestionResponses)) {
                const question = questionMap.get(questionId);
                console.log(`Question ${questionId}:`, question ? `topic_id: ${question.topic_id}, text: ${question.question_text}` : 'not found');
                
                if (question && question.topic_id && accessibilityTopicIds.includes(question.topic_id)) {
                    console.log('Found accessibility question:', question.question_text);
                    accessibilityResponses.push({
                        question_text: question.question_text,
                        response_value: responseData.response_value || '',
                        file_urls: responseData.file_urls || []
                    });
                }
            }
            
            console.log('Accessibility responses found:', accessibilityResponses.length);
            console.log('Accessibility responses:', accessibilityResponses);
            
            if (accessibilityResponses.length > 0) {
                const savedAudit = await AccessibilityAudit.create({
                    branch_id: audit.branch_id,
                    original_audit_id: audit.id,
                    audit_date: audit.audit_date,
                    auditor_name: audit.auditor_name,
                    source: 'internal_audit',
                    compliance_level: 'not_calculated',
                    accessibility_responses: { responses: accessibilityResponses }
                });
                console.log("Accessibility audit saved successfully:", savedAudit);
            } else {
                console.log("No accessibility-related responses found for this audit type.");
            }
        } catch (error) {
            console.error("Failed to process accessibility audit:", error);
        }
    };

    const processHealthAudit = async (audit, allQuestionResponses) => {
        try {
            const allTopics = await QuestionTopic.list();
            console.log('All available topics for health:', allTopics.map(t => t.name));
            
            const healthTopicNames = ['תברואה', 'בריאות', 'משרד הבריאות', 'health', 'sanitation'];
            const healthTopics = allTopics.filter(t => 
                healthTopicNames.some(name => t.name.includes(name) || name.includes(t.name))
            );
    
            if (healthTopics.length === 0) {
                console.warn("Health topics not found. Available topics:", allTopics.map(t => t.name));
                return;
            }
    
            const healthTopicIds = healthTopics.map(t => t.id);
            
            const questionsForAudit = await AuditQuestion.filter({ audit_type: audit.audit_type });
            const questionMap = new Map(questionsForAudit.map(q => [q.id, q]));
    
            const healthResponses = [];
            for (const [questionId, responseData] of Object.entries(allQuestionResponses)) {
                const question = questionMap.get(questionId);
                if (question && healthTopicIds.includes(question.topic_id)) {
                    healthResponses.push({
                        question_text: question.question_text,
                        response_value: responseData.response_value || '',
                        file_urls: responseData.file_urls || []
                    });
                }
            }
            
            if (healthResponses.length > 0) {
                await HealthAudit.create({
                    branch_id: audit.branch_id,
                    original_audit_id: audit.id,
                    audit_date: audit.audit_date,
                    auditor_name: audit.auditor_name,
                    source: 'internal_audit',
                    compliance_level: 'not_rated',
                    health_responses: { responses: healthResponses }
                });
                console.log("Health audit processed and saved successfully.");
            } else {
                console.log("No health/sanitation-related responses found for this audit type. Skipping health audit creation.");
            }
        } catch (error) {
            console.error("Failed to process health audit:", error);
        }
    };

    const updateRelatedPlannedVisit = async (audit) => {
        try {
            console.log('Checking for related planned visits...');
            
            const relatedPlannedVisits = await PlannedVisit.filter({
                branch_id: audit.branch_id,
                audit_type: audit.audit_type,
                status: 'מתוכנן'
            });

            if (relatedPlannedVisits.length > 0) {
                const auditDate = new Date(audit.audit_date);
                auditDate.setHours(0, 0, 0, 0);

                let closestVisit = null;
                let minDifference = Infinity;

                for (const visit of relatedPlannedVisits) {
                    const visitDate = new Date(visit.visit_date);
                    visitDate.setHours(0, 0, 0, 0);
                    
                    const daysDifference = Math.abs((auditDate - visitDate) / (1000 * 60 * 60 * 24));
                    
                    if (daysDifference <= 7 && daysDifference < minDifference) {
                        minDifference = daysDifference;
                        closestVisit = visit;
                    }
                }

                if (closestVisit) {
                    console.log(`Found matching planned visit for ${audit.branch_id} - ${audit.audit_type}. Updating status to 'בוצע'.`);
                    
                    await PlannedVisit.update(closestVisit.id, {
                        status: 'בוצע'
                    });

                    try {
                        const notifications = await Notification.filter({
                            type: 'planned_visit_overdue',
                            related_entity_id: closestVisit.id,
                            is_read: false
                        });

                        for (const notification of notifications) {
                            await Notification.update(notification.id, { is_read: true });
                        }
                        
                        if (notifications.length > 0) {
                            console.log(`Cleared ${notifications.length} related notifications.`);
                        }
                    } catch (notificationError) {
                        console.warn("Could not clear related notifications:", notificationError);
                    }

                    console.log('Planned visit status updated successfully.');
                }
            }
        } catch (error) {
            console.warn("Could not update related planned visit:", error);
        }
    };

    const handleSaveTask = async (taskData) => {
        try {
            await PersonalTask.create(taskData);
            alert('המשימה נוצרה בהצלחה!');
            setIsTaskFormOpen(false); // Close form on success
        } catch (error) {
            console.error("Failed to create task:", error);
            alert('שגיאה ביצירת המשימה.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.branch_id || !formData.audit_type) {
            alert('יש לבחור סניף וסוג ביקורת.');
            return;
        }
        
        if (!requiresResponse) {
            alert('יש לציין האם הביקורת דורשת תגובת סניף.');
            return;
        }
        
        setIsSaving(true);
        try {
            const overallScore = calculateOverallScore();
            
            // Create snapshot of questions for this audit type
            const questionsForSnapshot = allQuestions
                .filter(q => q.audit_type === formData.audit_type && q.is_active)
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

            const auditData = {
                ...formData,
                overall_score: overallScore,
                response_required: requiresResponse === 'yes', // Convert string to boolean
                questionnaire_snapshot: questionsForSnapshot,
                topics_snapshot: allTopics,
                locations_snapshot: allLocations
            };
            const audit = await Audit.create(auditData);

            const responsePromises = [];
            for (const [questionId, responseData] of Object.entries(questionResponses)) {
                if (responseData.response_value || (responseData.file_urls && responseData.file_urls.length > 0)) {
                    responsePromises.push(AuditResponse.create({
                        audit_id: audit.id,
                        question_id: questionId,
                        response_value: responseData.response_value || '',
                        file_urls: responseData.file_urls || []
                    }));
                }
            }
            await Promise.all(responsePromises);

            await processAccessibilityAudit(audit, questionResponses);
            await processHealthAudit(audit, questionResponses);
            
            await updateRelatedPlannedVisit(audit);

            if (requiresResponse === 'yes') { // Check string value
                const selectedBranch = branches.find(b => b.id === formData.branch_id);
                if (selectedBranch) {
                    // Create BranchAuditResponse record for auto-saving
                    await BranchAuditResponse.create({
                        audit_id: audit.id,
                        branch_id: selectedBranch.id,
                        status: 'in_progress',
                        responses_by_question: {}
                    });

                    // Create a master task for the branch owner
                    const auditQuestions = await AuditQuestion.filter({ audit_type: audit.audit_type, is_active: true });
                    const subTasks = auditQuestions
                        .filter(q => q.question_type !== 'header')
                        .map(q => ({
                            question_id: q.id,
                            question_text: q.question_text,
                            status: 'טרם בוצע',
                            comment: '',
                            file_urls: []
                        }));

                    const ownerships = await BranchOwnership.filter({ branch_id: formData.branch_id });
                    
                    let firstCreatedTaskId = null; // To store the ID of the first task created for the dispatch event

                    for (const owner of ownerships) {
                         // Create notification
                        await Notification.create({
                            user_id: owner.user_id,
                            type: 'branch_audit_response_required',
                            message: `התקבלה ביקורת חדשה הדורשת את תגובתך עבור סניף: ${selectedBranch.name}`,
                            link: createPageUrl(`RespondToAudit?auditId=${audit.id}`),
                            related_entity_id: audit.id
                        });

                        // Create personal task for the branch owner
                        const newPersonalTask = await PersonalTask.create({
                            task_type: 'audit_response',
                            subject: `נדרשת תגובה לביקורת בסניף ${selectedBranch.name}`,
                            text: `ביקורת מסוג "${questionnaireSettings[audit.audit_type]?.custom_name || audit.audit_type}" בוצעה בתאריך ${format(new Date(audit.audit_date), 'dd/MM/yyyy')} ומצריכה תגובה.`,
                            status: 'pending',
                            priority: 'high',
                            created_by: currentUser?.email,
                            assigned_to_user_id: owner.user_id,
                            branch_id: formData.branch_id,
                            branch_name: selectedBranch.name,
                            related_branch_audit_id: audit.id,
                            sub_tasks: subTasks
                        });
                        if (!firstCreatedTaskId) {
                            firstCreatedTaskId = newPersonalTask.id; // Store the ID of the first created task
                        }
                    }

                    // --- שליחת התראה במייל ---
                    const emailSubject = `ביקורת חדשה התקבלה בסניף [שם סניף]`;
                    const emailBody = `
שלום [שם בעל הסניף],

ביקורת חדשה מסוג "${questionnaireSettings[audit.audit_type]?.custom_name || formData.audit_type}" בוצעה בתאריך ${format(new Date(audit.audit_date), 'dd/MM/yyyy')} בסניף "${selectedBranch.name}" ומצריכה תגובה.
נדרשת תגובתך לליקויים שנמצאו.
 
נא היכנס/י למערכת כדי לצפות בפרטי הביקורת ולהגיש תגובה:
[קישור לביקורת]

בברכה,
מערכת בקרת רשת - המקסיקני
`;
                    await sendNotificationEmailToBranchOwners(formData.branch_id, emailSubject, emailBody, audit.id);
                    // --- סוף שליחת התראה במייל ---

                    // --- טריגר עדכון התראות בזמן אמת ---
                    window.dispatchEvent(new CustomEvent('newBranchNotification', {
                        detail: {
                            type: 'branch_audit_response_required',
                            branchId: formData.branch_id,
                            taskId: firstCreatedTaskId // Pass the ID of the first created task
                        }
                    }));
                }
            }

            alert('הביקורת נשמרה בהצלחה!');
            navigate(createPageUrl(`AuditDetails?id=${audit.id}`)); // Changed navigation
        } catch (error) {
            console.error("Failed to save audit:", error);
            alert('שגיאה בשמירת הביקורת.');
        } finally {
            setIsSaving(false);
        }
    };

    const getAuditTypeDescription = (type) => {
        const descriptions = {
            'גלויה': 'ביקורת גלויה - המבקר מזדהה כנציג הרשת',
            'סמויה': 'ביקורת סמויה - המבקר לא מזדהה',
            'לקוח סמוי - ביקור בעסק': 'לקוח סמוי שמגיע לסניף ואוכל במקום',
            'לקוח סמוי - משלוח': 'לקוח סמוי שמזמין משלוח הביתה',
            'לקוח סמוי - איסוף עצמי': 'לקוח סמוי שמזמין ואוסף עצמאית מהסניף',
            'ריאיון עם מנהל סניף': 'שיחה מובנית עם מנהל הסניף על תהליכים וביצועים',
            'ריאיונות עם לקוחות הסניף': 'איסוף משוב ישיר מלקוחות הנמצאים בסניף',
            'ריאיונות עם עובדי הסניף': 'שיחות עם עובדים להבנת האווירה והתהליכים הפנימיים'
        };
        return descriptions[type] || '';
    };
    
    const getQuestionTypeDisplay = (type) => {
        switch (type) {
            case 'rating_1_5': return 'דירוג (1-5)';
            case 'text': return 'טקסט חופשי';
            case 'status_check': return 'בדיקת סטטוס (תקין/חלקי/לא)';
            case 'multiple_choice': return 'בחירה מרובה';
            case 'header': return 'כותרת';
            default: return type;
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">טוען נתונים...</div>
            </div>
        );
    }

    if (error) { 
        return (
            <div className="text-center py-10 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto mt-20">
                <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הדף</h3>
                <p className="text-red-600 mb-4">{error}</p> 
                <Button onClick={() => window.location.reload()} variant="outline">
                    רענן דף
                </Button>
            </div>
        );
    }

    const filteredQuestions = allQuestions
        .filter(q => q.audit_type === formData.audit_type && q.is_active)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    return (
        <TooltipProvider>
            <div className="max-w-4xl mx-auto p-4 sm:p-6" dir="rtl">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                            <CardTitle>פרטי הביקורת הכללים</CardTitle>
                            <Button type="button" variant="outline" onClick={fillSampleData} className="gap-2">
                                <TestTube2 className="w-4 h-4" />
                                מלא נתוני דמה
                            </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="branch_id">סניף</Label>
                                        <Select onValueChange={(value) => handleChange('branch_id', value)} value={formData.branch_id} required>
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
                                        <Select onValueChange={(value) => handleChange('audit_type', value)} value={formData.audit_type} required>
                                            <SelectTrigger><SelectValue placeholder="בחר סוג ביקורת..." /></SelectTrigger>
                                            <SelectContent>
                                                {availableAuditTypes.map(type => (
                                                    <SelectItem key={type.key} value={type.key}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {formData.audit_type && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {getAuditTypeDescription(formData.audit_type)}
                                            </p>
                                        )}
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
                                        <Input id="auditor_name" value={formData.auditor_name} onChange={e => handleChange('auditor_name', e.target.value)} required />
                                    </div>
                                </div>
                                
                                {/* Changed from checkbox to required select */}
                                <div className="space-y-2">
                                    <Label htmlFor="requires_response" className="text-base font-medium">
                                        האם ביקורת זו דורשת תגובת סניף? <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={requiresResponse} onValueChange={setRequiresResponse} required>
                                        <SelectTrigger id="requires_response">
                                            <SelectValue placeholder="בחר אפשרות..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes">כן - הביקורת דורשת תגובת סניף</SelectItem>
                                            <SelectItem value="no">לא - הביקורת אינה דורשת תגובה</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500">
                                        אם תבחר "כן", הסניף יקבל התראה ומשימה לתגובה על הביקורת
                                    </p>
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
                                        questions={currentAuditQuestions}
                                        topics={allTopics}
                                        businessLocations={allLocations}
                                        onResponsesChange={setQuestionResponses}
                                        onScoreChange={handleScoreChange}
                                        initialResponses={questionResponses} 
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
                                        <Textarea id="summary" value={formData.summary} onChange={e => handleChange('summary', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="positive_points">נקודות לשימור</Label>
                                        <Textarea id="positive_points" value={formData.positive_points} onChange={e => handleChange('positive_points', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="points_for_improvement">נקודות לשיפור</Label>
                                        <Textarea id="points_for_improvement" value={formData.points_for_improvement} onChange={e => handleChange('points_for_improvement', e.target.value)} />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                                    <Save className="ml-2 h-4 w-4" />
                                    {isSaving ? 'שומר...' : 'שמור ביקורת'}
                                </Button>
                            </div>
                        </>
                    )}
                </form>

                {/* Floating Action Button to create a task */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            onClick={() => setIsTaskFormOpen(true)} 
                            className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 z-50 flex items-center justify-center"
                            aria-label="הוסף משימה חדשה"
                        >
                            <ListPlus className="h-7 w-7 text-white" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black text-white">
                        <p>הוסף משימה חדשה</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Task Form Dialog */}
            <SystemManagerTaskForm 
                open={isTaskFormOpen}
                onOpenChange={setIsTaskFormOpen} 
                onSave={handleSaveTask}
                branches={branches}
                networkContacts={networkContacts}
                currentUser={currentUser} 
            />
        </TooltipProvider>
    );
}
