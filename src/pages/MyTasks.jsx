
import React, { useState, useEffect, useMemo } from 'react';
import { CustomerComplaint, Branch, BranchOwnership, User, Audit, NetworkTask, Training, NetworkTaskRecord, TrainingRecord, PersonalTask } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { RefreshCw, ArrowLeft, BookOpen, ClipboardList, MessageSquareWarning, FileText, CheckCircle, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FullPageError from '../components/FullPageError';

export default function MyTasks() {
    const [initiatedAuditsCount, setInitiatedAuditsCount] = useState(0);
    const [auditsCount, setAuditsCount] = useState(0);
    const [networkTasksCount, setNetworkTasksCount] = useState({ total: 0, completed: 0 });
    const [trainingsCount, setTrainingsCount] = useState({ total: 0, completed: 0 });
    const [branchSpecificTasks, setBranchSpecificTasks] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = await User.me();
            setCurrentUser(user);

            let userBranchIds = [];
            const viewAsBranchId = sessionStorage.getItem('viewAsBranchId'); 
            const selectedOwnerBranchId = sessionStorage.getItem('selectedOwnerBranchId');

            if (user.user_type === 'branch_owner' || user.user_type === 'setup_branch_owner') {
                if (user.isImpersonating && viewAsBranchId) {
                    userBranchIds = [viewAsBranchId];
                } else if (selectedOwnerBranchId) {
                    userBranchIds = [selectedOwnerBranchId];
                } else {
                    try {
                        const ownerships = await BranchOwnership.filter({ user_id: user.id });
                        userBranchIds = Array.isArray(ownerships) ? ownerships.map(o => o.branch_id) : [];
                    } catch (ownershipError) {
                        console.warn('Failed to fetch ownerships:', ownershipError);
                        userBranchIds = [];
                    }
                }

                if (userBranchIds.length > 0) {
                    try {
                        // Fetch data with individual error handling
                        const [initiatedAudits, audits, activeTasks, completedTaskRecords, activeTrainings, completedTrainingRecords, branchTasks] = await Promise.allSettled([
                            CustomerComplaint.filter({ branch_id: { '$in': userBranchIds }, status: { '$in': ['פתוחה', 'בטיפול'] } }),
                            Audit.filter({ branch_id: { '$in': userBranchIds } }),
                            NetworkTask.filter({ is_active: true }),
                            NetworkTaskRecord.filter({ branch_id: { '$in': userBranchIds } }),
                            Training.filter({ is_active: true }),
                            TrainingRecord.filter({ branch_id: { '$in': userBranchIds } }),
                            PersonalTask.filter({ task_type: 'branch_specific', branch_id: { '$in': userBranchIds } }, '-created_date')
                        ]);

                        setInitiatedAuditsCount(
                            initiatedAudits.status === 'fulfilled' && Array.isArray(initiatedAudits.value) 
                                ? initiatedAudits.value.length 
                                : 0
                        );
                        
                        setAuditsCount(
                            audits.status === 'fulfilled' && Array.isArray(audits.value) 
                                ? audits.value.length 
                                : 0
                        );

                        const totalTasks = activeTasks.status === 'fulfilled' && Array.isArray(activeTasks.value) 
                            ? activeTasks.value.length 
                            : 0;
                        const completedUniqueTasks = completedTaskRecords.status === 'fulfilled' && Array.isArray(completedTaskRecords.value)
                            ? new Set(completedTaskRecords.value.map(r => r.task_id)).size
                            : 0;
                        setNetworkTasksCount({ total: totalTasks, completed: completedUniqueTasks });
                        
                        const totalTrainings = activeTrainings.status === 'fulfilled' && Array.isArray(activeTrainings.value) 
                            ? activeTrainings.value.length 
                            : 0;
                        const completedUniqueTrainings = completedTrainingRecords.status === 'fulfilled' && Array.isArray(completedTrainingRecords.value)
                            ? new Set(completedTrainingRecords.value.map(r => r.training_id)).size
                            : 0;
                        setTrainingsCount({ total: totalTrainings, completed: completedUniqueTrainings });

                        setBranchSpecificTasks(
                            branchTasks.status === 'fulfilled' && Array.isArray(branchTasks.value) 
                                ? branchTasks.value 
                                : []
                        );
                    } catch (dataError) {
                        console.error('Error fetching some data:', dataError);
                        // Set safe defaults
                        setInitiatedAuditsCount(0);
                        setAuditsCount(0);
                        setNetworkTasksCount({ total: 0, completed: 0 });
                        setTrainingsCount({ total: 0, completed: 0 });
                        setBranchSpecificTasks([]);
                    }
                } else {
                    // Reset counts if no branches found
                    setInitiatedAuditsCount(0);
                    setAuditsCount(0);
                    setNetworkTasksCount({ total: 0, completed: 0 });
                    setTrainingsCount({ total: 0, completed: 0 });
                    setBranchSpecificTasks([]);
                }
            } else {
                // For non-branch owners, reset all counts
                setInitiatedAuditsCount(0);
                setAuditsCount(0);
                setNetworkTasksCount({ total: 0, completed: 0 });
                setTrainingsCount({ total: 0, completed: 0 });
                setBranchSpecificTasks([]);
            }
        } catch (err) {
            console.error("Failed to fetch data for MyTasks page:", err);
            if (err.message && err.message.includes('Network Error')) {
                setError(new Error("שגיאת רשת: לא ניתן לטעון את המשימות. אנא בדוק את חיבור האינטרנט שלך ונסה שוב."));
            } else {
                setError(err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const pendingBranchTasksCount = useMemo(() => {
        if (!Array.isArray(branchSpecificTasks)) return 0;
        return branchSpecificTasks.filter(task => 
            task.status === 'pending' || task.status === 'בתהליך' || task.status === 'טרם טופלה'
        ).length;
    }, [branchSpecificTasks]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p>טוען נתונים...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <FullPageError
                errorTitle="שגיאה בטעינת המשימות"
                errorMessage={error.message || "לא ניתן היה לטעון את נתוני המשימות. אנא נסה לרענן את הדף."}
                onRetry={fetchData}
            />
        );
    }

    if (!currentUser || (currentUser.user_type !== 'branch_owner' && currentUser.user_type !== 'setup_branch_owner')) {
        return (
            <div className="text-center py-12">
                <MessageSquareWarning className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">גישה מוגבלת</h2>
                <p className="text-gray-500">עמוד זה זמין רק לבעלי סניפים.</p>
            </div>
        );
    }

    const networkTasksPending = Math.max(0, (networkTasksCount?.total || 0) - (networkTasksCount?.completed || 0));
    const trainingsPending = Math.max(0, (trainingsCount?.total || 0) - (trainingsCount?.completed || 0));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">המשימות שלי</h1>
                <Button 
                    onClick={fetchData}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    רענן
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* כרטיס משימות רשת */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <ClipboardList className="w-6 h-6 text-blue-600" />
                            משימות רשת
                        </CardTitle>
                        <CardDescription>
                            משימות כלל-רשתיות שמנהלי המערכת הגדירו
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">משימות ממתינות:</span>
                            <span className="text-2xl font-bold text-blue-600">
                                {networkTasksPending}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            מתוך {networkTasksCount?.total || 0} משימות כולל, {networkTasksCount?.completed || 0} הושלמו
                        </div>
                        <Link to={createPageUrl("NetworkTasks")}>
                            <Button className="w-full" size="sm">
                                צפה במשימות רשת
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* כרטיס הדרכות רשת */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <BookOpen className="w-6 h-6 text-green-600" />
                            הדרכות רשת
                        </CardTitle>
                        <CardDescription>
                            הדרכות חובה שהוגדרו עבור כלל הרשת
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">הדרכות ממתינות:</span>
                            <span className="text-2xl font-bold text-green-600">
                                {trainingsPending}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            מתוך {trainingsCount?.total || 0} הדרכות כולל, {trainingsCount?.completed || 0} הושלמו
                        </div>
                        <Link to={createPageUrl("Trainings")}>
                            <Button className="w-full" size="sm" variant="outline">
                                צפה בהדרכות רשת
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* כרטיס ביקורות יזומות */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <MessageSquareWarning className="w-6 h-6 text-orange-600" />
                            ביקורות יזומות
                        </CardTitle>
                        <CardDescription>
                            ביקורות לקוחות שהתקבלו ודורשות תגובה
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">ביקורות פתוחות:</span>
                            <span className="text-2xl font-bold text-orange-600">
                                {initiatedAuditsCount}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            ביקורות לקוחות הממתינות לטיפול או בטיפול
                        </div>
                        <Link to={createPageUrl("InitiatedAudits")}>
                            <Button className="w-full" size="sm" variant="outline">
                                צפה בביקורות יזומות
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* כרטיס ביקורות סניף */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <FileText className="w-6 h-6 text-purple-600" />
                            ביקורות סניף
                        </CardTitle>
                        <CardDescription>
                            ביקורות שבוצעו בסניף על ידי מנהלי הרשת
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">סך הביקורות:</span>
                            <span className="text-2xl font-bold text-purple-600">
                                {auditsCount}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            כלל הביקורות שבוצעו בסניף לאורך הזמן
                        </div>
                        <Link to={createPageUrl("Audits")}>
                            <Button className="w-full" size="sm" variant="outline">
                                צפה בביקורות סניף
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* כרטיס משימות לסניף */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <Briefcase className="w-6 h-6 text-indigo-600" />
                            משימות לסניף
                        </CardTitle>
                        <CardDescription>
                            משימות ספציפיות שמנהל המערכת שיבץ לסניף שלך
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">משימות ממתינות:</span>
                            <span className="text-2xl font-bold text-indigo-600">
                                {pendingBranchTasksCount}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            מתוך {branchSpecificTasks.length} משימות כולל שהוקצו לסניף
                        </div>
                        <Link to={createPageUrl("BranchSpecificTasks")}>
                            <Button className="w-full" size="sm" variant="outline">
                                צפה במשימות לסניף
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
