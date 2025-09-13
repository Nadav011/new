
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Ban, Plus, Trash2, ChevronsUpDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function InlineQuestionEditor({ question, topics, locations, onSave, onCancel, auditType, orderIndex, defaultType }) {
    const [editedQuestion, setEditedQuestion] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [topicSearchTerm, setTopicSearchTerm] = useState('');
    const [locationSearchTerm, setLocationSearchTerm] = useState('');

    useEffect(() => {
        if (question) {
            setEditedQuestion({
                ...question,
                choices: question.choices || [],
            });
        } else {
            // Creating new question
            setEditedQuestion({
                question_text: '',
                question_type: defaultType || 'text',
                choices: [],
                is_required: true,
                order_index: orderIndex || 0,
                is_active: true,
                max_score: 0,
                audit_type: auditType,
                topic_id: '',
                location_id: ''
            });
        }
        setTopicSearchTerm('');
        setLocationSearchTerm('');
    }, [question, auditType, orderIndex, defaultType]);

    const handleChange = (field, value) => {
        setEditedQuestion(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleChoiceChange = (index, value) => {
        const newChoices = [...(editedQuestion.choices || [])];
        newChoices[index] = value;
        handleChange('choices', newChoices);
    };

    const addChoice = () => {
        const newChoices = [...(editedQuestion.choices || []), ''];
        handleChange('choices', newChoices);
    };

    const removeChoice = (index) => {
        const newChoices = (editedQuestion.choices || []).filter((_, i) => i !== index);
        handleChange('choices', newChoices);
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!editedQuestion.question_text) newErrors.question_text = 'שדה חובה';
        if (editedQuestion.question_type === 'multiple_choice' && (editedQuestion.choices || []).some(c => !c.trim())) {
            newErrors.choices = 'יש למלא את כל אפשרויות הבחירה';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setIsSaving(true);
        await onSave(editedQuestion);
        setIsSaving(false);
    };

    const filteredTopics = (topics || []).filter(topic =>
        topic.name.toLowerCase().includes(topicSearchTerm.toLowerCase())
    );

    const filteredLocations = (locations || []).filter(loc =>
        loc.name.toLowerCase().includes(locationSearchTerm.toLowerCase())
    );

    const selectedTopicName = (topics || []).find(t => t.id === editedQuestion.topic_id)?.name;
    const selectedLocationName = (locations || []).find(l => l.id === editedQuestion.location_id)?.name;

    const questionId = question?.id || 'new';

    return (
        <div className="p-4 border bg-gray-50 rounded-lg space-y-4">
            <div>
                <Label htmlFor={`question_text_${questionId}`}>טקסט השאלה/כותרת</Label>
                <Textarea
                    id={`question_text_${questionId}`}
                    value={editedQuestion.question_text || ''}
                    onChange={(e) => handleChange('question_text', e.target.value)}
                    className="mt-1"
                />
                {errors.question_text && <p className="text-red-500 text-xs mt-1">{errors.question_text}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor={`question_type_${questionId}`}>סוג שאלה</Label>
                    <Select
                        value={editedQuestion.question_type || ''}
                        onValueChange={(value) => handleChange('question_type', value)}
                    >
                        <SelectTrigger><SelectValue placeholder="בחר סוג שאלה..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="header">כותרת</SelectItem>
                            <SelectItem value="rating_1_5">דירוג 1-5</SelectItem>
                            <SelectItem value="status_check">תקין/לא תקין/לא רלוונטי</SelectItem>
                            <SelectItem value="text">טקסט חופשי</SelectItem>
                            <SelectItem value="multiple_choice">בחירה מרובה</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor={`max_score_${questionId}`}>ניקוד מקסימלי</Label>
                    <Input
                        id={`max_score_${questionId}`}
                        type="number"
                        value={editedQuestion.max_score || ''}
                        onChange={(e) => handleChange('max_score', parseInt(e.target.value) || 0)}
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>נושא השאלה</Label>
                    {editedQuestion.topic_id && selectedTopicName ? (
                        <div className="flex items-center justify-between mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <span className="text-blue-800 font-medium">{selectedTopicName}</span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                type="button"
                                onClick={() => {
                                    handleChange('topic_id', '');
                                    setTopicSearchTerm('');
                                }}
                            >
                                הסר נושא
                            </Button>
                        </div>
                    ) : (
                        <Collapsible className="mt-1">
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    <span>בחר נושא...</span>
                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 p-1 border rounded-md">
                                <Input
                                    placeholder="חיפוש נושא..."
                                    value={topicSearchTerm}
                                    onChange={(e) => setTopicSearchTerm(e.target.value)}
                                    className="mb-2"
                                />
                                <div className="max-h-[150px] overflow-y-auto space-y-1">
                                    {filteredTopics.map(topic => (
                                        <Button
                                            key={topic.id}
                                            variant="ghost"
                                            className="w-full justify-start"
                                            onClick={() => handleChange('topic_id', topic.id)}
                                            type="button"
                                        >
                                            {topic.name}
                                        </Button>
                                    ))}
                                    {filteredTopics.length === 0 && (
                                        <div className="text-center text-sm text-gray-500 p-4">
                                            לא נמצאו נושאים
                                        </div>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>

                <div>
                    <Label>מיקום בעסק</Label>
                     {editedQuestion.location_id && selectedLocationName ? (
                        <div className="flex items-center justify-between mt-1 p-2 bg-green-50 border border-green-200 rounded-md">
                            <span className="text-green-800 font-medium">{selectedLocationName}</span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                type="button"
                                onClick={() => {
                                    handleChange('location_id', '');
                                    setLocationSearchTerm('');
                                }}
                            >
                                הסר מיקום
                            </Button>
                        </div>
                    ) : (
                        <Collapsible className="mt-1">
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    <span>בחר מיקום...</span>
                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 p-1 border rounded-md">
                                <Input
                                    placeholder="חיפוש מיקום..."
                                    value={locationSearchTerm}
                                    onChange={(e) => setLocationSearchTerm(e.target.value)}
                                    className="mb-2"
                                />
                                <div className="max-h-[150px] overflow-y-auto space-y-1">
                                    {filteredLocations.map(location => (
                                        <Button
                                            key={location.id}
                                            variant="ghost"
                                            className="w-full justify-start"
                                            onClick={() => handleChange('location_id', location.id)}
                                            type="button"
                                        >
                                            {location.name}
                                        </Button>
                                    ))}
                                    {filteredLocations.length === 0 && (
                                        <div className="text-center text-sm text-gray-500 p-4">
                                            לא נמצאו מיקומים
                                        </div>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
            </div>

            {editedQuestion.question_type === 'multiple_choice' && (
                <div>
                    <Label>אפשרויות בחירה</Label>
                    <div className="mt-2 space-y-2">
                        {(editedQuestion.choices || []).map((choice, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={choice}
                                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                                    placeholder={`אפשרות ${index + 1}`}
                                    className="flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeChoice(index)}
                                    type="button"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addChoice}
                            className="gap-2"
                            type="button"
                        >
                            <Plus className="h-4 w-4" />
                            הוספת אפשרות
                        </Button>
                    </div>
                    {errors.choices && <p className="text-red-500 text-xs mt-1">{errors.choices}</p>}
                </div>
            )}

            <div className="flex items-center space-x-2">
                <Switch
                    id={`required_${questionId}`}
                    checked={editedQuestion.is_required || false}
                    onCheckedChange={(checked) => handleChange('is_required', checked)}
                />
                <Label htmlFor={`required_${questionId}`}>שאלה חובה</Label>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel} type="button">
                    <Ban className="ml-2 h-4 w-4" />
                    ביטול
                </Button>
                <Button onClick={handleSave} disabled={isSaving} type="button">
                    <Save className="ml-2 h-4 w-4" />
                    {isSaving ? 'שומר...' : 'שמור'}
                </Button>
            </div>
        </div>
    );
}
