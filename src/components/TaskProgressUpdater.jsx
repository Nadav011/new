import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BranchSetupProgress, ContactRole } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Circle, RefreshCw, FileText, Upload, Paperclip, XIcon } from 'lucide-react';
import TaskContactAssignment from './TaskContactAssignment';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';
import { UploadFile } from '@/api/integrations';

// רכיב Badge פשוט במקום הייבוא
const Badge = ({ children, className = "", variant = "default" }) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
    const variants = {
        default: "bg-gray-100 text-gray-800",
        outline: "border border-gray-200 bg-white text-gray-800",
        secondary: "bg-blue-100 text-blue-800"
    };
    return (
        <span className={`${baseClasses} ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

const TaskProgressUpdater = ({ setupId, task, initialProgress, onProgressChange, isOwnerView }) => {
    const [progress, setProgress] = useState(initialProgress);
    const [isSaving, setIsSaving] = useState(false);
    const [isContactSelectorOpen, setIsContactSelectorOpen] = useState(false);
    const [allRoles, setAllRoles] = useState([]);
    const [subTaskUploadStates, setSubTaskUploadStates] = useState({});

    useEffect(() => {
        ContactRole.list().then(setAllRoles).catch(console.error);
    }, []);
    
    useEffect(() => {
        const initialSubTasks = task.sub_tasks?.map(st => {
            const savedStatus = initialProgress.sub_task_statuses?.find(s => s.text === st.text);
            return {
                ...st,
                status: savedStatus?.status || 'not_started',
                attached_files: savedStatus?.attached_files || st.attached_files || []
            };
        }) || [];
        
        setProgress({
            ...initialProgress,
            sub_task_statuses: initialSubTasks,
        });
    }, [task, initialProgress]);

    const handleSubTaskStatusChange = (subTaskText, newStatus) => {
        setProgress(prev => {
            const newSubTaskStatuses = [...prev.sub_task_statuses];
            const subTaskIndex = newSubTaskStatuses.findIndex(st => st.text === subTaskText);
            if (subTaskIndex > -1) {
                newSubTaskStatuses[subTaskIndex].status = newStatus;
            } else {
                newSubTaskStatuses.push({ text: subTaskText, status: newStatus, attached_files: [] });
            }
            return { ...prev, sub_task_statuses: newSubTaskStatuses };
        });
    };
    
    const handleSubtaskFileUpload = async (subTaskText, event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setSubTaskUploadStates(prev => ({ ...prev, [subTaskText]: true }));
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

            setProgress(prev => {
                const newSubTaskStatuses = [...prev.sub_task_statuses];
                const subTaskIndex = newSubTaskStatuses.findIndex(st => st.text === subTaskText);
                if (subTaskIndex > -1) {
                    const currentFiles = newSubTaskStatuses[subTaskIndex].attached_files || [];
                    newSubTaskStatuses[subTaskIndex].attached_files = [...currentFiles, ...uploadedFiles];
                }
                return { ...prev, sub_task_statuses: newSubTaskStatuses };
            });

        } catch (error) {
            console.error('Error uploading subtask files:', error);
            alert('שגיאה בהעלאת קבצים');
        } finally {
            setSubTaskUploadStates(prev => ({ ...prev, [subTaskText]: false }));
            event.target.value = '';
        }
    };
    
    const handleRemoveSubtaskFile = (subTaskText, fileIndexToRemove) => {
        setProgress(prev => {
            const newSubTaskStatuses = [...prev.sub_task_statuses];
            const subTaskIndex = newSubTaskStatuses.findIndex(st => st.text === subTaskText);
            if (subTaskIndex > -1) {
                newSubTaskStatuses[subTaskIndex].attached_files = newSubTaskStatuses[subTaskIndex].attached_files.filter((_, index) => index !== fileIndexToRemove);
            }
            return { ...prev, sub_task_statuses: newSubTaskStatuses };
        });
    };

    const quillModules = useMemo(() => ({
        toolbar: [
            ['bold', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link']
        ],
    }), []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToSave = {
                branch_setup_id: setupId,
                task_id: task.id,
                ...progress,
            };
            if (progress.id) {
                await BranchSetupProgress.update(progress.id, dataToSave);
            } else {
                const newProgress = await BranchSetupProgress.create(dataToSave);
                setProgress(prev => ({ ...prev, id: newProgress.id }));
            }
            if (onProgressChange) {
                onProgressChange();
            }
        } catch (error) {
            console.error("Failed to save progress", error);
            alert("שגיאה בשמירת ההתקדמות");
        } finally {
            setIsSaving(false);
        }
    };
    
    const statusConfig = {
        not_started: { text: 'טרם התחיל', icon: <Circle className="w-4 h-4 text-gray-400" /> },
        in_progress: { text: 'בתהליך', icon: <RefreshCw className="w-4 h-4 text-blue-500" /> },
        completed: { text: 'בוצע', icon: <CheckCircle className="w-4 h-4 text-green-500" /> }
    };
    
    const getSubTaskStatusValue = (subTaskText) => {
        const subTask = progress.sub_task_statuses?.find(st => st.text === subTaskText);
        return subTask?.status || 'not_started';
    };

    return (
        <div className="space-y-6">
            {/* Task Details */}
            {task.detailed_instructions && (
                <div>
                    <h4 className="font-semibold text-gray-800 mb-2">הוראות מפורטות:</h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div 
                            className="text-blue-900 leading-relaxed ql-editor"
                            dangerouslySetInnerHTML={{ __html: task.detailed_instructions }}
                        />
                    </div>
                </div>
            )}

            {/* Sub Tasks */}
            {task.sub_tasks && task.sub_tasks.length > 0 && (
                <div>
                    <h4 className="font-semibold text-gray-800 mb-2">משימות משנה:</h4>
                    <div className="space-y-3">
                        {task.sub_tasks.map((sub, index) => {
                             const subTaskProgress = progress.sub_task_statuses?.find(s => s.text === sub.text) || { status: 'not_started', attached_files: [] };
                             return (
                                <div key={index} className="p-3 bg-white rounded-md border">
                                    <div className="flex items-center gap-3">
                                        <p className="flex-grow">{sub.text}</p>
                                        <Select
                                            value={getSubTaskStatusValue(sub.text)}
                                            onValueChange={(newStatus) => handleSubTaskStatusChange(sub.text, newStatus)}
                                            disabled={isOwnerView}
                                        >
                                            <SelectTrigger className="w-[140px] bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="not_started">לא התחיל</SelectItem>
                                                <SelectItem value="in_progress">בתהליך</SelectItem>
                                                <SelectItem value="completed">בוצע</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="mt-2 pl-7 space-y-2">
                                        {/* File Upload for Subtask */}
                                        {!isOwnerView && (
                                            <div className="flex justify-end">
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={(e) => handleSubtaskFileUpload(sub.text, e)}
                                                    className="hidden"
                                                    id={`subtask-upload-${task.id}-${index}`}
                                                    disabled={subTaskUploadStates[sub.text]}
                                                />
                                                <label
                                                    htmlFor={`subtask-upload-${task.id}-${index}`}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border rounded-md cursor-pointer hover:bg-gray-200 text-xs"
                                                >
                                                    {subTaskUploadStates[sub.text] ? (
                                                        <><RefreshCw className="w-3 h-3 animate-spin" />מעלה...</>
                                                    ) : (
                                                        <><Upload className="w-3 h-3" />הוסף קובץ</>
                                                    )}
                                                </label>
                                            </div>
                                        )}
                                        {/* Attached files list */}
                                        <div className="space-y-1">
                                             {(subTaskProgress.attached_files || []).map((file, fileIndex) => (
                                                <div key={fileIndex} className="flex items-center gap-2 p-1 bg-gray-50 rounded text-xs">
                                                    <Paperclip className="w-3 h-3 text-gray-500" />
                                                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex-grow text-blue-600 hover:underline">{file.file_name}</a>
                                                    {!isOwnerView && (
                                                        <button type="button" onClick={() => handleRemoveSubtaskFile(sub.text, fileIndex)}>
                                                            <XIcon className="h-3 w-3 text-red-500" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </div>
            )}

            {/* Main Task Status and Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end pt-4 border-t">
                {/* Main status selector */}
                <div>
                    <label className="font-semibold text-gray-800 mb-2 block">סטטוס משימה ראשית</label>
                    <Select
                        value={progress.status}
                        onValueChange={(value) => setProgress(prev => ({...prev, status: value}))}
                        disabled={isOwnerView}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="לא התחיל">לא התחיל</SelectItem>
                            <SelectItem value="בתהליך">בתהליך</SelectItem>
                            <SelectItem value="הושלם">הושלם</SelectItem>
                            <SelectItem value="דחוי">דחוי</SelectItem>
                        </SelectContent>
                    </Select>
                     {isOwnerView && <p className="text-xs text-gray-500 mt-1">רק מנהל המערכת יכול לעדכן סטטוס משימה ראשית.</p>}
                </div>
                {/* Save button */}
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "שומר..." : "שמור התקדמות במשימה"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TaskProgressUpdater;