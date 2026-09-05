import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import LoginScreen from "./LoginScreen";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return <div className="bg-background-dark min-h-screen flex items-center justify-center"><div className="page-loading-skeleton" /></div>;
    }

    if (!user) {
        return <LoginScreen />;
    }

    if (!isAdmin) {
        return (
            <div className="bg-background-dark text-zinc-300 min-h-screen flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-4xl font-bold text-white">403</p>
                    <p className="text-zinc-400">You do not have admin access.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-dark text-zinc-300 min-h-screen flex overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
