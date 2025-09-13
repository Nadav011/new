import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MessageCircle, Phone, Calendar } from 'lucide-react';

export default function WhatsAppConfirmDialog({ open, onOpenChange, inquiry, onConfirm }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            await onConfirm();
        } finally {
            setIsProcessing(false);
        }
    };

    if (!inquiry) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange} dir="rtl">
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                        אישור שליחת הודעת ווטסאפ
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-right">
                        <div className="space-y-2">
                            <p>האם שלחת הודעת ווטסאפ ל<strong>{inquiry.full_name}</strong>?</p>
                            <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <span>{inquiry.phone}</span>
                                </div>
                                <div className="text-gray-600">
                                    במידה ואישרת, המערכת תיצור עבורך משימה לקביעת פגישה עם המתעניין.
                                </div>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isProcessing}>לא / ביטול</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleConfirm} 
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Calendar className="ml-2 h-4 w-4" />
                        {isProcessing ? 'יוצר משימה...' : 'כן, יצור משימה לקביעת פגישה'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}