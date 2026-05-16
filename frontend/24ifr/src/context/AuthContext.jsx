import React, { createContext, useState, useEffect, useContext } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const data = await api.checkAuthStatus();
                if (data.authenticated) {
                    setUser(data.user);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Failed to check auth status:", error);
            } finally {
                setLoading(false);
            }
        };
        checkStatus();
    }, []);

    const login = () => {
        api.loginWithDiscord();
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
