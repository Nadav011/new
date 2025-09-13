
import React, { useState, useEffect, useCallback } from 'react';
import { Branch, NetworkTask, NetworkTaskRecord, User, BranchOwnership } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckSquare, AlertCircle, RefreshCw, Search, Filter, Wifi, WifiOff } from 'lucide-react';
import BranchNetworkTaskStatusDialog from '../components/BranchNetworkTaskStatusDialog';
import NetworkTaskRecordForm from '../components/NetworkTaskRecordForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NetworkTasks() {
    const [branches, setBranches] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [taskRecords, setTaskRecords] = useState([]);
    const [branchStatus, setBranchStatus] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [selectedBranch, setSelectedBranch] = useState(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [recordToDelete, setRecordToDelete] = useState(null);

    // Add a flag to prevent multiple simultaneous loads
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Debug state to show what was loaded
    const [debugInfo, setDebugInfo] = useState({
        branchesCount: 0,
        tasksCount: 0,
        recordsCount: 0,
        errors: []
    });

    // Helper function to calculate status for a single branch
    const calculateBranchStatus = useCallback((branchId) => {
        // If no tasks are defined, nothing can be completed or in progress.
        if (tasks.length === 0) return { percentage: 0, completed: 0, inProgress: 0, total: 0 };
        
        // Filter records relevant to this specific branch
        const branchRecords = taskRecords.filter(record => record.branch_id === branchId);
        
        // Use a Map to store the definitive status for each distinct task.
        // 'בוצע' (completed) takes precedence over 'בתהליך' (in progress) for the same task_id.
        const taskStatusMap = new Map(); // Map: taskId -> 'בוצע' | 'בתהליך'

        branchRecords.forEach(record => {
            if (record.status === 'בוצע') {
                taskStatusMap.set(record.task_id, 'בוצע');
            } else if (record.status === 'בתהליך') {
                // Only set 'בתהליך' if the task hasn't already been marked as 'בוצע'
                if (taskStatusMap.get(record.task_id) !== 'בוצע') {
                    taskStatusMap.set(record.task_id, 'בתהליך');
                }
            }
        });

        // Count completed and in-progress distinct tasks
        const completed = Array.from(taskStatusMap.values()).filter(s => s === 'בוצע').length;
        const inProgress = Array.from(taskStatusMap.values()).filter(s => s === 'בתהליך').length;
        const total = tasks.length; // Total *possible* tasks that could be completed/in progress
        
        // Calculate weighted percentage: completed tasks count as 100%, in-progress tasks count as 50%
        const weightedScore = completed + (inProgress * 0.5);
        const percentage = total > 0 ? (weightedScore / total) * 100 : 0;
        
        return {
            percentage: Math.round(percentage), // Round percentage for display
            completed,
            inProgress,
            total
        };
    }, [tasks, taskRecords]); // Dependencies for useCallback

    // Separate effect for calculating status - only when data changes
    useEffect(() => {
        if (branches.length > 0 && tasks.length > 0) {
            calculateStatus();
        }
    }, [branches, tasks, taskRecords, calculateBranchStatus]);

    // Modified loadData function with rate limiting protection
    const loadData = useCallback(async () => {
        // Prevent multiple simultaneous loads
        if (isLoadingData) {
            console.log("Load already in progress, skipping...");
            return;
        }

        setIsLoadingData(true);
        setIsLoading(true);
        setLoadError(null);
        let currentErrors = []; // To collect errors for debugInfo
        
        try {
            console.log("Starting to load data for NetworkTasks page...");
            
            // Load user first
            let user;
            try {
                user = await User.me();
                setCurrentUser(user);
                console.log("User loaded:", user.email, user.user_type);
            } catch (e) {
                currentErrors.push(`User loading failed: ${e.message}`);
                throw new Error(`User loading failed: ${e.message}`); // Re-throw to trigger catch block
            }

            // --- Concurrent data loading ---
            const [rawBranchData, rawTasksData, rawRecordsData] = await Promise.all([
                Branch.list().catch(e => {
                    currentErrors.push(`Branches list loading failed: ${e.message}`);
                    return []; // Return empty array on error
                }),
                NetworkTask.list().catch(e => {
                    currentErrors.push(`Tasks list loading failed: ${e.message}`);
                    return []; // Return empty array on error
                }),
                NetworkTaskRecord.list().catch(e => {
                    currentErrors.push(`Records list loading failed: ${e.message}`);
                    return []; // Return empty array on error
                })
            ]);

            // Ensure all data are arrays
            const branchData = Array.isArray(rawBranchData) ? rawBranchData : [];
            const tasksData = Array.isArray(rawTasksData) ? rawTasksData : [];
            const recordsData = Array.isArray(rawRecordsData) ? rawRecordsData : [];

            console.log("Raw Data loaded - Branches:", branchData.length, "Tasks:", tasksData.length, "Records:", recordsData.length);

            // --- Filter branches based on user type ---
            let userBranches = [];
            if (user.user_type === 'admin' || user.user_type === 'user' || user.user_type === 'operational_manager') {
                userBranches = branchData; // All branches for admin, user, operational_manager
            } else if (user.user_type === 'branch_owner') {
                try {
                    const rawOwnerships = await BranchOwnership.filter({ user_id: user.id });
                    const ownerships = Array.isArray(rawOwnerships) ? rawOwnerships : [];
                    console.log("Found branch ownerships:", ownerships.length);
                    const ownedBranchIds = new Set(ownerships.map(o => o.branch_id)); // Use Set for efficient lookup
                    userBranches = branchData.filter(b => ownedBranchIds.has(b.id));
                } catch (ownershipError) {
                    currentErrors.push(`Branch ownership filtering failed: ${ownershipError.message}`);
                    console.error("Branch ownership loading/filtering failed:", ownershipError);
                    userBranches = []; // No branches if ownership fails
                }
            }
            
            // Sort and set branches
            userBranches.sort((a,b) => (a.name || '').localeCompare(b.name || '', 'he'));
            setBranches(userBranches);
            setTasks(tasksData);
            setTaskRecords(recordsData);

            // Update debug info with collected errors and counts
            setDebugInfo({
                branchesCount: userBranches.length,
                tasksCount: tasksData.length,
                recordsCount: recordsData.length,
                errors: currentErrors
            });

            if (currentErrors.length > 0) {
                setLoadError(`חלק מהנתונים לא נטענו: ${currentErrors.join(', ')}`);
            }

        } catch (error) {
            // Catch any critical errors, including re-thrown user loading error
            console.error("Critical error loading data:", error);
            currentErrors.push(`Critical: ${error.message}`);
            setLoadError(`שגיאה קריטית בטעינת הנתונים: ${error.message}`);
            setBranches([]); // Ensure state is clear on critical failure
            setTasks([]);
            setTaskRecords([]);
            setDebugInfo(prev => ({...prev, errors: currentErrors})); // Update debug info with critical error
        } finally {
            setIsLoading(false);
            setIsLoadingData(false);
        }
    }, [isLoadingData]);

    // Modified status calculation function for all branches - add more debugging info
    const calculateStatus = () => {
        if (tasks.length === 0) {
            setBranchStatus({}); // Clear status if no tasks are available
            console.log("No tasks available, clearing branch status");
            return;
        }

        const newBranchStatus = {};
        console.log(`Calculating status for ${branches.length} branches with ${tasks.length} tasks and ${taskRecords.length} records`);
        
        for (const branch of branches) {
            // Use the helper to get summary for this branch
            const statusSummary = calculateBranchStatus(branch.id);
            // Also keep the raw records for the dialog component
            const recordsForDialog = taskRecords.filter(record => record.branch_id === branch.id);
            newBranchStatus[branch.id] = {
                ...statusSummary, // Spreads percentage, completed, inProgress, total
                records: recordsForDialog // Pass the actual records for the specific branch
            };
            
            // Debug log for problematic branches
            if (statusSummary.percentage === 0 && recordsForDialog.length > 0) {
                console.log(`Branch ${branch.name} has ${recordsForDialog.length} records but 0% completion:`, recordsForDialog);
            }
        }
        
        console.log("Branch status calculated:", Object.keys(newBranchStatus).length, "branches processed");
        setBranchStatus(newBranchStatus);
    };

    const handleBranchClick = (branch) => {
        console.log("Opening branch dialog for:", branch.name, "with status:", branchStatus[branch.id]);
        setSelectedBranch(branch);
        setIsStatusDialogOpen(true);
    };

    const handleOpenForm = (branch) => {
        setSelectedBranch(branch);
        setEditingRecord(null); // Ensure editingRecord is null when adding a new record
        setIsFormOpen(true);
        setIsStatusDialogOpen(false);
    };

    const handleEditRecord = (record) => {
        const branchOfRecord = branches.find(b => b.id === record.branch_id);
        setSelectedBranch(branchOfRecord);
        setEditingRecord(record);
        setIsStatusDialogOpen(false);
        setIsFormOpen(true);
    };

    const handleDeleteRecord = async () => {
        if (!recordToDelete) return;
        try {
            console.log("Deleting record:", recordToDelete.id);
            await NetworkTaskRecord.delete(recordToDelete.id);
            // Reload after delete - this is the RIGHT place to reload
            if (!isLoadingData) {
                setTimeout(() => loadData(), 500);
            }
        } catch (error) {
            console.error("Failed to delete network task record:", error);
            alert("שגיאה במחיקת הרשומה.");
        } finally {
            setRecordToDelete(null);
        }
    };

    const handleSave = () => {
        console.log("Saving task record, will reload data");
        setIsFormOpen(false);
        setEditingRecord(null);
        // Reload data after save - this is the RIGHT place to reload
        if (!isLoadingData) {
            setTimeout(() => loadData(), 500);
        }
    };

    // Load data only once on component mount
    useEffect(() => {
        loadData();
    }, []); // Changed dependency to [] to ensure it runs only once on mount

    // Define filteredBranches as a computed value here
    const filteredBranches = branches.filter(branch =>
        (branch.name && branch.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (branch.city && branch.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // החלוקה לסניפים שהשלימו/לא השלימו
    const branchesWithIncompleteNetwork = filteredBranches.filter(branch => {
        const status = branchStatus[branch.id] || { percentage: 0 };
        return status.percentage < 100;
    });

    const branchesWithCompleteNetwork = filteredBranches.filter(branch => {
        const status = branchStatus[branch.id] || { percentage: 0 };
        return status.percentage === 100;
    });

    // חישוב סטטיסטיקות מעודכנות
    const totalInProgress = filteredBranches.reduce((sum, branch) => {
        const status = branchStatus[branch.id] || { inProgress: 0 };
        return sum + (status.inProgress > 0 ? 1 : 0);
    }, 0);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <div className="ml-4">
                    <p className="text-gray-600">טוען נתונים...</p>
                    <p className="text-xs text-gray-500 mt-1">
                        סניפים: {debugInfo.branchesCount} | 
                        משימות: {debugInfo.tasksCount} | 
                        רשומות: {debugInfo.recordsCount}
                    </p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="space-y-4">
                <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
                    <p className="text-red-600 mb-4">{loadError}</p>
                    <Button onClick={loadData} disabled={isLoadingData}>
                        <RefreshCw className="ml-2 h-4 w-4" /> 
                        נסה שוב
                    </Button>
                </div>

                {/* Debug information for troubleshooting */}
                {debugInfo.errors.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">מידע לפתרון בעיות</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                            <p>נתונים שנטענו: סניפים: {debugInfo.branchesCount}, משימות: {debugInfo.tasksCount}, רשומות: {debugInfo.recordsCount}</p>
                            <div className="mt-2">
                                <p className="font-semibold">שגיאות:</p>
                                <ul className="list-disc list-inside">
                                    {debugInfo.errors.map((error, index) => (
                                        <li key={index} className="text-red-600">{error}</li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CheckSquare className="w-7 h-7" />
                        {currentUser?.user_type === 'branch_owner' && branches.length === 1 ? 'מצב משימות רשתיות - הסניף שלי' : 'מצב משימות רשתיות בסניפים'}
                    </h1>
                </div>

                {/* תקציר כללי */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">סה"כ {tasks.length} משימות פעילות</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span><strong>{branchesWithCompleteNetwork.length}</strong> סניפים השלימו את כל המשימות</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span><strong>{totalInProgress}</strong> סניפים עם משימות בתהליך</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span><strong>{branchesWithIncompleteNetwork.length}</strong> סניפים עדיין חסרים</span>
                        </div>
                        
                        {/* Debug info in summary */}
                        <div className="text-xs text-gray-500 ml-auto">
                            {branches.length} סניפים | {tasks.length} משימות | {taskRecords.length} רשומות
                        </div>
                    </div>
                </div>

                {(currentUser?.user_type !== 'branch_owner' || (currentUser?.user_type === 'branch_owner' && branches.length > 1)) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>סינון וחיפוש</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="חיפוש לפי שם סניף או עיר..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Filter className="w-4 h-4" />
                                    {filteredBranches.length} מתוך {branches.length} סניפים
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* סניפים שטרם השלימו משימות */}
                {branchesWithIncompleteNetwork.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-700">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                סניפים שטרם ביצעו את כל המשימות הרשתיות ({branchesWithIncompleteNetwork.length})
                            </CardTitle>
                            <CardContent className="text-sm text-gray-600 pt-2">
                                הסניפים הבאים עדיין צריכים להשלים משימות רשתיות
                            </CardContent>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>שם הסניף</TableHead>
                                            <TableHead>עיר</TableHead>
                                            <TableHead>משימות שהושלמו</TableHead>
                                            <TableHead className="w-[200px]">אחוז השלמה</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {branchesWithIncompleteNetwork.map(branch => {
                                            // 'status' now contains 'completed', 'inProgress', 'total', 'percentage'
                                            const status = branchStatus[branch.id] || { completed: 0, inProgress: 0, total: tasks.length, percentage: 0 };
                                            return (
                                                <TableRow key={branch.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleBranchClick(branch)}>
                                                    <TableCell className="font-medium">{branch.name}</TableCell>
                                                    <TableCell>{branch.city}</TableCell>
                                                    <TableCell>
                                                        <span className="font-mono text-orange-700">{status.completed}/{status.total}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Progress value={status.percentage} className="w-full h-2 [&>div]:bg-orange-500" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{Math.round(status.percentage)}% הושלמו</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <span className="text-xs text-gray-600 font-mono w-12 text-right">{Math.round(status.percentage)}%</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* סניפים שהשלימו את כל המשימות */}
                {branchesWithCompleteNetwork.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-700">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                סניפים שביצעו את כל המשימות הרשתיות ({branchesWithCompleteNetwork.length})
                            </CardTitle>
                            <CardContent className="text-sm text-gray-600 pt-2">
                                הסניפים הבאים השלימו את כל המשימות הרשתיות הנדרשות
                            </CardContent>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>שם הסניף</TableHead>
                                            <TableHead>עיר</TableHead>
                                            <TableHead>משימות שהושלמו</TableHead>
                                            <TableHead className="w-[200px]">אחוז השלמה</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {branchesWithCompleteNetwork.map(branch => {
                                            // 'status' now contains 'completed', 'inProgress', 'total', 'percentage'
                                            const status = branchStatus[branch.id] || { completed: 0, inProgress: 0, total: tasks.length, percentage: 0 };
                                            return (
                                                <TableRow key={branch.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleBranchClick(branch)}>
                                                    <TableCell className="font-medium">{branch.name}</TableCell>
                                                    <TableCell>{branch.city}</TableCell>
                                                    <TableCell>
                                                        <span className="font-mono text-green-700">{status.completed}/{status.total}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Progress value={status.percentage} className="w-full h-2 [&>div]:bg-green-500" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{Math.round(status.percentage)}% הושלמו</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <span className="text-xs text-gray-600 font-mono w-12 text-right">{Math.round(status.percentage)}%</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {(branchesWithIncompleteNetwork.length === 0 && branchesWithCompleteNetwork.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                        <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">לא נמצאו סניפים התואמים לחיפוש.</p>
                        <div className="text-sm mt-2">
                            <p>סניפים זמינים: {branches.length}</p>
                            <p>משימות זמינות: {tasks.length}</p>
                            <p>רשומות זמינות: {taskRecords.length}</p>
                        </div>
                    </div>
                )}
            </div>

            <BranchNetworkTaskStatusDialog
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                branch={selectedBranch}
                allTasks={tasks}
                taskRecords={branchStatus[selectedBranch?.id]?.records || []}
                onRecordNewTask={handleOpenForm}
                currentUser={currentUser}
                onEditRecord={handleEditRecord}
                onDeleteRecord={setRecordToDelete}
            />

            {(currentUser?.user_type === 'admin') && (
                <NetworkTaskRecordForm
                    open={isFormOpen}
                    onOpenChange={(isOpen) => {
                        setIsFormOpen(isOpen);
                        if (!isOpen) setEditingRecord(null);
                    }}
                    branch={selectedBranch}
                    allTasks={tasks}
                    recordToEdit={editingRecord}
                    onSave={handleSave}
                />
            )}

            <AlertDialog open={!!recordToDelete} onOpenChange={() => setRecordToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את רישום המשימה? לא ניתן לשחזר פעולה זו.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRecord} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </TooltipProvider>
    );
}
