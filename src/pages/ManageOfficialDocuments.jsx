
import React, { useState, useEffect } from 'react';
import { OfficialDocument, DocumentCategory, User } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
    Library, 
    Plus, 
    Search, 
    Filter, 
    Edit, 
    Trash2, 
    Download, 
    ExternalLink, 
    FileText, 
    Link as LinkIcon,
    RefreshCw,
    AlertCircle,
    Eye,
    EyeOff,
    Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import OfficialDocumentForm from '../components/OfficialDocumentForm';
import FileViewer, { useFileViewer } from '../components/FileViewer';

export default function ManageOfficialDocuments() {
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showInactive, setShowInactive] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Add file viewer hook
    const { viewerState, openFileViewer, closeFileViewer } = useFileViewer();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterDocuments();
    }, [documents, searchTerm, selectedCategory, showInactive]);

    const loadData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [docsData, categoriesData, userData] = await Promise.all([
                OfficialDocument.list('-created_date'),
                DocumentCategory.filter({ is_active: true }, 'order_index'),
                User.me()
            ]);
            setDocuments(docsData);
            setCategories(categoriesData);
            setCurrentUser(userData);
        } catch (error) {
            console.error("Error loading documents:", error);
            setLoadError("שגיאה בטעינת המסמכים");
        } finally {
            setIsLoading(false);
        }
    };

    const filterDocuments = () => {
        let filtered = documents;

        if (searchTerm) {
            filtered = filtered.filter(doc => 
                doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(doc => doc.category === selectedCategory);
        }

        // Only apply showInactive filter if current user is not admin/operational_manager
        // For admin, we want to show all and let them toggle active status if 'showInactive' is true
        if (!showInactive && !(currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager')) {
            filtered = filtered.filter(doc => doc.is_active !== false);
        } else if (!showInactive && (currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager')) {
            // If admin and showInactive is false, show only active
            filtered = filtered.filter(doc => doc.is_active !== false);
        }
        // If showInactive is true for admin, all documents (active/inactive) will be displayed and styled
        
        setFilteredDocuments(filtered);
    };

    const getCategoryColor = (categoryName) => {
        const category = categories.find(cat => cat.name === categoryName);
        if (!category) {
            return 'bg-gray-100 text-gray-700'; // Default for unknown/inactive categories
        }
        
        const colors = {
            blue: 'bg-blue-100 text-blue-800',
            green: 'bg-green-100 text-green-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            red: 'bg-red-100 text-red-800',
            purple: 'bg-purple-100 text-purple-800',
            pink: 'bg-pink-100 text-pink-800',
            indigo: 'bg-indigo-100 text-indigo-800',
            gray: 'bg-gray-100 text-gray-800'
        };
        return colors[category.color] || colors.gray; // Default to gray if color not found
    };

    const handleOpenForm = (document = null) => {
        setSelectedDocument(document);
        setIsFormOpen(true);
    };

    const handleSaveDocument = async (formData) => {
        try {
            if (selectedDocument) {
                await OfficialDocument.update(selectedDocument.id, formData);
            } else {
                await OfficialDocument.create(formData);
            }
            await loadData();
            setSelectedDocument(null);
            setIsFormOpen(false); // Close form after successful save
        } catch (error) {
            console.error("Failed to save document:", error);
            alert("שגיאה בשמירת המסמך");
        }
    };

    const handleDeleteDocument = async () => {
        if (!documentToDelete) return;
        try {
            await OfficialDocument.delete(documentToDelete.id);
            await loadData();
            setDocumentToDelete(null);
        } catch (error) {
            console.error("Failed to delete document:", error);
            alert("שגיאה במחיקת המסמך");
        }
    };

    // Note: handleViewDocument is replaced by direct use of openFileViewer or <a> tag in the JSX
    // Note: handleToggleActive is removed from the card UI as per outline, but the filter for non-admins still applies.
    // The outline implies that for admin users, all documents are shown and can be managed (edit/delete),
    // and the "show inactive" toggle would control the display of inactive documents, not their "active" state itself.

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-2 text-lg text-gray-700">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>טוען מסמכים...</span>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-md w-full">
                    <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת המסמכים</h3>
                    <p className="text-red-600 mb-4">{loadError}</p>
                    <Button onClick={loadData}>
                        <RefreshCw className="ml-2 h-4 w-4" />
                        נסה שוב
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6" dir="rtl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <Library className="w-6 h-6 text-blue-600" />
                            מסמכים להורדה
                        </h1>
                        {currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager' ? (
                            <p className="text-gray-600">ניהול מסמכים וקישורים חשובים לכל הרשת</p>
                        ) : (
                            <p className="text-gray-600">מסמכים חשובים לכל הרשת</p>
                        )}
                    </div>
                    {(currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager') && (
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link to={createPageUrl("DocumentCategories")}>
                                    <Settings className="ml-2 h-4 w-4" />
                                    ניהול קטגוריות
                                </Link>
                            </Button>
                            <Button onClick={() => handleOpenForm()}>
                                <Plus className="ml-2 h-4 w-4" />
                                הוסף מסמך
                            </Button>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-64">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="חיפוש מסמכים..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="כל הקטגוריות" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">כל הקטגוריות</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category.id} value={category.name}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager') && (
                                <Button
                                    variant={showInactive ? "default" : "outline"}
                                    onClick={() => setShowInactive(!showInactive)}
                                >
                                    <Filter className="ml-2 h-4 w-4" />
                                    {showInactive ? 'הסתר לא פעילים' : 'הצג לא פעילים'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Document Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc) => (
                            <Card key={doc.id} className={`flex flex-col ${!doc.is_active && (currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager') ? 'opacity-60 border-dashed' : ''}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg leading-tight">{doc.title}</CardTitle>
                                        <div className="flex gap-2 items-center">
                                            <Badge className={getCategoryColor(doc.category)}>
                                                {doc.category}
                                            </Badge>
                                            {!doc.is_active && (currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager') && (
                                                <Badge variant="secondary">לא פעיל</Badge>
                                            )}
                                        </div>
                                    </div>
                                    {doc.description && (
                                        <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        עודכן: {format(new Date(doc.updated_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                                    </p>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        {doc.document_type === 'file' ? (
                                            <FileText className="w-4 h-4" />
                                        ) : (
                                            <ExternalLink className="w-4 h-4" />
                                        )}
                                        <span>{doc.document_type === 'file' ? 'קובץ' : 'קישור חיצוני'}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center pt-0">
                                    <div className="flex gap-2">
                                        {doc.document_type === 'file' ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openFileViewer(doc.file_url, null, doc.title)}
                                                className="gap-2"
                                                disabled={!doc.is_active && !(currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager')} // Disable view for inactive docs for non-admins
                                            >
                                                <Eye className="w-4 h-4" />
                                                צפה
                                            </Button>
                                        ) : (
                                            <a href={doc.link_url} target="_blank" rel="noopener noreferrer">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="gap-2"
                                                    disabled={!doc.is_active && !(currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager')} // Disable link for inactive docs for non-admins
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    פתח קישור
                                                </Button>
                                            </a>
                                        )}
                                        {doc.document_type === 'file' && (
                                            <a href={doc.file_url} download>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="gap-2"
                                                    disabled={!doc.is_active && !(currentUser?.user_type === 'admin' || currentUser?.user_type === 'operational_manager')} // Disable download for inactive docs for non-admins
                                                >
                                                    <Download className="w-4 h-4" />
                                                    הורד
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                    {(currentUser && (currentUser.user_type === 'admin' || currentUser.user_type === 'operational_manager')) && (
                                        <div className="flex gap-0.5"> {/* Reduced gap for icon buttons */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenForm(doc)}
                                                title="ערוך"
                                            >
                                                <Edit className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDocumentToDelete(doc)}
                                                title="מחק"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <Card className="col-span-full"> {/* Span full width for no documents message */}
                            <CardContent className="p-8 text-center">
                                <Library className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium text-gray-500 mb-2">אין מסמכים</p>
                                <p className="text-sm text-gray-400">
                                    {searchTerm || selectedCategory !== 'all' || showInactive ? 
                                        'לא נמצאו מסמכים התואמים לחיפוש' : 
                                        'התחל בהוספת מסמך ראשון'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <OfficialDocumentForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    document={selectedDocument}
                    onSave={handleSaveDocument}
                    availableCategories={categories}
                />

                <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
                    <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                            <AlertDialogDescription>
                                האם אתה בטוח שברצונך למחוק את המסמך "{documentToDelete?.title}"? 
                                לא ניתן לשחזר פעולה זו.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDeleteDocument} 
                                className="bg-red-600 hover:bg-red-700"
                            >
                                מחק
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <FileViewer
                isOpen={viewerState.isOpen}
                onClose={closeFileViewer}
                fileUrl={viewerState.fileUrl}
                fileName={viewerState.fileName}
                title={viewerState.title}
            />
        </>
    );
}
