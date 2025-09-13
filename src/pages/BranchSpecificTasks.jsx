
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PersonalTask, User, BranchOwnership, Branch } from '@/api/entities';
import SystemManagerTaskForm from '../components/SystemManagerTaskForm';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CheckCircle, Circle, RefreshCw, Building } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import FullPageError from '../components/FullPageError';
import { safeDeletePersonalTask } from '../components/SafeDeleteHelper';


export default function BranchSpecificTasks() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    
    // New states for role-based view and actions
    const [currentUser, setCurrentUser] = useState(null);
    const [isBranchOwnerView, setIsBranchOwnerView] = useState(false);
    const [updatingTaskId, setUpdatingTaskId] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = await User.me();
            setCurrentUser(user); // Update currentUser state
            const isBranchOwner = user.user_type === 'branch_owner' || user.user_type === 'setup_branch_owner';
            setIsBranchOwnerView(isBranchOwner);

            let tasksResult = [];
            if (isBranchOwner) {
                const selectedBranchId = sessionStorage.getItem('selectedOwnerBranchId');
                let branchIds = [];

                if (selectedBranchId) {
                    branchIds = [selectedBranchId];
                } else {
                    const ownerships = await BranchOwnership.filter({ user_id: user.id });
                    branchIds = Array.isArray(ownerships) ? ownerships.map(o => o.branch_id) : [];
                }

                if (branchIds.length > 0) {
                    tasksResult = await PersonalTask.filter({
                        task_type: 'branch_specific',
                        branch_id: { '$in': branchIds }
                    }, '-created_date');
                }
            } else { // Admin view, or not a branch owner
                tasksResult = await PersonalTask.filter({ task_type: 'branch_specific' }, '-created_date');
            }

            // Fetch branches data to get names
            const branchesData = await Branch.list();
            const branchesMap = branchesData.reduce((acc, branch) => {
                acc[branch.id] = branch.name;
                return acc;
            }, {});

            const tasksWithBranchNames = tasksResult.map(task => ({
                ...task,
                branch_name: branchesMap[task.branch_id] || 'סניף לא ידוע' // Add branch_name
            }));

            setTasks(tasksWithBranchNames);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError("שגיאה בטעינת המשימות: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteTask = async (task) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) {
            try {
                await safeDeletePersonalTask(task);
                await PersonalTask.delete(task.id);
                await fetchData();
                alert('המשימה נמחקה בהצלחה.');
            } catch (err) {
                console.error("Failed to delete task:", err);
                alert('שגיאה במחיקת המשימה.');
            }
        }
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };
    
    const handleSaveTask = async (taskData) => {
        try {
            if (editingTask) {
                await PersonalTask.update(editingTask.id, { ...taskData, task_type: 'branch_specific' });
            } else {
                await PersonalTask.create({ ...taskData, task_type: 'branch_specific' });
            }
            setIsModalOpen(false);
            await fetchData();
        } catch (error) {
            console.error("Failed to save task:", error);
            alert('שגיאה בשמירת המשימה.');
        }
    };

    const handleToggleStatus = async (task) => {
        setUpdatingTaskId(task.id);
        const newStatus = task.status === 'טופלה' ? 'טרם טופלה' : 'טופלה';
        try {
            await PersonalTask.update(task.id, { status: newStatus });
            await fetchData();
        } catch (err) {
            console.error("Failed to update task status:", err);
            alert("שגיאה בעדכון סטטוס המשימה.");
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'pending': return "bg-gray-100 text-gray-800";
            case 'completed': return "bg-green-100 text-green-800";
            case 'בתהליך': return "text-blue-500 border border-blue-500";
            case 'טרם טופלה': return "bg-red-100 text-red-800 border border-red-500";
            case 'טופלה': return "bg-green-600 text-white";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityVariant = (priority) => {
        switch (priority) {
            case 'גבוהה': return "bg-red-500 text-white";
            case 'בינונית': return "bg-orange-400 text-white";
            case 'נמוכה': return "bg-blue-300 text-white";
            default: return "bg-gray-200 text-gray-800";
        }
    };

    return (
        <Card className="max-w-7xl mx-auto mt-6" dir="rtl">
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>משימות ייעודיות לסניפים</CardTitle>
                    <CardDescription>
                        {isBranchOwnerView 
                            ? "רשימת משימות ייעודיות שנשלחו לסניפים שלך. סמן משימות שבוצעו."
                            : "ניהול משימות ייעודיות שנשלחות לסניפים ספציפיים מהמערכת."
                        }
                    </CardDescription>
                </div>
                {!isBranchOwnerView && (
                    <Button onClick={openCreateModal} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        הוסף משימה חדשה
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>טוען משימות...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>נושא</TableHead>
                                <TableHead>תאריך יצירה</TableHead>
                                <TableHead>סטטוס</TableHead>
                                <TableHead>עדיפות</TableHead>
                                <TableHead className="text-left">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length > 0 ? tasks.map(task => {
                                const isUpdating = updatingTaskId === task.id;
                                return (
                                <TableRow key={task.id} className="group hover:bg-gray-50">
                                    <TableCell className="font-medium">
                                        <div className="space-y-1">
                                            <div>{task.subject}</div>
                                            {task.branch_name && (
                                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                    <Building className="w-3 h-3" />
                                                    {task.branch_name}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{format(new Date(task.created_date), 'dd/MM/yyyy', { locale: he })}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusVariant(task.status)}>
                                            {task.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getPriorityVariant(task.priority)}>
                                            {task.priority}
                                        </Badge>
                                    </TableCell>
                                    
                                    {!isBranchOwnerView && (
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => openEditModal(task)}
                                                    className="h-8 w-8"
                                                    title="ערוך משימה"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteTask(task)}
                                                    className="h-8 w-8 text-red-600 hover:text-red-800"
                                                    title="מחק משימה"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                    
                                    {isBranchOwnerView && (
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant={task.status === 'טופלה' ? "outline" : "default"}
                                                onClick={() => handleToggleStatus(task)}
                                                disabled={isUpdating}
                                                className={task.status === 'טופלה' 
                                                    ? "text-orange-600 border-orange-300 hover:bg-orange-50" 
                                                    : "bg-green-600 hover:bg-green-700 text-white"
                                                }
                                            >
                                                {isUpdating ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                                                ) : task.status === 'טופלה' ? (
                                                    <>
                                                        <Circle className="h-4 w-4 ml-2" />
                                                        סמן כטרם בוצע
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 ml-2" />
                                                        סמן כבוצע
                                                    </>
                                                )}
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        {isBranchOwnerView ? "אין לך משימות ייעודיות כרגע." : "לא נמצאו משימות ייעודיות."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            {!isBranchOwnerView && isModalOpen && (
                 <SystemManagerTaskForm 
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onSave={handleSaveTask}
                    initialTask={editingTask}
                 />
            )}
        </Card>
    );
}
