import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.hasanmahmood.org';

const Icon = ({ name, className = '' }) => {
    const base = String(className || '')
    switch (name) {
        case 'dashboard':
            return (
                <svg className={`${base}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zM13 3v6h8V3h-8zm0 8v10h8V11h-8z" />
                </svg>
            )
        case 'menu':
            return (
                <svg className={`${base}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                </svg>
            )
        case 'close':
            return (
                <svg className={`${base}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.29 9.18 12 2.88 5.71 4.29 4.29 10.59 10.59 16.88 4.29z" />
                </svg>
            )
        case 'chevron_right':
            return (
                <svg className={`${base}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M10 6l6 6-6 6V6z" />
                </svg>
            )
        case 'menu_open':
            return (
                <svg className={`${base}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z" />
                </svg>
            )
        default:
            return <span className={base}>{name}</span>
    }
}

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleLogout = async () => {
        await logout();
        setIsMobileMenuOpen(false);
        navigate('/');
    };

    const navItems = [
        { to: '/', icon: 'home', label: 'Document editor', end: true },
        { to: '/analytics', icon: 'leaderboard', label: 'Analytics' },
    ];

    const NavItems = () => (
        <>
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    className={({ isActive }) => [
                        'group relative flex items-center rounded-[6px] py-2.5 text-sm font-medium transition-[150ms] ease-out',
                        isCollapsed ? 'justify-center gap-0 px-2' : 'gap-3 px-3',
                        isActive
                            ? 'bg-[rgba(245,197,24,0.08)] text-[#ffffff] ring-1 ring-[rgba(245,197,24,0.18)]'
                            : 'text-[#888888] hover:bg-[#111111] hover:text-[#ffffff]',
                    ].join(' ')}
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    {({ isActive }) => (
                        <>
                            <Icon name={item.icon} className={`text-[20px] transition-colors ${isActive ? 'text-[#f5c518]' : 'text-inherit group-hover:text-[#f5c518]'}`} />
                            <span className={`whitespace-nowrap transition-all duration-150 ${isCollapsed ? 'lg:w-0 lg:translate-x-2 lg:opacity-0' : 'opacity-100'}`}>
                                {item.label}
                            </span>
                        </>
                    )}
                </NavLink>
            ))}
        </>
    );

    return (
        <>
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[#1a1a1a] bg-[#0f0f0f] px-4">
                <img src="/logo.png" alt="24IFR" className="h-8 w-auto object-contain" />
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-zinc-400 hover:text-white transition-colors"
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    <Icon name={isMobileMenuOpen ? 'close' : 'menu'} className="text-3xl" />
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-background-dark/95 backdrop-blur-sm animate-fadeIn flex flex-col pt-20 px-6">
                    <nav className="space-y-4">
                        <NavItems />
                    </nav>
                    <div className="mt-auto pb-10">
                        {authLoading ? (
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="skeleton w-8 h-8 rounded-full"></div>
                                    <div className="flex flex-col gap-2">
                                        <div className="skeleton h-4 w-28 rounded"></div>
                                        <div className="skeleton h-3 w-20 rounded"></div>
                                    </div>
                                </div>
                                <div className="skeleton h-12 w-full rounded-[6px]"></div>
                            </div>
                        ) : user ? (
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <img alt="User Profile" className="w-12 h-12 rounded-full border border-zinc-800" src={user.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"} />
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-white">{user.username}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#f5c518] py-4 text-sm font-semibold text-black transition-[150ms] ease-out hover:brightness-95"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                                    </svg>
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : (
                            <a
                                href={`${API_BASE_URL}/auth/discord`}
                                className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#f5c518] py-4 text-sm font-semibold text-black transition-[150ms] ease-out hover:brightness-95"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-1.65-.6304-2.29-.6304-2.29-.6304a.077.077 0 01-.01-.0051 13.2515 13.2515 0 011.02-.5114.0776.0776 0 00.0263-.105c-.0017-.0023-.0017-.0023 0 0 3.6309 1.761 7.6432 1.761 11.2335 0 .028.0028.028.0028.0263.105a13.2515 13.2515 0 011.02.5114.077.077 0 01-.01.005s-2.922 1.2655-4.572 1.2655a.076.076 0 00-.0416.1057c.3658.699.7773 1.3638 1.226 1.9942a.0777.0777 0 00.0842.0276c1.9616-.6066 3.9401-1.5218 6.0029-3.0294a.077.077 0 00.0312-.0561c.5334-5.5947-.9623-10.1583-3.4116-13.6603a.0741.0741 0 00-.0321-.0277zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                                </svg>
                                <span>Login with Discord</span>
                            </a>
                        )}
                    </div>
                </div>
            )}

            <aside
                id="sidebar"
                className={`relative z-20 hidden flex-shrink-0 flex-col justify-between border-r border-[#1a1a1a] bg-[#0f0f0f] transition-[150ms] ease-out lg:flex ${isCollapsed ? 'w-14' : 'w-60'}`}
            >
                <div>
                    <div className={`flex h-16 items-center border-b border-[#1a1a1a] px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-150 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <img src="/logo.png" alt="24IFR" className="h-8 w-auto object-contain" />
                        </div>
                        <div className={`${isCollapsed ? 'block' : 'hidden'}`}>
                            <img src="/logo.png" alt="24IFR" className="h-8 w-auto object-contain" />
                        </div>

                        <button
                            onClick={toggleSidebar}
                            className={`focus:outline-none transition-colors hover:text-white ${isCollapsed ? 'absolute -right-3 top-7 rounded-full border border-[#222222] bg-[#0f0f0f] p-1 text-[#888888]' : 'absolute right-3 text-[#888888]'}`}
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <Icon name={isCollapsed ? 'chevron_right' : 'menu_open'} className="text-xl" />
                        </button>
                    </div>

                    <nav className="mt-2 space-y-1.5 p-3">
                        <NavItems />
                    </nav>
                </div>

                <div className="flex flex-col gap-3 border-t border-[#1a1a1a] p-3">
                    {authLoading ? (
                        <>
                            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                                <div className="skeleton h-8 w-8 rounded-full"></div>
                                <div className={`flex flex-col gap-2 overflow-hidden whitespace-nowrap transition-all duration-150 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                    <div className="skeleton h-4 w-24 rounded"></div>
                                    <div className="skeleton h-3 w-16 rounded"></div>
                                </div>
                            </div>
                            <div className={`skeleton w-full rounded-[6px] py-3 ${isCollapsed ? 'px-0' : 'px-4'}`}></div>
                        </>
                    ) : user ? (
                        <>
                            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                                <div className="relative flex-shrink-0">
                                    <img alt="User Profile" className="h-9 w-9 rounded-full border border-[#222222]" src={user.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"} />
                                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0f0f0f] bg-[#22c55e]"></div>
                                </div>
                                <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-150 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                    <span className="text-sm font-medium leading-none text-white">{user.username}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className={`flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#f5c518] px-4 py-3 text-sm font-semibold text-black transition-[150ms] ease-out hover:brightness-95 ${isCollapsed ? 'px-0' : ''}`}
                                title="Logout"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                                </svg>
                                <span className={`transition-all duration-150 ${isCollapsed ? 'hidden w-0' : 'block w-auto'}`}>Logout</span>
                            </button>
                        </>
                    ) : (
                            <a
                                href={`${API_BASE_URL}/auth/discord`}
                            className={`flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#f5c518] px-4 py-3 text-sm font-semibold text-black transition-[150ms] ease-out hover:brightness-95 ${isCollapsed ? 'px-0' : ''}`}
                            title="Login with Discord"
                        >
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-1.65-.6304-2.29-.6304-2.29-.6304a.077.077 0 01-.01-.0051 13.2515 13.2515 0 011.02-.5114.0776.0776 0 00.0263-.105c-.0017-.0023-.0017-.0023 0 0 3.6309 1.761 7.6432 1.761 11.2335 0 .028.0028.028.0028.0263.105a13.2515 13.2515 0 011.02.5114.077.077 0 01-.01.005s-2.922 1.2655-4.572 1.2655a.076.076 0 00-.0416.1057c.3658.699.7773 1.3638 1.226 1.9942a.0777.0777 0 00.0842.0276c1.9616-.6066 3.9401-1.5218 6.0029-3.0294a.077.077 0 00.0312-.0561c.5334-5.5947-.9623-10.1583-3.4116-13.6603a.0741.0741 0 00-.0321-.0277zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                            </svg>
                            <span className={`transition-all duration-150 ${isCollapsed ? 'hidden w-0' : 'block w-auto'}`}>Login with Discord</span>
                        </a>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
