import React, { useEffect, useState } from 'react';
import { User, BranchOwnership } from '@/api/entities';
import BranchNotificationPopup from './BranchNotificationPopup';

export default function NotificationEngine() {
    const [currentUser, setCurrentUser] = useState(null);
    const [ownedBranchIds, setOwnedBranchIds] = useState([]);
    const [branchNotification, setBranchNotification] = useState(null);
    const [showBranchPopup, setShowBranchPopup] = useState(false);

    useEffect(() => {
        console.log('🚀 NotificationEngine: Starting up...');
        loadUserData();
        
        // Add event listener for branch notifications
        const handleBranchNotification = (event) => {
            console.log('🔔 NOTIFICATION EVENT RECEIVED:', event.detail);
            handleNewBranchNotification(event.detail);
        };

        window.addEventListener('newBranchNotification', handleBranchNotification);
        console.log('👂 NotificationEngine: Event listener added');

        return () => {
            window.removeEventListener('newBranchNotification', handleBranchNotification);
            console.log('🗑️ NotificationEngine: Cleanup completed');
        };
    }, []);

    const loadUserData = async () => {
        try {
            console.log('📡 Loading user data...');
            const user = await User.me();
            setCurrentUser(user);
            console.log('👤 User loaded:', {
                id: user.id,
                email: user.email,
                name: user.full_name,
                type: user.user_type
            });

            // If user is branch owner, get their branches
            if (user.user_type === 'branch_owner') {
                console.log('🏢 User is branch owner, fetching owned branches...');
                const ownerships = await BranchOwnership.filter({ user_id: user.id });
                const branchIds = ownerships.map(o => o.branch_id);
                setOwnedBranchIds(branchIds);
                console.log('🏠 Owned branches:', branchIds);
            }
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
        }
    };

    const handleNewBranchNotification = (notificationData) => {
        console.log('🎯 Processing notification:', notificationData);
        
        if (!notificationData || !currentUser) {
            console.log('⚠️ Missing data - notification or user not available');
            return;
        }

        const targetBranchId = notificationData.branchId;
        console.log('🎯 Target branch ID:', targetBranchId);
        console.log('👤 Current user type:', currentUser.user_type);
        console.log('🏠 Owned branches:', ownedBranchIds);

        // Check if this notification is relevant for current user
        let shouldShowPopup = false;

        // Case 1: User is impersonating this branch (admin/manager viewing as branch)
        const impersonatedBranchId = sessionStorage.getItem('viewAsBranchId');
        if (impersonatedBranchId === targetBranchId) {
            console.log('🎭 User is impersonating target branch');
            shouldShowPopup = true;
        }

        // Case 2: User owns this branch
        if (currentUser.user_type === 'branch_owner' && ownedBranchIds.includes(targetBranchId)) {
            console.log('🏠 User owns target branch');
            shouldShowPopup = true;
        }

        console.log('🚨 Should show popup?', shouldShowPopup);

        if (shouldShowPopup) {
            console.log('✅ SHOWING POPUP NOW!');
            setBranchNotification(notificationData);
            setShowBranchPopup(true);
        } else {
            console.log('❌ Popup not shown - conditions not met');
        }
    };

    return (
        <>
            <BranchNotificationPopup
                notification={branchNotification}
                isOpen={showBranchPopup}
                onClose={() => {
                    console.log('❌ Closing popup');
                    setShowBranchPopup(false);
                    setBranchNotification(null);
                }}
            />
        </>
    );
}