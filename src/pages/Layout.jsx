

import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Branch, User, BranchOwnership, BranchSetup, Complaint, NetworkTask } from '@/api/entities';
import { LayoutDashboard, Store, ClipboardCheck, Archive, RefreshCw, Shield, ChevronDown, ChevronRight, FileText, BookOpen, User as UserIcon, Users, Building, HelpCircle, Activity, Library, AlertCircle, Wrench, BookUser, CheckSquare, Briefcase, Menu, X, DatabaseZap, ArrowRight, FileSearch, StickyNote, UserRound, ClipboardList, GitCompareArrows, LogOut, Settings, Eye, FilePenLine, Presentation as PresentationIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationEngine from '../components/NotificationEngine';
import NotificationCenter from '../components/NotificationCenter';
import UserActivityTracker from '../components/UserActivityTracker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FullPageError from '../components/FullPageError';
import AutoBackupManager from '../components/AutoBackupManager';

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [branchCount, setBranchCount] = useState(0);
    const [branchCountError, setBranchCountError] = useState(false);
    const [isAuditsOpen, setIsAuditsOpen] = useState(false);
    const [isTrainingsOpen, setIsTrainingsOpen] = useState(false);
    const [isTasksOpen, setIsTasksOpen] = useState(false);
    const [isNetworkTasksOpen, setIsNetworkTasksOpen] = useState(false);
    const [isBranchTasksOpen, setIsBranchTasksOpen] = useState(false);
    const [isRegulationOpen, setIsRegulationOpen] = useState(false);
    const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
    // Removed isComplaintsOpen state as Complaints are now only Franchisee Complaints under 'Tasks' or removed.
    const [isBranchSetupOpen, setIsBranchSetupOpen] = useState(false);
    const [isRenovationOpen, setIsRenovationOpen] = useState(false);
    const [isDocsOpen, setIsDocsOpen] = useState(false);
    const [isBranchManagementOpen, setIsBranchManagementOpen] = useState(false);
    const [isEmployeesOpen, setIsEmployeesOpen] = useState(false);
    const [isRolesOpen, setIsRolesOpen] = useState(false);
    const [isSystemToolsOpen, setIsSystemToolsOpen] = useState(false);
    const [isForBranchesOnlyOpen, setIsForBranchesOnlyOpen] = useState(false);
    const [isBackOfficeOpen, setIsBackOfficeOpen] = useState(false);

    // Removed isPhoneAuditsOpen state as it will be a direct link now (and now completely removed)
    // const [isPhoneAuditsOpen, setIsPhoneAuditsOpen] = useState(false);

    // Count state for pending franchisee complaints
    const [pendingFranchiseeComplaintsCount, setPendingFranchiseeComplaintsCount] = useState(null);
    const [activeNetworkTasksCount, setActiveNetworkTasksCount] = useState(null);
    const [activeSetupsCount, setActiveSetupsCount] = useState(null);


    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [currentUser, setCurrentUser] = useState(null);
    const [ownedBranches, setOwnedBranches] = useState([]);
    const [ownedSetups, setOwnedSetups] = useState([]);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [userFetchError, setUserFetchError] = useState(null);

    // Impersonation state
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [impersonatedBranchName, setImpersonatedBranchName] = useState('');
    const [originalUser, setOriginalUser] = useState(null); // Store original user data
    
    // New state for owner-selected branch
    const [selectedBranchName, setSelectedBranchName] = useState('');


    const getRoleName = (role) => {
        const roles = {
            admin: 'מנהל מערכת',
            operational_manager: 'מנהל תפעול',
            branch_owner: 'בעל סניף',
            user: 'משתמש רשת',
            accessibility_consultant: 'יועץ נגישות',
            setup_branch_owner: 'זכיין בהקמה',
            franchise_manager: 'מנהל זכיינות'
        };
        return roles[role] || role;
    };

    const safeProcessArray = useCallback((data, fallback = []) => {
        if (data === null || data === undefined) return fallback;
        if (Array.isArray(data)) return data;
        // Instead of Array.from, use manual conversion for safety
        if (typeof data === 'object' && data.length !== undefined) {
            try {
                const result = [];
                for (let i = 0; i < data.length; i++) {
                    result.push(data[i]);
                }
                return result;
            } catch (e) {
                console.warn('Failed to convert to array:', e);
                return fallback;
            }
        }
        return fallback;
    }, []);

    const fetchInitialData = useCallback(async () => {
        setIsUserLoading(true);
        setUserFetchError(null);
        setPendingFranchiseeComplaintsCount(null);
        setActiveNetworkTasksCount(null);
        setActiveSetupsCount(null);

        // Check for impersonation first
        const viewAsEntityType = sessionStorage.getItem('viewAsEntityType');
        const viewAsBranchId = sessionStorage.getItem('viewAsBranchId');
        const viewAsBranchName = sessionStorage.getItem('viewAsBranchName');
        const viewAsSetupId = sessionStorage.getItem('viewAsSetupId');
        const viewAsSetupName = sessionStorage.getItem('viewAsSetupName');
        
        // Check for owner selection
        const selectedOwnerBranchId = sessionStorage.getItem('selectedOwnerBranchId');
        const selectedOwnerBranchName = sessionStorage.getItem('selectedOwnerBranchName');
        setSelectedBranchName(selectedOwnerBranchName || '');

        try {
            const actualUser = await User.me();
            setOriginalUser(actualUser); // Store the original user

            // 1. Handle Branch Impersonation
            if (viewAsEntityType === 'branch' && viewAsBranchId && viewAsBranchName && actualUser.user_type !== 'branch_owner' && actualUser.user_type !== 'setup_branch_owner') {
                setIsImpersonating(true);
                setImpersonatedBranchName(viewAsBranchName);
                setSelectedBranchName(''); // Clear owner selection for impersonation

                // Create a mock branch owner user for the impersonated branch
                const impersonatedUser = {
                    ...actualUser,
                    user_type: 'branch_owner', // Change user type to branch_owner
                    id: `impersonated_${viewAsBranchId}`, // Create unique ID for the session
                    email: `branch_${viewAsBranchId}@impersonated.com`, // Mock email
                    isImpersonating: true // Add flag to identify impersonation
                };
                setCurrentUser(impersonatedUser);

                // Fetch only the specific branch being impersonated
                const impersonatedBranch = await Branch.get(viewAsBranchId).catch(() => null);
                if (impersonatedBranch) {
                    setOwnedBranches([impersonatedBranch]);
                    setBranchCount(1);
                    sessionStorage.setItem('cachedBranches', JSON.stringify([impersonatedBranch]));
                } else {
                    setOwnedBranches([]);
                    setBranchCount(0);
                    sessionStorage.setItem('cachedBranches', JSON.stringify([]));
                }
                setOwnedSetups([]); // Impersonated branch owner doesn't have setups
                setBranchCountError(false);
                setIsUserLoading(false);
                return; // Crucially, exit here to prevent further logic
            }

            // 2. Handle Setup Impersonation
            if (viewAsEntityType === 'setup' && viewAsSetupId && viewAsSetupName && actualUser.user_type !== 'branch_owner' && actualUser.user_type !== 'setup_branch_owner') {
                setIsImpersonating(true);
                setImpersonatedBranchName(viewAsSetupName);
                setSelectedBranchName(''); // Clear owner selection for impersonation

                // Create a mock setup branch owner user for the impersonated setup
                const impersonatedUser = {
                    ...actualUser,
                    user_type: 'setup_branch_owner', // Change user type to setup_branch_owner
                    id: `impersonated_setup_${viewAsSetupId}`, // Create unique ID for the session
                    email: `setup_${viewAsSetupId}@impersonated.com`, // Mock email
                    isImpersonating: true // Add flag to identify impersonation
                };
                setCurrentUser(impersonatedUser);

                // Fetch only the specific setup being impersonated
                const impersonatedSetup = await BranchSetup.get(viewAsSetupId).catch(() => null);
                if (impersonatedSetup) {
                    setOwnedSetups([impersonatedSetup]);
                    setOwnedBranches([]); // Setup owner doesn't have active branches
                    setBranchCount(0);
                    sessionStorage.setItem('cachedBranches', JSON.stringify([])); // No branches to cache
                } else {
                    setOwnedSetups([]);
                    setOwnedBranches([]);
                    setBranchCount(0);
                    sessionStorage.setItem('cachedBranches', JSON.stringify([]));
                }
                setBranchCountError(false);
                setIsUserLoading(false);
                return; // Crucially, exit here to prevent further logic
            }

            // 3. Handle Legacy Branch Impersonation (backward compatibility)
            // This condition runs if no specific 'viewAsEntityType' is found, but old 'viewAsBranchId' exists.
            if (!viewAsEntityType && viewAsBranchId && viewAsBranchName && actualUser.user_type !== 'branch_owner' && actualUser.user_type !== 'setup_branch_owner') {
                setIsImpersonating(true);
                setImpersonatedBranchName(viewAsBranchName);
                setSelectedBranchName(''); // Clear owner selection for impersonation

                // Create a mock branch owner user for the impersonated branch (legacy behavior)
                const impersonatedUser = {
                    ...actualUser,
                    user_type: 'branch_owner', // Assume branch_owner for legacy
                    id: `impersonated_${viewAsBranchId}`,
                    email: `branch_${viewAsBranchId}@impersonated.com`,
                    isImpersonating: true
                };
                setCurrentUser(impersonatedUser);

                const impersonatedBranch = await Branch.get(viewAsBranchId).catch(() => null);
                if (impersonatedBranch) {
                    setOwnedBranches([impersonatedBranch]);
                    setBranchCount(1);
                    sessionStorage.setItem('cachedBranches', JSON.stringify([impersonatedBranch]));
                } else {
                    setOwnedBranches([]);
                    setBranchCount(0);
                    sessionStorage.setItem('cachedBranches', JSON.stringify([]));
                }
                setOwnedSetups([]); // Impersonated branch owner doesn't have setups
                setBranchCountError(false);
                setIsUserLoading(false);
                return; // Crucially, exit here to prevent further logic
            }

            // 4. Not impersonating - proceed with actual user
            setIsImpersonating(false);
            setImpersonatedBranchName('');
            setCurrentUser(actualUser);
            sessionStorage.setItem('cachedUser', JSON.stringify(actualUser));

            // Set selected branch name for display in header
            setSelectedBranchName(selectedOwnerBranchName || '');

            let userBranchesForState = [];
            let userSetupsForState = [];
            let shouldRedirectToBranchSelector = false;

            // Helper for fetching with retry
            const fetchWithRetry = async (fetchFunction, maxRetries = 3) => {
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        if (i > 0) await new Promise(resolve => setTimeout(resolve, i * 5000));
                        const result = await fetchFunction();
                        return safeProcessArray(result);
                    } catch (error) {
                        if (i === maxRetries - 1) throw error;
                        if (error.message?.includes('429') || (error.response && error.response.status === 429) || error.message?.includes('Rate limit')) {
                            console.warn(`Rate limited, retrying in ${(i + 1) * 5}s...`);
                            continue;
                        }
                        throw error;
                    }
                }
                return [];
            };

            // Fetch all branches once
            const allBranches = await fetchWithRetry(() => Branch.list());
            await new Promise(resolve => setTimeout(resolve, 2000)); // Delay after branch list

            // 3. Determine owned/visible branches based on user type
            if (actualUser.user_type === 'branch_owner') {
                const ownerships = await fetchWithRetry(() => BranchOwnership.filter({ user_id: actualUser.id }));
                const ownedBranchIds = ownerships.map(o => o.branch_id);
                const actualOwnedBranches = allBranches.filter(b => ownedBranchIds.includes(b.id));

                // New Logic for Branch Owners
                if (actualOwnedBranches.length > 1 && !selectedOwnerBranchId && location.pathname !== createPageUrl('BranchSelector')) {
                    // User owns multiple branches, none selected, and not already on selector page
                    shouldRedirectToBranchSelector = true;
                    // We don't set ownedBranches here as we are redirecting to selection
                } else if (selectedOwnerBranchId) {
                    // User has selected a specific branch
                    userBranchesForState = actualOwnedBranches.filter(b => b.id === selectedOwnerBranchId);
                } else {
                    // User owns 0 or 1 branch, or is already on BranchSelector page (handled by redirect condition)
                    userBranchesForState = actualOwnedBranches;
                }
            } else if (actualUser.user_type === 'setup_branch_owner') {
                const setups = await fetchWithRetry(() => BranchSetup.filter({ franchisee_email: actualUser.email }));
                userSetupsForState = safeProcessArray(setups);
                userBranchesForState = []; // Setup owners don't own active branches yet
            } else {
                // Admin and other users see all branches
                userBranchesForState = allBranches;
            }

            // If user is not setup_branch_owner, try to get setups anyway (for admin/managers)
            if (actualUser.user_type !== 'setup_branch_owner') {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Delay before setups
                const setupsRes = await BranchSetup.list();
                userSetupsForState = Array.isArray(setupsRes) ? setupsRes : [];
            }

            // 4. Update states based on determined branches/setups
            setOwnedBranches(userBranchesForState);
            setOwnedSetups(userSetupsForState);
            setBranchCount(userBranchesForState.length);
            sessionStorage.setItem('cachedBranches', JSON.stringify(userBranchesForState));
            setBranchCountError(false);

            // 5. Redirect if necessary
            if (shouldRedirectToBranchSelector) {
                setIsUserLoading(false);
                navigate(createPageUrl('BranchSelector'));
                return; // Exit
            }

            // 6. Fetch pending counts for admin-level users (after branch logic)
            const isAdminLevelUser = actualUser.user_type === 'admin' || actualUser.user_type === 'operational_manager';
            if (isAdminLevelUser) {
                try {
                    // Fetch counts sequentially to avoid rate limiting
                    const complaintsResult = await Complaint.filter({ status: { '$in': ['פתוחה', 'בטיפול'] } });
                    setPendingFranchiseeComplaintsCount(safeProcessArray(complaintsResult).length);
                    await new Promise(resolve => setTimeout(resolve, 250)); // Delay

                    const tasksResult = await NetworkTask.filter({ is_active: true });
                    setActiveNetworkTasksCount(safeProcessArray(tasksResult).length);
                    await new Promise(resolve => setTimeout(resolve, 250)); // Delay

                    const setupsResult = await BranchSetup.filter({ status: 'בתהליך' });
                    setActiveSetupsCount(safeProcessArray(setupsResult).length);

                } catch (e) {
                    console.error("Error fetching admin counts:", e);
                    setUserFetchError(e); // Set error state to be handled by UI
                    setPendingFranchiseeComplaintsCount(null);
                    setActiveNetworkTasksCount(null);
                    setActiveSetupsCount(null);
                }
            } else {
                setPendingFranchiseeComplaintsCount(null);
                setActiveNetworkTasksCount(null);
                setActiveSetupsCount(null);
            }

            setIsUserLoading(false);

        } catch (error) {
            console.error("Could not fetch user or branch data in Layout:", error);
            if (error.message && error.message.includes('Network Error')) {
                setUserFetchError(new Error("שגיאת רשת: לא ניתן להתחבר לשרת. אנא בדוק את חיבור האינטרנט שלך ונסה שוב."));
            } else {
                setUserFetchError(error);
            }
            setIsUserLoading(false);
            setBranchCountError(true);
            setPendingFranchiseeComplaintsCount(null); // Reset on error
            setActiveNetworkTasksCount(null);
            setActiveSetupsCount(null);


            // Attempt to load cached data only if not impersonating or an impersonated branch error
            if (!isImpersonating) { // Check if we are not in an active impersonation flow (where currentUser might be mock)
                const cachedUser = sessionStorage.getItem('cachedUser');
                if (cachedUser) {
                    try {
                        const parsedUser = JSON.parse(cachedUser);
                        setCurrentUser(parsedUser);
                        setOriginalUser(parsedUser); // Keep original user cached as well

                        // If it's a branch owner and a branch was previously selected, restore that for display
                        const cachedSelectedBranchName = sessionStorage.getItem('selectedOwnerBranchName');
                        if (parsedUser.user_type === 'branch_owner' && cachedSelectedBranchName) {
                            setSelectedBranchName(cachedSelectedBranchName);
                        } else {
                            setSelectedBranchName(''); // Clear if not owner or no selection
                        }

                        const cachedBranches = sessionStorage.getItem('cachedBranches');
                        if (cachedBranches) {
                            const parsedBranches = JSON.parse(cachedBranches);
                            setOwnedBranches(safeProcessArray(parsedBranches));
                            setBranchCount(safeProcessArray(parsedBranches).length);
                        } else {
                            setOwnedBranches([]);
                            setBranchCount(0);
                        }
                        setIsUserLoading(false);
                    } catch (parseError) {
                        console.error("Error parsing cached user/branch data:", parseError);
                        setCurrentUser(null);
                        setOriginalUser(null);
                        setUserFetchError(new Error("Failed to parse cached user data."));
                        setOwnedBranches([]);
                        setBranchCount(0);
                    }
                }
                else {
                    setCurrentUser(null);
                    setOriginalUser(null);
                    if (!userFetchError) { // Set a more generic error if one isn't already set
                        setUserFetchError(new Error("No user data available, and failed to fetch from server."));
                    }
                }
            }
        }
    }, [safeProcessArray, navigate, location.pathname]);

    const handleLogout = useCallback(async () => {
        try {
            await User.logout();
            // The logout function should redirect automatically
            // But in case it doesn't, we can add a fallback:
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if logout fails, we can try to reload the page
            // which should trigger the authentication flow
            window.location.reload();
        }
    }, []);

    const handleExitImpersonation = () => {
        sessionStorage.removeItem('viewAsEntityType'); // New
        sessionStorage.removeItem('viewAsBranchId');
        sessionStorage.removeItem('viewAsBranchName');
        sessionStorage.removeItem('viewAsSetupId'); // New
        sessionStorage.removeItem('viewAsSetupName'); // New
        window.location.href = createPageUrl('Dashboard'); // Navigate and force reload
    };
    
    // New function to switch branch for owner
    const handleSwitchBranch = () => {
        sessionStorage.removeItem('selectedOwnerBranchId');
        sessionStorage.removeItem('selectedOwnerBranchName');
        navigate(createPageUrl('BranchSelector')); // Navigate to the selection screen
    };


    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        const handleBranchesChanged = () => {
            if (currentUser && !isImpersonating) { // Only refetch branches if not impersonating
                sessionStorage.removeItem('cachedBranches');
                sessionStorage.removeItem('selectedOwnerBranchId'); // Clear selected branch on change
                sessionStorage.removeItem('selectedOwnerBranchName'); // Clear selected branch name on change
                // Add delay to prevent immediate rate limiting
                setTimeout(() => {
                    fetchInitialData(); // Call fetchInitialData to re-evaluate branches including selection
                }, 1000); // 1-second delay after branchesChanged event
            }
        };
        window.addEventListener('branchesChanged', handleBranchesChanged);
        return () => window.removeEventListener('branchesChanged', handleBranchesChanged);
    }, [currentUser, isImpersonating, fetchInitialData]);

    useEffect(() => {
        const activePaths = {
            audits: ['/Audits', '/NewAudit', '/AuditExecutionStatus', '/Questionnaires', '/Questions', '/Topics', '/PlannedVisits'],
            trainings: ['/Trainings', '/ManageTrainings'],
            // New tasks hierarchy
            tasks: ['/MyTasks', '/NetworkTasks', '/ManageNetworkTasks', '/BranchSpecificTasks', '/FranchiseeComplaints', '/SystemManagerTasks'],
            networkTasks: ['/NetworkTasks', '/ManageNetworkTasks'],
            branchTasks: ['/BranchSpecificTasks'],
            // End new tasks hierarchy
            // 'complaints' category removed, its functionality moved or replaced.
            branchSetup: ['/BranchSetupList', '/NewBranchSetup', '/BranchSetupDetails', '/ManageSetupTasks', '/ContactRoles', '/ContactRoleCategories', '/EditBranchSetup'],
            renovation: ['/RenovationProfessionals', '/ManageRenovationRoles', '/ManageRenovationCategories'],
            regulation: ['/AccessibilityAudits', '/TaxAudits', '/MinistryAudits', '/BusinessLicenses', '/DataCleanup', '/HealthAudits'],
            accessibility: ['/AccessibilityAudits', '/AccessibilityAuditForm', '/PlannedAccessibilityVisits'],
            franchiseInquiries: ['/FranchiseInquiries'],
            notes: ['/Notes'],
            meetings: ['/Meetings'], // NEW: Meetings path
            presentations: ['/Presentations'], // NEW: Presentations path
            roles: ['/NetworkContacts'],
            systemTools: ['/ViewAsBranch', '/SearchLostContent'],
            forBranchesOnly: ['/JobApplications', '/ManageOfficialDocuments', '/DocumentCategories', '/FranchiseeComplaints'], // Added FranchiseeComplaints here
            backOffice: ['/HelpGuide', '/IconShowcase', '/BusinessLocations', '/Topics', '/Questions', '/MinistryChecklistManager', '/MyTasks'], // Added back office paths and MyTasks for admin
            initiatedAudits: ['/InitiatedAudits'], // New path for Initiated Audits
        };

        const isPathActive = (paths) => paths.some(page => location.pathname.startsWith(createPageUrl(page.replace('/', ''))));

        setIsAuditsOpen(isPathActive(activePaths.audits));
        setIsTrainingsOpen(isPathActive(activePaths.trainings));

        // Handle new tasks hierarchy
        const isTasksPathActive = isPathActive(activePaths.tasks);
        setIsTasksOpen(isTasksPathActive);
        setIsNetworkTasksOpen(isPathActive(activePaths.networkTasks));
        setIsBranchTasksOpen(isPathActive(activePaths.branchTasks));
        // End new tasks hierarchy

        // Removed setIsComplaintsOpen as 'ניהול תלונות' is removed.

        const isRenovationPathActive = isPathActive(activePaths.renovation);
        const isBranchSetupPathActive = isPathActive(activePaths.branchSetup);
        const isFranchiseInquiriesPathActive = isPathActive(activePaths.franchiseInquiries);

        // Logic for nested menus:
        // Set individual sub-category states first, then determine parent state.

        // Employees (now nested under Branch Management, which is nested under For Branches Only)
        const isJobApplicationsActive = isPathActive(['/JobApplications']); // Specific path for Job Applications
        setIsEmployeesOpen(isJobApplicationsActive); // Direct control for 'Employees' sub-menu

        // Branch Management (now nested under For Branches Only)
        setIsBranchManagementOpen(isJobApplicationsActive); // Set active if its relevant children are active

        // Docs (now nested under For Branches Only)
        const isManageOfficialDocumentsActive = isPathActive(['/ManageOfficialDocuments', '/DocumentCategories']);
        setIsDocsOpen(isManageOfficialDocumentsActive);

        // Network Contacts (now nested)
        const isNetworkContactsActive = isPathActive(activePaths.roles);
        setIsRolesOpen(isNetworkContactsActive);

        // New 'For Branches Only' parent category
        const isFranchiseeComplaintsActive = isPathActive(['/FranchiseeComplaints']); // New variable for franchisee complaints
        setIsForBranchesOnlyOpen(isJobApplicationsActive || isManageOfficialDocumentsActive || isNetworkContactsActive || isFranchiseeComplaintsActive); // If any of its children are active, open it.

        setIsRenovationOpen(isRenovationPathActive);
        setIsBranchSetupOpen(isBranchSetupPathActive || isRenovationPathActive || isFranchiseInquiriesPathActive);

        setIsRegulationOpen(isPathActive(activePaths.regulation));
        if (isPathActive(activePaths.accessibility)) {
            setIsRegulationOpen(true);
            setIsAccessibilityOpen(true);
        } else {
            setIsAccessibilityOpen(false);
        }

        setIsSystemToolsOpen(isPathActive(activePaths.systemTools)); // Set state for system tools category
        // Set state for Back Office category
        setIsBackOfficeOpen(isPathActive(activePaths.backOffice));

        // Removed logic for setIsPhoneAuditsOpen as it's now a direct link (and now fully removed).
    }, [location.pathname]);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const renderNavContent = () => {
        if (isUserLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                    <p>טוען נתונים...</p>
                </div>
            );
        }

        if (userFetchError) {
            return (
                <div className="p-4 text-center">
                    <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-4" />
                    <p className="text-red-700 font-semibold mb-2">שגיאת תקשורת</p>
                    <p className="text-sm text-gray-600 mb-4">בעיה זמנית בחיבור לשרת.</p>
                    <Button onClick={fetchInitialData} size="sm">
                        <RefreshCw className="w-4 h-4 ml-2" />
                        נסה שוב
                    </Button>
                </div>
            );
        }

        // --- Permission Flags ---
        // These flags are now ALWAYS based on `currentUser`, which is the one being displayed
        // (either the real user or the impersonated one).
        const isConsultant = currentUser?.user_type === 'accessibility_consultant';
        const isAdmin = currentUser?.user_type === 'admin'; // Now based on currentUser
        const isOperationalManager = currentUser?.user_type === 'operational_manager'; // Now based on currentUser
        const isFullAdmin = isAdmin; // Only a true admin has full admin rights (now based on currentUser)
        const isAdminLevel = isAdmin || isOperationalManager; // Admin-level permissions for operational tasks (now based on currentUser)
        const isFranchiseManager = currentUser?.user_type === 'franchise_manager';
        const isBranchOwner = currentUser?.user_type === 'branch_owner' || currentUser?.user_type === 'setup_branch_owner';

        // This flag uses `originalUser` to decide if the "System Tools" menu should be visible AT ALL.
        // It's a special case for a tool that only the real admin should see.
        const canSeeSystemTools = (originalUser?.user_type === 'admin' || originalUser?.user_type === 'operational_manager');

        // FIXED: Include setup_branch_owner in showSetupMenu logic
        const showSetupMenu = isAdminLevel || ownedSetups.length > 0 || isFranchiseManager || currentUser?.user_type === 'setup_branch_owner';
        // The previous showBranchManagementMenu and visibility of Docs are now handled by the new 'For Branches Only' section

        const auditItems = isBranchOwner ? [
            { title: "רשימת ביקורות", url: createPageUrl("Audits") }
        ] : [
            { title: "רשימת ביקורות", url: createPageUrl("Audits") },
            { title: "הוספת ביקורת", url: createPageUrl("NewAudit") },
            { title: "מצב ביצוע ביקורות", url: createPageUrl("AuditExecutionStatus") },
            { title: "תכנון ביקורים", url: createPageUrl("PlannedVisits") },
            ...(isFullAdmin ? [{ title: "ניהול שאלונים", url: createPageUrl("Questionnaires") }] : [])
        ];

        const trainingItems = isBranchOwner ? [
            { title: "מצב הדרכות", url: createPageUrl("Trainings") },
        ] : [
            { title: "מצב הדרכות", url: createPageUrl("Trainings") },
            ...(isAdminLevel ? [{ title: "ניהול הדרכות", url: createPageUrl("ManageTrainings") }] : [])
        ];

        const networkTaskItems = isBranchOwner ? [
            { title: "מצב משימות רשתיות", url: createPageUrl("NetworkTasks") },
        ] : [
            { title: "מצב משימות רשתיות", url: createPageUrl("NetworkTasks") },
            ...(isAdminLevel ? [{ title: "ניהול משימות רשתיות", url: createPageUrl("ManageNetworkTasks") }] : [])
        ];

        // complaintItems is no longer needed

        const regulationItems = [
            { title: "ביקורת משרד הבריאות/תברואה", url: createPageUrl("HealthAudits") },
            { title: "ביקורת משרד התמ״ת", url: createPageUrl("MinistryAudits") },
            { title: "ניהול רישיון עסק", url: createPageUrl("BusinessLicenses") },
            { title: "ביקורת מס הכנסה/מעמ", url: createPageUrl("TaxAudits") }
        ];

        const accessibilityItems = [
            { title: "ניהול אישורי נגישות", url: createPageUrl("AccessibilityAudits") },
            { title: "תכנון ביקורות נגישות", url: createPageUrl("PlannedAccessibilityVisits") },
            { title: "ביצוע ביקורת נגישות", url: createPageUrl("AccessibilityAuditForm") }
        ];

        const branchSetupItems = [
            { title: "רשימת הקמות", url: createPageUrl("BranchSetupList") },
        ];

        // Add admin-level setup items
        if (isAdminLevel) {
            branchSetupItems.unshift({ title: "הקמת סניף חדש", url: createPageUrl("NewBranchSetup") });
            if (isFullAdmin) {
                branchSetupItems.push({ title: "ניהול משימות להקמת סניף חדש", url: createPageUrl("ManageSetupTasks") });
            }
        }

        const renovationItems = [
            { title: "אנשי מקצוע בשיפוץ", url: createPageUrl("RenovationProfessionals") },
            ...(isFullAdmin ? [
                { title: "ניהול תפקידי שיפוץ", url: createPageUrl("ManageRenovationRoles") },
                { title: "ניהול קטגוריות שיפוץ", url: createPageUrl("ManageRenovationCategories") }
            ] : [])
        ];

        // The logic for docItems should remain here as it depends on user roles,
        // but its display location moves.
        const docItems = isAdminLevel ? [
            { title: "ניהול מסמכים", url: createPageUrl("ManageOfficialDocuments") },
            ...(isFullAdmin ? [{ title: "ניהול קטגוריות", url: createPageUrl("DocumentCategories") }] : [])
        ] : [
            { title: "צפייה במסמכים", url: createPageUrl("ManageOfficialDocuments") }
        ];

        return (
            <TooltipProvider>
                <ul>
                    {/* 1. לוח בקרה */}
                    {!isConsultant && (
                        <li>
                            <Link
                                to={createPageUrl("Dashboard")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${
                                    location.pathname === createPageUrl("Dashboard") ? 'bg-green-100 text-green-800 font-semibold' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <LayoutDashboard className="w-5 h-5" />
                                    <span>לוח בקרה</span>
                                </div>
                            </Link>
                        </li>
                    )}
                    
                    {/* NEW: מצגות ותוכניות */}
                    {!isConsultant && (isAdminLevel) && (
                         <li>
                            <Link
                                to={createPageUrl("Presentations")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${
                                    location.pathname.startsWith(createPageUrl("Presentations")) ? 'bg-green-100 text-green-800 font-semibold' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <PresentationIcon className="w-5 h-5" />
                                    <span>מצגות ותוכניות</span>
                                </div>
                            </Link>
                        </li>
                    )}


                    {/* 2. סניפים */}
                    {!isConsultant && (
                        <li>
                            <Link
                                to={createPageUrl("Branches")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${
                                    location.pathname === createPageUrl("Branches") ? 'bg-green-100 text-green-800 font-semibold' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Store className="w-5 h-5" />
                                    <span>סניפים</span>
                                </div>
                                {branchCount !== undefined && (
                                    <div className="flex items-center gap-2">
                                        {branchCountError && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="text-xs font-bold bg-red-200 text-red-700 rounded-full w-5 h-5 flex items-center justify-center">!</span>
                                                </TooltipTrigger>
                                                <TooltipContent><p>שגיאת רשת, ייתכן שהמידע אינו עדכני.</p></TooltipContent>
                                            </Tooltip>
                                        )}
                                        <span className="text-xs font-mono bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">
                                            {branchCount}
                                        </span>
                                    </div>
                                )}
                            </Link>
                        </li>
                    )}

                    {/* 3. משימות - קטגוריה חדשה */}
                    {!isConsultant && (
                        <li>
                            <button onClick={() => setIsTasksOpen(!isTasksOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${isTasksOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <ClipboardList className="w-5 h-5" />
                                    <span>משימות</span>
                                </div>
                                {isTasksOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            {isTasksOpen && (
                                <ul className="mr-8 mt-1 space-y-1">
                                    {/* המשימות שלי - Hidden for full admins unless impersonating */}
                                    {(!isFullAdmin || isImpersonating) && (
                                        <li>
                                            <Link
                                                to={createPageUrl("MyTasks")}
                                                className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${
                                                    location.pathname.startsWith(createPageUrl("MyTasks")) ? 'bg-green-100 text-green-800 font-semibold' : ''
                                                }`}
                                            >
                                                המשימות שלי
                                            </Link>
                                        </li>
                                    )}

                                    {/* משימות מנהל מערכת - רק למנהל מערכת אמיתי ולא בתצוגת סניף */}
                                    {originalUser?.user_type === 'admin' && !isImpersonating && (
                                        <li>
                                            <Link
                                                to={createPageUrl("SystemManagerTasks")}
                                                className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${
                                                    location.pathname.startsWith(createPageUrl("SystemManagerTasks")) ? 'bg-green-100 text-green-800 font-semibold' : ''
                                                }`}
                                            >
                                                משימות מנהל מערכת
                                            </Link>
                                        </li>
                                    )}

                                    {/* Sub-categories visible only for admin levels */}
                                    {isAdminLevel && (
                                        <>
                                            {/* משימות רשת - תת קטגוריה */}
                                            <li>
                                                <button onClick={() => setIsNetworkTasksOpen(!isNetworkTasksOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${isNetworkTasksOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                                    <span>משימות רשת</span>
                                                    {isNetworkTasksOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                </button>
                                                {isNetworkTasksOpen && (
                                                    <ul className="mr-6 mt-1 space-y-1">
                                                        <li>
                                                            <Link
                                                                to={createPageUrl("NetworkTasks")}
                                                                className={`block px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(createPageUrl('NetworkTasks')) && !location.pathname.startsWith(createPageUrl('ManageNetworkTasks')) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}
                                                            >
                                                                מצב משימות רשתיות
                                                            </Link>
                                                        </li>
                                                        {isAdminLevel && (
                                                            <li>
                                                                <Link
                                                                    to={createPageUrl("ManageNetworkTasks")}
                                                                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(createPageUrl('ManageNetworkTasks')) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}
                                                                >
                                                                    <span>ניהול משימות רשתיות</span>
                                                                    {isAdminLevel && activeNetworkTasksCount !== null && activeNetworkTasksCount > 0 && (
                                                                        <span className="text-xs font-mono bg-blue-200 text-blue-700 rounded-full px-2 py-0.5">
                                                                            {activeNetworkTasksCount}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </li>
                                                        )}
                                                    </ul>
                                                )}
                                            </li>

                                            {/* משימות סניף ספציפי - תת קטגוריה */}
                                            <li>
                                                <button onClick={() => setIsBranchTasksOpen(!isBranchTasksOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${isBranchTasksOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                                    <span>משימות סניף ספציפי</span>
                                                    {isBranchTasksOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                </button>
                                                {isBranchTasksOpen && (
                                                    <ul className="mr-6 mt-1 space-y-1">
                                                        <li>
                                                            <Link
                                                                to={createPageUrl("BranchSpecificTasks")}
                                                                className={`block px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(createPageUrl('BranchSpecificTasks')) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}
                                                            >
                                                                צפה במשימות לפי סניף
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                )}
                                            </li>

                                            {/* טיפול בתלונות זכיינים - תת קטגוריה חדשה */}
                                            <li>
                                                <Link
                                                    to={createPageUrl("FranchiseeComplaints") + "?filter=pending_treatment"}
                                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(createPageUrl('FranchiseeComplaints')) && new URLSearchParams(window.location.search).get('filter') === 'pending_treatment' ? 'bg-green-100 text-green-800 font-semibold' : ''}`}
                                                >
                                                    <span>טיפול בתלונות זכיינים</span>
                                                    {isAdminLevel && pendingFranchiseeComplaintsCount !== null && pendingFranchiseeComplaintsCount > 0 && (
                                                        <span className="text-xs font-mono bg-red-200 text-red-700 rounded-full px-2 py-0.5">
                                                            {pendingFranchiseeComplaintsCount}
                                                        </span>
                                                    )}
                                                </Link>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            )}
                        </li>
                    )}

                    {/* 4. ביקורת סניפים רשת */}
                    {!isConsultant && (
                         <li>
                            <button onClick={() => setIsAuditsOpen(!isAuditsOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${isAuditsOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                <div className="flex items-center gap-3"><ClipboardCheck className="w-5 h-5" /><span>ביקורת סניפים רשת</span></div>
                                {isAuditsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            {isAuditsOpen && (
                                <ul className="mr-8 mt-1 space-y-1">
                                    {auditItems.map((item) => {
                                        const isQuestionnairesActive = item.title === 'ניהול שאלונים' && (location.pathname.startsWith('/Questionnaires') || location.pathname.startsWith('/Questions') || location.pathname.startsWith('/Topics') || location.pathname.startsWith('/BusinessLocations'));
                                        const isItemActive = location.pathname.startsWith(item.url);
                                        return (
                                            <li key={item.title}><Link to={item.url} className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${isQuestionnairesActive || (item.title !== 'ניהול שאלונים' && isItemActive) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>{item.title}</Link></li>
                                        )
                                    })}
                                </ul>
                            )}
                        </li>
                    )}

                    {/* 5. הקמה ושיפוץ סניפים */}
                    {!isConsultant && showSetupMenu && (
                        <li>
                            <button onClick={() => setIsBranchSetupOpen(!isBranchSetupOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${isBranchSetupOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                <div className="flex items-center gap-3"><Building className="w-5 h-5" /><span>{isAdminLevel ? 'הקמה ושיפוץ סניפים' : 'הקמות בתהליך'}</span></div>
                                {isBranchSetupOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            {isBranchSetupOpen && (
                                <ul className="mr-8 mt-1 space-y-1">
                                    {branchSetupItems.map((item) => (
                                        <li key={item.title}>
                                            <Link to={item.url} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(item.url) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                                <span>{item.title}</span>
                                                 {item.title === 'רשימת הקמות' && isAdminLevel && activeSetupsCount !== null && activeSetupsCount > 0 && (
                                                     <span className="text-xs font-mono bg-purple-200 text-purple-700 rounded-full px-2 py-0.5">
                                                        {activeSetupsCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                    {isFullAdmin && (
                                    <>
                                        <li><Link to={createPageUrl("ContactRoles")} className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith('/ContactRoles') ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>ניהול תפקידי אנשי קשר</Link></li>
                                        <li><Link to={createPageUrl("ContactRoleCategories")} className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith('/ContactRoleCategories') ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>ניהול קטגוריות תפקידים</Link></li>

                                        <li className="pt-2">
                                            <button onClick={() => setIsRenovationOpen(!isRenovationOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${isRenovationOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                                <div className="flex items-center gap-2"><BookUser className="w-4 h-4" /><span>רשימת אנשי קשר מקצועיים</span></div>
                                                {isRenovationOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                            </button>
                                            {isRenovationOpen && (
                                                 <ul className="mr-6 mt-1 space-y-1">
                                                    {renovationItems.map((item) => (
                                                        <li key={item.title}><Link to={item.url} className={`block px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(item.url) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>{item.title}</Link></li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    </>
                                    )}
                                </ul>
                            )}
                        </li>
                    )}

                    {/* 6. ביקורות יזומות */}
                    {!isConsultant && !isBranchOwner && (isAdminLevel || isFranchiseManager) && (
                        <li>
                            <Link
                                to={createPageUrl("InitiatedAudits")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${
                                    location.pathname.startsWith(createPageUrl("InitiatedAudits")) ? 'bg-green-100 text-green-800 font-semibold' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FilePenLine className="w-5 h-5" />
                                    <span>ביקורות יזומות</span>
                                </div>
                            </Link>
                        </li>
                    )}

                    {/* 7. פתקים */}
                    {!isConsultant && (
                         <li>
                            <Link
                                to={createPageUrl("Notes")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${
                                    location.pathname.startsWith(createPageUrl("Notes")) ? 'bg-green-100 text-green-800 font-semibold' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <StickyNote className="w-5 h-5" />
                                    <span>פתקים</span>
                                </div>
                            </Link>
                        </li>
                    )}
                    
                    {/* NEW: פגישות */}
                    {!isConsultant && isAdminLevel && (
                         <li>
                            <Link
                                to={createPageUrl("Meetings")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${
                                    location.pathname.startsWith(createPageUrl("Meetings")) ? 'bg-green-100 text-green-800 font-semibold' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5" />
                                    <span>פגישות</span>
                                </div>
                            </Link>
                        </li>
                    )}


                {/* NEW: For Branches Only Category -> Renamed to Branch Tools */}
                {!isConsultant && (isAdminLevel || isBranchOwner) && (
                    <li>
                        <button onClick={() => setIsForBranchesOnlyOpen(!isForBranchesOnlyOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${isForBranchesOnlyOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                            <div className="flex items-center gap-3"><Briefcase className="w-5 h-5" /><span>כלי עזר לסניף</span></div>
                            {isForBranchesOnlyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {isForBranchesOnlyOpen && (
                             <ul className="mr-8 mt-1 space-y-1">
                                {/* ניהול הסניף - MOVED HERE */}
                                <li>
                                    <button onClick={() => setIsBranchManagementOpen(!isBranchManagementOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${isBranchManagementOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                        <div className="flex items-center gap-2"><Wrench className="w-4 h-4" /><span>ניהול הסניף</span></div>
                                        {isBranchManagementOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>
                                    {isBranchManagementOpen && (
                                        <ul className="mr-6 mt-1 space-y-1">
                                            <li>
                                                <button onClick={() => setIsEmployeesOpen(!isEmployeesOpen)} className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ${isEmployeesOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                                    <div className="flex items-center gap-2"><UserRound className="w-4 h-4" /><span>עובדים</span></div>
                                                    {isEmployeesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                </button>
                                                {isEmployeesOpen && (
                                                    <ul className="mr-6 mt-1 space-y-1">
                                                        <li>
                                                            <Link
                                                                to={createPageUrl("JobApplications")}
                                                                className={`block px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(createPageUrl('JobApplications')) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}
                                                            >
                                                                ניהול מועמדים
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                )}
                                            </li>
                                        </ul>
                                    )}
                                </li>
                                {/* מסמכים להורדה - MOVED HERE */}
                                 <li>
                                    <button onClick={() => setIsDocsOpen(!isDocsOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${isDocsOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                        <div className="flex items-center gap-2"><Library className="w-4 h-4" /><span>מסמכים להורדה</span></div>
                                        {isDocsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>
                                    {isDocsOpen && (
                                        <ul className="mr-6 mt-1 space-y-1">
                                            {docItems.map((item) => (
                                                <li key={item.title}><Link to={item.url} className={`block px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(item.url) || (item.title === 'ניהול מסמכים' && location.pathname.startsWith('/DocumentCategories')) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>{item.title}</Link></li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                                 {/* NEW ITEM: תלונות זכיינים */}
                                 <li>
                                    <Link
                                        to={createPageUrl("FranchiseeComplaints")}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${
                                            location.pathname.startsWith(createPageUrl("FranchiseeComplaints")) && !new URLSearchParams(window.location.search).has('filter') ? 'bg-green-100 text-green-800 font-semibold' : ''
                                        }`}
                                    >
                                        <Users className="w-4 h-4" />
                                        <span>תלונות זכיינים</span>
                                    </Link>
                                </li>
                                 {/* אנשי קשר רשת - MOVED HERE & VISIBILITY CHANGED */}
                                 {(isAdminLevel || isBranchOwner) && (
                                     <li>
                                        <button onClick={() => setIsRolesOpen(!isRolesOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${isRolesOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                            <div className="flex items-center gap-2"><BookUser className="w-4 h-4" /><span>אנשי קשר רשת</span></div>
                                            {isRolesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </button>
                                        {isRolesOpen && (
                                            <ul className="mr-6 mt-1 space-y-1">
                                                <li>
                                                    <Link
                                                        to={createPageUrl("NetworkContacts")}
                                                        className={`block px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ${
                                                            location.pathname.startsWith(createPageUrl("NetworkContacts")) ? 'bg-green-100 text-green-800 font-semibold' : ''
                                                        }`}
                                                    >
                                                        ניהול אנשי קשר
                                                    </Link>
                                                </li>
                                            </ul>
                                        )}
                                    </li>
                                 )}
                             </ul>
                        )}
                    </li>
                )}


                {/* ניהול הדרכות */}
                {!isConsultant && (
                     <li>
                        <button onClick={() => setIsTrainingsOpen(!isTrainingsOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${isTrainingsOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                            <div className="flex items-center gap-3"><BookOpen className="w-5 h-5" /><span>ניהול הדרכות</span></div>
                            {isTrainingsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {isTrainingsOpen && (
                            <ul className="mr-8 mt-1 space-y-1">
                                {trainingItems.map((item) => (
                                    <li key={item.title}><Link to={item.url} className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(item.url) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>{item.title}</Link></li>
                                ))}
                            </ul>
                        )}
                    </li>
                )}

                {/* ביקורות רגולציה */}
                <li>
                    <button onClick={() => setIsRegulationOpen(!isRegulationOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${isRegulationOpen || isConsultant ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                        <div className="flex items-center gap-3"><Shield className="w-5 h-5" /><span>ביקורות רגולציה</span></div>
                        {isRegulationOpen || isConsultant ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {(isRegulationOpen || isConsultant) && (
                        <ul className="mr-8 mt-1 space-y-1">
                            <li>
                                <button onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${isAccessibilityOpen || isConsultant ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                    <span>ביקורת נגישות</span>
                                    {isAccessibilityOpen || isConsultant ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>
                                {(isAccessibilityOpen || isConsultant) && (
                                    <ul className="mr-6 mt-1 space-y-1">
                                        {accessibilityItems.map((item) => (
                                            <li key={item.title}><Link to={item.url} className={`block px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(item.url) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>{item.title}</Link></li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                            {!isConsultant && regulationItems.map((item) => (
                                <li key={item.title}><Link to={item.url} className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith(item.url) ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>{item.title}</Link></li>
                            ))}
                            {!isConsultant && isFullAdmin && (
                                <li>
                                    <Link to={createPageUrl("DataCleanup")} className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${location.pathname.startsWith('/DataCleanup') ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                                        ניקוי נתונים
                                    </Link>
                                </li>
                            )}
                        </ul>
                    )}
                </li>

                {/* מתעניינים בזיכיון */}
                {(isAdminLevel || isFranchiseManager) && (
                    <li>
                        <Link
                            to={createPageUrl("FranchiseInquiries")}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${
                                location.pathname.startsWith(createPageUrl("FranchiseInquiries")) ? 'bg-green-100 text-green-800 font-semibold' : ''
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-5 h-5" />
                                <span>מתעניינים בזיכיון</span>
                            </div>
                        </Link>
                    </li>
                )}

                {/* פעילות משתמשים - Only for full admin */}
                {!isConsultant && isFullAdmin && (
                    <li>
                        <Link to={createPageUrl("UserActivity")} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${location.pathname.startsWith('/UserActivity') ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                            <div className="flex items-center gap-3"><Activity className="w-5 h-5" /><span>פעילות משתמשים</span></div>
                        </Link>
                    </li>
                )}

                {/* ייצוא נתונים - Only for full admin */}
                {!isConsultant && isFullAdmin && (
                    <li>
                        <Link to={createPageUrl("DataExport")} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${location.pathname.startsWith('/DataExport') ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                            <div className="flex items-center gap-3"><DatabaseZap className="w-5 h-5" /><span>ייצוא נתונים</span></div>
                        </Link>
                    </li>
                )}

                {/* NEW: System Tools Category - Only for REAL admin level AND not currently impersonating */}
                {canSeeSystemTools && !isImpersonating && (
                     <li>
                        <button onClick={() => setIsSystemToolsOpen(!isSystemToolsOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${isSystemToolsOpen ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                            <div className="flex items-center gap-3"><Settings className="w-5 h-5" /><span>כלי מערכת</span></div>
                            {isSystemToolsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {isSystemToolsOpen && (
                            <ul className="mr-8 mt-1 space-y-1">
                                <li>
                                    <Link
                                        to={createPageUrl("ViewAsBranch")}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all ${
                                            location.pathname.startsWith(createPageUrl("ViewAsBranch")) ? 'bg-green-100 text-green-800 font-semibold' : ''
                                        }`}
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>תצוגת סניף</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={createPageUrl("SearchLostContent")}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-all ${
                                            location.pathname.startsWith(createPageUrl("SearchLostContent")) ? 'bg-amber-100 text-amber-800 font-semibold' : ''
                                        }`}
                                    >
                                        <FileSearch className="w-4 h-4" />
                                        <span>חיפוש תוכן אבוד</span>
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                )}

                {/* קטגוריית משרד אחורי - רק למנהל מערכת אמיתי */}
                {!isConsultant && isFullAdmin && !isImpersonating && (
                    <li>
                        <button onClick={() => setIsBackOfficeOpen(!isBackOfficeOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-700 transition-all mb-2 ${isBackOfficeOpen ? 'bg-gray-100 text-gray-800 font-semibold' : ''}`}>
                            <div className="flex items-center gap-3">
                                <Archive className="w-5 h-5" />
                                <span>משרד אחורי</span>
                            </div>
                            {isBackOfficeOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {isBackOfficeOpen && (
                            <ul className="mr-8 mt-1 space-y-1">
                                <li>
                                    <Link
                                        to={createPageUrl("HelpGuide")}
                                        className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-all ${
                                            location.pathname.startsWith(createPageUrl("HelpGuide")) ? 'bg-gray-100 text-gray-800 font-semibold' : ''
                                        }`}
                                    >
                                        מדריך שימוש
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={createPageUrl("IconShowcase")}
                                        className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-all ${
                                            location.pathname.startsWith(createPageUrl("IconShowcase")) ? 'bg-gray-100 text-gray-800 font-semibold' : ''
                                        }`}
                                    >
                                        מוצג אייקונים
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={createPageUrl("MyTasks")}
                                        className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-all ${
                                            location.pathname.startsWith(createPageUrl("MyTasks")) ? 'bg-gray-100 text-gray-800 font-semibold' : ''
                                        }`}
                                    >
                                        המשימות שלי
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={createPageUrl("BusinessLocations")}
                                        className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-all ${
                                            location.pathname.startsWith(createPageUrl("BusinessLocations")) ? 'bg-gray-100 text-gray-800 font-semibold' : ''
                                        }`}
                                    >
                                        מיקומים בעסק
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={createPageUrl("Topics")}
                                        className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-all ${
                                            location.pathname.startsWith(createPageUrl("Topics")) ? 'bg-gray-100 text-gray-800 font-semibold' : ''
                                        }`}
                                    >
                                        ניהול נושאים
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={createPageUrl("Questions")}
                                        className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-all ${
                                            location.pathname.startsWith(createPageUrl("Questions")) ? 'bg-gray-100 text-gray-800 font-semibold' : ''
                                        }`}
                                    >
                                        ניהול שאלות
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={createPageUrl("MinistryChecklistManager")}
                                        className={`block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-all ${
                                            location.pathname.startsWith(createPageUrl("MinistryChecklistManager")) ? 'bg-gray-100 text-gray-800 font-semibold' : ''
                                        }`}
                                    >
                                        ניהול רשימת משרד התמ״ת
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                )}

                {/* ארכיון - Only for full admin */}
                {!isConsultant && isFullAdmin && (
                    <li>
                        <Link to={createPageUrl("Archive")} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all mb-2 ${location.pathname.startsWith('/Archive') ? 'bg-green-100 text-green-800 font-semibold' : ''}`}>
                            <div className="flex items-center gap-3"><Archive className="w-5 h-5" /><span>ארכיון</span></div>
                        </Link>
                    </li>
                )}
            </ul>
        </TooltipProvider>
    );
}

    const renderMainContent = () => {
        if (isUserLoading) {
            return (
                <div className="flex justify-center items-center h-full">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                        <p className="text-gray-600">טוען נתוני משתמש...</p>
                    </div>
                </div>
            );
        }

        if (userFetchError && !currentUser) {
            return (
                <FullPageError
                    errorTitle="שגיאת התחברות קריטית"
                    errorMessage={userFetchError.message || "לא ניתן היה לאמת את זהותך מול השרת. אנא נסה לרענן את הדף."}
                    onRetry={fetchInitialData}
                />
            );
        }

        return children;
    };

    return (
        <div className="min-h-screen w-full flex bg-gray-50 font-sans" dir="rtl">
            <UserActivityTracker />
            <NotificationEngine />
            {/* Only load AutoBackupManager for original admin users to reduce API calls */}
            {originalUser?.user_type === 'admin' && <AutoBackupManager />}

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background-color: white !important; }
                    main { padding: 0 !important; margin: 0 !important; border: none !important; overflow: visible !important; }
                    .printable-content { padding: 1rem !important; }
                    .card-print { break-inside: avoid; box-shadow: none !important; border: 1px solid #e5e7eb !important; }
                }

                .impersonation-banner {
                    background: repeating-linear-gradient(
                        45deg,
                        #4f46e5,
                        #4f46e5 10px,
                        #6366f1 10px,
                        #6366f1 20px
                    );
                    color: white;
                    padding: 0.5rem 1rem;
                    text-align: center;
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                }

                @media (max-width: 768px) {
                    .mobile-sidebar {
                        position: fixed;
                        top: 0;
                        right: 0;
                        height: 100vh;
                        width: 280px;
                        z-index: 50;
                        transform: translateX(100%);
                        transition: transform 0.3s ease-in-out;
                        background: white;
                        box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.1);
                    }

                    .mobile-sidebar.open {
                        transform: translateX(0);
                    }

                    .mobile-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 40;
                        opacity: 0;
                        pointer-events: none;
                        transition: opacity 0.3s ease-in-out;
                    }

                    .mobile-overlay.open {
                        opacity: 1;
                        pointer-events: auto;
                    }
                }
            `}</style>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay md:hidden ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-white border-l border-gray-200 flex-shrink-0 flex-col h-screen sticky top-0 no-print">
                <div className="p-4 border-b h-16 flex items-center gap-3 flex-shrink-0">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">מ</div>
                    <h1 className="text-xl font-bold text-gray-800">המקסיקני | בקרה</h1>
                </div>
                <nav className="flex-1 p-4 overflow-y-auto min-h-0">
                    {renderNavContent()}
                </nav>
            </aside>

            {/* Mobile Sidebar */}
            <aside className={`mobile-sidebar md:hidden ${isMobileMenuOpen ? 'open' : ''} no-print flex flex-col`}>
                <div className="p-4 border-b h-16 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">מ</div>
                        <h1 className="text-xl font-bold text-gray-800">המקסיקני | בקרה</h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <nav className="flex-1 p-4 overflow-y-auto h-full">
                    {renderNavContent()}
                </nav>
            </aside>

            <main className="flex-1 flex flex-col">
                {isImpersonating && (
                    <div className="impersonation-banner no-print">
                        <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            <span>אתה צופה בתור {impersonatedBranchName.includes("הקמה") ? "סניף בהקמה" : "סניף"}: <strong>{impersonatedBranchName}</strong></span>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 text-white h-auto py-1 px-3"
                            onClick={handleExitImpersonation}
                        >
                            צא ממצב תצוגה
                        </Button>
                    </div>
                )}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 no-print">
                    <div className="flex items-center gap-2">
                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden text-gray-500 hover:text-gray-700"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-gray-800"
                            title="חזור אחורה"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        <h2 className="text-lg font-semibold text-gray-800">{currentPageName}</h2>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        {currentUser && !selectedBranchName && ( // Show user info if not in selected branch view
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                                <UserIcon className="w-4 h-4" />
                                <span className="font-medium">{isImpersonating && originalUser ? `${originalUser.full_name} (צופה)` : currentUser.full_name}</span>
                                <span className="text-gray-500">
                                    ({getRoleName(currentUser.user_type)})
                                </span>
                            </div>
                        )}
                        {/* New: Display for selected branch */}
                        {selectedBranchName && (
                            <div className="hidden md:flex items-center gap-3">
                                <div className="flex items-center gap-2 text-sm text-gray-700 bg-blue-100 px-3 py-1.5 rounded-full">
                                    <Store className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium">צופה בסניף: <span className="font-bold">{selectedBranchName}</span></span>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleSwitchBranch}>
                                    <GitCompareArrows className="w-4 h-4 ml-2" />
                                    החלף סניף
                                </Button>
                             </div>
                        )}
                        
                        <NotificationCenter />
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={fetchInitialData}
                                        disabled={isUserLoading}
                                        className="hover:bg-gray-100"
                                    >
                                        <RefreshCw className={`h-5 w-5 ${isUserLoading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>רענן נתונים</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleLogout}
                                        className="hover:bg-red-50 hover:text-red-600 text-gray-600"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>התנתק מהמערכת</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </header>
                <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto printable-content">
                    {renderMainContent()}
                </div>
            </main>
        </div>
    );
}

