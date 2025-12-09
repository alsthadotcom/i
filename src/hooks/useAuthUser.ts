import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase';
import { ensureUserInfoExists } from '../../services/database';

export function useAuthUser() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                ensureUserInfoExists(session.user);
            } else {
                setUser(null);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                ensureUserInfoExists(session.user);
            } else {
                setUser(null);
            }
            if (_event === 'SIGNED_OUT') {
                window.location.reload();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        window.location.href = '/index.html';
    };

    return { user, handleLogout };
}
