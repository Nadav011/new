import React, { useState, useEffect } from 'react';
import { NetworkTaskRecord } from '@/api/entities'; // <-- ייבוא הישות האמיתית
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// המוקד הבעייתי - הסרת האובייקט המדומה
/*
const NetworkTaskRecord = { ... }; // <--- מחיקת כל האובייקט המדומה
*/

// פונקציה מתוקנת לחישוב תאריך יעד
const calculateNextDueDate = (task, completionDateStr) => {
    // בודק אם יש למשימה תדירות בחודשים והיא גדולה מאפס
    if (!task || !completionDateStr || !task.frequency_in_months || task.frequency_in_months <= 0) {
        return null;
    }

    const completionDate = new Date(completionDateStr);
    let nextDate = new Date(completionDate);

    // מוסיף את מספר החודשים לתאריך הביצוע
    nextDate.setMonth(nextDate.getMonth() + task.frequency_in_months);

    return nextDate.toISOString();
};


export default function NetworkTaskRecordForm({ open, onOpenChange, branch, allTasks, recordToEdit, onSave }) {
    const [formData, setFormData] = useState({
        completion_date: new Date().toISOString().slice(0, 16),
        responsible_person: '',
        participants: '',
        status: 'בוצע'
    });
    const [selectedTask, setSelectedTask] = useState(null);
    const [isNewRecord, setIsNewRecord] = useState(false);

    useEffect(() => {
        if (open) {
            if (recordToEdit) {
                // Edit mode
                setIsNewRecord(false);
                setFormData({
                    completion_date: recordToEdit.completion_date ? new Date(recordToEdit.completion_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                    responsible_person: recordToEdit.responsible_person || '',
                    participants: recordToEdit.participants || '',
                    status: recordToEdit.status || 'בוצע'
                });
                const task = allTasks?.find(t => t.id === recordToEdit.task_id);
                setSelectedTask(task || null);
            } else {
                // Create mode
                setIsNewRecord(true);
                setFormData({
                    completion_date: new Date().toISOString().slice(0, 16),
                    responsible_person: '',
                    participants: '',
                    status: 'בוצע'
                });
                setSelectedTask(allTasks && allTasks.length > 0 ? allTasks[0] : null);
            }
        }
    }, [recordToEdit, open, allTasks]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedTask) {
            alert("יש לבחור משימה לפני השמירה.");
            return;
        }
        if (!branch || !branch.id) {
            alert("שגיאה: פרטי הסניף חסרים.");
            return;
        }

        try {
            let savedRecord;
            const payload = {
                ...formData,
                branch_id: branch.id,
                task_id: selectedTask.id,
                next_due_date: calculateNextDueDate(selectedTask, formData.completion_date)
            };

            if (recordToEdit) {
                // שימוש ב-SDK האמיתי לעדכון
                savedRecord = await NetworkTaskRecord.update(recordToEdit.id, payload);
            } else {
                // שימוש ב-SDK האמיתי ליצירה
                savedRecord = await NetworkTaskRecord.create(payload);
            }
            
            onSave(savedRecord);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save network task record:", error);
            alert("שגיאה בשמירת רישום המשימה. אנא נסה שוב.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {recordToEdit ? 'עריכת משימה רשתית' : 'רישום ביצוע משימה רשתית'}
                    </DialogTitle>
                    <DialogDescription>
                        משימה: {selectedTask ? selectedTask.name : 'בחר משימה'}<br />
                        סניף: {branch ? branch.name : 'שם הסניף אינו זמין'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isNewRecord && allTasks && allTasks.length > 0 && (
                        <div>
                            <Label htmlFor="task_selection">בחירת משימה</Label>
                            <Select
                                value={selectedTask ? selectedTask.id : ''}
                                onValueChange={(value) => {
                                    const task = allTasks.find(t => t.id === value);
                                    setSelectedTask(task || null);
                                }}
                            >
                                <SelectTrigger id="task_selection">
                                    <SelectValue placeholder="בחר משימה..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allTasks.map((task) => (
                                        <SelectItem key={task.id} value={task.id}>
                                            {task.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="status">סטטוס המשימה</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                            <SelectTrigger>
                                <SelectValue placeholder="בחר סטטוס..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="בוצע">הושלמה בהצלחה</SelectItem>
                                <SelectItem value="בתהליך">בתהליך ביצוע</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div>
                        <Label htmlFor="completion_date">תאריך ביצוע/התחלה</Label>
                        <Input
                            type="datetime-local"
                            id="completion_date"
                            value={formData.completion_date}
                            onChange={(e) => setFormData({...formData, completion_date: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="responsible_person">שם האחראי</Label>
                        <Input
                            id="responsible_person"
                            value={formData.responsible_person}
                            onChange={(e) => setFormData({...formData, responsible_person: e.target.value})}
                            placeholder="שם האחראי שביצע/מבצע את המשימה"
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="participants">משתתפים</Label>
                        <Textarea
                            id="participants"
                            value={formData.participants}
                            onChange={(e) => setFormData({...formData, participants: e.target.value})}
                            placeholder="שמות המשתתפים במשימה (אופציונלי)"
                            rows={3}
                        />
                    </div>
                    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            ביטול
                        </Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                            {recordToEdit ? 'עדכן' : 'שמור'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}