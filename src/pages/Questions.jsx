
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AuditQuestion, QuestionTopic, BusinessLocation } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowRight, Edit, Trash2, GripVertical, HelpCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import InlineQuestionEditor from '../components/InlineQuestionEditor';
import { createPageUrl } from '@/utils';

export default function Questions() {
    const location = useLocation();
    const [questions, setQuestions] = useState([]);
    const [topics, setTopics] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [questionnaireType, setQuestionnaireType] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState(null);
    
    // New states for dialog editing
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const getQueryParams = useCallback(() => {
        const params = new URLSearchParams(location.search);
        const type = params.get('type');
        const name = params.get('displayName');
        setQuestionnaireType(type || '');
        setDisplayName(name || type || '');
    }, [location.search]);

    useEffect(() => {
        getQueryParams();
    }, [getQueryParams]);

    const loadData = useCallback(async () => {
        if (!questionnaireType) return;
        setIsLoading(true);
        try {
            const [topicsData, locationsData, questionsData] = await Promise.all([
                QuestionTopic.list(),
                BusinessLocation.list(),
                AuditQuestion.filter({ audit_type: questionnaireType })
            ]);

            const safeTopics = Array.isArray(topicsData) ? topicsData : [];
            const safeLocations = Array.isArray(locationsData) ? locationsData : [];
            const safeQuestions = Array.isArray(questionsData) ? questionsData : [];

            setTopics(safeTopics);
            setLocations(safeLocations);
            
            const sortedQuestions = safeQuestions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            setQuestions(sortedQuestions); // Using setQuestions as it's the existing state setter

        } catch (error) {
            console.error("Failed to load questions data:", error);
            setTopics([]);
            setLocations([]);
            setQuestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [questionnaireType]);

    useEffect(() => {
        if (questionnaireType) {
            loadData();
        }
    }, [questionnaireType, loadData]);

    const handleDragEnd = async (result) => {
        if (!result.destination) return;
        if (result.source.index === result.destination.index) return; // No change

        const items = Array.from(questions);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setIsUpdatingOrder(true);
        setQuestions(items);

        try {
            // Calculate which questions need updating (only those affected by the move)
            const startIndex = Math.min(result.source.index, result.destination.index);
            const endIndex = Math.max(result.source.index, result.destination.index);
            const questionsToUpdate = [];

            for (let i = startIndex; i <= endIndex; i++) {
                if (items[i].order_index !== i) {
                    questionsToUpdate.push({ id: items[i].id, newIndex: i });
                }
            }

            console.log(`Updating ${questionsToUpdate.length} questions (indices ${startIndex}-${endIndex})`);

            // Update only the affected questions with longer delays
            for (let i = 0; i < questionsToUpdate.length; i++) {
                const { id, newIndex } = questionsToUpdate[i];
                let attempts = 0;
                const maxAttempts = 3;
                
                while (attempts < maxAttempts) {
                    try {
                        await AuditQuestion.update(id, { order_index: newIndex });
                        console.log(`Successfully updated question ${id} to index ${newIndex} (item ${i + 1}/${questionsToUpdate.length})`);
                        break; // Success, exit retry loop
                    } catch (updateError) {
                        attempts++;
                        
                        if (updateError.message?.includes('429') || updateError.message?.includes('Rate limit')) {
                            const waitTime = Math.min(2000 * attempts, 10000); // Exponential backoff: 2s, 4s, 6s, capped at 10s
                            console.warn(`Rate limited on question ID ${id}, attempt ${attempts}/${maxAttempts}, waiting ${waitTime}ms...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                            
                            if (attempts === maxAttempts) {
                                throw new Error("עדכון נכשל אחרי מספר ניסיונות - המערכת עמוסה מדי");
                            }
                        } else {
                            throw updateError; // Re-throw non-rate-limit errors immediately
                        }
                    }
                }

                // Add longer delay between each question update
                if (i < questionsToUpdate.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms between updates
                }
            }

            console.log("All questions updated successfully");
            
        } catch (error) {
            console.error("Failed to update question order:", error);
            
            // Show user-friendly error message
            if (error.message?.includes('429') || error.message?.includes('Rate limit') || error.message?.includes('עמוסה מדי')) {
                alert("המערכת עמוסה כרגע. אנא המתן דקה ונסה שוב בתנועה איטית יותר.");
            } else {
                alert("שגיאה בעדכון סדר השאלות. אנא נסה שוב.");
            }
            
            // Reload data to resync state
            setTimeout(() => {
                loadData();
            }, 1000);
        } finally {
            setIsUpdatingOrder(false);
        }
    };
    
    const handleDeleteQuestion = async () => {
        if (!questionToDelete) return;

        try {
            await AuditQuestion.delete(questionToDelete.id);
            setQuestions(questions.filter(q => q.id !== questionToDelete.id));
        } catch (error) {
            console.error("Error deleting question:", error);
            alert("שגיאה במחיקת השאלה.");
        } finally {
            setQuestionToDelete(null);
        }
    };

    const handleSaveNewQuestion = async (newQuestionData) => {
        const newOrderIndex = questions.length;
        try {
            await AuditQuestion.create({
                ...newQuestionData,
                audit_type: questionnaireType,
                order_index: newOrderIndex
            });
            setIsAddingNew(false);
            loadData(); // Reload data after creation
        } catch (error) {
            console.error("Error creating question:", error);
        }
    };

    const handleEditQuestion = (question) => {
        setEditingQuestion(question);
        setIsEditDialogOpen(true);
    };

    const handleSaveEditedQuestion = async (questionData) => {
        if (!editingQuestion) return;
        
        try {
            await AuditQuestion.update(editingQuestion.id, questionData);
            setIsEditDialogOpen(false);
            setEditingQuestion(null);
            loadData(); // Reload data after update
        } catch (error) {
            console.error("Error updating question:", error);
        }
    };

    const getQuestionTypeDisplay = (type) => {
        const types = {
            'header': 'כותרת',
            'rating_1_5': 'דירוג 1-5',
            'status_check': 'תקין/לא תקין/לא רלוונטי',
            'text': 'טקסט חופשי',
            'multiple_choice': 'בחירה מרובה'
        };
        return types[type] || type;
    };

    const getTopicName = (topicId) => {
        const topic = topics.find(t => t.id === topicId);
        return topic?.name || '';
    };

    const getLocationName = (locationId) => {
        const location = locations.find(l => l.id === locationId);
        return location?.name || '';
    };

    if (!questionnaireType) {
        return (
            <div className="text-center p-8">
                <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">לא נבחר שאלון</h2>
                <p className="mt-1 text-sm text-gray-500">
                    יש לחזור לעמוד ניהול שאלונים ולבחור שאלון כדי לערוך את השאלות.
                </p>
                <Button asChild className="mt-4">
                    <Link to={createPageUrl('Questionnaires')}>חזרה לניהול שאלונים</Link>
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return <div>טוען שאלות...</div>;
    }

    return (
        <div className="space-y-6 pb-24" dir="rtl">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold">{displayName}</CardTitle>
                            <CardDescription>ניהול שאלות, כותרות וסדר עבור שאלון זה. ניתן לגרור כדי לסדר מחדש.</CardDescription>
                        </div>
                        <Link to={createPageUrl('Questionnaires')}>
                            <Button variant="outline">
                                <ArrowRight className="ml-2 h-4 w-4" />
                                חזור לכל השאלונים
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
            </Card>

            {isUpdatingOrder && (
                <div className="p-2 text-center text-sm text-blue-700 bg-blue-50 rounded-md">
                    <RefreshCw className="inline-block w-4 h-4 mr-2 animate-spin" />
                    מעדכן סדר...
                </div>
            )}
            
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="questions">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {questions.map((question, index) => (
                                <Draggable key={question.id} draggableId={question.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div {...provided.dragHandleProps} className="cursor-grab hover:text-gray-600">
                                                    <GripVertical className="w-5 h-5 text-gray-400" />
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 mb-1">
                                                        {question.question_text}
                                                    </div>
                                                    <div className="flex gap-2 text-sm">
                                                        <Badge variant="outline">
                                                            {getQuestionTypeDisplay(question.question_type)}
                                                        </Badge>
                                                        {question.topic_id && (
                                                            <Badge variant="secondary">
                                                                {getTopicName(question.topic_id)}
                                                            </Badge>
                                                        )}
                                                        {question.location_id && (
                                                            <Badge variant="secondary">
                                                                {getLocationName(question.location_id)}
                                                            </Badge>
                                                        )}
                                                        {question.max_score > 0 && (
                                                            <Badge className="bg-blue-100 text-blue-800">
                                                                ניקוד: {question.max_score}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditQuestion(question)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setQuestionToDelete(question)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

            {!isAddingNew && (
                 <Button
                    onClick={() => setIsAddingNew(true)}
                    className="fixed bottom-8 left-8 w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg flex items-center justify-center z-50"
                    aria-label="הוסף שאלה חדשה"
                >
                    <Plus className="h-8 w-8" />
                </Button>
            )}

            {/* Dialog for adding new question */}
            <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>הוספת שאלה חדשה</DialogTitle>
                    </DialogHeader>
                    <InlineQuestionEditor
                        onSave={handleSaveNewQuestion}
                        onCancel={() => setIsAddingNew(false)}
                        topics={topics}
                        locations={locations}
                        auditType={questionnaireType}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog for editing existing question */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>עריכת שאלה</DialogTitle>
                    </DialogHeader>
                    {editingQuestion && (
                        <InlineQuestionEditor
                            question={editingQuestion}
                            onSave={handleSaveEditedQuestion}
                            onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingQuestion(null);
                            }}
                            topics={topics}
                            locations={locations}
                        />
                    )}
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                           <AlertTriangle className="text-red-500" />
                            אישור מחיקת שאלה
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את השאלה:
                            <div className="my-2 p-2 bg-gray-100 rounded text-gray-700 italic">
                                "{questionToDelete?.question_text}"
                            </div>
                            פעולה זו היא בלתי הפיכה.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteQuestion}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            מחק שאלה
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
