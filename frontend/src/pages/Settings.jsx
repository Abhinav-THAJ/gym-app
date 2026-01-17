import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bell, Lock, Smartphone, Check, Zap, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

export default function Settings() {
    const { settings, toggleSetting } = useSettings();
    const [notification, setNotification] = useState(null);

    const handleToggle = (key) => {
        toggleSetting(key);
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        showNotification(`${label} ${!settings[key] ? 'Enabled' : 'Disabled'}`);
    };

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleUpdatePassword = () => {
        const newPass = prompt("Enter new password:");
        if (newPass) {
            showNotification("Password updated successfully!");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-24">
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-0 left-1/2 z-50 bg-white text-black px-6 py-3 rounded-full shadow-2xl font-medium flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        {notification}
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="mb-12 flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Settings</h1>
                    <p className="text-zinc-500 text-lg">Manage your preferences and account security.</p>
                </div>
                {/* Avatar Link */}
                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 cursor-pointer hover:border-fitness-green transition-colors">
                    <a href="/profile" className="w-full h-full flex items-center justify-center text-zinc-500 font-bold no-underline">
                        U
                    </a>
                </div>
            </header>

            <div className="space-y-8">

                <Section title="Workout">
                    <SettingItem
                        icon={Volume2}
                        label="Voice Rep Count"
                        description="Announce rep numbers during exercise"
                        color="text-fitness-green"
                        bgColor="bg-fitness-green/10"
                        action={<Toggle checked={settings.voiceRepCount} onChange={() => handleToggle('voiceRepCount')} />}
                    />
                    <SettingItem
                        icon={Volume2}
                        label="Voice Form Tips"
                        description="Audio feedback for posture and form corrections"
                        color="text-fitness-blue"
                        bgColor="bg-fitness-blue/10"
                        action={<Toggle checked={settings.voiceFormTips} onChange={() => handleToggle('voiceFormTips')} />}
                    />
                </Section>

                <Section title="Notifications">
                    <SettingItem
                        icon={Bell}
                        label="Push Notifications"
                        description="Receive alerts about your workout progress"
                        color="text-fitness-red"
                        bgColor="bg-fitness-red/10"
                        action={<Toggle checked={settings.pushNotifications} onChange={() => handleToggle('pushNotifications')} />}
                    />
                    <SettingItem
                        icon={Zap}
                        label="Motivational Alerts"
                        description="Get daily inspiration to keep you moving"
                        color="text-fitness-yellow"
                        bgColor="bg-fitness-yellow/10"
                        action={<Toggle checked={settings.motivationalAlerts} onChange={() => handleToggle('motivationalAlerts')} />}
                    />
                </Section>

                <Section title="Privacy & Security">
                    <SettingItem
                        icon={Lock}
                        label="Change Password"
                        description="Update your account password"
                        color="text-zinc-400"
                        bgColor="bg-zinc-800"
                        action={<Button variant="outline" size="sm" onClick={handleUpdatePassword} className="border-zinc-700 hover:bg-zinc-800">Update</Button>}
                    />
                </Section>

                <div className="pt-12 text-center">
                    <p className="text-xs text-zinc-600 font-mono tracking-widest uppercase">FitAI v1.0.0 • Build 2024.1</p>
                </div>
            </div>
        </div>
    );
}


function Section({ title, children }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 ml-1">{title}</h3>
            <Card className="p-0 overflow-hidden border-none bg-surface shadow-lg">
                <div className="divide-y divide-zinc-800">
                    {children}
                </div>
            </Card>
        </div>
    );
}

function SettingItem({ icon: Icon, label, description, action, color = "text-zinc-400", bgColor = "bg-zinc-900" }) {
    return (
        <div className="p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors group">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-medium text-white">{label}</h4>
                    <p className="text-sm text-zinc-500">{description}</p>
                </div>
            </div>
            <div>{action}</div>
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <button
            onClick={onChange}
            className={`w-12 h-7 rounded-full relative transition-all duration-300 focus:outline-none ${checked ? 'bg-fitness-green' : 'bg-zinc-800'}`}
        >
            <motion.div
                animate={{ x: checked ? 22 : 2 }}
                className={`absolute top-1 w-5 h-5 rounded-full transition-colors shadow-sm ${checked ? 'bg-white' : 'bg-zinc-500'}`}
            />
        </button>
    );
}
