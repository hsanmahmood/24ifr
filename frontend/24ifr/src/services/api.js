const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const SETTINGS_KEY = "atc24_user_settings";

const request = async (url, options = {}) => {
    const response = await fetch(url, { ...options, credentials: "include" });
    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${body}`);
    }
    return response.json();
};

export const loadFlightPlans = () => request(`${API_BASE}/api/flight-plans`);
export const loadControllers = () => request(`${API_BASE}/api/controllers`);
export const loadAtis = () => request(`${API_BASE}/api/atis`);
export const loadLeaderboard = () => request(`${API_BASE}/api/leaderboard/details`);
export const loadUserClearances = () => request(`${API_BASE}/api/user/clearances`);
export const checkAuthStatus = () => request(`${API_BASE}/api/auth/user`);

export const trackClearanceGeneration = (payload) =>
    request(`${API_BASE}/api/clearance-generated`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

export const logout = () => request(`${API_BASE}/api/auth/logout`, { method: "POST" });

export const loadPublicDocuments = async () => {
    try {
        const data = await request(`${API_BASE}/api/public/documents`);
        return data.documents || [];
    } catch {
        return [];
    }
};

export const loginWithDiscord = () => {
    window.location.href = `${API_BASE}/auth/discord?origin=${encodeURIComponent(window.location.origin)}`;
};

export const loadUserSettings = () => {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

export const updateUserSettings = (partial) => {
    const current = loadUserSettings() || {};
    const next = { ...current, ...partial };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    return next;
};
