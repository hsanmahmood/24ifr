import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const LoginScreen = () => {
    return (
        <div className="bg-background-dark text-zinc-300 font-body min-h-screen flex items-center justify-center selection:bg-primary selection:text-black">
            <div className="max-w-md w-full mx-4 space-y-8 text-center">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
                    <p className="text-zinc-400 text-lg">Manage documents and analytics</p>
                </div>
                
                <button
                    onClick={() => api.loginWithDiscord()}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3671c-1.8345-.9145-3.7669-1.555-5.8247-1.6258-.0736.1292-.1477.2965-.202.4575 1.9645.4531 2.163.4531 2.163.4531 2.5289-.2097 4.1514.1571 4.7988 1.0059.6474.8488.9588 2.076.9588 3.6922 0 .3545-.0049.8555-.0361 1.3649-1.0447-.1571-2.3618-.24-3.9544-.24-.8555 0-1.6258.0361-2.3123.1076-.6865.0715-1.2935.1645-1.8345.2914-.2476.0479-.5234.1076-.8184.1792-.4531.1292-.9588.2573-1.465.3854-.1292.0361-.2573.0703-.3854.1046-.4167.1158-.8184.2318-1.2048.3607-.3854.1289-.7514.2714-1.098.4276-.3465.1562-.6577.3364-1.0059.5495-.3482.2131-.6484.4642-.9588.7149-.3104.2507-.5678.5434-.8184.8555-.2507.3121-.4694.6577-.6577 1.0276-.1883.3699-.3313.7514-.4167 1.1478-.0854.3964-.1158.8184-.1158 1.2659 0 .8555.1571 1.6258.5495 2.3123s.9266 1.2659 1.7113 1.6937 1.6258.8018 2.6316.9109 2.0636.0854 3.1198.0854c1.0562 0 2.0636-.0283 3.1198-.0854s1.8345-.4832 2.6316-.9109 1.3294-.9266 1.7113-1.6937.5495-1.4568.5495-2.3123 0-1.2659-.0854-2.1316-.3313-1.6258-.9588-2.3989-1.4568-1.4568-2.4748-1.8345z"/>
                    </svg>
                    Login with Discord
                </button>

                <div className="pt-8 border-t border-zinc-800">
                    <p className="text-zinc-500 text-sm">You need admin privileges to access this panel.</p>
                </div>
            </div>
        </div>
    );
};

const Layout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="bg-background-dark text-zinc-300 font-body min-h-screen flex items-center justify-center selection:bg-primary selection:text-black">
                <div className="page-loading-skeleton"></div>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen />;
    }

    return (
        <div className="bg-background-dark text-zinc-300 font-body min-h-screen flex overflow-hidden selection:bg-primary selection:text-black">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen min-h-0 overflow-hidden bg-background-dark">
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
