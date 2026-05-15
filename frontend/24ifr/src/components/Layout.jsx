import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';

const Layout = () => {
    return (
        <div className="bg-background-dark text-zinc-300 font-body min-h-screen flex overflow-hidden selection:bg-primary selection:text-black">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen min-h-0 overflow-hidden bg-background-dark">
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
};

export default Layout;
