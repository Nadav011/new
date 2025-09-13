
import React, { useState, useEffect, useCallback } from 'react';
import { Meeting } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Users, AlertTriangle, Calendar, Clock, FileText, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import MeetingForm from '../components/MeetingForm';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import MeetingDetailsDialog from '../components/MeetingDetailsDialog'; // Import the new component

export default function MeetingsPage() {
    const [meetings, setMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [meetingToDelete, setMeetingToDelete] = useState(null);

    // New state for details view
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [viewingMeeting, setViewingMeeting] = useState(null);

    const loadMeetings = async () => {
        setIsLoading(true);
        try {
            const data = await Meeting.list('-meeting_date');
            setMeetings(Array.isArray(data) ? data : []); // Preserve array safety check
        } catch (error) {
            console.error("Failed to load meetings:", error);
            setMeetings([]); // Ensure meetings is an array on error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMeetings();
    }, []); // Changed dependency array based on outline's useEffect and loadMeetings definition

    const handleOpenForm = (meeting = null) => {
        setEditingMeeting(meeting);
        setIsFormOpen(true);
    };

    // Renamed from handleSaveMeeting to handleSave as per outline
    const handleSave = async (formData) => {
        if (editingMeeting) {
            await Meeting.update(editingMeeting.id, formData);
        } else {
            await Meeting.create(formData);
        }
        await loadMeetings();
        setIsFormOpen(false); // Close form after saving
    };

    // Renamed from handleDeleteMeeting to handleDelete as per outline
    const handleDelete = async () => {
        if (meetingToDelete) {
            try {
                await Meeting.delete(meetingToDelete.id);
                await loadMeetings();
            } catch (error) {
                console.error("Failed to delete meeting:", error);
                alert("שגיאה במחיקת הפגישה."); // Preserve user feedback
            } finally {
                setMeetingToDelete(null);
            }
        }
    };

    const handleViewDetails = (meeting) => {
        setViewingMeeting(meeting);
        setIsDetailsOpen(true);
    };

    return (
        <div dir="rtl" className="space-y-6">
            {/* Header section, extracted from the original CardHeader */}
            <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Users />
                    ניהול פגישות
                </CardTitle>
                <Button onClick={() => handleOpenForm()}>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף פגישה חדשה
                </Button>
            </div>
            <CardDescription className="mb-4">
                כאן תוכל לתעד ולנהל את כל הפגישות שלך עם ספקים, נותני שירות, ועוד.
            </CardDescription>

            {/* Content section based on loading/empty/data states */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">טוען פגישות...</div>
            ) : meetings.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">לא נמצאו פגישות</h3>
                    <p className="mt-1 text-sm text-gray-500">עדיין לא תיעדת פגישות. לחץ על הכפתור כדי להתחיל.</p>
                </div>
            ) : (
                <div className="space-y-4"> {/* Changed from grid to space-y-4 */}
                    {meetings.map((meeting) => (
                        <Card key={meeting.id} className="flex flex-col">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg truncate">{meeting.title}</CardTitle>
                                <CardDescription className="text-sm">
                                    עם: <span className="font-medium">{meeting.attendees}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow pt-0">
                                <div
                                    className="text-sm text-gray-600 h-24 overflow-y-auto p-2 border rounded-md bg-gray-50/50 ql-editor-preview"
                                    dangerouslySetInnerHTML={{ __html: meeting.notes }}
                                />
                                <style>{`.ql-editor-preview p { margin: 0; }`}</style>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center bg-gray-50 p-3 rounded-b-lg border-t">
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    <span>{format(new Date(meeting.meeting_date), 'dd/MM/yy', { locale: he })}</span>
                                    <Clock className="w-3 h-3 ml-1" />
                                    <span>{format(new Date(meeting.meeting_date), 'HH:mm', { locale: he })}</span>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(meeting)}>
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(meeting)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setMeetingToDelete(meeting)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <MeetingForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave} // Use new function name
                    meeting={editingMeeting}
                />
            )}

            <MeetingDetailsDialog
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                meeting={viewingMeeting}
            />

            <AlertDialog open={!!meetingToDelete} onOpenChange={() => setMeetingToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-red-500" />
                            אישור מחיקת פגישה
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את הפגישה "{meetingToDelete?.title}"?
                            פעולה זו היא בלתי הפיכה.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete} // Use new function name
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
