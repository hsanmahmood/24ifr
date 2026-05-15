const API_BASE_URL = 'https://api.hasanmahmood.org';
const USER_SETTINGS_KEY = 'atc24_user_settings';

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    return response.json();
};

export const fetchWithCredentials = (url, options = {}) => {
    return fetch(url, { ...options, credentials: 'include' });
};

export const loadFlightPlans = async () => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/flight-plans`);
    return handleResponse(response);
};

export const loadControllers = async () => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/controllers`);
    return handleResponse(response);
};

export const loadAtis = async () => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/atis`);
    return handleResponse(response);
};

export const trackClearanceGeneration = async (clearanceData) => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/clearance-generated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clearanceData),
    });
    return handleResponse(response);
};

export const loadLeaderboard = async () => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/leaderboard/details`);
    return handleResponse(response);
};

export const loadUserClearances = async () => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/user/clearances`);
    return handleResponse(response);
};

export const checkAuthStatus = async () => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/auth/user`);
    return handleResponse(response);
};

export const loginWithDiscord = () => {
    const origin = window.location.origin;
    window.location.href = `${API_BASE_URL}/auth/discord?origin=${encodeURIComponent(origin)}`;
};

export const logout = async () => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
};

export const loadUserSettings = () => {
    const saved = localStorage.getItem(USER_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : null;
};

export const saveUserSettings = (settings) => {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
    return settings;
};

export const updateUserSettings = (partialSettings) => {
    const currentSettings = loadUserSettings() || {};
    const nextSettings = { ...currentSettings, ...partialSettings };
    saveUserSettings(nextSettings);
    return nextSettings;
};

export const loadAdminDocuments = async () => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/admin/documents`);
    return handleResponse(response);
};

export const saveAdminDocument = async (docKey, payload) => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/admin/documents/${docKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const loadAdminDailyClearances = async (days = 14) => {
    const response = await fetchWithCredentials(`${API_BASE_URL}/api/admin/clearances/daily?days=${days}`);
    return handleResponse(response);
};
