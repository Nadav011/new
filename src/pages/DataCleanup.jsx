import React, { useState } from 'react';
import { HealthAudit, AccessibilityAudit, MinistryAudit, TaxAudit } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function DataCleanup() {
    const [healthAudits, setHealthAudits] = useState([]);
    const [accessibilityAudits, setAccessibilityAudits] = useState([]);
    const [ministryAudits, setMinistryAudits] = useState([]);
    const [taxAudits, setTaxAudits] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [auditTypeToClean, setAuditTypeToClean] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [health, accessibility, ministry, tax] = await Promise.all([
                HealthAudit.filter({ source: 'internal_audit' }),
                AccessibilityAudit.filter({ source: 'internal_audit' }),
                MinistryAudit.filter({ source: 'internal_audit' }),
                TaxAudit.filter({ source: 'internal_audit' })
            ]);
            
            setHealthAudits(health);
            setAccessibilityAudits(accessibility);
            setMinistryAudits(ministry);
            setTaxAudits(tax);
        } catch (error) {
            console.error("Error loading data:", error);
            alert('שגיאה בטעינת הנתונים');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    const handleDeleteAll = async (auditType) => {
        try {
            let auditsToDelete = [];
            
            switch (auditType) {
                case 'health':
                    auditsToDelete = healthAudits;
                    break;
                case 'accessibility':
                    auditsToDelete = accessibilityAudits;
                    break;
                case 'ministry':
                    auditsToDelete = ministryAudits;
                    break;
                case 'tax':
                    auditsToDelete = taxAudits;
                    break;
            }

            const deletePromises = auditsToDelete.map(audit => {
                switch (auditType) {
                    case 'health':
                        return HealthAudit.delete(audit.id);
                    case 'accessibility':
                        return AccessibilityAudit.delete(audit.id);
                    case 'ministry':
                        return MinistryAudit.delete(audit.id);
                    case 'tax':
                        return TaxAudit.delete(audit.id);
                    default:
                        return Promise.resolve();
                }
            });

            await Promise.all(deletePromises);
            alert(`נמחקו ${auditsToDelete.length} ביקורות בהצלחה!`);
            await loadData();
            setShowDeleteDialog(false);
        } catch (error) {
            console.error("Error deleting audits:", error);
            alert('שגיאה במחיקת הביקורות');
        }
    };

    const confirmDelete = (auditType) => {
        setAuditTypeToClean(auditType);
        setShowDeleteDialog(true);
    };

    const getAuditTypeName = (type) => {
        const names = {
            'health': 'תברואה',
            'accessibility': 'נגישות',
            'ministry': 'משרד התמ"ת',
            'tax': 'מס הכנסה/מע"מ'
        };
        return names[type] || type;
    };

    const getAuditCount = (type) => {
        const counts = {
            'health': healthAudits.length,
            'accessibility': accessibilityAudits.length,
            'ministry': ministryAudits.length,
            'tax': taxAudits.length
        };
        return counts[type] || 0;
    };

    return (
        <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h2 className="font-semibold text-yellow-800">כלי ניקוי נתונים</h2>
                </div>
                <p className="text-yellow-700 text-sm">
                    כלי זה מיועד למחיקת ביקורות פנימיות קיימות שנוצרו לפני עדכון המערכת. 
                    השתמש בזהירות - פעולה זו בלתי הפיכה!
                </p>
            </div>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">ניקוי ביקורות פנימיות קיימות</h1>
                <Button onClick={loadData} disabled={isLoading} variant="outline">
                    <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                    רענן נתונים
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['health', 'accessibility', 'ministry', 'tax'].map(auditType => (
                    <Card key={auditType}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>ביקורות {getAuditTypeName(auditType)}</span>
                                <Badge variant="outline">{getAuditCount(auditType)} ביקורות</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                ביקורות פנימיות קיימות שנוצרו מביקורות רשת. 
                                מחיקתן תאפשר למערכת לעבוד עם הלוגיקה החדשה.
                            </p>
                            <Button 
                                variant="destructive" 
                                onClick={() => confirmDelete(auditType)}
                                disabled={getAuditCount(auditType) === 0}
                                className="w-full"
                            >
                                <Trash2 className="w-4 h-4 ml-2" />
                                מחק את כל הביקורות ({getAuditCount(auditType)})
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את כל {getAuditCount(auditTypeToClean)} ביקורות ה{getAuditTypeName(auditTypeToClean)}?
                            <br />
                            <strong className="text-red-600">פעולה זו בלתי הפיכה!</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => handleDeleteAll(auditTypeToClean)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            מחק הכל
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}