import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus, CheckCircle, RefreshCw, Edit, Trash2, Clock } from 'lucide-react';

export default function BranchNetworkTaskStatusDialog({
    open,
    onOpenChange,
    branch,
    allTasks,
    taskRecords,
    onRecordNewTask,
    currentUser,
    onEditRecord,
    onDeleteRecord,
    onDataChange
}) {

    const getTaskStatus = (taskId) => {
        const record = taskRecords.find(r => r.task_id === taskId);
        
        if (!record) {
            return { status: 'טרם בוצע', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: Clock };
        }
        
        if (record.status === 'בתהליך') {
            return { status: 'בתהליך', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: RefreshCw };
        }
        
        return { status: 'בוצע', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
    };

    const handleCreateClick = () => {
        if (currentUser?.user_type !== 'admin') {
            alert('אין לך הרשאה לבצע פעולה זו.');
            return;
        }
        onRecordNewTask(branch);
    };

    const handleEditClick = (record) => {
        if (currentUser?.user_type !== 'admin') {
            alert('אין לך הרשאה לבצע פעולה זו.');
            return;
        }
        onEditRecord(record);
    };

    const handleDeleteClick = (record) => {
        if (currentUser?.user_type !== 'admin') {
            alert('אין לך הרשאה לבצע פעולה זו.');
            return;
        }
        onDeleteRecord(record);
        // Call onDataChange immediately after delete action
        if (onDataChange) {
            setTimeout(() => onDataChange(), 500);
        }
    };

    // Remove the useEffect that was causing constant reloads
    // No automatic reload on dialog close
    
    if (!branch) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" />
                        מצב משימות רשתיות - {branch?.name}
                    </DialogTitle>
                    <DialogDescription>
                        עיר: {branch?.city} | סטטוס סניף: {branch?.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {allTasks.length === 0 && <p className="text-center text-gray-500 py-8">אין משימות רשתיות להצגה.</p>}
                    {allTasks.map(task => {
                        const record = taskRecords.find(r => r.task_id === task.id);
                        const taskStatusInfo = getTaskStatus(task.id);
                        const StatusIcon = taskStatusInfo.icon;

                        return (
                            <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex-1 min-w-[250px]">
                                        <div className="flex items-center gap-3 mb-2">
                                            <StatusIcon className={`w-5 h-5 ${taskStatusInfo.color}`} />
                                            <h3 className="font-semibold text-lg">{task.name}</h3>
                                            <span className={`px-2 py-1 text-xs rounded-full ${taskStatusInfo.bgColor} ${taskStatusInfo.color} font-medium`}>
                                                {taskStatusInfo.status}
                                            </span>
                                        </div>
                                        
                                        {task.description && (
                                            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                                        )}
                                        
                                        {record && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                                                <div>
                                                    <span className="font-medium text-gray-700">תאריך ביצוע/התחלה:</span>
                                                    <p className="text-gray-900">{format(new Date(record.completion_date), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
                                                </div>
                                                {record.responsible_person && (
                                                    <div>
                                                        <span className="font-medium text-gray-700">אחראי:</span>
                                                        <p className="text-gray-900">{record.responsible_person}</p>
                                                    </div>
                                                )}
                                                {record.participants && (
                                                    <div className="md:col-span-2">
                                                        <span className="font-medium text-gray-700">משתתפים:</span>
                                                        <p className="text-gray-900">{record.participants}</p>
                                                    </div>
                                                )}
                                                {record.next_due_date && new Date(record.next_due_date) < new Date() && record.status === 'בוצע' && (
                                                    <div className="md:col-span-2 text-red-600 font-medium">
                                                        (נדרש חידוש - תאריך יעד: {format(new Date(record.next_due_date), 'dd/MM/yyyy', { locale: he })})
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {currentUser?.user_type === 'admin' && (
                                        <div className="flex gap-2 ml-auto">
                                            {record ? (
                                                <Button
                                                    onClick={() => handleEditClick(record)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex items-center gap-1"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    עריכה
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleCreateClick}
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex items-center gap-1"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    רישום ביצוע
                                                </Button>
                                            )}
                                            
                                            {record && (
                                                <Button
                                                    onClick={() => handleDeleteClick(record)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}