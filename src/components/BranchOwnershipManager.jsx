import React, { useState, useEffect } from 'react';
import { User, BranchOwnership } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, User as UserIcon, AlertCircle } from 'lucide-react';

export default function BranchOwnershipManager({ branchId }) {
    const [owners, setOwners] = useState([]);
    const [allFranchisees, setAllFranchisees] = useState([]);
    const [selectedFranchisee, setSelectedFranchisee] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (branchId) {
            loadData();
        }
    }, [branchId]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch all users who are branch owners
            const franchiseeUsers = await User.filter({ user_type: 'branch_owner' });
            setAllFranchisees(franchiseeUsers);

            // Fetch current ownership records for this branch
            const ownershipRecords = await BranchOwnership.filter({ branch_id: branchId });
            
            // Map records to user details
            const ownerDetails = ownershipRecords
                .map(record => franchiseeUsers.find(u => u.id === record.user_id))
                .filter(Boolean); // Filter out any users not found

            setOwners(ownerDetails.map(owner => ({ ...owner, ownershipRecordId: ownershipRecords.find(r => r.user_id === owner.id)?.id })));

        } catch (err) {
            console.error("Error loading ownership data:", err);
            setError("שגיאה בטעינת נתוני הבעלות.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddOwner = async () => {
        if (!selectedFranchisee) return;
        
        const isAlreadyOwner = owners.some(o => o.id === selectedFranchisee);
        if (isAlreadyOwner) {
            alert('המשתמש כבר משויך כבעלים לסניף זה.');
            return;
        }

        try {
            await BranchOwnership.create({ branch_id: branchId, user_id: selectedFranchisee });
            await loadData(); // Refresh the list
            setSelectedFranchisee('');
        } catch (err) {
            console.error("Error adding owner:", err);
            setError("שגיאה בהוספת בעלים.");
        }
    };

    const handleRemoveOwner = async (ownershipRecordId) => {
        if (!ownershipRecordId) {
            alert('שגיאה: לא נמצא מזהה בעלות.');
            return;
        }
        if (window.confirm('האם אתה בטוח שברצונך להסיר את הבעלות של משתמש זה מהסניף?')) {
            try {
                await BranchOwnership.delete(ownershipRecordId);
                await loadData(); // Refresh the list
            } catch (err) {
                console.error("Error removing owner:", err);
                setError("שגיאה בהסרת בעלים.");
            }
        }
    };

    if (isLoading) return <div>טוען נתוני בעלות...</div>;

    if (error) {
        return (
            <div className="text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
                <Button onClick={loadData} variant="outline" size="sm">נסה שוב</Button>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>ניהול בעלי הסניף</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="font-medium">הוסף בעלים חדשים</h3>
                    <div className="flex items-center gap-2">
                        <Select onValueChange={setSelectedFranchisee} value={selectedFranchisee}>
                            <SelectTrigger>
                                <SelectValue placeholder="בחר זכיין להוספה..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allFranchisees.map(user => (
                                    <SelectItem key={user.id} value={user.id} disabled={owners.some(o => o.id === user.id)}>
                                        {user.full_name} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddOwner} disabled={!selectedFranchisee}>
                            <PlusCircle className="ml-2 h-4 w-4" />
                            הוסף
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-medium">בעלים נוכחיים</h3>
                    {owners.length > 0 ? (
                        <ul className="divide-y divide-gray-200 rounded-md border">
                            {owners.map(owner => (
                                <li key={owner.id} className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                        <UserIcon className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p className="font-semibold">{owner.full_name}</p>
                                            <p className="text-sm text-gray-500">{owner.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOwner(owner.ownershipRecordId)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">לא משויכים בעלים לסניף זה.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}