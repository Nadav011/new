
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AuditQuestion } from '@/api/entities';
import { QuestionnaireSettings } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Plus, Trash2, Edit, AlertCircle, RefreshCw, Tag, MapPin, GripVertical } from 'lucide-react';
import { iconMap } from '../components/IconMap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Questionnaires() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [questionnaireToDelete, setQuestionnaireToDelete] = useState(null);
    const [editingQuestionnaire, setEditingQuestionnaire] = useState(null);
    const [questionnaireCounts, setQuestionnaireCounts] = useState({});
    const [allQuestionnaires, setAllQuestionnaires] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [editForm, setEditForm] = useState({
        custom_name: '',
        custom_description: '',
        custom_icon_name: '',
        frequency_in_months: 0,
        is_recurring: false
    });
    const [newQuestionnaire, setNewQuestionnaire] = useState({
        name: '',
        description: '',
        icon_name: 'FileText',
        frequency_in_months: 0,
        is_recurring: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            // Fetch all data concurrently
            const [
                settingsList,
                allQuestions,
            ] = await Promise.all([
                QuestionnaireSettings.list().catch(() => []),
                AuditQuestion.list().catch(() => []),
            ]);

            // --- Existing Questionnaire Loading Logic ---
            const settingsMap = {};
            settingsList.forEach(s => { settingsMap[s.questionnaire_type] = s; });

            // Base types that are always there
            const baseTypes = [
                { type: 'גלויה', icon_name: 'FileText' },
                { type: 'סמויה', icon_name: 'UserCheck' },
                { type: 'לקוח סמוי - ביקור בעסק', icon_name: 'ShoppingBag' },
                { type: 'לקוח סמוי - משלוח', icon_name: 'Truck' },
                { type: 'לקוח סמוי - איסוף עצמי', icon_name: 'ShoppingBag' },
                { type: 'ריאיון עם מנהל סניף', icon_name: 'User' },
                { type: 'ריאיונות עם לקוחות הסניף', icon_name: 'Users' },
                { type: 'ריאיונות עם עובדי הסניף', icon_name: 'MessageSquare' },
            ];

            const typesWithQuestions = new Set();
            allQuestions.forEach(q => {
                if (q.audit_type) {
                    typesWithQuestions.add(q.audit_type);
                }
            });

            // Combine base types that have questions + types with settings + types with questions
            const allKnownTypes = new Set();

            // Add base types only if they have questions or settings
            baseTypes.forEach(baseType => {
                if (typesWithQuestions.has(baseType.type) || settingsMap[baseType.type]) {
                    allKnownTypes.add(baseType.type);
                }
            });

            // Add custom types from settings
            Object.keys(settingsMap).forEach(type => {
                allKnownTypes.add(type);
            });

            const counts = {};
            // Optimized count calculation using already fetched allQuestions
            Array.from(allKnownTypes).forEach(type => {
                counts[type] = allQuestions.filter(q => q.audit_type === type).length;
            });
            setQuestionnaireCounts(counts);

            const combinedList = Array.from(allKnownTypes).map(type => {
                const base = baseTypes.find(t => t.type === type);
                const setting = settingsMap[type];
                return {
                    type: type,
                    name: setting?.custom_name || type,
                    description: setting?.custom_description || '',
                    icon_name: setting?.custom_icon_name || base?.icon_name || 'FileText',
                    id: setting?.id,
                    frequency_in_months: setting?.frequency_in_months || 0,
                    is_recurring: setting?.is_recurring || false,
                    order_index: setting?.order_index,
                };
            });
            
            combinedList.sort((a, b) => (a.order_index ?? 9999) - (b.order_index ?? 9999));
            setAllQuestionnaires(combinedList);

        } catch (error) {
            console.error("Error loading data:", error);
            setLoadError("אירעה שגיאת רשת. לא ניתן היה לטעון את נתוני השאלונים.");
        } finally {
            setIsLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination || isUpdatingOrder) {
            return;
        }

        const reorderedItems = Array.from(allQuestionnaires);
        const [movedItem] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, movedItem);

        setAllQuestionnaires(reorderedItems);
        setIsUpdatingOrder(true);

        try {
            const updates = reorderedItems.map(async (item, index) => {
                const settingData = {
                    questionnaire_type: item.type,
                    custom_name: item.name,
                    custom_description: item.description,
                    custom_icon_name: item.icon_name,
                    frequency_in_months: item.frequency_in_months || 0,
                    is_recurring: item.is_recurring || false,
                    order_index: index,
                };

                if (item.id) {
                    // Update existing setting if it has an ID
                    await QuestionnaireSettings.update(item.id, { order_index: index });
                } else {
                    // Create a new setting for base types that don't have one yet
                    // This is important to persist the order for base types
                    const createdSetting = await QuestionnaireSettings.create(settingData);
                    // Update the item in the local state with the new ID
                    // This is handled by loadData, so no direct state update here.
                }
            });
            await Promise.all(updates);
            await loadData(); // Reload to get consistent state and new IDs/order
        } catch (error) {
            console.error("Error updating questionnaire order:", error);
            alert("שגיאה בעדכון סדר השאלונים.");
            await loadData(); // Revert on error
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const handleCreateQuestionnaire = async () => {
        const name = newQuestionnaire.name.trim();
        if (name) {
            const existing = allQuestionnaires.find(q => q.type.toLowerCase() === name.toLowerCase());
            if (existing) {
                alert('שאלון בשם זה כבר קיים.');
                return;
            }

            await QuestionnaireSettings.create({
                questionnaire_type: name,
                custom_name: name,
                custom_description: newQuestionnaire.description.trim(),
                custom_icon_name: newQuestionnaire.icon_name,
                frequency_in_months: newQuestionnaire.frequency_in_months || 0,
                is_recurring: newQuestionnaire.is_recurring || false
            });

            setIsCreateDialogOpen(false);
            setNewQuestionnaire({
                name: '',
                description: '',
                icon_name: 'FileText',
                frequency_in_months: 0,
                is_recurring: false
            });
            await loadData();
        }
    };

    const handleEditQuestionnaire = (questionnaire) => {
        setEditingQuestionnaire(questionnaire);
        setEditForm({
            custom_name: questionnaire.name,
            custom_description: questionnaire.description,
            custom_icon_name: questionnaire.icon_name,
            frequency_in_months: questionnaire.frequency_in_months || 0,
            is_recurring: questionnaire.is_recurring || false
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveQuestionnaireSettings = async () => {
        if (!editingQuestionnaire) return;

        const settingData = {
            questionnaire_type: editingQuestionnaire.type,
            custom_name: editForm.custom_name.trim() || editingQuestionnaire.type,
            custom_description: editForm.custom_description.trim() || '',
            custom_icon_name: editForm.custom_icon_name || 'FileText',
            frequency_in_months: editForm.frequency_in_months || 0,
            is_recurring: editForm.is_recurring || false
        };

        if (editingQuestionnaire.id) {
            await QuestionnaireSettings.update(editingQuestionnaire.id, settingData);
        } else {
            // This path should ideally not be taken if editing an existing type without ID
            // but for completeness, use create if no ID
            await QuestionnaireSettings.create(settingData);
        }

        await loadData();
        setIsEditDialogOpen(false);
        setEditingQuestionnaire(null);
    };

    const handleDeleteQuestionnaire = async () => {
        if (!questionnaireToDelete) return;

        setIsDeleting(true);
        try {
            // Find all questions for this questionnaire type
            const questionsToDelete = await AuditQuestion.filter({ audit_type: questionnaireToDelete.type });

            // Create an array of deletion promises for the questions
            const deleteQuestionPromises = questionsToDelete.map(q => AuditQuestion.delete(q.id));

            // Wait for all questions to be deleted
            await Promise.all(deleteQuestionPromises);

            // If the questionnaire has a settings record (an ID), delete it too.
            if (questionnaireToDelete.id) {
                await QuestionnaireSettings.delete(questionnaireToDelete.id);
            }

            alert(`השאלון "${questionnaireToDelete.name}" נמחק בהצלחה.`);

        } catch (error) {
            console.error("Error during questionnaire deletion:", error);
            alert(`אירעה שגיאה במחיקת השאלון: ${error.message || 'שגיאה לא ידועה'}`);
        } finally {
            // Reset state and reload data regardless of success or failure
            setIsDeleting(false);
            setQuestionnaireToDelete(null);
            await loadData();
        }
    };

    const getQuestionnaireIcon = (questionnaire) => {
        const IconComponent = iconMap[questionnaire.icon_name] || FileText;
        return <IconComponent className="w-6 h-6 text-green-600" />;
    };

    const getFrequencyText = (months) => {
        if (!months || months === 0) return 'חד פעמי';
        if (months === 1) return 'חודשי';
        if (months === 2) return 'דו חודשי';
        if (months === 3) return 'רבעוני';
        if (months === 6) return 'חצי שנתי';
        if (months === 12) return 'שנתי';
        if (months === 24) return 'דו שנתי';
        return `כל ${months} חודשים`;
    };

    const frequencyOptions = [
        { label: 'חד פעמי', value: 0 },
        { label: 'חודשי', value: 1 },
        { label: 'דו חודשי', value: 2 },
        { label: 'רבעוני', value: 3 },
        { label: 'חצי שנתי', value: 6 },
        { label: 'שנתי', value: 12 },
        { label: 'דו שנתי', value: 24 },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-700">
                <RefreshCw className="w-10 h-10 animate-spin text-green-600 mb-3" />
                <div className="text-lg font-medium">טוען שאלונים...</div>
            </div>
        );
    }

    if (loadError) {
        return (
             <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-lg mx-auto mt-10">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
                <p className="text-red-600 mb-4">{loadError}</p>
                <Button onClick={loadData}>
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
                    <h1 className="text-2xl font-bold mb-2">ניהול שאלונים</h1>
                    <p className="text-gray-600">בחר שאלון כדי להוסיף, לערוך ולנהל את השאלות עבור כל סוג ביקורת.</p>
                </div>
                <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                >
                    <Plus className="w-4 h-4" />
                    הוסף שאלון חדש
                </Button>
            </div>

            {isUpdatingOrder && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm text-center flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>מעדכן סדר השאלונים...</span>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gray-50 border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="flex items-center gap-3">
                            <Tag className="w-6 h-6 text-indigo-600" />
                            <div>
                                <CardTitle className="text-lg">ניהול נושאים</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                    צרו וערכו את כל נושאי השאלות (לדוגמה: ניקיון, בטיחות, שירות).
                                </p>
                            </div>
                        </div>
                        <Link to={createPageUrl('Topics')}>
                            <Button variant="outline" className="gap-2">
                                <span>עבור לניהול נושאים</span>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                </Card>
                <Card className="bg-gray-50 border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-6 h-6 text-orange-600" />
                            <div>
                                <CardTitle className="text-lg">ניהול מיקומים בעסק</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                    צרו וערכו את כל המיקומים בעסק (לדוגמה: מטבח, מחסן, שירותים).
                                </p>
                            </div>
                        </div>
                        <Link to={createPageUrl('BusinessLocations')}>
                            <Button variant="outline" className="gap-2">
                                <span>עבור לניהול מיקומים</span>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                </Card>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="questionnaires-grid">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {allQuestionnaires.map((questionnaire, index) => (
                                <Draggable key={questionnaire.type} draggableId={questionnaire.type} index={index} isDragDisabled={isUpdatingOrder}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`h-full ${snapshot.isDragging ? 'shadow-2xl' : ''}`}
                                        >
                                            <Card className={`hover:shadow-lg hover:border-green-500 transition-all h-full flex flex-col ${isUpdatingOrder ? 'opacity-50' : ''}`}>
                                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            {...provided.dragHandleProps} 
                                                            className={`cursor-grab p-1 text-gray-400 hover:text-gray-700 ${isUpdatingOrder ? 'cursor-not-allowed' : ''}`}
                                                        >
                                                            <GripVertical className="h-5 w-5" />
                                                        </div>
                                                        {getQuestionnaireIcon(questionnaire)}
                                                        <CardTitle className="text-lg font-semibold">{questionnaire.name}</CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditQuestionnaire(questionnaire)}
                                                            title="ערוך שאלון"
                                                            disabled={isUpdatingOrder}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setQuestionnaireToDelete(questionnaire)}
                                                            title="מחק שאלון"
                                                            disabled={isUpdatingOrder}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="flex-grow flex flex-col justify-between">
                                                    <div className="mb-3">
                                                        <div className="text-sm text-gray-600 mb-2">
                                                            <span className="font-medium">תדירות:</span> {getFrequencyText(questionnaire.frequency_in_months)}
                                                        </div>
                                                        {questionnaire.is_recurring && (
                                                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                                                                תקופתי
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-auto">
                                                        <span className="text-sm text-gray-600">
                                                            {questionnaireCounts[questionnaire.type] || 0} שאלות
                                                        </span>
                                                        <Link to={createPageUrl(`Questions?type=${encodeURIComponent(questionnaire.type)}&displayName=${encodeURIComponent(questionnaire.name)}`)}>
                                                            <div className="flex items-center text-green-600 font-medium hover:text-green-700">
                                                                <span>ערוך שאלון</span>
                                                                <ArrowRight className="w-4 h-4 mr-2" />
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>יצירת שאלון חדש</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="questionnaire-name">שם השאלון</Label>
                            <Input
                                id="questionnaire-name"
                                value={newQuestionnaire.name}
                                onChange={(e) => setNewQuestionnaire({...newQuestionnaire, name: e.target.value})}
                                placeholder="לדוגמה: ביקורת בטיחות מזון"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="questionnaire-description">תיאור השאלון</Label>
                            <Textarea
                                id="questionnaire-description"
                                value={newQuestionnaire.description}
                                onChange={(e) => setNewQuestionnaire({...newQuestionnaire, description: e.target.value})}
                                placeholder="תיאור קצר של מטרת השאלון ותחום הביקורת..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="questionnaire-icon">אייקון השאלון</Label>
                            <Select
                                value={newQuestionnaire.icon_name}
                                onValueChange={(value) => setNewQuestionnaire({...newQuestionnaire, icon_name: value})}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="בחר אייקון..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(iconMap).map(iconName => (
                                        <SelectItem key={iconName} value={iconName}>
                                            <div className="flex items-center gap-2">
                                                {React.createElement(iconMap[iconName], { className: "w-4 h-4" })}
                                                {iconName}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="questionnaire-frequency">תדירות ביקורת</Label>
                            <Select
                                value={String(newQuestionnaire.frequency_in_months)}
                                onValueChange={(value) => {
                                    const months = parseInt(value);
                                    setNewQuestionnaire({
                                        ...newQuestionnaire,
                                        frequency_in_months: months,
                                        is_recurring: months > 0
                                    });
                                }}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="בחר תדירות..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {frequencyOptions.map(option => (
                                        <SelectItem key={option.value} value={String(option.value)}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
                            ביטול
                        </Button>
                        <Button
                            onClick={handleCreateQuestionnaire}
                            disabled={!newQuestionnaire.name.trim()}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            צור שאלון
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>עריכת שאלון: {editingQuestionnaire?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="custom-name">שם מותאם אישית</Label>
                            <Input
                                id="custom-name"
                                value={editForm.custom_name}
                                onChange={(e) => setEditForm({...editForm, custom_name: e.target.value})}
                                placeholder={editingQuestionnaire?.type}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="custom-description">תיאור מותאם אישית</Label>
                            <Textarea
                                id="custom-description"
                                value={editForm.custom_description}
                                onChange={(e) => setEditForm({...editForm, custom_description: e.target.value})}
                                placeholder={editingQuestionnaire?.description}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="custom-icon">אייקון השאלון</Label>
                            <Select
                                value={editForm.custom_icon_name}
                                onValueChange={(value) => setEditForm({...editForm, custom_icon_name: value})}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="בחר אייקון..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(iconMap).map(iconName => (
                                        <SelectItem key={iconName} value={iconName}>
                                            <div className="flex items-center gap-2">
                                                {React.createElement(iconMap[iconName], { className: "w-4 h-4" })}
                                                {iconName}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-frequency">תדירות ביקורת</Label>
                            <Select
                                value={String(editForm.frequency_in_months)}
                                onValueChange={(value) => {
                                    const months = parseInt(value);
                                    setEditForm({
                                        ...editForm,
                                        frequency_in_months: months,
                                        is_recurring: months > 0
                                    });
                                }}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="בחר תדירות..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {frequencyOptions.map(option => (
                                        <SelectItem key={option.value} value={String(option.value)}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                            ביטול
                        </Button>
                        <Button
                            onClick={handleSaveQuestionnaireSettings}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            שמור שינויים
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!questionnaireToDelete} onOpenChange={() => setQuestionnaireToDelete(null)} dir="rtl">
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקת שאלון</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את השאלון "{questionnaireToDelete?.name}"?
                            <br />
                            <strong className="text-red-600">הפעולה תמחק את השאלון ואת כל {questionnaireCounts[questionnaireToDelete?.type] || 0} השאלות המשויכות אליו לצמיתות!</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteQuestionnaire}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'מוחק...' : 'מחק שאלון'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
