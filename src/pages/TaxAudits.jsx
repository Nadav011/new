
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Branch, TaxAudit } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle, FileText, Eye, Calendar, User, AlertCircle, RefreshCw, Building, UserCheck, Landmark, Archive } from 'lucide-react'; // Changed Plus to PlusCircle
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import ExportButton from '../components/ExportButton';

export default function TaxAudits() {
    const [taxAudits, setTaxAudits] = useState([]);
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
        compliance_level: 'not_rated',
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
                TaxAudit.list('-audit_date'),
                Branch.list()
            ]);

            const auditsWithBranches = await Promise.all(
                auditsData.map(async (audit) => {
                    try {
                        const branch = await Branch.get(audit.branch_id);
                        return { ...audit, branchName: branch?.name || 'סניף נמחק' };
                    } catch {
                        return { ...audit, branchName: 'סניף נמחק' };
                    }
                })
            );

            setTaxAudits(auditsWithBranches);
            setBranches(branchesData);
        } catch (error) {
            console.error("Error loading tax audits:", error);
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
            alert('שגיאה בהעלאת הקובץ.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.branch_id || !formData.auditor_name) {
            alert('יש לבחור סניף ולהזין שם מבקר.');
            return;
        }
        
        setIsSaving(true);
        try {
            await TaxAudit.create({ ...formData, source: 'external_report' });
            alert('דוח מס הכנסה/מע"מ החיצוני נשמר בהצלחה!');
            setIsFormOpen(false);
            setFormData({
                branch_id: '',
                audit_date: new Date().toISOString().split('T')[0],
                auditor_name: '',
                findings: '',
                recommendations: '',
                compliance_level: 'not_rated',
                document_url: ''
            });
            await loadData();
        } catch (error) {
            alert('שגיאה בשמירת דוח מס הכנסה/מע"מ.');
        } finally {
            setIsSaving(false);
        }
    };

    const getComplianceBadge = (level) => {
        const colors = {
            'compliant': 'bg-green-100 text-green-800',
            'minor_issues': 'bg-yellow-100 text-yellow-800',
            'major_issues': 'bg-red-100 text-red-800',
            'not_rated': 'bg-gray-100 text-gray-800'
        };
        const texts = {
            'compliant': 'תקין',
            'minor_issues': 'ליקויים קלים',
            'major_issues': 'ליקויים חמורים',
            'not_rated': 'לא הוערך'
        };
        return <Badge className={colors[level]}>{texts[level]}</Badge>;
    };

    const handleViewDetails = (audit) => {
        // This page doesn't exist yet, so we just log for now
        console.log("Viewing details for tax audit:", audit.id);
        // window.location.href = createPageUrl(`TaxAuditDetails?id=${audit.id}`);
    };

    const handleOpenForm = () => {
        setIsFormOpen(true);
    };
    
    const internalAudits = taxAudits.filter(a => a.source === 'internal_audit');
    const externalAudits = taxAudits.filter(a => a.source === 'external_report');

    if (isLoading) return <div>טוען נתונים...</div>;
    if (loadError) return <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg"><AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" /><h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3><p className="text-red-600 mb-4">{loadError}</p><Button onClick={loadData}><RefreshCw className="ml-2 h-4 w-4" /> נסה שוב</Button></div>;

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6"> {/* Added mb-6 */}
                    <h1 className="text-2xl font-bold">ביקורת מס הכנסה/מע"מ</h1> {/* Simplified h1 and removed p tag */}
                    <div className="flex gap-2">
                        <ExportButton audits={taxAudits} reportName="דוח ביקורות מס הכנסה ומע'מ" /> {/* Updated reportName */}
                        <Button onClick={() => handleOpenForm()} className="bg-indigo-600 hover:bg-indigo-700 gap-2"> {/* Changed onClick, icon and text */}
                            <PlusCircle className="ml-2 h-4 w-4" />
                            הוסף ביקורת
                        </Button>
                    </div>
                </div>

                {internalAudits.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-blue-700"><Building className="w-5 h-5" />ביקורות פנימיות ({internalAudits.length})</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>תאריך</TableHead><TableHead>סניף</TableHead><TableHead>מבקר</TableHead><TableHead>סטטוס</TableHead><TableHead>פעולות</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {internalAudits.map((audit) => (
                                        <TableRow key={audit.id}>
                                            <TableCell className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{format(new Date(audit.audit_date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{audit.branchName}</TableCell>
                                            <TableCell className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />{audit.auditor_name}</TableCell>
                                            <TableCell>
                                                {audit.original_audit_status === 'archived' && (
                                                    <Link to={createPageUrl("Archive")}>
                                                        <Badge variant="secondary" className="flex items-center gap-1.5">
                                                            <Archive className="w-3 h-3" />
                                                            מקור בארכיון
                                                        </Badge>
                                                    </Link>
                                                )}
                                            </TableCell>
                                            <TableCell><Button variant="ghost" size="icon" onClick={() => handleViewDetails(audit)}><Eye className="h-4 w-4 text-gray-500" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-purple-700"><UserCheck className="w-5 h-5" />ביקורות חיצוניות ({externalAudits.length})</CardTitle></CardHeader>
                    <CardContent>
                        {externalAudits.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>תאריך</TableHead><TableHead>סניף</TableHead><TableHead>מבקר</TableHead><TableHead>רמת עמידה</TableHead><TableHead>פעולות</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {externalAudits.map((audit) => (
                                        <TableRow key={audit.id}>
                                            <TableCell className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{format(new Date(audit.audit_date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{audit.branchName}</TableCell>
                                            <TableCell className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />{audit.auditor_name}</TableCell>
                                            <TableCell>{getComplianceBadge(audit.compliance_level)}</TableCell>
                                            <TableCell>
                                                {audit.document_url && <a href={audit.document_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><FileText className="h-4 w-4 text-gray-500" /></Button></a>}
                                                <Button variant="ghost" size="icon" onClick={() => handleViewDetails(audit)}><Eye className="h-4 w-4 text-gray-500" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <div className="text-center py-12 text-gray-500"><p>אין ביקורות חיצוניות</p></div>}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} dir="rtl">
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader><DialogTitle>הוספת ביקורת מס חיצונית</DialogTitle><DialogDescription>רישום ביקורת שהתקבלה ממס הכנסה, מע"מ או גורם חיצוני אחר.</DialogDescription></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="branch_id">סניף</Label><Select onValueChange={(v) => handleChange('branch_id', v)} required><SelectTrigger><SelectValue placeholder="בחר סניף..." /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label htmlFor="audit_date">תאריך ביקורת</Label><Input type="date" id="audit_date" value={formData.audit_date} onChange={e => handleChange('audit_date', e.target.value)} required /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="auditor_name">שם המבקר/הגורם</Label><Input id="auditor_name" value={formData.auditor_name} onChange={e => handleChange('auditor_name', e.target.value)} required /></div>
                            <div><Label htmlFor="compliance_level">רמת עמידה</Label><Select value={formData.compliance_level} onValueChange={(v) => handleChange('compliance_level', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not_rated">לא הוערך</SelectItem><SelectItem value="compliant">תקין</SelectItem><SelectItem value="minor_issues">ליקויים קלים</SelectItem><SelectItem value="major_issues">ליקויים חמורים</SelectItem></SelectContent></Select></div>
                        </div>
                        <div><Label htmlFor="findings">ממצאים</Label><Textarea id="findings" value={formData.findings} onChange={e => handleChange('findings', e.target.value)} /></div>
                        <div><Label htmlFor="recommendations">המלצות</Label><Textarea id="recommendations" value={formData.recommendations} onChange={e => handleChange('recommendations', e.target.value)} /></div>
                        <div>
                            <Label htmlFor="doc-upload">מסמך מצורף</Label>
                            <Input id="doc-upload" type="file" onChange={e => handleFileUpload(e.target.files[0])} disabled={isUploading} className="mt-1" />
                            {isUploading && <p className="text-sm text-blue-600 mt-1">מעלה קובץ...</p>}
                            {formData.document_url && <a href={formData.document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 mt-1 block">צפה בקובץ שהועלה</a>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>ביטול</Button>
                            <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">{isSaving ? 'שומר...' : 'שמור ביקורת'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
