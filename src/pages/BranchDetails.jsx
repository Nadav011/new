
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Branch, Audit, User, BranchOwnership } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    MapPin, Phone, User as UserIcon, Building, Shield, FileText, 
    HardHat, CheckCircle, XCircle, AlertCircle, RefreshCw, Edit, 
    Award, ArrowRight, Mail, Users, UserCheck
} from 'lucide-react';
import { iconMap } from '../components/IconMap';
import { format, parseISO, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import BranchForm from '../components/BranchForm';

export default function BranchDetails() {
    const [branch, setBranch] = useState(null);
    const [audits, setAudits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [branchId, setBranchId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
            setBranchId(id);
            loadData(id);
        } else {
            setLoadError("לא סופק מזהה סניף.");
            setIsLoading(false);
        }
    }, []);

    async function loadData(id) {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [branchData, auditsData, user] = await Promise.all([
                Branch.get(id),
                Audit.filter({ branch_id: id }, '-audit_date', 10),
                User.me()
            ]);
            
            if (user.role !== 'admin' && user.user_type === 'branch_owner') {
                const ownerships = await BranchOwnership.filter({ user_id: user.id });
                const ownedBranchIds = ownerships.map(o => o.branch_id);
                if (!ownedBranchIds.includes(id)) {
                    setLoadError("אין לך הרשאה לצפות בסניף זה.");
                    setBranch(null);
                    return;
                }
            }
            
            setBranch(branchData);
            setAudits(auditsData);
            setCurrentUser(user);

        } catch (error) {
            console.error("Failed to load branch details:", error);
            setLoadError("אירעה שגיאה בטעינת פרטי הסניף.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleOpenForm = () => setIsFormOpen(true);

    const handleSaveBranch = async (formData) => {
        try {
            if (branch) {
                await Branch.update(branch.id, formData);
                setIsFormOpen(false);
                await loadData(branch.id);
                window.dispatchEvent(new CustomEvent('branchesChanged'));
                alert('פרטי הסניף עודכנו בהצלחה!');
            }
        } catch (error) {
            console.error("Failed to save branch:", error);
            alert("שגיאה בעדכון הסניף. אנא נסה שוב.");
        }
    };
    
    const DetailCard = ({ icon, title, value, children }) => (
        <div className="flex items-start gap-4">
            {React.cloneElement(icon, { className: "w-5 h-5 text-gray-500 mt-1" })}
            <div>
                <p className="text-sm text-gray-600">{title}</p>
                {value ? <p className="font-semibold">{value}</p> : children}
            </div>
        </div>
    );
    
    const StatusBadge = ({ status }) => {
        const statusMap = {
            active: { text: 'פעיל', color: 'bg-green-100 text-green-800' },
            inactive: { text: 'לא פעיל', color: 'bg-red-100 text-red-800' },
            renovating: { text: 'בשיפוצים', color: 'bg-yellow-100 text-yellow-800' }
        };
        const { text, color } = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
        return <Badge className={`${color} text-sm`}>{text}</Badge>;
    };

    const ValidityBadge = ({ endDate }) => {
        if (!endDate) {
            return <Badge variant="secondary">לא הוגדר</Badge>;
        }
        // Ensure endDate is a valid Date object for calculation
        const end = new Date(endDate);
        const today = new Date();
        const daysLeft = differenceInDays(end, today);

        if (daysLeft < 0) {
            return <Badge className="bg-red-100 text-red-800">פג תוקף</Badge>;
        }
        if (daysLeft <= 30) {
            return <Badge className="bg-yellow-100 text-yellow-800">פג תוקף בקרוב ({daysLeft} ימים)</Badge>;
        }
        return <Badge className="bg-green-100 text-green-800">בתוקף</Badge>;
    };

    const BranchHeaderIcon = () => {
        if (!branch) return null;
        if (branch.custom_icon_url) {
            return <img src={branch.custom_icon_url} alt={branch.name} className="w-12 h-12 rounded-lg object-cover" />;
        }
        const SelectedIcon = iconMap[branch.icon_name];
        if (SelectedIcon) {
            return (
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <SelectedIcon className="w-7 h-7 text-green-600" />
                </div>
            );
        }
        return (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building className="w-7 h-7 text-gray-500" />
            </div>
        );
    };

    if (isLoading) return <div>טוען פרטי סניף...</div>;
    
    if (loadError) {
        return (
            <Card>
                <CardContent className="text-center p-8">
                    <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הסניף</h3>
                    <p className="text-red-600 mb-4">{loadError}</p>
                    <Button onClick={() => loadData(branchId)} disabled={!branchId}>
                        <RefreshCw className="ml-2 h-4 w-4" />
                        נסה שוב
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    if (!branch) {
        return <div>לא נמצא סניף.</div>;
    }

    const kosherMap = {
        'כשרות רגילה': 'bg-blue-100 text-blue-800',
        'כשרות בדץ': 'bg-indigo-100 text-indigo-800',
        'כשרות צהר': 'bg-purple-100 text-purple-800',
        'ללא תעודת כשרות-פתוח בשבת': 'bg-gray-200 text-gray-800'
    };

    const canEdit = currentUser?.role === 'admin';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="outline" 
                    onClick={() => window.location.href = createPageUrl('Branches')}
                    className="flex items-center gap-2"
                >
                    <ArrowRight className="w-4 h-4" />
                    חזור לרשימת הסניפים
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <BranchHeaderIcon />
                        <div>
                            <CardTitle className="text-2xl">{branch.name}</CardTitle>
                            <CardDescription className="text-md">{branch.address}, {branch.city}</CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={branch.status} />
                        {canEdit && (
                            <Button onClick={handleOpenForm} size="sm">
                                <Edit className="ml-2 h-4 w-4" />
                                ערוך פרטי סניף
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailCard icon={<MapPin />} title="כתובת מלאה" value={`${branch.address}, ${branch.city}`} />
                    <DetailCard icon={<Phone />} title="טלפון סניף" value={branch.phone_number || 'לא הוזן'} />
                    <DetailCard icon={<UserIcon />} title="מנהל סניף ראשי" value={branch.manager_name || 'לא הוזן'} />
                    <DetailCard icon={<Phone />} title="נייד מנהל" value={branch.manager_phone || 'לא הוזן'} />
                    <DetailCard icon={<Mail />} title="אימייל מנהל" value={branch.manager_email || 'לא הוזן'} />
                    <DetailCard icon={<Award />} title="סוג כשרות">
                        <Badge className={kosherMap[branch.kosher_type] || 'bg-gray-100 text-gray-800'}>
                            {branch.kosher_type || 'לא הוגדר'}
                        </Badge>
                    </DetailCard>
                    <DetailCard icon={<UserCheck />} title="שם משגיח כשרות" value={branch.mashgiach_name || 'לא הוזן'} />
                    <DetailCard icon={<Phone />} title="נייד משגיח כשרות" value={branch.mashgiach_phone || 'לא הוזן'} />
                </CardContent>
            </Card>

            {/* Additional Contacts Card */}
            {branch.additional_contacts && branch.additional_contacts.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-700" />
                            אנשי קשר נוספים
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {branch.additional_contacts.map((contact, index) => (
                             <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                 <p className="font-semibold">{contact.name} - <span className="font-normal text-gray-600">{contact.role}</span></p>
                                 <div className="flex items-center gap-4 mt-2 text-sm text-gray-800">
                                     {contact.phone && <div className="flex items-center gap-1"><Phone className="w-4 h-4" /> {contact.phone}</div>}
                                     {contact.email && <div className="flex items-center gap-1"><Mail className="w-4 h-4" /> {contact.email}</div>}
                                 </div>
                             </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* אישור נגישות */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        אישור נגישות
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        {branch.has_accessibility_approval ? (
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-semibold">קיים אישור נגישות</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span className="font-semibold">אין אישור נגישות</span>
                            </div>
                        )}
                    </div>
                    
                    {branch.has_accessibility_approval && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            {branch.accessibility_approval_start_date && (
                                <div>
                                    <p className="text-sm text-gray-600">תאריך תחילת תוקף</p>
                                    <p className="font-semibold">{format(new Date(branch.accessibility_approval_start_date), 'dd/MM/yyyy')}</p>
                                </div>
                            )}
                            {branch.accessibility_approval_end_date && (
                                <div>
                                    <p className="text-sm text-gray-600">תאריך סיום תוקף</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{format(new Date(branch.accessibility_approval_end_date), 'dd/MM/yyyy')}</p>
                                        <ValidityBadge endDate={branch.accessibility_approval_end_date} />
                                    </div>
                                </div>
                            )}
                            {branch.accessibility_approval_doc_url && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-600 mb-2">מסמך אישור</p>
                                    <a 
                                        href={branch.accessibility_approval_doc_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        צפה במסמך
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* רישיון עסק */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        רישיון עסק
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        {branch.has_business_license ? (
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-semibold">קיים רישיון עסק</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span className="font-semibold">אין רישיון עסק</span>
                            </div>
                        )}
                    </div>
                    
                    {branch.has_business_license && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            {branch.business_license_number && (
                                <div>
                                    <p className="text-sm text-gray-600">מספר רישיון</p>
                                    <p className="font-semibold">{branch.business_license_number}</p>
                                </div>
                            )}
                            {branch.business_license_issuing_authority && (
                                <div>
                                    <p className="text-sm text-gray-600">רשות מנפיקה</p>
                                    <p className="font-semibold">{branch.business_license_issuing_authority}</p>
                                </div>
                            )}
                            {branch.business_license_start_date && (
                                <div>
                                    <p className="text-sm text-gray-600">תאריך תחילת תוקף</p>
                                    <p className="font-semibold">{format(new Date(branch.business_license_start_date), 'dd/MM/yyyy')}</p>
                                </div>
                            )}
                            {branch.business_license_end_date && (
                                <div>
                                    <p className="text-sm text-gray-600">תאריך סיום תוקף</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{format(new Date(branch.business_license_end_date), 'dd/MM/yyyy')}</p>
                                        <ValidityBadge endDate={branch.business_license_end_date} />
                                    </div>
                                </div>
                            )}
                            {branch.business_license_doc_url && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-600 mb-2">מסמך רישיון</p>
                                    <a 
                                        href={branch.business_license_doc_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        צפה במסמך
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>ביקורות אחרונות</CardTitle>
                </CardHeader>
                <CardContent>
                    {audits.length > 0 ? (
                        <ul className="space-y-4">
                            {audits.map(audit => (
                                <li key={audit.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{audit.audit_type}</p>
                                        <p className="text-sm text-gray-500">
                                            בוצע ע"י {audit.auditor_name} בתאריך {format(parseISO(audit.audit_date), 'dd/MM/yyyy', { locale: he })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500">ציון</p>
                                            <p className="text-lg font-bold text-green-600">{audit.overall_score}</p>
                                        </div>
                                        <Button asChild variant="outline" size="sm">
                                            <Link to={createPageUrl(`AuditDetails?id=${audit.id}`)}>צפה בדוח</Link>
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">לא נמצאו ביקורות עבור סניף זה.</p>
                    )}
                </CardContent>
            </Card>
            
            <BranchForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                branch={branch}
                onSave={handleSaveBranch}
            />
        </div>
    );
}
