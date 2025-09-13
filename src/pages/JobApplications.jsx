import React, { useState, useEffect } from 'react';
import { JobApplication, Branch, User, BranchOwnership } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, Users, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import JobApplicationForm from '../components/JobApplicationForm';

export default function JobApplications() {
    const [applications, setApplications] = useState([]);
    const [branches, setBranches] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [ownedBranches, setOwnedBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = await User.me();
            setCurrentUser(user);
            
            const allBranchesData = await Branch.list();
            setBranches(allBranchesData);

            let userBranches = [];
            if (user.user_type === 'admin' || user.user_type === 'franchise_manager') {
                userBranches = allBranchesData;
            } else if (user.user_type === 'branch_owner') {
                const ownerships = await BranchOwnership.filter({ user_id: user.id });
                const ownedBranchIds = ownerships.map(o => o.branch_id);
                userBranches = allBranchesData.filter(b => ownedBranchIds.includes(b.id));
            }
            setOwnedBranches(userBranches);

            const ownedBranchIds = userBranches.map(b => b.id);
            const fetchedApplications = ownedBranchIds.length > 0 ? await JobApplication.filter({ branch_id: { '$in': ownedBranchIds } }) : [];

            setApplications(fetchedApplications.sort((a,b) => new Date(b.created_date) - new Date(a.created_date)));
        } catch (err) {
            console.error(err);
            setError("שגיאה בטעינת הנתונים");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = async (data) => {
        try {
            if (data.id) {
                await JobApplication.update(data.id, data);
            } else {
                await JobApplication.create(data);
            }
            setIsFormOpen(false);
            await loadInitialData();
        } catch (err) {
            console.error(err);
            alert("שגיאה בשמירת המועמד.");
        }
    };
    
    const handleEdit = (app) => {
        setSelectedApplication(app);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedApplication(null);
        setIsFormOpen(true);
    };

    const processStatusOptions = ["חדש", "בבדיקה", "נקבע ראיון", "הוצע תפקיד", "התקבל", "נדחה", "בארכיון"];
    
    const statusColors = {
        'חדש': 'bg-blue-100 text-blue-800',
        'בבדיקה': 'bg-yellow-100 text-yellow-800',
        'נקבע ראיון': 'bg-purple-100 text-purple-800',
        'הוצע תפקיד': 'bg-indigo-100 text-indigo-800',
        'התקבל': 'bg-green-100 text-green-800',
        'נדחה': 'bg-red-100 text-red-800',
        'בארכיון': 'bg-gray-100 text-gray-800',
    };
    
    const filteredApplications = applications.filter(app => {
        const nameMatch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase());
        const phoneMatch = app.phone_number.includes(searchTerm);
        const searchMatch = searchTerm === '' || nameMatch || phoneMatch;
        const statusMatch = statusFilter === 'all' || app.process_status === statusFilter;
        return searchMatch && statusMatch;
    });

    if (isLoading) return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
    if (error) return <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-green-700" />
                    <div>
                        <h1 className="text-2xl font-bold">ניהול מועמדים לעבודה</h1>
                        <p className="text-gray-600">רשימת המועמדים שהגישו בקשה לסניפים שלך</p>
                    </div>
                </div>
                <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
                    <PlusCircle className="ml-2 h-4 w-4" /> הוסף מועמד חדש
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>סינון וחיפוש</CardTitle>
                    <div className="grid sm:grid-cols-2 gap-4 pt-4">
                        <div className="relative">
                             <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="חיפוש לפי שם או טלפון..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10"/>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="סנן לפי סטטוס..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">כל הסטטוסים</SelectItem>
                                {processStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם מלא</TableHead>
                                <TableHead>טלפון</TableHead>
                                <TableHead>סניף</TableHead>
                                <TableHead>סטטוס</TableHead>
                                <TableHead>תאריך הגשה</TableHead>
                                <TableHead>פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredApplications.length > 0 ? filteredApplications.map(app => {
                                const branch = branches.find(b => b.id === app.branch_id);
                                return (
                                <TableRow key={app.id}>
                                    <TableCell className="font-medium">{app.full_name}</TableCell>
                                    <TableCell>{app.phone_number}</TableCell>
                                    <TableCell>{branch?.name || 'לא ידוע'}</TableCell>
                                    <TableCell><Badge className={statusColors[app.process_status]}>{app.process_status}</Badge></TableCell>
                                    <TableCell>{format(new Date(app.application_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(app)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        לא נמצאו מועמדים התואמים את החיפוש.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <JobApplicationForm 
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSave}
                application={selectedApplication}
                branches={ownedBranches}
                defaultBranchId={ownedBranches.length === 1 ? ownedBranches[0].id : null}
            />
        </div>
    );
}