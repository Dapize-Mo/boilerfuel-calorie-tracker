import { createContext, useContext, useState, useEffect } from 'react';
import { readCookie, writeCookie } from './cookies';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
    const [dashboardDesign, setDashboardDesign] = useState('Glass');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // 1. Try to read from cookie
        const savedDesign = readCookie('boilerfuel_dashboard_pref_v1');

        if (savedDesign) {
            setDashboardDesign(savedDesign);
        } else {
            // 2. Auto-detect device if no cookie
            const isMobile = window.innerWidth < 768; // Standard mobile breakpoint
            const detectedDesign = isMobile ? 'Stream' : 'Glass';
            setDashboardDesign(detectedDesign);
            // Optional: Don't write cookie yet, let them choose? 
            // Or write it as a default? Let's write it to persist the auto-detection.
            writeCookie('boilerfuel_dashboard_pref_v1', detectedDesign);
        }
        setIsInitialized(true);
    }, []);

    const updateDashboardDesign = (design) => {
        setDashboardDesign(design);
        writeCookie('boilerfuel_dashboard_pref_v1', design);
    };

    return (
        <DashboardContext.Provider value={{ dashboardDesign, setDashboardDesign: updateDashboardDesign, isInitialized }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    return useContext(DashboardContext);
}
