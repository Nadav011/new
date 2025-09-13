
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import {
    Button
} from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipProvider,
    TooltipTrigger,
    TooltipContent
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ListPlus,
    MessageSquare,
    Printer,
    CheckCircle,
    AlertTriangle,
    Info,
    Edit,
    Trash2,
    ArrowRight,
    FileText,
    Star,
    ThumbsDown,
    ThumbsUp,
    User,
    Building,
    Download
} from 'lucide-react';
import { Audit, Branch, AuditResponse, AuditQuestion, QuestionTopic, User as UserModel, PersonalTask, DeletedItem, BranchAuditResponse, NetworkContact, BusinessLocation } from '@/api/entities';
import { createPageUrl } from '@/utils';
import TaskForm from '../components/TaskForm';
import FullPageError from '../components/FullPageError';

// Helper to safely format dates and prevent crashes
const safeFormatDate = (dateString, formatStr = 'dd/MM/yyyy HH:mm') => {
    if (!dateString) return 'לא זמין';
    try {
        const date = parseISO(dateString);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
        return format(date, formatStr, { locale: he });
    } catch (e) {
        return 'תאריך לא תקין';
    }
};

// Component to render a single question with auditor and branch responses
const QuestionItem = ({ question, auditorResponse, branchResponse }) => {
    // If it's a header, render as title
    if (question.question_type === 'header') {
        return (
            <div className="py-6 border-b-2 border-gray-300">
                <h3 className="text-xl font-bold text-gray-800">{question.question_text}</h3>
            </div>
        );
    }

    // Otherwise render as a regular question with responses
    const auditorResponded = auditorResponse && (auditorResponse.response_value || (auditorResponse.file_urls && auditorResponse.file_urls.length > 0));
    const branchResponded = branchResponse && (branchResponse.status !== 'טרם בוצע' || branchResponse.comment || (branchResponse.file_urls && branchResponse.file_urls.length > 0));

    const getStatusBadge = (status) => {
        switch (status) {
            case 'בוצע': return <Badge variant="success" className="bg-green-100 text-green-800">בוצע</Badge>;
            case 'בתהליך': return <Badge variant="warning" className="bg-yellow-100 text-yellow-800">בתהליך</Badge>;
            default: return <Badge variant="outline">טרם בוצע</Badge>;
        }
    };

    return (
        <div className="py-4 px-3 border-b last:border-b-0">
            <p className="font-semibold text-gray-800 mb-3">{question.question_text}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Auditor's Response */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-blue-700">תשובת המבקר</h4>
                    </div>
                    {auditorResponded ? (
                        <>
                            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">{auditorResponse.response_value || "אין תשובה טקסטואלית"}</p>
                            {auditorResponse.file_urls && auditorResponse.file_urls.length > 0 && (
                                <div className="space-y-1">
                                    {auditorResponse.file_urls.map((url, index) => (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            קובץ מצורף {index + 1}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                         <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-md">לא ניתנה תשובה</p>
                    )}
                </div>

                {/* Branch's Response */}
                <div className="space-y-2">
                     <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-green-600" />
                        <h4 className="font-medium text-green-700">תגובת הסניף</h4>
                    </div>
                     {branchResponded ? (
                        <div className="bg-green-50 p-3 rounded-md space-y-2">
                            <div>{getStatusBadge(branchResponse.status)}</div>
                            <p className="text-sm text-gray-700">{branchResponse.comment || "אין הערה"}</p>
                            {branchResponse.file_urls && branchResponse.file_urls.length > 0 && (
                                <div className="space-y-1">
                                    {branchResponse.file_urls.map((url, index) => (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            קובץ מצורף {index + 1}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-md">לא ניתנה תגובה</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function AuditDetails() {
    const [audit, setAudit] = useState(null);
    const [branch, setBranch] = useState(null);
    const [auditorResponses, setAuditorResponses] = useState([]);
    const [branchResponse, setBranchResponse] = useState(null);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [networkContacts, setNetworkContacts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    
    // תיקון: חילוץ מזהה מה-URL בצורה בטוחה, רק מתוך פרמטרים.
    const params = new URLSearchParams(location.search);
    const auditId = params.get('id') || params.get('audit_id');

    const loadAuditDetails = useCallback(async () => {
        // אין צורך לבדוק שוב את auditId, זה מטופל ב-useEffect
        setIsLoading(true);
        setError(null);
        try {
            const [auditData, branchResponseData, user, contacts] = await Promise.all([
                Audit.get(auditId),
                BranchAuditResponse.filter({ audit_id: auditId }),
                UserModel.me(),
                NetworkContact.list()
            ]);

            if (!auditData) {
                throw new Error("לא נמצאה ביקורת עם המזהה שסופק. ייתכן שהיא נמחקה.");
            }

            // Fallback for older audits without snapshots
            if (!auditData.questionnaire_snapshot || auditData.questionnaire_snapshot.length === 0) {
                const [questionsRes, topics, locations] = await Promise.all([
                    AuditQuestion.filter({ audit_type: auditData.audit_type, is_active: true }),
                    QuestionTopic.list(),
                    BusinessLocation.list()
                ]);

                const questions = Array.isArray(questionsRes) ? questionsRes : [];

                auditData.questionnaire_snapshot = questions.sort((a,b) => (a.order_index || 0) - (b.order_index || 0));
                auditData.topics_snapshot = topics;
                auditData.locations_snapshot = locations;
            }

            setAudit(auditData);
            // BranchAuditResponse.filter returns an array, take the first one if it exists
            setBranchResponse(branchResponseData && branchResponseData.length > 0 ? branchResponseData[0] : null); 
            setCurrentUser(user);
            setNetworkContacts(contacts);

            const [branchData, auditorResponsesData] = await Promise.all([
                Branch.get(auditData.branch_id),
                AuditResponse.filter({ audit_id: auditData.id })
            ]);
            
            setBranch(branchData);
            setAuditorResponses(auditorResponsesData);

        } catch (err) {
            console.error("Failed to load audit details:", err);
            setError(err.message || "שגיאה בטעינת פרטי הביקורת. נסה לרענן את הדף.");
        } finally {
            setIsLoading(false);
        }
    }, [auditId]);

    useEffect(() => {
        // טיפול חזק יותר: אם אין מזהה, הצג שגיאה מיד.
        if (auditId) {
            loadAuditDetails();
        } else {
            setError("מזהה הביקורת חסר מהקישור. אנא חזור לדף הקודם ונסה שוב.");
            setIsLoading(false);
        }
    }, [auditId, loadAuditDetails]);

    // Create question items with responses - EXACTLY as they appear in the snapshot
    const questionItems = useMemo(() => {
        if (!audit || !audit.questionnaire_snapshot) return [];

        const auditorResponsesMap = new Map(auditorResponses.map(r => [r.question_id, r]));
        const branchResponsesMap = branchResponse ? new Map(Object.entries(branchResponse.responses_by_question || {})) : new Map();
        
        return audit.questionnaire_snapshot.map(question => ({
            ...question,
            auditorResponse: auditorResponsesMap.get(question.id),
            branchResponse: branchResponsesMap.get(question.id),
        }));
    }, [audit, auditorResponses, branchResponse]);

    const handleDelete = async () => {
        try {
            await DeletedItem.create({
                item_type: "Audit",
                original_id: audit.id,
                item_name: `ביקורת ${audit.audit_type} לסניף ${branch?.name}`,
                item_data: audit,
                deleted_by: currentUser?.email
            });
            await Audit.delete(audit.id);
            alert('הביקורת נמחקה והועברה לארכיון!');
            navigate(createPageUrl('Audits'));
        } catch (err) {
            console.error("Failed to delete audit:", err);
            alert("שגיאה במחיקת הביקורת.");
        }
    };
    
    const handleSaveTask = async (taskData) => {
        try {
            await PersonalTask.create({
                ...taskData,
                subject: `משימה בעקבות ביקורת: ${audit.audit_type}`,
                created_by: currentUser?.email
            });
            alert('המשימה נוצרה בהצלחה!');
            setIsTaskFormOpen(false);
        } catch (error) {
            console.error("Failed to create task:", error);
            alert('שגיאה ביצירת המשימה.');
        }
    };

    const getReportToolbarHTML = () => {
        return `
            <div id="toolbar" class="toolbar no-print">
                <div class="toolbar-title">
                    <h2>דוח ביקורת - ${branch?.name || 'סניף'} - ${safeFormatDate(audit?.audit_date)}</h2>
                </div>
                <div class="toolbar-actions">
                    <button onclick="window.print()" class="toolbar-btn print-btn">
                        🖨️ הדפסה / שמירה כ-PDF
                    </button>
                    <button onclick="shareWhatsApp()" class="toolbar-btn whatsapp-btn">
                        💬 שתף בווטסאפ
                    </button>
                    <button onclick="shareEmail()" class="toolbar-btn email-btn">
                        📧 שלח במייל
                    </button>
                    <button onclick="window.close()" class="toolbar-btn close-btn">
                        ❌ סגור
                    </button>
                </div>
            </div>
        `;
    };

    const generateAuditReportHTML = () => {
        if (!audit || !branch) return '';

        let questionsHTML = '';
        if (questionItems && Array.isArray(questionItems)) {
            questionItems.forEach(item => {
                const question = item;
                const auditorResp = item.auditorResponse;
                const branchResp = item.branchResponse;
                
                questionsHTML += `
                    <div class="question-item">
                        <div class="question-header">
                            <h3 class="question-text ${question.question_type === 'header' ? 'header-question' : ''}">
                                ${question.question_text}
                            </h3>
                        </div>
                        
                        ${question.question_type !== 'header' ? `
                            <div class="responses-section">
                                <div class="auditor-response">
                                    <h4>תשובת המבקר:</h4>
                                    <div class="response-content">
                                        ${auditorResp?.response_value || 'לא ניתנה תשובה'}
                                    </div>
                                    ${auditorResp?.file_urls && auditorResp.file_urls.length > 0 ? `
                                        <div class="response-files">
                                            <strong>קבצים מצורפים:</strong>
                                            <ul>
                                                ${auditorResp.file_urls.map(url => `<li>קובץ מצורף</li>`).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                ${branchResp ? `
                                    <div class="branch-response">
                                        <h4>תגובת הסניף:</h4>
                                        <div class="response-status status-${branchResp.status?.replace(/ /g, '-') || 'לא-עודכן'}">
                                            סטטוס: ${branchResp.status || 'לא עודכן'}
                                        </div>
                                        ${branchResp.comment ? `
                                            <div class="response-comment">
                                                <strong>הערה:</strong> ${branchResp.comment}
                                            </div>
                                        ` : ''}
                                        ${branchResp.file_urls && branchResp.file_urls.length > 0 ? `
                                            <div class="response-files">
                                                <strong>קבצים מצורפים:</strong>
                                                <ul>
                                                    ${branchResp.file_urls.map(url => `<li>קובץ מצורף</li>`).join('')}
                                                </ul>
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : '<div class="branch-response"><p class="italic text-sm text-gray-500">לא ניתנה תגובה</p></div>'}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }

        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>דוח ביקורת - ${branch.name} - ${safeFormatDate(audit.audit_date)}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                        color: #333;
                        line-height: 1.6;
                    }
                    
                    .toolbar {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 30px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                        z-index: 1000;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .toolbar-title h2 {
                        margin: 0;
                        font-size: 1.4em;
                        font-weight: 600;
                    }
                    
                    .toolbar-actions {
                        display: flex;
                        gap: 15px;
                    }
                    
                    .toolbar-btn {
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    }
                    
                    .toolbar-btn:hover {
                        background: rgba(255,255,255,0.3);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                    
                    .print-btn:hover { background: rgba(76, 175, 80, 0.7); }
                    .whatsapp-btn:hover { background: rgba(37, 211, 102, 0.7); }
                    .email-btn:hover { background: rgba(33, 150, 243, 0.7); }
                    .close-btn:hover { background: rgba(244, 67, 54, 0.7); }
                    
                    .content {
                        margin-top: 80px;
                        padding: 30px;
                        max-width: 1200px;
                        margin-left: auto;
                        margin-right: auto;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    
                    .report-header {
                        text-align: center;
                        border-bottom: 3px solid #667eea;
                        padding-bottom: 30px;
                        margin-bottom: 40px;
                    }
                    
                    .report-title {
                        font-size: 2.5em;
                        font-weight: bold;
                        color: #667eea;
                        margin-bottom: 10px;
                    }
                    
                    .report-subtitle {
                        font-size: 1.2em;
                        color: #666;
                        margin-bottom: 20px;
                    }
                    
                    .audit-info {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin-bottom: 40px;
                        padding: 20px;
                        background: #f8f9ff;
                        border-radius: 8px;
                        border-right: 4px solid #667eea;
                    }
                    
                    .info-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px 0;
                        border-bottom: 1px solid #eee;
                    }
                    
                    .info-label {
                        font-weight: 600;
                        color: #555;
                    }
                    
                    .info-value {
                        color: #333;
                        font-weight: 500;
                    }
                    
                    .score-badge {
                        display: inline-block;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: bold;
                        font-size: 1.1em;
                    }
                    
                    .score-high { background: #4CAF50; color: white; }
                    .score-medium { background: #FF9800; color: white; }
                    .score-low { background: #f44336; color: white; }
                    
                    .summary-section {
                        margin: 30px 0;
                        padding: 20px;
                        background: #fff;
                        border-radius: 8px;
                        border: 1px solid #e0e0e0;
                    }
                    
                    .summary-title {
                        font-size: 1.3em;
                        font-weight: 600;
                        color: #667eea;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .questions-section {
                        margin-top: 40px;
                    }
                    
                    .section-title {
                        font-size: 1.8em;
                        font-weight: bold;
                        color: #667eea;
                        margin-bottom: 30px;
                        text-align: center;
                        padding: 15px;
                        background: #f8f9ff;
                        border-radius: 8px;
                    }
                    
                    .question-item {
                        margin-bottom: 30px;
                        padding: 20px;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        background: #fff;
                        page-break-inside: avoid;
                    }
                    
                    .question-text {
                        font-size: 1.2em;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 15px;
                        line-height: 1.5;
                    }
                    
                    .header-question {
                        font-size: 1.4em;
                        color: #667eea;
                        text-align: center;
                        background: #f8f9ff;
                        padding: 15px;
                        border-radius: 6px;
                        border-right: 4px solid #667eea;
                    }
                    
                    .responses-section {
                        margin-top: 15px;
                    }
                    
                    .auditor-response,
                    .branch-response {
                        margin: 15px 0;
                        padding: 15px;
                        border-radius: 6px;
                    }
                    
                    .auditor-response {
                        background: #e8f5e8;
                        border-right: 4px solid #4CAF50;
                    }
                    
                    .branch-response {
                        background: #fff3e0;
                        border-right: 4px solid #ff9800;
                    }
                    
                    .auditor-response h4,
                    .branch-response h4 {
                        margin: 0 0 10px 0;
                        font-size: 1em;
                        font-weight: 600;
                        color: #555;
                    }
                    
                    .response-content {
                        background: white;
                        padding: 10px;
                        border-radius: 4px;
                        border: 1px solid #ddd;
                        font-weight: 500;
                    }
                    
                    .response-status {
                        display: inline-block;
                        padding: 6px 12px;
                        border-radius: 15px;
                        font-size: 0.9em;
                        font-weight: 600;
                        margin-bottom: 10px;
                    }
                    
                    .status-טרם-בוצע { background: #ffebee; color: #c62828; }
                    .status-בתהליך { background: #fff3e0; color: #ef6c00; }
                    .status-בוצע { background: #e8f5e8; color: #2e7d32; }
                    
                    .response-comment,
                    .response-files {
                        margin-top: 10px;
                        padding: 8px;
                        background: rgba(255,255,255,0.8);
                        border-radius: 4px;
                        font-size: 0.9em;
                    }
                    
                    @media print {
                        .no-print, .toolbar {
                            display: none !important;
                        }
                        
                        body {
                            background: white !important;
                            font-size: 12pt !important;
                        }
                        
                        .content {
                            margin: 0 !important;
                            padding: 20mm !important;
                            box-shadow: none !important;
                            border-radius: 0 !important;
                        }
                        
                        .question-item {
                            page-break-inside: avoid !important;
                            border: 1pt solid #ccc !important;
                            margin-bottom: 5mm !important;
                        }
                        
                        .report-title {
                            font-size: 20pt !important;
                        }
                        
                        .section-title {
                            font-size: 16pt !important;
                        }
                        
                        .question-text {
                            font-size: 11pt !important;
                        }
                    }
                </style>
                <script>
                    function shareWhatsApp() {
                        const text = encodeURIComponent('דוח ביקורת - ${branch.name} מתאריך ${safeFormatDate(audit.audit_date)}. הדוח כולל את כל פרטי הביקורת ותגובות הסניף.');
                        window.open('https://wa.me/?text=' + text, '_blank');
                    }
                    
                    function shareEmail() {
                        const subject = encodeURIComponent('דוח ביקורת - ${branch.name}');
                        const body = encodeURIComponent('שלום,\\n\\nמצורף דוח ביקורת עבור סניף ${branch.name} מתאריך ${safeFormatDate(audit.audit_date)}.\\n\\nהדוח כולל את כל השאלות, תשובות המבקר ותגובות הסניף.\\n\\nבברכה');
                        window.open('mailto:?subject=' + subject + '&body=' + body, '_self');
                    }
                </script>
            </head>
            <body>
                ${getReportToolbarHTML()}
                
                <div class="content">
                    <div class="report-header">
                        <div class="report-title">דוח ביקורת</div>
                        <div class="report-subtitle">${audit.audit_type} - ${branch.name}</div>
                        <div class="report-subtitle">${safeFormatDate(audit.audit_date)}</div>
                    </div>
                    
                    <div class="audit-info">
                        <div class="info-item">
                            <span class="info-label">סניף:</span>
                            <span class="info-value">${branch.name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">עיר:</span>
                            <span class="info-value">${branch.city || 'לא צוין'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">תאריך ביקורת:</span>
                            <span class="info-value">${safeFormatDate(audit.audit_date)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">מבקר:</span>
                            <span class="info-value">${audit.auditor_name || 'לא צוין'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">סוג ביקורת:</span>
                            <span class="info-value">${audit.audit_type}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">ציון כללי:</span>
                            <span class="info-value">
                                <span class="score-badge ${audit.overall_score >= 8 ? 'score-high' : audit.overall_score >= 6 ? 'score-medium' : 'score-low'}">
                                    ${typeof audit.overall_score === 'number' ? audit.overall_score.toFixed(1) : 'N/A'}/10
                                </span>
                            </span>
                        </div>
                    </div>
                    
                    ${audit.summary ? `
                        <div class="summary-section">
                            <div class="summary-title">📝 סיכום מנהלים</div>
                            <div>${audit.summary}</div>
                        </div>
                    ` : ''}
                    
                    ${audit.positive_points ? `
                        <div class="summary-section">
                            <div class="summary-title">👍 נקודות לשימור</div>
                            <div>${audit.positive_points}</div>
                        </div>
                    ` : ''}
                    
                    ${audit.points_for_improvement ? `
                        <div class="summary-section">
                            <div class="summary-title">🔧 נקודות לשיפור</div>
                            <div>${audit.points_for_improvement}</div>
                        </div>
                    ` : ''}
                    
                    <div class="questions-section">
                        <div class="section-title">📋 שאלות ותשובות</div>
                        ${questionsHTML}
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handlePrintReport = () => {
        const reportHTML = generateAuditReportHTML();
        const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
        if (newWindow) {
            newWindow.document.write(reportHTML);
            newWindow.document.close();
            // Optional: You can trigger print directly after writing content
            // newWindow.onload = () => {
            //     newWindow.print();
            // };
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>טוען פרטי ביקורת...</p>
            </div>
        );
    }
    
    // הצגת שגיאה ברורה עם אפשרות לחזור אחורה
    if (error) {
        return (
            <FullPageError 
                errorTitle="שגיאה בטעינת פרטי הביקורת" 
                errorMessage={error} 
                onRetry={() => {
                    if (auditId) {
                        loadAuditDetails();
                    } else {
                        navigate(createPageUrl('Audits'));
                    }
                }} 
            />
        );
    }

    if (!audit) {
        return <FullPageError errorTitle="לא נמצאה ביקורת" errorMessage="לא ניתן היה למצוא את הביקורת המבוקשת." />;
    }

    // Permissions logic
    const canRespond = (currentUser?.user_type === 'branch_owner' || currentUser?.user_type === 'setup_branch_owner') && audit.response_required;
    const responseSubmitted = branchResponse?.status === 'submitted';
    const canCreateTask = !!currentUser; // Any logged-in user can create a task
    const canEdit = currentUser && ['admin', 'auditor'].includes(currentUser.user_type);
    const canDelete = currentUser && ['admin', 'auditor'].includes(currentUser.user_type);


    return (
        <TooltipProvider>
            <div className="max-w-5xl mx-auto p-4 sm:p-6" dir="rtl">
                <div className="flex justify-between items-start mb-6 no-print">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">פרטי ביקורת</h1>
                        <p className="text-gray-500 mt-1">
                            {`סוג: ${audit.audit_type} | סניף: ${branch?.name || 'טוען...'} | תאריך: ${safeFormatDate(audit.audit_date)}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handlePrintReport} className="bg-blue-600 hover:bg-blue-700 gap-2">
                            <Download className="w-4 h-4" />
                            דוח PDF
                        </Button>
                        {canRespond && !responseSubmitted && (
                            <Link to={`${createPageUrl("RespondToAudit")}?audit_id=${auditId}`}>
                                <Button className="bg-green-600 hover:bg-green-700 gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    מענה לביקורת
                                </Button>
                            </Link>
                        )}
                        {canCreateTask && (
                            <Button onClick={() => setIsTaskFormOpen(true)} className="gap-2">
                                <ListPlus className="w-4 h-4" />
                                יצירת משימה
                            </Button>
                        )}
                        {canEdit && (
                            <Button variant="outline" asChild className="gap-2">
                                <Link to={`${createPageUrl("EditAudit")}?id=${auditId}`}>
                                    <Edit className="w-4 h-4" />
                                    עריכה
                                </Link>
                            </Button>
                        )}
                        {canDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                        מחיקה
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>אישור מחיקת ביקורת</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            האם אתה בטוח שברצונך למחוק את הביקורת? הפעולה תעביר את הביקורת לארכיון ולא ניתן יהיה לשחזר אותה ישירות.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                            מחק ביקורת
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>

                {/* Response Status Card - only if response required */}
                {audit.response_required && (
                    <Card className={`mb-6 no-print ${responseSubmitted ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
                        <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
                             {responseSubmitted ? <CheckCircle className="w-6 h-6 text-green-600" /> : <AlertTriangle className="w-6 h-6 text-yellow-600" />}
                            <CardTitle>
                                 {responseSubmitted ? 'התגובה הוגשה' : 'נדרשת תגובת סניף'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm">
                                {responseSubmitted 
                                    ? `התגובה הוגשה בתאריך ${safeFormatDate(branchResponse.updated_date, 'dd/MM/yyyy')} על ידי ${branchResponse.submitted_by_name || 'הסניף'}.`
                                    : 'ביקורת זו סומנה כדורשת תגובה מהסניף. לאחר שתוגש, התגובה תופיע כאן.'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print-section">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">ציון כללי</CardTitle>
                            <Star className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {typeof audit.overall_score === 'number' ? audit.overall_score.toFixed(1) : 'לא חושב'} / 10
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">סיכום מנהלים</CardTitle>
                             <Info className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 h-12 overflow-y-auto">{audit.summary || "אין סיכום מנהלים"}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">נקודות לשימור</CardTitle>
                            <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 h-12 overflow-y-auto">{audit.positive_points || "לא צוינו נקודות לשימור"}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">נקודות לשיפור</CardTitle>
                            <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 h-12 overflow-y-auto">{audit.points_for_improvement || "לא צוינו נקודות לשיפור"}</p>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Questionnaire Section */}
                <Card className="print-section">
                    <CardHeader className="no-print">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-6 h-6" />
                            שאלון הביקורת והתגובות
                        </CardTitle>
                        <CardDescription>
                            השאלון המקורי בדיוק כפי שמולא בביקורת, עם תשובות המבקר ותגובות הסניף
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {questionItems.map((item, index) => (
                                <div key={item.id || index} className="print-question">
                                    <QuestionItem 
                                        question={item}
                                        auditorResponse={item.auditorResponse}
                                        branchResponse={item.branchResponse}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Task Form Modal */}
                {isTaskFormOpen && (
                    <div className="no-print">
                        <TaskForm
                            open={isTaskFormOpen}
                            onOpenChange={setIsTaskFormOpen}
                            onSave={handleSaveTask}
                            branches={branch ? [branch] : []}
                            networkContacts={networkContacts}
                            initialData={{
                                task_type: 'audit_response',
                                subject: `תגובה לביקורת: ${audit.audit_type}`,
                                text: `נדרשת תגובה לביקורת שבוצעה ב-${safeFormatDate(audit.audit_date)} בסניף ${branch?.name}`,
                                related_branch_audit_id: auditId,
                                branch_id: audit.branch_id,
                                branch_name: branch?.name
                            }}
                        />
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
