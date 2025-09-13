
import React, { useState, useEffect, useMemo } from 'react';
import { FranchiseInquiry } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Briefcase, PlusCircle, Edit, Trash2, Search, Filter, RefreshCw, Phone, Mail, Calendar, Eye, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import FranchiseInquiryForm from '../components/FranchiseInquiryForm';
import WhatsAppConfirmDialog from '../components/WhatsAppConfirmDialog';
import { PersonalTask } from '@/api/entities';
import { User } from '@/api/entities';

export default function FranchiseInquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [inquiryToDelete, setInquiryToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // New states for WhatsApp workflow
    const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
    const [inquiryForWhatsapp, setInquiryForWhatsapp] = useState(null);

    const statusOptions = ["פנייה חדשה", "בטיפול", "שיחה ראשונית", "פגישה נקבעה", "מתעניין רציני", "מועמד להקמה", "נסגר בהצלחה", "לא רלוונטי"];

    const loadInquiries = async () => {
        setIsLoading(true);
        try {
            const data = await FranchiseInquiry.list('-created_date');
            setInquiries(data);
        } catch (error) {
            console.error("Failed to load inquiries:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInquiries();
    }, []);

    const handleOpenForm = (inquiry = null) => {
        setSelectedInquiry(inquiry);
        setIsFormOpen(true);
    };

    const handleSaveInquiry = async (formData) => {
        try {
            if (selectedInquiry) {
                await FranchiseInquiry.update(selectedInquiry.id, formData);
            } else {
                await FranchiseInquiry.create(formData);
            }
            await loadInquiries();
            setIsFormOpen(false);
            setSelectedInquiry(null);
        } catch (error) {
            console.error("Failed to save inquiry:", error);
            alert("שגיאה בשמירת הפנייה.");
        }
    };
    
    const handleDeleteInquiry = async () => {
        if (!inquiryToDelete) return;
        try {
            await FranchiseInquiry.delete(inquiryToDelete.id);
            await loadInquiries();
            setInquiryToDelete(null);
        } catch (error) {
            console.error("Failed to delete inquiry:", error);
            alert("שגיאה במחיקת הפנייה.");
        }
    };

    // New function to handle WhatsApp workflow
    const handleWhatsAppWorkflow = (inquiry) => {
        setInquiryForWhatsapp(inquiry);
        setWhatsappDialogOpen(true);
    };

    const handleWhatsAppConfirm = async () => {
        if (!inquiryForWhatsapp) return;
        
        try {
            // Fetch current user details if needed for task creation logic (not used directly here, but good practice)
            // const currentUser = await User.me(); 
            
            // 1. Create a personal task for scheduling meeting
            const taskText = `לקבוע פגישה עם ${inquiryForWhatsapp.full_name}`;
            await PersonalTask.create({
                text: taskText,
                priority: 'high',
                status: 'pending',
                related_inquiry_id: inquiryForWhatsapp.id,
                meeting_date: null
            });

            // 2. Update inquiry status to "פגישה נקבעה"
            await FranchiseInquiry.update(inquiryForWhatsapp.id, {
                status: 'פגישה נקבעה'
            });

            // 3. Refresh the list
            await loadInquiries();
            
            // 4. Close dialog and show success
            setWhatsappDialogOpen(false);
            setInquiryForWhatsapp(null);
            
            alert(`נוצרה משימה חדשה: "${taskText}"\nסטטוס הפנייה עודכן ל"פגישה נקבעה"`);
            
        } catch (error) {
            console.error("Failed to process WhatsApp workflow:", error);
            alert('שגיאה ביצירת המשימה או עדכון סטטוס. נסה שוב.');
        }
    };

    const filteredInquiries = useMemo(() => {
        return inquiries.filter(inquiry => {
            const searchMatch = searchTerm === '' ||
                inquiry.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inquiry.phone?.includes(searchTerm) ||
                inquiry.city?.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' || inquiry.status === statusFilter;
            return searchMatch && statusMatch;
        });
    }, [inquiries, searchTerm, statusFilter]);

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'פנייה חדשה': return 'bg-blue-100 text-blue-800';
            case 'בטיפול': return 'bg-yellow-100 text-yellow-800';
            case 'שיחה ראשונית': return 'bg-indigo-100 text-indigo-800';
            case 'פגישה נקבעה': return 'bg-purple-100 text-purple-800';
            case 'מתעניין רציני': return 'bg-pink-100 text-pink-800';
            case 'מועמד להקמה': return 'bg-orange-100 text-orange-800'; // New status color
            case 'נסגר בהצלחה': return 'bg-green-100 text-green-800';
            case 'לא רלוונטי': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-200 text-gray-900';
        }
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><RefreshCw className="w-8 h-8 animate-spin" /> טוען נתונים...</div>;
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Briefcase className="w-7 h-7" />
                        ניהול מתעניינים בזכיינות
                    </h1>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        הוסף מתעניין חדש
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>סינון וחיפוש</CardTitle>
                        <CardDescription>סה"כ {filteredInquiries.length} פניות תואמות מתוך {inquiries.length}</CardDescription>
                        <div className="grid md:grid-cols-2 gap-4 pt-4">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="חיפוש לפי שם, טלפון או עיר..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger><SelectValue placeholder="סנן לפי סטטוס..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">כל הסטטוסים</SelectItem>
                                        {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>שם מלא</TableHead>
                                        <TableHead>יצירת קשר</TableHead>
                                        <TableHead>תאריך פנייה</TableHead>
                                        <TableHead>סטטוס</TableHead>
                                        <TableHead>מעקב הבא</TableHead>
                                        <TableHead className="text-right">פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInquiries.map((inquiry) => (
                                        <TableRow key={inquiry.id}>
                                            <TableCell className="font-medium">{inquiry.full_name}<br/><span className="text-gray-500 text-xs">{inquiry.city}</span></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2"><Phone className="w-3 h-3"/>{inquiry.phone}</div>
                                                {inquiry.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="w-3 h-3"/>{inquiry.email}</div>}
                                            </TableCell>
                                            <TableCell>
                                                {inquiry.inquiry_date && format(new Date(inquiry.inquiry_date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(inquiry.status)}`}>{inquiry.status}</span>
                                            </TableCell>
                                            <TableCell>
                                                {inquiry.next_followup_date && format(new Date(inquiry.next_followup_date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(inquiry)}>
                                                                <Eye className="h-4 w-4 text-gray-500" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>צפה וערוך</p></TooltipContent>
                                                    </Tooltip>

                                                    {/* WhatsApp workflow button - show only for relevant statuses */}
                                                    {(inquiry.status === 'בטיפול' || inquiry.status === 'שיחה ראשונית' || inquiry.status === 'מתעניין רציני') && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => handleWhatsAppWorkflow(inquiry)}
                                                                    className="text-green-600 hover:text-green-700"
                                                                >
                                                                    <MessageCircle className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>שלח ווטסאפ וקבע פגישה</p></TooltipContent>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => setInquiryToDelete(inquiry)}>
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>מחק פנייה</p></TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredInquiries.length === 0 && <p className="text-center py-8 text-gray-500">לא נמצאו פניות התואמות לחיפוש.</p>}
                    </CardContent>
                </Card>

                <FranchiseInquiryForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    inquiry={selectedInquiry}
                    onSave={handleSaveInquiry}
                />

                <WhatsAppConfirmDialog
                    open={whatsappDialogOpen}
                    onOpenChange={setWhatsappDialogOpen}
                    inquiry={inquiryForWhatsapp}
                    onConfirm={handleWhatsAppConfirm}
                />

                <AlertDialog open={!!inquiryToDelete} onOpenChange={() => setInquiryToDelete(null)} dir="rtl">
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                            <AlertDialogDescription>
                                האם אתה בטוח שברצונך למחוק את פניית הזכיינות של "{inquiryToDelete?.full_name}"? לא ניתן לשחזר פעולה זו.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteInquiry} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}
