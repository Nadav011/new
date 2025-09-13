
import React, { useState, useEffect } from 'react';
import { Training, TrainingRecord, Branch, User, BranchOwnership } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, BookOpen, AlertCircle, RefreshCw, Save } from 'lucide-react';
import { format } from 'date-fns'; // Added for completeness based on outline, though not directly used in this file's current logic
import { he } from 'date-fns/locale'; // Added for completeness based on outline, though not directly used in this file's current logic
import TrainingRecordForm from '../components/TrainingRecordForm'; // Added for completeness based on outline, though not directly used in this file's current logic
import { Checkbox } from "@/components/ui/checkbox"; // Added for completeness based on outline, though not directly used in this file's current logic


export default function ManageTrainings() {
    const [trainings, setTrainings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Renamed from loadError to error as per outline
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [trainingToDelete, setTrainingToDelete] = useState(null);
    const [formData, setFormData] = useState({});

    // New function from outline for sending emails to branch owners
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
                    const personalizedBody = body.replace(/\[שם בעל הסניף\]/g, owner.full_name || 'לקוח יקר');
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

    useEffect(() => {
        loadTrainings();
        // Note: The outline included 'loadInitialData()' here, but that function is not defined in the original file.
        // Keeping the existing 'loadTrainings()' for functionality.
    }, []);

    const loadTrainings = async () => {
        setIsLoading(true);
        setError(null); // Updated from setLoadError to setError
        try {
            const data = await Training.list('-created_date');
            setTrainings(data);
        } catch (currentError) { // Renamed 'error' to 'currentError' to avoid conflict with state variable
            console.error("Error loading trainings:", currentError);
            setError("אירעה שגיאת רשת. לא ניתן היה לטעון את רשימת ההדרכות."); // Updated from setLoadError to setError
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (training = null) => {
        if (training) {
            setSelectedTraining(training);
            setFormData({
                name: training.name,
                description: training.description || '',
                frequency_in_months: training.frequency_in_months || 0,
                is_active: training.is_active !== false,
                trainer_name: training.trainer_name || '',
                materials_url: training.materials_url || ''
            });
        } else {
            setSelectedTraining(null);
            setFormData({
                name: '',
                description: '',
                frequency_in_months: 0,
                is_active: true,
                trainer_name: '',
                materials_url: ''
            });
        }
        setIsFormOpen(true);
    };

    const handleSaveTraining = async () => {
        if (!formData.name.trim()) {
            alert('יש להזין שם הדרכה');
            return;
        }

        try {
            if (selectedTraining) {
                await Training.update(selectedTraining.id, formData);
            } else {
                await Training.create(formData);
            }
            await loadTrainings();
            setIsFormOpen(false);
        } catch (currentError) { // Renamed 'error' to 'currentError' to avoid conflict with state variable
            console.error("Error saving training:", currentError);
            alert('שגיאה בשמירת ההדרכה');
        }
    };

    const handleDeleteTraining = async () => {
        if (trainingToDelete) {
            try {
                await Training.delete(trainingToDelete.id);
                await loadTrainings();
                setTrainingToDelete(null);
                alert('ההדרכה נמחקה בהצלחה');
            } catch (currentError) { // Renamed 'error' to 'currentError' to avoid conflict with state variable
                console.error("Error deleting training:", currentError);
                alert('שגיאה במחיקת ההדרכה. ייתכן שיש רשומות הקשורות אליה.');
            }
        }
    };

    const frequencyOptions = [
        { label: 'חד פעמית', value: 0 },
        { label: 'חודשית', value: 1 },
        { label: 'דו חודשית', value: 2 },
        { label: 'רבעונית', value: 3 },
        { label: 'חצי שנתית', value: 6 },
        { label: 'שנתית', value: 12 },
        { label: 'דו שנתית', value: 24 },
    ];

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-purple-600" /></div>;
    }

    if (error) { // Updated from loadError to error
        return (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
                <p className="text-red-600 mb-4">{error}</p> {/* Updated from loadError to error */}
                <Button onClick={loadTrainings}><RefreshCw className="ml-2 h-4 w-4" /> נסה שוב</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-7 h-7" />
                    ניהול סוגי הדרכות
                </h1>
                <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700">
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף הדרכה חדשה
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>רשימת הדרכות ({trainings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם ההדרכה</TableHead>
                                <TableHead>תדירות</TableHead>
                                <TableHead>סטטוס</TableHead>
                                <TableHead>פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trainings.map(training => (
                                <TableRow key={training.id}>
                                    <TableCell className="font-medium">{training.name}</TableCell>
                                    <TableCell>
                                        {frequencyOptions.find(f => f.value === training.frequency_in_months)?.label || `${training.frequency_in_months} חודשים`}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={training.is_active ? 'default' : 'secondary'}>
                                            {training.is_active ? 'פעילה' : 'לא פעילה'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(training)}>
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setTrainingToDelete(training)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{selectedTraining ? 'עריכת הדרכה' : 'הוספת הדרכה חדשה'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">שם</Label>
                            <Input id="name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">תיאור</Label>
                            <Textarea id="description" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="frequency" className="text-right">תדירות</Label>
                            <Select onValueChange={v => setFormData({...formData, frequency_in_months: parseInt(v)})} value={String(formData.frequency_in_months || 0)}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {frequencyOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="trainer_name" className="text-right">מדריך</Label>
                            <Input id="trainer_name" value={formData.trainer_name || ''} onChange={e => setFormData({...formData, trainer_name: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="materials_url" className="text-right">חומרים</Label>
                            <Input id="materials_url" placeholder="הדבק קישור..." value={formData.materials_url || ''} onChange={e => setFormData({...formData, materials_url: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="is_active" checked={formData.is_active} onCheckedChange={c => setFormData({...formData, is_active: c})} />
                            <Label htmlFor="is_active">הדרכה פעילה</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)}>ביטול</Button>
                        <Button onClick={handleSaveTraining} className="bg-green-600 hover:bg-green-700">
                            <Save className="ml-2 h-4 w-4"/>
                            שמור
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!trainingToDelete} onOpenChange={() => setTrainingToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את ההדרכה "{trainingToDelete?.name}"?
                            פעולה זו לא תמחק רישומי הדרכה שכבר בוצעו, אך תסיר את ההדרכה מהמעקב.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTraining} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
