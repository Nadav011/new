
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Audit } from '@/api/entities';
import { Branch } from '@/api/entities';
import { QuestionnaireSettings } from '@/api/entities';
import { AuditResponse } from '@/api/entities';
import { AuditQuestion } from '@/api/entities';
import { User } from '@/api/entities';
import { BranchOwnership } from '@/api/entities';
import { HealthAudit } from '@/api/entities';
import { AccessibilityAudit } from '@/api/entities';
import { MinistryAudit } from '@/api/entities';
import { TaxAudit } from '@/api/entities';
import { PersonalTask } from '@/api/entities';
import { NetworkContact } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Search, Filter, Eye, ClipboardList, Calendar, User as UserIcon, Award, Edit, Trash2, AlertCircle, RefreshCw, Plus, ListPlus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ExportButton from '../components/ExportButton';
import { safeDeleteAudit } from '../components/SafeDeleteHelper';
import FullPageError from '../components/FullPageError';
import TaskForm from '../components/TaskForm'; // Changed from SimpleTaskForm
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Audits() {
    const [audits, setAudits] = useState([]);
    const [filteredAudits, setFilteredAudits] = useState([]);
    const [branches, setBranches] = useState([]);
    const [questionnaireSettings, setQuestionnaireSettings] = useState({});
    const [availableAuditTypes, setAvailableAuditTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterBranch, setFilterBranch] = useState('all');
    const [auditToDelete, setAuditToDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Add states for task creation
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [networkContacts, setNetworkContacts] = useState([]);

    const getCustomAuditName = useCallback((type) => {
        return questionnaireSettings[type]?.custom_name || type;
    }, [questionnaireSettings]);

    const loadAudits = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = await User.me();
            setCurrentUser(user);

            // Fetch ALL necessary raw data concurrently (combining original global fetches with outline's initial audit fetch)
            const [allBranchesData, settingsData, allQuestionsData, allAuditsRaw] = await Promise.all([
                Branch.list().catch(() => []),
                QuestionnaireSettings.list().catch(() => []),
                AuditQuestion.list().catch(() => []),
                Audit.list('-audit_date').catch(() => []) // Fetch all audits upfront as per outline's general direction
            ]);

            // Apply safe checks for data
            const safeAllBranches = Array.isArray(allBranchesData) ? allBranchesData : [];
            const safeSettingsData = Array.isArray(settingsData) ? settingsData : [];
            const safeAllQuestions = Array.isArray(allQuestionsData) ? allQuestionsData : [];
            // networkContacts data is intentionally not fetched here as per the fix for crashes.
            // It will remain an empty array.
            const safeAllAuditsRaw = Array.isArray(allAuditsRaw) ? allAuditsRaw : [];

            // Set states that depend on global raw data
            // setNetworkContacts(safeContacts); // Removed as per crash fix outline

            const settingsMap = {};
            safeSettingsData.forEach(setting => {
                settingsMap[setting.questionnaire_type] = setting;
            });
            setQuestionnaireSettings(settingsMap);
            
            // Generate available audit types dynamically based on existing questionnaires and questions
            const typesFromSettings = safeSettingsData.map(s => s.questionnaire_type);
            const typesFromQuestions = safeAllQuestions.map(q => q.audit_type);
            const allTypeKeys = [...new Set([...typesFromSettings, ...typesFromQuestions])].filter(Boolean);

            const dynamicTypes = allTypeKeys.map(type => ({
                key: type,
                name: settingsMap[type]?.custom_name || type
            })).filter(item => item.key && item.name).sort((a, b) => {
                const nameA = a.name || '';
                const nameB = b.name || '';
                return nameA.localeCompare(b.name || '', 'he');
            });
            
            setAvailableAuditTypes(dynamicTypes);

            // Filter audits and branches based on user type (branch_owner logic remains)
            let auditsToProcess = [];
            let branchesToDisplayInDropdown = [];

            if (user.user_type === 'branch_owner') {
                const ownerships = Array.isArray(await BranchOwnership.filter({ user_id: user.id }).catch(() => [])) ? await BranchOwnership.filter({ user_id: user.id }).catch(() => []) : [];
                const ownedBranchIds = ownerships.map(o => o.branch_id);
                auditsToProcess = safeAllAuditsRaw.filter(audit => ownedBranchIds.includes(audit.branch_id));
                branchesToDisplayInDropdown = safeAllBranches.filter(b => ownedBranchIds.includes(b.id));
            } else { // Admin and other users see everything
                auditsToProcess = safeAllAuditsRaw;
                branchesToDisplayInDropdown = safeAllBranches;
            }

            // Create a map for all branches for efficient lookup (used for all audits, including those filtered out)
            const allBranchesMap = new Map(safeAllBranches.map(b => [b.id, b]));

            // Add branch names and custom audit names to the filtered audits for display
            const auditsProcessed = auditsToProcess.map(audit => {
                const branch = allBranchesMap.get(audit.branch_id);
                const branchName = branch?.name || 'סניף נמחק';
                const branchCity = branch?.city || ''; // Keep branchCity from original logic
                const customAuditName = settingsMap[audit.audit_type]?.custom_name || audit.audit_type;

                return {
                    ...audit,
                    branchName,
                    branchCity,
                    customAuditName
                };
            });
            
            setAudits(auditsProcessed);
            setBranches(branchesToDisplayInDropdown); // Set filtered branches for the dropdown

        } catch (err) {
            console.error("Failed to load audits:", err);
            setError("אירעה שגיאת רשת. לא ניתן היה לטעון את רשימת הביקורות. נסה לרענן את הדף.");
            setAudits([]); // Set to empty array on error to prevent crashes and show empty state
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAudits();
    }, [loadAudits]);

    useEffect(() => {
        filterAudits();
    }, [audits, searchTerm, filterType, filterBranch]);

    const handleDeleteAudit = async () => {
        if (auditToDelete) {
            try {
                // First, try to archive the audit
                const archived = await safeDeleteAudit(auditToDelete, auditToDelete.branchName);
                if (!archived) {
                    console.warn('Failed to archive audit, but continuing with deletion');
                }
                
                // Mark related regulation audits as archived
                const originalId = auditToDelete.id;
                const updatePromises = [];

                try {
                    const healthCopies = Array.isArray(await HealthAudit.filter({ original_audit_id: originalId }).catch(() => [])) ? await HealthAudit.filter({ original_audit_id: originalId }).catch(() => []) : [];
                    healthCopies.forEach(copy => updatePromises.push(HealthAudit.update(copy.id, { original_audit_status: 'archived' })));
                    
                    const accessibilityCopies = Array.isArray(await AccessibilityAudit.filter({ original_audit_id: originalId }).catch(() => [])) ? await AccessibilityAudit.filter({ original_audit_id: originalId }).catch(() => []) : [];
                    accessibilityCopies.forEach(copy => updatePromises.push(AccessibilityAudit.update(copy.id, { original_audit_status: 'archived' })));

                    const ministryCopies = Array.isArray(await MinistryAudit.filter({ original_audit_id: originalId }).catch(() => [])) ? await MinistryAudit.filter({ original_audit_id: originalId }).catch(() => []) : [];
                    ministryCopies.forEach(copy => updatePromises.push(MinistryAudit.update(copy.id, { original_audit_status: 'archived' })));
                    
                    const taxCopies = Array.isArray(await TaxAudit.filter({ original_audit_id: originalId }).catch(() => [])) ? await TaxAudit.filter({ original_audit_id: originalId }).catch(() => []) : [];
                    taxCopies.forEach(copy => updatePromises.push(TaxAudit.update(copy.id, { original_audit_status: 'archived' })));

                    await Promise.allSettled(updatePromises);
                } catch (updateError) {
                    console.warn('Failed to update some related audits:', updateError);
                }
                
                // Delete audit responses first - with better error handling
                try {
                    const responses = Array.isArray(await AuditResponse.filter({ audit_id: auditToDelete.id }).catch(() => [])) ? await AuditResponse.filter({ audit_id: auditToDelete.id }).catch(() => []) : [];
                    for (const response of responses) {
                        try {
                            await AuditResponse.delete(response.id);
                        } catch (responseError) {
                            if (responseError.response?.status === 404) {
                                console.warn(`AuditResponse ${response.id} already deleted or not found`);
                            } else {
                                console.warn(`Failed to delete AuditResponse ${response.id}:`, responseError);
                            }
                        }
                    }
                } catch (responseError) {
                    console.warn('Failed to fetch or delete audit responses:', responseError);
                }
                
                // Then delete the audit - with better error handling
                try {
                    await Audit.delete(auditToDelete.id);
                } catch (auditDeleteError) {
                    if (auditDeleteError.response?.status === 404) {
                        console.warn(`Audit ${auditToDelete.id} already deleted or not found`);
                        // Even if the audit is already deleted, we should continue and refresh the data
                    } else {
                        throw auditDeleteError; // Re-throw if it's a different error
                    }
                }
                
                // Reload data
                await loadAudits();
                setAuditToDelete(null);
                alert('הביקורת נמחקה בהצלחה!');
            } catch (err) {
                console.error("Error deleting audit:", err);
                let errorMessage = 'שגיאה לא ידועה';
                
                if (err.response?.status === 404) {
                    errorMessage = 'הביקורת כבר נמחקה או לא נמצאה';
                    // Even if there's a 404, we should refresh the data to sync the UI
                    await loadAudits();
                    setAuditToDelete(null);
                } else if (err.message) {
                    errorMessage = err.message;
                }
                
                alert(`שגיאה במחיקת הביקורת: ${errorMessage}`);
            }
        }
    };

    const filterAudits = () => {
        let currentAudits = Array.isArray(audits) ? audits : []; // Ensure audits is an array
        let filtered = currentAudits;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(audit => 
                (audit.branchName && audit.branchName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (audit.auditor_name && audit.auditor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (audit.branchCity && audit.branchCity.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(audit => audit.audit_type === filterType);
        }

        // Branch filter - applied only if not a branch owner or if filterBranch is specific
        // For branch owners, the 'audits' state is already filtered by loadData based on their owned branches.
        if (currentUser?.user_type !== 'branch_owner' && filterBranch !== 'all') {
            filtered = filtered.filter(audit => audit.branch_id === filterBranch);
        }

        setFilteredAudits(filtered);
    };

    const getAuditTypeColor = (type) => {
        const colors = {
            'גלויה': 'bg-blue-100 text-blue-700',
            'סמויה': 'bg-purple-100 text-purple-700',
            'לקוח סמוי - ביקור בעסק': 'bg-green-100 text-green-700',
            'לקוח סמוי - משלוח': 'bg-orange-100 text-orange-700',
            'לקוח סמוי - איסוף עצמי': 'bg-yellow-100 text-yellow-700',
            'ריאיון עם מנהל סניף': 'bg-pink-100 text-pink-700',
            'ריאיונות עם לקוחות הסניף': 'bg-teal-100 text-teal-700',
            'ריאיונות עם עובדי הסניף': 'bg-cyan-100 text-cyan-700'
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    const getScoreColor = (score) => {
        if (score >= 8) return 'bg-green-100 text-green-800';
        if (score >= 6) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const handleSaveTask = async (taskData) => {
        try {
            await PersonalTask.create({
                ...taskData,
                created_by: currentUser?.email 
            });
            alert('המשימה נוצרה בהצלחה!');
            setIsTaskFormOpen(false);
        } catch (error) {
            console.error("Failed to create task:", error);
            alert('שגיאה ביצירת המשימה.');
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">טוען רשימת ביקורות...</div>
            </div>
        );
    }

    if (error) {
        return (
            <FullPageError
                errorTitle="שגיאה בטעינת הביקורות"
                errorMessage={error}
                onRetry={loadAudits}
            />
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="w-6 h-6" />
                        {currentUser?.user_type === 'branch_owner' ? 'ביקורות הסניפים שבבעלותי' : 'רשימת ביקורות'}
                    </h1>
                    <div className="flex gap-2">
                        {currentUser?.user_type !== 'branch_owner' && (
                            <ExportButton audits={filteredAudits} reportName="דוח ביקורות כלליות" />
                        )}
                        {currentUser?.user_type !== 'branch_owner' && (
                            <Link to={createPageUrl("NewAudit")}>
                                <Button className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    הוסף ביקורת חדשה
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">סינון וחיפוש</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="חיפוש לפי סניף, מבקר או עיר..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="סוג ביקורת" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">כל הסוגים</SelectItem>
                                    {availableAuditTypes.map(type => (
                                        <SelectItem key={type.key} value={type.key}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {currentUser?.user_type !== 'branch_owner' && (
                                <Select value={filterBranch} onValueChange={setFilterBranch}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="סניף" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">כל הסניפים</SelectItem>
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Filter className="w-4 h-4" />
                                {filteredAudits.length} ביקורות
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Audits Table/Cards */}
                <Card>
                    <CardContent className="p-0">
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>תאריך</TableHead>
                                        <TableHead>סניף</TableHead>
                                        <TableHead>סוג ביקורת</TableHead>
                                        <TableHead>מבקר</TableHead>
                                        <TableHead>ציון</TableHead>
                                        <TableHead>פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAudits.map((audit) => (
                                        <TableRow key={audit.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">
                                                            {format(new Date(audit.audit_date), 'dd/MM/yyyy HH:mm')}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {format(new Date(audit.audit_date), 'EEEE', { locale: he })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{audit.branchName}</div>
                                                    {audit.branchCity && (
                                                        <div className="text-sm text-gray-500">{audit.branchCity}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 text-xs rounded-full ${getAuditTypeColor(audit.audit_type)}`}>
                                                    {audit.customAuditName}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                                    {audit.auditor_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Award className="w-4 h-4 text-gray-400" />
                                                    <span className={`px-2 py-1 text-sm font-medium rounded ${getScoreColor(audit.overall_score)}`}>
                                                        {audit.overall_score}/10
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Link to={createPageUrl(`AuditDetails?id=${audit.id}`)} title="צפה בפרטים">
                                                        <Button variant="ghost" size="icon">
                                                            <Eye className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </Link>
                                                    {currentUser?.user_type === 'admin' && (
                                                        <>
                                                            <Link to={createPageUrl(`EditAudit?id=${audit.id}`)} title="ערוך ביקורת">
                                                                <Button variant="ghost" size="icon">
                                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                                </Button>
                                                            </Link>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => setAuditToDelete(audit)}
                                                                title="מחק ביקורת"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-4 space-y-4">
                            {filteredAudits.map((audit) => (
                                <Card key={audit.id} className="border hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            {/* Header */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">{audit.branchName}</h3>
                                                    {audit.branchCity && (
                                                        <p className="text-sm text-gray-500">{audit.branchCity}</p>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-1 text-sm font-medium rounded ${getScoreColor(audit.overall_score)}`}>
                                                    {audit.overall_score}/10
                                                </span>
                                            </div>

                                            {/* Date and Type */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>{format(new Date(audit.audit_date), 'dd/MM/yyyy HH:mm')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                                    <span>{audit.auditor_name}</span>
                                                </div>
                                            </div>

                                            {/* Type Badge */}
                                            <div>
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getAuditTypeColor(audit.audit_type)}`}>
                                                    {audit.customAuditName}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-between items-center pt-2 border-t">
                                                <Link to={createPageUrl(`AuditDetails?id=${audit.id}`)}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4 ml-1" />
                                                        צפה בפרטים
                                                    </Button>
                                                </Link>
                                                
                                                {currentUser?.user_type === 'admin' && (
                                                    <div className="flex gap-1">
                                                        <Link to={createPageUrl(`EditAudit?id=${audit.id}`)}>
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => setAuditToDelete(audit)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        
                        {filteredAudits.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">לא נמצאו ביקורות</p>
                                <p className="text-sm">נסה לשנות את הפילטרים או להוסיף ביקורות חדשות</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog - Only show for admins */}
                {currentUser?.user_type === 'admin' && (
                    <AlertDialog open={!!auditToDelete} onOpenChange={() => setAuditToDelete(null)} dir="rtl">
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>אישור מחיקת ביקורת</AlertDialogTitle>
                                <AlertDialogDescription>
                                    האם אתה בטוח שברצונך למחוק את הביקורת של {auditToDelete?.branchName} מתאריך{' '}
                                    {auditToDelete && format(new Date(auditToDelete.audit_date), 'dd/MM/yyyy')}?
                                    <br />
                                    <strong className="text-red-600">פעולה זו תמחק את כל התשובות והקבצים הקשורים לביקורת ולא ניתן לשחזר אותם!</strong>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleDeleteAudit}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    מחק ביקורת
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            {/* Floating Action Button to create a task */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        onClick={() => setIsTaskFormOpen(true)}
                        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 z-50 flex items-center justify-center"
                        aria-label="הוסף משימה חדשה"
                    >
                        <ListPlus className="h-7 w-7" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-black text-white">
                    <p>הוסף משימה חדשה</p>
                </TooltipContent>
            </Tooltip>

            {/* Task Form Dialog */}
            <TaskForm // Changed component name
                open={isTaskFormOpen}
                onOpenChange={setIsTaskFormOpen}
                task={null}
                branches={branches}
                networkContacts={networkContacts}
                onSave={handleSaveTask} // Added onSave prop
            />
        </TooltipProvider>
    );
}
