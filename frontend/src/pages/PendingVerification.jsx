import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, Mail, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { API_BASE_URL } from '../config';

export default function PendingVerification() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.is_verified) {
            navigate('/dashboard');
            return;
        }

        // Poll for verification status every 5 seconds
        const interval = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const updatedUser = await res.json();
                    if (updatedUser.is_verified) {
                        window.location.reload(); // This will trigger the top-level useEffect to redirect
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [user, navigate]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-fitness-blue/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-fitness-purple/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg z-10 text-center"
            >
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="p-6 bg-surface rounded-full border border-zinc-800 shadow-[0_0_30px_rgba(0,245,234,0.2)]">
                            <Clock className="w-12 h-12 text-fitness-blue" />
                        </div>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-1 -right-1 p-2 bg-fitness-blue rounded-full border-4 border-black"
                        >
                            <ShieldCheck className="w-4 h-4 text-black" />
                        </motion.div>
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-4">Verification Pending</h1>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Thank you for registering, <span className="text-white font-medium">{user?.full_name}</span>!
                    Your payment is currently being verified by our team.
                    <br /><span className="text-fitness-blue text-sm">This page will automatically redirect once verified.</span>
                </p>

                <div className="grid grid-cols-1 gap-4 mb-8">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-zinc-800 text-left">
                        <div className="p-2 bg-fitness-blue/10 rounded-lg">
                            <Mail className="w-5 h-5 text-fitness-blue" />
                        </div>
                        <div>
                            <h3 className="font-medium text-sm">Verification in progress</h3>
                            <p className="text-xs text-zinc-500 mt-1">Our team has been notified and is verifying your transaction.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-zinc-800 text-left">
                        <div className="p-2 bg-fitness-green/10 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-fitness-green" />
                        </div>
                        <div>
                            <h3 className="font-medium text-sm">Instant Access</h3>
                            <p className="text-xs text-zinc-500 mt-1">Once verified, you'll get full access to your {user?.subscription_tier} plan features.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-3 py-4 text-zinc-500">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="w-5 h-5 border-2 border-fitness-blue border-t-transparent rounded-full"
                        />
                        <span>Waiting for admin approval...</span>
                    </div>
                    <Button variant="outline" onClick={logout} className="w-full border-zinc-800 text-zinc-400 hover:text-white">
                        <LogOut className="w-4 h-4 mr-2" /> Sign out and try later
                    </Button>
                </div>

                <p className="mt-8 text-xs text-zinc-600">
                    Transaction ID: <span className="font-mono">{user?.transaction_id || 'N/A'}</span>
                </p>
            </motion.div>
        </div>
    );
}
