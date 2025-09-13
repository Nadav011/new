
import React, { useState, useEffect, useMemo } from 'react';
import { RenovationCategory } from '@/api/entities';
import { RenovationRole } from '@/api/entities';
import { RenovationProfessional } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function ProfessionalForm({ open, onOpenChange, onSave, roles, professional, isSaving }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        onSave(data);
    };

    const roleGroups = useMemo(() => {
        if (!roles) return {};
        return roles.reduce((acc, role) => {
            (acc[role.category_name] = acc[role.category_name] || []).push(role);
            return acc;
        }, {});
    }, [roles]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{professional ? 'עריכת איש מקצוע' : 'הוספת איש מקצוע'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <Input type="hidden" name="id" defaultValue={professional?.id} />
                        <div>
                            <Label htmlFor="name">שם מלא</Label>
                            <Input id="name" name="name" defaultValue={professional?.name} required />
                        </div>
                        <div>
                            <Label htmlFor="role_id">תפקיד</Label>
                            <Select name="role_id" defaultValue={professional?.role_id} required>
                                <SelectTrigger><SelectValue placeholder="בחר תפקיד" /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(roleGroups).map(([categoryName, rolesInCategory]) => (
                                        <div key={categoryName}>
                                            <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">{categoryName}</div>
                                            {rolesInCategory.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="phone">טלפון</Label>
                            <Input id="phone" name="phone" defaultValue={professional?.phone} />
                        </div>
                        <div>
                            <Label htmlFor="email">אימייל</Label>
                            <Input id="email" name="email" type="email" defaultValue={professional?.email} />
                        </div>
                        <div>
                            <Label htmlFor="company">חברה</Label>
                            <Input id="company" name="company" defaultValue={professional?.company} />
                        </div>
                        <div>
                            <Label htmlFor="service_area">אזור שירות</Label>
                            <Select name="service_area" defaultValue={professional?.service_area}>
                                <SelectTrigger><SelectValue placeholder="בחר אזור" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="צפון">צפון</SelectItem>
                                    <SelectItem value="דרום">דרום</SelectItem>
                                    <SelectItem value="מרכז">מרכז</SelectItem>
                                    <SelectItem value="כל הארץ">כל הארץ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="notes">הערות</Label>
                            <Input id="notes" name="notes" defaultValue={professional?.notes} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" disabled={isSaving} onClick={() => onOpenChange(false)}>ביטול</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'שומר...' : 'שמור'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function RenovationProfessionals() {
    const [data, setData] = useState({ categories: [], roles: [], professionals: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState(null);
    const [professionalToDelete, setProfessionalToDelete] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [categoriesData, rolesData, professionalsData] = await Promise.all([
            RenovationCategory.list(),
            RenovationRole.list(),
            RenovationProfessional.list()
        ]);
        const categoriesMap = new Map(categoriesData.map(c => [c.id, c.name]));
        const rolesMap = new Map(rolesData.map(r => [r.id, r.name]));
        setData({
            categories: categoriesData.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
            roles: rolesData.map(r => ({ ...r, category_name: categoriesMap.get(r.category_id) || 'ללא קטגוריה' })),
            professionals: professionalsData.map(p => ({ ...p, role_name: rolesMap.get(p.role_id) || 'ללא תפקיד' })),
        });
        setIsLoading(false);
    };

    const handleSaveProfessional = async (formData) => {
        setIsSaving(true);
        try {
            if (formData.id) {
                await RenovationProfessional.update(formData.id, formData);
            } else {
                await RenovationProfessional.create(formData);
            }
            await loadData();
            setIsFormOpen(false);
            setSelectedProfessional(null);
        } catch (error) {
            console.error("Failed to save professional:", error);
            alert("שגיאה בשמירת איש המקצוע.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteProfessional = async () => {
        if(professionalToDelete){
            await RenovationProfessional.delete(professionalToDelete.id);
            await loadData();
            setProfessionalToDelete(null);
        }
    };

    const structuredData = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();

        // If no search term, show everything (categories and their roles, including empty ones)
        if (!lowercasedTerm) {
            return data.categories.map(category => {
                const rolesForCategory = data.roles
                    .filter(r => r.category_id === category.id)
                    .map(role => ({
                        ...role,
                        professionals: data.professionals.filter(p => p.role_id === role.id)
                    }));
                
                return {
                    ...category,
                    roles: rolesForCategory
                };
            }).filter(category => category.roles.length > 0);
        }

        // Function to check if a professional matches the search term
        const professionalMatches = (p) => {
            return (
                p.name.toLowerCase().includes(lowercasedTerm) ||
                p.role_name.toLowerCase().includes(lowercasedTerm) ||
                (p.company && p.company.toLowerCase().includes(lowercasedTerm)) ||
                (p.phone && p.phone.includes(lowercasedTerm)) ||
                (p.email && p.email.toLowerCase().includes(lowercasedTerm)) ||
                (p.service_area && p.service_area.toLowerCase().includes(lowercasedTerm)) ||
                (p.notes && p.notes.toLowerCase().includes(lowercasedTerm))
            );
        };

        // Filter data hierarchically
        return data.categories
            .map(category => {
                const categoryMatches = category.name.toLowerCase().includes(lowercasedTerm);

                const filteredRoles = data.roles
                    .filter(role => role.category_id === category.id)
                    .map(role => {
                        const roleMatches = role.name.toLowerCase().includes(lowercasedTerm);
                        const professionalsInRole = data.professionals.filter(p => p.role_id === role.id);
                        
                        const professionalsToShow = (categoryMatches || roleMatches)
                            ? professionalsInRole
                            : professionalsInRole.filter(professionalMatches);
                        
                        return {
                            ...role,
                            professionals: professionalsToShow,
                        };
                    })
                    .filter(role => role.professionals.length > 0);

                return {
                    ...category,
                    roles: filteredRoles,
                };
            })
            .filter(category => category.roles.length > 0);

    }, [data, searchTerm]);

    if (isLoading) return <p>טוען נתונים...</p>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>אנשי מקצוע בשיפוץ</CardTitle>
                    <Button onClick={() => {setSelectedProfessional(null); setIsFormOpen(true);}}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        הוסף איש מקצוע
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="חיפוש לפי קטגוריה, תפקיד, שם, טלפון, אזור..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>

                    <Accordion 
                        type="multiple" 
                        className="w-full" 
                        key={searchTerm} // Force re-render on search to open relevant sections
                        defaultValue={structuredData.map(c => `cat-${c.id}`)}
                    >
                        {structuredData.map(category => (
                            <AccordionItem value={`cat-${category.id}`} key={category.id}>
                                <AccordionTrigger className="bg-gray-100 px-4 rounded-t-lg">
                                    <span className="font-bold text-lg">{category.name}</span>
                                </AccordionTrigger>
                                <AccordionContent className="p-0">
                                    <Accordion 
                                        type="multiple" 
                                        className="w-full" 
                                        defaultValue={category.roles.map(r => `role-${r.id}`)}
                                    >
                                        {category.roles.map(role => (
                                            <AccordionItem value={`role-${role.id}`} key={role.id} className="border-b">
                                                <AccordionTrigger className="px-4 hover:bg-gray-50">
                                                    <span className="font-semibold">{role.name} ({role.professionals.length})</span>
                                                </AccordionTrigger>
                                                <AccordionContent className="p-0">
                                                    {role.professionals.length > 0 ? (
                                                        <Table>
                                                            <TableHeader>
                                                              <TableRow>
                                                                <TableHead>שם</TableHead>
                                                                <TableHead>טלפון</TableHead>
                                                                <TableHead>אזור שירות</TableHead>
                                                                <TableHead>פעולות</TableHead>
                                                              </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {role.professionals.map(prof => (
                                                                    <TableRow key={prof.id}>
                                                                        <TableCell>
                                                                            <div>{prof.name}</div>
                                                                            <div className="text-xs text-gray-500">{prof.company}</div>
                                                                        </TableCell>
                                                                        <TableCell>{prof.phone}</TableCell>
                                                                        <TableCell>{prof.service_area}</TableCell>
                                                                        <TableCell className="flex gap-1">
                                                                             <Button variant="ghost" size="icon" onClick={() => {setSelectedProfessional(prof); setIsFormOpen(true);}}>
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" onClick={() => setProfessionalToDelete(prof)}>
                                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    ) : (
                                                        <p className="p-4 text-center text-sm text-gray-500">אין אנשי מקצוע להצגה.</p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    {structuredData.length === 0 && !isLoading && <p className="text-center py-8 text-gray-500">לא נמצאו אנשי מקצוע התואמים לחיפוש.</p>}
                </CardContent>
            </Card>

            <ProfessionalForm 
                open={isFormOpen} 
                onOpenChange={setIsFormOpen}
                onSave={handleSaveProfessional}
                roles={data.roles}
                professional={selectedProfessional}
                isSaving={isSaving}
            />
            
            <AlertDialog open={!!professionalToDelete} onOpenChange={() => setProfessionalToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>האם אתה בטוח שברצונך למחוק את איש המקצוע "{professionalToDelete?.name}"?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProfessional} className="bg-red-600">מחק</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
