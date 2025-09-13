import React, { useState, useEffect } from 'react';
import { SetupTask, DeletedItem } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Search, FileText } from 'lucide-react';

export default function SearchLostContent() {
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchComplete, setSearchComplete] = useState(false);
    // State for the input value, initialized with the default search terms joined by commas.
    const [inputValue, setInputValue] = useState(
        [
            "מקפיא מטוגנים",
            "עומד", 
            "מקרר הפשרת בשר",
            "מקרר הפשרת עוף",
            "מקרר בצקים",
            "מקרר רטבים", 
            "מקרר רטביות",
            "מפוח",
            "מנדפים",
            "מידוף",
            "מידוף נירוסטה",
            "מידוף חדר קירור"
        ].join(', ')
    );

    // useEffect to perform initial search when the component mounts
    useEffect(() => {
        const initialTerms = inputValue.split(',').map(term => term.trim()).filter(Boolean);
        if (initialTerms.length > 0) {
            performDeepSearch(initialTerms);
        }
    }, []);

    // Function to handle the search button click or Enter key press
    const handleSearch = () => {
        const terms = inputValue.split(',').map(term => term.trim()).filter(Boolean);
        if (terms.length > 0) {
            performDeepSearch(terms);
        } else {
            alert("אנא הזן מונחי חיפוש.");
        }
    };

    // Modified performDeepSearch to accept searchTerms as an argument
    const performDeepSearch = async (currentSearchTerms) => {
        setIsSearching(true);
        setSearchComplete(false); // Reset searchComplete when starting a new search
        setSearchResults([]); // Clear previous results
        const results = [];

        try {
            // Search in active setup tasks
            const activeTasks = await SetupTask.list();
            
            for (const task of activeTasks) {
                let foundTerms = [];
                
                // Search in all text fields
                const searchableFields = [
                    { field: 'name', content: task.name || '' },
                    { field: 'description', content: task.description || '' },
                    { field: 'detailed_instructions', content: task.detailed_instructions || '' }
                ];

                // Search in sub_tasks
                if (task.sub_tasks && Array.isArray(task.sub_tasks)) {
                    task.sub_tasks.forEach((subTask, index) => {
                        searchableFields.push({
                            field: `sub_task_${index}`,
                            content: subTask.text || ''
                        });
                    });
                }

                // Check each searchable field for terms
                searchableFields.forEach(({ field, content }) => {
                    currentSearchTerms.forEach(term => { // Use currentSearchTerms from argument
                        if (content.toLowerCase().includes(term.toLowerCase())) {
                            foundTerms.push({ term, field, content: content.substring(0, 200) + (content.length > 200 ? '...' : '') });
                        }
                    });
                });

                if (foundTerms.length > 0) {
                    results.push({
                        type: 'active_task',
                        taskId: task.id,
                        taskName: task.name,
                        foundTerms
                    });
                }
            }

            // Search in deleted items
            const deletedItems = await DeletedItem.list();
            
            for (const item of deletedItems) {
                if (item.item_type === 'SetupTask' && item.item_data) {
                    let foundTerms = [];
                    
                    const itemData = typeof item.item_data === 'string' ? JSON.parse(item.item_data) : item.item_data;
                    
                    const searchableFields = [
                        { field: 'name', content: itemData.name || '' },
                        { field: 'description', content: itemData.description || '' },
                        { field: 'detailed_instructions', content: itemData.detailed_instructions || '' }
                    ];

                    if (itemData.sub_tasks && Array.isArray(itemData.sub_tasks)) {
                        itemData.sub_tasks.forEach((subTask, index) => {
                            searchableFields.push({
                                field: `sub_task_${index}`,
                                content: subTask.text || ''
                            });
                        });
                    }

                    searchableFields.forEach(({ field, content }) => {
                        currentSearchTerms.forEach(term => { // Use currentSearchTerms from argument
                            if (content.toLowerCase().includes(term.toLowerCase())) {
                                foundTerms.push({ term, field, content: content.substring(0, 200) + (content.length > 200 ? '...' : '') });
                            }
                        });
                    });

                    if (foundTerms.length > 0) {
                        results.push({
                            type: 'deleted_task',
                            taskId: item.original_id,
                            taskName: item.item_name,
                            deletedDate: item.created_date,
                            foundTerms,
                            fullData: itemData
                        });
                    }
                }
            }

        } catch (error) {
            console.error("Search failed:", error);
            results.push({
                type: 'error',
                message: 'שגיאה בחיפוש: ' + error.message
            });
        }

        setSearchResults(results);
        setIsSearching(false);
        setSearchComplete(true);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        חיפוש תוכן אבוד - רשימת ציוד
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                           הזן מונחי חיפוש מופרדים בפסיק (,) כדי לסרוק את המשימות הפעילות והמשימות שנמחקו.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="הזן מונחי חיפוש..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={isSearching}>
                                <Search className="w-4 h-4 ml-2" />
                                {isSearching ? "מחפש..." : "חפש"}
                            </Button>
                        </div>
                        
                        {isSearching && (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Search className="w-4 h-4 animate-spin" />
                                מבצע חיפוש עמוק...
                            </div>
                        )}

                        {searchComplete && (
                            <div className="space-y-4">
                                <h3 className="font-semibold">תוצאות חיפוש ({searchResults.length}):</h3>
                                
                                {searchResults.length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                                        <p className="text-gray-600">לא נמצא תוכן מתאים</p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            יכול להיות שהתוכן נמחק לחלוטין או שהוא נמצא במערכת חיצונית
                                        </p>
                                    </div>
                                ) : (
                                    searchResults.map((result, index) => (
                                        <Card key={index} className="border-l-4 border-l-blue-500">
                                            <CardContent className="pt-4">
                                                {result.type === 'active_task' && (
                                                    <div>
                                                        <h4 className="font-semibold text-green-700 mb-2">
                                                            ✓ נמצא במשימה פעילה: {result.taskName}
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {result.foundTerms.map((term, termIndex) => (
                                                                <div key={termIndex} className="bg-green-50 p-2 rounded text-sm">
                                                                    <strong>מונח נמצא:</strong> {term.term}<br/>
                                                                    <strong>בשדה:</strong> {term.field}<br/>
                                                                    <strong>תוכן:</strong> {term.content}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {result.type === 'deleted_task' && (
                                                    <div>
                                                        <h4 className="font-semibold text-red-700 mb-2">
                                                            🗑️ נמצא במשימה שנמחקה: {result.taskName}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 mb-2">נמחק ב: {new Date(result.deletedDate).toLocaleString('he-IL')}</p>
                                                        <div className="space-y-2">
                                                            {result.foundTerms.map((term, termIndex) => (
                                                                <div key={termIndex} className="bg-red-50 p-2 rounded text-sm">
                                                                    <strong>מונח נמצא:</strong> {term.term}<br/>
                                                                    <strong>בשדה:</strong> {term.field}<br/>
                                                                    <strong>תוכן:</strong> {term.content}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        
                                                        {result.fullData && (
                                                            <details className="mt-4">
                                                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                                                    הצג תוכן מלא של המשימה שנמחקה
                                                                </summary>
                                                                <div className="mt-2 p-3 bg-gray-100 rounded text-sm whitespace-pre-wrap">
                                                                    <strong>שם:</strong> {result.fullData.name}<br/><br/>
                                                                    <strong>תיאור:</strong> {result.fullData.description}<br/><br/>
                                                                    <strong>הוראות מפורטות:</strong><br/>
                                                                    {result.fullData.detailed_instructions}<br/><br/>
                                                                    {result.fullData.sub_tasks && result.fullData.sub_tasks.length > 0 && (
                                                                        <>
                                                                            <strong>תת-משימות:</strong><br/>
                                                                            {result.fullData.sub_tasks.map((st, stIndex) => (
                                                                                <div key={stIndex}>• {st.text}</div>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <Button 
                                                                    className="mt-2" 
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(JSON.stringify(result.fullData, null, 2));
                                                                        alert('התוכן הועתק ללוח');
                                                                    }}
                                                                >
                                                                    העתק תוכן מלא
                                                                </Button>
                                                            </details>
                                                        )}
                                                    </div>
                                                )}

                                                {result.type === 'error' && (
                                                    <div className="text-red-600">
                                                        <AlertCircle className="w-4 h-4 inline mr-2" />
                                                        {result.message}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}