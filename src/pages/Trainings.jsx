import React, { useState, useEffect } from 'react';
import { Branch, Training, TrainingRecord, User, BranchOwnership } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, AlertCircle, RefreshCw, Search, Filter } from 'lucide-react';
import BranchTrainingStatusDialog from '../components/BranchTrainingStatusDialog';
import TrainingRecordForm from '../components/TrainingRecordForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Trainings() {
    const [branches, setBranches] = useState([]);
    const [trainings, setTrainings] = useState([]);
    const [trainingRecords, setTrainingRecords] = useState([]);
    const [branchStatus, setBranchStatus] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [selectedBranch, setSelectedBranch] = useState(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        setLoadError(null);
        
        try {
            const user = await User.me();
            setCurrentUser(user);

            let branchData = [];
            if (user.user_type === 'admin' || user.user_type === 'user') {
                branchData = await Branch.list();
            } else if (user.user_type === 'branch_owner') {
                const ownerships = await BranchOwnership.filter({ user_id: user.id });
                if (ownerships.length > 0) {
                    const branchIds = ownerships.map(o => o.branch_id);
                    const branches = await Promise.all(branchIds.map(id => Branch.get(id)));
                    branchData = branches.filter(Boolean);
                }
            }

            setBranches(branchData.sort((a,b) => (a.name || '').localeCompare(b.name || '', 'he')));

            const trainingsData = await Training.filter({ is_active: true });
            setTrainings(trainingsData || []);

            const recordsData = await TrainingRecord.list();
            setTrainingRecords(recordsData || []);

        } catch (error) {
            console.error("Error loading training data:", error);
            setLoadError(`שגיאה בטעינת נתוני ההדרכות: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);
    
    useEffect(() => {
        calculateStatus();
    }, [branches, trainings, trainingRecords]);
    
    useEffect(() => {
        let filtered = branches.filter(branch => 
            (branch.name && branch.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (branch.city && branch.city.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredBranches(filtered);
    }, [searchTerm, branches]);

    const calculateStatus = () => {
        if (trainings.length === 0) return;

        const recordsByBranch = trainingRecords.reduce((acc, record) => {
            if (!acc[record.branch_id]) acc[record.branch_id] = [];
            acc[record.branch_id].push(record);
            return acc;
        }, {});

        const status = {};
        for (const branch of branches) {
            const records = recordsByBranch[branch.id] || [];
            const completedTrainingIds = new Set(records.map(r => r.training_id));
            
            const completedCount = completedTrainingIds.size;
            const totalCount = trainings.length;
            const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
            
            status[branch.id] = {
                completedCount,
                totalCount,
                percentage,
                records
            };
        }
        setBranchStatus(status);
    };
    
    const handleBranchClick = (branch) => {
        setSelectedBranch(branch);
        setIsStatusDialogOpen(true);
    };

    const handleOpenForm = (branch) => {
        setSelectedBranch(branch);
        setIsFormOpen(true);
        setIsStatusDialogOpen(false);
    };
    
    const handleSave = () => {
        setIsFormOpen(false);
        loadData();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <div className="ml-4">
                    <p className="text-gray-600">טוען נתוני הדרכות...</p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
                <p className="text-red-600 mb-4">{loadError}</p>
                <Button onClick={loadData}>
                    <RefreshCw className="ml-2 h-4 w-4" /> 
                    נסה שוב
                </Button>
            </div>
        );
    }
    
    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="w-7 h-7" />
                        {currentUser?.user_type === 'branch_owner' && branches.length === 1 ? 'מצב הדרכות - הסניף שלי' : 'מצב הדרכות בסניפים'}
                    </h1>
                </div>

                {/* Only show search for admins or when there are multiple branches */}
                {currentUser?.user_type !== 'branch_owner' || (currentUser?.user_type === 'branch_owner' && branches.length > 1) ? (
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
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Filter className="w-4 h-4" />
                                    {filteredBranches.length} מתוך {branches.length} סניפים
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {currentUser?.user_type === 'branch_owner' && branches.length === 1 ? 'סטטוס הדרכות הסניף' : 'סטטוס הדרכות לפי סניף'}
                        </CardTitle>
                        <CardContent className="text-sm text-gray-600 pt-2">
                            סה"כ {trainings.length} הדרכות פעילות במערכת
                        </CardContent>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>שם הסניף</TableHead>
                                        <TableHead>עיר</TableHead>
                                        <TableHead>הדרכות שהושלמו</TableHead>
                                        <TableHead className="w-[200px]">אחוז השלמה</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBranches.map(branch => {
                                        const status = branchStatus[branch.id] || { completedCount: 0, totalCount: trainings.length, percentage: 0 };
                                        return (
                                            <TableRow key={branch.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleBranchClick(branch)}>
                                                <TableCell className="font-medium">{branch.name}</TableCell>
                                                <TableCell>{branch.city}</TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-purple-700">{status.completedCount}/{status.totalCount}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Progress value={status.percentage} className="w-full h-2 [&>div]:bg-purple-500" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{Math.round(status.percentage)}% הושלמו</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <span className="text-xs text-gray-600 font-mono w-12 text-right">{Math.round(status.percentage)}%</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredBranches.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">לא נמצאו סניפים</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <BranchTrainingStatusDialog
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
                branch={selectedBranch}
                allTrainings={trainings}
                trainingRecords={branchStatus[selectedBranch?.id]?.records || []}
                onRecordNewTraining={handleOpenForm}
                currentUser={currentUser}
            />
            
            {/* Only admins can add new training records */}
            {currentUser?.user_type === 'admin' && (
                <TrainingRecordForm
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    branch={selectedBranch}
                    allTrainings={trainings}
                    onSave={handleSave}
                />
            )}

        </TooltipProvider>
    );
}