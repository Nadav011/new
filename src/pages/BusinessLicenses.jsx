import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Branch, User, BranchOwnership } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, AlertCircle, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import BusinessLicenseForm from '../components/BusinessLicenseForm';
import FullPageError from '../components/FullPageError';

export default function BusinessLicenses() {
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const user = await User.me();
            setCurrentUser(user);

            // בדוק אם המשתמש מורשה לראות את הדף
            const isAuthorized = user.user_type === 'admin' || 
                               user.user_type === 'operational_manager';
            
            if (!isAuthorized) {
                setLoadError('אין לך הרשאה לצפות בעמוד זה. רישיונות עסק מנוהלים דרך עמוד פרטי הסניף.');
                return;
            }

            // רק אדמין ומנהל תפעול רואים את כלל הסניפים
            const data = await Branch.list();
            setBranches(data);

        } catch (error) {
            console.error("Error loading branches:", error);
            setLoadError("אירעה שגיאה בטעינת נתוני הסניפים.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditBranch = (branch) => {
        setSelectedBranch(branch);
        setIsFormOpen(true);
    };

    const handleSaveLicense = async (formData) => {
        if (!selectedBranch) return;
        try {
            // Fetch the full branch object to avoid overwriting other fields
            const currentBranchData = await Branch.get(selectedBranch.id);
            const updatedData = { ...currentBranchData, ...formData };
            await Branch.update(selectedBranch.id, updatedData);
            await loadBranches();
            setIsFormOpen(false);
            setSelectedBranch(null);
        } catch (error) {
            console.error("Failed to save business license:", error);
            alert("שגיאה בשמירת רישיון העסק.");
        }
    };

    const ValidityBadge = ({ endDate }) => {
        if (!endDate) {
            return <Badge variant="secondary">לא הוגדר</Badge>;
        }
        const daysLeft = differenceInDays(new Date(endDate), new Date());
        if (daysLeft < 0) {
            return <Badge className="bg-red-100 text-red-800">פג תוקף</Badge>;
        }
        if (daysLeft <= 30) {
            return <Badge className="bg-yellow-100 text-yellow-800">פג תוקף בקרוב ({daysLeft} ימים)</Badge>;
        }
        return <Badge className="bg-green-100 text-green-800">בתוקף</Badge>;
    };

    if (loadError) {
        return (
            <FullPageError
                errorTitle="גישה מוגבלת"
                errorMessage={loadError}
                onRetry={loadBranches}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-green-600 mr-3" />
                <span>טוען נתוני רישיונות עסק...</span>
            </div>
        );
    }
    
    const licensedBranches = branches.filter(b => b.has_business_license);
    const unlicensedBranches = branches.filter(b => !b.has_business_license);

    const canEdit = currentUser?.user_type === 'admin' || 
                   currentUser?.user_type === 'operational_manager';

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-indigo-600" />
                            ניהול רישיונות עסק
                        </h1>
                        <p className="text-gray-600">סטטוס רישיונות עסק בכלל הסניפים.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card className="border-green-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-700">
                                <CheckCircle />
                                סניפים עם רישיון עסק ({licensedBranches.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {licensedBranches.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>סניף</TableHead>
                                            <TableHead>מספר רישיון</TableHead>
                                            <TableHead>רשות מנפיקה</TableHead>
                                            <TableHead>סטטוס תוקף</TableHead>
                                            <TableHead>תאריך סיום</TableHead>
                                            <TableHead>פעולות</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {licensedBranches.map(branch => (
                                            <TableRow key={branch.id}>
                                                <TableCell className="font-medium">
                                                    <Link to={createPageUrl(`BranchDetails?id=${branch.id}`)} className="hover:underline">{branch.name}</Link>
                                                </TableCell>
                                                <TableCell>
                                                    {branch.business_license_number || 'לא הוזן'}
                                                </TableCell>
                                                <TableCell>
                                                    {branch.business_license_issuing_authority || 'לא הוזן'}
                                                </TableCell>
                                                <TableCell>
                                                    <ValidityBadge endDate={branch.business_license_end_date} />
                                                </TableCell>
                                                <TableCell>
                                                    {branch.business_license_end_date ? format(new Date(branch.business_license_end_date), 'dd/MM/yyyy') : 'לא הוזן'}
                                                </TableCell>
                                                <TableCell className="flex gap-1">
                                                    {canEdit && (
                                                        <Button variant="outline" size="sm" onClick={() => handleEditBranch(branch)}>
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                    {branch.business_license_doc_url && (
                                                        <a href={branch.business_license_doc_url} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="outline" size="sm"><FileText className="w-3 h-3" /></Button>
                                                        </a>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : <p className="text-gray-500 text-center py-4">אין סניפים עם רישיון עסק.</p>}
                        </CardContent>
                    </Card>

                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <XCircle />
                                סניפים ללא רישיון עסק ({unlicensedBranches.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             {unlicensedBranches.length > 0 ? (
                                <ul className="space-y-2">
                                    {unlicensedBranches.map(branch => (
                                        <li key={branch.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                            <Link to={createPageUrl(`BranchDetails?id=${branch.id}`)} className="font-medium hover:underline">{branch.name}</Link>
                                            {canEdit && (
                                                <Button variant="outline" size="sm" onClick={() => handleEditBranch(branch)}>
                                                    עדכן סטטוס
                                                    <Edit className="w-3 h-3 mr-2" />
                                                </Button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-gray-500 text-center py-4">כל הסניפים עם רישיון עסק!</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {canEdit && (
                <BusinessLicenseForm 
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    branch={selectedBranch}
                    onSave={handleSaveLicense}
                />
            )}
        </>
    );
}