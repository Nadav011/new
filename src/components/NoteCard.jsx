import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, PinOff, Edit, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { Note } from '@/api/entities';

export default function NoteCard({ note, onEdit, onDelete, onTogglePin }) {
    const colorClasses = {
        default: 'bg-yellow-100 border-yellow-200',
        red: 'bg-red-100 border-red-200',
        orange: 'bg-orange-100 border-orange-200',
        yellow: 'bg-yellow-100 border-yellow-200',
        green: 'bg-green-100 border-green-200',
        blue: 'bg-blue-100 border-blue-200',
        purple: 'bg-purple-100 border-purple-200',
        pink: 'bg-pink-100 border-pink-200',
    };

    const handleArchiveToggle = async () => {
        try {
            await Note.update(note.id, { is_archived: !note.is_archived });
            // Instead of reloading, we should trigger a refresh in the parent component.
            // Since we can't pass a function from here, we will rely on the user to manually refresh or for the parent to handle it.
            // For a better UX, this would be an `onArchive` prop.
            window.dispatchEvent(new CustomEvent('notes-changed'));
        } catch (error) {
            console.error("Error archiving note:", error);
            alert("שגיאה בהעברה לארכיון");
        }
    };

    return (
        <Card dir="rtl" className={`w-full shadow-sm hover:shadow-md transition-shadow flex flex-col h-52 ${colorClasses[note.color || 'default']}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-lg font-semibold line-clamp-2">{note.title || 'ללא כותרת'}</CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTogglePin(note)} title={note.is_pinned ? "בטל נעיצה" : "נעץ פתק"}>
                        {note.is_pinned ? <PinOff className="w-4 h-4 text-blue-600" /> : <Pin className="w-4 h-4" />}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between overflow-hidden p-4 pt-0">
                {note.content && (
                    <div className="prose prose-sm max-w-none text-gray-700 text-right mb-2 overflow-auto flex-1">
                       <div className="line-clamp-4">
                            <ReactMarkdown>{note.content}</ReactMarkdown>
                       </div>
                    </div>
                )}
                <div className="flex justify-end items-center gap-1 mt-auto pt-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(note)} title="ערוך">
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleArchiveToggle} title={note.is_archived ? "הוצא מארכיון" : "העבר לארכיון"}>
                        {note.is_archived ? <ArchiveRestore className="w-4 h-4 text-green-600"/> : <Archive className="w-4 h-4" />}
                    </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => onDelete(note)} title="מחק לצמיתות">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}