import React, { useState, useEffect } from 'react';
import { DeletedItem } from '@/api/entities';
import { Branch, Audit, AuditQuestion, QuestionnaireSettings, HealthAudit, AccessibilityAudit, MinistryAudit, TaxAudit, BranchSetup, QuestionTopic, BusinessLocation, PlannedVisit, PlannedAccessibilityVisit, CustomerComplaint, Complaint, ComplaintTopic, CustomerComplaintTopic, Training, TrainingRecord, NetworkTask, NetworkTaskRecord, ContactRole, RenovationCategory, RenovationRole, RenovationProfessional, OfficialDocument, DocumentCategory, FranchiseInquiry, Note, PersonalTask, JobApplication, MinistryChecklistItem } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Archive, RotateCcw, Trash2, AlertCircle, RefreshCw, Store, ClipboardList, FileText, HardHat, Search } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getEntityDisplayName } from '../components/SafeDeleteHelper';

// מפת אייקונים לכל סוג ישות
const ENTITY_ICONS = {
    'Branch': Store,
    'Audit': ClipboardList,
    'Questionnaire': FileText,
    'BranchSetup': HardHat,
    'AuditQuestion': ClipboardList,
    'QuestionTopic': FileText,
    'BusinessLocation': Store,
    'AccessibilityAudit': ClipboardList,
    'HealthAudit': ClipboardList,
    'MinistryAudit': ClipboardList,
    'TaxAudit': ClipboardList,
    'PlannedVisit': ClipboardList,
    'PlannedAccessibilityVisit': ClipboardList,
    'CustomerComplaint': AlertCircle,
    'Complaint': AlertCircle,
    'ComplaintTopic': AlertCircle,
    'CustomerComplaintTopic': AlertCircle,
    'Training': FileText,
    'TrainingRecord': FileText,
    'NetworkTask': ClipboardList,
    'NetworkTaskRecord': ClipboardList,
    'ContactRole': FileText,
    'RenovationCategory': HardHat,
    'RenovationRole': HardHat,
    'RenovationProfessional': HardHat,
    'OfficialDocument': FileText,
    'DocumentCategory': FileText,
    'FranchiseInquiry': Store,
    'Note': FileText,
    'PersonalTask': ClipboardList,
    'JobApplication': FileText,
    'MinistryChecklistItem': ClipboardList
};

// מפת ישויות לצורך שחזור
const ENTITY_MAP = {
    'Branch': Branch,
    'Audit': Audit,
    'Questionnaire': QuestionnaireSettings,
    'BranchSetup': BranchSetup,
    'AuditQuestion': AuditQuestion,
    'QuestionTopic': QuestionTopic,
    'BusinessLocation': BusinessLocation,
    'AccessibilityAudit': AccessibilityAudit,
    'HealthAudit': HealthAudit,
    'MinistryAudit': MinistryAudit,
    'TaxAudit': TaxAudit,
    'PlannedVisit': PlannedVisit,
    'PlannedAccessibilityVisit': PlannedAccessibilityVisit,
    'CustomerComplaint': CustomerComplaint,
    'Complaint': Complaint,
    'ComplaintTopic': ComplaintTopic,
    'CustomerComplaintTopic': CustomerComplaintTopic,
    'Training': Training,
    'TrainingRecord': TrainingRecord,
    'NetworkTask': NetworkTask,
    'NetworkTaskRecord': NetworkTaskRecord,
    'ContactRole': ContactRole,
    'RenovationCategory': RenovationCategory,
    'RenovationRole': RenovationRole,
    'RenovationProfessional': RenovationProfessional,
    'OfficialDocument': OfficialDocument,
    'DocumentCategory': DocumentCategory,
    'FranchiseInquiry': FranchiseInquiry,
    'Note': Note,
    'PersonalTask': PersonalTask,
    'JobApplication': JobApplication,
    'MinistryChecklistItem': MinistryChecklistItem
};

// קטגוריות לטאבים
const TAB_CATEGORIES = {
    'management': {
        name: 'ניהול',
        types: ['Branch', 'BranchSetup', 'ContactRole', 'FranchiseInquiry', 'JobApplication']
    },
    'audits': {
        name: 'ביקורות',
        types: ['Audit', 'AccessibilityAudit', 'HealthAudit', 'MinistryAudit', 'TaxAudit', 'PlannedVisit', 'PlannedAccessibilityVisit']
    },
    'questionnaires': {
        name: 'שאלונים',
        types: ['Questionnaire', 'AuditQuestion', 'QuestionTopic', 'BusinessLocation', 'MinistryChecklistItem']
    },
    'complaints': {
        name: 'תלונות',
        types: ['CustomerComplaint', 'Complaint', 'ComplaintTopic', 'CustomerComplaintTopic']
    },
    'training': {
        name: 'הדרכות',
        types: ['Training', 'TrainingRecord']
    },
    'tasks': {
        name: 'משימות',
        types: ['NetworkTask', 'NetworkTaskRecord', 'PersonalTask', 'Note']
    },
    'documents': {
        name: 'מסמכים',
        types: ['OfficialDocument', 'DocumentCategory']
    },
    'renovation': {
        name: 'שיפוץ',
        types: ['RenovationCategory', 'RenovationRole', 'RenovationProfessional']
    }
};

export default function ArchivePage() {
    const [deletedItems, setDeletedItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [itemToRestore, setItemToRestore] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');

    useEffect(() => {
        loadDeletedItems();
    }, []);

    useEffect(() => {
        filterItems();
    }, [deletedItems, activeTab, searchTerm, selectedType]);

    const loadDeletedItems = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const items = await DeletedItem.list('-created_date');
            setDeletedItems(items);
        } catch (error) {
            console.error("Error loading deleted items:", error);
            setLoadError("אירעה שגיאת רשת. לא ניתן היה לטעון את הארכיון.");
        } finally {
            setIsLoading(false);
        }
    };

    const filterItems = () => {
        let filtered = deletedItems;

        // סינון לפי טאב
        if (activeTab !== 'all') {
            const categoryTypes = TAB_CATEGORIES[activeTab]?.types || [];
            filtered = filtered.filter(item => categoryTypes.includes(item.item_type));
        }

        // סינון לפי חיפוש
        if (searchTerm) {
            const lowercaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.item_name.toLowerCase().includes(lowercaseSearch) ||
                getEntityDisplayName(item.item_type).toLowerCase().includes(lowercaseSearch) ||
                (item.deleted_by && item.deleted_by.toLowerCase().includes(lowercaseSearch))
            );
        }

        // סינון לפי סוג
        if (selectedType !== 'all') {
            filtered = filtered.filter(item => item.item_type === selectedType);
        }

        setFilteredItems(filtered);
    };

    const handleRestore = async () => {
        if (!itemToRestore) return;
        
        try {
            const { item_type, item_data } = itemToRestore;
            const EntityClass = ENTITY_MAP[item_type];
            
            if (!EntityClass) {
                alert(`לא ניתן לשחזר פריט מסוג ${item_type} - סוג לא נתמך`);
                return;
            }
            
            if (item_type === 'Questionnaire') {
                // שחזור שאלון - צריך לשחזר גם הגדרות וגם שאלות
                await QuestionnaireSettings.create(item_data.settings);
                if (item_data.questions && item_data.questions.length > 0) {
                    for (const question of item_data.questions) {
                        await AuditQuestion.create(question);
                    }
                }
            } else {
                // שחזור רגיל
                await EntityClass.create(item_data);
            }
            
            // הסרה מהארכיון
            await DeletedItem.delete(itemToRestore.id);
            
            await loadDeletedItems();
            setItemToRestore(null);
            alert('הפריט שוחזר בהצלחה!');
        } catch (error) {
            console.error("Error restoring item:", error);
            alert('שגיאה בשחזור הפריט');
        }
    };

    const handlePermanentDelete = async () => {
        if (!itemToDelete) return;
        
        try {
            // מחיקה סופית של הפריט מהארכיון
            await DeletedItem.delete(itemToDelete.id);
            
            await loadDeletedItems();
            setItemToDelete(null);
            alert('הפריט נמחק לצמיתות');
        } catch (error) {
            console.error("Error permanently deleting item:", error);
            alert('שגיאה במחיקה סופית');
        }
    };

    const getItemIcon = (type) => {
        const IconComponent = ENTITY_ICONS[type] || Archive;
        return <IconComponent className="w-5 h-5 text-blue-500" />;
    };

    // קבלת כל הסוגים הייחודיים מהנתונים
    const uniqueTypes = [...new Set(deletedItems.map(item => item.item_type))].sort();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-2 text-lg text-gray-700">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>טוען ארכיון...</span>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הארכיון</h3>
                <p className="text-red-600 mb-4">{loadError}</p>
                <Button onClick={loadDeletedItems}>
                    <RefreshCw className="ml-2 h-4 w-4" />
                    נסה שוב
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <Archive className="w-6 h-6" />
                        ארכיון פריטים שנמחקו
                    </h1>
                    <p className="text-gray-600">כאן תוכלו לראות ולשחזר כל הפריטים שנמחקו מהמערכת.</p>
                </div>
            </div>

            {/* סינונים */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="חיפוש לפי שם, סוג או מי שמחק..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                        </div>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="כל הסוגים" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">כל הסוגים</SelectItem>
                                {uniqueTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {getEntityDisplayName(type)} ({deletedItems.filter(i => i.item_type === type).length})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>פריטים בארכיון ({filteredItems.length} מתוך {deletedItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-9">
                            <TabsTrigger value="all">הכל ({deletedItems.length})</TabsTrigger>
                            {Object.entries(TAB_CATEGORIES).map(([key, category]) => {
                                const count = deletedItems.filter(i => category.types.includes(i.item_type)).length;
                                return (
                                    <TabsTrigger key={key} value={key}>
                                        {category.name} ({count})
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                        
                        <TabsContent value={activeTab} className="mt-6">
                            {filteredItems.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>סוג</TableHead>
                                            <TableHead>שם</TableHead>
                                            <TableHead>נמחק על ידי</TableHead>
                                            <TableHead>תאריך מחיקה</TableHead>
                                            <TableHead>פעולות</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getItemIcon(item.item_type)}
                                                        <Badge variant="outline">{getEntityDisplayName(item.item_type)}</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                                <TableCell className="text-sm text-gray-600">{item.deleted_by}</TableCell>
                                                <TableCell>
                                                    {format(new Date(item.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setItemToRestore(item)}
                                                            className="gap-2"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                            שחזר
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setItemToDelete(item)}
                                                            className="gap-2 text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            מחק לצמיתות
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium mb-2">אין פריטים להצגה</p>
                                    <p className="text-sm">
                                        {searchTerm || selectedType !== 'all' ? 
                                            'לא נמצאו פריטים התואמים לחיפוש' : 
                                            'אין פריטים נמחקים בקטגוריה זו'
                                        }
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Restore Confirmation Dialog */}
            <AlertDialog open={!!itemToRestore} onOpenChange={() => setItemToRestore(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור שחזור</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך לשחזר את {getEntityDisplayName(itemToRestore?.item_type)} "{itemToRestore?.item_name}"?
                            <br />
                            הפריט יוחזר למערכת ויהיה זמין לשימוש רגיל.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestore} className="bg-green-600 hover:bg-green-700">
                            שחזר פריט
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Permanent Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה סופית</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק לצמיתות את {getEntityDisplayName(itemToDelete?.item_type)} "{itemToDelete?.item_name}"?
                            <br />
                            <strong className="text-red-600">פעולה זו בלתי הפיכה ולא ניתן לשחזר את הפריט!</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePermanentDelete} className="bg-red-600 hover:bg-red-700">
                            מחק לצמיתות
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}