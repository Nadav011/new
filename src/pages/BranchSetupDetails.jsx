
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BranchSetup, SetupTask, BranchSetupProgress, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardHat, User as UserIcon, Calendar, Phone, Mail, Percent, CheckCircle, Clock, Edit, FileText, ChevronDown, ChevronUp, GanttChart } from 'lucide-react';
import TaskProgressUpdater from '../components/TaskProgressUpdater';
import { createPageUrl } from '@/utils';
import BranchSetupNotesDialog from '../components/BranchSetupNotesDialog';

const InfoCard = ({ icon, title, children }) => (
    <div className="flex items-start gap-4">
        <div className="bg-gray-100 p-2 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="font-semibold">{children}</p>
        </div>
    </div>
);

export default function BranchSetupDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const [setupDetails, setSetupDetails] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [progress, setProgress] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openTasks, setOpenTasks] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [isOwnerView, setIsOwnerView] = useState(false);
    const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

    const setupId = useMemo(() => new URLSearchParams(location.search).get('id'), [location.search]);

    const loadData = useCallback(async () => {
        if (!setupId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [setupData, tasksData, progressData, userData] = await Promise.all([
                BranchSetup.get(setupId),
                SetupTask.list('order_index'),
                BranchSetupProgress.filter({ branch_setup_id: setupId }),
                User.me()
            ]);

            setSetupDetails(setupData);
            setTasks(tasksData);
            setProgress(progressData);
            setCurrentUser(userData);

            const isOwner = userData.email === setupData.franchisee_email;
            const isAdmin = userData.user_type === 'admin';
            setIsOwnerView(isOwner && !isAdmin);

        } catch (error) {
            console.error("Failed to load branch setup details:", error);
        } finally {
            setIsLoading(false);
        }
    }, [setupId]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const toggleTask = (taskId) => {
        setOpenTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    const overallProgress = useMemo(() => {
        const completedTasks = progress.filter(p => p.status === 'הושלם').length;
        return tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    }, [progress, tasks]);

    const handleProgressChange = useCallback(async () => {
        // Just reload all data to ensure consistency
        await loadData();
    }, [loadData]);

    const getReportToolbarHTML = useCallback((reportTitle) => {
        const encodedTitle = encodeURIComponent(reportTitle);
        const emailBody = encodeURIComponent(`שלום,\n\nמצורף דוח בנושא: ${reportTitle}.\n\nבברכה,\nצוות המקסיקני`);
        const whatsappText = encodeURIComponent(`היי, מצורף דוח בנושא: ${reportTitle}`);

        return `
          <div id="report-toolbar" style="position: fixed; top: 0; left: 0; right: 0; background: #fff; padding: 10px 20px; display: flex; align-items: center; gap: 10px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-bottom: 1px solid #e2e8f0; font-family: sans-serif; direction: rtl;">
            <span style="font-weight: bold; margin-left: auto; font-size: 16px; color: #1a202c;">${reportTitle}</span>
            <button onclick="window.print()" title="הדפסה / שמירה כ-PDF">🖨️ הדפסה / PDF</button>
            <button onclick="shareViaWhatsApp()" title="שיתוף ב-WhatsApp">💬 WhatsApp</button>
            <button onclick="shareViaEmail()" title="שיתוף באימייל">📧 אימייל</button>
            <button onclick="window.close()" title="סגירה" style="background-color: #f56565;">❌ סגירה</button>
          </div>
          <style>
            #report-toolbar button { display: inline-flex; align-items: center; gap: 5px; background-color: #4299e1; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s; }
            #report-toolbar button:hover { background-color: #2b6cb0; }
            #report-toolbar button[title='סגירה'] { background-color: #f56565; }
            #report-toolbar button[title='סגירה']:hover { background-color: #c53030; }
            body { padding-top: 70px; }
            @media print { #report-toolbar { display: none; } body { padding-top: 0; } }
          </style>
          <script>
            function shareViaWhatsApp() { window.open('https://wa.me/?text=' + "${whatsappText}", '_blank'); }
            function shareViaEmail() { window.location.href = 'mailto:?subject=' + "${encodedTitle}" + '&body=' + "${emailBody}"; }
          <\/script>
        `;
    }, []);

    const printGanttChart = useCallback(() => {
        if (!setupDetails) {
            console.warn("setupDetails is not loaded, cannot print Gantt chart.");
            return;
        }

        const reportTitle = `דוח התקדמות הקמת סניף: ${setupDetails.branch_name}`;
        const toolbar = getReportToolbarHTML(reportTitle);
        
        // This element is assumed to exist and contain the Gantt chart content.
        // It's typically hidden on the page but made visible or populated for printing.
        const ganttElement = document.getElementById('gantt-chart-container');
        if (!ganttElement) {
            console.error("Gantt chart container not found. Cannot print.");
            return;
        }
        const ganttContent = ganttElement.innerHTML;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${reportTitle}</title>
                    <style>
                        /* General print styles for the report content */
                        body { font-family: Arial, sans-serif; margin: 0; padding: 0; direction: rtl; }
                        .print-container { padding: 20px; }
                        h1 { font-size: 24px; margin-bottom: 20px; text-align: center; }
                        /* Add any specific styles for the gantt-chart-container content here if needed for printing */
                        
                        /* Hide elements not needed in print */
                        @media print {
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body dir="rtl">
                    ${toolbar}
                    <div class="print-container">
                        <h1>${reportTitle}</h1>
                        ${ganttContent}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    }, [setupDetails, getReportToolbarHTML]);


    if (isLoading) return <div>טוען נתונים...</div>;
    if (!setupDetails) return <div>לא נמצאו פרטי הקמה.</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <HardHat className="w-7 h-7 text-orange-500" />
                            פרטי הקמה: {setupDetails.branch_name}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            סטטוס נוכחי: <Badge variant="outline">{setupDetails.status}</Badge>
                        </p>
                    </div>
                    <div className="flex gap-2">
                         <Button onClick={() => setIsNotesDialogOpen(true)} variant="outline">
                            <FileText className="w-4 h-4 ml-2" />
                            הערות כלליות
                        </Button>
                        <Button onClick={printGanttChart} variant="outline">
                            <GanttChart className="w-4 h-4 ml-2" />
                            הדפס דוח התקדמות
                        </Button>
                        {!isOwnerView && (
                            <Button onClick={() => navigate(createPageUrl('EditBranchSetup', { id: setupId }))}>
                                <Edit className="w-4 h-4 ml-2" />
                                ערוך פרטי הקמה
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoCard icon={<UserIcon className="w-5 h-5 text-gray-600"/>} title="שם הזכיין">{setupDetails.franchisee_name}</InfoCard>
                    <InfoCard icon={<Phone className="w-5 h-5 text-gray-600"/>} title="טלפון ליצירת קשר">{setupDetails.franchisee_phone}</InfoCard>
                    <InfoCard icon={<Mail className="w-5 h-5 text-gray-600"/>} title="אימייל זכיין">{setupDetails.franchisee_email}</InfoCard>
                    <InfoCard icon={<Calendar className="w-5 h-5 text-gray-600"/>} title="תאריך התחלה">{format(new Date(setupDetails.start_date), 'dd/MM/yyyy')}</InfoCard>
                    {setupDetails.target_opening_date && <InfoCard icon={<Calendar className="w-5 h-5 text-gray-600"/>} title="יעד פתיחה">{format(new Date(setupDetails.target_opening_date), 'dd/MM/yyyy')}</InfoCard>}
                    {setupDetails.actual_opening_date && <InfoCard icon={<CheckCircle className="w-5 h-5 text-green-600"/>} title="תאריך פתיחה בפועל">{format(new Date(setupDetails.actual_opening_date), 'dd/MM/yyyy')}</InfoCard>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Percent className="w-6 h-6" />
                        התקדמות כוללת
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Progress value={overallProgress} className="w-full" />
                    <p className="text-center mt-2 text-sm text-gray-600">
                        {Math.round(overallProgress)}% הושלם
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>צ'קליסט משימות</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {tasks.map(task => {
                         const taskProgress = progress.find(p => p.task_id === task.id) || { status: 'לא התחיל', sub_task_statuses: [] };
                         const isTaskOpen = openTasks[task.id];
                        return (
                            <div key={task.id} className="border rounded-lg">
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                    onClick={() => toggleTask(task.id)}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        {isTaskOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        <h3 className="font-semibold">{task.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-gray-500">{task.description}</p>
                                        <Badge variant="secondary">{taskProgress.status}</Badge>
                                    </div>
                                </div>
                                {isTaskOpen && (
                                    <div className="p-4 border-t bg-gray-50/50">
                                       <TaskProgressUpdater 
                                            setupId={setupId}
                                            task={task}
                                            initialProgress={taskProgress}
                                            onProgressChange={handleProgressChange}
                                            isOwnerView={isOwnerView}
                                            allRoles={[]}
                                       />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Placeholder for Gantt Chart content. In a real application, this div would likely contain
                a rendered Gantt chart component whose HTML content would be captured for printing. */}
            <div id="gantt-chart-container" className="hidden">
                {setupDetails && (
                    <>
                        <h2>דוח התקדמות עבור סניף: {setupDetails.branch_name}</h2>
                        <p>זהו תוכן מדומה של תרשים גאנט. כאן יוצג התרשים בפועל בעת ההדפסה.</p>
                        <ul>
                            {tasks.map(task => (
                                <li key={task.id}>
                                    <strong>{task.name}</strong>: {progress.find(p => p.task_id === task.id)?.status || 'לא התחיל'}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <BranchSetupNotesDialog
                open={isNotesDialogOpen}
                onOpenChange={setIsNotesDialogOpen}
                setupId={setupId}
                isOwnerView={isOwnerView}
            />

        </div>
    );
}
