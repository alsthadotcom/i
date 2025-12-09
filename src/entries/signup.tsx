import React from 'react';
import ReactDOM from 'react-dom/client';
import { SignUp } from '../../components/SignUp';
import '../../index.css';

const SignUpPage = () => {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 bg-dot-grid selection:bg-green-500/30 flex flex-col">
            <SignUp
                onBack={() => window.location.href = '/index.html'}
                onLogin={() => window.location.href = '/pages/login.html'}
            />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SignUpPage />
    </React.StrictMode>
);
