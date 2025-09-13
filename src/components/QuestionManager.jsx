
import React, { useState, useEffect } from 'react';
import { AuditQuestion } from '@/api/entities';
import { QuestionTopic } from '@/api/entities';
import { BusinessLocation } from '@/api/entities';
import InlineQuestionEditor from './InlineQuestionEditor';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, AlertCircle, RefreshCw, Edit, Trash2, Tag, MapPin } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function QuestionManager({ auditType }) {
    const [questions, setQuestions] = useState([]);
    const [topics, setTopics] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [questionToDelete, setQuestionToDelete] = useState(null);
    const [newQuestionType, setNewQuestionType] = useState('rating_1_5');
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        if (auditType) {
            loadData();
        } else {
            setQuestions([]);
            setIsLoading(false);
        }
    }, [auditType]);

    const saveScrollPosition = () => {
        setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);
    };

    const restoreScrollPosition = () => {
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 100);
    };

    const loadData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const [questionsData, topicsData, locationsData] = await Promise.all([
                AuditQuestion.filter({ audit_type: auditType }, 'order_index'),
                QuestionTopic.list(),
                BusinessLocation.list()
            ]);
            setQuestions(questionsData);
            setTopics(topicsData);
            setLocations(locationsData);
        } catch (error) {
            console.error("Error loading data:", error);
            setLoadError("שגיאת רשת בטעינת השאלות והנושאים.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (question, type = 'rating_1_5') => {
        saveScrollPosition();
        setSelectedQuestion(question);
        if (!question) {
            setNewQuestionType(type);
        }
        setIsFormOpen(true);
    };

    const handleCancelForm = () => {
        setIsFormOpen(false);
        setSelectedQuestion(null);
        restoreScrollPosition();
    };

    const handleSaveQuestion = async (formData) => {
        try {
            if (selectedQuestion) {
                await AuditQuestion.update(selectedQuestion.id, formData);
            } else {
                await AuditQuestion.create(formData);
            }
            setIsFormOpen(false);
            setSelectedQuestion(null);
            await loadData();
            restoreScrollPosition();
        } catch (error) {
            console.error("Error saving question:", error);
            alert("שגיאה בשמירת השאלה");
        }
    };

    const handleDeleteClick = (question) => {
        saveScrollPosition();
        setQuestionToDelete(question);
    };

    const handleConfirmDelete = async () => {
        if (!questionToDelete) return;
        try {
            await AuditQuestion.delete(questionToDelete.id);
            // After deleting, we must re-index the remaining questions to fill the gap.
            const remainingQuestions = questions.filter(q => q.id !== questionToDelete.id);
            const updatePromises = remainingQuestions.map((question, index) => 
                AuditQuestion.update(question.id, { order_index: index })
            );
            await Promise.all(updatePromises);

            setQuestionToDelete(null); // Clears the dialog first
            await loadData(); // Reload to get the final state
            restoreScrollPosition();
        } catch (error) {
            console.error("Error deleting question:", error);
            restoreScrollPosition(); // Restore scroll even on error
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination || isUpdatingOrder) return;
        
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        
        if (sourceIndex === destinationIndex) return; // No change needed

        saveScrollPosition();

        const items = Array.from(questions);
        const [reorderedItem] = items.splice(sourceIndex, 1);
        items.splice(destinationIndex, 0, reorderedItem);

        // Optimistic UI update
        setQuestions(items);
        setIsUpdatingOrder(true);

        try {
            // Only update questions that actually changed position
            const updatesToMake = [];
            
            // Determine the range of items that need updating
            const startIndex = Math.min(sourceIndex, destinationIndex);
            const endIndex = Math.max(sourceIndex, destinationIndex);
            
            // Update only the affected questions
            for (let i = startIndex; i <= endIndex; i++) {
                const question = items[i];
                if (question.order_index !== i) {
                    updatesToMake.push(
                        AuditQuestion.update(question.id, { order_index: i })
                    );
                }
            }

            // Wait for all updates to complete
            if (updatesToMake.length > 0) {
                await Promise.all(updatesToMake);
            }
            
            // Reload data to ensure consistency
            await loadData();
            restoreScrollPosition();

        } catch (error) {
            console.error("Error updating question order:", error);
            alert("שגיאה בעדכון סדר השאלות. מרענן נתונים.");
            await loadData();
            restoreScrollPosition();
        } finally {
            setIsUpdatingOrder(false);
        }
    };
    
    if (isLoading) return <div>טוען שאלות...</div>;
    if (loadError) return (
        <div className="text-center py-10 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת נתונים</h3>
            <p className="text-red-600 mb-4">{loadError}</p>
            <Button onClick={loadData} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                נסה שוב
            </Button>
        </div>
    );
    
    const QuestionTypeBadge = ({ type }) => {
        const types = {
            header: { text: "כותרת", color: "bg-gray-100 text-gray-800" },
            text: { text: "טקסט", color: "bg-blue-100 text-blue-800" },
            rating_1_5: { text: "דירוג 1-5", color: "bg-yellow-100 text-yellow-800" },
            status_check: { text: "בדיקת סטטוס", color: "bg-green-100 text-green-800" },
            multiple_choice: { text: "בחירה מרובה", color: "bg-purple-100 text-purple-800" }
        };
        const { text, color } = types[type] || { text: type, color: "bg-gray-100 text-gray-800" };
        return <Badge className={color}>{text}</Badge>;
    };

    return (
        <div className="space-y-4">
             {isUpdatingOrder && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm animate-pulse">
                    מעדכן סדר שאלות...
                </div>
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="questions">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {questions.map((question, index) => {
                                const topic = topics.find(t => t.id === question.topic_id);
                                const location = locations.find(l => l.id === question.location_id);
                                return (
                                <Draggable key={question.id} draggableId={question.id} index={index} isDragDisabled={isUpdatingOrder}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`flex items-start gap-2 p-3 rounded-lg border ${snapshot.isDragging ? 'bg-green-50 shadow-lg' : 'bg-white'} ${isUpdatingOrder ? 'opacity-50' : ''}`}
                                        >
                                            <div {...provided.dragHandleProps} className={`cursor-grab p-1 text-gray-500 hover:text-gray-700 mt-1 ${isUpdatingOrder ? 'cursor-not-allowed' : ''}`}>
                                                <GripVertical className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className={`font-semibold ${question.question_type === 'header' ? 'text-green-700 text-lg' : ''}`}>{question.question_text}</p>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <QuestionTypeBadge type={question.question_type} />
                                                    {topic && <Badge variant="outline" className="flex items-center gap-1"><Tag className="w-3 h-3"/>{topic.name}</Badge>}
                                                    {location && <Badge variant="outline" className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{location.name}</Badge>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenForm(question)} disabled={isUpdatingOrder}><Edit className="h-4 w-4 text-blue-500" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(question)} disabled={isUpdatingOrder}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
            
            <div className="fixed bottom-6 left-6" dir="ltr">
                <Button 
                    onClick={() => handleOpenForm(null)}
                    className="rounded-full w-14 h-14 shadow-lg bg-green-600 hover:bg-green-700"
                    aria-label="הוסף שאלה חדשה"
                    disabled={isUpdatingOrder}
                >
                    <Plus className="w-6 h-6" />
                </Button>
            </div>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedQuestion ? 'עריכת שאלה' : 'הוספת שאלה חדשה'}</DialogTitle>
                    </DialogHeader>
                    <InlineQuestionEditor
                        question={selectedQuestion}
                        onSave={handleSaveQuestion}
                        onCancel={handleCancelForm}
                        auditType={auditType}
                        orderIndex={questions.length}
                        topics={topics}
                        locations={locations}
                        defaultType={newQuestionType}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את השאלה "{questionToDelete?.question_text}"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
