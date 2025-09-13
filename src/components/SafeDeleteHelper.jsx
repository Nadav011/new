
import { DeletedItem } from '@/api/entities';
import { User } from '@/api/entities';
import { CustomerComplaint } from '@/api/entities'; // Added import for CustomerComplaint

// מפת שמות תצוגה לכל סוג ישות
const ENTITY_DISPLAY_NAMES = {
    'Branch': 'סניף',
    'Audit': 'ביקורת',
    'Questionnaire': 'שאלון',
    'BranchSetup': 'הקמת סניף',
    'AuditQuestion': 'שאלת ביקורת',
    'QuestionTopic': 'נושא שאלה',
    'BusinessLocation': 'מיקום בעסק',
    'AccessibilityAudit': 'ביקורת נגישות',
    'HealthAudit': 'ביקורת בריאות',
    'MinistryAudit': 'ביקורת משרד התמ"ת',
    'TaxAudit': 'ביקורת מס',
    'PlannedVisit': 'ביקור מתוכנן',
    'PlannedAccessibilityVisit': 'ביקור נגישות מתוכנן',
    'CustomerComplaint': 'תלונת לקוח',
    'Complaint': 'תלונת זכיין',
    'ComplaintTopic': 'נושא תלונה',
    'CustomerComplaintTopic': 'נושא תלונת לקוח',
    'Training': 'הדרכה',
    'TrainingRecord': 'רשומת הדרכה',
    'NetworkTask': 'משימה רשתית',
    'NetworkTaskRecord': 'רשומת משימה רשתית',
    'ContactRole': 'תפקיד איש קשר',
    'RenovationCategory': 'קטגוריית שיפוץ',
    'RenovationRole': 'תפקיד שיפוץ',
    'RenovationProfessional': 'איש מקצוע שיפוץ',
    'OfficialDocument': 'מסמך רשמי',
    'DocumentCategory': 'קטגוריית מסמך',
    'FranchiseInquiry': 'פנייה לזיכיון',
    'Note': 'פתק',
    'PersonalTask': 'משימה אישית',
    'JobApplication': 'מועמדות לעבודה',
    'MinistryChecklistItem': 'פריט רשימת בדיקות משרד'
};

// פונקציה כללית למחיקה בטוחה של כל ישות
export const safeDeleteItem = async (entityType, item, customName = null) => {
    try {
        const user = await User.me();
        const itemName = customName || getItemName(entityType, item);
        
        await DeletedItem.create({
            item_type: entityType,
            original_id: item.id,
            item_name: itemName,
            item_data: item,
            deleted_by: user.email || 'Unknown',
            deletion_reason: 'Deleted by user'
        });
        return true;
    } catch (error) {
        console.error(`Error archiving ${entityType}:`, error);
        return false;
    }
};

// פונקציה לקבלת שם הפריט על בסיס הסוג והנתונים
const getItemName = (entityType, item) => {
    switch (entityType) {
        case 'Branch':
            return item.name || `סניף ${item.id}`;
        case 'Audit':
            return `ביקורת ${item.branch_name || item.branch_id} - ${item.audit_date}`;
        case 'Questionnaire':
            return item.name || item.custom_name || `שאלון ${item.questionnaire_type}`;
        case 'BranchSetup':
            return item.branch_name || `הקמת סניף ${item.id}`;
        case 'AuditQuestion':
            return item.question_text || `שאלת ביקורת ${item.id}`;
        case 'QuestionTopic':
            return item.name || `נושא ${item.id}`;
        case 'BusinessLocation':
            return item.name || `מיקום ${item.id}`;
        case 'AccessibilityAudit':
        case 'HealthAudit':
        case 'MinistryAudit':
        case 'TaxAudit':
            return `${ENTITY_DISPLAY_NAMES[entityType]} ${item.branch_name || item.branch_id} - ${item.audit_date}`;
        case 'PlannedVisit':
        case 'PlannedAccessibilityVisit':
            return `${item.audit_type_name || item.audit_type} - ${item.branch_name} - ${item.visit_date}`;
        case 'CustomerComplaint':
        case 'Complaint':
            return `תלונה: ${item.complaint_topic} - ${item.complaint_date}`;
        case 'ComplaintTopic':
        case 'CustomerComplaintTopic':
            return item.name || `נושא תלונה ${item.id}`;
        case 'Training':
            return item.name || `הדרכה ${item.id}`;
        case 'TrainingRecord':
            return `רשומת הדרכה - ${item.completion_date}`;
        case 'NetworkTask':
            return item.name || `משימה רשתית ${item.id}`;
        case 'NetworkTaskRecord':
            return `רשומת משימה - ${item.completion_date}`;
        case 'ContactRole':
            return item.name || `תפקיד ${item.id}`;
        case 'RenovationCategory':
            return item.name || `קטגוריית שיפוץ ${item.id}`;
        case 'RenovationRole':
            return item.name || `תפקיד שיפוץ ${item.id}`;
        case 'RenovationProfessional':
            return item.name || `איש מקצוע ${item.id}`;
        case 'OfficialDocument':
            return item.title || `מסמך ${item.id}`;
        case 'DocumentCategory':
            return item.name || `קטגוריית מסמך ${item.id}`;
        case 'FranchiseInquiry':
            return `${item.full_name} - ${item.city}`;
        case 'Note':
            return item.title || `פתק ${item.id}`;
        case 'PersonalTask':
            return item.text || `משימה ${item.id}`;
        case 'JobApplication':
            return `${item.full_name} - ${item.phone_number}`;
        case 'MinistryChecklistItem':
            return item.title || `פריט בדיקה ${item.id}`;
        default:
            return `${ENTITY_DISPLAY_NAMES[entityType] || entityType} ${item.id}`;
    }
};

// פונקציות ספציפיות לתאימות לאחור (כדי שלא לשבור קוד קיים)
export const safeDeleteBranch = async (branch) => {
    return await safeDeleteItem('Branch', branch);
};

export const safeDeleteAudit = async (audit, branchName = 'Unknown') => {
    const auditWithBranchName = { ...audit, branch_name: branchName };
    return await safeDeleteItem('Audit', auditWithBranchName);
};

export const safeDeleteQuestionnaire = async (questionnaire, questions = []) => {
    const questionnaireData = {
        settings: questionnaire,
        questions: questions
    };
    return await safeDeleteItem('Questionnaire', { 
        ...questionnaire, 
        ...questionnaireData 
    });
};

export const safeDeleteBranchSetup = async (setup) => {
    return await safeDeleteItem('BranchSetup', setup);
};

// פונקציות חדשות לכל הישויות האחרות
export const safeDeleteAuditQuestion = async (question) => {
    return await safeDeleteItem('AuditQuestion', question);
};

export const safeDeleteQuestionTopic = async (topic) => {
    return await safeDeleteItem('QuestionTopic', topic);
};

export const safeDeleteBusinessLocation = async (location) => {
    return await safeDeleteItem('BusinessLocation', location);
};

export const safeDeleteAccessibilityAudit = async (audit, branchName = 'Unknown') => {
    const auditWithBranchName = { ...audit, branch_name: branchName };
    return await safeDeleteItem('AccessibilityAudit', auditWithBranchName);
};

export const safeDeleteHealthAudit = async (audit, branchName = 'Unknown') => {
    const auditWithBranchName = { ...audit, branch_name: branchName };
    return await safeDeleteItem('HealthAudit', auditWithBranchName);
};

export const safeDeleteMinistryAudit = async (audit, branchName = 'Unknown') => {
    const auditWithBranchName = { ...audit, branch_name: branchName };
    return await safeDeleteItem('MinistryAudit', auditWithBranchName);
};

export const safeDeleteTaxAudit = async (audit, branchName = 'Unknown') => {
    const auditWithBranchName = { ...audit, branch_name: branchName };
    return await safeDeleteItem('TaxAudit', auditWithBranchName);
};

export const safeDeletePlannedVisit = async (visit) => {
    return await safeDeleteItem('PlannedVisit', visit);
};

export const safeDeletePlannedAccessibilityVisit = async (visit) => {
    return await safeDeleteItem('PlannedAccessibilityVisit', visit);
};

export const safeDeleteCustomerComplaint = async (complaint) => {
    try {
        // Create a backup copy in DeletedItem before deletion
        await DeletedItem.create({
            item_type: 'CustomerComplaint',
            original_id: complaint.id,
            item_name: `ביקורת יזומה - ${complaint.customer_name}`,
            item_data: complaint,
            deleted_by: (await User.me()).email,
            deletion_reason: 'מחיקה ידנית על ידי אדמין'
        });

        // Delete the original complaint
        await CustomerComplaint.delete(complaint.id);
        
        return true;
    } catch (error) {
        console.error('Error in safeDeleteCustomerComplaint:', error);
        throw error;
    }
};

export const safeDeleteComplaint = async (complaint) => {
    return await safeDeleteItem('Complaint', complaint);
};

export const safeDeleteComplaintTopic = async (topic) => {
    return await safeDeleteItem('ComplaintTopic', topic);
};

export const safeDeleteCustomerComplaintTopic = async (topic) => {
    return await safeDeleteItem('CustomerComplaintTopic', topic);
};

export const safeDeleteTraining = async (training) => {
    return await safeDeleteItem('Training', training);
};

export const safeDeleteTrainingRecord = async (record) => {
    return await safeDeleteItem('TrainingRecord', record);
};

export const safeDeleteNetworkTask = async (task) => {
    return await safeDeleteItem('NetworkTask', task);
};

export const safeDeleteNetworkTaskRecord = async (record) => {
    return await safeDeleteItem('NetworkTaskRecord', record);
};

export const safeDeleteContactRole = async (role) => {
    return await safeDeleteItem('ContactRole', role);
};

export const safeDeleteRenovationCategory = async (category) => {
    return await safeDeleteItem('RenovationCategory', category);
};

export const safeDeleteRenovationRole = async (role) => {
    return await safeDeleteItem('RenovationRole', role);
};

export const safeDeleteRenovationProfessional = async (professional) => {
    return await safeDeleteItem('RenovationProfessional', professional);
};

export const safeDeleteOfficialDocument = async (document) => {
    return await safeDeleteItem('OfficialDocument', document);
};

export const safeDeleteDocumentCategory = async (category) => {
    return await safeDeleteItem('DocumentCategory', category);
};

export const safeDeleteFranchiseInquiry = async (inquiry) => {
    return await safeDeleteItem('FranchiseInquiry', inquiry);
};

export const safeDeleteNote = async (note) => {
    return await safeDeleteItem('Note', note);
};

export const safeDeletePersonalTask = async (task) => {
    return await safeDeleteItem('PersonalTask', task);
};

export const safeDeleteJobApplication = async (application) => {
    return await safeDeleteItem('JobApplication', application);
};

export const safeDeleteMinistryChecklistItem = async (item) => {
    return await safeDeleteItem('MinistryChecklistItem', item);
};

// פונקציה לקבלת שם תצוגה של סוג ישות
export const getEntityDisplayName = (entityType) => {
    return ENTITY_DISPLAY_NAMES[entityType] || entityType;
};
