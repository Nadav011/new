import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Branches from "./Branches";

import NewAudit from "./NewAudit";

import Questions from "./Questions";

import Audits from "./Audits";

import BranchDetails from "./BranchDetails";

import Questionnaires from "./Questionnaires";

import IconShowcase from "./IconShowcase";

import EditAudit from "./EditAudit";

import AuditDetails from "./AuditDetails";

import Archive from "./Archive";

import Topics from "./Topics";

import AccessibilityAudits from "./AccessibilityAudits";

import TaxAudits from "./TaxAudits";

import MinistryAudits from "./MinistryAudits";

import HealthAudits from "./HealthAudits";

import AccessibilityAuditForm from "./AccessibilityAuditForm";

import BusinessLocations from "./BusinessLocations";

import BusinessLicenses from "./BusinessLicenses";

import PlannedVisits from "./PlannedVisits";

import AccessibilityAuditDetails from "./AccessibilityAuditDetails";

import HealthAuditDetails from "./HealthAuditDetails";

import MinistryAuditDetails from "./MinistryAuditDetails";

import AuditExecutionStatus from "./AuditExecutionStatus";

import Trainings from "./Trainings";

import ManageTrainings from "./ManageTrainings";

import FranchiseeComplaints from "./FranchiseeComplaints";

import BranchSetupList from "./BranchSetupList";

import NewBranchSetup from "./NewBranchSetup";

import ManageSetupTasks from "./ManageSetupTasks";

import HelpGuide from "./HelpGuide";

import ContactRoles from "./ContactRoles";

import ManageOfficialDocuments from "./ManageOfficialDocuments";

import DocumentCategories from "./DocumentCategories";

import ContactRoleCategories from "./ContactRoleCategories";

import BranchSetupDetails from "./BranchSetupDetails";

import DataCleanup from "./DataCleanup";

import UserActivity from "./UserActivity";

import ManageRenovationCategories from "./ManageRenovationCategories";

import ManageRenovationRoles from "./ManageRenovationRoles";

import RenovationProfessionals from "./RenovationProfessionals";

import MinistryChecklistManager from "./MinistryChecklistManager";

import PlannedAccessibilityVisits from "./PlannedAccessibilityVisits";

import EditBranchSetup from "./EditBranchSetup";

import NetworkTasks from "./NetworkTasks";

import ManageNetworkTasks from "./ManageNetworkTasks";

import FranchiseInquiries from "./FranchiseInquiries";

import DataExport from "./DataExport";

import SearchLostContent from "./SearchLostContent";

import Notes from "./Notes";

import MyTasks from "./MyTasks";

import JobApplications from "./JobApplications";

import BranchSpecificTasks from "./BranchSpecificTasks";

import NetworkContacts from "./NetworkContacts";

import RespondToAudit from "./RespondToAudit";

import ViewAsBranch from "./ViewAsBranch";

import SystemManagerTasks from "./SystemManagerTasks";

import InitiatedAudits from "./InitiatedAudits";

import InitiatedAuditForm from "./InitiatedAuditForm";

import RespondToInitiatedAudit from "./RespondToInitiatedAudit";

import MyInitiatedAuditsList from "./MyInitiatedAuditsList";

import BranchSelector from "./BranchSelector";

import Meetings from "./Meetings";

import Presentations from "./Presentations";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Branches: Branches,
    
    NewAudit: NewAudit,
    
    Questions: Questions,
    
    Audits: Audits,
    
    BranchDetails: BranchDetails,
    
    Questionnaires: Questionnaires,
    
    IconShowcase: IconShowcase,
    
    EditAudit: EditAudit,
    
    AuditDetails: AuditDetails,
    
    Archive: Archive,
    
    Topics: Topics,
    
    AccessibilityAudits: AccessibilityAudits,
    
    TaxAudits: TaxAudits,
    
    MinistryAudits: MinistryAudits,
    
    HealthAudits: HealthAudits,
    
    AccessibilityAuditForm: AccessibilityAuditForm,
    
    BusinessLocations: BusinessLocations,
    
    BusinessLicenses: BusinessLicenses,
    
    PlannedVisits: PlannedVisits,
    
    AccessibilityAuditDetails: AccessibilityAuditDetails,
    
    HealthAuditDetails: HealthAuditDetails,
    
    MinistryAuditDetails: MinistryAuditDetails,
    
    AuditExecutionStatus: AuditExecutionStatus,
    
    Trainings: Trainings,
    
    ManageTrainings: ManageTrainings,
    
    FranchiseeComplaints: FranchiseeComplaints,
    
    BranchSetupList: BranchSetupList,
    
    NewBranchSetup: NewBranchSetup,
    
    ManageSetupTasks: ManageSetupTasks,
    
    HelpGuide: HelpGuide,
    
    ContactRoles: ContactRoles,
    
    ManageOfficialDocuments: ManageOfficialDocuments,
    
    DocumentCategories: DocumentCategories,
    
    ContactRoleCategories: ContactRoleCategories,
    
    BranchSetupDetails: BranchSetupDetails,
    
    DataCleanup: DataCleanup,
    
    UserActivity: UserActivity,
    
    ManageRenovationCategories: ManageRenovationCategories,
    
    ManageRenovationRoles: ManageRenovationRoles,
    
    RenovationProfessionals: RenovationProfessionals,
    
    MinistryChecklistManager: MinistryChecklistManager,
    
    PlannedAccessibilityVisits: PlannedAccessibilityVisits,
    
    EditBranchSetup: EditBranchSetup,
    
    NetworkTasks: NetworkTasks,
    
    ManageNetworkTasks: ManageNetworkTasks,
    
    FranchiseInquiries: FranchiseInquiries,
    
    DataExport: DataExport,
    
    SearchLostContent: SearchLostContent,
    
    Notes: Notes,
    
    MyTasks: MyTasks,
    
    JobApplications: JobApplications,
    
    BranchSpecificTasks: BranchSpecificTasks,
    
    NetworkContacts: NetworkContacts,
    
    RespondToAudit: RespondToAudit,
    
    ViewAsBranch: ViewAsBranch,
    
    SystemManagerTasks: SystemManagerTasks,
    
    InitiatedAudits: InitiatedAudits,
    
    InitiatedAuditForm: InitiatedAuditForm,
    
    RespondToInitiatedAudit: RespondToInitiatedAudit,
    
    MyInitiatedAuditsList: MyInitiatedAuditsList,
    
    BranchSelector: BranchSelector,
    
    Meetings: Meetings,
    
    Presentations: Presentations,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Branches" element={<Branches />} />
                
                <Route path="/NewAudit" element={<NewAudit />} />
                
                <Route path="/Questions" element={<Questions />} />
                
                <Route path="/Audits" element={<Audits />} />
                
                <Route path="/BranchDetails" element={<BranchDetails />} />
                
                <Route path="/Questionnaires" element={<Questionnaires />} />
                
                <Route path="/IconShowcase" element={<IconShowcase />} />
                
                <Route path="/EditAudit" element={<EditAudit />} />
                
                <Route path="/AuditDetails" element={<AuditDetails />} />
                
                <Route path="/Archive" element={<Archive />} />
                
                <Route path="/Topics" element={<Topics />} />
                
                <Route path="/AccessibilityAudits" element={<AccessibilityAudits />} />
                
                <Route path="/TaxAudits" element={<TaxAudits />} />
                
                <Route path="/MinistryAudits" element={<MinistryAudits />} />
                
                <Route path="/HealthAudits" element={<HealthAudits />} />
                
                <Route path="/AccessibilityAuditForm" element={<AccessibilityAuditForm />} />
                
                <Route path="/BusinessLocations" element={<BusinessLocations />} />
                
                <Route path="/BusinessLicenses" element={<BusinessLicenses />} />
                
                <Route path="/PlannedVisits" element={<PlannedVisits />} />
                
                <Route path="/AccessibilityAuditDetails" element={<AccessibilityAuditDetails />} />
                
                <Route path="/HealthAuditDetails" element={<HealthAuditDetails />} />
                
                <Route path="/MinistryAuditDetails" element={<MinistryAuditDetails />} />
                
                <Route path="/AuditExecutionStatus" element={<AuditExecutionStatus />} />
                
                <Route path="/Trainings" element={<Trainings />} />
                
                <Route path="/ManageTrainings" element={<ManageTrainings />} />
                
                <Route path="/FranchiseeComplaints" element={<FranchiseeComplaints />} />
                
                <Route path="/BranchSetupList" element={<BranchSetupList />} />
                
                <Route path="/NewBranchSetup" element={<NewBranchSetup />} />
                
                <Route path="/ManageSetupTasks" element={<ManageSetupTasks />} />
                
                <Route path="/HelpGuide" element={<HelpGuide />} />
                
                <Route path="/ContactRoles" element={<ContactRoles />} />
                
                <Route path="/ManageOfficialDocuments" element={<ManageOfficialDocuments />} />
                
                <Route path="/DocumentCategories" element={<DocumentCategories />} />
                
                <Route path="/ContactRoleCategories" element={<ContactRoleCategories />} />
                
                <Route path="/BranchSetupDetails" element={<BranchSetupDetails />} />
                
                <Route path="/DataCleanup" element={<DataCleanup />} />
                
                <Route path="/UserActivity" element={<UserActivity />} />
                
                <Route path="/ManageRenovationCategories" element={<ManageRenovationCategories />} />
                
                <Route path="/ManageRenovationRoles" element={<ManageRenovationRoles />} />
                
                <Route path="/RenovationProfessionals" element={<RenovationProfessionals />} />
                
                <Route path="/MinistryChecklistManager" element={<MinistryChecklistManager />} />
                
                <Route path="/PlannedAccessibilityVisits" element={<PlannedAccessibilityVisits />} />
                
                <Route path="/EditBranchSetup" element={<EditBranchSetup />} />
                
                <Route path="/NetworkTasks" element={<NetworkTasks />} />
                
                <Route path="/ManageNetworkTasks" element={<ManageNetworkTasks />} />
                
                <Route path="/FranchiseInquiries" element={<FranchiseInquiries />} />
                
                <Route path="/DataExport" element={<DataExport />} />
                
                <Route path="/SearchLostContent" element={<SearchLostContent />} />
                
                <Route path="/Notes" element={<Notes />} />
                
                <Route path="/MyTasks" element={<MyTasks />} />
                
                <Route path="/JobApplications" element={<JobApplications />} />
                
                <Route path="/BranchSpecificTasks" element={<BranchSpecificTasks />} />
                
                <Route path="/NetworkContacts" element={<NetworkContacts />} />
                
                <Route path="/RespondToAudit" element={<RespondToAudit />} />
                
                <Route path="/ViewAsBranch" element={<ViewAsBranch />} />
                
                <Route path="/SystemManagerTasks" element={<SystemManagerTasks />} />
                
                <Route path="/InitiatedAudits" element={<InitiatedAudits />} />
                
                <Route path="/InitiatedAuditForm" element={<InitiatedAuditForm />} />
                
                <Route path="/RespondToInitiatedAudit" element={<RespondToInitiatedAudit />} />
                
                <Route path="/MyInitiatedAuditsList" element={<MyInitiatedAuditsList />} />
                
                <Route path="/BranchSelector" element={<BranchSelector />} />
                
                <Route path="/Meetings" element={<Meetings />} />
                
                <Route path="/Presentations" element={<Presentations />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}