import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { NavBar } from '../../components/NavBar';
import { SellIdea } from '../../components/SellIdea';
import { useAuthUser } from '../hooks/useAuthUser';
import '../../index.css';

const SellPage = () => {
    const { user, handleLogout } = useAuthUser();

    // Redirect non-logged-in users to login page
    useEffect(() => {
        if (user === null) {
            // Only redirect if we're sure there's no user (not during initial loading)
            const timer = setTimeout(() => {
                if (!user) {
                    window.location.href = '/pages/login.html';
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Show loading or nothing while checking auth
    if (!user) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 bg-dot-grid selection:bg-green-500/30">
            <NavBar user={user} onLogout={handleLogout} currentPage="sell-idea" />
            <SellIdea onBack={() => window.location.href = '/pages/marketplace.html'} />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SellPage />
    </React.StrictMode>
);
