
import React, { useState, useEffect } from 'react';
import { PlannedVisit } from '@/api/entities';
import { Branch, QuestionnaireSettings, AuditQuestion, Notification } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Edit, Trash2, Calendar as CalendarIcon, MoreHorizontal, CheckCircle, XCircle, Clock, RotateCcw, Store, MapPin, User, BarChart2, ClipboardList, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BranchPlanningDetailsDialog from '../components/BranchPlanningDetailsDialog';

const VisitForm = ({ open, onOpenChange, visit, onSave, branches, questionnaireTypes }) => {
    const [formData, setFormData] = useState({});
    const [branchSearchTerm, setBranchSearchTerm] = useState('');

    useEffect(() => {
        if (visit) {
            setFormData({
                ...visit,
                visit_date: visit.visit_date || new Date().toISOString().split('T')[0],
            });
        } else {
            setFormData({
                branch_id: '',
                branch_name: '',
                audit_type: '',
                audit_type_name: '',
                visit_date: new Date().toISOString().split('T')[0],
                auditor_name: '',
                status: 'מתוכנן',
            });
        }
        if (open) {
            setBranchSearchTerm('');
        }
    }, [visit, open]);

    const handleBranchChange = (branchId) => {
        const selectedBranch = branches.find(b => b.id === branchId);
        setFormData(prev => ({
            ...prev,
            branch_id: branchId,
            branch_name: selectedBranch ? selectedBranch.name : ''
        }));
    };

    const handleAuditTypeChange = (auditTypeKey) => {
        const selectedType = questionnaireTypes.find(t => t.type === auditTypeKey);
        setFormData(prev => ({
            ...prev,
            audit_type: auditTypeKey,
            audit_type_name: selectedType ? selectedType.name : ''
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.branch_id) {
            alert('יש לבחור סניף.');
            return;
        }
        onSave(formData);
        onOpenChange(false);
    };

    const filteredBranches = branches.filter(branch =>
        branch.name.toLowerCase().includes(branchSearchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>{visit && visit.id ? 'עריכת ביקור מתוכנן' : 'תכנון ביקור חדש'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label>סניף</Label>
                        {formData.branch_id ? (
                            <div className="flex items-center justify-between mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <span className="text-blue-800 font-medium">{formData.branch_name}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, branch_id: '', branch_name: '' }));
                                        setBranchSearchTerm('');
                                    }}
                                >
                                    שנה בחירה
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-1">
                                <Input
                                    placeholder="חיפוש סניף..."
                                    value={branchSearchTerm}
                                    onChange={(e) => setBranchSearchTerm(e.target.value)}
                                    className="mb-2"
                                />
                                <div className="max-h-[200px] overflow-y-auto border rounded-md p-1 space-y-1">
                                    {filteredBranches.map(b => (
                                        <Button
                                            key={b.id}
                                            variant={'ghost'}
                                            className="w-full justify-start"
                                            onClick={() => handleBranchChange(b.id)}
                                            type="button"
                                        >
                                            {b.name}
                                        </Button>
                                    ))}
                                    {filteredBranches.length === 0 && (
                                        <div className="text-center text-sm text-gray-500 p-4">
                                            לא נמצאו סניפים
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <Label>סוג ביקורת</Label>
                        <Select onValueChange={handleAuditTypeChange} value={formData.audit_type || ''} required>
                            <SelectTrigger><SelectValue placeholder="בחר סוג ביקורת..." /></SelectTrigger>
                            <SelectContent>
                                {questionnaireTypes.map(q => <SelectItem key={q.type} value={q.type}>{q.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>תאריך ביקור</Label>
                        <Input
                            type="date"
                            value={formData.visit_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label>שם המבקר</Label>
                        <Input
                            value={formData.auditor_name || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, auditor_name: e.target.value }))}
                            required
                        />
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

const BranchListSidebar = ({ branches, branchStatus, onBranchSelect, totalQuestionnaires, searchTerm, statusFilter, onSearchChange, onStatusFilterChange }) => {
    const branchesWithStatus = branches.map(branch => ({
        ...branch,
        status: branchStatus[branch.id] || { plannedCount: 0, percentage: 0 }
    }));

    // Apply filters
    let filteredBranches = branchesWithStatus;

    // Search filter
    if (searchTerm) {
        filteredBranches = filteredBranches.filter(branch =>
            (branch.name && branch.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (branch.city && branch.city.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    // Status filter
    if (statusFilter !== 'all') {
        filteredBranches = filteredBranches.filter(branch => {
            switch (statusFilter) {
                case 'completed':
                    return branch.status.percentage === 100;
                case 'partial':
                    return branch.status.percentage > 0 && branch.status.percentage < 100;
                case 'none':
                    return branch.status.percentage === 0;
                default:
                    return true;
            }
        });
    }

    const sortedBranches = filteredBranches.sort((a, b) => {
        if (a.status.percentage < b.status.percentage) return -1;
        if (a.status.percentage > b.status.percentage) return 1;
        return (a.name || '').localeCompare(b.name || '', 'he');
    });

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    תכנון ביקורות בסניפים
                </CardTitle>
                <div className="text-sm text-gray-600">
                    סה"כ {totalQuestionnaires} סוגי ביקורות במערכת
                </div>
            </CardHeader>

            {/* Search and Filter */}
            <CardContent className="pb-3 border-b">
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="חיפוש סניף..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pr-10 text-sm"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                        <SelectTrigger className="text-sm">
                            <SelectValue placeholder="סטטוס תכנון" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">כל הסניפים</SelectItem>
                            <SelectItem value="completed">תוכנן במלואו</SelectItem>
                            <SelectItem value="partial">תוכנן חלקית</SelectItem>
                            <SelectItem value="none">טרם תוכנן</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        {sortedBranches.length} מתוך {branches.length} סניפים
                    </div>
                </div>
            </CardContent>

            <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                    {sortedBranches.length > 0 ? sortedBranches.map(branch => (
                        <div
                            key={branch.id}
                            onClick={() => onBranchSelect(branch)}
                            className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-gray-900">
                                        {branch.name}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{branch.city}</span>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-blue-700 flex-shrink-0 ml-2">
                                    תוכננו {branch.status.plannedCount}/{totalQuestionnaires}
                                </div>
                            </div>
                            <Progress value={branch.status.percentage} className="mt-2 h-2" />
                        </div>
                    )) : (
                        <div className="text-center py-8 text-gray-500">
                            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">לא נמצאו סניפים</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
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

const PlannedVisitsTable = ({ visits, branches, questionnaireTypes, onEdit, onStatusChange, onDelete }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>ביקורים מתוכננים ({visits.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    {visits.length > 0 ? visits.map(visit => (
                        <div key={visit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">
                                        {format(new Date(visit.visit_date), 'dd/MM/yyyy', { locale: he })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-gray-400" />
                                    <span>{visit.branch_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-gray-400" />
                                    <span>{visit.audit_type_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>{visit.auditor_name}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <StatusBadge status={visit.status} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent dir="rtl">
                                        <DropdownMenuItem onClick={() => onEdit(visit)} className="gap-2">
                                            <Edit className="w-4 h-4 text-blue-500" /> ערוך
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange(visit, 'מתוכנן')} className="gap-2">
                                            <RotateCcw className="w-4 h-4 text-gray-500" /> איפוס סטטוס
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange(visit, 'בוצע')} className="gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" /> סמן כ"בוצע"
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onStatusChange(visit, 'בוטל')} className="gap-2">
                                            <XCircle className="w-4 h-4 text-red-500" /> סמן כ"בוטל"
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(visit)} className="gap-2 text-red-600">
                                            <Trash2 className="w-4 h-4" /> מחק
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 text-gray-500">
                            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">לא נמצאו ביקורים מתוכננים</p>
                            <p className="text-sm">התחל בתכנון ביקורים חדשים</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default function PlannedVisits() {
    const [visits, setVisits] = useState([]);
    const [branches, setBranches] = useState([]);
    const [branchStatus, setBranchStatus] = useState({});
    const [questionnaireTypes, setQuestionnaireTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [visitToDelete, setVisitToDelete] = useState(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [selectedBranchForDetails, setSelectedBranchForDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Check if we need to auto-open the form for a specific branch
        const urlParams = new URLSearchParams(window.location.search);
        const branchId = urlParams.get('branch');
        const branchName = urlParams.get('name'); // Assuming branchName might be passed for completeness, though not strictly needed for lookup

        if (branchId && branches.length > 0) {
            const branch = branches.find(b => b.id === branchId);
            if (branch) {
                // If the branch is found and the form is not already open
                // and no visit is currently selected for editing
                if (!isFormOpen && !selectedVisit) {
                    handleOpenForm(null, branch);
                }
            }
            // Clean up URL parameters after processing, regardless of whether a branch was found
            // This prevents the dialog from reopening on subsequent renders
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [branches, isFormOpen, selectedVisit]); // Add isFormOpen and selectedVisit to dependencies to prevent re-opening unnecessarily

    const getQuestionnaireTypes = async () => {
        const [settings, allQuestions] = await Promise.all([
            QuestionnaireSettings.list(),
            AuditQuestion.list()
        ]);

        const typesFromSettings = settings.map(s => s.questionnaire_type);
        const typesFromQuestions = allQuestions.map(q => q.audit_type);
        const allActiveTypes = [...new Set([...typesFromSettings, ...typesFromQuestions])].filter(Boolean);

        const settingsMap = settings.reduce((acc, s) => {
            acc[s.questionnaire_type] = s.custom_name || s.questionnaire_type;
            return acc;
        }, {});

        return allActiveTypes.map(type => ({
            type: type,
            name: settingsMap[type] || type
        })).filter(item => item.type && item.name).sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB, 'he');
        });
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [visitsData, branchesData, typesData] = await Promise.all([
                PlannedVisit.list('-visit_date'),
                Branch.list(),
                getQuestionnaireTypes()
            ]);
            setVisits(visitsData);
            setBranches(branchesData);
            setQuestionnaireTypes(typesData);

            const plannedVisitsByBranch = visitsData.reduce((acc, visit) => {
                if (!acc[visit.branch_id]) acc[visit.branch_id] = new Set();
                acc[visit.branch_id].add(visit.audit_type);
                return acc;
            }, {});

            const status = {};
            branchesData.forEach(branch => {
                const plannedTypes = plannedVisitsByBranch[branch.id] || new Set();
                const plannedCount = plannedTypes.size;
                const totalCount = typesData.length;
                status[branch.id] = {
                    plannedCount,
                    percentage: totalCount > 0 ? (plannedCount / totalCount) * 100 : 0,
                };
            });
            setBranchStatus(status);

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (visit = null, preselectedBranch = null) => {
        const initialVisitData = visit ? visit : (preselectedBranch ? {
            branch_id: preselectedBranch.id,
            branch_name: preselectedBranch.name,
            audit_type: '', // Reset audit_type for new planning
            audit_type_name: '', // Reset audit_type_name for new planning
            visit_date: new Date().toISOString().split('T')[0], // Set current date in YYYY-MM-DD for new planning
            auditor_name: '', // Empty auditor name for new planning
            status: 'מתוכנן', // Default status for new planning
        } : null);
        setSelectedVisit(initialVisitData);
        setIsFormOpen(true);
    };

    const handleSaveVisit = async (formData) => {
        try {
            if (formData.id) {
                await PlannedVisit.update(formData.id, formData);

                // If visit status was changed to "בוצע" or "בוטל", mark related notifications as read
                if (formData.status === 'בוצע' || formData.status === 'בוטל') {
                    try {
                        const notifications = await Notification.filter({
                            type: 'planned_visit_overdue',
                            related_entity_id: formData.id,
                            is_read: false
                        });

                        // Mark all related notifications as read
                        for (const notification of notifications) {
                            await Notification.update(notification.id, { is_read: true });
                        }
                    } catch (notificationError) {
                        console.warn("Could not update related notifications:", notificationError);
                        // Continue even if notification update fails
                    }
                }
            } else {
                await PlannedVisit.create(formData);
            }
            await loadData();
            setIsFormOpen(false);
            setSelectedVisit(null);
        } catch (error) {
            console.error("Failed to save planned visit:", error);
            alert('שגיאה בשמירת הביקור המתוכנן');
        }
    };

    const handleStatusChange = async (visit, status) => {
        try {
            await PlannedVisit.update(visit.id, { status });

            // If status is "בוצע" or "בוטל", clear related notifications
            if (status === 'בוצע' || status === 'בוטל') {
                 try {
                    const notifications = await Notification.filter({
                        type: 'planned_visit_overdue',
                        related_entity_id: visit.id,
                        is_read: false
                    });
                    for (const notification of notifications) {
                        await Notification.update(notification.id, { is_read: true });
                    }
                } catch (notificationError) {
                    console.warn("Could not update related notifications on status change:", notificationError);
                }
            }

            await loadData();
        } catch(error) {
             console.error("Failed to update status:", error);
             alert("שגיאה בעדכון הסטטוס");
        }
    }

    const handleDeleteVisit = async () => {
        if (!visitToDelete) return;
        try {
            await PlannedVisit.delete(visitToDelete.id);

            // Delete related notification when deleting a planned visit
            try {
                const notifications = await Notification.filter({
                    type: 'planned_visit_overdue',
                    related_entity_id: visitToDelete.id
                });

                // Delete all related notifications for this visit
                for (const notification of notifications) {
                    await Notification.delete(notification.id);
                }
            } catch (notificationError) {
                console.warn("Could not delete related notifications:", notificationError);
                // Continue even if notification deletion fails
            }

            await loadData();
            setVisitToDelete(null);
        } catch (error) {
            console.error("Failed to delete planned visit:", error);
            alert('שגיאה במחיקת הביקור המתוכנן');
        }
    };

    const handleBranchSelect = (branch) => {
        setSelectedBranchForDetails(branch);
        setIsDetailsDialogOpen(true);
    };

    if (isLoading) return <div>טוען נתונים...</div>;

    const getPlannedVisitsForBranch = (branchId) => {
        return visits.filter(v => v.branch_id === branchId);
    };

    return (
        <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
            <div className="w-80 flex-shrink-0">
                <BranchListSidebar
                    branches={branches}
                    branchStatus={branchStatus}
                    onBranchSelect={handleBranchSelect}
                    totalQuestionnaires={questionnaireTypes.length}
                    searchTerm={searchTerm}
                    statusFilter={statusFilter}
                    onSearchChange={setSearchTerm}
                    onStatusFilterChange={setStatusFilter}
                />
            </div>

            <div className="flex-1 space-y-6 min-h-0 overflow-auto">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold">תכנון ביקורים</h1>
                    <Button onClick={() => handleOpenForm()} className="gap-2">
                        <PlusCircle className="w-4 h-4" />
                        תכנן ביקור חדש
                    </Button>
                </div>

                <PlannedVisitsTable
                    visits={visits}
                    branches={branches}
                    questionnaireTypes={questionnaireTypes}
                    onEdit={(visit) => handleOpenForm(visit)}
                    onStatusChange={handleStatusChange}
                    onDelete={setVisitToDelete}
                />
            </div>

            <VisitForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                visit={selectedVisit}
                onSave={handleSaveVisit}
                branches={branches}
                questionnaireTypes={questionnaireTypes}
            />

            {selectedBranchForDetails && (
                 <BranchPlanningDetailsDialog
                    open={isDetailsDialogOpen}
                    onOpenChange={setIsDetailsDialogOpen}
                    branch={selectedBranchForDetails}
                    allQuestionnaireTypes={questionnaireTypes}
                    plannedVisitsForBranch={getPlannedVisitsForBranch(selectedBranchForDetails.id)}
                    onPlanNewVisit={handleOpenForm}
                />
            )}

            <AlertDialog open={!!visitToDelete} onOpenChange={() => setVisitToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את הביקור המתוכנן לסניף "{visitToDelete?.branch_name}"?
                        </AlertDialogDescription>
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
