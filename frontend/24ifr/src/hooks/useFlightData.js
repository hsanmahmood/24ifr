import { useState, useEffect, useCallback } from "react";
import { loadFlightPlans, loadControllers, loadAtis } from "../services/api";

export const useFlightData = () => {
    const [flightPlans, setFlightPlans] = useState([]);
    const [controllers, setControllers] = useState([]);
    const [atis, setAtis] = useState([]);
    const [selectedFlightPlan, setSelectedFlightPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [plans, ctrls, atisData] = await Promise.all([
                loadFlightPlans(),
                loadControllers(),
                loadAtis(),
            ]);
            setFlightPlans(plans);
            setControllers(ctrls);
            setAtis(atisData);
            setSelectedFlightPlan((prev) => {
                const stillExists = plans.find((p) => p.callsign === prev?.callsign);
                return stillExists || plans[0] || null;
            });
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 45000);
        return () => clearInterval(interval);
    }, [refresh]);

    return { flightPlans, controllers, atis, selectedFlightPlan, loading, error, selectFlightPlan: setSelectedFlightPlan, refreshData: refresh };
};
