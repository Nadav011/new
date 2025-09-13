
import React, { useState, useEffect, useMemo } from 'react';
import { CustomerComplaint, Branch, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { RefreshCw, ExternalLink, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FullPageError from '../components/FullPageError';
import InitiatedAuditForm from '../components/InitiatedAuditForm';
import { safeDeleteCustomerComplaint } from '../components/SafeDeleteHelper';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InitiatedAudits() {
    const [audits, setAudits] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAudit, setEditingAudit] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [auditToDelete, setAuditToDelete] = useState(null);
    const navigate = useNavigate();

    const branchMap = useMemo(() => {
        return branches.reduce((acc, branch) => {
            acc[branch.id] = branch.name;
            return acc;
        }, {});
    }, [branches]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [auditsData, branchesData, userData] = await Promise.all([
                CustomerComplaint.list('-created_date'),
                Branch.list(),
                User.me()
            ]);
            setAudits(Array.isArray(auditsData) ? auditsData : []);
            setBranches(Array.isArray(branchesData) ? branchesData : []);
            setCurrentUser(userData);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const { openAudits, closedAudits } = useMemo(() => {
        const open = audits.filter(a => a.status === 'פתוחה' || a.status === 'בטיפול');
        const closed = audits.filter(a => a.status === 'סגורה');
        return { openAudits: open, closedAudits: closed };
    }, [audits]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'פתוחה':
                return <Badge variant="destructive">פתוחה</Badge>;
            case 'בטיפול':
                return <Badge className="bg-yellow-500 text-white">בטיפול</Badge>;
            case 'סגורה':
                return <Badge className="bg-green-500 text-white">סגורה</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleEdit = (audit) => {
        setEditingAudit(audit);
        setIsFormOpen(true);
    };

    const handleDelete = (audit) => {
        setAuditToDelete(audit);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!auditToDelete) return;
        
        try {
            await safeDeleteCustomerComplaint(auditToDelete);
            setAudits(prev => prev.filter(a => a.id !== auditToDelete.id));
            setDeleteDialogOpen(false);
            setAuditToDelete(null);
            alert('הביקורת נמחקה בהצלחה ונשלחה לארכיון.');
        } catch (error) {
            console.error('Error deleting audit:', error);
            alert('שגיאה במחיקת הביקורת.');
        }
    };

    const handleFormSave = async (auditData) => {
        try {
            if (editingAudit) {
                // Update existing audit
                const updatedAudit = await CustomerComplaint.update(editingAudit.id, auditData);
                setAudits(prev => prev.map(a => a.id === editingAudit.id ? updatedAudit : a));
            } else {
                // Create new audit
                const newAudit = await CustomerComplaint.create(auditData);
                setAudits(prev => [newAudit, ...prev]);
            }
            setIsFormOpen(false);
            setEditingAudit(null);
        } catch (error) {
            console.error('Error saving audit:', error);
            throw error; // Let the form handle the error display
        }
    };

    const isAdminLevel = currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager';

    const AuditList = ({ list }) => (
        <div className="space-y-4">
            {list.length > 0 ? (
                list.map(audit => (
                    <Card 
                        key={audit.id} 
                        className="hover:shadow-md transition-shadow"
                    >
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div 
                                    className="flex-1 space-y-1 cursor-pointer"
                                    onClick={() => navigate(createPageUrl(`RespondToInitiatedAudit?id=${audit.id}`))}
                                >
                                    <p className="font-semibold text-lg">{branchMap[audit.branch_id] || 'סניף לא ידוע'}</p>
                                    <p className="text-sm text-gray-600">
                                        לקוח: {audit.customer_name} | טלפון: {audit.customer_phone}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        תאריך פתיחה: {format(new Date(audit.complaint_date), 'd MMMM yyyy, HH:mm', { locale: he })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(audit.status)}
                                    {isAdminLevel && (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(audit);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                title="ערוך ביקורת"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(audit);
                                                }}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                title="מחק ביקורת"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <ExternalLink className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <p>אין ביקורות להצגה בקטגוריה זו.</p>
                </div>
            )}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-600" />
            </div>
        );
    }

    if (error) {
        return <FullPageError onRetry={fetchData} />;
    }

    return (
        <div dir="rtl" className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">ביקורות יזומות (משוב לקוח)</h1>
                    <p className="text-gray-500">ניהול ומעקב אחר משובי לקוחות וביקורות יזומות.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="ml-2 h-4 w-4" />
                        רענן
                    </Button>
                    <Button onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        הוסף ביקורת חדשה
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="open" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="open">
                        פתוחות ובטיפול ({openAudits.length})
                    </TabsTrigger>
                    <TabsTrigger value="closed">
                        סגורות ({closedAudits.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="open">
                    <Card>
                        <CardHeader>
                            <CardTitle>ביקורות פתוחות או בטיפול</CardTitle>
                            <CardDescription>אלו הביקורות הדורשות התייחסות מהסניף או מהרשת.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AuditList list={openAudits} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="closed">
                    <Card>
                        <CardHeader>
                            <CardTitle>ביקורות שנסגרו</CardTitle>
                            <CardDescription>היסטוריית ביקורות שטופלו ונסגרו.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AuditList list={closedAudits} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit/Create Form Dialog */}
            <InitiatedAuditForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                auditToEdit={editingAudit}
                branches={branches}
                currentUser={currentUser}
                onSave={handleFormSave}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את הביקורת של {auditToDelete?.customer_name}?
                            הביקורת תישלח לארכיון ולא תהיה ניתנת לשחזור.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            מחק
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
