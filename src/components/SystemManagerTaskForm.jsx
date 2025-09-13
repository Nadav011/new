
import React, { useState, useEffect } from 'react';
import { PersonalTask } from '@/api/entities';
import { BranchOwnership, User } from '@/api/entities';
import { SendEmail } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from './ui/date-picker';
import { Save, User as UserIcon, Users, Building } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function SystemManagerTaskForm({ open, onOpenChange, onSave, branches = [], networkContacts = [], currentUser, initialTask }) {
    const [task, setTask] = useState({
        task_type: 'system_manager_personal',
        subject: '',
        text: '',
        priority: 'medium',
        status: 'pending',
        meeting_date: null,
        collaborator_ids: [],
        branch_id: '',
    });
    const [selectedCollaborators, setSelectedCollaborators] = useState(new Set());
    const [sendToBranch, setSendToBranch] = useState(false);

    const isEditing = !!initialTask;
    const formTitle = isEditing ? 'עריכת משימה' : 'יצירת משימה חדשה';
    const formDescription = isEditing ? 'ערוך את פרטי המשימה הקיימת.' : 'בחר את סוג המשימה ומלא את הפרטים הנדרשים.';

    // Helper function for sending emails
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
        } catch (error) {
            console.error("Failed to send notification email to branch owners:", error);
        }
    };

    useEffect(() => {
        if (open) {
            if (initialTask) {
                setTask({
                    task_type: initialTask.task_type || 'system_manager_personal',
                    subject: initialTask.subject || '',
                    text: initialTask.text || '',
                    priority: initialTask.priority || 'medium',
                    status: initialTask.status || 'pending',
                    meeting_date: initialTask.meeting_date || null,
                    collaborator_ids: initialTask.collaborator_ids || [],
                    branch_id: initialTask.branch_id || '',
                });
                setSelectedCollaborators(new Set(initialTask.collaborator_ids || []));
                setSendToBranch(false);
            } else {
                setTask({
                    task_type: 'system_manager_personal',
                    subject: '',
                    text: '',
                    priority: 'medium',
                    status: 'pending',
                    meeting_date: null,
                    collaborator_ids: [],
                    branch_id: '',
                });
                setSelectedCollaborators(new Set());
                setSendToBranch(false);
            }
        }
    }, [open, initialTask]);

    const handleTypeChange = (value) => {
        setTask(prev => ({ ...prev, task_type: value }));
    };

    const handleCollaboratorChange = (contactId, checked) => {
        const newSelection = new Set(selectedCollaborators);
        if (checked) {
            newSelection.add(contactId);
        } else {
            newSelection.delete(contactId);
        }
        setSelectedCollaborators(newSelection);
    };

    const handleSaveClick = async () => {
        console.log('🎯 handleSaveClick called');
        console.log('📋 Current task data:', task);
        console.log('✅ sendToBranch checkbox:', sendToBranch);
        console.log('🆔 isEditing (initialTask exists):', !!initialTask);

        if (!task.subject.trim() || !task.text.trim()) {
            console.log('❌ Validation failed - missing subject or text');
            alert('יש למלא נושא ותוכן למשימה.');
            return;
        }

        const finalTaskData = {
            ...task,
            collaborator_ids: Array.from(selectedCollaborators),
            created_by: currentUser?.email,
        };

        if (task.task_type !== 'system_manager_collaborative') {
            finalTaskData.collaborator_ids = [];
        }
        if (task.task_type !== 'system_manager_branch') {
            finalTaskData.branch_id = '';
        } else if (task.task_type === 'system_manager_branch' && task.branch_id) {
            const selectedBranch = branches.find(b => b.id === task.branch_id);
            if (selectedBranch) {
                finalTaskData.branch_name = selectedBranch.name;
            }
        }
        
        console.log('💾 Saving task with data:', finalTaskData);
        await onSave(finalTaskData);
        console.log('✅ Main task saved successfully');

        // Check conditions for branch task creation
        console.log('🔍 Checking branch task conditions:');
        console.log('   - Not editing (new task):', !initialTask);
        console.log('   - Task type is branch:', task.task_type === 'system_manager_branch');
        console.log('   - Branch ID exists:', !!task.branch_id);
        console.log('   - Send to branch checkbox:', sendToBranch);

        const shouldCreateBranchTask = !initialTask && 
                                     task.task_type === 'system_manager_branch' && 
                                     task.branch_id && 
                                     sendToBranch;

        console.log('🚀 Should create branch task?', shouldCreateBranchTask);

        if (shouldCreateBranchTask) {
            console.log('🏗️ Creating branch task...');
            try {
                const selectedBranch = branches.find(b => b.id === task.branch_id);
                console.log('🏢 Selected branch:', selectedBranch);
                
                const branchTaskData = {
                    task_type: 'branch_specific',
                    subject: task.subject,
                    text: task.text,
                    priority: task.priority,
                    status: 'pending',
                    branch_id: task.branch_id,
                    branch_name: selectedBranch?.name || '',
                    assigned_to_user_id: '',
                    created_by: currentUser?.email,
                };
                
                console.log('💾 Creating branch task with data:', branchTaskData);
                const newBranchTask = await PersonalTask.create(branchTaskData);
                console.log('✅ Branch task created:', newBranchTask);

                // Send email notification
                console.log('📧 Sending email notifications...');
                const emailSubject = `משימה חדשה התקבלה עבור סניף ${selectedBranch.name}`;
                const emailBody = `
שלום [שם בעל הסניף],

משימה חדשה התקבלה עבור סניף "${selectedBranch.name}" ממנהל המערכת.

נושא: ${task.subject}
תוכן: ${task.text}

לצפייה בכל המשימות שלך, אנא היכנס לקישור הבא:
${window.location.origin}${createPageUrl('MyTasks')}

בברכה,
מערכת בקרת רשת - המקסיקני
`;
                await sendNotificationEmailToBranchOwners(task.branch_id, emailSubject, emailBody);
                console.log('✅ Email notifications sent');

                // Fire popup notification
                console.log('🚀 PREPARING TO FIRE NOTIFICATION EVENT!');
                const notificationDetail = {
                    type: 'branch_task_assigned',
                    branchId: task.branch_id,
                    taskId: newBranchTask.id,
                    message: `משימה חדשה ממנהל המערכת: ${task.subject}`,
                    priority: task.priority,
                    branch_name: selectedBranch?.name || '',
                    link: createPageUrl('MyTasks') + `?highlight=${newBranchTask.id}`
                };
                
                console.log('📤 Notification detail prepared:', notificationDetail);
                console.log('🕒 Waiting 500ms before dispatching event...');
                
                // Small delay to ensure NotificationEngine is ready
                setTimeout(() => {
                    console.log('🎉 DISPATCHING EVENT NOW!');
                    window.dispatchEvent(new CustomEvent('newBranchNotification', {
                        detail: notificationDetail
                    }));
                    console.log('✅ Event dispatched successfully!');
                }, 500);

            } catch (branchTaskError) {
                console.error('❌ Failed to create branch task or send notification:', branchTaskError);
                alert('המשימה נשמרה אך אירעה שגיאה ביצירת המשימה עבור הסניף או בשליחת ההתראה.');
            }
        } else {
            console.log('⏭️ Skipping branch task creation - conditions not met');
        }
        
        console.log('🔚 Closing form');
        onOpenChange(false);
    };

    const collaboratorList = Array.isArray(networkContacts) ? networkContacts : [];
    const branchList = Array.isArray(branches) ? branches : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{formTitle}</DialogTitle>
                    <DialogDescription>{formDescription}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>סוג המשימה</Label>
                        <RadioGroup
                            value={task.task_type}
                            onValueChange={handleTypeChange}
                            className="flex space-x-4 space-x-reverse"
                        >
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <RadioGroupItem value="system_manager_personal" id="type-personal" disabled={isEditing} />
                                <Label htmlFor="type-personal" className="flex items-center gap-1">
                                    <UserIcon className="w-4 h-4" /> משימה אישית למנהל
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <RadioGroupItem value="system_manager_collaborative" id="type-collaborative" disabled={isEditing} />
                                <Label htmlFor="type-collaborative" className="flex items-center gap-1">
                                    <Users className="w-4 h-4" /> משימה משולבת
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <RadioGroupItem value="system_manager_branch" id="type-branch" disabled={isEditing} />
                                <Label htmlFor="type-branch" className="flex items-center gap-1">
                                    <Building className="w-4 h-4" /> משימה לסניף
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">נושא</Label>
                        <Input
                            id="subject"
                            value={task.subject}
                            onChange={(e) => setTask(prev => ({ ...prev, subject: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="text">תוכן המשימה</Label>
                        <Textarea
                            id="text"
                            value={task.text}
                            onChange={(e) => setTask(prev => ({ ...prev, text: e.target.value }))}
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">דחיפות</Label>
                        <Select value={task.priority} onValueChange={(value) => setTask(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="בחר רמת דחיפות" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="נמוכה">נמוכה</SelectItem>
                                <SelectItem value="בינונית">בינונית</SelectItem>
                                <SelectItem value="גבוהה">גבוהה</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {task.task_type === 'system_manager_collaborative' && collaboratorList.length > 0 && (
                        <div className="space-y-2">
                            <Label className="block">בחר משתתפים</Label>
                            <div className="h-48 overflow-y-auto rounded-md border p-2">
                                <div className="space-y-2">
                                    {collaboratorList.map((contact) => (
                                        <div key={contact.id} className="flex items-center space-x-2 space-x-reverse py-1">
                                            <Checkbox
                                                id={`collaborator-${contact.id}`}
                                                checked={selectedCollaborators.has(contact.id)}
                                                onCheckedChange={(checked) => handleCollaboratorChange(contact.id, checked)}
                                            />
                                            <Label htmlFor={`collaborator-${contact.id}`} className="text-sm font-medium leading-none">
                                                {contact.first_name} {contact.last_name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {task.task_type === 'system_manager_branch' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="branch">בחר סניף</Label>
                                <Select value={task.branch_id} onValueChange={(value) => setTask(prev => ({ ...prev, branch_id: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="בחר סניף" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branchList.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {!isEditing && (
                                 <div className="flex items-center space-x-2 space-x-reverse pt-2">
                                    <Checkbox
                                        id="send-to-branch"
                                        checked={sendToBranch}
                                        onCheckedChange={setSendToBranch}
                                    />
                                    <Label htmlFor="send-to-branch">שלח כמשימה גם לעמוד המשימות של הסניף</Label>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        ביטול
                    </Button>
                    <Button onClick={handleSaveClick}>
                        <Save className="ml-2 h-4 w-4" />
                        {isEditing ? 'שמור שינויים' : 'צור משימה'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
