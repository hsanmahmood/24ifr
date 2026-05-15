import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const PopupContext = createContext();

export const PopupProvider = ({ children }) => {
    const { user } = useAuth();
    const [popups, setPopups] = useState({
        legal: false,
        changelog: false,
        credits: false,
        support: false
    });

    useEffect(() => {
        if (user) {
            const legalDismissed = localStorage.getItem('atc24_legal_dismissed') === 'true';
            const changelogDismissed = localStorage.getItem('atc24_changelog_dismissed') === 'true';
            
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPopups(prev => ({
                ...prev,
                legal: !legalDismissed,
                changelog: !changelogDismissed
            }));
        }
    }, [user]);

    const openPopup = (name) => setPopups(prev => ({ ...prev, [name]: true }));
    
    const closePopup = (name) => {
        setPopups(prev => ({ ...prev, [name]: false }));
        if (name === 'legal') localStorage.setItem('atc24_legal_dismissed', 'true');
        if (name === 'changelog') localStorage.setItem('atc24_changelog_dismissed', 'true');
    };

    return (
        <PopupContext.Provider value={{ popups, openPopup, closePopup }}>
            {children}
        </PopupContext.Provider>
    );
};

export const usePopups = () => useContext(PopupContext);
