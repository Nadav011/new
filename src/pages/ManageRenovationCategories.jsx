import React, { useState, useEffect } from 'react';
import { RenovationCategory } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, GripVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ManageRenovationCategories() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        const data = await RenovationCategory.list();
        setCategories(data.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
        setIsLoading(false);
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
                    updates.push(RenovationCategory.update(reorderedCategories[i].id, { order_index: i }));
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

    const handleOpenForm = (category = null) => {
        setSelectedCategory(category);
        setIsFormOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.order_index = Number(data.order_index);

        try {
            if (selectedCategory) {
                await RenovationCategory.update(selectedCategory.id, data);
            } else {
                await RenovationCategory.create(data);
            }
            await loadCategories();
            setIsFormOpen(false);
            setSelectedCategory(null);
        } catch (error) {
            console.error("Failed to save category:", error);
            alert("שגיאה בשמירת הקטגוריה.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        await RenovationCategory.delete(id);
        await loadCategories();
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>ניהול קטגוריות שיפוץ</CardTitle>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        הוסף קטגוריה
                    </Button>
                </CardHeader>
                <CardContent>
                    {isUpdatingOrder && (
                        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                            מעדכן סדר הקטגוריות...
                        </div>
                    )}
                    
                    {isLoading ? <p>טוען...</p> : (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="categories-list">
                                {(provided) => (
                                    <div 
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2"
                                    >
                                        {categories.map((cat, index) => (
                                            <Draggable key={cat.id} draggableId={cat.id} index={index} isDragDisabled={isUpdatingOrder}>
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
                                                            <div className="font-medium">{cat.name}</div>
                                                            {cat.description && (
                                                                <div className="text-sm text-gray-500">{cat.description}</div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => handleOpenForm(cat)}
                                                                disabled={isUpdatingOrder}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon"
                                                                        disabled={isUpdatingOrder}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                                                                        <AlertDialogDescription>האם אתה בטוח שברצונך למחוק את הקטגוריה "{cat.name}"?</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-red-600">מחק</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
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
                    )}
                    
                    {categories.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-medium mb-2">אין קטגוריות מוגדרות</p>
                            <p className="text-sm">לחצו על "הוסף קטגוריה" כדי להתחיל</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>{selectedCategory ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div>
                                <Label htmlFor="name">שם הקטגוריה</Label>
                                <Input id="name" name="name" defaultValue={selectedCategory?.name} required />
                            </div>
                            <div>
                                <Label htmlFor="description">תיאור</Label>
                                <Textarea id="description" name="description" defaultValue={selectedCategory?.description} />
                            </div>
                            <div>
                                <Label htmlFor="order_index">סדר תצוגה</Label>
                                <Input id="order_index" name="order_index" type="number" defaultValue={selectedCategory?.order_index ?? categories.length} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" disabled={isSaving} onClick={() => setIsFormOpen(false)}>ביטול</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? 'שומר...' : 'שמור'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}