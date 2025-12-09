import React from 'react';
import ReactDOM from 'react-dom/client';
import { NavBar } from '../../components/NavBar';
import { DigitalSolutions } from '../../components/DigitalSolutions';
import { useAuthUser } from '../hooks/useAuthUser';
import '../../index.css';

const SolutionsPage = () => {
    const { user, handleLogout } = useAuthUser();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 bg-dot-grid selection:bg-green-500/30">
            <NavBar user={user} onLogout={handleLogout} currentPage="solutions" />
            <div className="pt-24">
                <DigitalSolutions />
            </div>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SolutionsPage />
    </React.StrictMode>
);
