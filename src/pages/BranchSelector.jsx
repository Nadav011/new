import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Branch, BranchOwnership } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building, ArrowLeft, RefreshCw } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function BranchSelector() {
    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);

                if (currentUser.user_type !== 'branch_owner') {
                    navigate(createPageUrl('Dashboard'));
                    return;
                }

                const ownerships = await BranchOwnership.filter({ user_id: currentUser.id });
                if (!ownerships || ownerships.length === 0) {
                    setError("לא נמצאו סניפים המשויכים למשתמש זה.");
                    setIsLoading(false);
                    return;
                }
                
                if (ownerships.length === 1) {
                     // If only one branch, set it and redirect
                    const branchDetails = await Branch.get(ownerships[0].branch_id);
                    if (branchDetails) {
                        handleSelectBranch(branchDetails);
                    } else {
                         setError("שגיאה בטעינת פרטי הסניף היחיד שלך.");
                         setIsLoading(false);
                    }
                    return;
                }

                const branchIds = ownerships.map(o => o.branch_id);
                const fetchedBranches = await Promise.all(
                    branchIds.map(id => Branch.get(id).catch(e => null))
                );
                
                const validBranches = fetchedBranches.filter(b => b !== null);
                setBranches(validBranches);

            } catch (err) {
                console.error("Error fetching user or branch data:", err);
                setError("אירעה שגיאה בטעינת נתוני הסניפים.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleSelectBranch = (branch) => {
        sessionStorage.setItem('selectedOwnerBranchId', branch.id);
        sessionStorage.setItem('selectedOwnerBranchName', branch.name);
        navigate(createPageUrl('Dashboard'));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-700">טוען את הסניפים שלך...</h2>
                </div>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center p-8 bg-white shadow-lg rounded-lg">
                    <h2 className="text-2xl font-semibold text-red-600 mb-4">שגיאה</h2>
                    <p className="text-gray-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-3xl mx-auto">
                 <Card className="shadow-2xl">
                    <CardHeader className="text-center bg-gray-100 p-6 rounded-t-lg">
                        <CardTitle className="text-3xl font-bold text-gray-800">
                            שלום, {user?.full_name}!
                        </CardTitle>
                        <p className="text-lg text-gray-600 mt-2">נראה שיש לך יותר מסניף אחד. אנא בחר סניף לניהול.</p>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {branches.map(branch => (
                                <button
                                    key={branch.id}
                                    onClick={() => handleSelectBranch(branch)}
                                    className="block p-6 bg-white rounded-lg border-2 border-gray-200 text-center hover:border-green-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300"
                                >
                                    <Building className="w-12 h-12 mx-auto text-green-600 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900">{branch.name}</h3>
                                    <p className="text-gray-500">{branch.city}</p>
                                    <div className="mt-4 inline-flex items-center gap-2 text-green-600 font-semibold">
                                        <span>המשך לסניף</span>
                                        <ArrowLeft className="w-5 h-5" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}