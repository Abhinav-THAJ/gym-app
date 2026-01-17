import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            if (err.message === 'Failed to fetch') {
                setError('Cannot connect to server. Please ensure the backend is running with --host 0.0.0.0 and your phone is on the same Wi-Fi.');
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-black text-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-fitness-blue/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-[10%] left-[-10%] w-[300px] h-[300px] bg-fitness-purple/20 rounded-full blur-[80px]" />

            {/* Header Section */}
            <div className="flex-1 flex flex-col justify-center px-8 pt-12 pb-8 z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl font-bold tracking-tight leading-tight">
                        Hello<br />
                        <span className="text-fitness-green">Sign In</span>
                    </h1>
                </motion.div>
            </div>

            {/* Form Container (Bottom Sheet Style) */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-zinc-900 rounded-t-[40px] px-8 py-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 min-h-[60vh] flex flex-col"
            >
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 ml-1">Email</label>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-zinc-800/50 border-zinc-700 focus:border-fitness-green focus:ring-fitness-green/20 rounded-xl h-12"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 ml-1">Password</label>
                        <div className="relative">
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-zinc-800/50 border-zinc-700 focus:border-fitness-green focus:ring-fitness-green/20 rounded-xl h-12 pr-20"
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white font-medium transition-colors"
                            >
                                Forgot?
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-4 h-14 text-lg font-bold rounded-xl bg-fitness-green text-black hover:bg-fitness-green/90 shadow-[0_0_20px_rgba(164,255,0,0.2)]"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                </form>

                <div className="mt-auto pt-8 text-center">
                    <p className="text-zinc-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-white font-bold hover:underline transition-colors">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
