import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Home, Dumbbell, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

export default function Layout({ children }) {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Don't show layout on auth pages or workout page (immersive)
    const isAuthPage = ['/', '/login', '/register'].includes(location.pathname);
    const isWorkoutPage = location.pathname === '/workout';

    if (isAuthPage || isWorkoutPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar Navigation (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-zinc-800 bg-surface z-20 p-6">
                <div className="flex items-center gap-3 mb-12 px-2">
                    <div className="w-8 h-8 rounded-lg bg-fitness-green text-black flex items-center justify-center shadow-[0_0_15px_rgba(164,255,0,0.3)]">
                        <Dumbbell className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">FitAI</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem icon={Home} label="Dashboard" path="/dashboard" active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
                    <NavItem icon={Settings} label="Settings" path="/settings" active={location.pathname === '/settings'} onClick={() => navigate('/settings')} />
                </nav>

                <div className="pt-6 border-t border-zinc-800 mt-auto">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-surface-highlight border border-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                            {user?.full_name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    {/* <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-zinc-400 hover:text-fitness-red hover:bg-fitness-red/10">
                        <LogOut className="w-4 h-4 mr-2" />
                        Log out
                    </Button> */}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto h-screen bg-black pb-40 md:pb-0">
                {children}
            </main>

            {/* Mobile Navigation (Bottom) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 min-h-[5rem] bg-surface/90 backdrop-blur-xl border-t border-white/10 z-50 flex justify-around items-center px-6 pb-[env(safe-area-inset-bottom)] pt-2">
                <MobileNavItem icon={Home} active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />

                <div className="relative -top-8">
                    <button
                        onClick={() => navigate('/workout')}
                        className="w-16 h-16 rounded-full bg-fitness-green text-black flex items-center justify-center shadow-[0_0_20px_rgba(164,255,0,0.4)] hover:scale-105 transition-all active:scale-95"
                    >
                        <Dumbbell className="w-7 h-7" />
                    </button>
                </div>
                <MobileNavItem icon={Settings} active={location.pathname === '/settings'} onClick={() => navigate('/settings')} />
            </div>
        </div>
    );
}

function NavItem({ icon: Icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${active
                ? 'bg-fitness-green/10 text-fitness-green'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-fitness-green' : 'text-zinc-500'}`} />
            <span>{label}</span>
        </button>
    );
}

function MobileNavItem({ icon: Icon, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`p-3 rounded-xl transition-colors ${active ? 'text-fitness-green bg-fitness-green/10' : 'text-zinc-500'}`}
        >
            <Icon className="w-6 h-6" />
        </button>
    );
}
