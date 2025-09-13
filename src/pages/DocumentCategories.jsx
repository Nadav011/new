import React, { useState, useEffect } from 'react';
import { DocumentCategory } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Tag, AlertCircle, RefreshCw, Save, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function DocumentCategories() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: 'blue',
        is_active: true
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await DocumentCategory.list('order_index');
            setCategories(data);
        } catch (error) {
            console.error("Error loading categories:", error);
            setLoadError("אירעה שגיאת רשת. לא ניתן היה לטעון את רשימת הקטגוריות.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (category = null) => {
        if (category) {
            setSelectedCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                color: category.color || 'blue',
                is_active: category.is_active !== false
            });
        } else {
            setSelectedCategory(null);
            setFormData({
                name: '',
                description: '',
                color: 'blue',
                is_active: true
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
            const saveData = {
                ...formData,
                order_index: selectedCategory ? selectedCategory.order_index : categories.length
            };

            if (selectedCategory) {
                await DocumentCategory.update(selectedCategory.id, saveData);
            } else {
                await DocumentCategory.create(saveData);
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
        if (categoryToDelete) {
            try {
                await DocumentCategory.delete(categoryToDelete.id);
                await loadCategories();
                setCategoryToDelete(null);
                alert('הקטגוריה נמחקה בהצלחה');
            } catch (error) {
                console.error("Error deleting category:", error);
                alert('שגיאה במחיקת הקטגוריה');
            }
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination || isUpdatingOrder) {
            return;
        }

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) {
            return;
        }

        const reorderedCategories = Array.from(categories);
        const [movedItem] = reorderedCategories.splice(sourceIndex, 1);
        reorderedCategories.splice(destinationIndex, 0, movedItem);

        setCategories(reorderedCategories);
        setIsUpdatingOrder(true);

        try {
            const updates = [];
            for (let i = 0; i < reorderedCategories.length; i++) {
                if (reorderedCategories[i].order_index !== i) {
                    updates.push(DocumentCategory.update(reorderedCategories[i].id, { order_index: i }));
                }
            }
            await Promise.all(updates);
        } catch (error) {
            console.error("Error updating order:", error);
            await loadCategories();
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const getColorClass = (color) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-800',
            green: 'bg-green-100 text-green-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            red: 'bg-red-100 text-red-800',
            purple: 'bg-purple-100 text-purple-800',
            pink: 'bg-pink-100 text-pink-800',
            indigo: 'bg-indigo-100 text-indigo-800',
            gray: 'bg-gray-100 text-gray-800'
        };
        return colors[color] || colors.blue;
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
                        ניהול קטגוריות מסמכים
                    </h1>
                    <p className="text-gray-600">נהלו את רשימת הקטגוריות הזמינות עבור המסמכים הרשתיים</p>
                </div>
                <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700 gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף קטגוריה חדשה
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>רשימת קטגוריות ({categories.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isUpdatingOrder && (
                        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                            מעדכן סדר הקטגוריות...
                        </div>
                    )}
                    
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="categories-list">
                            {(provided) => (
                                <div 
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2"
                                >
                                    {categories.map((category, index) => (
                                        <Draggable key={category.id} draggableId={category.id} index={index} isDragDisabled={isUpdatingOrder}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                                        snapshot.isDragging ? 'bg-green-50 shadow-lg' : 'bg-white'
                                                    } ${isUpdatingOrder ? 'opacity-50' : ''}`}
                                                >
                                                    <div 
                                                        {...provided.dragHandleProps} 
                                                        className={`cursor-grab p-1 text-gray-500 hover:text-gray-700 ${
                                                            isUpdatingOrder ? 'cursor-not-allowed' : ''
                                                        }`}
                                                    >
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{category.name}</span>
                                                            <Badge className={getColorClass(category.color)}>
                                                                {category.color}
                                                            </Badge>
                                                            {!category.is_active && (
                                                                <Badge variant="secondary">לא פעיל</Badge>
                                                            )}
                                                        </div>
                                                        {category.description && (
                                                            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => handleOpenForm(category)}
                                                            disabled={isUpdatingOrder}
                                                        >
                                                            <Edit className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => setCategoryToDelete(category)}
                                                            disabled={isUpdatingOrder}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                    
                    {categories.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">אין קטגוריות מוגדרות</p>
                            <p className="text-sm">לחצו על "הוסף קטגוריה חדשה" כדי להתחיל</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form Dialog */}
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
                                placeholder="למשל: הנהלה, כספים, רגולציה..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">תיאור (אופציונלי)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="תיאור קצר של הקטגוריה..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="color">צבע</Label>
                            <Select 
                                value={formData.color} 
                                onValueChange={(value) => setFormData({...formData, color: value})}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="בחר צבע..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="blue">כחול</SelectItem>
                                    <SelectItem value="green">ירוק</SelectItem>
                                    <SelectItem value="yellow">צהוב</SelectItem>
                                    <SelectItem value="red">אדום</SelectItem>
                                    <SelectItem value="purple">סגול</SelectItem>
                                    <SelectItem value="pink">ורוד</SelectItem>
                                    <SelectItem value="indigo">אינדיגו</SelectItem>
                                    <SelectItem value="gray">אפור</SelectItem>
                                </SelectContent>
                            </Select>
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקת קטגוריה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את הקטגוריה "{categoryToDelete?.name}"?
                            <br />
                            <strong className="text-red-600">פעולה זו בלתי הפיכה!</strong>
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