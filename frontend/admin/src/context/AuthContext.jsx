import { createContext, useContext, useState, useEffect } from "react";
import { checkAuthStatus, logout as apiLogout } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [csrfToken, setCsrfToken] = useState(null);

    useEffect(() => {
        checkAuthStatus()
            .then((data) => {
                setUser(data.authenticated ? data.user : null);
                setCsrfToken(data.csrf_token || null);
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const logout = async () => {
        await apiLogout(csrfToken).catch(() => {});
        setUser(null);
        setCsrfToken(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            isAdmin: !!user?.is_admin,
            csrfToken,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
