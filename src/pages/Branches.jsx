
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Branch, User, BranchOwnership } from '@/api/entities'; // Modified import to include BranchOwnership and use '@/api/entities'
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Eye, Image as ImageIcon, Search, AlertCircle, RefreshCw, Store, ClipboardCopy } from 'lucide-react';
import { Input } from "@/components/ui/input";
import BranchForm from '../components/BranchForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { iconMap } from '../components/IconMap';
import { safeDeleteBranch } from '../components/SafeDeleteHelper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FullPageError from '../components/FullPageError'; // Import FullPageError

export default function Branches() {
    const [branches, setBranches] = useState([]);
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchToDelete, setBranchToDelete] = useState(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [newBranchCount, setNewBranchCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchUserAndBranches();
    }, []);

    const fetchUserAndBranches = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const user = await User.me();
            setCurrentUser(user);

            let data = [];
            // Handle branch_owner first, as it's the specific case.
            // Everyone else (admin, user) gets the default full list.
            if (user.user_type === 'branch_owner' || user.user_type === 'setup_branch_owner') {
                const ownerships = await BranchOwnership.filter({ user_id: user.id });
                if (ownerships.length > 0) {
                    const branchIds = ownerships.map(o => o.branch_id);
                    const branches = await Promise.all(branchIds.map(id => Branch.get(id).catch(e => {
                        console.warn(`Failed to load branch with ID ${id}:`, e);
                        return null;
                    })));
                    data = branches.filter(Boolean);
                }
            } else { // Admin, user, or any other role should see all branches.
                data = await Branch.list();
            }

            const sortedData = sortBranchesByCity(data);
            setBranches(sortedData);
        } catch (error) {
            console.error("Failed to load data:", error);
            setLoadError("אירעה שגיאת רשת. לא ניתן היה לטעון את רשימת הסניפים. נסה לרענן את הדף.");
        } finally {
            setIsLoading(false);
        }
    };

    const sortBranchesByCity = (branchesToSort) => {
        const cityCount = {};
        branchesToSort.forEach(branch => {
            const city = branch.city || 'לא מוגדר';
            cityCount[city] = (cityCount[city] || 0) + 1;
        });
        return [...branchesToSort].sort((a, b) => {
            const cityA = a.city || 'לא מוגדר';
            const cityB = b.city || 'לא מוגדר';
            const countA = cityCount[cityA];
            const countB = cityCount[cityB];
            if (countA !== countB) return countB - countA;
            const cityComparison = cityA.localeCompare(cityB, 'he');
            if (cityComparison !== 0) return cityComparison;
            return (a.name || '').localeCompare(b.name || '', 'he');
        });
    };

    useEffect(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        let filtered = branches.filter(branch =>
            (branch.name && branch.name.toLowerCase().includes(lowercasedTerm)) ||
            (branch.city && branch.city.toLowerCase().includes(lowercasedTerm)) ||
            (branch.address && branch.address.toLowerCase().includes(lowercasedTerm))
        );
        filtered = sortBranchesByCity(filtered);
        setFilteredBranches(filtered);
    }, [searchTerm, branches]);

    const loadBranches = async () => {
        await fetchUserAndBranches();
    };

    const handleOpenForm = (branch = null) => {
        // If current user is a branch owner and they have branches, pre-select the first one if not editing a specific branch
        // This ensures branch owners always edit their own branch(es) and don't create new ones via this button.
        if (currentUser?.user_type === 'branch_owner' && branches.length > 0 && !branch) {
            setSelectedBranch(branches[0]);
        } else {
            setSelectedBranch(branch);
        }
        setIsFormOpen(true);
    };

    const handleSaveBranch = async (formData) => {
        try {
            if (selectedBranch) {
                await Branch.update(selectedBranch.id, formData);
            } else {
                await Branch.create(formData);
                setNewBranchCount(branches.length + 1);
                setShowSuccessDialog(true);
            }
            sessionStorage.removeItem('cachedBranches');
            window.dispatchEvent(new CustomEvent('branchesChanged'));
            await loadBranches();
            setIsFormOpen(false);
            setSelectedBranch(null);
        } catch (error) {
            console.error("Failed to save branch:", error);
            alert("שגיאה בשמירת הסניף. אנא נסה שוב.");
        }
    };

    const handleDeleteBranch = async () => {
        if (branchToDelete) {
            try {
                const archived = await safeDeleteBranch(branchToDelete);
                if (archived) {
                    await Branch.delete(branchToDelete.id);
                    sessionStorage.removeItem('cachedBranches');
                    window.dispatchEvent(new CustomEvent('branchesChanged'));
                    await loadBranches();
                    setBranchToDelete(null);
                    alert('הסניף הועבר לארכיון.');
                } else {
                    alert('שגיאה בהעברה לארכיון.');
                }
            } catch (error) {
                console.error("Failed to delete branch:", error);
                alert("שגיאה במחיקת הסניף.");
            }
        }
    };

    const StatusBadge = ({ status }) => {
        const statusMap = {
            active: { text: 'פעיל', color: 'bg-green-100 text-green-800' },
            inactive: { text: 'לא פעיל', color: 'bg-red-100 text-red-800' },
            renovating: { text: 'בשיפוצים', color: 'bg-yellow-100 text-yellow-800' }
        };
        const { text, color } = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>;
    };

    const AccessibilityBadge = ({ hasApproval }) => {
        const text = hasApproval ? 'נגיש' : 'לא נגיש';
        const color = hasApproval ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>;
    };

    const BranchIcon = ({ branch }) => {
        if (branch.custom_icon_url) {
            return <img src={branch.custom_icon_url} alt={branch.name} className="w-5 h-5 rounded-md object-cover" />;
        }
        const SelectedIcon = iconMap[branch.icon_name];
        if (SelectedIcon) {
            return <SelectedIcon className="w-5 h-5 text-green-600" />;
        }
        return <ImageIcon className="w-5 h-5 text-gray-400" />;
    };

    if (loadError) {
        return (
             <FullPageError
                errorTitle="שגיאה בטעינת הסניפים"
                errorMessage={loadError}
                onRetry={loadBranches}
            />
        );
    }

    if (isLoading) {
        return <div>טוען נתונים...</div>;
    }

    const isBranchOwner = currentUser?.user_type === 'branch_owner' || currentUser?.user_type === 'setup_branch_owner';
    const isAdminOrUser = currentUser?.user_type === 'admin' || currentUser?.user_type === 'user'; // Or maybe just 'admin'? Outline implies 'admin' and 'user' both see all.

    // Calculate active branches count
    const activeBranchesCount = branches.filter(branch => branch.status === 'active').length;

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Store className="w-7 h-7" />
                        {isBranchOwner ? 'הסניפים שלי' : 'רשימת סניפים'}
                    </h1>
                    <div className="flex flex-col sm:flex-row gap-2">
                        {isAdminOrUser && (
                            <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700">
                                <PlusCircle className="ml-2 h-4 w-4" />
                                הוספת סניף חדש
                            </Button>
                        )}
                        {isBranchOwner && branches.length > 0 && (
                            <Button onClick={() => handleOpenForm(branches[0])} className="bg-blue-600 hover:bg-blue-700">
                                <Edit className="ml-2 h-4 w-4" />
                                ערוך פרטי הסניף
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex flex-wrap items-center gap-2">
                            {isBranchOwner ? 'פרטי הסניפים שלי' : 'סניפים רשומים'}
                            <span className="text-lg font-mono bg-gray-200 text-gray-700 rounded-full px-2.5 py-1">
                                {branches.length}
                            </span>
                            {!isBranchOwner && (
                                <>
                                    <span className="hidden md:inline">|</span>
                                    <span className="text-base">סניפים פעילים</span>
                                    <span className="text-lg font-mono bg-green-100 text-green-700 rounded-full px-2.5 py-1">
                                        {activeBranchesCount}
                                    </span>
                                </>
                            )}
                        </CardTitle>
                        {!isBranchOwner && (
                            <div className="mt-4 relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="חיפוש לפי שם סניף, עיר או כתובת..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {/* Desktop Table View */}
                        <div className="hidden md:block rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[350px]">סניף</TableHead>
                                        <TableHead>עיר</TableHead>
                                        <TableHead>סטטוס</TableHead>
                                        <TableHead>כשרות</TableHead>
                                        <TableHead>נגישות</TableHead>
                                        <TableHead className="text-right">פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBranches.map((branch) => (
                                        <TableRow key={branch.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <BranchIcon branch={branch} />
                                                        <div>
                                                            <Link
                                                                to={`${createPageUrl('BranchDetails')}?id=${branch.id}`}
                                                                className="font-semibold text-gray-800 hover:text-green-600 hover:underline cursor-pointer"
                                                            >
                                                                {branch.name}
                                                            </Link>
                                                            <Link
                                                                to={`${createPageUrl('BranchDetails')}?id=${branch.id}`}
                                                                className="block text-sm text-gray-500 hover:text-green-600 cursor-pointer"
                                                            >
                                                                {branch.address}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(branch.id);
                                                                    alert('מזהה הסניף הועתק!');
                                                                }}
                                                            >
                                                                <ClipboardCopy className="h-4 w-4 text-gray-500" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>העתק מזהה: {branch.id}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    to={`${createPageUrl('BranchDetails')}?id=${branch.id}`}
                                                    className="hover:text-green-600 cursor-pointer"
                                                >
                                                    {branch.city}
                                                </Link>
                                            </TableCell>
                                            <TableCell><StatusBadge status={branch.status} /></TableCell>
                                            <TableCell><Badge variant="outline">{branch.kosher_type || 'לא מוגדר'}</Badge></TableCell>
                                            <TableCell><AccessibilityBadge hasApproval={branch.has_accessibility_approval} /></TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link to={`${createPageUrl('BranchDetails')}?id=${branch.id}`} title="צפה בפרטים">
                                                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4 text-gray-500" /></Button>
                                                    </Link>
                                                    {(isAdminOrUser || (isBranchOwner && branches.some(b => b.id === branch.id))) && (
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(branch)} title="ערוך סניף">
                                                            <Edit className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                    )}
                                                    {isAdminOrUser && (
                                                        <Button variant="ghost" size="icon" onClick={() => setBranchToDelete(branch)} title="מחק סניף">
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {filteredBranches.map((branch) => (
                                <Card key={branch.id} className="border hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <BranchIcon branch={branch} />
                                                <div className="flex-1 min-w-0">
                                                    <Link
                                                        to={`${createPageUrl('BranchDetails')}?id=${branch.id}`}
                                                        className="font-semibold text-gray-800 hover:text-green-600 block truncate"
                                                    >
                                                        {branch.name}
                                                    </Link>
                                                    <p className="text-sm text-gray-500 truncate">{branch.address}</p>
                                                    <p className="text-sm text-gray-600">{branch.city}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <StatusBadge status={branch.status} />
                                            <Badge variant="outline">{branch.kosher_type || 'לא מוגדר'}</Badge>
                                            <AccessibilityBadge hasApproval={branch.has_accessibility_approval} />
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1">
                                                <Link to={`${createPageUrl('BranchDetails')}?id=${branch.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4 ml-1" />
                                                        צפייה
                                                    </Button>
                                                </Link>
                                                {(isAdminOrUser || (isBranchOwner && branches.some(b => b.id === branch.id))) && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenForm(branch)}>
                                                        <Edit className="h-4 w-4 ml-1" />
                                                        עריכה
                                                    </Button>
                                                )}
                                            </div>

                                            {isAdminOrUser && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setBranchToDelete(branch)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {filteredBranches.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <Store className="w-12 h-12 mx-auto mb-4
                                 text-gray-300" />
                                <p className="text-lg font-medium mb-2">לא נמצאו סניפים</p>
                                <p className="text-sm">נסה לשנות את מילות החיפוש או להוסיף סניפים חדשים</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <BranchForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    branch={selectedBranch}
                    onSave={handleSaveBranch}
                />

                {isAdminOrUser && ( // Only Admins can delete
                    <AlertDialog open={!!branchToDelete} onOpenChange={() => setBranchToDelete(null)} dir="rtl">
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                                <AlertDialogDescription>
                                    האם אתה בטוח שברצונך למחוק את סניף "{branchToDelete?.name}"? הפעולה תעביר את הסניף לארכיון.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteBranch} className="bg-red-600 hover:bg-red-700">
                                    העבר לארכיון
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {isAdminOrUser && ( // Only Admins see new branch success dialog
                    <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} dir="rtl">
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">🎉 מזל טוב! 🎉</AlertDialogTitle>
                                <AlertDialogDescription className="text-base pt-2">
                                    הסניף החדש נוסף בהצלחה.
                                    <br />
                                    זהו הסניף ה-<strong>{newBranchCount}</strong> שלכם ברשת!
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>אישור</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </TooltipProvider>
    );
}
