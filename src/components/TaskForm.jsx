import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { User, Users, Globe, Store, ArrowRight } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

// Helper function
const ensureArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [];
};

const taskTypes = [
    { value: 'personal', label: 'משימה אישית (עוז)', icon: <User className="w-5 h-5" /> },
    { value: 'collaborative', label: 'משימה משולבת עם בעל תפקיד', icon: <Users className="w-5 h-5" /> },
    { value: 'network', label: 'משימה שקשורה לכלל הרשת', icon: <Globe className="w-5 h-5" /> },
    { value: 'branch_specific', label: 'משימה ספציפית לסניף', icon: <Store className="w-5 h-5" /> },
];

const MultiSelectContacts = ({ contacts, selectedIds, onSelectionChange }) => {
    const [open, setOpen] = React.useState(false);

    const safeContacts = ensureArray(contacts);
    const safeSelectedIds = ensureArray(selectedIds);

    const handleSelect = (contactId) => {
        const newSelectedIds = safeSelectedIds.includes(contactId)
            ? safeSelectedIds.filter(id => id !== contactId)
            : [...safeSelectedIds, contactId];
        onSelectionChange(newSelectedIds);
    };
    
    const selectedCount = safeSelectedIds.length;
    const selectedNames = safeSelectedIds.map(id => {
        const contact = safeContacts.find(c => c.id === id);
        return contact ? `${contact.first_name} ${contact.last_name}` : '';
    }).filter(Boolean).join(', ');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-right">
                    {selectedCount > 0 ? `${selectedCount} נבחרו: ${selectedNames}` : "בחר אנשי קשר..."}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="חיפוש איש קשר..." />
                    <CommandEmpty>לא נמצאו אנשי קשר.</CommandEmpty>
                    <CommandGroup>
                        {safeContacts.map((contact) => (
                            <CommandItem
                                key={contact.id}
                                onSelect={() => handleSelect(contact.id)}
                                className="flex items-center"
                            >
                                <Checkbox
                                    className="ml-2"
                                    checked={safeSelectedIds.includes(contact.id)}
                                    onCheckedChange={() => handleSelect(contact.id)}
                                />
                                <span>{`${contact.first_name} ${contact.last_name}`}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


export default function TaskForm({ open, onOpenChange, task, onSave, branches, networkContacts }) {
    const [formData, setFormData] = React.useState({});
    const [step, setStep] = React.useState('select_type');
    const [isSaving, setIsSaving] = React.useState(false);

    const safeBranches = ensureArray(branches);
    const safeNetworkContacts = ensureArray(networkContacts);

    React.useEffect(() => {
        if (open) {
            if (task) {
                setFormData({
                    text: task.text || '',
                    priority: task.priority || 'medium',
                    meeting_date: task.meeting_date ? new Date(task.meeting_date) : null,
                    task_type: task.task_type || 'personal',
                    collaborator_ids: ensureArray(task.collaborator_ids),
                    branch_id: task.branch_id || '',
                });
                setStep('details');
            } else {
                setFormData({
                    text: '',
                    priority: 'medium',
                    meeting_date: null,
                    task_type: 'personal',
                    collaborator_ids: [],
                    branch_id: '',
                });
                setStep('select_type');
            }
        }
    }, [task, open]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSelectType = (type) => {
        handleChange('task_type', type);
        setStep('details');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const dataToSave = { ...formData };
            if (dataToSave.task_type === 'branch_specific' && dataToSave.branch_id) {
                const selectedBranch = safeBranches.find(b => b.id === dataToSave.branch_id);
                dataToSave.branch_name = selectedBranch?.name || '';
            }
            await onSave(dataToSave);
        } catch(e) {
            console.error(e)
        } finally {
            setIsSaving(false);
        }
    };

    const renderTypeSelection = () => (
        <>
            <DialogHeader>
                <DialogTitle>בחר סוג משימה</DialogTitle>
                <DialogDescription>בחר את סוג המשימה שברצונך ליצור.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {taskTypes.map(type => (
                    <button
                        key={type.value}
                        onClick={() => handleSelectType(type.value)}
                        className="flex flex-col items-center justify-center p-4 border rounded-lg text-center hover:bg-gray-100 transition-colors"
                    >
                        {type.icon}
                        <span className="mt-2 font-semibold">{type.label}</span>
                    </button>
                ))}
            </div>
        </>
    );

    const renderDetailsForm = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
                <DialogTitle>{task ? 'עריכת משימה' : 'פרטי המשימה החדשה'}</DialogTitle>
                <DialogDescription>
                    {taskTypes.find(t => t.value === formData.task_type)?.label}
                </DialogDescription>
            </DialogHeader>
            
            <Textarea
                placeholder="מה צריך לעשות?"
                value={formData.text}
                onChange={(e) => handleChange('text', e.target.value)}
                required
                rows={4}
            />

            {formData.task_type === 'collaborative' && (
                <div>
                    <Label>שייך אנשי קשר</Label>
                    <MultiSelectContacts
                        contacts={safeNetworkContacts}
                        selectedIds={ensureArray(formData.collaborator_ids)}
                        onSelectionChange={(ids) => handleChange('collaborator_ids', ids)}
                    />
                </div>
            )}

            {formData.task_type === 'branch_specific' && (
                <div>
                    <Label>בחר סניף</Label>
                    <Select value={formData.branch_id || ''} onValueChange={(value) => handleChange('branch_id', value)}>
                        <SelectTrigger><SelectValue placeholder="בחר סניף..." /></SelectTrigger>
                        <SelectContent>
                            {safeBranches.map(branch => (
                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>עדיפות</Label>
                    <Select value={formData.priority || 'medium'} onValueChange={(value) => handleChange('priority', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">נמוכה</SelectItem>
                            <SelectItem value="medium">בינונית</SelectItem>
                            <SelectItem value="high">גבוהה</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label>תאריך פגישה/יעד</Label>
                    <DatePicker date={formData.meeting_date} setDate={(date) => handleChange('meeting_date', date)} />
                </div>
            </div>

            <DialogFooter className="pt-4">
                {!task && (
                     <Button type="button" variant="ghost" onClick={() => setStep('select_type')}>
                        <ArrowRight className="ml-2 h-4 w-4" />
                        חזור לבחירת סוג
                    </Button>
                )}
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'שומר...' : (task ? 'עדכן משימה' : 'צור משימה')}
                </Button>
            </DialogFooter>
        </form>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl">
                {step === 'select_type' && !task ? renderTypeSelection() : renderDetailsForm()}
            </DialogContent>
        </Dialog>
    );
}