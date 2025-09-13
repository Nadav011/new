
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Download, Mail, MessageSquare, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

export default function ExportButton({ audits, reportName = 'דוח כללי' }) {
  const exportToCsv = () => {
    if (!audits || audits.length === 0) {
        alert("אין נתונים לייצוא");
        return;
    }
    const dataToExport = audits.map(audit => ({
      'שם סניף': audit.branchName || audit.branch_name,
      'סוג ביקורת': audit.audit_type,
      'תאריך': format(new Date(audit.audit_date), 'dd/MM/yyyy'),
      'שם מבקר': audit.auditor_name,
      'ציון כללי': audit.overall_score,
      'סיכום': audit.summary || '',
      'נקודות לשימור': audit.positive_points || '',
      'נקודות לשיפור': audit.points_for_improvement || ''
    }));

    if (dataToExport.length === 0) {
        alert("אין נתונים לייצוא לאחר סינון.");
        return;
    }

    const headers = Object.keys(dataToExport[0]);
    
    const sanitizeCell = (cell) => {
        let cellValue = cell === null || cell === undefined ? '' : String(cell);
        // Replace quotes with double quotes and wrap in quotes if it contains a comma, quote, or newline
        if (cellValue.includes('"') || cellValue.includes(',') || cellValue.includes('\n')) {
            cellValue = `"${cellValue.replace(/"/g, '""')}"`;
        }
        return cellValue;
    };

    const csvRows = [
        headers.join(','), // header row
        ...dataToExport.map(row => 
            headers.map(fieldName => sanitizeCell(row[fieldName])).join(',')
        )
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (platform) => {
    const summary = `סיכום דוח: ${reportName}. הדוח מכיל ${audits.length} רשומות.`;
    const encodedSummary = encodeURIComponent(summary);

    if (platform === 'email') {
        const subject = encodeURIComponent(`סיכום דוח: ${reportName}`);
        const body = encodeURIComponent(`שלום,\n\n${summary}\n\nאנא ייצא את הדוח המלא מהמערכת וצרף אותו למייל זה במידת הצורך.\n\nבברכה,\nצוות המקסיקני`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } else if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodedSummary}`, '_blank');
    }
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
                <span>ייצוא ופעולות</span>
                <ChevronDown className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" dir="rtl">
            <DropdownMenuLabel>אפשרויות</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportToCsv} className="flex items-center gap-2 cursor-pointer">
                <Download className="h-4 w-4" />
                <span>הורד דוח CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('email')} className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4" />
                <span>שלח סיכום במייל</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="flex items-center gap-2 cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                <span>שלח סיכום ב-WhatsApp</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
