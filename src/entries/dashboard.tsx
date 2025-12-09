import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { NavBar } from '../../components/NavBar';
import { Dashboard, Creation } from '../../components/Dashboard';
import { useAuthUser } from '../hooks/useAuthUser';
import '../../index.css';

const DashboardPage = () => {
    const { user, handleLogout } = useAuthUser();
    const [history, setHistory] = useState<Creation[]>([]);

    // Redirect non-logged-in users to login page
    useEffect(() => {
        if (user === null) {
            const timer = setTimeout(() => {
                if (!user) {
                    window.location.href = '/pages/login.html';
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Load user's listings from localStorage (temporary solution)
    useEffect(() => {
        if (user) {
            const savedListings = localStorage.getItem(`listings_${user.id}`);
            if (savedListings) {
                const parsed = JSON.parse(savedListings);
                // Convert timestamp strings back to Date objects
                const listings = parsed.map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
                setHistory(listings);
            }
        }
    }, [user]);

    const handleSelectListing = (item: Creation) => {
        // Navigate to the listing details or edit page
        // For now, we'll just show an alert
        alert(`Viewing listing: ${item.name}`);
        // TODO: Navigate to edit/view page
        // window.location.href = `/pages/listing-edit.html?id=${item.id}`;
    };

    // Show loading while checking auth
    if (!user) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 bg-dot-grid selection:bg-green-500/30">
            <NavBar user={user} onLogout={handleLogout} currentPage="dashboard" />
            <Dashboard history={history} onSelect={handleSelectListing} />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <DashboardPage />
    </React.StrictMode>
);
