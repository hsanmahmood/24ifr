import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const Icon = ({ name, className = '' }) => {
    const base = `h-5 w-5 shrink-0 ${String(className || '')}`;

    switch (name) {
        case 'document':
            return (
                <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6 2h9l5 5v15H6V2zm8 1.5V8h4.5L14 3.5zM8 11h8v2H8v-2zm0 4h8v2H8v-2zm0-8h4v2H8V7z" />
                </svg>
            );
        case 'analytics':
            return (
                <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M4 19h16v2H2V3h2v16zm3-2h2V9H7v8zm4 0h2V5h-2v12zm4 0h2v-6h-2v6z" />
                </svg>
            );
        case 'campaign':
            return (
                <span className={`material-symbols-outlined ${base}`}>campaign</span>
            );
        case 'menu':
            return (
                <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                </svg>
            );
        case 'close':
            return (
                <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.29 9.18 12 2.88 5.71 4.29 4.29 10.59 10.59 16.88 4.29z" />
                </svg>
            );
        case 'chevron_right':
            return (
                <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M10 6l6 6-6 6V6z" />
                </svg>
            );
        case 'menu_open':
            return (
                <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z" />
                </svg>
            );
        case 'logout':
            return (
                <svg className={base} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                </svg>
            );
        case 'forum':
            return (
                <span className={`material-symbols-outlined ${base}`}>forum</span>
            );
        default:
            return <span className={base}>{name}</span>;
    }
};

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout, loading: authLoading, csrfToken } = useAuth();
    const navigate = useNavigate();
    const discordLoginUrl = `${API_BASE_URL}/auth/discord?origin=${encodeURIComponent(window.location.origin)}`;

    const navItems = [
        { to: '/', icon: 'document', label: 'Document Editor', end: true },
        { to: '/analytics', icon: 'analytics', label: 'Analytics' },
        { to: '/feedback', icon: 'forum', label: 'FEEDBACK' },
        { to: '/advertisements', icon: 'campaign', label: 'Advertisements' },
    ];

    const handleLogout = async () => {
        await logout(csrfToken);
        setIsMobileMenuOpen(false);
        navigate('/');
    };

    const NavItem = ({ item, compact = false, onSelect }) => (
        <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onSelect}
            className={({ isActive }) => [
                'group relative flex items-center rounded-[6px] py-2.5 text-sm font-medium transition-[150ms] ease-out',
                compact ? 'justify-center gap-0 px-2' : 'gap-3 px-3',
                isActive
                    ? 'bg-[rgba(245,197,24,0.08)] text-[#ffffff] ring-1 ring-[rgba(245,197,24,0.18)]'
                    : 'text-[#888888] hover:bg-card-bg hover:text-[#ffffff]',
            ].join(' ')}
        >
            {({ isActive }) => (
                <>
                    <Icon
                        name={item.icon}
                        className={isActive ? 'text-[#f5c518]' : 'text-inherit group-hover:text-[#f5c518]'}
                    />
                    <span className={`whitespace-nowrap transition-all duration-150 ${compact ? 'lg:w-0 lg:translate-x-2 lg:opacity-0' : 'opacity-100'}`}>
                        {item.label}
                    </span>
                </>
            )}
        </NavLink>
    );

    const NavList = ({ compact = false, onSelect }) => (
        <div className="space-y-2">
            {navItems.map((item) => (
                <NavItem key={item.to} item={item} compact={compact} onSelect={onSelect} />
            ))}
        </div>
    );

    const UserPanel = ({ compact = false }) => {
        if (authLoading) {
            return (
                <div className={`flex flex-col gap-3 ${compact ? 'items-center' : ''}`}>
                    <div className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
                        <div className="skeleton h-9 w-9 rounded-full" />
                        <div className={`flex flex-col gap-2 overflow-hidden whitespace-nowrap transition-all duration-150 ${compact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <div className="skeleton h-4 w-24 rounded" />
                            <div className="skeleton h-3 w-16 rounded" />
                        </div>
                    </div>
                    <div className="skeleton h-12 w-full rounded-[6px]" />
                </div>
            );
        }

        if (!user) {
            return (
                <a
                    href={discordLoginUrl}
                    className={`flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#f5c518] px-4 py-3 text-sm font-semibold text-black transition-[150ms] ease-out hover:brightness-95 ${compact ? 'px-0' : ''}`}
                    title="Login with Discord"
                >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-1.65-.6304-2.29-.6304-2.29-.6304a.077.077 0 01-.01-.0051 13.2515 13.2515 0 011.02-.5114.0776.0776 0 00.0263-.105c-.0017-.0023-.0017-.0023 0 0 3.6309 1.761 7.6432 1.761 11.2335 0 .028.0028.028.0028.0263.105a13.2515 13.2515 0 011.02.5114.077.077 0 01-.01.005s-2.922 1.2655-4.572 1.2655a.076.076 0 00-.0416.1057c.3658.699.7773 1.3638 1.226 1.9942a.0777.0777 0 00.0842.0276c1.9616-.6066 3.9401-1.5218 6.0029-3.0294a.077.077 0 00.0312-.0561c.5334-5.5947-.9623-10.1583-3.4116-13.6603a.0741.0741 0 00-.0321-.0277zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                    </svg>
                    <span className={`transition-all duration-150 ${compact ? 'hidden w-0' : 'block w-auto'}`}>Login with Discord</span>
                </a>
            );
        }

        return (
            <>
                <div className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
                    <div className="relative shrink-0">
                        <img
                            alt="User Profile"
                            className="h-9 w-9 rounded-full border border-[#222222]"
                            src={user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                        />
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0f0f0f] bg-[#22c55e]" />
                    </div>
                    <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-150 ${compact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                        <span className="text-sm font-medium leading-none text-white">{user.username}</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className={`flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#f5c518] px-4 py-3 text-sm font-semibold text-black transition-[150ms] ease-out hover:brightness-95 ${compact ? 'px-0' : ''}`}
                    title="Logout"
                >
                    <Icon name="logout" className="text-black" />
                    <span className={`transition-all duration-150 ${compact ? 'hidden w-0' : 'block w-auto'}`}>Logout</span>
                </button>
            </>
        );
    };

    return (
        <>
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[#1a1a1a] bg-[#0f0f0f] px-4">
                <img src="/logo.png" alt="24IFR" className="h-8 w-auto object-contain" />
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-zinc-400 transition-colors hover:text-white"
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    <Icon name={isMobileMenuOpen ? 'close' : 'menu'} className="h-6 w-6" />
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 flex flex-col bg-background-dark/95 px-5 pt-20 backdrop-blur-sm animate-fadeIn">
                    <nav className="space-y-4">
                        <NavList onSelect={() => setIsMobileMenuOpen(false)} />
                    </nav>

                    <div className="mt-auto pb-10">
                        <UserPanel />
                    </div>
                </div>
            )}

            <aside
                id="sidebar"
                className={`relative z-20 hidden shrink-0 flex-col justify-between border-r border-[#1a1a1a] bg-[#0f0f0f] transition-[150ms] ease-out lg:flex ${isCollapsed ? 'w-14' : 'w-60'}`}
            >
                <div>
                    <div className="flex h-16 items-center justify-between border-b border-[#1a1a1a] px-4">
                        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-150 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <img src="/logo.png" alt="24IFR" className="h-8 w-auto object-contain" />
                        </div>
                        <div className={`${isCollapsed ? 'block' : 'hidden'}`}>
                            <img src="/logo.png" alt="24IFR" className="h-8 w-auto object-contain" />
                        </div>

                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`absolute top-6 transition-colors hover:text-white ${isCollapsed ? 'right-[-0.7rem] rounded-full border border-[#222222] bg-[#0f0f0f] p-1 text-[#888888]' : 'right-3 text-[#888888]'}`}
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <Icon name={isCollapsed ? 'chevron_right' : 'menu_open'} className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="px-3 pt-4">
                        <nav className="mt-2 space-y-1.5">
                            <NavList compact={isCollapsed} onSelect={() => setIsMobileMenuOpen(false)} />
                        </nav>
                    </div>
                </div>

                <div className="border-t border-[#1a1a1a] p-3">
                    <UserPanel compact={isCollapsed} />
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
