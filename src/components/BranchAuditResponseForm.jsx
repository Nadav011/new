import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from 'lucide-react';

export default function BranchAuditResponseForm({ audit, user, onSubmit }) {
    const [responseSummary, setResponseSummary] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const responseData = {
            audit_id: audit.id,
            branch_id: audit.branch_id,
            response_summary: responseSummary,
            responses_by_question: {}, // Placeholder for future per-question responses
            submitted_by_name: user.full_name,
            submitted_by_email: user.email,
        };
        try {
            await onSubmit(responseData);
        } catch (error) {
            console.error("Error submitting response:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label htmlFor="response_summary" className="text-lg font-semibold mb-2 block">
                    סיכום תגובת הסניף
                </Label>
                <Textarea
                    id="response_summary"
                    value={responseSummary}
                    onChange={(e) => setResponseSummary(e.target.value)}
                    placeholder="פרט כאן על הפעולות שבוצעו לתיקון הליקויים, או כל מידע רלוונטי אחר שברצונך להעביר להנהלה..."
                    rows={8}
                    required
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            שולח...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            שלח תגובה להנהלה
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}