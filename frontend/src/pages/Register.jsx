import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Check, ArrowRight, ArrowLeft, Shield, Zap, Crown, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function Register() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        height: '',
        weight: '',
        bloodGroup: '',
        subscriptionTier: 'free',
        transactionId: ''
    });
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (formData.subscriptionTier === 'free') {
                handleFinalSubmit();
            } else {
                setStep(3);
            }
        }
    };

    const handleFinalSubmit = async () => {
        setError('');
        setIsLoading(true);
        try {
            await register(
                formData.email,
                formData.password,
                formData.fullName,
                formData.height,
                formData.weight,
                formData.bloodGroup,
                formData.subscriptionTier,
                formData.transactionId
            );
            // Redirect to dashboard immediately
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
            setStep(1);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayment = () => {
        if (!formData.transactionId || formData.transactionId.length < 6) {
            setError('Please enter a valid Transaction ID (UTR)');
            return;
        }
        setError('');
        setPaymentStatus('processing');
        setTimeout(() => {
            setPaymentStatus('success');
            setTimeout(() => {
                handleFinalSubmit();
            }, 1500);
        }, 3000);
    };

    const tiers = [
        {
            id: 'free',
            name: 'Free',
            price: '₹0',
            features: [
                'Basic Posture Correction',
                '5 AI Workout Sessions / month',
                'Standard Response Time',
                'Community Support Access',
                'Basic Progress Tracking'
            ],
            icon: Shield,
            color: 'text-fitness-green',
            bg: 'bg-fitness-green/10',
            border: 'border-fitness-green/50'
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '₹299',
            features: [
                'Advanced AI Form Analysis',
                '50 AI Workout Sessions / month',
                'Priority Processing',
                'Detailed Performance Analytics',
                'Workout History & Trends',
                'Email Support'
            ],
            icon: Zap,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            border: 'border-blue-400/50'
        },
        {
            id: 'premium',
            name: 'Premium',
            price: '₹799',
            features: [
                'Real-time Voice Feedback',
                'Unlimited AI Sessions',
                'Personal AI Coach Mode',
                'Custom Workout Plans',
                'Advanced Health Insights',
                '24/7 Priority Support',
                'Early Access to New Features'
            ],
            icon: Crown,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            border: 'border-purple-400/50'
        }
    ];

    const selectedTier = tiers.find(t => t.id === formData.subscriptionTier);

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
                        {step === 2 ? 'Choose Your' : 'Create Your'}<br />
                        <span className="text-fitness-green">{step === 2 ? 'Plan' : 'Account'}</span>
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

                <form onSubmit={handleNext} className="flex flex-col gap-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400 ml-1">Full Name</label>
                                    <Input
                                        name="fullName"
                                        placeholder="John Doe"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required
                                        className="bg-zinc-800/50 border-zinc-700 focus:border-fitness-green focus:ring-fitness-green/20 rounded-xl h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400 ml-1">Email</label>
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="bg-zinc-800/50 border-zinc-700 focus:border-fitness-green focus:ring-fitness-green/20 rounded-xl h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400 ml-1">Password</label>
                                    <Input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        className="bg-zinc-800/50 border-zinc-700 focus:border-fitness-green focus:ring-fitness-green/20 rounded-xl h-12"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400 ml-1">Height (cm)</label>
                                        <Input
                                            name="height"
                                            type="number"
                                            placeholder="175"
                                            value={formData.height}
                                            onChange={handleInputChange}
                                            required
                                            className="bg-zinc-800/50 border-zinc-700 focus:border-fitness-green focus:ring-fitness-green/20 rounded-xl h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400 ml-1">Weight (kg)</label>
                                        <Input
                                            name="weight"
                                            type="number"
                                            placeholder="70"
                                            value={formData.weight}
                                            onChange={handleInputChange}
                                            required
                                            className="bg-zinc-800/50 border-zinc-700 focus:border-fitness-green focus:ring-fitness-green/20 rounded-xl h-12"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full mt-4 h-14 text-lg font-bold rounded-xl bg-fitness-green text-black hover:bg-fitness-green/90 shadow-[0_0_20px_rgba(164,255,0,0.2)]">
                                    Next Step <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 gap-4">
                                    {tiers.map((tier) => {
                                        const Icon = tier.icon;
                                        const isSelected = formData.subscriptionTier === tier.id;
                                        return (
                                            <div
                                                key={tier.id}
                                                onClick={() => setFormData(prev => ({ ...prev, subscriptionTier: tier.id }))}
                                                className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${isSelected
                                                    ? `${tier.border} ${tier.bg} ring-1 ring-white/20`
                                                    : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className={`w-12 h-12 rounded-full bg-black/40 flex items-center justify-center ${tier.color}`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-xl text-white">{tier.name}</h3>
                                                        <p className="text-sm text-zinc-400">{tier.price}/mo</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className={`w-6 h-6 rounded-full ${tier.color.replace('text-', 'bg-')} flex items-center justify-center`}>
                                                            <Check className="w-4 h-4 text-black" />
                                                        </div>
                                                    )}
                                                </div>

                                                <ul className="space-y-2 pl-1">
                                                    {tier.features.map((f, i) => (
                                                        <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                                                            <div className={`w-1 h-1 mt-1.5 rounded-full flex-shrink-0 ${tier.color.replace('text-', 'bg-')}`} />
                                                            <span className="leading-tight">{f}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-4 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl border-zinc-700 hover:bg-zinc-800">
                                        Back
                                    </Button>
                                    <Button type="submit" disabled={isLoading} className="flex-[2] h-12 rounded-xl bg-fitness-green text-black hover:bg-fitness-green/90 font-bold">
                                        {isLoading ? "Loading..." : (formData.subscriptionTier === 'free' ? 'Complete' : 'Proceed')}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl">
                                    <QRCodeCanvas
                                        value={`upi://pay?pa=adilmohamednp@oksbi&pn=FitAI&am=${selectedTier?.price.replace('₹', '')}&cu=INR`}
                                        size={180}
                                        level="H"
                                    />
                                    <p className="mt-4 text-black font-bold">Scan to Pay {selectedTier?.price}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400 ml-1">Transaction ID (UTR)</label>
                                    <Input
                                        name="transactionId"
                                        placeholder="Enter 12-digit UTR number"
                                        value={formData.transactionId}
                                        onChange={handleInputChange}
                                        className="bg-zinc-800/50 border-zinc-700 focus:border-fitness-blue focus:ring-fitness-blue/20 rounded-xl h-12"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl border-zinc-700 hover:bg-zinc-800">
                                        Back
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handlePayment}
                                        disabled={paymentStatus !== 'idle'}
                                        className="flex-[2] h-12 rounded-xl bg-fitness-blue text-black hover:bg-fitness-blue/90 font-bold"
                                    >
                                        {paymentStatus === 'idle' ? "Verify Payment" : paymentStatus === 'processing' ? "Verifying..." : "Verified!"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                <div className="mt-auto pt-8 text-center">
                    <p className="text-zinc-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-white font-bold hover:underline transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
