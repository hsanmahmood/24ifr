import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="bg-background-dark text-zinc-300 font-body min-h-screen flex overflow-hidden selection:bg-primary selection:text-black">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background-dark">
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
