import React, { useState, useEffect } from 'react';
import { BusinessLocation } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, MapPin, AlertCircle, RefreshCw, Save, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function BusinessLocations() {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locationToDelete, setLocationToDelete] = useState(null);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await BusinessLocation.list('order_index');
            setLocations(data);
        } catch (error) {
            console.error("Error loading locations:", error);
            setLoadError("אירעה שגיאת רשת. לא ניתן היה לטעון את רשימת המיקומים.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (location = null) => {
        if (location) {
            setSelectedLocation(location);
            setFormData({
                name: location.name,
                description: location.description || '',
                is_active: location.is_active !== false
            });
        } else {
            setSelectedLocation(null);
            setFormData({
                name: '',
                description: '',
                is_active: true
            });
        }
        setIsFormOpen(true);
    };

    const handleSaveLocation = async () => {
        if (!formData.name.trim()) {
            alert('יש להזין שם מיקום');
            return;
        }

        try {
            const saveData = {
                ...formData,
                order_index: selectedLocation ? selectedLocation.order_index : locations.length
            };

            if (selectedLocation) {
                await BusinessLocation.update(selectedLocation.id, saveData);
            } else {
                await BusinessLocation.create(saveData);
            }

            await loadLocations();
            setIsFormOpen(false);
            setSelectedLocation(null);
        } catch (error) {
            console.error("Error saving location:", error);
            alert('שגיאה בשמירת המיקום');
        }
    };

    const handleDeleteLocation = async () => {
        if (locationToDelete) {
            try {
                // Here you might want to check if the location is used in any questions before deleting.
                // For now, we will just delete it.
                await BusinessLocation.delete(locationToDelete.id);
                await loadLocations();
                setLocationToDelete(null);
                alert('המיקום נמחק בהצלחה');
            } catch (error) {
                console.error("Error deleting location:", error);
                alert('שגיאה במחיקת המיקום');
            }
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination || isUpdatingOrder) {
            return;
        }

        const reorderedLocations = Array.from(locations);
        const [movedItem] = reorderedLocations.splice(result.source.index, 1);
        reorderedLocations.splice(result.destination.index, 0, movedItem);

        setLocations(reorderedLocations);
        setIsUpdatingOrder(true);

        try {
            const updates = reorderedLocations.map((loc, index) => 
                BusinessLocation.update(loc.id, { order_index: index })
            );
            await Promise.all(updates);
        } catch (error) {
            console.error("Error updating order:", error);
            await loadLocations(); // Revert on error
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    if (isLoading) return <div>טוען מיקומים...</div>;
    if (loadError) return (
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת המיקומים</h3>
            <p className="text-red-600 mb-4">{loadError}</p>
            <Button onClick={loadLocations}><RefreshCw className="ml-2 h-4 w-4" /> נסה שוב</Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <MapPin className="w-6 h-6" />
                        ניהול מיקומים בעסק
                    </h1>
                    <p className="text-gray-600">נהלו את רשימת המיקומים בעסק אליהם ניתן לשייך שאלות.</p>
                </div>
                <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700 gap-2">
                    <Plus className="w-4 h-4" />
                    הוסף מיקום חדש
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>רשימת מיקומים ({locations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="locations-list">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                    {locations.map((location, index) => (
                                        <Draggable key={location.id} draggableId={location.id} index={index} isDragDisabled={isUpdatingOrder}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border ${snapshot.isDragging ? 'bg-green-50 shadow-lg' : 'bg-white'}`}
                                                >
                                                    <div {...provided.dragHandleProps} className="cursor-grab p-1 text-gray-500 hover:text-gray-700"><GripVertical className="h-5 w-5" /></div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{location.name}</span>
                                                            {!location.is_active && <Badge variant="secondary">לא פעיל</Badge>}
                                                        </div>
                                                        {location.description && <p className="text-sm text-gray-500 mt-1">{location.description}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(location)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => setLocationToDelete(location)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
                    {locations.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">אין מיקומים מוגדרים</p>
                            <p className="text-sm">לחצו על "הוסף מיקום חדש" כדי להתחיל</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader><DialogTitle>{selectedLocation ? 'עריכת מיקום' : 'הוספת מיקום חדש'}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div><Label htmlFor="name">שם המיקום</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1" /></div>
                        <div><Label htmlFor="description">תיאור (אופציונלי)</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="mt-1" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)}>ביטול</Button>
                        <Button onClick={handleSaveLocation} className="bg-green-600 hover:bg-green-700"><Save className="ml-2 h-4 w-4" /> שמירה</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!locationToDelete} onOpenChange={() => setLocationToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקת מיקום</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את המיקום "{locationToDelete?.name}"?
                            <br /><strong className="text-red-600">פעולה זו בלתי הפיכה!</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLocation} className="bg-red-600 hover:bg-red-700">מחק מיקום</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}