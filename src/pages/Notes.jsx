
import React, { useState, useEffect } from 'react';
import { Note, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { PlusCircle, Archive, Trash2, AlertTriangle, StickyNote, FileText } from 'lucide-react';
import NoteCard from '../components/NoteCard';
import NoteForm from '../components/NoteForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FullPageError from '../components/FullPageError';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadNotes();
    }, []);

    // Add event listener for notes-changed when component mounts
    useEffect(() => {
        const handleNotesChanged = () => {
            loadNotes();
        };
        
        window.addEventListener('notes-changed', handleNotesChanged);
        return () => window.removeEventListener('notes-changed', handleNotesChanged);
    }, []); // Empty dependency array means it runs once on mount and cleans up on unmount.

    const handleEdit = (note) => {
        setEditingNote(note);
        setIsFormOpen(true);
    };

    const loadNotes = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const user = await User.me();
            setCurrentUser(user);

            const allNotes = await Note.list();
            
            // Filter notes by the current user's email
            const userNotes = allNotes.filter(note => note.created_by === user.email);

            setNotes(userNotes.sort((a, b) => b.is_pinned - a.is_pinned || new Date(b.updated_date) - new Date(a.updated_date)));
        } catch (error) {
            console.error("Failed to load notes:", error);
            setLoadError("אירעה שגיאה בטעינת הפתקים.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveNote = async (formData) => {
        if (!currentUser) {
            alert("שגיאה: לא ניתן לשמור את הפתק ללא משתמש מחובר.");
            return;
        }

        const dataToSave = { ...formData, created_by: currentUser.email };

        try {
            if (editingNote) {
                await Note.update(editingNote.id, dataToSave);
            } else {
                await Note.create(dataToSave);
            }
            setIsFormOpen(false);
            setEditingNote(null);
            await loadNotes();
        } catch (error) {
            console.error("Error saving note:", error);
            alert("שגיאה בשמירת הפתק.");
        }
    };

    const handleConfirmDelete = async () => {
        if (noteToDelete) {
            try {
                await Note.delete(noteToDelete.id);
                setNoteToDelete(null);
                await loadNotes();
            } catch (error) {
                console.error("Error deleting note:", error);
                alert("שגיאה במחיקת הפתק.");
            }
        }
    };

    const handleTogglePin = async (note) => {
        try {
            await Note.update(note.id, { is_pinned: !note.is_pinned });
            await loadNotes();
        } catch (error) {
            console.error("Error toggling pin:", error);
            alert("שגיאה בשינוי מצב הנעיצה.");
        }
    };
    
    if (loadError) {
        return <FullPageError errorMessage={loadError} onRetry={loadNotes} />;
    }

    const activeNotes = notes.filter(n => !n.is_archived);
    const archivedNotes = notes.filter(n => n.is_archived);

    return (
        <div dir="rtl" className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <StickyNote className="w-6 h-6" />
                    הפתקים שלי
                </h1>
                <Button onClick={() => { setEditingNote(null); setIsFormOpen(true); }}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    הוסף פתק
                </Button>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">פתקים פעילים ({activeNotes.length})</TabsTrigger>
                    <TabsTrigger value="archive">ארכיון ({archivedNotes.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="pt-6">
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>טוען פתקים...</p>
                        </div>
                    ) : activeNotes.length > 0 ? (
                        <div className="notes-grid">
                            {activeNotes.map(note => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    onEdit={handleEdit}
                                    onDelete={() => setNoteToDelete(note)}
                                    onTogglePin={() => handleTogglePin(note)}
                                />
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-12 text-gray-500">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4 text-sm">אין פתקים פעילים. לחץ על "הוסף פתק" כדי להתחיל.</p>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="archive" className="pt-6">
                     {isLoading ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>טוען פתקים...</p>
                        </div>
                    ) : archivedNotes.length > 0 ? (
                        <div className="notes-grid">
                            {archivedNotes.map(note => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    onEdit={handleEdit}
                                    onDelete={() => setNoteToDelete(note)}
                                    onTogglePin={() => handleTogglePin(note)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Archive className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4 text-sm">הארכיון ריק.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <NoteForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                note={editingNote}
                onSave={handleSaveNote}
            />
            
            <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-red-500" />
                            אישור מחיקת פתק
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את הפתק "{noteToDelete?.title || 'ללא כותרת'}"?
                            <br />
                            פעולה זו היא בלתי הפיכה.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            מחק לצמיתות
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <style jsx>{`
                .notes-grid {
                    display: grid;
                    gap: 1.5rem;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                }
            `}</style>
        </div>
    );
}
