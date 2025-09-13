import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, Plus, BookOpen, Calendar } from 'lucide-react';

export default function BranchTrainingStatusDialog({ open, onOpenChange, branch, allTrainings, trainingRecords, onRecordNewTraining, currentUser }) {
    if (!branch) return null;

    const recordsMap = new Map(trainingRecords.map(r => [r.training_id, r]));

    return (
        <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        סטטוס הדרכות: {branch.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    {allTrainings.map(training => {
                        const record = recordsMap.get(training.id);
                        const isCompleted = !!record;
                        return (
                            <div key={training.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                    {isCompleted ? (
                                        <CheckSquare className="w-5 h-5 text-purple-600 mt-1" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-400 mt-1" />
                                    )}
                                    <div>
                                        <span className={`font-medium ${isCompleted ? 'text-purple-800' : 'text-gray-700'}`}>
                                            {training.name}
                                        </span>
                                        {isCompleted ? (
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                בוצע ב-{format(new Date(record.completion_date), 'dd/MM/yyyy', { locale: he })}
                                                {record.next_due_date && (
                                                    <span className="text-red-600 font-medium"> (נדרש חידוש)</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500 mt-1">
                                                טרם בוצע
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isCompleted ? (
                                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                                        הושלם
                                    </Badge>
                                ) : (
                                     <Badge variant="outline">
                                        חסר
                                    </Badge>
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* Only show "Record New Training" button for admins */}
                {currentUser?.user_type === 'admin' && (
                    <DialogFooter>
                        <Button onClick={() => onRecordNewTraining(branch)} className="w-full bg-green-600 hover:bg-green-700">
                            <Plus className="ml-2 h-4 w-4" />
                            רשום הדרכה חדשה לסניף
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}