
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SetupTask } from '@/api/entities';
import { ContactRole } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2, Save, GripVertical, RefreshCw, ListChecks, X, Tag, FileText, Download, CheckCircle, Circle, Upload, FileText as FileIcon, Paperclip, X as XIcon, XCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from '@/api/integrations';


const TaskForm = ({ open, onOpenChange, task, onSave, onAutoSave, availableRoles }) => {
    const [formData, setFormData] = useState({});
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [uploadingStates, setUploadingStates] = useState({});
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
    const [retryCount, setRetryCount] = useState(0);

    const autoSaveTimeout = useRef(null);
    const maxRetries = 3;

    const quillModules = useMemo(() => ({
        toolbar: [
            ['bold', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image']
        ],
    }), []);

    const groupedRoles = useMemo(() => {
        if (!availableRoles) return {};
        return availableRoles.reduce((acc, role) => {
            const category = role.category || 'אחר';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(role);
            return acc;
        }, {});
    }, [availableRoles]);

    useEffect(() => {
        if (task) {
            setFormData({
                ...task,
                suggested_contact_roles: task.suggested_contact_roles || [],
                detailed_instructions: task.detailed_instructions || '',
                sub_tasks: (task.sub_tasks || []).map(st => ({...st, attached_files: st.attached_files || []}))
            });
        } else {
            setFormData({
                name: '',
                description: '',
                detailed_instructions: '',
                estimated_duration_days: 0,
                suggested_contact_roles: [],
                sub_tasks: []
            });
        }
        setSaveStatus('idle'); // Reset status when task changes or new task is selected
        setRetryCount(0); // Reset retry count
    }, [task]);
    
    // Auto-save logic with improved error handling
    useEffect(() => {
        // Only auto-save existing tasks with an ID
        if (!task || !task.id || !onAutoSave) {
            return;
        }

        // Clear previous timeout
        if (autoSaveTimeout.current) {
            clearTimeout(autoSaveTimeout.current);
        }

        // Set a new timeout
        autoSaveTimeout.current = setTimeout(async () => {
            // Skip auto-save if user is offline
            if (!navigator.onLine) {
                console.log('Skipping auto-save: offline');
                setSaveStatus('idle'); // Return to idle state if offline
                return;
            }

            setSaveStatus('saving');
            try {
                await onAutoSave(formData);
                setSaveStatus('saved');
                setRetryCount(0); // Reset retry count on success
                setTimeout(() => setSaveStatus('idle'), 3000); // Revert to idle after 3s
            } catch (error) {
                console.warn("Auto-save failed:", error);
                
                // Handle network errors differently
                if (error.message === 'Network Error') {
                    // For network errors, try again up to maxRetries times
                    if (retryCount < maxRetries) {
                        setRetryCount(prev => prev + 1);
                        setSaveStatus('saving'); // Keep showing 'saving' during retry attempts
                        
                        // Retry after a delay with exponential backoff
                        setTimeout(async () => {
                            try {
                                await onAutoSave(formData);
                                setSaveStatus('saved');
                                setRetryCount(0);
                                setTimeout(() => setSaveStatus('idle'), 3000);
                            } catch (retryError) {
                                console.warn(`Auto-save retry ${retryCount + 1} failed:`, retryError);
                                setSaveStatus('idle'); // If retry also fails, go back to idle, don't show constant error
                                setRetryCount(0); // Reset for next interaction
                            }
                        }, 2000 * (retryCount + 1)); // Exponential backoff
                    } else {
                        setSaveStatus('idle'); // Stop trying after max retries, revert to idle
                        setRetryCount(0); // Reset for next interaction
                    }
                } else {
                    // For other errors (e.g., server-side validation), show the error status
                    setSaveStatus('error');
                    setTimeout(() => setSaveStatus('idle'), 5000); // Show error for 5 seconds
                }
            }
        }, 30000); // Changed to 30000 (30 seconds)

        return () => {
            if (autoSaveTimeout.current) {
                clearTimeout(autoSaveTimeout.current);
            }
        };

    }, [formData, task, onAutoSave, retryCount]);

    const handleChange = (field, value) => setFormData(p => ({ ...p, [field]: value }));
    const handleQuillChange = (value) => handleChange('detailed_instructions', value);

    const handleAddSubtask = () => {
        const newSubtasks = [...(formData.sub_tasks || []), { text: '', status: 'not_started', attached_files: [] }];
        handleChange('sub_tasks', newSubtasks);
    };

    const handleSubtaskChange = (index, field, value) => {
        const updatedSubtasks = [...formData.sub_tasks];
        updatedSubtasks[index][field] = value;
        handleChange('sub_tasks', updatedSubtasks);
    };

    const handleRemoveSubtask = (index) => {
        const updatedSubtasks = formData.sub_tasks.filter((_, i) => i !== index);
        handleChange('sub_tasks', updatedSubtasks);
    };

    const handleSubtaskFileUpload = async (subtaskIndex, event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploadingStates(prev => ({ ...prev, [subtaskIndex]: true }));
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const result = await UploadFile({ file });
                return {
                    file_url: result.file_url,
                    file_name: file.name,
                    uploaded_date: new Date().toISOString()
                };
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            
            const updatedSubtasks = [...formData.sub_tasks];
            const currentFiles = updatedSubtasks[subtaskIndex].attached_files || [];
            updatedSubtasks[subtaskIndex].attached_files = [...currentFiles, ...uploadedFiles];
            
            handleChange('sub_tasks', updatedSubtasks);

        } catch (error) {
            console.error('Error uploading files:', error);
            alert('שגיאה בהעלאת הקבצים');
        } finally {
            setUploadingStates(prev => ({ ...prev, [subtaskIndex]: false }));
            event.target.value = '';
        }
    };

    const handleRemoveSubtaskFile = (subtaskIndex, fileIndexToRemove) => {
        const updatedSubtasks = [...formData.sub_tasks];
        const updatedFiles = updatedSubtasks[subtaskIndex].attached_files.filter((_, index) => index !== fileIndexToRemove);
        updatedSubtasks[subtaskIndex].attached_files = updatedFiles;
        handleChange('sub_tasks', updatedSubtasks);
    };

    const handleRoleToggle = (roleName) => {
        const currentRoles = formData.suggested_contact_roles || [];
        const newRoles = currentRoles.includes(roleName)
            ? currentRoles.filter(r => r !== roleName)
            : [...currentRoles, roleName];
        handleChange('suggested_contact_roles', newRoles);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (autoSaveTimeout.current) { // Clear any pending auto-save before final save
            clearTimeout(autoSaveTimeout.current);
        }
        onSave(formData);
        onOpenChange(false);
    };

    const getSaveStatusIndicator = () => {
        switch (saveStatus) {
            case 'saving':
                return <span className="text-xs text-gray-500 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> שומר...</span>;
            case 'saved':
                return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> נשמר אוטומטית</span>;
            case 'error':
                return <span className="text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> שגיאה בשמירה</span>;
            default:
                return null;
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{task ? 'עריכת משימה' : 'משימה חדשה'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div>
                            <Label>שם המשימה</Label>
                            <Input value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} required />
                        </div>
                        <div>
                            <Label>תיאור (יוצג ברשימה)</Label>
                            <Textarea value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
                        </div>
                        <div>
                            <Label>הוראות מפורטות</Label>
                             <ReactQuill 
                                theme="snow"
                                value={formData.detailed_instructions || ''}
                                onChange={handleQuillChange}
                                modules={quillModules}
                                placeholder="הוסף כאן תוכן מפורט, הנחיות וקישורים..."
                                className="bg-white mt-1"
                            />
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label>משימות משנה</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddSubtask}>
                                    <PlusCircle className="ml-2 h-4 w-4" />
                                    הוסף תת-משימה
                                </Button>
                            </div>
                            <div className="space-y-4 p-3 bg-gray-50 rounded-md border max-h-64 overflow-y-auto">
                                {(formData.sub_tasks || []).length > 0 ? (
                                    formData.sub_tasks.map((sub, index) => (
                                        <div key={index} className="p-3 bg-white rounded-lg border space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={sub.text}
                                                    onChange={(e) => handleSubtaskChange(index, 'text', e.target.value)}
                                                    placeholder="תיאור תת-משימה"
                                                    className="flex-grow bg-white"
                                                />
                                                <Select value={sub.status} onValueChange={(value) => handleSubtaskChange(index, 'status', value)}>
                                                    <SelectTrigger className="w-[130px] bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="not_started">טרם התחיל</SelectItem>
                                                        <SelectItem value="in_progress">בתהליך</SelectItem>
                                                        <SelectItem value="completed">בוצע</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSubtask(index)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                            {/* File Upload for Subtask */}
                                            <div>
                                                <div className="flex justify-end">
                                                     <input
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => handleSubtaskFileUpload(index, e)}
                                                        className="hidden"
                                                        id={`subtask-upload-${index}`}
                                                        disabled={uploadingStates[index]}
                                                    />
                                                    <label
                                                        htmlFor={`subtask-upload-${index}`}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border rounded-md cursor-pointer hover:bg-gray-200 text-xs"
                                                    >
                                                        {uploadingStates[index] ? (
                                                            <><RefreshCw className="w-3 h-3 animate-spin" />מעלה...</>
                                                        ) : (
                                                            <><Upload className="w-3 h-3" />הוסף קובץ</>
                                                        )}
                                                    </label>
                                                </div>
                                                <div className="space-y-1 mt-2">
                                                    {(sub.attached_files || []).map((file, fileIndex) => (
                                                        <div key={fileIndex} className="flex items-center gap-2 p-1 bg-gray-50 rounded text-xs">
                                                            <FileIcon className="w-3 h-3 text-gray-500" />
                                                            <span className="flex-grow">{file.file_name}</span>
                                                            <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">צפה</a>
                                                            <button type="button" onClick={() => handleRemoveSubtaskFile(index, fileIndex)}><XIcon className="h-3 w-3 text-red-500" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-center text-gray-500 py-2">אין משימות משנה.</p>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <Label>זמן משוער (ימים)</Label>
                            <Input type="number" value={formData.estimated_duration_days || 0} onChange={(e) => handleChange('estimated_duration_days', parseInt(e.target.value))} />
                        </div>
                        <div>
                            <Label>שיוך תפקידים מומלצים למשימה</Label>
                            <Button type="button" variant="outline" className="w-full justify-between mt-1" onClick={() => setIsRoleDialogOpen(true)}>
                                <span>{formData.suggested_contact_roles?.length > 0 ? `${formData.suggested_contact_roles.length} תפקידים נבחרו` : "בחר תפקידים..."}</span>
                            </Button>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {formData.suggested_contact_roles?.map(roleName => (
                                    <Badge key={roleName} variant="secondary">
                                        {roleName}
                                        <button type="button" onClick={() => handleRoleToggle(roleName)} className="mr-1 rounded-full hover:bg-black/10 p-0.5"><X className="h-3 w-3" /></button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <DialogFooter className="pt-4 border-t mt-6 flex justify-between items-center">
                            <div>{getSaveStatusIndicator()}</div>
                            <div>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="ml-2">ביטול</Button>
                                <Button type="submit"><Save className="ml-2 h-4 w-4" /> שמור וסגור</Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent dir="rtl" className="max-w-lg max-h-[80vh]">
                    <DialogHeader><DialogTitle>בחירת תפקידים מומלצים</DialogTitle></DialogHeader>
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-4 py-4 pr-2">
                            {Object.entries(groupedRoles).map(([category, roles]) => (
                                <div key={category}>
                                    <h4 className="font-semibold text-sm text-gray-700 mb-2">{category}</h4>
                                    <div className="space-y-2">
                                        {roles.map(role => (
                                            <div key={role.id} className="flex items-center space-x-2 space-x-reverse p-2 rounded hover:bg-gray-50">
                                                <Checkbox id={`role-${role.id}`} checked={formData.suggested_contact_roles?.includes(role.name)} onCheckedChange={() => handleRoleToggle(role.name)} />
                                                <label htmlFor={`role-${role.id}`} className="text-sm font-medium leading-none flex-grow cursor-pointer">{role.name}</label>
                                            </div>
                                        ))}
                                    </div>
                                    {Object.keys(groupedRoles).indexOf(category) < Object.keys(groupedRoles).length - 1 && <Separator className="mt-3" />}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter><Button onClick={() => setIsRoleDialogOpen(false)}>סגור</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

const TaskDetailsDialog = ({ open, onOpenChange, task }) => {
    if (!task) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-xl">פירוט מפורט - {task.name}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    {task.description && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2">תיאור כללי:</h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{task.description}</p>
                        </div>
                    )}
                    {task.detailed_instructions && task.detailed_instructions.trim() && (
                        <div>
                            <h4 className="font-semibold text-blue-800 mb-2">הוראות מפורטות:</h4>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div 
                                    className="text-blue-900 leading-relaxed ql-editor"
                                    dangerouslySetInnerHTML={{ __html: task.detailed_instructions }}
                                />
                            </div>
                        </div>
                    )}

                    {task.sub_tasks && task.sub_tasks.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2">משימות משנה:</h4>
                            <div className="space-y-3">
                                {task.sub_tasks.map((sub, index) => {
                                    const statusConfig = {
                                        not_started: { text: 'טרם התחיל', icon: <Circle className="w-4 h-4 text-gray-400" />, textColor: 'text-gray-600' },
                                        in_progress: { text: 'בתהליך', icon: <RefreshCw className="w-4 h-4 text-blue-500" />, textColor: 'text-blue-600' },
                                        completed: { text: 'בוצע', icon: <CheckCircle className="w-4 h-4 text-green-500" />, textColor: 'text-gray-500 line-through' }
                                    };
                                    const currentStatus = statusConfig[sub.status] || statusConfig.not_started;
                                    return (
                                        <div key={index} className="p-3 bg-gray-100 rounded-md">
                                            <div className="flex items-center gap-3">
                                                {currentStatus.icon}
                                                <p className={`flex-grow ${currentStatus.textColor}`}>{sub.text}</p>
                                                <Badge variant="outline">{currentStatus.text}</Badge>
                                            </div>
                                            {sub.attached_files && sub.attached_files.length > 0 && (
                                                <div className="mt-2 pl-7 space-y-1">
                                                    {sub.attached_files.map((file, fileIndex) => (
                                                        <div key={fileIndex} className="flex items-center gap-2 text-xs">
                                                            <Paperclip className="w-3 h-3 text-gray-500" />
                                                            <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{file.file_name}</a>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {task.estimated_duration_days > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2">זמן משוער:</h4>
                            <p className="text-gray-600">{task.estimated_duration_days} ימים</p>
                        </div>
                    )}
                    {task.suggested_contact_roles && task.suggested_contact_roles.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2">תפקידים מומלצים:</h4>
                            <div className="flex flex-wrap gap-2">
                                {task.suggested_contact_roles.map(role => (
                                    <Badge key={role} variant="outline" className="bg-green-50 text-green-700 border-green-200">{role}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="pt-4 border-t">
                    <Button onClick={() => onOpenChange(false)} variant="outline">סגור</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function ManageSetupTasks() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [taskForDetails, setTaskForDetails] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [taskData, roleData] = await Promise.all([ SetupTask.list('order_index'), ContactRole.filter({ is_active: true }, 'name') ]);
            // יצירת עותק עמוק של כל משימה כדי למנוע שיתוף references
            const deepCopiedTasks = taskData.map(task => ({
                ...task,
                sub_tasks: task.sub_tasks ? task.sub_tasks.map(subTask => ({
                    ...subTask,
                    attached_files: subTask.attached_files ? [...subTask.attached_files] : []
                })) : [],
                suggested_contact_roles: task.suggested_contact_roles ? [...task.suggested_contact_roles] : []
            }));
            setTasks(deepCopiedTasks);
            setAvailableRoles(roleData);
        } catch (err) {
            console.error(err);
            setError("שגיאה בטעינת הנתונים");
        } finally {
            setIsLoading(false);
        }
    };

    const loadTasks = async () => {
        try {
            const taskData = await SetupTask.list('order_index');
            // יצירת עותק עמוק של כל משימה כדי למנוע שיתוף references
            const deepCopiedTasks = taskData.map(task => ({
                ...task,
                sub_tasks: task.sub_tasks ? task.sub_tasks.map(subTask => ({
                    ...subTask,
                    attached_files: subTask.attached_files ? [...subTask.attached_files] : []
                })) : [],
                suggested_contact_roles: task.suggested_contact_roles ? [...task.suggested_contact_roles] : []
            }));
            setTasks(deepCopiedTasks);
        } catch (err) {
            console.error(err);
            setError("שגיאה בטעינת המשימות");
        }
    };

    const handleSaveTask = async (formData) => {
        try {
            // יצירת עותק עמוק של הנתונים לפני שמירה
            const cleanFormData = {
                ...formData,
                sub_tasks: formData.sub_tasks ? formData.sub_tasks.map(subTask => ({
                    ...subTask,
                    attached_files: subTask.attached_files ? [...subTask.attached_files] : []
                })) : [],
                suggested_contact_roles: formData.suggested_contact_roles ? [...formData.suggested_contact_roles] : []
            };
            
            if (cleanFormData.id) {
                await SetupTask.update(cleanFormData.id, cleanFormData);
            } else {
                await SetupTask.create({ ...cleanFormData, order_index: tasks.length });
            }
            await loadTasks();
        } catch (err) { console.error(err); alert("שגיאה בשמירת המשימה"); }
    };

    const handleAutoSaveTask = useCallback(async (formData) => {
        if (!formData.id) return;
        
        // Check if online before attempting save
        if (!navigator.onLine) {
            throw new Error('Network Error'); // Throw specific error for TaskForm to handle retries
        }
        
        try {
            // יצירת עותק עמוק של הנתונים לפני שמירה אוטומטית
            const cleanFormData = {
                ...formData,
                sub_tasks: formData.sub_tasks ? formData.sub_tasks.map(subTask => ({
                    ...subTask,
                    attached_files: subTask.attached_files ? [...subTask.attached_files] : []
                })) : [],
                suggested_contact_roles: formData.suggested_contact_roles ? [...formData.suggested_contact_roles] : []
            };
            
            await SetupTask.update(cleanFormData.id, cleanFormData);
            // עדכון המטמון המקומי עם עותק עמוק
            setTasks(prevTasks => prevTasks.map(t => t.id === cleanFormData.id ? cleanFormData : t));
        } catch (err) {
            console.error("Auto-save failed in parent:", err);
            throw err;
        }
    }, []);

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("האם למחוק את המשימה?")) {
            try {
                await SetupTask.delete(taskId);
                await loadTasks();
            } catch (err) { console.error(err); alert("שגיאה במחיקת המשימה"); }
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const items = Array.from(tasks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setTasks(items);
        try {
            await Promise.all(items.map((task, index) => SetupTask.update(task.id, { order_index: index })));
        } catch (err) { console.error("Failed to update task order", err); alert("שגיאה בעדכון סדר המשימות"); loadTasks(); }
    };

    const handleShowTaskDetails = (task) => {
        // יצירת עותק עמוק של המשימה לפני הצגה
        const taskCopy = {
            ...task,
            sub_tasks: task.sub_tasks ? task.sub_tasks.map(subTask => ({
                ...subTask,
                attached_files: subTask.attached_files ? [...subTask.attached_files] : []
            })) : [],
            suggested_contact_roles: task.suggested_contact_roles ? [...task.suggested_contact_roles] : []
        };
        setTaskForDetails(taskCopy);
        setIsDetailsDialogOpen(true);
    };

    const generateTaskReport = (task) => {
        let subtasksHtml = '<h3>משימות משנה:</h3>';
        if (task.sub_tasks && task.sub_tasks.length > 0) {
            const statusTexts = {
                not_started: 'טרם התחיל',
                in_progress: 'בתהליך',
                completed: 'בוצע'
            };
            subtasksHtml += '<ul>';
            task.sub_tasks.forEach(sub => {
                let filesHtml = '';
                if(sub.attached_files && sub.attached_files.length > 0) {
                    filesHtml += '<ul>';
                    sub.attached_files.forEach(file => {
                        filesHtml += `<li><a href="${file.file_url}" target="_blank">${file.file_name}</a></li>`
                    });
                    filesHtml += '</ul>';
                }
                subtasksHtml += `<li><strong>${statusTexts[sub.status] || sub.status}:</strong> ${sub.text}${filesHtml}</li>`;
            });
            subtasksHtml += '</ul>';
        } else {
            subtasksHtml += '<p><em>אין משימות משנה.</em></p>';
        }

        const reportHtml = `
            <!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>פירוט משימה - ${task.name}</title>
            <style>
                body{font-family:Arial,sans-serif;direction:rtl;line-height:1.6;padding:20px;background-color:#f4f4f9;color:#333}
                .container{max-width:800px;margin:auto;background:#fff;padding:40px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.1)}
                h1,h2,h3{color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:10px;margin-bottom:20px}h1{font-size:2.2em;text-align:center}h2{font-size:1.6em}h3{font-size:1.2em;border-bottom-style:dashed;border-bottom-width:1px;}
                p{color:#555}.section{margin-bottom:30px}
                .instructions{border:1px solid #ddd;padding:20px;border-radius:5px;background-color:#fdfdfd;min-height:100px}
                ul { list-style-type: disc; padding-right: 20px; }
                li { margin-bottom: 5px; }
                a { color: #007bff; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .action-buttons { text-align: center; margin: 30px 0; }
                .action-buttons button, .action-buttons a { 
                    margin: 10px; padding: 12px 24px; font-size: 16px; 
                    background: #3498db; color: white; border: none; border-radius: 5px; 
                    text-decoration: none; display: inline-block; cursor: pointer;
                }
                .action-buttons button:hover, .action-buttons a:hover { background: #2980b9; }
                .close-btn { background: #e74c3c !important; }
                .close-btn:hover { background: #c0392b !important; }
                @media print{body{background-color:#fff}.container{box-shadow:none;border:1px solid #ddd}.action-buttons{display:none}}
            </style></head><body><div class="container">
                <div class="action-buttons">
                    <button onclick="window.print()">🖨️ הדפסה</button>
                    <button onclick="downloadAsPDF()">📄 הורד כ-PDF</button>
                    <button onclick="shareViaEmail()">📧 שלח במייל</button>
                    <button onclick="shareViaWhatsApp()">💬 שלח בווטסאפ</button>
                    <button class="close-btn" onclick="window.close()">❌ סגור</button>
                </div>
                <div class="section"><h1>פירוט משימה: ${task.name}</h1></div>
                <div class="section"><h2>תיאור כללי</h2><p>${task.description || '<em>אין תיאור</em>'}</p></div>
                <div class="section"><h2>הוראות מפורטות</h2><div class="instructions ql-editor">${task.detailed_instructions || '<p><em>אין הוראות מפורטות.</em></p>'}</div></div>
                <div class="section">${subtasksHtml}</div>
                <script>
                    function downloadAsPDF() {
                        alert('להורדה כ-PDF, השתמש באפשרות הדפסה ובחר "שמור כ-PDF"');
                        window.print();
                    }
                    function shareViaEmail() {
                        const subject = encodeURIComponent('פירוט משימה - ${task.name}');
                        const body = encodeURIComponent('שלום,\\n\\nמצורף פירוט המשימה "${task.name}".\\n\\nתוכן המשימה:\\n${task.description || "אין תיאור"}\\n\\nלצפייה מלאה: ' + window.location.href);
                        window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
                    }
                    function shareViaWhatsApp() {
                        const text = encodeURIComponent('פירוט משימה: ${task.name}\\n\\n${task.description || "אין תיאור"}\\n\\nלצפייה מלאה: ' + window.location.href);
                        window.open('https://wa.me/?text=' + text, '_blank');
                    }
                </script>
            </div></body></html>`;
        
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
    if (error) return <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2"><ListChecks className="w-7 h-7" /> ניהול צ'קליסט הקמת סניפים</h1>
                <Button onClick={() => { setSelectedTask(null); setIsFormOpen(true); }} className="bg-green-600 hover:bg-green-700">
                    <PlusCircle className="ml-2 h-4 w-4" /> הוסף משימה
                </Button>
            </div>
            <Card>
                <CardHeader><CardTitle>רשימת משימות</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 mb-4">גרור ושחרר את המשימות כדי לשנות את סדרן.</p>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="tasks">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                    {tasks.map((task, index) => (
                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps} className="flex items-center p-3 bg-white border rounded-lg shadow-sm">
                                                    <GripVertical className="text-gray-400 mr-3" />
                                                    <div className="flex-grow">
                                                        <p className="font-semibold">{task.name}</p>
                                                        <p className="text-sm text-gray-600">{task.description}</p>
                                                        { (task.detailed_instructions && task.detailed_instructions.trim()) || (task.sub_tasks && task.sub_tasks.length > 0) ? (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <button onClick={() => handleShowTaskDetails(task)} className="text-xs text-blue-600 italic underline hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1">
                                                                    <FileText className="w-3 h-3" /> קיים פירוט על המשימה - לחץ לצפייה
                                                                </button>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-800" onClick={(e) => { e.stopPropagation(); generateTaskReport(task); }} title="הורד דוח פירוט">
                                                                    <Download className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ) : null }
                                                        {task.suggested_contact_roles && task.suggested_contact_roles.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                <Tag className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                                                                {task.suggested_contact_roles.map(role => <Badge key={role} variant="outline">{role}</Badge>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="icon" onClick={() => { setSelectedTask(task); setIsFormOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                                        <Button variant="outline" size="icon" className="text-red-500" onClick={() => handleDeleteTask(task.id)}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </CardContent>
            </Card>

            <TaskForm 
                open={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                task={selectedTask} 
                onSave={handleSaveTask} 
                onAutoSave={handleAutoSaveTask}
                availableRoles={availableRoles} 
            />
            <TaskDetailsDialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} task={taskForDetails} />
        </div>
    );
}
