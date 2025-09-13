
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const getReportToolbarHTML = (reportTitle) => {
    const encodedTitle = encodeURIComponent(reportTitle);
    const emailBody = encodeURIComponent(`שלום,\n\nמצורף דוח בנושא: ${reportTitle}.\n\nבברכה,\nצוות המקסיקני`);
    const whatsappText = encodeURIComponent(`היי, מצורף דוח בנושא: ${reportTitle}`);

    return `
      <div id="report-toolbar" style="position: fixed; top: 0; left: 0; right: 0; background: #fff; padding: 10px 20px; display: flex; align-items: center; gap: 10px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-bottom: 1px solid #e2e8f0; font-family: sans-serif; direction: rtl;">
        <span style="font-weight: bold; margin-left: auto; font-size: 16px; color: #1a202c;">${reportTitle}</span>
        <button onclick="window.print()" title="הדפסה / שמירה כ-PDF">🖨️ הדפסה / PDF</button>
        <button onclick="shareViaWhatsApp()" title="שיתוף ב-WhatsApp">💬 WhatsApp</button>
        <button onclick="shareViaEmail()" title="שיתוף באימייל">📧 אימייל</button>
        <button onclick="window.close()" title="סגירה" style="background-color: #f56565;">❌ סגירה</button>
      </div>
      <style>
        #report-toolbar button { display: inline-flex; align-items: center; gap: 5px; background-color: #4299e1; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s; }
        #report-toolbar button:hover { background-color: #2b6cb0; }
        #report-toolbar button[title='סגירה'] { background-color: #f56565; }
        #report-toolbar button[title='סגירה']:hover { background-color: #c53030; }
        body { padding-top: 70px; }
        @media print { #report-toolbar { display: none; } body { padding-top: 0; } }
      </style>
      <script>
        function shareViaWhatsApp() { window.open('https://wa.me/?text=' + "${whatsappText}", '_blank'); }
        function shareViaEmail() { window.location.href = 'mailto:?subject=' + "${encodedTitle}" + '&body=' + "${emailBody}"; }
      </script>
    `;
};


export default function NetworkTaskProgressReport({ task, taskStats, allBranches, allTaskRecords }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateProgressReport = () => {
        if (!allBranches || !allTaskRecords) {
            alert("לא ניתן לייצר את הדוח, נתוני המקור חסרים.");
            return;
        }

        setIsGenerating(true);
        try {
            // סינון סניפים פעילים בלבד
            const activeBranches = allBranches.filter(branch => branch.status === 'active');

            // סינון רשומות של המשימה הנוכחית
            const relevantTaskRecords = allTaskRecords.filter(record => record.task_id === task.id);

            // יצירת מפה של סטטוס סופי לכל סניף, כדי להתמודד עם רשומות כפולות
            const branchFinalStatus = new Map();
            relevantTaskRecords.forEach(record => {
                const currentRecord = branchFinalStatus.get(record.branch_id);
                // סטטוס 'בוצע' תמיד גובר
                if (record.status === 'בוצע') {
                    branchFinalStatus.set(record.branch_id, record);
                } else if (record.status === 'בתהליך' && (!currentRecord || currentRecord.status !== 'בוצע')) {
                    // קבע 'בתהליך' רק אם לא קיים סטטוס 'בוצע'
                    branchFinalStatus.set(record.branch_id, record);
                }
            });
            
            // חלוקה לסניפים שביצעו ושלא ביצעו
            const completedBranches = [];
            const pendingBranches = [];

            for (const branch of activeBranches) {
                const branchData = {
                    name: branch.name,
                    city: branch.city || '',
                    manager: branch.manager_name || '',
                    phone: branch.phone_number || ''
                };

                const finalRecord = branchFinalStatus.get(branch.id);
                
                if (finalRecord && finalRecord.status === 'בוצע') {
                    completedBranches.push({
                        ...branchData,
                        completionDate: format(new Date(finalRecord.completion_date), 'dd/MM/yyyy'),
                        responsible: finalRecord.responsible_person || '',
                        participants: finalRecord.participants || ''
                    });
                } else {
                    // כל סניף שאינו במצב "בוצע" נחשב כ"ממתין" לצורך הדוח
                    pendingBranches.push(branchData);
                }
            }

            const reportTitle = `דוח התקדמות משימה רשתית - ${task.name}`;
            const toolbar = getReportToolbarHTML(reportTitle);

            // יצירת HTML מעוצב לדוח
            const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="%23ffffff" opacity="0.03"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        
        .header h1 {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 40px;
        }
        
        .info-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            border-right: 5px solid #667eea;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .info-section h2 {
            color: #667eea;
            font-size: 1.6em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .info-section h2::before {
            content: '📋';
            margin-left: 10px;
            font-size: 1.2em;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #dee2e6;
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        
        .info-value {
            color: #6c757d;
            font-weight: 500;
        }
        
        .stats-container {
            margin: 30px 0;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .stat-card {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #6c757d;
            font-weight: 500;
        }
        
        .stat-card.completed .stat-number {
            color: #28a745;
        }
        
        .stat-card.pending .stat-number {
            color: #dc3545;
        }
        
        .stat-card.total .stat-number {
            color: #667eea;
        }
        
        .stat-card.percentage .stat-number {
            color: #fd7e14;
        }
        
        .branches-section {
            margin-top: 40px;
        }
        
        .section-title {
            font-size: 1.5em;
            font-weight: 700;
            margin-bottom: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
        }
        
        .completed-title {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            color: #155724;
            border-right: 4px solid #28a745;
        }
        
        .completed-title::before {
            content: '✅';
            margin-left: 10px;
        }
        
        .pending-title {
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
            color: #721c24;
            border-right: 4px solid #dc3545;
        }
        
        .pending-title::before {
            content: '⏳';
            margin-left: 10px;
        }
        
        .branches-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .branches-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 12px;
            text-align: right;
            font-weight: 600;
            font-size: 0.95em;
        }
        
        .branches-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            text-align: right;
        }
        
        .branches-table tr:last-child td {
            border-bottom: none;
        }
        
        .branches-table tbody tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .branches-table tbody tr:hover {
            background: #e3f2fd;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            font-style: italic;
        }
        
        .success-message {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            color: #155724;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            font-size: 1.2em;
            font-weight: 600;
            margin: 20px 0;
            border: 2px solid #28a745;
        }
        
        .success-message::before {
            content: '🎉';
            display: block;
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .stat-card:hover {
                transform: none;
            }
        }
        
        @media (max-width: 768px) {
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .content {
                padding: 20px;
            }
            
            .info-section {
                padding: 20px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .branches-table {
                font-size: 0.9em;
            }
            
            .branches-table th,
            .branches-table td {
                padding: 8px 6px;
            }
        }
    </style>
</head>
<body>
    ${toolbar}
    <div class="container">
        <div class="header">
            <h1>דוח התקדמות משימה רשתית</h1>
            <div class="subtitle">נוצר בתאריך: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}</div>
        </div>
        
        <div class="content">
            <div class="info-section">
                <h2>פרטי המשימה</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">שם המשימה:</span>
                        <span class="info-value">${task.name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">תיאור:</span>
                        <span class="info-value">${task.description || 'ללא תיאור'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">תדירות:</span>
                        <span class="info-value">${task.frequency_in_months > 0 ? `כל ${task.frequency_in_months} חודשים` : 'חד פעמית'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">אחראי מרכזי:</span>
                        <span class="info-value">${task.responsible_person || 'לא מוגדר'}</span>
                    </div>
                </div>
            </div>
            
            <div class="stats-container">
                <div class="stats-grid">
                    <div class="stat-card total">
                        <div class="stat-number">${taskStats.totalBranches}</div>
                        <div class="stat-label">סה"כ סניפים פעילים</div>
                    </div>
                    <div class="stat-card completed">
                        <div class="stat-number">${taskStats.completedBranches}</div>
                        <div class="stat-label">סניפים שביצעו</div>
                    </div>
                    <div class="stat-card pending">
                        <div class="stat-number">${taskStats.totalBranches - taskStats.completedBranches}</div>
                        <div class="stat-label">סניפים שלא ביצעו</div>
                    </div>
                    <div class="stat-card percentage">
                        <div class="stat-number">${taskStats.percentage}%</div>
                        <div class="stat-label">אחוז השלמה</div>
                    </div>
                </div>
            </div>
            
            <div class="branches-section">
                ${completedBranches.length > 0 ? `
                <div class="section-title completed-title">
                    סניפים שביצעו את המשימה (${completedBranches.length})
                </div>
                <table class="branches-table">
                    <thead>
                        <tr>
                            <th>שם הסניף</th>
                            <th>עיר</th>
                            <th>מנהל</th>
                            <th>טלפון</th>
                            <th>תאריך ביצוע</th>
                            <th>אחראי</th>
                            <th>משתתפים</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${completedBranches.map(branch => `
                        <tr>
                            <td><strong>${branch.name}</strong></td>
                            <td>${branch.city}</td>
                            <td>${branch.manager}</td>
                            <td>${branch.phone}</td>
                            <td>${branch.completionDate}</td>
                            <td>${branch.responsible}</td>
                            <td>${branch.participants}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}
                
                ${pendingBranches.length > 0 ? `
                <div class="section-title pending-title">
                    סניפים שלא ביצעו את המשימה (${pendingBranches.length})
                </div>
                <table class="branches-table">
                    <thead>
                        <tr>
                            <th>שם הסניף</th>
                            <th>עיר</th>
                            <th>מנהל</th>
                            <th>טלפון</th>
                            <th>סטטוס</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pendingBranches.map(branch => `
                        <tr>
                            <td><strong>${branch.name}</strong></td>
                            <td>${branch.city}</td>
                            <td>${branch.manager}</td>
                            <td>${branch.phone}</td>
                            <td style="color: #dc3545; font-weight: 600;">לא בוצע</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : `
                <div class="success-message">
                    מצוין! כל הסניפים ביצעו את המשימה בהצלחה!
                </div>
                `}
            </div>
        </div>
    </div>
</body>
</html>`;

            // פתיחה בחלון חדש
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(htmlContent);
                newWindow.document.close();
                newWindow.focus();
            } else {
                alert('נא לאפשר חלונות קופצים כדי לצפות בדוח');
            }

        } catch (error) {
            console.error("Error generating progress report:", error);
            alert('שגיאה ביצירת הדוח. נסה שוב.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={generateProgressReport}
            disabled={isGenerating}
            className="gap-2"
            title={`הורד דוח התקדמות למשימה: ${task.name}`}
        >
            {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FileText className="w-4 h-4" />
            )}
            {isGenerating ? 'מייצר...' : 'הורד דוח'}
        </Button>
    );
}
