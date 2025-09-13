import React, { useEffect, useState } from 'react';
import { BackupLog, User } from '@/api/entities';

export default function AutoBackupManager() {
    const [lastBackupCheck, setLastBackupCheck] = useState(null);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [hasNetworkError, setHasNetworkError] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        
        const initializeUser = async () => {
            try {
                const user = await User.me();
                if (mounted) {
                    setCurrentUser(user);
                    setHasNetworkError(false);
                    setRetryCount(0);
                    
                    // Only start backup checking for admin users with very low frequency
                    if (user?.user_type === 'admin') {
                        startBackupMonitoring();
                    }
                }
            } catch (error) {
                if (mounted) {
                    console.warn('Could not get user for backup manager:', error);
                    setHasNetworkError(true);
                }
            }
        };

        const startBackupMonitoring = () => {
            // Initial delay, then check every hour
            const initialDelay = 60000; // 1 minute
            setTimeout(() => {
                if (mounted && !hasNetworkError) {
                    checkBackupStatus();
                }
            }, initialDelay);
            
            const interval = setInterval(() => {
                if (mounted && !isRateLimited && !hasNetworkError) {
                    checkBackupStatus();
                }
            }, 60 * 60 * 1000); // Every hour

            return () => clearInterval(interval);
        };

        const checkBackupStatus = async () => {
            // Skip if we have network issues or are rate limited
            if (hasNetworkError || isRateLimited) {
                const timeSinceLastCheck = Date.now() - (lastBackupCheck || 0);
                // Wait longer if we have network errors (30 minutes)
                const waitTime = hasNetworkError ? 30 * 60 * 1000 : 10 * 60 * 1000;
                
                if (timeSinceLastCheck < waitTime) {
                    return;
                }
                
                // Reset flags after wait time
                setIsRateLimited(false);
                setHasNetworkError(false);
                setRetryCount(0);
            }

            // Exponential backoff for retries
            if (retryCount > 0) {
                const backoffDelay = Math.min(5000 * Math.pow(2, retryCount - 1), 300000); // Max 5 minutes
                if (Date.now() - (lastBackupCheck || 0) < backoffDelay) {
                    return;
                }
            }

            try {
                // Try to get backup logs with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                const recentBackups = await BackupLog.list('-backup_date', 1);
                clearTimeout(timeoutId);
                
                if (mounted) {
                    setLastBackupCheck(Date.now());
                    setHasNetworkError(false);
                    setIsRateLimited(false);
                    setRetryCount(0);
                    
                    if (Array.isArray(recentBackups) && recentBackups.length > 0) {
                        const lastBackup = recentBackups[0];
                        const backupDate = new Date(lastBackup.backup_date);
                        const daysSinceBackup = (Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24);
                        
                        // Only show notification if more than 14 days since last backup
                        if (daysSinceBackup > 14) {
                            console.info(`Last backup was ${Math.floor(daysSinceBackup)} days ago. Consider creating a backup.`);
                        }
                    }
                }
            } catch (error) {
                if (mounted) {
                    const errorMessage = error.message || '';
                    
                    if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
                        console.warn('Backup check rate limited');
                        setIsRateLimited(true);
                        setLastBackupCheck(Date.now());
                    } else if (errorMessage.includes('Network Error') || errorMessage.includes('Failed to fetch') || error.name === 'AbortError') {
                        console.warn('Network error in backup check, will retry later');
                        setHasNetworkError(true);
                        setRetryCount(prev => prev + 1);
                        setLastBackupCheck(Date.now());
                    } else {
                        console.warn('Unknown error in backup check:', errorMessage);
                        setHasNetworkError(true);
                        setRetryCount(prev => prev + 1);
                        setLastBackupCheck(Date.now());
                    }
                }
            }
        };

        // Add longer delay before initializing to reduce immediate server load
        setTimeout(() => {
            if (mounted) {
                initializeUser();
            }
        }, 15000); // 15-second delay before initialization

        return () => {
            mounted = false;
        };
    }, [isRateLimited, hasNetworkError, lastBackupCheck, retryCount]);

    // This component doesn't render anything visible
    return null;
}