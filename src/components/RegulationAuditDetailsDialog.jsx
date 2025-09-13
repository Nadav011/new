import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { FileText, Calendar, User, Building } from 'lucide-react';

export default function RegulationAuditDetailsDialog({ isOpen, onClose, audit, auditType }) {
    if (!audit) return null;

    const responses = audit.accessibility_responses?.responses || audit.health_responses?.responses || [];
    const title = auditType === 'נגישות' ? 'פרטי ביקורת נגישות פנימית' : 'פרטי ביקורת תברואה פנימית';

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        הנתונים נאספו מתוך ביקורת רשת שבוצעה בסניף.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2"><Building className="w-4 h-4 text-gray-500"/><strong>סניף:</strong> {audit.branchName}</div>
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500"/><strong>תאריך:</strong> {format(new Date(audit.audit_date), 'dd/MM/yyyy')}</div>
                        <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500"/><strong>מבקר:</strong> {audit.auditor_name}</div>
                    </div>
                    
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <h3 className="font-semibold text-lg border-b pb-2">שאלות ותשובות</h3>
                        {responses.length > 0 ? responses.map((res, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-gray-50/50">
                                <p className="font-medium">{res.question_text}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <Badge variant={res.response_value === "לא תקין" ? "destructive" : "secondary"}>
                                        {res.response_value || 'לא נרשמה תשובה'}
                                    </Badge>
                                    
                                    {res.file_urls && res.file_urls.length > 0 && (
                                        <div className="flex gap-2">
                                            {res.file_urls.map((url, fileIndex) => (
                                                <a key={fileIndex} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                    <FileText className="w-5 h-5" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500">לא נמצאו תשובות רלוונטיות מביקורת הרשת.</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}