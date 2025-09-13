
import React, { useState, useEffect } from 'react';
import { PersonalTask, NetworkContact, Branch, User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, User as UserIcon, Users, Building, AlertCircle, CheckCircle, Clock, Save, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import DatePicker from '../components/ui/date-picker';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import SystemManagerTaskForm from '../components/SystemManagerTaskForm';

export default function SystemManagerTasks() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    // States for the form, will be passed to the new component
    const [branches, setBranches] = useState([]);
    const [networkContacts, setNetworkContacts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // state for filters
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const taskFilter = {
                task_type: { '$in': ['system_manager_personal', 'system_manager_collaborative', 'system_manager_branch'] }
            };
            const [tasksData, branchesData, contactsData, userData] = await Promise.all([
                PersonalTask.filter(taskFilter, '-created_date'),
                Branch.list(),
                NetworkContact.list(),
                User.me()
            ]);

            setTasks(Array.isArray(tasksData) ? tasksData : []);
            setBranches(Array.isArray(branchesData) ? branchesData : []);
            setNetworkContacts(Array.isArray(contactsData) ? contactsData : []);
            setCurrentUser(userData);

        } catch (e) {
            console.error("Failed to load tasks data:", e);
            setError("שגיאה בטעינת המשימות.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTask = async (taskData) => {
        try {
            if (editingTask) {
                await PersonalTask.update(editingTask.id, taskData);
                alert('המשימה עודכנה בהצלחה!');
            } else {
                await PersonalTask.create(taskData);
                alert('המשימה נוצרה בהצלחה!');
            }
            setIsTaskFormOpen(false);
            setEditingTask(null);
            loadData();
        } catch (err) {
            console.error('Failed to save task', err);
            alert(`שגיאה ב${editingTask ? 'עדכון' : 'יצירת'} המשימה.`);
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsTaskFormOpen(true);
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
            return;
        }
        try {
            await PersonalTask.delete(taskId);
            alert('המשימה נמחקה בהצלחה.');
            loadData();
        } catch (error) {
            console.error("Failed to delete task:", error);
            alert('שגיאה במחיקת המשימה.');
        }
    };

    const toggleTaskStatus = async (task) => {
        const newStatus = task.status === 'טופלה' ? 'טרם טופלה' : 'טופלה';
        try {
            await PersonalTask.update(task.id, { status: newStatus });
            alert('סטטוס המשימה עודכן בהצלחה.');
            loadData();
        } catch (error) {
            console.error("Failed to update task status:", error);
            alert('שגיאה בעדכון סטטוס המשימה.');
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') {
            return task.status === 'טרם טופלה' || task.status === 'בתהליך';
        }
        if (filter === 'completed') {
            return task.status === 'טופלה';
        }
        return true; // 'all' filter
    });

    const getTaskTypeDisplay = (type) => {
        const types = {
            'system_manager_personal': 'משימה אישית מנהל',
            'system_manager_collaborative': 'משימה אישית משולבת',
            'system_manager_branch': 'משימה לסניף ספציפי'
        };
        return types[type] || type;
    };

    const getTaskTypeIcon = (type) => {
        const icons = {
            'system_manager_personal': UserIcon,
            'system_manager_collaborative': Users,
            'system_manager_branch': Building
        };
        const Icon = icons[type] || UserIcon;
        return <Icon className="w-4 h-4" />;
    };

    const getStatusVariant = (status) => {
        const colors = {
            'טרם טופלה': 'bg-red-100 text-red-800',
            'בתהליך': 'bg-yellow-100 text-yellow-800',
            'טופלה': 'bg-green-100 text-green-800',
            'pending': 'bg-red-100 text-red-800',
            'completed': 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityVariant = (priority) => {
        const colors = {
            'גבוהה': 'bg-red-100 text-red-800',
            'בינונית': 'bg-yellow-100 text-yellow-800',
            'נמוכה': 'bg-blue-100 text-blue-800',
            'high': 'bg-red-100 text-red-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'low': 'bg-blue-100 text-blue-800'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    };

    const getCollaboratorNames = (collaboratorIds) => {
        if (!collaboratorIds || collaboratorIds.length === 0) return [];
        return collaboratorIds.map(id => {
            const contact = networkContacts.find(c => c.id === id);
            return contact ? `${contact.first_name} ${contact.last_name}` : 'לא ידוע';
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>טוען משימות...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64 text-red-600 text-lg">
                <AlertCircle className="w-6 h-6 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6" dir="rtl">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-7 h-7" />
                                ניהול משימות מנהל מערכת
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">כאן ניתן ליצור ולעקוב אחר משימות אישיות, משימות משותפות ומשימות לסניפים.</p>
                        </div>
                        <Button
                            onClick={() => { setEditingTask(null); setIsTaskFormOpen(true); }}
                            className="bg-green-600 hover:bg-green-700"
                            aria-label="פתח משימה חדשה"
                        >
                            <Plus className="ml-2 h-5 w-5" />
                            הוסף משימה
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <Label className="text-base font-semibold mb-2 block">סינון משימות:</Label>
                            <RadioGroup value={filter} onValueChange={setFilter} className="flex space-x-4 space-x-reverse">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <RadioGroupItem value="active" id="filter-active" />
                                    <Label htmlFor="filter-active">פעילות</Label>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <RadioGroupItem value="completed" id="filter-completed" />
                                    <Label htmlFor="filter-completed">הושלמו</Label>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <RadioGroupItem value="all" id="filter-all" />
                                    <Label htmlFor="filter-all">כל המשימות</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">אין משימות תואמות לסינון הנוכחי</p>
                                {filter === 'all' && <p className="text-sm">צור משימה חדשה כדי להתחיל</p>}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredTasks.map(task => {
                                    return (
                                        <Card key={task.id} className="border-r-4 border-r-blue-500">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {getTaskTypeIcon(task.task_type)}
                                                            <span className="text-sm text-gray-600">
                                                                {getTaskTypeDisplay(task.task_type)}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-semibold text-lg mb-1">{task.subject || 'ללא נושא'}</h3>
                                                        <p className="text-gray-700 text-sm">{task.text}</p>
                                                    </div>
                                                    <div className="flex space-x-2 space-x-reverse mt-1 ml-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleTaskStatus(task)}
                                                            title={task.status === 'טופלה' ? 'סמן כטרם טופלה' : 'סמן כטופלה'}
                                                        >
                                                            {task.status === 'טופלה' ? <Clock className="w-5 h-5 text-yellow-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditTask(task)}
                                                            title="ערוך משימה"
                                                        >
                                                            <Edit className="w-5 h-5 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            title="מחק משימה"
                                                        >
                                                            <Trash2 className="w-5 h-5 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge className={getStatusVariant(task.status)}>
                                                            {task.status}
                                                        </Badge>
                                                        <Badge className={getPriorityVariant(task.priority)}>
                                                            דחיפות: {task.priority}
                                                        </Badge>
                                                        {task.branch_name && (
                                                            <Badge variant="outline" className="flex items-center gap-1">
                                                                <Building className="w-3 h-3" />
                                                                {task.branch_name}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* הצגת משתתפים - בשורה נפרדת */}
                                                    {task.collaborator_ids && task.collaborator_ids.length > 0 && (
                                                        <div className="flex items-start gap-2">
                                                            <Badge variant="outline" className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                משתתפים:
                                                            </Badge>
                                                            <div className="flex flex-wrap gap-1">
                                                                {getCollaboratorNames(task.collaborator_ids).map((name, index) => (
                                                                    <span key={index} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                                        {name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-xs text-gray-500">
                                                    נוצר ב-{format(new Date(task.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Task Form Dialog */}
                <SystemManagerTaskForm
                    open={isTaskFormOpen}
                    onOpenChange={setIsTaskFormOpen}
                    onSave={handleSaveTask}
                    branches={branches}
                    networkContacts={networkContacts}
                    currentUser={currentUser}
                    initialTask={editingTask}
                />
            </div>
        </TooltipProvider>
    );
}
