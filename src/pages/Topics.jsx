
import React, { useState, useEffect } from 'react';
import { QuestionTopic } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Tag, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const colorOptions = [
    { name: 'אפור', value: 'gray', bg: 'bg-gray-200', text: 'text-gray-800' },
    { name: 'אדום', value: 'red', bg: 'bg-red-200', text: 'text-red-800' },
    { name: 'כתום', value: 'orange', bg: 'bg-orange-200', text: 'text-orange-800' },
    { name: 'צהוב', value: 'yellow', bg: 'bg-yellow-200', text: 'text-yellow-800' },
    { name: 'ירוק', value: 'green', bg: 'bg-green-200', text: 'text-green-800' },
    { name: 'טורקיז', value: 'teal', bg: 'bg-teal-200', text: 'text-teal-800' },
    { name: 'כחול', value: 'blue', bg: 'bg-blue-200', text: 'text-blue-800' },
    { name: 'סגול', value: 'purple', bg: 'bg-purple-200', text: 'text-purple-800' },
    { name: 'ורוד', value: 'pink', bg: 'bg-pink-200', text: 'text-pink-800' },
];

export default function Topics() {
    const [topics, setTopics] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [topicToDelete, setTopicToDelete] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', color: 'blue' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadTopics();
    }, []);

    const loadTopics = async () => {
        const data = await QuestionTopic.list();
        const sortedTopics = Array.isArray(data) ? data.sort((a, b) => a.order_index - b.order_index) : [];
        setTopics(sortedTopics);
    };

    const handleOpenDialog = (topic = null) => {
        setEditingTopic(topic);
        if (topic) {
            setFormData({
                name: topic.name || '',
                description: topic.description || '',
                color: topic.color || 'blue',
            });
        } else {
            setFormData({ name: '', description: '', color: 'blue' });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingTopic) {
                await QuestionTopic.update(editingTopic.id, formData);
            } else {
                await QuestionTopic.create({ ...formData, order_index: topics.length });
            }
            await loadTopics();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save topic:", error);
            alert("שגיאה בשמירת הנושא.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (topicToDelete) {
            // Note: Add logic here to check if topic is in use before deleting
            // For now, we will just delete it.
            try {
                await QuestionTopic.delete(topicToDelete.id);
                await loadTopics();
            } catch (error) {
                 console.error("Failed to delete topic:", error);
                 alert("שגיאה במחיקת הנושא. ייתכן שהנושא בשימוש בשאלונים קיימים.");
            } finally {
                setTopicToDelete(null);
            }
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;
        const items = Array.from(topics);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setTopics(items);

        const updatePromises = items.map((topic, index) =>
            QuestionTopic.update(topic.id, { order_index: index })
        );
        await Promise.all(updatePromises);
        await loadTopics();
    };

    return (
        <div dir="rtl" className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <Tag />
                            ניהול נושאי שאלות
                        </CardTitle>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="ml-2 h-4 w-4" />
                            הוסף נושא חדש
                        </Button>
                    </div>
                    <CardDescription>
                        כאן תוכלו ליצור ולנהל את כל הנושאים של השאלות בביקורות (לדוגמה: ניקיון, בטיחות).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="topics">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                    {topics.map((topic, index) => {
                                        const color = colorOptions.find(c => c.value === topic.color) || colorOptions[0];
                                        return (
                                            <Draggable key={topic.id} draggableId={topic.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`p-3 rounded-md border flex justify-between items-center ${color.bg}`}
                                                    >
                                                        <div className="flex-grow">
                                                            <p className={`font-semibold ${color.text}`}>{topic.name}</p>
                                                            <p className={`text-sm ${color.text} opacity-80`}>{topic.description}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(topic)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => setTopicToDelete(topic)}>
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                    {topics.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            לא נוצרו עדיין נושאים.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{editingTopic ? 'עריכת נושא' : 'יצירת נושא חדש'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="name">שם הנושא</Label>
                            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div>
                            <Label htmlFor="description">תיאור (אופציונלי)</Label>
                            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div>
                            <Label>בחר צבע</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {colorOptions.map(color => (
                                    <Button
                                        key={color.value}
                                        type="button"
                                        variant={formData.color === color.value ? 'default' : 'outline'}
                                        className={`${color.bg} ${color.text} hover:opacity-80`}
                                        onClick={() => setFormData({ ...formData, color: color.value })}
                                    >
                                        {color.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>ביטול</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'שומר...' : (editingTopic ? 'שמור שינויים' : 'צור נושא')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!topicToDelete} onOpenChange={() => setTopicToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-red-500" />
                            אישור מחיקת נושא
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את הנושא "{topicToDelete?.name}"?
                            <br/>
                            שימו לב: אם הנושא משויך לשאלות קיימות, ייתכן שלא תוכלו למחוק אותו.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            מחק
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
