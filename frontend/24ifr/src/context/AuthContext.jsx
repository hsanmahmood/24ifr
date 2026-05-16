import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const SKIP_AUTH = true; // TEMP: Skip Discord auth requirement

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        user: null,
        loading: true
    });

    const checkAuth = async () => {
        try {
            const data = await api.checkAuthStatus();
            setAuthState({
                user: data.authenticated ? data.user : (SKIP_AUTH ? { id: null, discord_id: null, username: 'Guest', avatar: null } : null),
                loading: false
            });
        } catch {
            setAuthState({ user: SKIP_AUTH ? { id: null, discord_id: null, username: 'Guest', avatar: null } : null, loading: false });
        }
    };

    const logout = async () => {
        await api.logout();
        setAuthState({ user: null, loading: false });
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ 
            user: authState.user, 
            isAuthenticated: !!authState.user,
            loading: authState.loading, 
            logout, 
            refreshAuth: checkAuth 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
