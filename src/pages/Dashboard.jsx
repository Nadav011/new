
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Branch, Audit, QuestionnaireSettings, User, BranchOwnership, BranchSetup, PlannedVisit, TrainingRecord, Training, AccessibilityAudit, BusinessLicense, Notification, NetworkTask } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth }
from 'date-fns';
import { he } from 'date-fns/locale';
import { Award, Store, ClipboardList, ExternalLink, TrendingUp, TrendingDown, AlertCircle, RefreshCw, Bell, CheckCircle, Building, ArrowRight, AlertTriangle, Clock, BookOpen, Wrench, FilePenLine, CalendarClock, MessageSquareWarning, BarChart2, Users, ClipboardCheck, UserCheck } from 'lucide-react';
import ExportButton from '../components/ExportButton';
import FullPageError from '../components/FullPageError';
import { Badge } from '@/components/ui/badge';

// Helper function to get the appropriate icon for a notification type
// Placed outside components to be accessible by AlertsCard
const getNotificationIcon = (type) => {
    switch (type) {
        case 'branch_audit_response_required':
            return <FilePenLine className="w-5 h-5 text-red-500" />;
        case 'planned_visit_overdue':
            return <CalendarClock className="w-5 h-5 text-orange-500" />;
        case 'initiated_audit_received':
            return <MessageSquareWarning className="w-5 h-5 text-blue-500" />;
        default:
            return <Bell className="w-5 h-5 text-gray-500" />;
    }
};

const AlertsCard = () => {
    const [alerts, setAlerts] = useState([]);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchAlerts = async () => {
            setError(null);
            try {
                if (!navigator.onLine) {
                    setError("אין חיבור לרשת.");
                    return;
                }
                const unreadAlerts = await Notification.filter({ is_read: false });
                const sortedAlerts = unreadAlerts
                    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                    .slice(0, 5);
                setAlerts(sortedAlerts);
            } catch (err) {
                console.warn("Could not fetch alerts:", err.message);
                if (err.message === 'Network Error') {
                    setError("שגיאת רשת בטעינת התראות.");
                } else {
                    setError("שגיאה בטעינת התראות.");
                }
            }
        };
        
        fetchAlerts();
        
        const handleRefresh = () => fetchAlerts();
        window.addEventListener('notifications-changed', handleRefresh);
        return () => window.removeEventListener('notifications-changed', handleRefresh);
    }, []);

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-red-500" />
                    דחיפויות והתראות
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="text-center text-red-600 py-4">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                        <p>{error}</p>
                    </div>
                ) : alerts.length > 0 ? (
                    <ul className="space-y-3">
                        {alerts.map(alert => (
                            <li key={alert.id} className="flex items-center gap-3">
                                {getNotificationIcon(alert.type)}
                                <Link to={alert.link} className="text-sm text-gray-800 hover:text-blue-600">
                                    {alert.message}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-500 py-4">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p>אין התראות חדשות. הכל תחת שליטה!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


export default function Dashboard() {
    const [stats, setStats] = useState({ totalBranches: 0, totalAudits: 0, avgScore: 0, setupsInProgress: 0 });
    const [chartData, setChartData] = useState([]);
    const [recentAudits, setRecentAudits] = useState([]);
    const [allAudits, setAllAudits] = useState([]); 
    const [branchScores, setBranchScores] = useState([]); 
    const [questionnaireSettings, setQuestionnaireSettings] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [expiringLicenses, setExpiringLicenses] = useState([]);
    const [dueTrainings, setDueTrainings] = useState([]);
    const [userBranch, setUserBranch] = useState(null); 
    const [branches, setBranches] = useState([]); // New state for the component's branch list
    const [networkTasks, setNetworkTasks] = useState([]); // New state for network tasks
    const [branchPerformance, setBranchPerformance] = useState([]); // New state for branch performance data

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const viewAsBranchId = sessionStorage.getItem('viewAsBranchId'); 
            const selectedOwnerBranchId = sessionStorage.getItem('selectedOwnerBranchId'); 
            const selectedOwnerBranchName = sessionStorage.getItem('selectedOwnerBranchName');
            
            const actualUser = await User.me();
            
            let finalUser = actualUser;
            let effectiveBranchIds = [];
            let isImpersonating = !!viewAsBranchId;
            let isOwnerViewingOne = !!selectedOwnerBranchId;

            let rawBranchesList = await Branch.list();
            let allBranchesList = Array.isArray(rawBranchesList) ? rawBranchesList : [];

            if (isImpersonating) {
                finalUser = { ...actualUser, user_type: 'branch_owner' }; // Treat as branch_owner for logic
                effectiveBranchIds = [viewAsBranchId];
                const impersonatedBranch = allBranchesList.find(b => b.id === viewAsBranchId);
                setUserBranch(impersonatedBranch || null); // Set the branch for title
            } else if (isOwnerViewingOne) {
                effectiveBranchIds = [selectedOwnerBranchId];
                setUserBranch({ id: selectedOwnerBranchId, name: selectedOwnerBranchName });
            } else if (actualUser.user_type === 'branch_owner' || actualUser.user_type === 'setup_branch_owner') {
                let ownerships = [];
                try {
                    ownerships = await BranchOwnership.filter({ user_id: actualUser.id });
                } catch (err) {
                    console.error("Error fetching ownerships for dashboard", err);
                }
                effectiveBranchIds = Array.isArray(ownerships) ? ownerships.map(o => o.branch_id) : [];

                if (effectiveBranchIds.length === 1) {
                     const singleOwnedBranch = allBranchesList.find(b => b.id === effectiveBranchIds[0]);
                     setUserBranch(singleOwnedBranch || null);
                } else if (effectiveBranchIds.length > 1) {
                    setUserBranch({ name: 'מספר סניפים' }); 
                }
            }
            
            setCurrentUser(finalUser);

            let branchesForDashboard = []; 
            let allAuditsData = [];
            let branchSetups = [];
            let networkTasksData = [];
            
            if (finalUser.user_type === 'admin' || finalUser.user_type === 'ops_manager') {
                branchesForDashboard = allBranchesList;
                const auditsRes = await Audit.list();
                allAuditsData = Array.isArray(auditsRes) ? auditsRes : [];
                
                const setupsRes = await BranchSetup.list();
                branchSetups = Array.isArray(setupsRes) ? setupsRes : [];

                const rawTasks = await NetworkTask.list();
                networkTasksData = Array.isArray(rawTasks) ? rawTasks : [];

            } else if (effectiveBranchIds.length > 0) {
                branchesForDashboard = allBranchesList.filter(b => effectiveBranchIds.includes(b.id));
                const auditPromises = effectiveBranchIds.map(id => 
                    Audit.filter({ branch_id: id }).catch(err => {
                        console.warn(`Failed to fetch audits for branch ${id}:`, err);
                        return []; 
                    })
                );
                const auditsByBranch = await Promise.all(auditPromises);
                allAuditsData = auditsByBranch.flat();

                const tasksPromises = effectiveBranchIds.map(id => NetworkTask.filter({ branch_id: id }));
                const tasksResults = await Promise.all(tasksPromises);
                networkTasksData = tasksResults.flat();

            } else { 
                branchesForDashboard = [];
                allAuditsData = [];
                branchSetups = [];
                networkTasksData = [];
            }
            
            setBranches(branchesForDashboard);
            setNetworkTasks(networkTasksData);

            const branchStats = branchesForDashboard.map(branch => ({
                id: branch.id,
                name: branch.name,
                lastAudit: null, 
                openTasks: networkTasksData.filter(task => task.branch_id === branch.id && task.status === 'פתוח').length, 
            }));
            setBranchPerformance(branchStats);

            // Fetch Questionnaire Settings
            const settingsResultRaw = await QuestionnaireSettings.list();
            const settingsResult = Array.isArray(settingsResultRaw) ? settingsResultRaw : [];
            const settingsMap = {};
            settingsResult.forEach(setting => {
                settingsMap[setting.questionnaire_type] = setting;
            });
            setQuestionnaireSettings(settingsMap);


            // Manually sort all audits once by date descending
            allAuditsData.sort((a, b) => new Date(b.audit_date) - new Date(a.audit_date));
            const auditsForRecentDisplay = allAuditsData.slice(0, 5); 

            const activeBranches = branchesForDashboard.filter(branch => branch.status === 'active');
            const totalBranches = activeBranches.length;
            const totalAudits = allAuditsData.length;
            
            const setupsInProgress = (finalUser.user_type !== 'branch_owner' && finalUser.user_type !== 'setup_branch_owner') ? 
                branchSetups.filter(setup => setup.status === 'בתהליך').length : 0;
            
            const validAudits = allAuditsData.filter(a => a.overall_score !== null && a.overall_score !== undefined);
            const avgScore = validAudits.length > 0 
                ? (validAudits.reduce((acc, audit) => acc + audit.overall_score, 0) / validAudits.length).toFixed(1)
                : 0;

            setStats({ totalBranches, totalAudits, avgScore, setupsInProgress });
            setAllAudits(allAuditsData); 

            const recentAuditsWithBranchNames = await Promise.all(
                auditsForRecentDisplay.map(async (audit) => {
                    try {
                        if (!audit.branch_id || audit.branch_id.startsWith('temp_')) {
                            return { ...audit, branchName: 'סניף לא זמין' };
                        }
                        const branch = allBranchesList.find(b => b.id === audit.branch_id); 
                        return { ...audit, branchName: branch?.name || 'סניף נמחק' };
                    } catch (error) {
                        console.error(`Error getting branch for audit ${audit.id}:`, error);
                        return { ...audit, branchName: 'סניף נמחק' };
                    }
                })
            );
            setRecentAudits(recentAuditsWithBranchNames);

            if (finalUser.user_type !== 'branch_owner' && finalUser.user_type !== 'setup_branch_owner') {
                const branchMap = {};
                branchesForDashboard.forEach(b => {
                    branchMap[b.id] = { id: b.id, name: b.name, scores: [] };
                });
                
                validAudits.forEach(a => {
                    if (a.branch_id && branchMap[a.branch_id]) {
                        branchMap[a.branch_id].scores.push(a.overall_score);
                    }
                });

                const avgBranchScores = Object.values(branchMap)
                    .map(data => ({
                        id: data.id,
                        name: data.name,
                        avgScore: data.scores.length > 0 ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1) : 0
                    }))
                    .filter(d => d.avgScore > 0)
                    .sort((a, b) => b.avgScore - a.avgScore);

                setBranchScores(avgBranchScores);
            }


            // Prepare chart data (audits per month) - FIXED LOGIC
            const auditsByMonth = {};
            allAuditsData.forEach(audit => {
                const month = format(new Date(audit.audit_date), 'yyyy-MM');
                auditsByMonth[month] = (auditsByMonth[month] || 0) + 1;
            });

            const sortedMonths = Object.keys(auditsByMonth).sort();
            const chart = sortedMonths.map(month => ({
                name: format(new Date(`${month}-01T00:00:00`), 'MMM yy', { locale: he }),
                audits: auditsByMonth[month]
            }));

            setChartData(chart);
            

            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            const branchesForLicenseCheck = (finalUser.user_type === 'admin' || finalUser.user_type === 'ops_manager') 
                ? allBranchesList 
                : allBranchesList.filter(b => effectiveBranchIds.includes(b.id));

            const expiringLic = branchesForLicenseCheck.map(b => {
                const alerts = [];
                if (b.business_license_end_date && new Date(b.business_license_end_date) <= thirtyDaysFromNow) {
                    alerts.push({
                        type: 'רישיון עסק',
                        branchName: b.name,
                        dueDate: b.business_license_end_date,
                        link: createPageUrl(`BranchDetails?id=${b.id}`)
                    });
                }
                if (b.accessibility_approval_end_date && new Date(b.accessibility_approval_end_date) <= thirtyDaysFromNow) {
                    alerts.push({
                        type: 'אישור נגישות',
                        branchName: b.name,
                        dueDate: b.accessibility_approval_end_date,
                        link: createPageUrl(`BranchDetails?id=${b.id}`)
                    });
                }
                return alerts;
            }).flat().sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

            setExpiringLicenses(expiringLic);

            if (finalUser.user_type === 'branch_owner' || finalUser.user_type === 'setup_branch_owner') {
                 const trainings = await Training.filter({ is_active: true, frequency_in_months: { '$gt': 0 } }).catch(() => []);
                 const records = await TrainingRecord.filter({ branch_id: { '$in': effectiveBranchIds } }).catch(() => []);

                const due = [];
                for (const training of trainings) {
                    for (const branchId of effectiveBranchIds) {
                        const branchRecords = records
                            .filter(r => r.training_id === training.id && r.branch_id === branchId)
                            .sort((a, b) => new Date(b.completion_date) - new Date(a.completion_date));
                        
                        const lastRecord = branchRecords[0];
                        const branchName = allBranchesList.find(b => b.id === branchId)?.name || 'סניף לא ידוע';

                        if (!lastRecord) {
                            due.push({ 
                                id: `${training.id}-${branchId}-never`, 
                                trainingName: training.name, 
                                branchName, 
                                dueDate: 'מעולם לא בוצע', 
                                link: createPageUrl(`TrainingRecordsList?branch_id=${branchId}&training_id=${training.id}`)
                            });
                        } else {
                            const nextDueDate = new Date(lastRecord.completion_date);
                            nextDueDate.setMonth(nextDueDate.getMonth() + training.frequency_in_months);
                            if (nextDueDate <= new Date()) {
                                due.push({ 
                                    id: `${training.id}-${branchId}-${lastRecord.id}`, 
                                    trainingName: training.name, 
                                    branchName, 
                                    dueDate: format(nextDueDate, 'dd/MM/yyyy'), 
                                    link: createPageUrl(`TrainingRecordsList?branch_id=${branchId}&training_id=${training.id}`)
                                });
                            }
                        }
                    }
                }
                setDueTrainings(due);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            if (error.message && error.message.includes('Network Error')) {
                 setLoadError(new Error("שגיאת רשת: לא ניתן לטעון את נתוני לוח הבקרה. אנא בדוק את חיבור האינטרנט שלך ונסה לרענן את הדף."));
            } else {
                 setLoadError(error);
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const topPerformer = branchScores.length > 0 ? branchScores[0] : null;
    const lowestPerformer = branchScores.length > 1 ? branchScores[branchScores.length - 1] : null;

    const getAuditTypeColor = (type) => {
        const colors = {
            'גלויה': 'bg-blue-100 text-blue-700',
            'סמויה': 'bg-purple-100 text-purple-700',
            'לקוח סמוי - ביקור בעסק': 'bg-green-100 text-green-700',
            'לקוח סמוי - משלוח': 'bg-orange-100 text-orange-700',
            'לקוח סמוי - איסוף עצמי': 'bg-yellow-100 text-yellow-700',
            'ריאיון עם מנהל סניף': 'bg-pink-100 text-pink-700',
            'ריאיונות עם לקוחות הסניף': 'bg-teal-100 text-teal-700',
            'ריאיונות עם עובדי הסניף': 'bg-cyan-100 text-cyan-700'
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'פתוח':
                return 'bg-red-100 text-red-700';
            case 'בתהליך':
                return 'bg-orange-100 text-orange-700';
            case 'סגור':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, linkTo, subtitle }) => (
        <Link to={linkTo} className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        {title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{value}</div>
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    {title.includes('סניפים') && (currentUser?.user_type !== 'branch_owner' && currentUser?.user_type !== 'setup_branch_owner') && stats.setupsInProgress > 0 && (
                        <p className="text-base font-medium text-orange-600 mt-1">
                            + {stats.setupsInProgress}{' '}
                            <Link 
                                to={createPageUrl("BranchSetupList")} 
                                className="underline hover:text-orange-800"
                                onClick={(e) => { e.stopPropagation(); }}
                            >
                                בהקמה
                            </Link>
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );

    const PerformerCard = ({ title, performer, icon: Icon, color }) => (
        <Link to={performer ? `${createPageUrl('BranchDetails')}?id=${performer.id}` : '#'} className={`block ${!performer ? 'cursor-not-allowed' : ''}`}>
            <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                    <Icon className={`h-5 w-5 ${color}`} />
                </CardHeader>
                <CardContent>
                    {performer ? (
                        <>
                            <div className="text-2xl font-bold truncate">{performer.name}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                ציון ממוצע: <span className={`font-semibold ${color}`}>{performer.avgScore}</span>
                            </p>
                        </>
                    ) : (
                        <div className="text-xl font-semibold text-gray-400 pt-2">אין נתונים</div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                    <div className="text-lg">טוען נתוני לוח הבקרה...</div>
                </div>
            </div>
        );
    }
    
    if (loadError) {
        return (
            <FullPageError
                errorTitle="שגיאה בטעינת לוח הבקרה"
                errorMessage={loadError.message || "אירעה שגיאה בטעינת נתוני לוח הבקרה. נסה לרענן את הדף."}
                onRetry={fetchData}
            />
        );
    }

    const pageTitle = userBranch 
        ? `לוח בקרה - ${userBranch.name}`
        : "לוח בקרה כללי";

    return (
        <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
                {(currentUser && (currentUser.user_type !== 'branch_owner' && currentUser.user_type !== 'setup_branch_owner')) && (
                    <ExportButton audits={allAudits} />
                )}
            </div>
            
            {currentUser && (currentUser.user_type === 'admin' || currentUser.user_type === 'ops_manager') && (
                <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mt-6">
                    <StatCard 
                        title={'סניפים פעילים'} 
                        value={stats.totalBranches} 
                        icon={Store} 
                        color="text-blue-500"
                        linkTo={createPageUrl("Branches")}
                        subtitle={'צפה בכל הסניפים'}
                    />
                    <StatCard 
                        title="ביקורות שבוצעו" 
                        value={stats.totalAudits} 
                        icon={ClipboardList} 
                        color="text-green-500"
                        linkTo={createPageUrl("Audits")}
                        subtitle={'צפה בכל הביקורות'}
                    />
                    <PerformerCard
                        title="סניף מצטיין"
                        performer={topPerformer}
                        icon={TrendingUp}
                        color="text-emerald-500"
                    />
                    <PerformerCard
                        title="סניף טעון שיפור"
                        performer={lowestPerformer}
                        icon={TrendingDown}
                        color="text-red-500"
                    />
                </div>
            )}
            
            {currentUser && (currentUser.user_type === 'branch_owner' || currentUser.user_type === 'setup_branch_owner') && (
                 <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-3 mt-6">
                     <StatCard 
                        title={'הסניפים שלי'} 
                        value={stats.totalBranches} 
                        icon={Store} 
                        color="text-blue-500"
                        linkTo={createPageUrl("Branches")}
                        subtitle={'צפה בפרטי הסניפים'}
                    />
                    <StatCard 
                        title="ביקורות שבוצעו" 
                        value={stats.totalAudits} 
                        icon={ClipboardList} 
                        color="text-green-500"
                        linkTo={createPageUrl("Audits")}
                        subtitle={'ביקורות בסניפים שלי'}
                    />
                    <Card className="col-span-2 md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-center">ציון ממוצע לסניפים שלי</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-blue-600 mb-2">{stats.avgScore}</div>
                                <p className="text-sm text-gray-500">מתוך 10</p>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2 mt-6">
                {(currentUser && (currentUser.user_type !== 'branch_owner' && currentUser.user_type !== 'setup_branch_owner')) && <AlertsCard />}
                
                <Card className={(currentUser && (currentUser.user_type === 'branch_owner' || currentUser.user_type === 'setup_branch_owner')) ? 'lg:col-span-2' : ''}>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                        <CardTitle>{(currentUser && (currentUser.user_type === 'branch_owner' || currentUser.user_type === 'setup_branch_owner')) ? 'ביקורות אחרונות בסניפים שלי' : 'דירוג סניפים (ציון ממוצע)'}</CardTitle>
                        {(currentUser && (currentUser.user_type !== 'branch_owner' && currentUser.user_type !== 'setup_branch_owner')) && (
                            <Link 
                                to={createPageUrl("Branches")} 
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                צפה בכל הסניפים <ExternalLink className="h-3 w-3" />
                            </Link>
                        )}
                    </CardHeader>
                    <CardContent>
                        {(currentUser && (currentUser.user_type === 'branch_owner' || currentUser.user_type === 'setup_branch_owner')) || branchScores.length === 0 ? (
                            recentAudits.length > 0 ? (
                                <ul className="space-y-4">
                                    {recentAudits.map(audit => (
                                        <li 
                                            key={audit.id} 
                                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                            onClick={() => window.location.href = createPageUrl(`AuditDetails?id=${audit.id}`)}
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold">{audit.branchName}</p>
                                                <p className="text-sm text-gray-500">{`בוצע ע"י ${audit.auditor_name} ב-${format(new Date(audit.audit_date), 'd MMMM yyyy', { locale: he })}`}</p>
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getAuditTypeColor(audit.audit_type)}`}>
                                                    {questionnaireSettings[audit.audit_type]?.custom_name || audit.audit_type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="text-lg font-bold p-2 rounded-md bg-gray-200">
                                                    {audit.overall_score}
                                                </div>
                                                <ExternalLink className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center justify-center h-60 text-gray-500">
                                    אין ביקורות להצגה
                                </div>
                            )
                        ) : (
                            <div className="h-64 md:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={branchScores} layout="vertical" margin={{ right: 20, left: 40}}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 10]} />
                                        <YAxis dataKey="name" type="category" width={80} />
                                        <Tooltip />
                                        <Bar dataKey="avgScore" fill="#10B981" name="ציון ממוצע" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {(currentUser && (currentUser.user_type === 'branch_owner' || currentUser.user_type === 'setup_branch_owner')) && <AlertsCard />}

                {expiringLicenses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                רישיונות ואישורים קרובים לתפוגה
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {expiringLicenses.map((license, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                        <Link to={license.link} className="text-sm text-gray-800 hover:text-blue-600">
                                            <p className="font-semibold">{license.branchName}</p>
                                            <p className="text-xs text-gray-600">{license.type} פג תוקף ב: <span className="font-medium">{format(new Date(license.dueDate), 'dd/MM/yyyy', { locale: he })}</span></p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {dueTrainings.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-500" />
                                הדרכות נדרשות לביצוע
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {dueTrainings.map(training => (
                                    <li key={training.id} className="flex items-start gap-3">
                                        <Wrench className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                        <Link to={training.link} className="text-sm text-gray-800 hover:text-blue-600">
                                            <p className="font-semibold">{training.trainingName}</p>
                                            <p className="text-xs text-gray-600">{training.branchName}: <span className="font-medium">{training.dueDate === 'Never' ? 'מעולם לא בוצע' : `תאריך יעד: ${training.dueDate}`}</span></p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
                
                {(currentUser && (currentUser.user_type !== 'branch_owner' && currentUser.user_type !== 'setup_branch_owner')) && (
                    <Card>
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                            <CardTitle>ביקורות אחרונות</CardTitle>
                            <Link 
                                to={createPageUrl("Audits")} 
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                צפה בכל הביקורות <ExternalLink className="h-3 w-3" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentAudits.length > 0 ? (
                                <ul className="space-y-4">
                                    {recentAudits.map(audit => (
                                        <li 
                                            key={audit.id} 
                                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                            onClick={() => window.location.href = createPageUrl(`AuditDetails?id=${audit.id}`)}
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold">{audit.branchName}</p>
                                                <p className="text-sm text-gray-500">{`בוצע ע"י ${audit.auditor_name} ב-${format(new Date(audit.audit_date), 'd MMMM yyyy', { locale: he })}`}</p>
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getAuditTypeColor(audit.audit_type)}`}>
                                                    {questionnaireSettings[audit.audit_type]?.custom_name || audit.audit_type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="text-lg font-bold p-2 rounded-md bg-gray-200">
                                                    {audit.overall_score}
                                                </div>
                                                <ExternalLink className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center justify-center h-60 text-gray-500">
                                    אין ביקורות להצגה
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {(currentUser && (currentUser.user_type !== 'branch_owner' && currentUser.user_type !== 'setup_branch_owner')) && chartData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>מספר ביקורות לאורך זמן</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 md:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="audits" fill="#8884d8" name="מספר ביקורות" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
