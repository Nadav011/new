
import React, { useState, useEffect, useCallback } from 'react';
import { NetworkTask, Branch, NetworkTaskRecord, User, BranchOwnership } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Save, CheckSquare, RefreshCw, AlertCircle, Wifi, WifiOff, Plus, ListChecks, ArrowRight, ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NetworkTaskProgressReport from '../components/NetworkTaskProgressReport';
import NetworkTaskRecordForm from '../components/NetworkTaskRecordForm';
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const TaskForm = ({ open, onOpenChange, task, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        frequency_in_months: 0,
        responsible_person: '',
        instructions_url: '',
        is_active: true
    });

    useEffect(() => {
        if (task) {
            setFormData({
                name: task.name || '',
                description: task.description || '',
                frequency_in_months: task.frequency_in_months || 0,
                responsible_person: task.responsible_person || '',
                instructions_url: task.instructions_url || '',
                is_active: task.is_active !== undefined ? task.is_active : true
            });
        } else {
            setFormData({
                name: '',
                description: '',
                frequency_in_months: 0,
                responsible_person: '',
                instructions_url: '',
                is_active: true
            });
        }
    }, [task]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{task ? 'עריכת משימה רשתית' : 'משימה רשתית חדשה'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="name">שם המשימה *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">תיאור המשימה</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="תיאור קצר של המשימה הרשתית..."
                        />
                    </div>
                    <div>
                        <Label htmlFor="frequency_in_months">תדירות בחודשים (0 = חד פעמית)</Label>
                        <Input
                            id="frequency_in_months"
                            type="number"
                            min="0"
                            value={formData.frequency_in_months}
                            onChange={(e) => handleChange('frequency_in_months', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="responsible_person">אחראי מרכזי</Label>
                        <Input
                            id="responsible_person"
                            value={formData.responsible_person}
                            onChange={(e) => handleChange('responsible_person', e.target.value)}
                            placeholder="שם האחראי המרכזי למשימה..."
                        />
                    </div>
                    <div>
                        <Label htmlFor="instructions_url">קישור להוראות</Label>
                        <Input
                            id="instructions_url"
                            value={formData.instructions_url}
                            onChange={(e) => handleChange('instructions_url', e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
                    <Button type="submit" onClick={handleSubmit}>
                        <Save className="ml-2 h-4 w-4" />
                        {task ? 'עדכן' : 'צור'} משימה
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function ManageNetworkTasks() {
    const [tasks, setTasks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [taskRecords, setTaskRecords] = useState([]);
    const [taskStats, setTaskStats] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false); // For task form
    const [selectedTask, setSelectedTask] = useState(null); // For task form
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [networkError, setNetworkError] = useState(false);
    const [retryAttempts, setRetryAttempts] = useState(0);
    const [error, setError] = useState(null); // New error state from outline

    // New states for record management
    const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
    const [selectedTaskForRecord, setSelectedTaskForRecord] = useState(null);
    const [selectedBranchForRecord, setSelectedBranchForRecord] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isBulkAdd, setIsBulkAdd] = useState(false);
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [isSavingRecord, setIsSavingRecord] = useState(false);


    useEffect(() => {
        loadData();
    }, []);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const sendNotificationEmailToBranchOwners = async (branchId, subject, body) => {
        try {
            const ownerships = await BranchOwnership.filter({ branch_id: branchId });
            if (!ownerships || ownerships.length === 0) {
                console.log(`No owners found for branch ${branchId}. No email sent.`);
                return;
            }

            const ownerUserIds = ownerships.map(o => o.user_id);
            const allUsers = await User.list();
            const owners = allUsers.filter(u => ownerUserIds.includes(u.id));

            for (const owner of owners) {
                if (owner.email) {
                    const personalizedBody = body.replace(/\[שם בעל הסניף\]/g, owner.full_name);
                    await SendEmail({
                        to: owner.email,
                        subject: subject,
                        body: personalizedBody,
                    });
                }
            }
        } catch (emailError) {
            console.error(`Failed to send notification email for branch ${branchId}:`, emailError);
        }
    };

    const loadData = async (attempt = 1) => {
        const maxAttempts = 3;
        setIsLoading(true);
        setNetworkError(false);
        setError(null);
        
        try {
            // Wait a bit before retrying to allow network to recover
            if (attempt > 1) {
                await sleep(1000 * attempt);
            }

            console.log(`Loading data - attempt ${attempt}`);
            
            const [tasksData, branchesData, recordsData] = await Promise.all([
                NetworkTask.list().catch(err => {
                    console.error("Error loading NetworkTask:", err);
                    return [];
                }),
                Branch.list().catch(err => {
                    console.error("Error loading Branch:", err);
                    return [];
                }),
                NetworkTaskRecord.list().catch(err => {
                    console.error("Error loading NetworkTaskRecord:", err);
                    return [];
                })
            ]);

            setTasks(tasksData || []);
            setBranches(branchesData || []);
            setTaskRecords(recordsData || []);

            calculateTaskStats(tasksData || [], branchesData || [], recordsData || []);
            
            setRetryAttempts(0);
            console.log("Data loaded successfully");
            
        } catch (error) {
            console.error(`Error loading data (attempt ${attempt}):`, error);
            setError(error);
            
            if (attempt < maxAttempts) {
                setRetryAttempts(attempt);
                setTimeout(() => loadData(attempt + 1), 2000 * attempt);
                return;
            }
            
            setNetworkError(true);
            setTasks([]);
            setBranches([]);
            setTaskRecords([]);
            setTaskStats({});
        } finally {
            setIsLoading(false);
        }
    };

    const calculateTaskStats = (allTasks, allBranches, allRecords) => {
        const activeBranches = allBranches.filter(branch => branch.status === 'active');
        const totalBranchesCount = activeBranches.length;

        const stats = {};

        allTasks.forEach(task => {
            const taskRecordsForThisTask = allRecords.filter(record => record.task_id === task.id);

            const branchStatusMap = new Map(); // branchId -> status ('בוצע', 'בתהליך')

            taskRecordsForThisTask.forEach(record => {
                const isBranchActive = activeBranches.some(branch => branch.id === record.branch_id);
                if (isBranchActive) {
                    // Prioritize 'בוצע' over 'בתהליך'
                    if (record.status === 'בוצע') {
                        branchStatusMap.set(record.branch_id, 'בוצע');
                    } else if (record.status === 'בתהליך' && branchStatusMap.get(record.branch_id) !== 'בוצע') {
                        branchStatusMap.set(record.branch_id, 'בתהליך');
                    }
                }
            });

            let completed = 0;
            let inProgress = 0;
            branchStatusMap.forEach(status => {
                if (status === 'בוצע') {
                    completed++;
                } else if (status === 'בתהליך') {
                    inProgress++;
                }
            });

            const notStarted = totalBranchesCount - (completed + inProgress);

            stats[task.id] = {
                total: totalBranchesCount,
                completed: completed,
                inProgress: inProgress,
                notStarted: notStarted,
                percentage: totalBranchesCount > 0 ? Math.round(((completed + (inProgress * 0.5)) / totalBranchesCount) * 100) : 0,
                // Add these for backward compatibility if NetworkTaskProgressReport expects them
                completedBranches: completed,
                totalBranches: totalBranchesCount,
            };
        });

        setTaskStats(stats);
    };

    const handleSaveTask = async (taskData) => {
        try {
            const cleanData = {
                name: taskData.name || '',
                description: taskData.description || '',
                frequency_in_months: Number(taskData.frequency_in_months) || 0,
                responsible_person: taskData.responsible_person || '',
                instructions_url: taskData.instructions_url || '',
                is_active: taskData.is_active !== undefined ? taskData.is_active : true
            };

            if (selectedTask) {
                await NetworkTask.update(selectedTask.id, cleanData);
            } else {
                await NetworkTask.create(cleanData);
            }
            setIsFormOpen(false);
            setSelectedTask(null);
            loadData();
        } catch (error) {
            console.error("Error saving network task:", error);
            if (error.message && error.message.includes('Network')) {
                alert("שגיאת רשת - נסה שוב בעוד כמה רגעים");
            } else {
                alert("שגיאה בשמירת המשימה הרשתית");
            }
        }
    };

    const handleDeleteTask = async () => {
        if (taskToDelete) {
            try {
                await NetworkTask.delete(taskToDelete.id);
                setTaskToDelete(null);
                loadData();
            } catch (error) {
                console.error("Error deleting network task:", error);
                if (error.message && error.message.includes('Network')) {
                    alert("שגיאת רשת - נסה שוב בעוד כמה רגעים");
                } else {
                    alert("שגיאה במחיקת המשימה הרשתית");
                }
            }
        }
    };

    const handleOpenForm = (task = null) => {
        setSelectedTask(task);
        setIsFormOpen(true);
    };

    // New handler for opening record form
    const handleOpenRecordForm = (task, branch = null, record = null) => {
        setSelectedTaskForRecord(task);
        setSelectedBranchForRecord(branch);
        setEditingRecord(record);
        setIsBulkAdd(false);
        setSelectedBranches([]);
        setIsRecordFormOpen(true);
    };

    // New handler for opening bulk record form
    const handleOpenBulkRecordForm = (task) => {
        setSelectedTaskForRecord(task);
        setSelectedBranchForRecord(null);
        setEditingRecord(null);
        setIsBulkAdd(true);
        setSelectedBranches([]); // Reset selected branches
        setIsRecordFormOpen(true);
    };

    const handleSaveRecord = async (recordData) => {
        setIsSavingRecord(true);
        const { task_id, completion_date, responsible_person, status } = recordData;

        try {
            if (isBulkAdd) {
                const recordsToCreate = selectedBranches.map(branch => ({
                    branch_id: branch.id,
                    task_id: task_id,
                    completion_date: completion_date,
                    responsible_person: responsible_person,
                    status: status,
                }));
                await NetworkTaskRecord.bulkCreate(recordsToCreate);

                // Send emails for bulk add
                const task = tasks.find(t => t.id === task_id);
                for (const branch of selectedBranches) {
                    const emailSubject = `משימת רשת חדשה התקבלה עבור סניף ${branch.name}`;
                    const emailBody = `
שלום [שם בעל הסניף],

משימת רשת חדשה, "${task?.name || 'לא צוין'}", התקבלה עבור סניף "${branch.name}".
יש לבצע את המשימה בהקדם.

לצפייה בכל המשימות שלך, אנא היכנס לקישור הבא:
${window.location.origin}${createPageUrl('MyTasks')}

בברכה,
מערכת בקרת רשת - המקסיקני
`;
                    await sendNotificationEmailToBranchOwners(branch.id, emailSubject, emailBody);
                }

            } else {
                const finalRecordData = {
                    branch_id: selectedBranchForRecord?.id, // Use selectedBranchForRecord's ID
                    task_id,
                    completion_date,
                    responsible_person,
                    status,
                };
                if (editingRecord) {
                    await NetworkTaskRecord.update(editingRecord.id, finalRecordData);
                } else {
                    await NetworkTaskRecord.create(finalRecordData);
                    
                    // Send email for single add
                    const branch = branches.find(b => b.id === selectedBranchForRecord?.id);
                    const task = tasks.find(t => t.id === task_id);
                    if(branch && task) {
                        const emailSubject = `משימת רשת חדשה התקבלה עבור סניף ${branch.name}`;
                        const emailBody = `
שלום [שם בעל הסניף],

משימת רשת חדשה, "${task.name}", התקבלה עבור סניף "${branch.name}".
יש לבצע את המשימה בהקדם.

לצפייה בכל המשימות שלך, אנא היכנס לקישור הבא:
${window.location.origin}${createPageUrl('MyTasks')}

בברכה,
מערכת בקרת רשת - המקסיקני
`;
                        await sendNotificationEmailToBranchOwners(branch.id, emailSubject, emailBody);
                    }
                }
            }

            alert('הפעולה בוצעה בהצלחה!');
            setIsRecordFormOpen(false);
            loadData();
        } catch (error) {
            console.error("Failed to save network task record:", error);
            alert('שגיאה בשמירת הרשומה.');
        } finally {
            setIsSavingRecord(false);
        }
    };

    const handleDeleteRecord = async (recordId) => {
        if (window.confirm("האם אתה בטוח שברצונך למחוק רשומה זו?")) {
            try {
                await NetworkTaskRecord.delete(recordId);
                alert('הרשומה נמחקה בהצלחה!');
                loadData();
            } catch (error) {
                console.error("Error deleting network task record:", error);
                alert('שגיאה במחיקת הרשומה.');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">טוען נתונים...</p>
                    {retryAttempts > 0 && (
                        <p className="text-sm text-orange-600 mt-2">
                            נסיון {retryAttempts + 1} מתוך 3...
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (networkError) {
        return (
            <div className="space-y-6">
                <Alert className="border-red-200 bg-red-50">
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold mb-1">שגיאת רשת</p>
                                <p className="text-sm">לא ניתן לטעון את הנתונים כרגע. בדוק את החיבור לאינטרנט ונסה שוב.</p>
                            </div>
                            <Button 
                                onClick={() => loadData()} 
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100"
                            >
                                <RefreshCw className="w-4 h-4" />
                                נסה שוב
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
                
                <Card>
                    <CardContent className="text-center py-12">
                        <WifiOff className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">אין חיבור לרשת</h3>
                        <p className="text-gray-500 mb-4">המערכת זמינה רק כשיש חיבור אינטרנט יציב</p>
                        <Button onClick={() => loadData()}>
                            <RefreshCw className="ml-2 h-4 w-4" />
                            נסה שוב
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <CheckSquare className="w-7 h-7" />
                    ניהול משימות רשתיות
                </h1>
                <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    הוסף משימה רשתית
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>רשימת משימות רשתיות ({tasks.length})</CardTitle>
                    <CardDescription>
                        כאן תוכל לנהל את המשימות הרשתיות ולעקוב אחר התקדמותן בסניפים.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>שם המשימה</TableHead>
                                    <TableHead>תיאור</TableHead>
                                    <TableHead>תדירות</TableHead>
                                    <TableHead>אחראי</TableHead>
                                    <TableHead>סטטוס ביצוע</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                    <TableHead>פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task) => {
                                    const stats = taskStats[task.id] || { total: 0, completed: 0, inProgress: 0, notStarted: 0, percentage: 0 };
                                    return (
                                        <TableRow key={task.id}>
                                            <TableCell className="font-medium">{task.name}</TableCell>
                                            <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                                            <TableCell>
                                                {task.frequency_in_months > 0 ? (
                                                    <Badge variant="outline">
                                                        כל {task.frequency_in_months} חודשים
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">חד פעמית</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{task.responsible_person || 'לא מוגדר'}</TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">התקדמות כללית</span>
                                                        <span className="text-gray-600">{stats.percentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300" 
                                                            style={{ width: `${stats.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            {stats.completed} הושלם
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                            {stats.inProgress} בתהליך
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                            {stats.notStarted} טרם התחיל
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={task.is_active ? "default" : "secondary"}>
                                                    {task.is_active ? 'פעילה' : 'לא פעילה'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 flex-wrap">
                                                    <NetworkTaskProgressReport 
                                                        task={task}
                                                        taskStats={stats}
                                                        allBranches={branches}
                                                        allTaskRecords={taskRecords}
                                                        onOpenRecordForm={handleOpenRecordForm} // Pass the handler
                                                        onDeleteRecord={handleDeleteRecord} // Pass the handler
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenRecordForm(task)}
                                                        title="הוסף רשומה למשימה"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        רשומה
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenBulkRecordForm(task)}
                                                        title="הוסף רשומה מרובה"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <ListChecks className="h-4 w-4" />
                                                        רשומות מרובות
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenForm(task)}
                                                        title="ערוך משימה"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setTaskToDelete(task)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="מחק משימה"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {tasks.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">אין משימות רשתיות</p>
                                <p className="text-sm">הוסף משימה רשתית חדשה כדי להתחיל</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <TaskForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                task={selectedTask}
                onSave={handleSaveTask}
            />

            <NetworkTaskRecordForm
                open={isRecordFormOpen}
                onOpenChange={setIsRecordFormOpen}
                task={selectedTaskForRecord}
                branch={selectedBranchForRecord}
                record={editingRecord}
                onSave={handleSaveRecord}
                allBranches={branches}
                isBulkAddMode={isBulkAdd}
                onBranchSelect={(branch, isSelected) => {
                    setSelectedBranches(prev => 
                        isSelected ? [...prev, branch] : prev.filter(b => b.id !== branch.id)
                    );
                }}
                selectedBranches={selectedBranches}
                isLoading={isSavingRecord}
            />

            <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את המשימה "{taskToDelete?.name}"?
                            פעולה זו לא ניתנת לביטול.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
                            מחק
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
