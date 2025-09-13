import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, FileText, Download } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function PresentationCard({ presentation, onEdit, onDelete }) {
    
    const getFileExtension = (filename) => {
        return filename.split('.').pop()?.toLowerCase();
    };

    const getFileTypeBadge = (ext) => {
        switch (ext) {
            case 'pdf':
                return <Badge variant="destructive">PDF</Badge>;
            case 'ppt':
            case 'pptx':
                return <Badge className="bg-orange-500 text-white">PPT</Badge>;
            case 'doc':
            case 'docx':
                 return <Badge className="bg-blue-500 text-white">DOC</Badge>;
            case 'xls':
            case 'xlsx':
                 return <Badge className="bg-green-600 text-white">XLS</Badge>;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <Badge variant="secondary">תמונה</Badge>;
            default:
                return <Badge variant="outline">{ext?.toUpperCase()}</Badge>;
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg leading-tight">{presentation.title}</CardTitle>
                    {getFileTypeBadge(getFileExtension(presentation.file_name))}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-gray-600">{presentation.description || 'אין תיאור זמין.'}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-gray-50 p-3 rounded-b-lg border-t">
                <div className="text-xs text-gray-500 flex items-center gap-2 truncate" title={presentation.file_name}>
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{presentation.file_name}</span>
                </div>
                <div className="flex gap-1">
                    <a href={presentation.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700">
                            <Eye className="w-4 h-4" />
                        </Button>
                    </a>
                    <a href={presentation.file_url} download={presentation.file_name}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700">
                            <Download className="w-4 h-4" />
                        </Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(presentation)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => onDelete(presentation)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}