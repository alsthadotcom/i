import React from 'react';
import ReactDOM from 'react-dom/client';
import { Login } from '../../components/Login';
import '../../index.css';

const LoginPage = () => {
    // Login page usually doesn't have the main NavBar or handles it internally?
    // App.tsx rendered Login without NavBar (or NavBar was conditional).
    // NavBar logic: showNavLinks is false for login/signup usually?
    // Let's include NavBar for consistency but maybe simpler.
    // Actually Login component usually covers full screen.

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 bg-dot-grid selection:bg-green-500/30 flex flex-col">
            <Login
                onBack={() => window.location.href = '/index.html'}
                onRegister={() => window.location.href = '/pages/signup.html'}
            />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <LoginPage />
    </React.StrictMode>
);
