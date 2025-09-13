import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UploadFile } from '@/api/integrations';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileImage, ClipboardEdit } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function DynamicAuditForm({
    auditType,
    questions,
    topics,
    businessLocations,
    onResponsesChange,
    onScoreChange,
    initialResponses = {}
}) {
    const [responses, setResponses] = useState(initialResponses || {});
    const [uploadingFiles, setUploadingFiles] = useState({});

    // Effect to initialize/reset responses when the questions prop changes.
    useEffect(() => {
        const newResponses = { ...initialResponses };
        if (questions && questions.length > 0) {
            questions.forEach(q => {
                if (!newResponses[q.id]) {
                    newResponses[q.id] = { response_value: '', file_urls: [] };
                } else if (!newResponses[q.id].file_urls) {
                    newResponses[q.id].file_urls = [];
                }
            });
        }
        setResponses(newResponses);
        onResponsesChange(newResponses);
    }, [questions, initialResponses, onResponsesChange]);

    // Effect to calculate and report score when responses or questions change
    useEffect(() => {
        if (!questions || questions.length === 0) {
            onScoreChange({ totalScore: 0, maxPossibleScore: 0 });
            return;
        }

        let totalScore = 0;
        let maxPossibleScore = 0;

        questions.forEach(question => {
            if (question.question_type !== 'header' && question.max_score && question.max_score > 0) {
                maxPossibleScore += question.max_score;
                const response = responses[question.id];
                if (response?.response_value) {
                    let questionScore = 0;
                    
                    if (question.question_type === 'rating_1_5') {
                        const rating = parseInt(response.response_value, 10);
                        if (!isNaN(rating)) {
                           questionScore = (rating / 5) * question.max_score;
                        }
                    } else if (question.question_type === 'status_check') {
                        switch (response.response_value) {
                            case 'תקין':
                                questionScore = question.max_score;
                                break;
                            case 'תקין חלקי':
                                questionScore = question.max_score * 0.5;
                                break;
                            case 'לא תקין':
                                questionScore = 0;
                                break;
                            default:
                                questionScore = 0;
                        }
                    }
                    totalScore += questionScore;
                }
            }
        });

        onScoreChange({ totalScore: Math.round(totalScore), maxPossibleScore });
    }, [responses, questions, onScoreChange]);

    const handleResponseChange = (questionId, value) => {
        setResponses(prev => ({ 
            ...prev, 
            [questionId]: { 
                ...(prev[questionId] || { file_urls: [] }), 
                response_value: value 
            } 
        }));
        // We need to trigger the parent's state update immediately
        onResponsesChange(currentResponses => ({
            ...currentResponses,
            [questionId]: {
                ...(currentResponses[questionId] || { file_urls: [] }),
                response_value: value
            }
        }));
    };

    const handleFileUpload = async (questionId, files) => {
        if (!files || files.length === 0) return;
        setUploadingFiles(prev => ({ ...prev, [questionId]: true }));
        try {
            const uploadPromises = Array.from(files).map(file => UploadFile({ file }));
            const uploadResults = await Promise.all(uploadPromises);
            const fileUrls = uploadResults.map(result => result.file_url).filter(Boolean);
            
            const newResponses = { ...responses };
            const currentFiles = newResponses[questionId]?.file_urls || [];
            const newFileUrls = [...new Set([...currentFiles, ...fileUrls])];
            newResponses[questionId] = {
                ...(newResponses[questionId] || { response_value: '' }),
                file_urls: newFileUrls
            };
            setResponses(newResponses);
            onResponsesChange(newResponses); // Update parent state
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('שגיאה בהעלאת הקבצים');
        }
        setUploadingFiles(prev => ({ ...prev, [questionId]: false }));
    };
    
    const removeFile = (questionId, fileIndex) => {
        const newResponses = { ...responses };
        const currentFiles = newResponses[questionId]?.file_urls || [];
        const newFiles = currentFiles.filter((_, index) => index !== fileIndex);
        newResponses[questionId] = {
            ...(newResponses[questionId] || { response_value: '' }),
            file_urls: newFiles
        };
        setResponses(newResponses);
        onResponsesChange(newResponses); // Update parent state
    };
    
    if (!questions) {
        return null; // Parent is loading, don't show anything yet
    }

    if (questions.length === 0) {
        return (
             <div className="text-center py-10 bg-yellow-50 border border-yellow-200 rounded-lg">
                <ClipboardEdit className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">לא הוגדרו שאלות</h3>
                <p className="text-yellow-600 mb-4">לא הוגדרו שאלות עבור סוג ביקורת זה.</p>
                <Link to={createPageUrl(`Questions?type=${encodeURIComponent(auditType)}`)}>
                    <Button variant="outline" className="gap-2">
                        <ClipboardEdit className="w-4 h-4" />
                        עבור להגדרת שאלות
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {questions.map((question) => {
                if (question.question_type === 'header') {
                    return (
                        <div key={question.id} className="pt-4 pb-2 border-b-2 border-green-600">
                            <h2 className="text-xl font-bold text-green-700">
                                {question.question_text}
                            </h2>
                        </div>
                    );
                }

                return (
                    <div key={question.id} className="space-y-4 border-b pb-6 last:border-b-0">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium flex items-center gap-2">
                                {question.question_text}
                                {question.is_required && <span className="text-red-500">*</span>}
                            </Label>
                            {question.max_score > 0 && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                                    {question.max_score} נק'
                                </span>
                            )}
                        </div>
                        
                        {question.question_type === 'text' && (
                            <Textarea
                                value={responses[question.id]?.response_value || ''}
                                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                placeholder="הכנס תשובה..."
                                required={question.is_required}
                            />
                        )}

                        {question.question_type === 'rating_1_5' && (
                            <Select 
                                value={responses[question.id]?.response_value || ''} 
                                onValueChange={(value) => handleResponseChange(question.id, value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר דירוג..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 - גרוע מאוד</SelectItem>
                                    <SelectItem value="2">2 - גרוע</SelectItem>
                                    <SelectItem value="3">3 - בסדר</SelectItem>
                                    <SelectItem value="4">4 - טוב</SelectItem>
                                    <SelectItem value="5">5 - מעולה</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {question.question_type === 'status_check' && (
                            <Select 
                                value={responses[question.id]?.response_value || ''} 
                                onValueChange={(value) => handleResponseChange(question.id, value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר סטטוס..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="תקין">תקין</SelectItem>
                                    <SelectItem value="תקין חלקי">תקין חלקי</SelectItem>
                                    <SelectItem value="לא תקין">לא תקין</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {question.question_type === 'multiple_choice' && (
                            <Select
                                value={responses[question.id]?.response_value || ''}
                                onValueChange={(value) => handleResponseChange(question.id, value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר תשובה..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(question.choices || []).map((choice, index) => (
                                        <SelectItem key={index} value={choice}>{choice}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        
                        <div>
                            <Label className="text-sm text-gray-600">קבצים מצורפים (תמונות, מסמכים)</Label>
                            <div className="mt-2">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={(e) => handleFileUpload(question.id, e.target.files)}
                                    className="hidden"
                                    id={`file-upload-${question.id}`}
                                />
                                <label
                                    htmlFor={`file-upload-${question.id}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                                >
                                    {uploadingFiles[question.id] ? (
                                        <>מעלה קבצים...</>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            העלה קבצים
                                        </>
                                    )}
                                </label>
                            </div>
                            
                            {responses[question.id]?.file_urls?.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {responses[question.id].file_urls.map((fileUrl, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                            <FileImage className="w-4 h-4" />
                                            <a 
                                                href={fileUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline flex-1"
                                            >
                                                קובץ מצורף {index + 1}
                                            </a>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFile(question.id, index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}