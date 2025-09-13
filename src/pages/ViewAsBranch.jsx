import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Branch, BranchSetup } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Building, HardHat } from 'lucide-react';
import { createPageUrl } from '@/utils';
import FullPageError from '../components/FullPageError';

export default function ViewAsBranch() {
    const [branches, setBranches] = useState([]);
    const [setups, setSetups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [branchesData, setupsData] = await Promise.all([
                    Branch.list(),
                    BranchSetup.list()
                ]);
                
                const sortedBranches = Array.isArray(branchesData) 
                    ? branchesData.sort((a, b) => a.name.localeCompare(b.name, 'he')) 
                    : [];
                    
                const sortedSetups = Array.isArray(setupsData) 
                    ? setupsData.sort((a, b) => a.branch_name.localeCompare(b.branch_name, 'he')) 
                    : [];
                    
                setBranches(sortedBranches);
                setSetups(sortedSetups);
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("לא ניתן היה לטעון את רשימת הסניפים וההקמות.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleViewAsBranch = (branch) => {
        if (window.confirm(`האם אתה בטוח שברצונך לעבור לתצוגה של סניף "${branch.name}"?`)) {
            sessionStorage.setItem('viewAsEntityType', 'branch');
            sessionStorage.setItem('viewAsBranchId', branch.id);
            sessionStorage.setItem('viewAsBranchName', branch.name);
            navigate(createPageUrl('Dashboard'));
            window.location.reload();
        }
    };

    const handleViewAsSetup = (setup) => {
        if (window.confirm(`האם אתה בטוח שברצונך לעבור לתצוגה של הקמת סניף "${setup.branch_name}"?`)) {
            sessionStorage.setItem('viewAsEntityType', 'setup');
            sessionStorage.setItem('viewAsSetupId', setup.id);
            sessionStorage.setItem('viewAsSetupName', setup.branch_name);
            navigate(createPageUrl('Dashboard'));
            window.location.reload();
        }
    };

    const getSetupStatusBadge = (status) => {
        const variants = {
            'בתהליך': 'bg-blue-100 text-blue-800',
            'הושלם': 'bg-green-100 text-green-800',
            'הוקפא': 'bg-yellow-100 text-yellow-800',
            'בוטל': 'bg-red-100 text-red-800',
        };
        return <Badge className={`${variants[status] || 'bg-gray-100 text-gray-800'} hover:bg-opacity-80`}>{status}</Badge>;
    };

    if (isLoading) {
        return <div className="text-center p-8">טוען נתונים...</div>;
    }

    if (error) {
        return <FullPageError errorTitle="שגיאה בטעינת הדף" errorMessage={error} />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* סניפים קיימים */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="w-6 h-6 text-blue-600" />
                        סניפים קיימים
                    </CardTitle>
                    <CardDescription>
                        בחר סניף קיים כדי לצפות במערכת מנקודת המבט של בעל הסניף.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>שם הסניף</TableHead>
                                    <TableHead>עיר</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                    <TableHead className="text-left">פעולה</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branches.length > 0 ? (
                                    branches.map(branch => (
                                        <TableRow key={branch.id}>
                                            <TableCell className="font-medium">{branch.name}</TableCell>
                                            <TableCell>{branch.city}</TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    branch.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    branch.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }>
                                                    {branch.status === 'active' ? 'פעיל' : 
                                                     branch.status === 'inactive' ? 'לא פעיל' : 'בשיפוץ'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-left">
                                                <Button variant="outline" size="sm" onClick={() => handleViewAsBranch(branch)}>
                                                    <Eye className="ml-2 h-4 w-4" />
                                                    הצג תצוגת סניף
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan="4" className="text-center h-24">
                                            לא נמצאו סניפים קיימים.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* סניפים בהקמה */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardHat className="w-6 h-6 text-orange-600" />
                        סניפים בהקמה
                    </CardTitle>
                    <CardDescription>
                        בחר הקמת סניף כדי לצפות במערכת מנקודת המבט של זכיין בהקמה.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>שם הסניף</TableHead>
                                    <TableHead>שם הזכיין</TableHead>
                                    <TableHead>עיר מתוכננת</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                    <TableHead className="text-left">פעולה</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {setups.length > 0 ? (
                                    setups.map(setup => (
                                        <TableRow key={setup.id}>
                                            <TableCell className="font-medium">{setup.branch_name}</TableCell>
                                            <TableCell>{setup.franchisee_name}</TableCell>
                                            <TableCell>{setup.planned_city}</TableCell>
                                            <TableCell>{getSetupStatusBadge(setup.status)}</TableCell>
                                            <TableCell className="text-left">
                                                <Button variant="outline" size="sm" onClick={() => handleViewAsSetup(setup)}>
                                                    <Eye className="ml-2 h-4 w-4" />
                                                    הצג תצוגת הקמה
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan="5" className="text-center h-24">
                                            לא נמצאו הקמות בתהליך.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}