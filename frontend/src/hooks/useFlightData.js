import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export const useFlightData = () => {
    const [flightPlans, setFlightPlans] = useState([]);
    const [controllers, setControllers] = useState([]);
    const [atis, setAtis] = useState([]);
    const [selectedFlightPlan, setSelectedFlightPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [plans, ctrls, atisData] = await Promise.all([
                api.loadFlightPlans(),
                api.loadControllers(),
                api.loadAtis(),
            ]);
            setFlightPlans(plans);
            setControllers(ctrls);
            setAtis(atisData);
            if (plans.length > 0) {
                setSelectedFlightPlan(plans[0]);
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const selectFlightPlan = (plan) => {
        setSelectedFlightPlan(plan);
    };

    return {
        flightPlans,
        controllers,
        atis,
        selectedFlightPlan,
        loading,
        error,
        selectFlightPlan,
        refreshData: fetchData,
    };
};
