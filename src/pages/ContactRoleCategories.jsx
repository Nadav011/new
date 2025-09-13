import React, { useState, useEffect } from 'react';
import { ContactRole } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Tag, AlertCircle, RefreshCw, Save, Users, Building } from 'lucide-react';

export default function ContactRoleCategories() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const predefinedCategories = [
        { name: 'מקצועות', description: 'אנשי מקצוע כמו אדריכלים, מהנדסים, קבלנים' },
        { name: 'רשויות', description: 'גורמים ממשלתיים ורשויות מקומיות' },
        { name: 'ספקים', description: 'ספקים של ציוד, חומרים ושירותים' },
        { name: 'שירותים', description: 'נותני שירותים שונים' },
        { name: 'משפטי ופיננסי', description: 'עורכי דין, רואי חשבון, יועצים פיננסיים' },
        { name: 'אחר', description: 'קטגוריות נוספות שלא נכללות במקומות אחרים' }
    ];

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const roles = await ContactRole.list();
            const categoryMap = {};
            
            // תחילה נוסיף את הקטגוריות המוגדרות מראש
            predefinedCategories.forEach(cat => {
                categoryMap[cat.name] = {
                    name: cat.name,
                    description: cat.description,
                    roleCount: 0,
                    isPredefined: true // Add this flag
                };
            });

            // כעת נוסיף את כל הקטגוריות שבפועל קיימות בתפקידים
            roles.forEach(role => {
                const category = role.category || 'אחר';
                if (categoryMap[category]) {
                    categoryMap[category].roleCount++;
                } else {
                    // זו קטגוריה שלא הוגדרה מראש - נוסיף אותה
                    categoryMap[category] = {
                        name: category,
                        description: '', // Still empty for dynamically found non-predefined categories
                        roleCount: 1,
                        isPredefined: false // Add this flag
                    };
                }
            });

            setCategories(Object.values(categoryMap));
        } catch (error) {
            console.error("Error loading categories:", error);
            setLoadError("אירעה שגיאת רשת. לא ניתן היה לטעון את הקטגוריות.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (category = null) => {
        if (category) {
            setSelectedCategory(category);
            setFormData({
                name: category.name,
                description: category.description || ''
            });
        } else {
            setSelectedCategory(null);
            setFormData({
                name: '',
                description: ''
            });
        }
        setIsFormOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!formData.name.trim()) {
            alert('יש להזין שם קטגוריה');
            return;
        }

        try {
            if (selectedCategory) {
                // עריכת קטגוריה קיימת
                if (selectedCategory.name !== formData.name) {
                    // שינוי שם הקטגוריה - צריך לעדכן את כל התפקידים
                    const roles = await ContactRole.filter({ category: selectedCategory.name });
                    const updatePromises = roles.map(role => 
                        ContactRole.update(role.id, { ...role, category: formData.name })
                    );
                    await Promise.all(updatePromises);
                }
                
                // במקרה של עריכה, אין שמירה נפרדת של הקטגוריה עצמה
                // היא קיימת רק כחלק מהתפקידים
                alert('קטגוריה עודכנה בהצלחה');
            } else {
                // הוספת קטגוריה חדשה - ניצור תפקיד דמה כדי שהקטגוריה תופיע
                await ContactRole.create({
                    name: `קטגוריה: ${formData.name}`,
                    description: `תפקיד דמה לקטגוריית ${formData.name}`,
                    category: formData.name,
                    is_active: false // לא פעיל כדי שלא יופיע ברשימות רגילות
                });
                alert('קטגוריה חדשה נוצרה בהצלחה');
            }
            
            await loadCategories();
            setIsFormOpen(false);
            setSelectedCategory(null);
        } catch (error) {
            console.error("Error saving category:", error);
            alert('שגיאה בשמירת הקטגוריה');
        }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        if (categoryToDelete.name === 'אחר') {
            alert('לא ניתן למחוק את קטגוריית "אחר", היא משמשת כברירת מחדל.');
            setCategoryToDelete(null);
            return;
        }

        try {
            // מעביר את כל התפקידים לקטגוריית "אחר"
            const rolesToUpdate = await ContactRole.filter({ category: categoryToDelete.name });
            const updatePromises = rolesToUpdate.map(role => 
                ContactRole.update(role.id, { ...role, category: 'אחר' })
            );

            await Promise.all(updatePromises);
            
            await loadCategories();
            setCategoryToDelete(null);
            alert(`הקטגוריה "${categoryToDelete.name}" נמחקה וכל התפקידים שהיו תחתיה הועברו לקטגוריית "אחר".`);
        } catch (error) {
            console.error("Error deleting category:", error);
            alert('שגיאה במחיקת הקטגוריה');
        }
    };

    const getCategoryColor = (categoryName) => {
        const colors = {
            'מקצועות': 'bg-blue-100 text-blue-800',
            'רשויות': 'bg-red-100 text-red-800',
            'ספקים': 'bg-green-100 text-green-800',
            'שירותים': 'bg-yellow-100 text-yellow-800',
            'משפטי ופיננסי': 'bg-purple-100 text-purple-800',
            'אחר': 'bg-gray-100 text-gray-800'
        };
        return colors[categoryName] || 'bg-gray-100 text-gray-800';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">טוען קטגוריות...</div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הקטגוריות</h3>
                <p className="text-red-600 mb-4">{loadError}</p>
                <Button onClick={loadCategories}>
                    <RefreshCw className="ml-2 h-4 w-4" />
                    נסה שוב
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <Tag className="w-6 h-6" />
                        ניהול קטגוריות תפקידים
                    </h1>
                    <p className="text-gray-600">נהלו את הקטגוריות הזמינות לסיווג תפקידי אנשי הקשר</p>
                </div>
                <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700 gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף קטגוריה חדשה
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <Card key={category.name} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-start justify-between pb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={getCategoryColor(category.name)}>
                                        {category.name}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users className="w-4 h-4" />
                                    <span>{category.roleCount} תפקידים</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleOpenForm(category)}
                                >
                                    <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                {category.name !== 'אחר' && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setCategoryToDelete(category)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                {category.description || 'אין תיאור זמין'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {categories.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12 text-gray-500">
                        <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">אין קטגוריות מוגדרות</p>
                        <p className="text-sm">הקטגוריות נוצרות אוטומטית בעת הוספת תפקידים</p>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{selectedCategory ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="name">שם הקטגוריה</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="למשל: יועצים, בטיחות..."
                                className="mt-1"
                                disabled={selectedCategory?.name === 'אחר'}
                            />
                            {selectedCategory?.name === 'אחר' && <p className='text-xs text-gray-500 mt-1'>לא ניתן לשנות את שם קטגוריית "אחר".</p>}
                        </div>
                        <div>
                            <Label htmlFor="description">תיאור הקטגוריה (אופציונלי)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="תיאור קצר של סוג התפקידים בקטגוריה זו..."
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                            ביטול
                        </Button>
                        <Button onClick={handleSaveCategory} className="bg-green-600 hover:bg-green-700">
                            <Save className="ml-2 h-4 w-4" />
                            שמירה
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקת קטגוריה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את הקטגוריה "{categoryToDelete?.name}"?
                            <br />
                            <strong className="text-blue-600 font-normal">כל התפקידים המשויכים לקטגוריה זו יועברו אוטומטית לקטגוריית "אחר".</strong>
                            <br />
                            פעולה זו אינה ניתנת לביטול.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteCategory}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            מחק קטגוריה
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}