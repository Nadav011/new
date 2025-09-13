import React, { useState, useEffect, useMemo } from 'react';
import { CustomerComplaint, Branch, BranchOwnership, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { RefreshCw, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FullPageError from '../components/FullPageError';

export default function MyInitiatedAuditsList() {
    const [audits, setAudits] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const branchMap = useMemo(() => {
        return branches.reduce((acc, branch) => {
            acc[branch.id] = branch.name;
            return acc;
        }, {});
    }, [branches]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const user = await User.me();
            let userBranchIds = [];

            if (user.user_type === 'branch_owner' || user.user_type === 'setup_branch_owner') {
                const ownerships = await BranchOwnership.filter({ user_id: user.id });
                userBranchIds = ownerships.map(o => o.branch_id);
            }

            if (userBranchIds.length > 0) {
                 const [auditsData, branchesData] = await Promise.all([
                    CustomerComplaint.filter({ branch_id: { '$in': userBranchIds } }, '-created_date'),
                    Branch.list()
                ]);
                setAudits(Array.isArray(auditsData) ? auditsData : []);
                setBranches(Array.isArray(branchesData) ? branchesData : []);
            } else {
                 setAudits([]);
                 setBranches([]);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const { openAudits, closedAudits } = useMemo(() => {
        const open = audits.filter(a => a.status === 'פתוחה' || a.status === 'בטיפול');
        const closed = audits.filter(a => a.status === 'סגורה');
        return { openAudits: open, closedAudits: closed };
    }, [audits]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'פתוחה':
                return <Badge variant="destructive">פתוחה</Badge>;
            case 'בטיפול':
                return <Badge className="bg-yellow-500 text-white">בטיפול</Badge>;
            case 'סגורה':
                return <Badge className="bg-green-500 text-white">סגורה</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const AuditList = ({ list }) => (
        <div className="space-y-4">
            {list.length > 0 ? (
                list.map(audit => (
                    <Card 
                        key={audit.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(createPageUrl(`RespondToInitiatedAudit?id=${audit.id}`))}
                    >
                        <CardContent className="p-4 flex justify-between items-center">
                            <div className="flex-1 space-y-1">
                                <p className="font-semibold text-lg">{branchMap[audit.branch_id] || 'סניף לא ידוע'}</p>
                                <p className="text-sm text-gray-600">
                                    לקוח: {audit.customer_name} | טלפון: {audit.customer_phone}
                                </p>
                                <p className="text-xs text-gray-500">
                                    תאריך פתיחה: {format(new Date(audit.complaint_date), 'd MMMM yyyy, HH:mm', { locale: he })}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                {getStatusBadge(audit.status)}
                                <ExternalLink className="w-5 h-5 text-gray-400" />
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <p>אין ביקורות להצגה בקטגוריה זו.</p>
                </div>
            )}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-600" />
            </div>
        );
    }

    if (error) {
        return <FullPageError onRetry={fetchData} />;
    }

    return (
        <div dir="rtl" className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">ביקורות יזומות עבור הסניפים שלי</h1>
                    <p className="text-gray-500">ניהול ומעקב אחר משובי לקוחות וביקורות יזומות הדורשות את התייחסותך.</p>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(createPageUrl('MyTasks'))}>
                        <ArrowLeft className="ml-2 h-4 w-4" />
                        חזור למשימות
                    </Button>
                    <Button onClick={fetchData}>
                        <RefreshCw className="ml-2 h-4 w-4" />
                        רענן
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="open" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="open">
                        פתוחות ובטיפול ({openAudits.length})
                    </TabsTrigger>
                    <TabsTrigger value="closed">
                        סגורות ({closedAudits.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="open">
                    <Card>
                        <CardHeader>
                            <CardTitle>ביקורות פתוחות או בטיפול</CardTitle>
                            <CardDescription>אלו הביקורות הדורשות התייחסות מיידית.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AuditList list={openAudits} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="closed">
                    <Card>
                        <CardHeader>
                            <CardTitle>ביקורות שנסגרו</CardTitle>
                            <CardDescription>היסטוריית ביקורות שטופלו ונסגרו.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AuditList list={closedAudits} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}