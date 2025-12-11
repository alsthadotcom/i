
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { supabase } from '../services/supabase';

interface LoginProps {
    onBack?: () => void;
    onRegister?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBack, onRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for session on mount to handle Google Sign In return
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Check if user has a profile (account exists in our system)
                const { data: info } = await supabase
                    .from('user_info')
                    .select('user_id')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (info) {
                    // Account exists -> Dashboard
                    window.location.href = '/pages/dashboard.html';
                } else {
                    // Account does NOT exist (User authenticated with Google but hasn't signed up properly)
                    setError("Account doesn't exist. Redirecting to Sign Up...");

                    // Redirect to Sign Up (Retaining session allows SignUp page to auto-fill)
                    setTimeout(() => {
                        if (onRegister) onRegister();
                        else window.location.href = '/pages/signup.html';
                    }, 2000);
                }
            }
        };
        checkUser();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Check if user_info exists even for password login (consistency)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: info } = await supabase.from('user_info').select('user_id').eq('user_id', user.id).maybeSingle();
                if (!info) {
                    // This shouldn't happen for password login usually, unless data corrupted
                    throw new Error("Account data missing.");
                }
            }

            // Login successful - navigate back to home or dashboard
            window.location.href = '/pages/dashboard.html';

        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Return to Login page to check for user_info existence
                    redirectTo: window.location.href
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-500">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-zinc-500 hover:text-white transition-colors"
                        title="Go back"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                )}

                <div className="flex flex-col items-center mb-6 sm:mb-8 mt-2">
                    <span className="text-3xl sm:text-4xl text-white font-handwritten font-bold mb-2">ida.</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Welcome back</h2>
                    <p className="text-zinc-500 text-sm">Sign in to manage your assets</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-200 transition-colors mb-6"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </button>

                {/* Separator */}
                <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <span className="relative bg-[#101012] px-2 text-xs text-zinc-500 uppercase font-mono">or</span>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors placeholder:text-zinc-700"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors placeholder:text-zinc-700"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-zinc-500">
                    Don't have an account? <button onClick={onRegister} className="text-green-400 hover:underline">Sign Up</button>
                </p>
            </div>
        </div>
    );
};
