import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';

export default function Landing() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // If user is already logged in, redirect to dashboard
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-black text-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-fitness-blue/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-fitness-purple/20 rounded-full blur-[100px]" />

            <div className="flex-1 flex flex-col items-center justify-center px-6 z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center mb-16"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-fitness-green text-black flex items-center justify-center shadow-[0_0_20px_rgba(164,255,0,0.3)]">
                            <Dumbbell className="w-7 h-7" />
                        </div>
                        <span className="font-bold text-3xl tracking-tight">FitAI</span>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-center">Welcome</h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-sm space-y-4"
                >
                    <Button
                        onClick={() => navigate('/login')}
                        className="w-full h-14 text-lg font-bold rounded-full bg-fitness-green text-black hover:bg-fitness-green/90 shadow-[0_0_20px_rgba(164,255,0,0.2)]"
                    >
                        SIGN IN
                    </Button>

                    <Button
                        onClick={() => navigate('/register')}
                        className="w-full h-14 text-lg font-bold rounded-full bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
                    >
                        SIGN UP
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
