import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FullPageError({ errorTitle, errorMessage, onRetry }) {
    return (
        <div className="flex items-center justify-center h-full p-4">
            <Card className="w-full max-w-lg border-red-200 bg-red-50/50">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-4 text-red-700">
                        <AlertCircle className="w-12 h-12" />
                        <span>{errorTitle || 'שגיאה בטעינת הנתונים'}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-red-600 mb-6">
                        {errorMessage || 'אירעה שגיאת רשת. בדוק את החיבור לאינטרנט ונסה שוב.'}
                    </p>
                    {onRetry && (
                        <Button onClick={onRetry} variant="destructive">
                            <RefreshCw className="ml-2 h-4 w-4" />
                            נסה שוב
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}