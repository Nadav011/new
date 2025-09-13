import React, { useState, useEffect, useMemo } from 'react';
import { PlannedAccessibilityVisit, Branch } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle, Edit, Trash2, Calendar as CalendarIcon, MoreHorizontal, CheckCircle, XCircle, Clock, RotateCcw, Store, MapPin, User, ClipboardList, Search, Accessibility } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const VisitForm = ({ open, onOpenChange, visit, onSave, branches }) => {
    const [formData, setFormData] = useState({});
    
    useEffect(() => {
        if (visit) {
            setFormData({ ...visit, visit_date: visit.visit_date ? new Date(visit.visit_date) : new Date() });
        } else {
            setFormData({ branch_id: '', visit_date: new Date(), auditor_name: '', status: 'מתוכנן' });
        }
    }, [visit, open]);

    const handleBranchChange = (branchId) => {
        const selectedBranch = branches.find(b => b.id === branchId);
        setFormData(prev => ({ ...prev, branch_id: branchId, branch_name: selectedBranch?.name || '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.branch_id) {
            alert('יש לבחור סניף.');
            return;
        }
        onSave({ ...formData, visit_date: format(formData.visit_date, 'yyyy-MM-dd') });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>{visit && visit.id ? 'עריכת ביקור נגישות' : 'תכנון ביקור נגישות חדש'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label>סניף</Label>
                        <Select onValueChange={handleBranchChange} value={formData.branch_id || ''} required>
                            <SelectTrigger><SelectValue placeholder="בחר סניף..." /></SelectTrigger>
                            <SelectContent>
                                {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>תאריך ביקור</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-right font-normal">
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {formData.visit_date ? format(formData.visit_date, 'PPP', { locale: he }) : <span>בחר תאריך</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={formData.visit_date} onSelect={(date) => setFormData(p => ({ ...p, visit_date: date }))} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                        <Label>שם המבקר</Label>
                        <Input value={formData.auditor_name || ''} onChange={(e) => setFormData(p => ({ ...p, auditor_name: e.target.value }))} required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
                        <Button type="submit">שמור</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const StatusBadge = ({ status }) => {
    const statusMap = {
        'מתוכנן': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
        'בוצע': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
        'בוטל': { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
    };
    const { icon: Icon, color, bg } = statusMap[status] || {};
    return (
        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm font-medium ${bg} ${color}`}>
            {Icon && <Icon className="w-4 h-4" />}
            {status}
        </span>
    );
};

export default function PlannedAccessibilityVisits() {
    const [visits, setVisits] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [visitToDelete, setVisitToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [visitsData, branchesData] = await Promise.all([
                PlannedAccessibilityVisit.list('-visit_date'),
                Branch.list(),
            ]);
            setVisits(visitsData);
            setBranches(branchesData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (visit = null) => {
        setSelectedVisit(visit);
        setIsFormOpen(true);
    };

    const handleSaveVisit = async (formData) => {
        try {
            if (formData.id) {
                await PlannedAccessibilityVisit.update(formData.id, formData);
            } else {
                await PlannedAccessibilityVisit.create(formData);
            }
            await loadData();
        } catch (error) {
            console.error("Failed to save visit:", error);
            alert("שגיאה בשמירת הביקור");
        }
    };

    const handleStatusChange = async (visit, status) => {
        try {
            await PlannedAccessibilityVisit.update(visit.id, { status });
            await loadData();
        } catch(error) {
             console.error("Failed to update status:", error);
             alert("שגיאה בעדכון הסטטוס");
        }
    };

    const handleDeleteVisit = async () => {
        if (!visitToDelete) return;
        try {
            await PlannedAccessibilityVisit.delete(visitToDelete.id);
            await loadData();
            setVisitToDelete(null);
        } catch (error) {
            console.error("Failed to delete visit:", error);
            alert("שגיאה במחיקת הביקור");
        }
    };
    
    const branchesWithStatus = useMemo(() => {
        const plannedBranchIds = new Set(visits.map(v => v.branch_id));
        return branches
            .map(branch => ({
                ...branch,
                isPlanned: plannedBranchIds.has(branch.id)
            }))
            .filter(branch => 
                !searchTerm || 
                branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                branch.city.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                if (a.isPlanned !== b.isPlanned) return a.isPlanned ? 1 : -1;
                return a.name.localeCompare(b.name, 'he');
            });
    }, [branches, visits, searchTerm]);

    if (isLoading) return <div>טוען נתונים...</div>;

    return (
        <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
            {/* Branch List Sidebar */}
            <div className="w-80 flex-shrink-0">
                <Card className="h-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Accessibility className="w-5 h-5" />
                            תכנון בסניפים
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 border-b">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="חיפוש סניף..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10 text-sm"
                            />
                        </div>
                    </CardContent>
                    <CardContent className="p-0">
                        <div className="max-h-[500px] overflow-y-auto">
                            {branchesWithStatus.map(branch => (
                                <div key={branch.id} className="p-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-gray-900">{branch.name}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-1 truncate">
                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{branch.city}</span>
                                            </div>
                                        </div>
                                        {branch.isPlanned ? (
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6 min-h-0 overflow-auto">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold">תכנון ביקורות נגישות</h1>
                    <Button onClick={() => handleOpenForm()} className="gap-2">
                        <PlusCircle className="w-4 h-4" />
                        תכנן ביקור חדש
                    </Button>
                </div>

                <Card>
                    <CardHeader><CardTitle>ביקורים מתוכננים ({visits.length})</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            {visits.length > 0 ? visits.map(visit => (
                                <div key={visit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-2">
                                        <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-gray-400" /><span className="font-medium">{format(new Date(visit.visit_date), 'dd/MM/yyyy', { locale: he })}</span></div>
                                        <div className="flex items-center gap-2"><Store className="w-4 h-4 text-gray-400" /><span>{visit.branch_name}</span></div>
                                        <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span>{visit.auditor_name}</span></div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <StatusBadge status={visit.status} />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent dir="rtl">
                                                <DropdownMenuItem onClick={() => handleOpenForm(visit)} className="gap-2"><Edit className="w-4 h-4 text-blue-500" /> ערוך</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(visit, 'מתוכנן')} className="gap-2"><RotateCcw className="w-4 h-4 text-gray-500" /> איפוס סטטוס</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(visit, 'בוצע')} className="gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> סמן כ"בוצע"</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(visit, 'בוטל')} className="gap-2"><XCircle className="w-4 h-4 text-red-500" /> סמן כ"בוטל"</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setVisitToDelete(visit)} className="gap-2 text-red-600"><Trash2 className="w-4 h-4" /> מחק</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 text-gray-500">
                                    <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium mb-2">לא נמצאו ביקורים מתוכננים</p>
                                    <p className="text-sm">התחל בתכנון ביקורי נגישות חדשים</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <VisitForm open={isFormOpen} onOpenChange={setIsFormOpen} visit={selectedVisit} onSave={handleSaveVisit} branches={branches} />
            
            <AlertDialog open={!!visitToDelete} onOpenChange={() => setVisitToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>האם אתה בטוח שברצונך למחוק את הביקור המתוכנן לסניף "{visitToDelete?.branch_name}"?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteVisit} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}