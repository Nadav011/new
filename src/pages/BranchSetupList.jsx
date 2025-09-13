
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BranchSetup, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Eye, RefreshCw, Building, HardHat, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { safeDeleteBranchSetup } from '../components/SafeDeleteHelper';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BranchSetupNotesDialog from '../components/BranchSetupNotesDialog';

export default function BranchSetupList() {
    const navigate = useNavigate();
    const [setups, setSetups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [setupToDelete, setSetupToDelete] = useState(null);
    const [notesSetup, setNotesSetup] = useState(null);
    const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            let setupData = [];
            if (user.user_type === 'admin' || user.user_type === 'user') {
                setupData = await BranchSetup.list('-created_date');
            } else {
                // For branch_owner or setup_branch_owner, filter by their email
                setupData = await BranchSetup.filter({ franchisee_email: user.email }, '-created_date');
            }
            setSetups(setupData);
        } catch (error) {
            console.error("Failed to load branch setups:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (setupToDelete) {
            try {
                const archived = await safeDeleteBranchSetup(setupToDelete);
                if(archived) {
                    await BranchSetup.delete(setupToDelete.id);
                    setSetupToDelete(null);
                    await loadData();
                    alert('ההקמה הועברה לארכיון');
                } else {
                    alert('שגיאה בהעברה לארכיון');
                }
            } catch (error) {
                console.error('Failed to delete setup:', error);
                alert('שגיאה במחיקת ההקמה');
            }
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            'בתהליך': 'bg-blue-100 text-blue-800',
            'הושלם': 'bg-green-100 text-green-800',
            'הוקפא': 'bg-yellow-100 text-yellow-800',
            'בוטל': 'bg-red-100 text-red-800',
        };
        return <Badge className={`${variants[status] || 'bg-gray-100 text-gray-800'} hover:bg-opacity-80`}>{status}</Badge>;
    };

    const handleOpenNotes = (setup) => {
        setNotesSetup(setup);
        setIsNotesDialogOpen(true);
    };

    const handleNotesUpdate = async () => {
        setIsNotesDialogOpen(false);
        setNotesSetup(null);
        await loadData(); // רענון הנתונים
    };

    const isAdmin = currentUser?.user_type === 'admin';

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <HardHat className="w-7 h-7" />
                    {isAdmin ? "ניהול הקמות סניפים" : "הקמות בתהליך"}
                </h1>
                {isAdmin && (
                    <Button onClick={() => navigate(createPageUrl('NewBranchSetup'))} className="bg-green-600 hover:bg-green-700">
                        <PlusCircle className="ml-2 h-4 w-4" />
                        הוסף הקמה חדשה
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>רשימת הקמות ({setups.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם הסניף</TableHead>
                                <TableHead>שם הזכיין</TableHead>
                                <TableHead>תאריך התחלה</TableHead>
                                <TableHead>סטטוס</TableHead>
                                <TableHead className="text-right">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {setups.length > 0 ? setups.map(setup => (
                                <TableRow key={setup.id}>
                                    <TableCell className="font-medium">{setup.branch_name}</TableCell>
                                    <TableCell>{setup.franchisee_name}</TableCell>
                                    <TableCell>{setup.start_date ? format(new Date(setup.start_date), 'dd/MM/yyyy', { locale: he }) : 'לא צוין'}</TableCell>
                                    <TableCell>{getStatusBadge(setup.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="ghost" size="icon" title="צפה בפרטים" onClick={() => navigate(createPageUrl('BranchSetupDetails', { id: setup.id }))}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" title="הערות" onClick={() => handleOpenNotes(setup)}>
                                                <FileText className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            {isAdmin && (
                                                <>
                                                <Button variant="ghost" size="icon" title="ערוך" onClick={() => navigate(createPageUrl('EditBranchSetup', { id: setup.id }))}>
                                                    <Edit className="w-4 h-4 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="מחק" onClick={() => setSetupToDelete(setup)}>
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan="5" className="text-center h-24">
                                        {isAdmin ? "לא נמצאו הקמות סניפים." : "לא נמצאו הקמות המשויכות אליך."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={!!setupToDelete} onOpenChange={() => setSetupToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את ההקמה של "{setupToDelete?.branch_name}"? הפעולה תעביר את ההקמה לארכיון.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            העבר לארכיון
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BranchSetupNotesDialog
                open={isNotesDialogOpen}
                onOpenChange={setIsNotesDialogOpen}
                setup={notesSetup}
                onSave={handleNotesUpdate}
            />
        </div>
    );
}
