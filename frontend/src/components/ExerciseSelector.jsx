import React from 'react';
import { EXERCISES } from '../lib/poseUtils';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X, Dumbbell, ChevronRight } from 'lucide-react';

export default function ExerciseSelector({ onSelect, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md p-0 overflow-hidden border-none bg-surface shadow-2xl">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-surface">
                    <div>
                        <h2 className="text-xl font-bold text-white">Select Workout</h2>
                        <p className="text-sm text-zinc-500">Choose an exercise to start tracking</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                    {Object.entries(EXERCISES).map(([key, value], index) => (
                        <button
                            key={key}
                            onClick={() => onSelect(value)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 transition-all group text-left border border-transparent hover:border-zinc-700"
                        >
                            <div className="flex items-center gap-4">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-fitness-green/10 text-fitness-green font-bold text-sm">
                                    {index + 1}
                                </span>
                                <span className="font-bold text-white capitalize text-lg group-hover:translate-x-1 transition-transform">
                                    {value.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-fitness-green group-hover:text-black transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <Button variant="ghost" className="w-full text-zinc-400 hover:text-white" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
}
