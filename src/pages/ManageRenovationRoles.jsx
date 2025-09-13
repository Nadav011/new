import React, { useState, useEffect } from 'react';
import { RenovationRole } from '@/api/entities';
import { RenovationCategory } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, GripVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ManageRenovationRoles() {
    const [roles, setRoles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [rolesData, categoriesData] = await Promise.all([
            RenovationRole.list(),
            RenovationCategory.list()
        ]);
        setRoles(rolesData.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
        setCategories(categoriesData.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
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

        const reorderedRoles = Array.from(roles);
        const [movedItem] = reorderedRoles.splice(sourceIndex, 1);
        reorderedRoles.splice(destinationIndex, 0, movedItem);

        setRoles(reorderedRoles);
        setIsUpdatingOrder(true);

        try {
            const updates = [];
            for (let i = 0; i < reorderedRoles.length; i++) {
                if (reorderedRoles[i].order_index !== i) {
                    updates.push(RenovationRole.update(reorderedRoles[i].id, { order_index: i }));
                }
            }
            await Promise.all(updates);
        } catch (error) {
            console.error("Error updating order:", error);
            await loadData();
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const handleOpenForm = (role = null) => {
        setSelectedRole(role);
        setIsFormOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.order_index = Number(data.order_index);

        try {
            if (selectedRole) {
                await RenovationRole.update(selectedRole.id, data);
            } else {
                await RenovationRole.create(data);
            }
            await loadData();
            setIsFormOpen(false);
            setSelectedRole(null);
        } catch (error) {
            console.error("Failed to save role:", error);
            alert("שגיאה בשמירת התפקיד.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        await RenovationRole.delete(id);
        await loadData();
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category?.name || 'לא מוגדר';
    };

    const getCategoryColor = (categoryId) => {
        const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800', 'bg-red-100 text-red-800', 'bg-purple-100 text-purple-800'];
        const index = categories.findIndex(c => c.id === categoryId);
        return colors[index % colors.length] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>ניהול תפקידי שיפוץ</CardTitle>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        הוסף תפקיד
                    </Button>
                </CardHeader>
                <CardContent>
                    {isUpdatingOrder && (
                        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                            מעדכן סדר התפקידים...
                        </div>
                    )}
                    
                    {isLoading ? <p>טוען...</p> : (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="roles-list">
                                {(provided) => (
                                    <div 
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2"
                                    >
                                        {roles.map((role, index) => (
                                            <Draggable key={role.id} draggableId={role.id} index={index} isDragDisabled={isUpdatingOrder}>
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
                                                                <span className="font-medium">{role.name}</span>
                                                                <Badge className={getCategoryColor(role.category_id)}>
                                                                    {getCategoryName(role.category_id)}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => handleOpenForm(role)}
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
                                                                        <AlertDialogDescription>האם אתה בטוח שברצונך למחוק את התפקיד "{role.name}"?</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(role.id)} className="bg-red-600">מחק</AlertDialogAction>
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
                    
                    {roles.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-medium mb-2">אין תפקידים מוגדרים</p>
                            <p className="text-sm">לחצו על "הוסף תפקיד" כדי להתחיל</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>{selectedRole ? 'עריכת תפקיד' : 'הוספת תפקיד חדש'}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div>
                                <Label htmlFor="name">שם התפקיד</Label>
                                <Input id="name" name="name" defaultValue={selectedRole?.name} required />
                            </div>
                            <div>
                                <Label htmlFor="category_id">קטגוריה</Label>
                                <Select name="category_id" defaultValue={selectedRole?.category_id} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="בחר קטגוריה..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(category => (
                                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="order_index">סדר תצוגה</Label>
                                <Input id="order_index" name="order_index" type="number" defaultValue={selectedRole?.order_index ?? roles.length} required />
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