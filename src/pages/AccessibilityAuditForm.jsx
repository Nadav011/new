
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Branch, AccessibilityAudit } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Shield, Eye, Edit, Calendar, User, FileText, ArrowRight, AlertCircle, RefreshCw, Building, UserCheck, Upload, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { UploadFile } from '@/api/integrations';

export default function AccessibilityAuditForm() {
    const [accessibilityAudits, setAccessibilityAudits] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        branch_id: '',
        audit_date: new Date().toISOString().split('T')[0],
        auditor_name: '',
        findings: '',
        recommendations: '',
        compliance_level: 'not_calculated',
        document_url: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [auditsData, branchesData] = await Promise.all([
                AccessibilityAudit.list('-audit_date'),
                Branch.list()
            ]);

            // Add branch names to audits
            const auditsWithBranches = await Promise.all(
                auditsData.map(async (audit) => {
                    try {
                        const branch = await Branch.get(audit.branch_id);
                        return { ...audit, branchName: branch?.name || 'סניף נמחק' };
                    } catch (error) {
                        console.error(`Error getting branch for audit ${audit.id}:`, error);
                        return { ...audit, branchName: 'סניף נמחק' };
                    }
                })
            );

            setAccessibilityAudits(auditsWithBranches);
            setBranches(branchesData);
        } catch (error) {
            console.error("Error loading data:", error);
            setLoadError("אירעה שגיאת רשת. לא ניתן היה לטעון את נתוני הביקורות.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await UploadFile({ file });
            handleChange('document_url', result.file_url);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('שגיאה בהעלאת הקובץ');
        }
        setIsUploading(false);
    };

    const removeFile = () => {
        handleChange('document_url', '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.branch_id || !formData.auditor_name) {
            alert('יש לבחור סניף ולהזין שם מבקר.');
            return;
        }
        
        setIsSaving(true);
        try {
            await AccessibilityAudit.create({
                ...formData,
                source: 'external_report'
            });
            alert('דוח הנגישות החיצוני נשמר בהצלחה!');
            setIsFormOpen(false);
            setFormData({
                branch_id: '',
                audit_date: new Date().toISOString().split('T')[0],
                auditor_name: '',
                findings: '',
                recommendations: '',
                compliance_level: 'not_calculated',
                document_url: ''
            });
            await loadData();
        } catch (error) {
            console.error("Failed to save accessibility audit:", error);
            alert('שגיאה בשמירת דוח הנגישות.');
        } finally {
            setIsSaving(false);
        }
    };

    const getComplianceBadge = (level) => {
        const colors = {
            'full': 'bg-green-100 text-green-800',
            'partial': 'bg-yellow-100 text-yellow-800',
            'non_compliant': 'bg-red-100 text-red-800',
            'not_calculated': 'bg-gray-100 text-gray-800'
        };
        const texts = {
            'full': 'עמידה מלאה',
            'partial': 'עמידה חלקית',
            'non_compliant': 'אי עמידה',
            'not_calculated': 'לא חושב'
        };
        return <Badge className={colors[level] || colors.not_calculated}>{texts[level] || texts.not_calculated}</Badge>;
    };

    const getSourceBadge = (source) => {
        const colors = {
            'internal_audit': 'bg-blue-100 text-blue-800',
            'external_report': 'bg-purple-100 text-purple-800'
        };
        const texts = {
            'internal_audit': 'ביקורת פנימית',
            'external_report': 'דוח חיצוני'
        };
        const icons = {
            'internal_audit': <Building className="w-3 h-3 mr-1" />,
            'external_report': <UserCheck className="w-3 h-3 mr-1" />
        };
        return (
            <Badge className={colors[source] || colors.external_report}>
                <div className="flex items-center">
                    {icons[source]}
                    {texts[source] || texts.external_report}
                </div>
            </Badge>
        );
    };

    // Separate audits by source
    const internalAudits = accessibilityAudits.filter(audit => audit.source === 'internal_audit');
    const externalAudits = accessibilityAudits.filter(audit => audit.source === 'external_report');

    if (isLoading) return <div>טוען נתונים...</div>;

    if (loadError) return (
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
            <p className="text-red-600 mb-4">{loadError}</p>
            <Button onClick={loadData}><RefreshCw className="ml-2 h-4 w-4" /> נסה שוב</Button>
        </div>
    );

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-blue-600" />
                            ביקורת נגישות
                        </h1>
                        <p className="text-gray-600">כל ביקורות הנגישות - פנימיות וחיצוניות</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to={createPageUrl('AccessibilityAudits')}>
                            <Button variant="outline" className="gap-2">
                                <ArrowRight className="w-4 h-4" />
                                ניהול אישורי נגישות
                            </Button>
                        </Link>
                        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                            <Plus className="w-4 h-4" />
                            הוספת ביקורת חיצונית
                        </Button>
                    </div>
                </div>

                {/* Internal Audits */}
                {internalAudits.length > 0 && (
                    <Card className="border-blue-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-700">
                                <Building className="w-5 h-5" />
                                ביקורות נגישות פנימיות ({internalAudits.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>תאריך</TableHead>
                                        <TableHead>סניף</TableHead>
                                        <TableHead>מבקר</TableHead>
                                        <TableHead>מקור</TableHead>
                                        <TableHead>רמת עמידה</TableHead>
                                        <TableHead>פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {internalAudits.map((audit) => (
                                        <TableRow key={audit.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">
                                                            {format(new Date(audit.audit_date), 'dd/MM/yyyy')}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {format(new Date(audit.audit_date), 'EEEE', { locale: he })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{audit.branchName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    {audit.auditor_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getSourceBadge(audit.source)}</TableCell>
                                            <TableCell>{getComplianceBadge(audit.compliance_level)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" title="צפה בפרטים">
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* External Audits */}
                <Card className="border-purple-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-700">
                            <UserCheck className="w-5 h-5" />
                            ביקורות נגישות חיצוניות ({externalAudits.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {externalAudits.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>תאריך</TableHead>
                                        <TableHead>סניף</TableHead>
                                        <TableHead>מבקר</TableHead>
                                        <TableHead>מקור</TableHead>
                                        <TableHead>רמת עמידה</TableHead>
                                        <TableHead>מסמך</TableHead>
                                        <TableHead>פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {externalAudits.map((audit) => (
                                        <TableRow key={audit.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium">
                                                            {format(new Date(audit.audit_date), 'dd/MM/yyyy')}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {format(new Date(audit.audit_date), 'EEEE', { locale: he })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{audit.branchName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    {audit.auditor_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getSourceBadge(audit.source)}</TableCell>
                                            <TableCell>{getComplianceBadge(audit.compliance_level)}</TableCell>
                                            <TableCell>
                                                {audit.document_url ? (
                                                    <a 
                                                        href={audit.document_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="צפה במסמך"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400" title="אין מסמך מצורף">אין מסמך</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" title="צפה בפרטים">
                                                    <Eye className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">אין ביקורות נגישות חיצוניות</p>
                                <p className="text-sm">התחילו בהוספת ביקורת נגישות חיצונית</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Show message if no audits at all */}
                {accessibilityAudits.length === 0 && (
                    <Card>
                        <CardContent>
                            <div className="text-center py-12 text-gray-500">
                                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">אין ביקורות נגישות</p>
                                <p className="text-sm">התחילו בהוספת ביקורת נגישות חיצונית או בצעו ביקורת רשת הכוללת שאלות נגישות</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* הוספת ביקורת חיצונית */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} dir="rtl">
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>הוספת ביקורת נגישות חיצונית</DialogTitle>
                        <DialogDescription>
                            רישום ביקורת נגישות שהתקבלה מגורם חיצוני
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="branch_id">סניף</Label>
                                <Select onValueChange={(value) => handleChange('branch_id', value)} required>
                                    <SelectTrigger><SelectValue placeholder="בחר סניף..." /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="audit_date">תאריך ביקורת</Label>
                                <Input 
                                    type="date" 
                                    id="audit_date" 
                                    value={formData.audit_date} 
                                    onChange={e => handleChange('audit_date', e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="auditor_name">שם המבקר / הגורם החיצוני</Label>
                                <Input 
                                    id="auditor_name" 
                                    value={formData.auditor_name} 
                                    onChange={e => handleChange('auditor_name', e.target.value)} 
                                    placeholder="הזן שם"
                                    required 
                                />
                            </div>
                            <div>
                                <Label htmlFor="compliance_level">רמת עמידה בתקנות</Label>
                                <Select onValueChange={(value) => handleChange('compliance_level', value)} value={formData.compliance_level}>
                                    <SelectTrigger><SelectValue placeholder="בחר רמת עמידה..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="not_calculated">לא חושב</SelectItem>
                                        <SelectItem value="full">עמידה מלאה</SelectItem>
                                        <SelectItem value="partial">עמידה חלקית</SelectItem>
                                        <SelectItem value="non_compliant">אי עמידה</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div>
                            <Label htmlFor="findings">ממצאים</Label>
                            <Textarea 
                                id="findings" 
                                value={formData.findings} 
                                onChange={e => handleChange('findings', e.target.value)}
                                placeholder="תאר את הממצאים העיקריים של הביקורת..."
                                className="h-24"
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="recommendations">המלצות לשיפור</Label>
                            <Textarea 
                                id="recommendations" 
                                value={formData.recommendations} 
                                onChange={e => handleChange('recommendations', e.target.value)}
                                placeholder="רשום המלצות לשיפור הנגישות..."
                                className="h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>העלאת מסמך דוח</Label>
                            {formData.document_url ? (
                                <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                                    <FileText className="w-4 h-4 text-green-600" />
                                    <a
                                        href={formData.document_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:underline flex-1 truncate"
                                    >
                                        צפה בקובץ שהועלה
                                    </a>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={removeFile}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={(e) => handleFileUpload(e.target.files[0])}
                                        className="hidden"
                                        id="document-upload"
                                    />
                                    <label
                                        htmlFor="document-upload"
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100"
                                    >
                                        {isUploading ? (
                                            <>מעלה קובץ...</>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                העלה דוח / מסמך
                                            </>
                                        )}
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PDF, Word, או תמונות עד 10MB
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                ביטול
                            </Button>
                            <Button type="submit" disabled={isSaving || isUploading} className="bg-blue-600 hover:bg-blue-700">
                                {isSaving ? 'שומר...' : 'שמור ביקורת'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
