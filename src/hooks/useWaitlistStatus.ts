import { useState, useEffect } from 'react';

const WAITLIST_STORAGE_KEY = 'waitlist_registrations';

export interface WaitlistRegistration {
    productSku: string;
    productTitle: string;
    email: string;
    timestamp: string;
}

export const useWaitlistStatus = () => {
    const [registrations, setRegistrations] = useState<WaitlistRegistration[]>([]);

    // Load registrations from localStorage
    const loadRegistrations = () => {
        try {
            const stored = localStorage.getItem(WAITLIST_STORAGE_KEY);
            if (stored) {
                setRegistrations(JSON.parse(stored));
            } else {
                setRegistrations([]);
            }
        } catch (error) {
            console.error('Error loading waitlist registrations:', error);
            setRegistrations([]);
        }
    };

    // Load registrations from localStorage on mount and listen for changes
    useEffect(() => {
        loadRegistrations();

        // Listen for storage changes from other tabs/windows
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === WAITLIST_STORAGE_KEY) {
                loadRegistrations();
            }
        };

        // Custom event for same-tab updates
        const handleCustomStorageChange = () => {
            loadRegistrations();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('waitlistUpdated', handleCustomStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('waitlistUpdated', handleCustomStorageChange);
        };
    }, []);

    // Check if user is already registered for a specific product
    const isRegisteredForProduct = (productSku: string): boolean => {
        return registrations.some(reg => reg.productSku === productSku);
    };

    // Check if user is registered for any waitlist
    const hasAnyRegistration = (): boolean => {
        return registrations.length > 0;
    };

    // Add a new waitlist registration
    const addRegistration = (registration: Omit<WaitlistRegistration, 'timestamp'>) => {
        const newRegistration: WaitlistRegistration = {
            ...registration,
            timestamp: new Date().toISOString(),
        };

        const updatedRegistrations = [...registrations, newRegistration];

        try {
            localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(updatedRegistrations));
            setRegistrations(updatedRegistrations);

            // Dispatch custom event to notify other components in the same tab
            window.dispatchEvent(new CustomEvent('waitlistUpdated'));
        } catch (error) {
            console.error('Error saving waitlist registration:', error);
        }
    };

    // Remove a waitlist registration (if needed)
    const removeRegistration = (productSku: string) => {
        const updatedRegistrations = registrations.filter(reg => reg.productSku !== productSku);

        try {
            localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(updatedRegistrations));
            setRegistrations(updatedRegistrations);

            // Dispatch custom event to notify other components in the same tab
            window.dispatchEvent(new CustomEvent('waitlistUpdated'));
        } catch (error) {
            console.error('Error removing waitlist registration:', error);
        }
    };

    // Clear all registrations (if needed for testing)
    const clearAllRegistrations = () => {
        try {
            localStorage.removeItem(WAITLIST_STORAGE_KEY);
            setRegistrations([]);
        } catch (error) {
            console.error('Error clearing waitlist registrations:', error);
        }
    };

    return {
        registrations,
        isRegisteredForProduct,
        hasAnyRegistration,
        addRegistration,
        removeRegistration,
        clearAllRegistrations,
    };
};