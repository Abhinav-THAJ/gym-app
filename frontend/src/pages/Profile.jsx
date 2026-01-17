import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    User,
    Mail,
    LogOut,
    Trash2,
    ChevronRight,
    Award,
    Clock,
    Activity,
    Flame,
    Trophy,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

export default function Profile() {
    const { user, token, logout } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/workouts/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        };
        if (token) fetchStats();
    }, [token]);

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                const res = await fetch(`${API_BASE_URL}/users/me`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    logout();
                } else {
                    alert('Failed to delete account');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred');
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-24">
            <motion.div
                className="max-w-4xl mx-auto"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <header className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">My Profile</h1>
                    <p className="text-zinc-500 text-lg">Manage your personal information and account settings.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Avatar & Basic Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-8 flex flex-col items-center text-center bg-surface border-none shadow-lg">
                            <div className="relative mb-6">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zinc-800 to-black border-4 border-surface-highlight flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                                    {user?.full_name?.[0] || 'U'}
                                </div>
                                <div className="absolute bottom-0 right-0 p-2 bg-fitness-green rounded-full text-black shadow-lg">
                                    <Award className="w-5 h-5" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">{user?.full_name || 'Athlete'}</h2>
                            <p className="text-zinc-500 text-sm mb-6">{user?.email}</p>

                            <div className="w-full pt-6 border-t border-zinc-800 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Member Since</span>
                                    <span className="text-zinc-300">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Jan 2024'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Account Status</span>
                                    <span className="text-fitness-green font-medium capitalize">{user?.subscription_tier || 'Free'}</span>
                                </div>
                            </div>
                        </Card>



                        {/* Body Metrics */}
                        <Card className="p-6 bg-surface border-none">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Body Metrics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                                    <p className="text-xs text-zinc-500 mb-1">Height</p>
                                    <p className="text-lg font-bold text-white">{user?.height || '-'} <span className="text-xs font-normal text-zinc-500">cm</span></p>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                                    <p className="text-xs text-zinc-500 mb-1">Weight</p>
                                    <p className="text-lg font-bold text-white">{user?.weight || '-'} <span className="text-xs font-normal text-zinc-500">kg</span></p>
                                </div>
                                <div className="col-span-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center px-6">
                                    <p className="text-xs text-zinc-500">BMI</p>
                                    {user?.height && user?.weight ? (
                                        (() => {
                                            const heightInMeters = user.height / 100;
                                            const bmi = (user.weight / (heightInMeters * heightInMeters)).toFixed(1);
                                            let category = 'Normal';
                                            let color = 'text-fitness-green';

                                            if (bmi < 18.5) {
                                                category = 'Underweight';
                                                color = 'text-blue-400';
                                            } else if (bmi >= 25 && bmi < 29.9) {
                                                category = 'Overweight';
                                                color = 'text-yellow-400';
                                            } else if (bmi >= 30) {
                                                category = 'Obese';
                                                color = 'text-red-400';
                                            }

                                            return (
                                                <p className={`text-lg font-bold ${color}`}>
                                                    {bmi} <span className="text-xs font-normal text-zinc-500">{category}</span>
                                                </p>
                                            );
                                        })()
                                    ) : (
                                        <p className="text-lg font-bold text-zinc-500">-</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Details & Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-0 overflow-hidden bg-surface border-none">
                            <div className="p-6 border-b border-zinc-800">
                                <h3 className="text-xl font-semibold">Personal Details</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Full Name</label>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-highlight border-none text-zinc-200">
                                            <User className="w-4 h-4 text-zinc-500" />
                                            {user?.full_name}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email Address</label>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-highlight border-none text-zinc-200">
                                            <Mail className="w-4 h-4 text-zinc-500" />
                                            {user?.email}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </Card>

                        {/* Awards Section */}
                        <Card className="p-6 bg-surface border-none">
                            <h3 className="text-xl font-semibold mb-6">Awards & Badges</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    {
                                        id: 'first_step',
                                        name: 'First Step',
                                        desc: 'Completed 1st workout',
                                        icon: Award,
                                        isUnlocked: (stats?.total_workouts || 0) >= 1,
                                        activeClass: 'border-fitness-yellow/50',
                                        iconClass: 'bg-fitness-yellow/10 text-fitness-yellow'
                                    },
                                    {
                                        id: 'on_fire',
                                        name: 'On Fire',
                                        desc: '3 Day Streak',
                                        icon: Flame,
                                        isUnlocked: (stats?.streak || 0) >= 3,
                                        activeClass: 'border-fitness-blue/50',
                                        iconClass: 'bg-fitness-blue/10 text-fitness-blue'
                                    },
                                    {
                                        id: 'champion',
                                        name: 'Champion',
                                        desc: '100 Workouts',
                                        icon: Trophy,
                                        isUnlocked: (stats?.total_workouts || 0) >= 100,
                                        activeClass: 'border-purple-400/50',
                                        iconClass: 'bg-purple-400/10 text-purple-400'
                                    },
                                    {
                                        id: 'powerhouse',
                                        name: 'Powerhouse',
                                        desc: '1000 Reps',
                                        icon: Zap,
                                        isUnlocked: (stats?.total_reps || 0) >= 1000,
                                        activeClass: 'border-fitness-red/50',
                                        iconClass: 'bg-fitness-red/10 text-fitness-red'
                                    }
                                ].map((badge) => (
                                    <div
                                        key={badge.id}
                                        className={`flex flex-col items-center text-center gap-2 p-4 rounded-xl border transition-all duration-300 group ${badge.isUnlocked
                                                ? `bg-zinc-900/50 border-zinc-800 hover:${badge.activeClass}`
                                                : 'bg-zinc-900/30 border-zinc-800/50 opacity-50 grayscale'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${badge.isUnlocked
                                                ? badge.iconClass
                                                : 'bg-zinc-800 text-zinc-600'
                                            }`}>
                                            <badge.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${badge.isUnlocked ? 'text-white' : 'text-zinc-400'}`}>
                                                {badge.name}
                                            </p>
                                            <p className={`text-xs ${badge.isUnlocked ? 'text-zinc-500' : 'text-zinc-600'}`}>
                                                {badge.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6 bg-surface border-none">
                            <h3 className="text-xl font-semibold mb-6">Account Management</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    onClick={logout}
                                    className="w-full justify-between border-zinc-700 hover:bg-zinc-800 text-zinc-300 group"
                                >
                                    <span className="flex items-center gap-2">
                                        <LogOut className="w-4 h-4" />
                                        Log Out
                                    </span>
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                                </Button>
                                <Button
                                    className="w-full justify-between bg-fitness-red/10 text-fitness-red border border-fitness-red/20 hover:bg-fitness-red/20 group"
                                    onClick={handleDeleteAccount}
                                >
                                    <span className="flex items-center gap-2">
                                        <Trash2 className="w-4 h-4" />
                                        Delete Account
                                    </span>
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
