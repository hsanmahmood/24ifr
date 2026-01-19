import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user } = useAuth();

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <aside
            id="sidebar"
            className={`bg-surface-dark border-r border-border-dark flex-shrink-0 flex flex-col justify-between transition-all duration-300 ease-in-out relative z-20 ${isCollapsed ? 'w-20' : 'w-72'}`}
        >
            <div>
                <div className={`h-20 flex items-center px-6 border-b border-border-dark ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} transition-all duration-300`}>
                        <img src="/logo.png" alt="24IFR" className="h-8 w-auto object-contain" />
                    </div>
                    {/* Show icon only when collapsed */}
                    <div className={`${isCollapsed ? 'block' : 'hidden'} transition-all duration-300`}>
                        <img src="/logo.png" alt="24IFR" className="h-8 w-auto object-contain" />
                    </div>

                    <button
                        onClick={toggleSidebar}
                        className={`text-zinc-500 hover:text-white transition-colors focus:outline-none ${isCollapsed ? 'absolute -right-3 top-8 bg-surface-dark border border-zinc-700 rounded-full p-1 shadow-md hover:bg-zinc-800' : ''}`}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {isCollapsed ? 'chevron_right' : 'menu_open'}
                        </span>
                    </button>
                </div>

                <nav className="p-4 space-y-2 mt-2">
                    <NavLink
                        className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg transition-all group relative overflow-hidden ${isActive ? "text-primary bg-primary/10" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}`}
                        to="/"
                        end
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>}
                                <span className="material-symbols-outlined text-2xl">home</span>
                                <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 translate-x-4' : 'opacity-100 w-auto translator-x-0'}`}>Main</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink
                        className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg transition-all group relative overflow-hidden ${isActive ? "text-primary bg-primary/10" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}`}
                        to="/config"
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>}
                                <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">settings_suggest</span>
                                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 translate-x-4' : 'opacity-100 w-auto translator-x-0'}`}>Adv. Config</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink
                        className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg transition-all group relative overflow-hidden ${isActive ? "text-primary bg-primary/10" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}`}
                        to="/leaderboard"
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>}
                                <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">leaderboard</span>
                                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 translate-x-4' : 'opacity-100 w-auto translator-x-0'}`}>Leaderboard</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink
                        className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg transition-all group relative overflow-hidden ${isActive ? "text-primary bg-primary/10" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}`}
                        to="/profile"
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>}
                                <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">account_circle</span>
                                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 translate-x-4' : 'opacity-100 w-auto translator-x-0'}`}>Profile</span>
                            </>
                        )}
                    </NavLink>
                </nav>
            </div>

            <div className="p-4 border-t border-border-dark">
                {user ? (
                    <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="relative flex-shrink-0">
                            <img alt="User Profile" className="w-10 h-10 rounded-full border border-zinc-800" src={user.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"} />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-dark"></div>
                        </div>
                        <div className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <span className="text-sm font-bold text-white leading-none mb-1">{user.username}</span>
                            <span className="text-[10px] text-zinc-500 font-medium">Controller</span>
                        </div>
                    </div>
                ) : (
                    <a
                        href="https://api.hasmah.xyz/auth/discord"
                        className={`w-full bg-primary hover:bg-primary-dim text-black font-bold uppercase tracking-widest py-3 px-4 rounded transition-all text-sm flex items-center justify-center gap-2 group whitespace-nowrap overflow-hidden ${isCollapsed ? 'px-0' : ''}`}
                        title="Login with Discord"
                    >
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-1.65-.6304-2.29-.6304-2.29-.6304a.077.077 0 01-.01-.0051 13.2515 13.2515 0 011.02-.5114.0776.0776 0 00.0263-.105c-.0017-.0023-.0017-.0023 0 0 3.6309 1.761 7.6432 1.761 11.2335 0 .028.0028.028.0028.0263.105a13.2515 13.2515 0 011.02.5114.077.077 0 01-.01.005s-2.922 1.2655-4.572 1.2655a.076.076 0 00-.0416.1057c.3658.699.7773 1.3638 1.226 1.9942a.0777.0777 0 00.0842.0276c1.9616-.6066 3.9401-1.5218 6.0029-3.0294a.077.077 0 00.0312-.0561c.5334-5.5947-.9623-10.1583-3.4116-13.6603a.0741.0741 0 00-.0321-.0277zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                        </svg>
                        <span className={`transition-all duration-300 ${isCollapsed ? 'hidden w-0' : 'block w-auto'}`}>Login with Discord</span>
                    </a>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
