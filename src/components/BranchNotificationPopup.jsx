import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ClipboardList, Bell, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BranchNotificationPopup({ notification, isOpen, onClose }) {
    console.log('🎨 BranchNotificationPopup render:', { notification, isOpen });
    
    if (!notification) {
        console.log('⚠️ No notification data');
        return null;
    }

    const getIcon = () => {
        switch (notification.type) {
            case 'branch_task_assigned':
                return <ClipboardList className="w-8 h-8 text-blue-500" />;
            case 'branch_audit_response_required':
                return <AlertCircle className="w-8 h-8 text-red-500" />;
            default:
                return <Bell className="w-8 h-8 text-gray-500" />;
        }
    };

    const getTitle = () => {
        switch (notification.type) {
            case 'branch_task_assigned':
                return '🎯 משימה חדשה!';
            case 'branch_audit_response_required':
                return '⚠️ ביקורת חדשה!';
            default:
                return '🔔 התראה חדשה';
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'גבוהה': 'bg-red-100 text-red-800',
            'בינונית': 'bg-yellow-100 text-yellow-800',
            'נמוכה': 'bg-blue-100 text-blue-800',
            'high': 'bg-red-100 text-red-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'low': 'bg-blue-100 text-blue-800'
        };
        return colors[priority] || colors.medium;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-lg">
                        {getIcon()}
                        <span>{getTitle()}</span>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="bg-blue-50 border-r-4 border-blue-400 p-4 rounded-lg">
                        <p className="font-medium text-gray-900 mb-2">
                            {notification.message}
                        </p>
                        
                        {notification.branch_name && (
                            <p className="text-sm text-gray-600 mb-3">
                                <span className="font-medium">סניף:</span> {notification.branch_name}
                            </p>
                        )}

                        {notification.priority && (
                            <Badge className={getPriorityColor(notification.priority)}>
                                דחיפות: {notification.priority}
                            </Badge>
                        )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">
                            💡 כדי לצפות בפרטים המלאים ולטפל במשימה, לחץ על "צפה במשימות" למטה.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={onClose}>
                        סגור
                    </Button>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link to={notification.link || '/MyTasks'} onClick={onClose}>
                            <ExternalLink className="w-4 h-4 ml-2" />
                            צפה במשימות
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}