import React, { useState, useEffect } from 'react';
import { Branch, MinistryAudit, MinistryChecklistItem } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Save, X, Settings, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MinistryInternalAuditForm({ open, onOpenChange, onSave }) {
    const [branches, setBranches] = useState([]);
    const [checklistItems, setChecklistItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [formData, setFormData] = useState({
        branch_id: '',
        audit_date: new Date().toISOString().split('T')[0],
        auditor_name: '',
        findings: '',
        recommendations: '',
        compliance_level: 'not_rated'
    });
    const [checklistResponses, setChecklistResponses] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [branchesData, checklistData] = await Promise.all([
                Branch.list(),
                MinistryChecklistItem.filter({ is_active: true })
            ]);
            setBranches(branchesData);
            setChecklistItems(checklistData.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
        } catch (error) {
            console.error("Error loading data:", error);
            setLoadError("שגיאה בטעינת הנתונים");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleChecklistChange = (itemId, field, value) => {
        setChecklistResponses(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };

    const calculateComplianceLevel = () => {
        const totalRequired = checklistItems.filter(item => item.is_required).length;
        if (totalRequired === 0) return 'not_rated';
        
        const completedRequired = checklistItems
            .filter(item => item.is_required && checklistResponses[item.id]?.status === 'compliant')
            .length;
        
        const percentage = (completedRequired / totalRequired) * 100;
        
        if (percentage >= 90) return 'compliant';
        if (percentage >= 70) return 'minor_issues';
        return 'major_issues';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const auditData = {
                ...formData,
                source: 'internal_audit',
                compliance_level: calculateComplianceLevel(),
                ministry_responses: {
                    checklist: checklistResponses,
                    metadata: {
                        total_items: checklistItems.length,
                        completed_items: Object.keys(checklistResponses).length,
                        audit_date: new Date().toISOString()
                    }
                }
            };

            await MinistryAudit.create(auditData);
            onSave?.();
            onOpenChange(false);
            
            // Reset form
            setFormData({
                branch_id: '',
                audit_date: new Date().toISOString().split('T')[0],
                auditor_name: '',
                findings: '',
                recommendations: '',
                compliance_level: 'not_rated'
            });
            setChecklistResponses({});
            
        } catch (error) {
            console.error("Error saving audit:", error);
            alert('שגיאה בשמירת הביקורת');
        } finally {
            setIsSaving(false);
        }
    };

    const getComplianceBadgeColor = (level) => {
        const colors = {
            'compliant': 'bg-green-100 text-green-800',
            'minor_issues': 'bg-yellow-100 text-yellow-800',
            'major_issues': 'bg-red-100 text-red-800',
            'not_rated': 'bg-gray-100 text-gray-800'
        };
        return colors[level] || colors['not_rated'];
    };

    const getComplianceText = (level) => {
        const texts = {
            'compliant': 'תקין',
            'minor_issues': 'ליקויים קלים',
            'major_issues': 'ליקויים חמורים',
            'not_rated': 'לא הוערך'
        };
        return texts[level] || texts['not_rated'];
    };

    const groupedItems = checklistItems.reduce((acc, item) => {
        const category = item.category || 'אחר';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    return (
        <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>ביקורת פנימית - משרד התמ״ת</DialogTitle>
                        <Link to={createPageUrl('MinistryChecklistManager')}>
                            <Button variant="outline" size="sm">
                                <Settings className="ml-2 h-4 w-4" />
                                ערוך צ'ק-ליסט
                            </Button>
                        </Link>
                    </div>
                </DialogHeader>
                
                {isLoading && (
                    <div className="flex justify-center p-8">
                        <div>טוען נתונים...</div>
                    </div>
                )}

                {loadError && (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-red-600">{loadError}</p>
                        <Button onClick={loadData} className="mt-4" variant="outline">נסה שוב</Button>
                    </div>
                )}

                {!isLoading && !loadError && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>פרטי ביקורת</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="branch_id">סניף *</Label>
                                        <Select value={formData.branch_id} onValueChange={(v) => handleChange('branch_id', v)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="בחר סניף..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map(branch => (
                                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="audit_date">תאריך ביקורت *</Label>
                                        <Input
                                            type="date"
                                            value={formData.audit_date}
                                            onChange={(e) => handleChange('audit_date', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="auditor_name">שם המבקר *</Label>
                                    <Input
                                        value={formData.auditor_name}
                                        onChange={(e) => handleChange('auditor_name', e.target.value)}
                                        placeholder="הכנס שם המבקר..."
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>צ'ק-ליסט ביקורת</CardTitle>
                                    <Badge className={getComplianceBadgeColor(calculateComplianceLevel())}>
                                        רמת ציות: {getComplianceText(calculateComplianceLevel())}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {Object.keys(groupedItems).length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>לא הוגדרו פריטים בצ'ק-ליסט</p>
                                        <Link to={createPageUrl('MinistryChecklistManager')}>
                                            <Button className="mt-2" variant="outline">
                                                <Settings className="ml-2 h-4 w-4" />
                                                הגדר צ'ק-ליסט
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    Object.entries(groupedItems).map(([category, items]) => (
                                        <div key={category} className="mb-6">
                                            <h4 className="font-semibold text-lg mb-3 text-blue-700 border-b pb-2">{category}</h4>
                                            <div className="space-y-4">
                                                {items.map((item) => (
                                                    <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <h5 className="font-medium flex items-center gap-2">
                                                                    {item.title}
                                                                    {item.is_required && <Badge variant="outline" className="text-xs">חובה</Badge>}
                                                                </h5>
                                                                {item.description && (
                                                                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="space-y-3">
                                                            <div>
                                                                <Label className="text-sm font-medium">סטטוס</Label>
                                                                <Select
                                                                    value={checklistResponses[item.id]?.status || ''}
                                                                    onValueChange={(value) => handleChecklistChange(item.id, 'status', value)}
                                                                >
                                                                    <SelectTrigger className="mt-1">
                                                                        <SelectValue placeholder="בחר סטטוס..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="compliant">תקין</SelectItem>
                                                                        <SelectItem value="partial">תקין חלקי</SelectItem>
                                                                        <SelectItem value="non_compliant">לא תקין</SelectItem>
                                                                        <SelectItem value="not_applicable">לא רלוונטי</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            
                                                            <div>
                                                                <Label className="text-sm font-medium">הערות</Label>
                                                                <Textarea
                                                                    className="mt-1"
                                                                    placeholder="הערות והסברים..."
                                                                    value={checklistResponses[item.id]?.notes || ''}
                                                                    onChange={(e) => handleChecklistChange(item.id, 'notes', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>סיכום הביקורת</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="findings">ממצאים עיקריים</Label>
                                    <Textarea
                                        value={formData.findings}
                                        onChange={(e) => handleChange('findings', e.target.value)}
                                        placeholder="פרט את הממצאים העיקריים של הביקורת..."
                                        rows={4}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="recommendations">המלצות לשיפור</Label>
                                    <Textarea
                                        value={formData.recommendations}
                                        onChange={(e) => handleChange('recommendations', e.target.value)}
                                        placeholder="רשום את ההמלצות לשיפור..."
                                        rows={4}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                <X className="ml-2 h-4 w-4" />
                                ביטול
                            </Button>
                            <Button type="submit" disabled={isSaving} className="bg-orange-600 hover:bg-orange-700">
                                <Save className="ml-2 h-4 w-4" />
                                {isSaving ? 'שומר...' : 'שמור ביקורת'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}