
import React, { useState, useEffect, useMemo } from 'react';
import { NetworkContact } from '@/api/entities';
import { User as CurrentUserEntity } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, User, UserCheck, Briefcase } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import NetworkContactForm from '../components/NetworkContactForm';

const roleMap = {
    network_employee: { text: "עובד רשת", icon: <UserCheck className="h-4 w-4 text-blue-500" /> },
    external_supplier: { text: "ספק חיצוני", icon: <Briefcase className="h-4 w-4 text-green-500" /> },
};

export default function NetworkContacts() {
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [contactToDelete, setContactToDelete] = useState(null);
    const [isBranchOwner, setIsBranchOwner] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            try {
                const [user, data] = await Promise.all([
                    CurrentUserEntity.me(),
                    NetworkContact.list('-created_date')
                ]);

                if (user.user_type === 'branch_owner' || user.user_type === 'setup_branch_owner') {
                    setIsBranchOwner(true);
                }

                setContacts(data);
            } catch (error) {
                console.error("Failed to load initial data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, []);

    const loadContacts = async () => {
        setIsLoading(true);
        try {
            const data = await NetworkContact.list('-created_date');
            setContacts(data);
        } catch (error) {
            console.error("Failed to load contacts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (contact = null) => {
        setSelectedContact(contact);
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        await loadContacts();
        setIsFormOpen(false);
        setSelectedContact(null);
    };

    const handleDelete = async () => {
        if (contactToDelete) {
            try {
                await NetworkContact.delete(contactToDelete.id);
                setContactToDelete(null);
                await loadContacts();
            } catch (error) {
                console.error("Failed to delete contact:", error);
                alert("שגיאה במחיקת איש הקשר.");
            }
        }
    };

    const sortedContacts = useMemo(() => {
        return [...contacts].sort((a, b) => {
            const nameA = `${a.first_name} ${a.last_name}`;
            const nameB = `${b.first_name} ${b.last_name}`;
            return nameA.localeCompare(nameB, 'he');
        });
    }, [contacts]);

    if (isLoading) {
        return <div>טוען אנשי קשר...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <User className="w-7 h-7" />
                    ניהול אנשי קשר ברשת
                </h1>
                {!isBranchOwner && (
                    <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700">
                        <PlusCircle className="ml-2 h-4 w-4" />
                        הוסף איש קשר
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>רשימת אנשי קשר</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם מלא</TableHead>
                                <TableHead>תפקיד</TableHead>
                                <TableHead>סיווג</TableHead>
                                <TableHead>טלפון</TableHead>
                                <TableHead className="text-right">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedContacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">{`${contact.first_name} ${contact.last_name}`}</TableCell>
                                    <TableCell>{contact.role_title}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {roleMap[contact.role_type]?.icon}
                                            <span>{roleMap[contact.role_type]?.text || contact.role_type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{contact.phone}</TableCell>
                                    <TableCell className="text-right">
                                        {!isBranchOwner && (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenForm(contact)} title="ערוך">
                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setContactToDelete(contact)} title="מחק">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {sortedContacts.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            לא נמצאו אנשי קשר.
                        </div>
                    )}
                </CardContent>
            </Card>

            {!isBranchOwner && (
                <>
                    <NetworkContactForm
                        open={isFormOpen}
                        onOpenChange={setIsFormOpen}
                        contact={selectedContact}
                        onSave={handleSave}
                    />

                    <AlertDialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)} dir="rtl">
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                                <AlertDialogDescription>
                                    האם אתה בטוח שברצונך למחוק את איש הקשר "{contactToDelete?.first_name} {contactToDelete?.last_name}"?
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
                </>
            )}
        </div>
    );
}
