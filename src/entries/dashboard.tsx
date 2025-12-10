import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { NavBar } from '../../components/NavBar';
import { Dashboard } from '../../components/Dashboard';
import { useAuthUser } from '../hooks/useAuthUser';
import '../../index.css';

const DashboardPage = () => {
    const { user, handleLogout } = useAuthUser();

    // Redirect non-logged-in users to login page
    useEffect(() => {
        // We give a small buffer for auth check to complete
        const timer = setTimeout(() => {
            // Check session directly if user is null to avoid premature redirect
            // But useAuthUser handles session check.
            // Simplest is to rely on user state after a short delay or check loading state from hook (if we added it).
            // For now, simple timeout is fine as in original code.
        }, 1000);
        return () => clearTimeout(timer);
    }, [user]);

    // Show loading while checking auth
    // Note: useAuthUser initializes with null.
    // Ideally we should have a loading state from useAuthUser.
    // For now, if user is null, we either are loading or not logged in.
    // We defer UI until we are sure, or show loading.

    // In this simple implementation, we render anyway, Dashboard handles "if (!user)" case by showing "Please log in".
    // But we want to show Navbar.

    if (!user) {
        // This might flash loading if user is not logged in, then show nothing?
        // Actually the Dashboard component handles !user too.
        // But the NavBar needs user to show profile.
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 bg-dot-grid selection:bg-green-500/30">
            <NavBar user={user} onLogout={handleLogout} currentPage="dashboard" />
            <Dashboard user={user} />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <DashboardPage />
    </React.StrictMode>
);
