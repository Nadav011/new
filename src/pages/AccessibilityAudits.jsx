
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AccessibilityAudit, Branch, User, BranchOwnership } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    PlusCircle,
    Search,
    Eye,
    Edit,
    Trash2,
    FileText,
    RefreshCw,
    AlertCircle,
    Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import RegulationAuditDetailsDialog from '../components/RegulationAuditDetailsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FullPageError from '../components/FullPageError';

export default function AccessibilityAudits() {
    const [audits, setAudits] = useState([]);
    const [filteredAudits, setFilteredAudits] = useState([]);
    const [branches, setBranches] = useState([]); // All branches user can see
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBranch, setFilterBranch] = useState('all');
    const [filterCompliance, setFilterCompliance] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [auditToDelete, setAuditToDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    // const [ownedBranches, setOwnedBranches] = useState([]); // This variable seems redundant based on usage in outline. Keeping it for now but noting.

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        setLoadError(null);
        try {
            const user = await User.me();
            setCurrentUser(user);

            // בדוק אם המשתמש מורשה לראות את הדף
            const isAuthorized = user.user_type === 'admin' ||
                               user.user_type === 'operational_manager' ||
                               user.user_type === 'accessibility_consultant';

            if (!isAuthorized) {
                setLoadError('אין לך הרשאה לצפות בעמוד זה. אישורי נגישות מנוהלים דרך עמוד פרטי הסניף.');
                return;
            }

            let userBranches = [];
            let userAudits = [];

            // אם זה יועץ נגישות, טען רק נתונים רלוונטיים
            if (user.user_type === 'accessibility_consultant') {
                // יועץ נגישות רואה רק ביקורות שהוא ביצע
                const allAudits = await AccessibilityAudit.list();
                userAudits = allAudits.filter(audit => audit.auditor_name === user.full_name);

                // קבל את הסניפים הרלוונטיים
                const branchIds = [...new Set(userAudits.map(audit => audit.branch_id))];
                const allBranches = await Branch.list();
                userBranches = allBranches.filter(branch => branchIds.includes(branch.id));
            } else {
                // אדמין או מנהל תפעול רואה הכל
                userAudits = await AccessibilityAudit.list();
                userBranches = await Branch.list();
            }

            setAudits(userAudits);
            setBranches(userBranches);
            // setOwnedBranches(userBranches); // Redundant based on outline usage for ownedBranches

        } catch (error) {
            console.error("Failed to load accessibility audits:", error);
            setLoadError("אירעה שגיאה בטעינת נתוני אישורי הנגישות.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        let filtered = audits;

        if (searchTerm) {
            const branchMap = {};
            branches.forEach(b => branchMap[b.id] = b.name);

            filtered = filtered.filter(audit => {
                const branchName = branchMap[audit.branch_id] || '';
                return branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (audit.auditor_name && audit.auditor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       (audit.findings && audit.findings.toLowerCase().includes(searchTerm.toLowerCase()));
            });
        }

        if (filterBranch !== 'all') {
            filtered = filtered.filter(audit => audit.branch_id === filterBranch);
        }

        if (filterCompliance !== 'all') {
            filtered = filtered.filter(audit => audit.compliance_level === filterCompliance);
        }

        setFilteredAudits(filtered);
    }, [audits, branches, searchTerm, filterBranch, filterCompliance]);

    const handleDelete = async () => {
        if (!auditToDelete) return;
        try {
            await AccessibilityAudit.delete(auditToDelete.id);
            await loadData();
            setAuditToDelete(null);
        } catch (error) {
            console.error("Failed to delete audit:", error);
            alert("שגיאה במחיקת הביקורת");
        }
    };

    const complianceBadge = (level) => {
        const levels = {
            'full': { text: 'עומד בתקנות', color: 'bg-green-100 text-green-800' },
            'partial': { text: 'עומד חלקית', color: 'bg-yellow-100 text-yellow-800' },
            'non_compliant': { text: 'לא עומד בתקנות', color: 'bg-red-100 text-red-800' },
            'not_calculated': { text: 'לא מחושב', color: 'bg-gray-100 text-gray-800' }
        };
        const { text, color } = levels[level] || { text: level, color: 'bg-gray-100 text-gray-800' };
        return <Badge className={color}>{text}</Badge>;
    };

    if (loadError) {
        return (
            <FullPageError
                errorTitle="גישה מוגבלת"
                errorMessage={loadError}
                onRetry={loadData}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-green-600 mr-3" />
                <span>טוען נתוני אישורי נגישות...</span>
            </div>
        );
    }

    const canCreate = currentUser?.user_type === 'admin' ||
                     currentUser?.user_type === 'operational_manager' ||
                     currentUser?.user_type === 'accessibility_consultant';

    const canEdit = currentUser?.user_type === 'admin' ||
                   currentUser?.user_type === 'operational_manager';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-7 h-7" />
                    ניהול אישורי נגישות
                </h1>
                {canCreate && (
                    <Button asChild className="bg-green-600 hover:bg-green-700">
                        <Link to={createPageUrl("AccessibilityAuditForm")}>
                            <PlusCircle className="ml-2 h-4 w-4" />
                            הוספת ביקורת נגישות
                        </Link>
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        ביקורות נגישות
                        <span className="mr-2 text-lg font-mono bg-gray-200 text-gray-700 rounded-full px-2.5 py-1">
                            {audits.length}
                        </span>
                    </CardTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="חיפוש לפי סניף או מבקר..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Select value={filterBranch} onValueChange={setFilterBranch}>
                            <SelectTrigger>
                                <SelectValue placeholder="בחר סניף" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">כל הסניפים</SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterCompliance} onValueChange={setFilterCompliance}>
                            <SelectTrigger>
                                <SelectValue placeholder="רמת עמידה" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">כל הרמות</SelectItem>
                                <SelectItem value="full">עומד בתקנות</SelectItem>
                                <SelectItem value="partial">עומד חלקית</SelectItem>
                                <SelectItem value="non_compliant">לא עומד בתקנות</SelectItem>
                                <SelectItem value="not_calculated">לא מחושב</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredAudits.length > 0 ? (
                        <div className="hidden md:block rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>סניף</TableHead>
                                        <TableHead>תאריך ביקורת</TableHead>
                                        <TableHead>מבקר</TableHead>
                                        <TableHead>מקור</TableHead>
                                        <TableHead>רמת עמידה</TableHead>
                                        <TableHead className="text-right">פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAudits.map((audit) => {
                                        const branch = branches.find(b => b.id === audit.branch_id);
                                        return (
                                            <TableRow key={audit.id}>
                                                <TableCell className="font-medium">
                                                    {branch ? branch.name : 'סניף לא נמצא'}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(audit.audit_date), 'dd/MM/yyyy', { locale: he })}
                                                </TableCell>
                                                <TableCell>{audit.auditor_name || 'לא צוין'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {audit.source === 'internal_audit' ? 'ביקורת פנימית' : 'דוח חיצוני'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {complianceBadge(audit.compliance_level)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setSelectedAudit(audit)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {audit.document_url && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                asChild
                                                            >
                                                                <a href={audit.document_url} target="_blank" rel="noopener noreferrer">
                                                                    <FileText className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        )}
                                                        {canEdit && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setAuditToDelete(audit)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">לא נמצאו ביקורות נגישות</p>
                            <p className="text-sm">נסה לשנות את מילות החיפוש או הסינונים</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedAudit && (
                <RegulationAuditDetailsDialog
                    open={!!selectedAudit}
                    onOpenChange={() => setSelectedAudit(null)}
                    audit={selectedAudit}
                    auditType="accessibility"
                />
            )}

            {canEdit && (
                <AlertDialog open={!!auditToDelete} onOpenChange={() => setAuditToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                            <AlertDialogDescription>
                                האם אתה בטוח שברצונך למחוק את ביקורת הנגישות הזו? פעולה זו אינה ניתנת לביטול.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                מחק
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}
