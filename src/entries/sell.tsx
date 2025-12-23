import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { NavBar } from '../../components/NavBar';
import { SellIdea } from '../../components/SellIdea';
import { useAuthUser } from '../hooks/useAuthUser';
import { handleNavigation } from '../utils/navigation';
import '../../index.css';

const SellPage = () => {
    // Authenticated user if available, otherwise guest
    const { user, handleLogout } = useAuthUser();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 bg-dot-grid selection:bg-green-500/30">
            <NavBar user={user} onLogout={handleLogout} onNavigate={handleNavigation} currentPage="sell-idea" />
            <SellIdea onBack={() => window.location.href = '/pages/marketplace.html'} />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SellPage />
    </React.StrictMode>
);
