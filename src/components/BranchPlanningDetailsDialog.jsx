import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, Plus, BarChart2 } from 'lucide-react';

export default function BranchPlanningDetailsDialog({ open, onOpenChange, branch, allQuestionnaireTypes = [], plannedVisitsForBranch = [], onPlanNewVisit }) {
    if (!branch) return null;

    const plannedTypes = new Set(plannedVisitsForBranch.map(v => v.audit_type));
    
    const plannedCount = plannedTypes.size;
    const totalCount = allQuestionnaireTypes.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange} dir="rtl">
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" />
                        סטטוס תכנון: {branch.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {plannedCount}/{totalCount}
                        </div>
                        <div className="text-sm text-gray-600">ביקורים תוכננו</div>
                    </div>
                    
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                        <h4 className="font-medium text-gray-900">סטטוס לפי סוג ביקורת:</h4>
                        {allQuestionnaireTypes.map(type => {
                            const isPlanned = plannedTypes.has(type.type);
                            return (
                                <div key={type.type} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {isPlanned ? (
                                            <CheckSquare className="w-4 h-4 text-blue-600" />
                                        ) : (
                                            <Square className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span className={isPlanned ? "text-blue-700 font-medium" : "text-gray-600"}>
                                            {type.name}
                                        </span>
                                    </div>
                                    {isPlanned ? (
                                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                                            תוכנן
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-500">
                                            טרם תוכנן
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>סגור</Button>
                    <Button onClick={() => { onPlanNewVisit(null, branch); onOpenChange(false); }} className="bg-blue-600 hover:bg-blue-700 gap-2">
                        <Plus className="w-4 h-4" />
                        תכנן ביקור חדש לסניף
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}