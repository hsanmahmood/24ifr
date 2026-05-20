import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export const useFlightData = () => {
    const [data, setData] = useState({
        plans: [],
        controllers: [],
        atis: [],
        selected: null,
        loading: true,
        error: null
    });

    const refresh = useCallback(async () => {
        try {
            const [p, c, a] = await Promise.all([
                api.loadFlightPlans(),
                api.loadControllers(),
                api.loadAtis()
            ]);

            setData(prev => {
                const stillExists = p.find(plan => plan.callsign === prev.selected?.callsign);
                return {
                    plans: p,
                    controllers: c,
                    atis: a,
                    selected: stillExists || p[0] || null,
                    loading: false,
                    error: null
                };
            });
        } catch (err) {
            setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 45000);
        return () => clearInterval(interval);
    }, [refresh]);

    const selectPlan = (plan) => setData(prev => ({ ...prev, selected: plan }));

    return {
        flightPlans: data.plans,
        controllers: data.controllers,
        atis: data.atis,
        selectedFlightPlan: data.selected,
        loading: data.loading,
        error: data.error,
        selectFlightPlan: selectPlan,
        refreshData: refresh
    };
};
