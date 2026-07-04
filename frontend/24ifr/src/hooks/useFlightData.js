import { useState, useEffect, useCallback, useRef } from "react";
import { loadFlightPlans, loadControllers, loadAtis } from "../services/api";

export const useFlightData = () => {
    const [flightPlans, setFlightPlans] = useState([]);
    const [controllers, setControllers] = useState([]);
    const [atis, setAtis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const selectedRef = useRef(null);
    const [selectedFlightPlan, setSelectedFlightPlan] = useState(null);

    const refresh = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const [plans, ctrls, atisData] = await Promise.all([
                loadFlightPlans(),
                loadControllers(),
                loadAtis(),
            ]);
            setFlightPlans(plans);
            setControllers(ctrls);
            setAtis(atisData);
            const current = selectedRef.current;
            const stillExists = current
                ? plans.find(p => p.callsign === current.callsign)
                : null;
            if (!current) {
                const next = plans[0] || null;
                selectedRef.current = next;
                setSelectedFlightPlan(next);
            } else if (stillExists) {
                selectedRef.current = stillExists;
                setSelectedFlightPlan(stillExists);
            }
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh(false);
        const interval = setInterval(() => refresh(true), 45000);
        return () => clearInterval(interval);
    }, [refresh]);

    const selectFlightPlan = useCallback((plan) => {
        selectedRef.current = plan;
        setSelectedFlightPlan(plan);
    }, []);

    return { flightPlans, controllers, atis, selectedFlightPlan, loading, error, selectFlightPlan, refreshData: () => refresh(false) };
};
