
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Branch, Audit, QuestionnaireSettings, AuditQuestion } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, AlertCircle, RefreshCw, BarChart2, Plus, Square, CheckSquare, Search, Filter } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Helper to get all unique questionnaire types that are actually in use
const getQuestionnaireTypes = async () => {
    const [settings, allQuestions] = await Promise.all([
        QuestionnaireSettings.list(),
        AuditQuestion.list()
    ]);

    const typesFromSettings = settings.map(s => s.questionnaire_type);
    const typesFromQuestions = allQuestions.map(q => q.audit_type);
    const allActiveTypes = [...new Set([...typesFromSettings, ...typesFromQuestions])].filter(Boolean);

    const settingsMap = settings.reduce((acc, s) => {
        acc[s.questionnaire_type] = s.custom_name || s.questionnaire_type;
        return acc;
    }, {});
    
    return allActiveTypes.map(type => ({
        type: type,
        name: settingsMap[type] || type
    })).filter(item => item.type && item.name).sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB, 'he');
    });
};

export default function AuditExecutionStatus() {
    const [branches, setBranches] = useState([]);
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [branchStatus, setBranchStatus] = useState({});
    const [questionnaireTypes, setQuestionnaireTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterBranches();
    }, [branches, branchStatus, searchTerm, statusFilter]);

    const filterBranches = () => {
        let filtered = branches;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(branch => 
                branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (branch.city && branch.city.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(branch => {
                const status = branchStatus[branch.id];
                if (!status) return false;
                
                switch (statusFilter) {
                    case 'completed':
                        return status.percentage === 100;
                    case 'partial':
                        return status.percentage > 0 && status.percentage < 100;
                    case 'none':
                        return status.percentage === 0;
                    default:
                        return true;
                }
            });
        }

        setFilteredBranches(filtered);
    };

    const loadData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [branchesData, auditsData, typesData] = await Promise.all([
                Branch.list(),
                Audit.list(),
                getQuestionnaireTypes()
            ]);

            setQuestionnaireTypes(typesData);
            
            const auditsByBranch = auditsData.reduce((acc, audit) => {
                if (!acc[audit.branch_id]) {
                    acc[audit.branch_id] = new Set();
                }
                acc[audit.branch_id].add(audit.audit_type);
                return acc;
            }, {});

            const status = {};
            for (const branch of branchesData) {
                const completedTypes = auditsByBranch[branch.id] || new Set();
                const completedCount = typesData.filter(t => completedTypes.has(t.type)).length;
                const totalCount = typesData.length;
                const missingTypes = typesData.filter(t => !completedTypes.has(t.type));
                
                status[branch.id] = {
                    completedCount,
                    totalCount,
                    percentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
                    missingTypes,
                    completedTypes: typesData.filter(t => completedTypes.has(t.type))
                };
            }
            
            setBranches(branchesData);
            setBranchStatus(status);
        } catch (error) {
            console.error("Error loading data:", error);
            setLoadError("אירעה שגיאת רשת. לא ניתן היה לטעון את הנתונים.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBranchClick = (branch) => {
        setSelectedBranch(branch);
        setIsDialogOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
    }

    if (loadError) {
        return (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
                <p className="text-red-600 mb-4">{loadError}</p>
            </div>
        );
    }
    
    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart2 className="w-6 h-6" />
                        מצב ביצוע ביקורות
                    </h1>
                    <Link to={createPageUrl('NewAudit')}>
                        <Button className="bg-green-600 hover:bg-green-700 gap-2">
                            <Plus className="w-4 h-4" />
                            הוספת ביקורת חדשה
                        </Button>
                    </Link>
                </div>

                {/* Search and Filter Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>סינון וחיפוש</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="חיפוש לפי שם סניף או עיר..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="סטטוס השלמה" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">כל הסניפים</SelectItem>
                                    <SelectItem value="completed">הושלם - 100%</SelectItem>
                                    <SelectItem value="partial">בתהליך - חלקי</SelectItem>
                                    <SelectItem value="none">טרם התחיל - 0%</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Filter className="w-4 h-4" />
                                {filteredBranches.length} מתוך {branches.length} סניפים
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>סטטוס ביצוע לפי סניף</CardTitle>
                        <CardContent className="text-sm text-gray-600 pt-2">
                            סה"כ {questionnaireTypes.length} סוגי ביקורות קיימים במערכת
                        </CardContent>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>סניף</TableHead>
                                    <TableHead className="w-[200px]">התקדמות</TableHead>
                                    <TableHead>ביקורות שבוצעו</TableHead>
                                    <TableHead>ביקורות חסרות</TableHead>
                                    <TableHead>פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBranches.map(branch => {
                                    const status = branchStatus[branch.id] || { completedCount: 0, totalCount: questionnaireTypes.length, percentage: 0, missingTypes: questionnaireTypes };
                                    return (
                                        <TableRow key={branch.id}>
                                            <TableCell className="font-medium">{branch.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={status.percentage} className="w-full" />
                                                    <span className="text-sm font-mono">{Math.round(status.percentage)}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-green-600">
                                                {status.completedCount}/{status.totalCount}
                                            </TableCell>
                                            <TableCell>
                                                {status.missingTypes.length > 0 ? (
                                                     <Tooltip>
                                                        <TooltipTrigger>
                                                            <Badge 
                                                                variant="destructive" 
                                                                className="cursor-pointer hover:bg-red-600"
                                                                onClick={() => handleBranchClick(branch)}
                                                            >
                                                                {status.missingTypes.length} חסרות
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>לחץ לראות פירוט מלא</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <Badge variant="default" className="bg-green-500 gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        הכל בוצע
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Link to={createPageUrl(`BranchDetails?id=${branch.id}`)}>
                                                    <Button variant="outline" size="sm" className="gap-1">
                                                        <Eye className="w-4 h-4" />
                                                        צפה
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {filteredBranches.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <BarChart2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">לא נמצאו סניפים</p>
                                <p className="text-sm">נסה לשנות את הפילטרים או מילות החיפוש</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog for branch audit details */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <BarChart2 className="w-5 h-5" />
                                סטטוס ביקורות: {selectedBranch?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {selectedBranch && branchStatus[selectedBranch.id] && (
                                <>
                                    <div className="text-center mb-4">
                                        <div className="text-2xl font-bold text-green-600">
                                            {branchStatus[selectedBranch.id].completedCount}/{branchStatus[selectedBranch.id].totalCount}
                                        </div>
                                        <div className="text-sm text-gray-600">ביקורות בוצעו</div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-gray-900">סטטוס לפי סוג ביקורת:</h4>
                                        {questionnaireTypes.map(type => {
                                            const isCompleted = branchStatus[selectedBranch.id].completedTypes?.some(ct => ct.type === type.type);
                                            return (
                                                <div key={type.type} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        {isCompleted ? (
                                                            <CheckSquare className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-gray-400" />
                                                        )}
                                                        <span className={isCompleted ? "text-green-700 font-medium" : "text-gray-600"}>
                                                            {type.name}
                                                        </span>
                                                    </div>
                                                    {isCompleted ? (
                                                        <Badge variant="default" className="bg-green-100 text-green-800">
                                                            בוצע
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-gray-500">
                                                            חסר
                                                        </Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="pt-4 border-t">
                                        <Link to={createPageUrl('NewAudit')}>
                                            <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                                                <Plus className="w-4 h-4" />
                                                הוסף ביקורת חדשה
                                            </Button>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
