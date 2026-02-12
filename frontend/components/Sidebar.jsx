import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from 'react';
import { readCookie } from '../utils/cookies';
import { useDashboard } from '../utils/DashboardContext';

export default function Sidebar({ open, setOpen }) {
    const router = useRouter();
    const { data: session } = useSession();
    const { dashboardDesign } = useDashboard();

    const isActive = (path) => router.pathname === path;

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setOpen(false)}
            />

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen w-72 bg-theme-sidebar-bg backdrop-blur-xl border-r border-theme-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="h-20 flex items-center px-6 border-b border-theme-sidebar-border">
                        <Link href="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/20 group-hover:shadow-yellow-500/40 transition-all duration-300 group-hover:scale-105">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-6 h-6 text-slate-900"
                                >
                                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                                    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-theme-text-primary to-theme-text-secondary">
                                BoilerFuel
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        <div className="text-xs font-semibold text-theme-text-tertiary uppercase tracking-wider mb-4 px-2">
                            Menu
                        </div>

                        <NavLink
                            href="/"
                            icon={<HomeIcon />}
                            active={isActive('/')}
                            onClick={() => setOpen(false)}
                        >
                            Home
                        </NavLink>

                        <NavLink
                            href={`/food-dashboard-${dashboardDesign.toLowerCase()}`}
                            icon={<FoodIcon />}
                            active={isActive(`/food-dashboard-${dashboardDesign.toLowerCase()}`)}
                            onClick={() => setOpen(false)}
                        >
                            Food Catalog
                        </NavLink>

                        <NavLink
                            href="/gym-modern"
                            icon={<GymIcon />}
                            active={isActive('/gym-modern') || isActive('/gym')}
                            onClick={() => setOpen(false)}
                        >
                            Gym Tracker
                        </NavLink>

                        <NavLink
                            href="/insights"
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                            active={isActive('/insights')}
                            onClick={() => setOpen(false)}
                        >
                            Insights
                        </NavLink>

                        <div className="pt-6 pb-2">
                            <div className="text-xs font-semibold text-theme-text-tertiary uppercase tracking-wider mb-4 px-2">
                                System
                            </div>
                            <NavLink
                                href="/profile"
                                icon={<UserIcon className="w-5 h-5" />}
                                active={isActive('/profile')}
                                onClick={() => setOpen(false)}
                            >
                                Profile
                            </NavLink>
                            <NavLink
                                href="/about"
                                icon={<InfoIcon />}
                                active={isActive('/about')}
                                onClick={() => setOpen(false)}
                            >
                                About
                            </NavLink>
                        </div>
                    </nav>

                    {/* User Profile Section */}
                    <div className="p-4 border-t border-theme-sidebar-border bg-theme-bg-secondary/30">
                        {session ? (
                            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-theme-bg-hover/50 transition-colors cursor-pointer group">
                                {session.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name}
                                        className="h-10 w-10 rounded-full border-2 border-theme-border-primary group-hover:border-yellow-400 transition-colors"
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-theme-bg-tertiary flex items-center justify-center border-2 border-theme-border-primary group-hover:border-yellow-400 transition-colors">
                                        <UserIcon className="w-5 h-5 text-theme-text-secondary" />
                                    </div>
                                )}
                                <Link href="/profile" className="flex-1 min-w-0" onClick={() => setOpen(false)}>
                                    <p className="text-sm font-medium text-theme-text-primary truncate hover:text-yellow-500 transition-colors">
                                        {session.user?.name}
                                    </p>
                                    <p className="text-xs text-theme-text-tertiary truncate">
                                        {session.user?.email}
                                    </p>
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="p-2 rounded-lg hover:bg-theme-bg-hover text-theme-text-tertiary hover:text-red-500 transition-colors"
                                    title="Sign out"
                                >
                                    <LogoutIcon />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn('google')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 font-medium hover:from-yellow-500 hover:to-yellow-700 transition-all shadow-lg shadow-yellow-500/20"
                            >
                                <GoogleIcon />
                                <span>Sign in</span>
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

function NavLink({ href, icon, children, active, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
                ? 'bg-gradient-to-r from-yellow-400/15 to-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-semibold shadow-lg ring-2 ring-yellow-400/30'
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover/70'
                }`}
        >
            {/* Active indicator line */}
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-r-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
            )}
            
            <span className={`transition-all duration-300 ${active ? 'text-yellow-500 scale-110' : 'text-theme-text-tertiary group-hover:text-yellow-400 group-hover:scale-105'}`}>
                {icon}
            </span>
            <span className="relative z-10">{children}</span>
            {active && (
                <div className="ml-auto w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] pulse-glow" />
            )}
        </Link>
    );
}

// Icons
function HomeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
    );
}

function FoodIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
    );
}

function GymIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
        </svg>
    );
}

function InfoIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
    );
}

function UserIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}
