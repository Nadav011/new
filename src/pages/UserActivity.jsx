import React, { useState, useEffect } from 'react';
import { User, Branch, BranchOwnership } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Clock, Calendar, Activity, Store } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function UserActivity() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const [allUsers, current, allOwnerships, allBranches] = await Promise.all([
                User.list(),
                User.me(),
                BranchOwnership.list(),
                Branch.list()
            ]);

            const branchMap = new Map(allBranches.map(branch => [branch.id, branch.name]));
            const userOwnerships = new Map();
            allOwnerships.forEach(o => {
                if (!userOwnerships.has(o.user_id)) {
                    userOwnerships.set(o.user_id, []);
                }
                userOwnerships.get(o.user_id).push(o.branch_id);
            });

            const augmentedUsers = allUsers.map(user => {
                if (user.user_type === 'branch_owner') {
                    const ownedBranchIds = userOwnerships.get(user.id) || [];
                    const ownedBranchNames = ownedBranchIds.map(id => branchMap.get(id)).filter(Boolean);
                    return { ...user, ownedBranchNames };
                }
                return user;
            });
            
            const sortedUsers = augmentedUsers.sort((a, b) => {
                const aLastSeen = a.last_seen ? new Date(a.last_seen) : new Date(0);
                const bLastSeen = b.last_seen ? new Date(b.last_seen) : new Date(0);
                return bLastSeen - aLastSeen;
            });
            
            setUsers(sortedUsers);
            setCurrentUser(current);
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const getActivityStatus = (lastSeen) => {
        if (!lastSeen) return { text: 'מעולם לא התחבר', color: 'bg-gray-100 text-gray-800' };
        
        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diffMinutes = (now - lastSeenDate) / (1000 * 60);
        
        if (diffMinutes < 5) return { text: 'מחובר כעת', color: 'bg-green-100 text-green-800' };
        if (diffMinutes < 30) return { text: 'פעיל לאחרונה', color: 'bg-blue-100 text-blue-800' };
        if (diffMinutes < 1440) return { text: 'פעיל היום', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'לא פעיל', color: 'bg-red-100 text-red-800' };
    };

    const getUserTypeText = (userType) => {
        const types = {
            admin: 'אדמין',
            branch_owner: 'בעל סניף',
            user: 'משתמש רגיל'
        };
        return types[userType] || 'משתמש רגיל';
    };

    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'מעולם לא התחבר';
        
        try {
            const date = new Date(lastSeen);
            const distance = formatDistanceToNow(date, { addSuffix: true, locale: he });
            const formatted = format(date, 'dd/MM/yyyy HH:mm', { locale: he });
            return `${distance} (${formatted})`;
        } catch (error) {
            return 'תאריך לא תקין';
        }
    };

    if (isLoading) {
        return <div>טוען נתונים...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Users className="w-10 h-10 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold">פעילות משתמשים</h1>
                    <p className="text-gray-600">מעקב אחרי פעילות וזמני התחברות של המשתמשים במערכת</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">סה"כ משתמשים</p>
                                <p className="text-2xl font-bold">{users.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Activity className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">מחוברים כעת</p>
                                <p className="text-2xl font-bold">
                                    {users.filter(u => {
                                        if (!u.last_seen) return false;
                                        const diffMinutes = (new Date() - new Date(u.last_seen)) / (1000 * 60);
                                        return diffMinutes < 5;
                                    }).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-yellow-600" />
                            <div>
                                <p className="text-sm text-gray-600">פעילים היום</p>
                                <p className="text-2xl font-bold">
                                    {users.filter(u => {
                                        if (!u.last_seen) return false;
                                        const diffMinutes = (new Date() - new Date(u.last_seen)) / (1000 * 60);
                                        return diffMinutes < 1440;
                                    }).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="text-sm text-gray-600">בעלי סניפים</p>
                                <p className="text-2xl font-bold">
                                    {users.filter(u => u.user_type === 'branch_owner').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>רשימת משתמשים ופעילות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>שם</TableHead>
                                    <TableHead>אימייל</TableHead>
                                    <TableHead>תפקיד</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                    <TableHead>פעיל לאחרונה</TableHead>
                                    <TableHead>סה"כ התחברויות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => {
                                    const activityStatus = getActivityStatus(user.last_seen);
                                    const isCurrentUser = currentUser?.id === user.id;
                                    
                                    return (
                                        <TableRow key={user.id} className={isCurrentUser ? 'bg-blue-50' : ''}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{user.full_name || 'משתמש ללא שם'}</span>
                                                    {isCurrentUser && (
                                                        <Badge variant="outline" className="text-xs">
                                                            זה אתה
                                                        </Badge>
                                                    )}
                                                </div>
                                                {user.user_type === 'branch_owner' && user.ownedBranchNames?.length > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <Store className="w-3 h-3" />
                                                        <span>{user.ownedBranchNames.join(', ')}</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {getUserTypeText(user.user_type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={activityStatus.color}>
                                                    {activityStatus.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatLastSeen(user.last_seen)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {user.total_sessions || 0}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}