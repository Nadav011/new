import React, { useState, useEffect, useCallback } from 'react';
import { Presentation } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, File, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PresentationForm from '../components/PresentationForm';
import PresentationCard from '../components/PresentationCard';

export default function PresentationsPage() {
    const [presentations, setPresentations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPresentation, setEditingPresentation] = useState(null);
    const [presentationToDelete, setPresentationToDelete] = useState(null);

    const loadPresentations = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await Presentation.list('-created_date');
            setPresentations(data || []);
        } catch (error) {
            console.error("Failed to load presentations:", error);
            setPresentations([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPresentations();
    }, [loadPresentations]);

    const handleOpenForm = (presentation = null) => {
        setEditingPresentation(presentation);
        setIsFormOpen(true);
    };

    const handleSave = async (formData) => {
        if (editingPresentation) {
            await Presentation.update(editingPresentation.id, formData);
        } else {
            await Presentation.create(formData);
        }
        await loadPresentations();
        setIsFormOpen(false);
    };

    const handleDelete = async () => {
        if (presentationToDelete) {
            try {
                await Presentation.delete(presentationToDelete.id);
            } catch (error) {
                console.error("Failed to delete presentation:", error);
                alert("שגיאה במחיקת המצגת.");
            } finally {
                setPresentationToDelete(null);
                await loadPresentations();
            }
        }
    };

    return (
        <div dir="rtl" className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">ניהול מצגות ותוכניות</h1>
                <Button onClick={() => handleOpenForm()}>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף קובץ חדש
                </Button>
            </div>
            
            <p className="text-gray-600">
                כאן ניתן להעלות, לנהל ולשתף מצגות, תוכניות עבודה, מחירונים וקבצים חשובים אחרים.
            </p>

            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            ) : presentations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <File className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">לא נמצאו קבצים</h3>
                    <p className="mt-1 text-sm text-gray-500">עדיין לא העלית קבצים. לחץ על הכפתור כדי להתחיל.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {presentations.map((presentation) => (
                        <PresentationCard
                            key={presentation.id}
                            presentation={presentation}
                            onEdit={handleOpenForm}
                            onDelete={setPresentationToDelete}
                        />
                    ))}
                </div>
            )}

            {isFormOpen && (
                <PresentationForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                    presentation={editingPresentation}
                />
            )}

            <AlertDialog open={!!presentationToDelete} onOpenChange={() => setPresentationToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-red-500" />
                            אישור מחיקת קובץ
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את הקובץ "{presentationToDelete?.title}"?
                            פעולה זו היא בלתי הפיכה והקובץ יימחק לצמיתות.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            מחק
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}