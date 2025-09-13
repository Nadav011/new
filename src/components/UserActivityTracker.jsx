import React, { useEffect } from 'react';
import { User } from '@/api/entities';

export default function UserActivityTracker() {
    useEffect(() => {
        let intervalId;
        let isActive = true;
        let retryCount = 0;
        const maxRetries = 3;

        // Function to just update the timestamp periodically
        const updateLastSeen = async () => {
            // Prevent API call if the browser is offline or component is inactive
            if (!isActive || !navigator.onLine) {
                console.log('UserActivityTracker: Skipping update (offline or inactive)');
                return;
            }
            
            try {
                await User.updateMyUserData({
                    last_seen: new Date().toISOString(),
                });
                retryCount = 0; // Reset on success
            } catch (error) {
                retryCount++;
                // This is a background task, so we log the error but don't show an alert to the user
                console.warn('Failed to update user activity (background task):', error.message || error);
                
                // If we've failed multiple times, reduce frequency
                if (retryCount >= maxRetries) {
                    console.warn(`User activity update failed ${maxRetries} times, reducing frequency`);
                }
            }
        };
        
        // Function to run once on mount to start a "session"
        const startSession = async () => {
            if (!isActive || !navigator.onLine) {
                console.log('UserActivityTracker: Skipping session start (offline or inactive)');
                return;
            }
            
            try {
                const currentUser = await User.me();
                // Cache user data for other components
                sessionStorage.setItem('cachedUser', JSON.stringify(currentUser));
                
                // Increment session count on initial load
                await User.updateMyUserData({
                    last_seen: new Date().toISOString(),
                    total_sessions: (currentUser.total_sessions || 0) + 1
                });
                retryCount = 0; // Reset on success
            } catch (error) {
                retryCount++;
                console.warn('Failed to initialize user session:', error.message || error);
            }
        };

        // Start a new session and update count when the component first mounts
        startSession();

        // Get interval based on retry count and online status
        const getUpdateInterval = () => {
            if (!navigator.onLine) {
                return 10 * 60 * 1000; // 10 minutes when offline
            }
            if (retryCount >= maxRetries) {
                return 10 * 60 * 1000; // 10 minutes if repeatedly failing
            }
            return 2 * 60 * 1000; // 2 minutes normally
        };

        // After the initial session start, update the timestamp periodically
        const scheduleUpdate = () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            intervalId = setInterval(updateLastSeen, getUpdateInterval());
        };

        scheduleUpdate();

        // If the user is active, reset the timer to avoid unnecessary calls
        const resetActivityTimer = () => {
            scheduleUpdate();
        };

        // Add event listeners to detect user activity
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            document.addEventListener(event, resetActivityTimer, { passive: true });
        });

        // Handle online/offline events
        const handleOnline = () => {
            console.log('UserActivityTracker: Back online, resuming user activity tracking');
            retryCount = 0; // Reset retry count when back online
            scheduleUpdate();
        };

        const handleOffline = () => {
            console.log('UserActivityTracker: Gone offline, pausing user activity tracking');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup on component unmount
        return () => {
            isActive = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
            activityEvents.forEach(event => {
                document.removeEventListener(event, resetActivityTimer);
            });
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return null; // This component doesn't render anything
}