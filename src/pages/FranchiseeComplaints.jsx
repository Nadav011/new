
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Complaint, Branch, ComplaintTopic, User, BranchOwnership } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, Megaphone, Clock, CheckCircle, AlertTriangle, RefreshCw, MessageSquareWarning, Settings, Save, Tag, Users, Download, Mail, MessageSquare as ShareIcon, ChevronDown } from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import FranchiseeComplaintForm from '../components/FranchiseeComplaintForm';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const FranchiseeComplaintCard = ({ complaint, onEdit, onDelete }) => {
    const statusMap = {
        'פתוחה': { icon: Megaphone, color: 'bg-red-100 text-red-800 border-red-200' },
        'בטיפול': { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        'סגורה': { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
    };
    const { icon: Icon, color } = statusMap[complaint.status] || {};

    return (
        <Card className={`hover:shadow-md transition-shadow ${color}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div>
                    <CardTitle className="text-base font-semibold">{complaint.branchName || 'סניף לא ידוע'}</CardTitle>
                    <CardDescription className="text-xs pt-1">
                        <div className="flex items-center gap-2">
                            <Tag className="w-3 h-3" />
                            <span className="font-medium">{complaint.complaint_topic}</span>
                        </div>
                        <div className="mt-1">
                            {`תלונה מאת: ${complaint.complainant_name || 'זכיין'} | התקבלה: ${format(new Date(complaint.complaint_date), 'dd/MM/yy HH:mm', { locale: he })}`}
                        </div>
                    </CardDescription>
                </div>
                 <Badge variant="secondary" className="gap-2 shrink-0">
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {complaint.status}
                </Badge>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-700 mb-4">{complaint.complaint_details}</p>
                <div className="text-xs text-gray-600 flex justify-between items-center">
                    <span>{`נקלטה ע"י: ${complaint.received_by}`}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(complaint)}>
                            <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        {/* Only show delete button if onDelete handler is provided (i.e., for admins) */}
                        {onDelete && (
                            <Button variant="ghost" size="icon" onClick={() => onDelete(complaint)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const ComplaintTopicsManager = ({ open, onOpenChange, onTopicsUpdate }) => {
    const [topics, setTopics] = useState([]);
    const [newTopicName, setNewTopicName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadTopics();
        }
    }, [open]);

    const loadTopics = async () => {
        try {
            const topicsData = await ComplaintTopic.list();
            setTopics(topicsData.sort((a,b) => (a.order_index || 0) - (b.order_index || 0)));
        } catch (error) {
            console.error("Failed to load topics:", error);
        }
    };

    const handleAddTopic = async () => {
        if (!newTopicName.trim()) return;
        
        setIsLoading(true);
        try {
            await ComplaintTopic.create({
                name: newTopicName.trim(),
                order_index: topics.length,
                is_active: true
            });
            setNewTopicName('');
            await loadTopics();
            onTopicsUpdate();
        } catch (error) {
            console.error("Failed to add topic:", error);
            alert("שגיאה בהוספת הנושא");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTopic = async (topicId) => {
        try {
            await ComplaintTopic.delete(topicId);
            await loadTopics();
            onTopicsUpdate();
        } catch (error) {
            console.error("Failed to delete topic:", error);
            alert("שגיאה במחיקת הנושא");
        }
    };

    const handleToggleActive = async (topic) => {
        try {
            await ComplaintTopic.update(topic.id, { ...topic, is_active: !topic.is_active });
            await loadTopics();
            onTopicsUpdate();
        } catch (error) {
            console.error("Failed to update topic:", error);
            alert("שגיאה בעדכון הנושא");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        ניהול נושאי תלונות זכיינים
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="הוסף נושא תלונה חדש..."
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                        />
                        <Button onClick={handleAddTopic} disabled={!newTopicName.trim() || isLoading}>
                            <Save className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {topics.map(topic => (
                            <div key={topic.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <span className={topic.is_active ? "text-gray-900" : "text-gray-400 line-through"}>
                                    {topic.name}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleActive(topic)}
                                        className={topic.is_active ? "text-yellow-600" : "text-green-600"}
                                    >
                                        {topic.is_active ? "השבת" : "הפעל"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTopic(topic.id)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {topics.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Tag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>אין נושאי תלונות מוגדרים</p>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>סגור</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function FranchiseeComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isTopicsManagerOpen, setIsTopicsManagerOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [complaintToDelete, setComplaintToDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const { search } = useLocation();
    const urlParams = new URLSearchParams(search);
    const filterParam = urlParams.get('filter');
    const isPendingTreatmentView = filterParam === 'pending_treatment';

    const isAdmin = currentUser?.user_type?.trim() === 'admin' || currentUser?.user_type?.trim() === 'operational_manager';
    const isBranchOwner = currentUser?.user_type === 'branch_owner' || currentUser?.user_type === 'setup_branch_owner';
    
    useEffect(() => {
        loadData();
    }, [search]); // Add search to dependencies to react to URL changes

    const loadData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const user = await User.me();
            setCurrentUser(user);
            
            let ownedBranchIds = [];
            if (user.user_type === 'branch_owner' || user.user_type === 'setup_branch_owner') {
                const ownerships = await BranchOwnership.filter({ user_id: user.id });
                ownedBranchIds = ownerships.map(o => o.branch_id);
                // Also get the assigned_branch_id for the current user
                user.assigned_branch_id = ownedBranchIds.length > 0 ? ownedBranchIds[0] : null;
            }

            const [allComplaints, allBranches] = await Promise.all([
                Complaint.list(),
                Branch.list()
            ]);
            
            let complaintsData = allComplaints;
            if(user.user_type === 'branch_owner' || user.user_type === 'setup_branch_owner') {
                complaintsData = allComplaints.filter(c => ownedBranchIds.includes(c.branch_id));
            }
            
            const branchesToDisplay = (user.user_type === 'branch_owner' || user.user_type === 'setup_branch_owner')
                ? allBranches.filter(b => ownedBranchIds.includes(b.id)) 
                : allBranches;

            complaintsData.sort((a, b) => new Date(b.complaint_date) - new Date(a.complaint_date));

            const branchesMap = new Map(branchesToDisplay.map(b => [b.id, b.name]));
            const complaintsWithBranchNames = complaintsData.map(c => ({
                ...c,
                branchName: branchesMap.get(c.branch_id) || 'סניף לא ידוע',
                complaint_topic: c.complaint_topic?.name || c.complaint_topic || 'לא ידוע', // Handle both object and string
                complainant_name: c.complainant_name || 'זכיין לא ידוע',
            }));
            setComplaints(complaintsWithBranchNames);
            setBranches(branchesToDisplay);
        } catch (error) {
            console.error("Error loading data:", error);
            setLoadError("אירעה שגיאה בטעינת הנתונים.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (complaint = null) => {
        setSelectedComplaint(complaint);
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        await loadData();
        setIsFormOpen(false);
    };

    const handleDelete = async () => {
        if (!complaintToDelete) return;
        try {
            await Complaint.delete(complaintToDelete.id);
            setComplaintToDelete(null);
            await loadData();
        } catch (error) {
            console.error("Error deleting complaint:", error);
            alert("שגיאה במחיקת התלונה.");
        }
    };

    const exportComplaints = () => {
        if (filteredComplaints.length === 0) {
            alert("אין תלונות לייצוא.");
            return;
        }
        const dataToExport = filteredComplaints.map(c => ({
            'סניף': c.branchName,
            'תאריך תלונה': format(new Date(c.complaint_date), 'dd/MM/yyyy HH:mm', { locale: he }),
            'שם מתלונן (זכיין)': c.complainant_name,
            'נושא': c.complaint_topic,
            'פרטי תלונה': c.complaint_details,
            'סטטוס': c.status,
            'פרטי פתרון': c.resolution_details || 'לא נרשם'
        }));

        const headers = Object.keys(dataToExport[0]);
        
        const sanitizeCell = (cell) => {
            let cellValue = cell === null || cell === undefined ? '' : String(cell);
            if (cellValue.includes('"') || cellValue.includes(',') || cellValue.includes('\n')) {
                cellValue = `"${cellValue.replace(/"/g, '""')}"`;
            }
            return cellValue;
        };

        const csvRows = [
            headers.join(','),
            ...dataToExport.map(row => 
                headers.map(fieldName => sanitizeCell(row[fieldName])).join(',')
            )
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "FranchiseeComplaintsReport.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = (platform) => {
        if (filteredComplaints.length === 0) {
            alert("אין תלונות לשתף.");
            return;
        }
        const summary = `סיכום דוח תלונות זכיינים. הדוח מכיל ${filteredComplaints.length} רשומות.`;
        const encodedSummary = encodeURIComponent(summary);

        if (platform === 'email') {
            const subject = encodeURIComponent(`סיכום דוח תלונות זכיינים`);
            const body = encodeURIComponent(`שלום,\n\n${summary}\n\nאנא ייצא את הדוח המלא מהמערכת וצרף אותו למייל זה במידת הצורך.\n\nבברכה,\nצוות המקסיקני`);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        } else if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodedSummary}`, '_blank');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
    }

    if (loadError) {
        return (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
                <p className="text-red-600 mb-4">{loadError}</p>
                 <Button onClick={loadData}><RefreshCw className="ml-2 h-4 w-4" /> נסה שוב</Button>
            </div>
        );
    }

    // Apply filtering based on URL parameter
    let filteredComplaints = complaints;
    if (isPendingTreatmentView) {
        filteredComplaints = complaints.filter(c => c.status === 'פתוחה' || c.status === 'בטיפול');
    }

    // Determine page title based on context
    const getPageTitle = () => {
        if (isPendingTreatmentView) {
            return 'טיפול בתלונות זכיינים';
        }
        if (isBranchOwner) {
            return 'תלונות זכיינים - הסניף שלי';
        }
        return 'ניהול תלונות זכיינים';
    };

    const openComplaints = filteredComplaints.filter(c => c.status === 'פתוחה' || c.status === 'בטיפול');
    const closedComplaints = filteredComplaints.filter(c => c.status === 'סגורה');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-7 h-7" />
                    {getPageTitle()}
                </h1>
                <div className="flex items-center gap-2">
                    {/* Only admins can manage topics */}
                    {isAdmin && !isPendingTreatmentView && (
                        <Button onClick={() => setIsTopicsManagerOpen(true)} variant="outline" className="gap-2">
                            <Settings className="w-4 h-4" />
                            ניהול נושאים
                        </Button>
                    )}
                    {/* Hide export options in pending treatment view to focus on treatment */}
                    {!isPendingTreatmentView && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <span>ייצוא ופעולות</span>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" dir="rtl">
                                <DropdownMenuLabel>אפשרויות</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={exportComplaints} className="flex items-center gap-2 cursor-pointer">
                                    <Download className="h-4 w-4" />
                                    <span>הורד דוח CSV</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare('email')} className="flex items-center gap-2 cursor-pointer">
                                    <Mail className="h-4 w-4" />
                                    <span>שלח סיכום במייל</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="flex items-center gap-2 cursor-pointer">
                                    <ShareIcon className="h-4 w-4" />
                                    <span>שלח סיכום ב-WhatsApp</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700 gap-2">
                        <PlusCircle className="w-4 h-4" />
                        הוסף תלונה
                    </Button>
                </div>
            </div>

            {isPendingTreatmentView && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">מצב טיפול בתלונות זכיינים</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                        מוצגות כאן רק תלונות הזכיינים שנמצאות במצב "פתוחה" או "בטיפול" ודורשות טיפול.
                    </p>
                </div>
            )}

            <Tabs defaultValue="open" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="open">תלונות פתוחות ({openComplaints.length})</TabsTrigger>
                    <TabsTrigger value="closed">תלונות סגורות ({closedComplaints.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="pt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {openComplaints.map(c => (
                            <FranchiseeComplaintCard 
                                key={c.id} 
                                complaint={c} 
                                onEdit={handleOpenForm}
                                onDelete={isAdmin ? setComplaintToDelete : null}
                            />
                        ))}
                    </div>
                     {openComplaints.length === 0 && <p className="text-center py-10 text-gray-500">אין תלונות פתוחות.</p>}
                </TabsContent>
                <TabsContent value="closed" className="pt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {closedComplaints.map(c => (
                            <FranchiseeComplaintCard 
                                key={c.id} 
                                complaint={c} 
                                onEdit={handleOpenForm}
                                onDelete={isAdmin ? setComplaintToDelete : null}
                            />
                        ))}
                    </div>
                    {closedComplaints.length === 0 && <p className="text-center py-10 text-gray-500">אין תלונות סגורות.</p>}
                </TabsContent>
            </Tabs>

            <FranchiseeComplaintForm 
                open={isFormOpen} 
                onOpenChange={setIsFormOpen}
                complaint={selectedComplaint}
                onSave={handleSave}
                branches={branches}
                currentUser={currentUser}
            />

            {/* Only admins can manage topics */}
            {isAdmin && (
                <ComplaintTopicsManager
                    open={isTopicsManagerOpen}
                    onOpenChange={setIsTopicsManagerOpen}
                    onTopicsUpdate={loadData}
                />
            )}

            {/* Only admins can delete complaints */}
            {isAdmin && (
                <AlertDialog open={!!complaintToDelete} onOpenChange={() => setComplaintToDelete(null)} dir="rtl">
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>אישור מחיקת תלונה</AlertDialogTitle>
                            <AlertDialogDescription>
                                האם אתה בטוח שברצונך למחוק את התלונה של {complaintToDelete?.complainant_name}? פעולה זו הינה סופית.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}
