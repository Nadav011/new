import React, { useState, useEffect } from 'react';
import { ContactRole } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users, AlertCircle, RefreshCw, Save, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ContactRoles() {
    const [roles, setRoles] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'אחר',
        is_active: true
    });

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await ContactRole.list('order_index');
            setRoles(data);
            
            const predefinedCategoryNames = [ 'מקצועות', 'רשויות', 'ספקים', 'שירותים', 'משפטי ופיננסי', 'אחר' ];
            const categoriesFromRoles = data.map(role => role.category).filter(Boolean);
            const allCategories = [...new Set([...predefinedCategoryNames, ...categoriesFromRoles])].sort((a,b) => a.localeCompare(b, 'he'));
            setAvailableCategories(allCategories);

        } catch (error) {
            console.error("Error loading roles:", error);
            setLoadError("אירעה שגיאת רשת. לא ניתן היה לטעון את רשימת התפקידים.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (role = null) => {
        if (role) {
            setSelectedRole(role);
            setFormData({
                name: role.name,
                description: role.description || '',
                category: role.category || 'אחר',
                is_active: role.is_active !== false
            });
        } else {
            setSelectedRole(null);
            setFormData({
                name: '',
                description: '',
                category: 'אחר',
                is_active: true
            });
        }
        setIsFormOpen(true);
    };

    const handleSaveRole = async () => {
        if (!formData.name.trim()) {
            alert('יש להזין שם תפקיד');
            return;
        }

        try {
            const saveData = {
                ...formData,
                order_index: selectedRole ? selectedRole.order_index : roles.length
            };

            if (selectedRole) {
                await ContactRole.update(selectedRole.id, saveData);
            } else {
                await ContactRole.create(saveData);
            }

            await loadRoles();
            setIsFormOpen(false);
            setSelectedRole(null);
        } catch (error) {
            console.error("Error saving role:", error);
            alert('שגיאה בשמירת התפקיד');
        }
    };

    const handleDeleteRole = async () => {
        if (roleToDelete) {
            try {
                await ContactRole.delete(roleToDelete.id);
                await loadRoles();
                setRoleToDelete(null);
                alert('התפקיד נמחק בהצלחה');
            } catch (error) {
                console.error("Error deleting role:", error);
                alert('שגיאה במחיקת התפקיד');
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

        const reorderedRoles = Array.from(roles);
        const [movedItem] = reorderedRoles.splice(sourceIndex, 1);
        reorderedRoles.splice(destinationIndex, 0, movedItem);

        setRoles(reorderedRoles);
        setIsUpdatingOrder(true);

        try {
            const updates = [];
            for (let i = 0; i < reorderedRoles.length; i++) {
                if (reorderedRoles[i].order_index !== i) {
                    updates.push(ContactRole.update(reorderedRoles[i].id, { order_index: i }));
                }
            }
            await Promise.all(updates);
        } catch (error) {
            console.error("Error updating order:", error);
            await loadRoles();
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'מקצועות': 'bg-blue-100 text-blue-800',
            'רשויות': 'bg-red-100 text-red-800',
            'ספקים': 'bg-green-100 text-green-800',
            'שירותים': 'bg-yellow-100 text-yellow-800',
            'משפטי ופיננסי': 'bg-purple-100 text-purple-800',
            'אחר': 'bg-gray-100 text-gray-800'
        };
        return colors[category] || colors['אחר'];
    };

    const rolesByCategory = roles.reduce((acc, role) => {
        const category = role.category || 'אחר';
        if (!acc[category]) acc[category] = [];
        acc[category].push(role);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">טוען תפקידים...</div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת התפקידים</h3>
                <p className="text-red-600 mb-4">{loadError}</p>
                <Button onClick={loadRoles}>
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
                        <Users className="w-6 h-6" />
                        ניהול תפקידי אנשי קשר
                    </h1>
                    <p className="text-gray-600">נהלו את רשימת התפקידים הזמינים עבור אנשי קשר בהקמת סניפים</p>
                </div>
                <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700 gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף תפקיד חדש
                </Button>
            </div>

            <div className="grid gap-4">
                {Object.entries(rolesByCategory).map(([category, categoryRoles]) => (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Badge className={getCategoryColor(category)}>{category}</Badge>
                                <span className="text-sm text-gray-500">({categoryRoles.length} תפקידים)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId={`category-${category}`}>
                                    {(provided) => (
                                        <div 
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-2"
                                        >
                                            {categoryRoles.map((role, index) => (
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
                                                                    {!role.is_active && (
                                                                        <Badge variant="secondary">לא פעיל</Badge>
                                                                    )}
                                                                </div>
                                                                {role.description && (
                                                                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-1">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => handleOpenForm(role)}
                                                                    disabled={isUpdatingOrder}
                                                                >
                                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => setRoleToDelete(role)}
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
                        </CardContent>
                    </Card>
                ))}
                
                {roles.length === 0 && (
                    <Card>
                        <CardContent className="text-center py-12 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">אין תפקידים מוגדרים</p>
                            <p className="text-sm">לחצו על "הוסף תפקיד חדש" כדי להתחיל</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{selectedRole ? 'עריכת תפקיד' : 'הוספת תפקיד חדש'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="name">שם התפקיד</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="למשל: אדריכל, קבלן, עורך דין..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">תיאור (אופציונלי)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="תיאור קצר של התפקיד..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="category">קטגוריה</Label>
                            <Select 
                                value={formData.category} 
                                onValueChange={(value) => setFormData({...formData, category: value})}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="בחר קטגוריה..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                            ביטול
                        </Button>
                        <Button onClick={handleSaveRole} className="bg-green-600 hover:bg-green-700">
                            <Save className="ml-2 h-4 w-4" />
                            שמירה
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקת תפקיד</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את התפקיד "{roleToDelete?.name}"?
                            <br />
                            <strong className="text-red-600">פעולה זו בלתי הפיכה!</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteRole}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            מחק תפקיד
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}