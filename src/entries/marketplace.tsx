import React from 'react';
import ReactDOM from 'react-dom/client';
import { NavBar } from '../../components/NavBar';
import { Marketplace } from '../../components/Marketplace';
import { useAuthUser } from '../hooks/useAuthUser';
import '../../index.css';

const MarketplacePage = () => {
    const { user, handleLogout } = useAuthUser();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 bg-dot-grid selection:bg-green-500/30">
            <NavBar user={user} onLogout={handleLogout} currentPage="marketplace" />
            <Marketplace user={user} />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MarketplacePage />
    </React.StrictMode>
);
