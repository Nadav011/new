
import React, { useState, useEffect } from 'react';
import { UploadFile } from '@/api/integrations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Upload, FileImage, X, Image as ImageIcon, PlusCircle, Trash2, Settings, Shield, Building as BuildingIcon, FileText, CreditCard, Monitor, Truck, UserCheck, Music, Globe, Eye, Plus } from 'lucide-react';
import { iconMap } from './IconMap';
import { Separator } from "@/components/ui/separator";
import BranchOwnershipManager from './BranchOwnershipManager';
import ContactManager from './ContactManager';
import { Checkbox } from "@/components/ui/checkbox";
import FileViewer, { useFileViewer } from './FileViewer';

export default function BranchForm({ open, onOpenChange, branch, onSave }) {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingStatutory, setUploadingStatutory] = useState({});
    const [uploadingDocs, setUploadingDocs] = useState({});
    const [newDocumentTitle, setNewDocumentTitle] = useState('');
    const [isContactManagerOpen, setIsContactManagerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    const { viewerState, openFileViewer, closeFileViewer } = useFileViewer();

    const initialFormState = {
        name: '', icon_name: 'Store', custom_icon_url: '', city: '', address: '',
        manager_name: '', manager_phone: '', manager_email: '', phone_number: '', status: 'active', kosher_type: 'כשרות רגילה',
        mashgiach_name: '', mashgiach_phone: '', business_registration_number: '',
        has_accessibility_approval: false, accessibility_approval_start_date: '', accessibility_approval_end_date: '', accessibility_approval_doc_url: '',
        has_business_license: false, business_license_number: '', business_license_issuing_authority: '', business_license_start_date: '', business_license_end_date: '', business_license_doc_url: '',
        has_google_my_business_page: false,
        google_my_business_page_url: '',
        incorporation_certificate_url: '',
        authorized_dealer_certificate_url: '',
        bank_account_approval_url: '',
        authorized_signature_certificate_url: '',
        owner_id_document_url: '',
        credit_card_clearing: [],
        atmos_pos_details: { tablet_count: null, kiosk_station_count: null, receipt_printer_count: null },
        coca_cola_details: { pos_number: '', rented_refrigerators: [] },
        special_arrangements: [],
        documents: [],
        additional_contacts: [],
        delivery_platforms: {
            works_with_ten_bis: false,
            works_with_godi: false,
            works_with_cibus: false,
            works_with_wolt: false,
        },
        music_details: {
            uses_music_service: false,
            music_service_company_name: '',
            pays_acum_royalties: false,
            pays_federation_royalties: false,
        },
    };

    useEffect(() => {
        if (branch) {
            setFormData({
                ...initialFormState,
                ...branch,
                credit_card_clearing: branch.credit_card_clearing || [],
                atmos_pos_details: branch.atmos_pos_details || { tablet_count: null, kiosk_station_count: null, receipt_printer_count: null },
                coca_cola_details: branch.coca_cola_details || { pos_number: '', rented_refrigerators: [] },
                special_arrangements: branch.special_arrangements || [],
                documents: branch.documents || [],
                additional_contacts: branch.additional_contacts || [],
                delivery_platforms: branch.delivery_platforms || {
                    works_with_ten_bis: false,
                    works_with_godi: false,
                    works_with_cibus: false,
                    works_with_wolt: false,
                },
                music_details: branch.music_details || {
                    uses_music_service: false,
                    music_service_company_name: '',
                    pays_acum_royalties: false,
                    pays_federation_royalties: false,
                },
                has_google_my_business_page: branch.has_google_my_business_page || false,
                google_my_business_page_url: branch.google_my_business_page_url || '',
                mashgiach_name: branch.mashgiach_name || '',
                mashgiach_phone: branch.mashgiach_phone || '',
                business_registration_number: branch.business_registration_number || '',
                incorporation_certificate_url: branch.incorporation_certificate_url || '',
                authorized_dealer_certificate_url: branch.authorized_dealer_certificate_url || '',
                bank_account_approval_url: branch.bank_account_approval_url || '',
                authorized_signature_certificate_url: branch.authorized_signature_certificate_url || '',
                owner_id_document_url: branch.owner_id_document_url || '',
            });
        } else {
            setFormData(initialFormState);
        }
        if (open && !branch) {
            setActiveTab('basic');
        } else if (open && branch) {
            setActiveTab('basic');
        }
    }, [branch, open]);
    
    const handleSimpleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleIconChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
            ...(field === 'icon_name' && { custom_icon_url: '' }),
            ...(field === 'custom_icon_url' && { icon_name: '' }),
        }));
    };

    const FileUploadInput = ({ label, fileUrl, onUpload, isUploading, required = false }) => (
        <div className="space-y-2">
            <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>{label}</Label>
            <div className="flex items-center gap-3">
                <Input
                    type="file"
                    onChange={(e) => onUpload(e.target.files[0])}
                    disabled={isUploading}
                    className="flex-1"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                {isUploading ? (
                    <span className="text-sm text-blue-600 flex items-center gap-1">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        מעלה...
                    </span>
                ) : (
                    fileUrl && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openFileViewer(fileUrl, label, label)} // Changed: pass label as fileName
                            className="gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            צפה בקובץ
                        </Button>
                    )
                )}
                {fileUrl && !isUploading && (
                     <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onUpload(null)}
                        className="text-red-600 hover:text-red-700"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );

    const handleStatutoryUpload = async (file, fieldName) => {
        if (!file) {
            handleSimpleChange(fieldName, '');
            return;
        }
        setUploadingStatutory(prev => ({ ...prev, [fieldName]: true }));
        try {
            const result = await UploadFile({ file });
            handleSimpleChange(fieldName, result.file_url);
        } catch (error) {
            console.error(`Error uploading file for ${fieldName}:`, error);
            alert('שגיאה בהעלאת הקובץ');
        } finally {
            setUploadingStatutory(prev => ({ ...prev, [fieldName]: false }));
        }
    };

    const handleClearingChange = (index, field, value) => {
        setFormData(prev => {
            const updated = [...(prev.credit_card_clearing || [])];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, credit_card_clearing: updated };
        });
    };
    const addClearingCompany = () => {
        setFormData(prev => ({...prev, credit_card_clearing: [...(prev.credit_card_clearing || []), { 
            company_name: '', 
            network_parent_number: '',
            supplier_number: '',
            business_name: '',
            pos_address: ''
        }]}));
    };
    const removeClearingCompany = (index) => {
        setFormData(prev => ({...prev, credit_card_clearing: (prev.credit_card_clearing || []).filter((_, i) => i !== index)}));
    };

    const handleAtmosChange = (field, value) => {
        setFormData(prev => ({...prev, atmos_pos_details: { ...(prev.atmos_pos_details || {}), [field]: value === '' ? null : Number(value) }}));
    };

    const handleCokeChange = (field, value) => {
        setFormData(prev => ({...prev, coca_cola_details: { ...(prev.coca_cola_details || {}), [field]: value }}));
    };
    const handleRefrigeratorChange = (index, field, value) => {
        setFormData(prev => {
            const updated = [...(prev.coca_cola_details?.rented_refrigerators || [])];
            updated[index] = { ...updated[index], [field]: value };
            return {...prev, coca_cola_details: { ...prev.coca_cola_details, rented_refrigerators: updated }};
        });
    };
    const addRefrigerator = () => {
        setFormData(prev => ({...prev, coca_cola_details: { ...prev.coca_cola_details, rented_refrigerators: [...(prev.coca_cola_details?.rented_refrigerators || []), { refrigerator_type: '', refrigerator_number: '' }]}}));
    };
    const removeRefrigerator = (index) => {
        setFormData(prev => ({...prev, coca_cola_details: { ...prev.coca_cola_details, rented_refrigerators: (prev.coca_cola_details?.rented_refrigerators || []).filter((_, i) => i !== index)}}));
    };

    const handleMusicDetailsChange = (field, value) => {
        setFormData(prev => {
            const newMusicDetails = {
                ...(prev.music_details || {}),
                [field]: value,
            };
            if (field === 'uses_music_service' && !value) {
                newMusicDetails.music_service_company_name = '';
            }
            return {
                ...prev,
                music_details: newMusicDetails
            };
        });
    };

    const handleArrangementChange = (index, field, value) => {
        setFormData(prev => {
            const updated = [...(prev.special_arrangements || [])];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, special_arrangements: updated };
        });
    };
    const addArrangement = () => {
        setFormData(prev => ({...prev, special_arrangements: [...(prev.special_arrangements || []), { 
            company_name: '', 
            arrangement_details: '',
        }]}));
    };
    const removeArrangement = (index) => {
        setFormData(prev => ({...prev, special_arrangements: (prev.special_arrangements || []).filter((_, i) => i !== index)}));
    };

    const addDocument = () => {
        if (!newDocumentTitle.trim()) { alert("יש להזין שם למסמך."); return; }
        setFormData(prev => ({
            ...prev,
            documents: [...(prev.documents || []), { title: newDocumentTitle.trim(), file_url: '' }]
        }));
        setNewDocumentTitle('');
    };

    const updateDocument = (index, field, value) => {
        setFormData(prev => {
            const updatedDocs = [...(prev.documents || [])];
            if (updatedDocs[index]) {
                updatedDocs[index] = { ...updatedDocs[index], [field]: value };
            }
            return { ...prev, documents: updatedDocs };
        });
    };

    const handleDocumentUpload = async (file, index) => {
        if (!file) {
            updateDocument(index, 'file_url', '');
            return;
        }
        setUploadingDocs(prev => ({ ...prev, [index]: true }));
        try {
            const result = await UploadFile({ file });
            updateDocument(index, 'file_url', result.file_url);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('שגיאה בהעלאת הקובץ');
        } finally {
            setUploadingDocs(prev => ({ ...prev, [index]: false }));
        }
    };
    
    const removeDocument = (index) => {
        setFormData(prev => ({...prev, documents: (prev.documents || []).filter((_, i) => i !== index)}));
    };

    const removeDocumentFile = (index) => {
        updateDocument(index, 'file_url', '');
    };

    const handleContactsSave = (contacts) => {
        setFormData(prev => ({ ...prev, additional_contacts: contacts }));
    };

    const handleDeliveryPlatformChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            delivery_platforms: {
                ...(prev.delivery_platforms || {}),
                [field]: value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    const IconPreview = () => {
        if (formData.custom_icon_url) {
            return <img src={formData.custom_icon_url} alt="אייקון" className="w-8 h-8 rounded-md object-cover" />;
        }
        const SelectedIcon = iconMap[formData.icon_name];
        return SelectedIcon ? <SelectedIcon className="w-8 h-8 text-green-600" /> : <ImageIcon className="w-8 h-8 text-gray-400" />;
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{branch ? 'עריכת סניף' : 'הוספת סניף חדש'}</DialogTitle>
                        <DialogDescription>
                            {branch ? `ערוך את פרטי הסניף "${branch.name}"` : 'מלא את כל הפרטים כדי להוסיף סניף חדש לרשת.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-6">
                                <TabsTrigger value="basic">פרטים בסיסיים</TabsTrigger>
                                <TabsTrigger value="legal">פרטים משפטיים</TabsTrigger>
                                <TabsTrigger value="operational">פרטים תפעוליים</TabsTrigger>
                                <TabsTrigger value="ownership">ניהול בעלויות</TabsTrigger>
                                <TabsTrigger value="contacts">ניהול אנשי קשר</TabsTrigger>
                                <TabsTrigger value="documents">מסמכי סניף</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-lg">פרטים כלליים</CardTitle></CardHeader>
                                    <CardContent className="grid gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label htmlFor="name">שם הסניף *</Label><Input id="name" value={formData.name || ''} onChange={(e) => handleSimpleChange('name', e.target.value)} required /></div>
                                            <div><Label htmlFor="city">עיר *</Label><Input id="city" value={formData.city || ''} onChange={(e) => handleSimpleChange('city', e.target.value)} required /></div>
                                        </div>
                                        <div><Label htmlFor="address">כתובת מלאה *</Label><Input id="address" value={formData.address || ''} onChange={(e) => handleSimpleChange('address', e.target.value)} required /></div>
                                        <div><Label htmlFor="business_registration_number">מספר ח.פ. / ע.מ.</Label><Input id="business_registration_number" value={formData.business_registration_number || ''} onChange={(e) => handleSimpleChange('business_registration_number', e.target.value)} placeholder="לדוגמה: 123456789" /></div>
                                        <Card>
                                            <CardHeader className="pb-2"><CardTitle className="text-md flex items-center justify-between"><span>אייקון הסניף</span><IconPreview /></CardTitle></CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label>בחירה מספרייה</Label>
                                                        <Select onValueChange={(value) => handleIconChange('icon_name', value)} value={formData.icon_name || ''}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>{Object.keys(iconMap).map(iconName => (<SelectItem key={iconName} value={iconName}>{iconName}</SelectItem>))}</SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="text-center text-sm text-gray-500">או</div>
                                                    <div>
                                                        <Label>העלאת אייקון מותאם אישית</Label>
                                                        <div className="flex items-center gap-2">
                                                            <Input placeholder="הדבק קישור לאייקון" value={formData.custom_icon_url || ''} onChange={(e) => handleIconChange('custom_icon_url', e.target.value)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        
                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h3 className="font-semibold">פרטי מנהל ראשי</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div><Label htmlFor="manager_name">שם מנהל</Label><Input id="manager_name" value={formData.manager_name || ''} onChange={(e) => handleSimpleChange('manager_name', e.target.value)} /></div>
                                                <div><Label htmlFor="manager_phone">טלפון נייד</Label><Input id="manager_phone" value={formData.manager_phone || ''} onChange={(e) => handleSimpleChange('manager_phone', e.target.value)} /></div>
                                                <div><Label htmlFor="manager_email">אימייל</Label><Input id="manager_email" type="email" value={formData.manager_email || ''} onChange={(e) => handleSimpleChange('manager_email', e.target.value)} /></div>
                                            </div>
                                        </div>
                                        
                                        <div><Label htmlFor="phone_number">טלפון הסניף</Label><Input id="phone_number" value={formData.phone_number || ''} onChange={(e) => handleSimpleChange('phone_number', e.target.value)} /></div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <Label htmlFor="status">סטטוס הסניף</Label>
                                                <Select onValueChange={(value) => handleSimpleChange('status', value)} value={formData.status || 'active'}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">פעיל</SelectItem>
                                                        <SelectItem value="inactive">לא פעיל</SelectItem>
                                                        <SelectItem value="renovating">בשיפוצים</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="kosher_type">סוג כשרות</Label>
                                                <Select onValueChange={(value) => handleSimpleChange('kosher_type', value)} value={formData.kosher_type || 'כשרות רגילה'}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="כשרות רגילה">כשרות רגילה</SelectItem>
                                                        <SelectItem value="כשרות בדץ">כשרות בדץ</SelectItem>
                                                        <SelectItem value="כשרות צהר">כשרות צהר</SelectItem>
                                                        <SelectItem value="ללא תעודת כשרות-פתוח בשבת">ללא תעודת כשרות-פתוח בשבת</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="mashgiach_name">שם משגיח כשרות</Label>
                                                <Input id="mashgiach_name" value={formData.mashgiach_name || ''} onChange={(e) => handleSimpleChange('mashgiach_name', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label htmlFor="mashgiach_phone">נייד משגיח כשרות</Label>
                                                <Input id="mashgiach_phone" value={formData.mashgiach_phone || ''} onChange={(e) => handleSimpleChange('mashgiach_phone', e.target.value)} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="legal" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="text-blue-600" />אישור נגישות</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>האם קיים אישור נגישות?</Label>
                                            <Select onValueChange={(value) => handleSimpleChange('has_accessibility_approval', value === 'true')} value={String(formData.has_accessibility_approval || false)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="true">כן</SelectItem><SelectItem value="false">לא</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        {formData.has_accessibility_approval && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                                <div><Label>תאריך התחלה</Label><Input type="date" value={formData.accessibility_approval_start_date || ''} onChange={(e) => handleSimpleChange('accessibility_approval_start_date', e.target.value)} /></div>
                                                <div><Label>תאריך תוקף</Label><Input type="date" value={formData.accessibility_approval_end_date || ''} onChange={(e) => handleSimpleChange('accessibility_approval_end_date', e.target.value)} /></div>
                                            </div>
                                        )}
                                        <FileUploadInput 
                                            label="מסמך אישור נגישות" 
                                            fileUrl={formData.accessibility_approval_doc_url} 
                                            onUpload={(file) => handleStatutoryUpload(file, 'accessibility_approval_doc_url')} 
                                            isUploading={uploadingStatutory.accessibility_approval_doc_url} 
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="text-indigo-600" />רישיון עסק</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>האם קיים רישיון עסק?</Label>
                                            <Select onValueChange={(value) => handleSimpleChange('has_business_license', value === 'true')} value={String(formData.has_business_license || false)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="true">כן</SelectItem><SelectItem value="false">לא</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        {formData.has_business_license && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                                <div><Label>מספר רישיון</Label><Input value={formData.business_license_number || ''} onChange={(e) => handleSimpleChange('business_license_number', e.target.value)} /></div>
                                                <div><Label>רשות מנפיקה</Label><Input value={formData.business_license_issuing_authority || ''} onChange={(e) => handleSimpleChange('business_license_issuing_authority', e.target.value)} /></div>
                                                <div><Label>תאריך התחלה</Label><Input type="date" value={formData.business_license_start_date || ''} onChange={(e) => handleSimpleChange('business_license_start_date', e.target.value)} /></div>
                                                <div><Label>תאריך תוקף</Label><Input type="date" value={formData.business_license_end_date || ''} onChange={(e) => handleSimpleChange('business_license_end_date', e.target.value)} /></div>
                                            </div>
                                        )}
                                        <FileUploadInput 
                                            label="מסמך רישיון עסק" 
                                            fileUrl={formData.business_license_doc_url} 
                                            onUpload={(file) => handleStatutoryUpload(file, 'business_license_doc_url')} 
                                            isUploading={uploadingStatutory.business_license_doc_url} 
                                        />
                                    </CardContent>
                                </Card>

                                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                        מסמכים סטטוטוריים
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FileUploadInput
                                            label="תעודת התאגדות (חברה בעמ)"
                                            fileUrl={formData.incorporation_certificate_url}
                                            onUpload={(file) => handleStatutoryUpload(file, 'incorporation_certificate_url')}
                                            isUploading={uploadingStatutory.incorporation_certificate_url}
                                        />
                                        
                                        <FileUploadInput
                                            label="תעודת עוסק מורשה"
                                            fileUrl={formData.authorized_dealer_certificate_url}
                                            onUpload={(file) => handleStatutoryUpload(file, 'authorized_dealer_certificate_url')}
                                            isUploading={uploadingStatutory.authorized_dealer_certificate_url}
                                        />
                                        
                                        <FileUploadInput
                                            label="אישור ניהול חשבון בנק"
                                            fileUrl={formData.bank_account_approval_url}
                                            onUpload={(file) => handleStatutoryUpload(file, 'bank_account_approval_url')}
                                            isUploading={uploadingStatutory.bank_account_approval_url}
                                        />
                                        
                                        <FileUploadInput
                                            label="תעודת מורשה חתימה"
                                            fileUrl={formData.authorized_signature_certificate_url}
                                            onUpload={(file) => handleStatutoryUpload(file, 'authorized_signature_certificate_url')}
                                            isUploading={uploadingStatutory.authorized_signature_certificate_url}
                                        />
                                        
                                        <FileUploadInput
                                            label="תעודת זהות בעלים"
                                            fileUrl={formData.owner_id_document_url}
                                            onUpload={(file) => handleStatutoryUpload(file, 'owner_id_document_url')}
                                            isUploading={uploadingStatutory.owner_id_document_url}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="operational" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Settings />פרטים תפעוליים</CardTitle></CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h3 className="font-semibold flex items-center gap-2"><CreditCard /> סליקת כרטיסי אשראי</h3>
                                            {(formData.credit_card_clearing || []).map((item, index) => (
                                                <div key={index} className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg border">
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div><Label>חברת סליקה</Label><Input value={item.company_name || ''} onChange={(e) => handleClearingChange(index, 'company_name', e.target.value)} placeholder="לדוגמא: ישראכרט"/></div>
                                                        <div><Label>מספר אב רשת</Label><Input value={item.network_parent_number || ''} onChange={(e) => handleClearingChange(index, 'network_parent_number', e.target.value)} /></div>
                                                        <div><Label>מספר ספק</Label><Input value={item.supplier_number || ''} onChange={(e) => handleClearingChange(index, 'supplier_number', e.target.value)} /></div>
                                                        <div><Label>שם בית העסק (בחיוב)</Label><Input value={item.business_name || ''} onChange={(e) => handleClearingChange(index, 'business_name', e.target.value)} /></div>
                                                        <div className="md:col-span-2"><Label>כתובת נקודת מכירה</Label><Input value={item.pos_address || ''} onChange={(e) => handleClearingChange(index, 'pos_address', e.target.value)} /></div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeClearingCompany(index)} className="mt-6"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" onClick={addClearingCompany}><PlusCircle className="w-4 h-4 ml-2"/>הוסף חברת סליקה</Button>
                                        </div>
                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h3 className="font-semibold flex items-center gap-2"><Monitor /> קופות אטמוס</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div><Label htmlFor="tablet_count">מספר טאבלטים</Label><Input id="tablet_count" type="number" value={formData.atmos_pos_details?.tablet_count ?? ''} onChange={(e) => handleAtmosChange('tablet_count', e.target.value)} placeholder="0"/></div>
                                                <div><Label htmlFor="kiosk_station_count">מספר עמדות קיוסק</Label><Input id="kiosk_station_count" type="number" value={formData.atmos_pos_details?.kiosk_station_count ?? ''} onChange={(e) => handleAtmosChange('kiosk_station_count', e.target.value)} placeholder="0"/></div>
                                                <div><Label htmlFor="receipt_printer_count">מספר מדפסות בונים</Label><Input id="receipt_printer_count" type="number" value={formData.atmos_pos_details?.receipt_printer_count ?? ''} onChange={(e) => handleAtmosChange('receipt_printer_count', e.target.value)} placeholder="0"/></div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <Globe className="w-5 h-5 text-blue-600" />
                                                דף עסק בגוגל
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                                <div className="space-y-2">
                                                    <Label>האם קיים דף עסק בגוגל?</Label>
                                                    <Select
                                                        value={String(formData.has_google_my_business_page || false)}
                                                        onValueChange={(val) => {
                                                            const hasPage = val === 'true';
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                has_google_my_business_page: hasPage,
                                                                google_my_business_page_url: hasPage ? prev.google_my_business_page_url : ''
                                                            }));
                                                        }}
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="בחר תשובה..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="true">כן</SelectItem>
                                                            <SelectItem value="false">לא</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {formData.has_google_my_business_page && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="google_my_business_page_url">קישור לדף העסק</Label>
                                                        <Input
                                                            id="google_my_business_page_url"
                                                            value={formData.google_my_business_page_url || ''}
                                                            onChange={(e) => handleSimpleChange('google_my_business_page_url', e.target.value)}
                                                            placeholder="https://g.page/r/..."
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <Truck />
                                                פלטפורמות משלוחים
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <Checkbox
                                                        id="works_with_ten_bis"
                                                        checked={formData.delivery_platforms?.works_with_ten_bis || false}
                                                        onCheckedChange={(checked) => handleDeliveryPlatformChange('works_with_ten_bis', checked)}
                                                    />
                                                    <Label htmlFor="works_with_ten_bis">עובד עם חברת תן ביס</Label>
                                                </div>
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <Checkbox
                                                        id="works_with_godi"
                                                        checked={formData.delivery_platforms?.works_with_godi || false}
                                                        onCheckedChange={(checked) => handleDeliveryPlatformChange('works_with_godi', checked)}
                                                    />
                                                    <Label htmlFor="works_with_godi">עובד עם חברת גודי</Label>
                                                </div>
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <Checkbox
                                                        id="works_with_cibus"
                                                        checked={formData.delivery_platforms?.works_with_cibus || false}
                                                        onCheckedChange={(checked) => handleDeliveryPlatformChange('works_with_cibus', checked)}
                                                    />
                                                    <Label htmlFor="works_with_cibus">עובד עם חברת סיבוס</Label>
                                                </div>
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <Checkbox
                                                        id="works_with_wolt"
                                                        checked={formData.delivery_platforms?.works_with_wolt || false}
                                                        onCheckedChange={(checked) => handleDeliveryPlatformChange('works_with_wolt', checked)}
                                                    />
                                                    <Label htmlFor="works_with_wolt">עובד עם חברת וולט</Label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h3 className="font-semibold flex items-center gap-2"><BuildingIcon /> החברה המרכזית (קוקה קולה)</h3>
                                            <div><Label>מספר נקודת מכירה</Label><Input value={formData.coca_cola_details?.pos_number || ''} onChange={(e) => handleCokeChange('pos_number', e.target.value)} /></div>
                                            <Separator />
                                            <h4 className="font-medium">מקררים בהשכרה</h4>
                                            {(formData.coca_cola_details?.rented_refrigerators || []).map((item, index) => (
                                                <div key={index} className="flex items-end gap-2 p-3 bg-gray-50 rounded">
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div><Label>סוג מקרר</Label><Input value={item.refrigerator_type || ''} onChange={(e) => handleRefrigeratorChange(index, 'refrigerator_type', e.target.value)} placeholder="לדוגמא: מקרר שתיה גדול"/></div>
                                                        <div><Label>מספר מקרר</Label><Input value={item.refrigerator_number || ''} onChange={(e) => handleRefrigeratorChange(index, 'refrigerator_number', e.target.value)} /></div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRefrigerator(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" onClick={addRefrigerator}><PlusCircle className="w-4 h-4 ml-2"/>הוסף מקרר</Button>
                                        </div>

                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <Music className="w-5 h-5 text-purple-600" />
                                                מוזיקה בעסק
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                <div className="space-y-2">
                                                    <Label>האם משתמש בשירותים של חברת מוזיקה?</Label>
                                                    <Select
                                                        value={String(formData.music_details?.uses_music_service || false)}
                                                        onValueChange={(val) => handleMusicDetailsChange('uses_music_service', val === 'true')}
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="בחר תשובה..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="true">כן</SelectItem>
                                                            <SelectItem value="false">לא</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {formData.music_details?.uses_music_service && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="music_service_company_name">שם החברה</Label>
                                                        <Input
                                                            id="music_service_company_name"
                                                            value={formData.music_details?.music_service_company_name || ''}
                                                            onChange={(e) => handleMusicDetailsChange('music_service_company_name', e.target.value)}
                                                            placeholder="הזן את שם חברת המוזיקה"
                                                        />
                                                    </div>
                                                )}

                                                <div className="space-y-2 md:col-start-1">
                                                    <Label>האם משלם תמלוגים לאקו"ם?</Label>
                                                    <Select
                                                        value={String(formData.music_details?.pays_acum_royalties || false)}
                                                        onValueChange={(val) => handleMusicDetailsChange('pays_acum_royalties', val === 'true')}
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="בחר תשובה..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="true">כן</SelectItem>
                                                            <SelectItem value="false">לא</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>האם משלם תמלוגים לפדרציה?</Label>
                                                    <Select
                                                        value={String(formData.music_details?.pays_federation_royalties || false)}
                                                        onValueChange={(val) => handleMusicDetailsChange('pays_federation_royalties', val === 'true')}
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="בחר תשובה..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="true">כן</SelectItem>
                                                            <SelectItem value="false">לא</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <h3 className="font-semibold flex items-center gap-2"><FileText /> הסדרים מיוחדים עם חברות שונות</h3>
                                            {(formData.special_arrangements || []).map((item, index) => (
                                                <div key={index} className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg border">
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div><Label>שם החברה</Label><Input value={item.company_name || ''} onChange={(e) => handleArrangementChange(index, 'company_name', e.target.value)} placeholder="לדוגמא: תן ביס"/></div>
                                                        <div><Label>סוג ההסדר</Label><Input value={item.arrangement_details || ''} onChange={(e) => handleArrangementChange(index, 'arrangement_details', e.target.value)} placeholder="לדוגמא: 10% הנחה"/></div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrangement(index)} className="mt-6"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" onClick={addArrangement}><PlusCircle className="w-4 h-4 ml-2"/>הוסף חברה</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="ownership" className="space-y-4 mt-4">
                                <BranchOwnershipManager branchId={branch?.id} />
                            </TabsContent>

                            <TabsContent value="contacts" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2"><PlusCircle /> אנשי קשר נוספים</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Button type="button" onClick={() => setIsContactManagerOpen(true)}>
                                            <PlusCircle className="ml-2 h-4 w-4" />
                                            ניהול אנשי קשר
                                        </Button>
                                        <div className="mt-4 space-y-2">
                                            {(formData.additional_contacts || []).length > 0 ? (
                                                (formData.additional_contacts || []).map((contact, index) => (
                                                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                                                        <p className="font-semibold">{contact.name} <span className="text-sm font-normal text-gray-500">- {contact.role}</span></p>
                                                        <p className="text-sm text-gray-600">טלפון: {contact.phone}</p>
                                                        <p className="text-sm text-gray-600">אימייל: {contact.email}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">
                                                    אין אנשי קשר נוספים שהוגדרו.
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="documents" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText />ניהול מסמכי סניף</CardTitle></CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold flex items-center gap-2">
                                                    <PlusCircle className="w-5 h-5 text-green-600" />
                                                    מסמכים נוספים
                                                </h3>
                                                <Button type="button" variant="outline" onClick={addDocument} className="gap-2">
                                                    <Plus className="w-4 h-4" />
                                                    הוסף מסמך
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>הוספת סוג מסמך חדש</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input 
                                                        placeholder="לדוגמא: חוזה שכירות, תוכניות אדריכל..." 
                                                        value={newDocumentTitle} 
                                                        onChange={e => setNewDocumentTitle(e.target.value)}
                                                        onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addDocument(); }}}
                                                    />
                                                    <Button type="button" onClick={addDocument}>הוסף</Button>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="font-medium">רשימת מסמכים נוספים</h4>
                                                {(formData.documents || []).length > 0 ? (
                                                    (formData.documents || []).map((doc, index) => (
                                                        <div key={index} className="flex flex-col gap-3 p-4 border rounded-lg bg-gray-50">
                                                            <div className="flex justify-between items-center">
                                                                <p className="font-semibold text-lg">{doc.title}</p>
                                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(index)} title="מחק מסמך">
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                </Button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-medium">קובץ למסמך זה:</Label>
                                                                <div className="flex items-center gap-3">
                                                                    <Input
                                                                        type="file"
                                                                        onChange={(e) => handleDocumentUpload(e.target.files[0], index)}
                                                                        disabled={uploadingDocs[index]}
                                                                        className="flex-1"
                                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                                    />
                                                                    {uploadingDocs[index] ? (
                                                                        <span className="text-sm text-blue-600 flex items-center gap-1">
                                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                                            מעלה...
                                                                        </span>
                                                                    ) : (
                                                                        doc.file_url && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => openFileViewer(doc.file_url, doc.title, doc.title)} // Changed: pass doc.title as fileName
                                                                                className="gap-2"
                                                                            >
                                                                                <Eye className="w-4 h-4" />
                                                                                צפה
                                                                            </Button>
                                                                        )
                                                                    )}
                                                                    {doc.file_url && !uploadingDocs[index] && (
                                                                        <Button 
                                                                            type="button" 
                                                                            variant="ghost" 
                                                                            size="icon"
                                                                            onClick={() => removeDocumentFile(index)}
                                                                            className="text-red-600 hover:text-red-700"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                                        <p className="text-gray-500 mb-2">לא הוגדרו מסמכים נוספים עדיין</p>
                                                        <p className="text-sm text-gray-400">הוסף שם למסמך למעלה כדי להתחיל</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="pt-6">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
                            <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                                <Save className="ml-2 h-4 w-4" />
                                {isSaving ? 'שומר...' : 'שמור שינויים'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ContactManager
                open={isContactManagerOpen}
                onOpenChange={setIsContactManagerOpen}
                contacts={formData.additional_contacts || []}
                onSave={handleContactsSave}
            />
            <FileViewer
                isOpen={viewerState.isOpen}
                onClose={closeFileViewer}
                fileUrl={viewerState.fileUrl}
                fileName={viewerState.fileName}
                title={viewerState.title}
            />
        </>
    );
}
