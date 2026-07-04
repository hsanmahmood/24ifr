
let _apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
if (import.meta.env.DEV && !_apiBaseUrl) {
    _apiBaseUrl = '';
}
const API_BASE_URL = String(_apiBaseUrl).replace(/\/$/, '');
const USER_SETTINGS_KEY = 'atc24_user_settings';

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data.data !== undefined ? data.data : data;
};

const fetchWithAuth = (url, options = {}) => {
    return fetch(url, { ...options, credentials: 'include' });
};

export const loadFlightPlans = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/flight-plans`);
    return handleResponse(response);
};

export const loadControllers = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/controllers`);
    return handleResponse(response);
};

export const loadAtis = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/atis`);
    return handleResponse(response);
};


export const loadLeaderboard = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/leaderboard/details`);
    return handleResponse(response);
};

export const loadUserClearances = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/user/clearances`);
    return handleResponse(response);
};

export const generateClearance = async (payload) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/clearance/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const trackClearanceGeneration = async (payload) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/clearance-generated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const checkAuthStatus = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/user`);
    return handleResponse(response);
};

export const loginWithDiscord = () => {
    const origin = window.location.origin;
    window.location.href = `${API_BASE_URL}/auth/discord?origin=${encodeURIComponent(origin)}`;
};

export const logout = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
    return handleResponse(response);
};

export const loadUserSettings = () => {
    const saved = localStorage.getItem(USER_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : null;
};

export const updateUserSettings = (partial) => {
    const current = loadUserSettings() || {};
    const next = { ...current, ...partial };
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(next));
    return next;
};

export const loadPublicDocuments = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/public/documents`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.documents || [];
    } catch (e) {
        console.warn('Failed to load public documents', e);
        return [];
    }
};

export const getActiveFeedbackPrompt = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/feedback/active`);
    return handleResponse(response);
};

export const submitFeedback = async (payload) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

