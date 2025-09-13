import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar, Clock, User, Type, FileText } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MeetingDetailsDialog({ isOpen, onClose, meeting }) {
    if (!meeting) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] md:max-w-3xl lg:max-w-5xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{meeting.title}</DialogTitle>
                    <DialogDescription>
                        סיכום פגישה עם <strong>{meeting.attendees}</strong>
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] p-1">
                    <div className="space-y-6 py-4 pr-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                            <Calendar className="w-4 h-4" />
                            <span>תאריך:</span>
                            <span className="font-semibold">{format(new Date(meeting.meeting_date), 'd MMMM yyyy', { locale: he })}</span>
                            <Clock className="w-4 h-4 ml-4" />
                            <span>שעה:</span>
                            <span className="font-semibold">{format(new Date(meeting.meeting_date), 'HH:mm')}</span>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> סיכום הפגישה:</h3>
                            <div 
                                className="prose prose-sm max-w-none bg-white p-4 border rounded-md min-h-[200px] ql-editor"
                                dangerouslySetInnerHTML={{ __html: meeting.notes }}
                            />
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={onClose} variant="outline">סגור</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}