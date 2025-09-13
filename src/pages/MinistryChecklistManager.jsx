import React, { useState, useEffect } from 'react';
import { MinistryChecklistItem } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, GripVertical, Save, AlertCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function MinistryChecklistManager() {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

    const categories = [
        'בטיחות ואבטחה',
        'רישוי ותעודות',
        'כספים וחשבונות',
        'עובדים ושכר',
        'איכות וסטנדרטים',
        'ציוד ותחזוקה',
        'אחר'
    ];

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await MinistryChecklistItem.list();
            setItems(data.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
        } catch (error) {
            console.error("Error loading checklist items:", error);
            setLoadError("שגיאה בטעינת רשימת הפריטים");
        } finally {
            setIsLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination || isUpdatingOrder) return;

        const reorderedItems = Array.from(items);
        const [movedItem] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, movedItem);

        setItems(reorderedItems);
        setIsUpdatingOrder(true);

        try {
            const updates = [];
            for (let i = 0; i < reorderedItems.length; i++) {
                if (reorderedItems[i].order_index !== i) {
                    updates.push(MinistryChecklistItem.update(reorderedItems[i].id, { order_index: i }));
                }
            }
            await Promise.all(updates);
        } catch (error) {
            console.error("Error updating order:", error);
            await loadItems();
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        const formData = new FormData(e.target);
        const data = {
            title: formData.get('title'),
            description: formData.get('description') || '',
            category: formData.get('category') || 'אחר',
            is_required: formData.get('is_required') === 'on',
            is_active: formData.get('is_active') === 'on',
            order_index: selectedItem ? selectedItem.order_index : items.length
        };

        try {
            if (selectedItem) {
                await MinistryChecklistItem.update(selectedItem.id, data);
            } else {
                await MinistryChecklistItem.create(data);
            }
            await loadItems();
            setIsFormOpen(false);
            setSelectedItem(null);
        } catch (error) {
            console.error("Error saving item:", error);
            alert('שגיאה בשמירת הפריט');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
            try {
                await MinistryChecklistItem.delete(id);
                await loadItems();
            } catch (error) {
                console.error("Error deleting item:", error);
                alert('שגיאה במחיקת הפריט');
            }
        }
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedItem(null);
        setIsFormOpen(true);
    };

    if (isLoading) return <div className="flex justify-center p-8">טוען...</div>;
    
    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
                <p className="text-red-600 mb-4">{loadError}</p>
                <Button onClick={loadItems} variant="outline">נסה שוב</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>ניהול צ'ק-ליסט ביקורת משרד התמ״ת</CardTitle>
                    <Button onClick={handleAdd}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        הוסף פריט
                    </Button>
                </CardHeader>
                <CardContent>
                    {isUpdatingOrder && (
                        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                            מעדכן סדר הפריטים...
                        </div>
                    )}

                    {items.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-medium mb-2">אין פריטים בצ'ק-ליסט</p>
                            <p className="text-sm mb-4">הוסף פריט ראשון כדי להתחיל</p>
                            <Button onClick={handleAdd}>
                                <PlusCircle className="ml-2 h-4 w-4" />
                                הוסף פריט ראשון
                            </Button>
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="checklist-items">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-10"></TableHead>
                                                    <TableHead>כותרת</TableHead>
                                                    <TableHead>קטגוריה</TableHead>
                                                    <TableHead>חובה</TableHead>
                                                    <TableHead>פעיל</TableHead>
                                                    <TableHead>פעולות</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={isUpdatingOrder}>
                                                        {(provided, snapshot) => (
                                                            <TableRow
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={snapshot.isDragging ? 'bg-blue-50' : ''}
                                                            >
                                                                <TableCell>
                                                                    <div {...provided.dragHandleProps} className="cursor-grab hover:cursor-grabbing">
                                                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div>
                                                                        <div className="font-medium">{item.title}</div>
                                                                        {item.description && (
                                                                            <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{item.category}</TableCell>
                                                                <TableCell>
                                                                    <span className={`px-2 py-1 text-xs rounded-full ${item.is_required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                                                                        {item.is_required ? 'כן' : 'לא'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                                        {item.is_active ? 'כן' : 'לא'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="flex gap-2">
                                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} dir="rtl">
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{selectedItem ? 'עריכת פריט' : 'הוספת פריט חדש'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="title">כותרת *</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={selectedItem?.title || ''}
                                placeholder="לדוגמא: בדיקת מערכות כיבוי אש"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">תיאור</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={selectedItem?.description || ''}
                                placeholder="תיאור מפורט של הפריט..."
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="category">קטגוריה</Label>
                            <Select name="category" defaultValue={selectedItem?.category || 'אחר'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר קטגוריה..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                                id="is_required"
                                name="is_required"
                                defaultChecked={selectedItem?.is_required !== false}
                            />
                            <Label htmlFor="is_required">פריט חובה</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                                id="is_active"
                                name="is_active"
                                defaultChecked={selectedItem?.is_active !== false}
                            />
                            <Label htmlFor="is_active">פריט פעיל</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                ביטול
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                <Save className="ml-2 h-4 w-4" />
                                {isSaving ? 'שומר...' : 'שמור'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}