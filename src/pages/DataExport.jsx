
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, RefreshCw, DatabaseZap, Store, ClipboardList, BookOpen, CheckSquare, HardHat, User, Megaphone, Library, Briefcase, CheckCircle } from 'lucide-react';
import * as entities from '@/api/entities';
import { BackupLog } from '@/api/entities';

const entitiesToExport = [
    { name: 'סניפים', entity: entities.Branch, icon: <Store className="w-5 h-5 text-indigo-500" /> },
    { name: 'משתמשים', entity: entities.User, icon: <User className="w-5 h-5 text-gray-500" /> },
    { name: 'בעלויות סניפים', entity: entities.BranchOwnership, icon: <User className="w-5 h-5 text-gray-500" /> },
    { name: 'ביקורות רשת', entity: entities.Audit, icon: <ClipboardList className="w-5 h-5 text-blue-500" /> },
    { name: 'תשובות לביקורות', entity: entities.AuditResponse, icon: <ClipboardList className="w-5 h-5 text-blue-400" /> },
    { name: 'שאלות ביקורת', entity: entities.AuditQuestion, icon: <ClipboardList className="w-5 h-5 text-blue-300" /> },
    { name: 'הגדרות שאלונים', entity: entities.QuestionnaireSettings, icon: <ClipboardList className="w-5 h-5 text-blue-600" /> },
    { name: 'נושאי שאלות', entity: entities.QuestionTopic, icon: <ClipboardList className="w-5 h-5 text-blue-200" /> },
    { name: 'מיקומים בעסק', entity: entities.BusinessLocation, icon: <ClipboardList className="w-5 h-5 text-blue-100" /> },
    { name: 'ביקורים מתוכננים', entity: entities.PlannedVisit, icon: <ClipboardList className="w-5 h-5 text-blue-500" /> },
    { name: 'ביקורות נגישות', entity: entities.AccessibilityAudit, icon: <ClipboardList className="w-5 h-5 text-green-500" /> },
    { name: 'ביקורי נגישות מתוכננים', entity: entities.PlannedAccessibilityVisit, icon: <ClipboardList className="w-5 h-5 text-green-500" /> },
    { name: 'ביקורות משרד הבריאות', entity: entities.HealthAudit, icon: <ClipboardList className="w-5 h-5 text-red-500" /> },
    { name: 'ביקורות משרד התמ"ת', entity: entities.MinistryAudit, icon: <ClipboardList className="w-5 h-5 text-orange-500" /> },
    { name: 'ביקורות מס הכנסה', entity: entities.TaxAudit, icon: <ClipboardList className="w-5 h-5 text-yellow-500" /> },
    { name: 'פריטי צק-ליסט משרד התמ"ת', entity: entities.MinistryChecklistItem, icon: <ClipboardList className="w-5 h-5 text-orange-500" /> },
    { name: 'תלונות לקוחות', entity: entities.CustomerComplaint, icon: <Megaphone className="w-5 h-5 text-pink-500" /> },
    { name: 'תלונות זכיינים', entity: entities.Complaint, icon: <Megaphone className="w-5 h-5 text-purple-500" /> },
    { name: 'הדרכות', entity: entities.Training, icon: <BookOpen className="w-5 h-5 text-cyan-500" /> },
    { name: 'רישומי הדרכות', entity: entities.TrainingRecord, icon: <BookOpen className="w-5 h-5 text-cyan-400" /> },
    { name: 'משימות רשתיות', entity: entities.NetworkTask, icon: <CheckSquare className="w-5 h-5 text-teal-500" /> },
    { name: 'רישומי משימות רשתיות', entity: entities.NetworkTaskRecord, icon: <CheckSquare className="w-5 h-5 text-teal-400" /> },
    { name: 'הקמות סניפים', entity: entities.BranchSetup, icon: <HardHat className="w-5 h-5 text-lime-500" /> },
    { name: 'משימות הקמה (צק-ליסט)', entity: entities.SetupTask, icon: <HardHat className="w-5 h-5 text-lime-400" /> },
    { name: 'התקדמות הקמת סניף', entity: entities.BranchSetupProgress, icon: <HardHat className="w-5 h-5 text-lime-300" /> },
    { name: 'אנשי קשר מקצועיים לשיפוץ', entity: entities.RenovationProfessional, icon: <User className="w-5 h-5 text-gray-500" /> },
    { name: 'תפקידי שיפוץ', entity: entities.RenovationRole, icon: <User className="w-5 h-5 text-gray-400" /> },
    { name: 'קטגוריות שיפוץ', entity: entities.RenovationCategory, icon: <User className="w-5 h-5 text-gray-300" /> },
    { name: 'מסמכים רשמיים', entity: entities.OfficialDocument, icon: <Library className="w-5 h-5 text-amber-500" /> },
    { name: 'קטגוריות מסמכים', entity: entities.DocumentCategory, icon: <Library className="w-5 h-5 text-amber-400" /> },
    { name: 'מתעניינים בזכיון', entity: entities.FranchiseInquiry, icon: <Briefcase className="w-5 h-5 text-fuchsia-500" /> },
    { name: 'פריטים שנמחקו (ארכיון)', entity: entities.DeletedItem, icon: <DatabaseZap className="w-5 h-5 text-red-700" /> },
];


export default function DataExport() {
    const [loadingStates, setLoadingStates] = useState({});
    const [isExportingAll, setIsExportingAll] = useState(false);
    const [exportAllProgress, setExportAllProgress] = useState(0);
    const [lastBackupInfo, setLastBackupInfo] = useState(null);

    useEffect(() => {
        fetchLastBackupInfo();
    }, []);

    const fetchLastBackupInfo = async () => {
        try {
            // Fetch the latest backup log by sorting by backup_date descending and taking the first one
            const backupLogs = await BackupLog.list('-backup_date', 1);
            if (backupLogs.length > 0) {
                setLastBackupInfo(backupLogs[0]);
            }
        } catch (error) {
            console.error('Error fetching backup info:', error);
        }
    };

    const downloadFile = (content, fileName, contentType) => {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return "";
        const replacer = (key, value) => value === null ? '' : value;
        const header = Object.keys(data[0]);
        let csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
        csv.unshift(header.join(','));
        return csv.join('\r\n');
    };

    const handleExport = async (entityInfo, format) => {
        const entityKey = `${entityInfo.entity.name}_${format}`;
        setLoadingStates(prev => ({ ...prev, [entityKey]: true }));

        try {
            const data = await entityInfo.entity.list();
            const date = new Date().toISOString().slice(0, 10);
            let fileContent;
            let fileName;

            if (format === 'json') {
                fileContent = JSON.stringify(data, null, 2);
                fileName = `backup_${entityInfo.entity.name}_${date}.json`;
                downloadFile(fileContent, fileName, 'application/json');
            } else if (format === 'csv') {
                fileContent = convertToCSV(data);
                fileName = `backup_${entityInfo.entity.name}_${date}.csv`;
                downloadFile("\uFEFF" + fileContent, fileName, 'text/csv;charset=utf-8;');
            }
        } catch (error) {
            console.error(`Failed to export ${entityInfo.name}:`, error);
            alert(`שגיאה בייצוא ${entityInfo.name}`);
        } finally {
            setLoadingStates(prev => ({ ...prev, [entityKey]: false }));
        }
    };
    
    const handleExportAll = async () => {
        setIsExportingAll(true);
        setExportAllProgress(0);

        const allData = {};
        for (let i = 0; i < entitiesToExport.length; i++) {
            const entityInfo = entitiesToExport[i];
            try {
                const data = await entityInfo.entity.list();
                allData[entityInfo.name] = data;
            } catch (error) {
                console.error(`Failed to fetch data for ${entityInfo.name}:`, error);
                alert(`שגיאה בייצוא ${entityInfo.name}`);
            }
            setExportAllProgress(((i + 1) / entitiesToExport.length) * 100);
        }
        
        const date = new Date().toISOString().slice(0, 10);
        const backupContent = {
            backup_date: new Date().toISOString(),
            data: allData
        };

        const fileContent = JSON.stringify(backupContent, null, 2);
        const fileName = `full_manual_backup_${date}.json`;
        downloadFile(fileContent, fileName, 'application/json');

        setIsExportingAll(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <DatabaseZap className="w-7 h-7" />
                ייצוא וגיבוי נתונים
            </h1>
            <div className="flex flex-col gap-4">
                <p className="text-gray-600">
                    כאן ניתן לייצא את כל המידע מהמערכת לקבצי גיבוי. 
                    מומלץ לבצע גיבוי תקופתי של המידע החשוב לכם.
                </p>
                {lastBackupInfo && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">גיבוי אחרון</span>
                        </div>
                        <div className="text-sm text-green-700">
                            <div>תאריך: {new Date(lastBackupInfo.backup_date).toLocaleString('he-IL')}</div>
                            <div>בוצע על ידי: {lastBackupInfo.performed_by_email}</div>
                            <div>סטטוס: {lastBackupInfo.status === 'success' ? 'הצליח' : lastBackupInfo.status === 'partial' ? 'חלקי' : 'נכשל'}</div>
                            {lastBackupInfo.notes && <div>הערות: {lastBackupInfo.notes}</div>}
                        </div>
                    </div>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center flex-wrap gap-2">
                        <span>רשימת טבלאות נתונים לייצוא</span>
                        <Button onClick={handleExportAll} disabled={isExportingAll}>
                            {isExportingAll ? 
                                <><RefreshCw className="w-4 h-4 ml-2 animate-spin" />מייצא ({Math.round(exportAllProgress)}%)...</> :
                                <><Download className="w-4 h-4 ml-2" />הורד הכל (גיבוי מלא)</>
                            }
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[250px]">שם טבלת הנתונים</TableHead>
                                    <TableHead>פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entitiesToExport.map((entityInfo) => (
                                    <TableRow key={entityInfo.entity.name} className="hover:bg-gray-50/50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                {entityInfo.icon}
                                                <span>{entityInfo.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExport(entityInfo, 'json')}
                                                    disabled={loadingStates[`${entityInfo.entity.name}_json`]}
                                                >
                                                    {loadingStates[`${entityInfo.entity.name}_json`] ?
                                                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" /> :
                                                        <Download className="w-4 h-4 ml-2" />
                                                    }
                                                    ייצא ל-JSON
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExport(entityInfo, 'csv')}
                                                    disabled={loadingStates[`${entityInfo.entity.name}_csv`]}
                                                >
                                                    {loadingStates[`${entityInfo.entity.name}_csv`] ?
                                                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" /> :
                                                        <Download className="w-4 h-4 ml-2" />
                                                    }
                                                    ייצא ל-CSV (אקסל)
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
