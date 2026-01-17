import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Camera, User, ArrowRight, CheckCircle2, Smartphone, Eye } from 'lucide-react';

// Exercise-specific instructions
const EXERCISE_INSTRUCTIONS = {
    pushup: {
        title: "Pushup Setup",
        cameraPosition: "Place your phone on the side, at floor level",
        bodyPosition: "Your full body should be visible from head to toe",
        visibleSide: "Side view (left or right)",
        tips: [
            "Ensure good lighting",
            "Keep camera stable (use a stand or prop)",
            "Full body must be in frame",
            "Arms, torso, and legs should be visible"
        ],
        icon: "🏋️"
    },
    squat: {
        title: "Squat Setup",
        cameraPosition: "Place your phone at hip height, about 6-8 feet away",
        bodyPosition: "Stand facing sideways to the camera",
        visibleSide: "Side view (left or right)",
        tips: [
            "Your full body should be visible",
            "Hips, knees, and ankles must be in frame",
            "Keep some space above your head",
            "Ensure stable camera position"
        ],
        icon: "🦵"
    },
    bicep_curl: {
        title: "Bicep Curl Setup",
        cameraPosition: "Place your phone at chest height, facing you or from the side",
        bodyPosition: "Stand with your arm(s) visible",
        visibleSide: "Front or side view",
        tips: [
            "Elbow to wrist must be clearly visible",
            "Keep your upper arm in frame",
            "Good lighting on your arms",
            "Stand at a comfortable distance"
        ],
        icon: "💪"
    },
    jumping_jacks: {
        title: "Jumping Jacks Setup",
        cameraPosition: "Place your phone at chest height, facing you",
        bodyPosition: "Stand facing the camera with full body visible",
        visibleSide: "Front view",
        tips: [
            "Ensure enough vertical space for arms up",
            "Full body from head to feet must be visible",
            "Clear area around you for jumping",
            "Stable camera position"
        ],
        icon: "⭐"
    }
};

export default function ExerciseInstructions({ exercise, onStart, onBack }) {
    const instructions = EXERCISE_INSTRUCTIONS[exercise] || EXERCISE_INSTRUCTIONS.pushup;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg"
            >
                <Card className="overflow-hidden border-none bg-surface shadow-2xl">
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-surface-highlight to-surface">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl filter drop-shadow-lg">{instructions.icon}</div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{instructions.title}</h2>
                                <p className="text-zinc-400 text-sm mt-1">Follow these instructions for best results</p>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-6 space-y-6">
                        {/* Camera Position */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fitness-blue/10 flex items-center justify-center">
                                <Smartphone className="w-6 h-6 text-fitness-blue" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Camera Position</h3>
                                <p className="text-zinc-400 text-sm">{instructions.cameraPosition}</p>
                            </div>
                        </div>

                        {/* Body Position */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fitness-green/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-fitness-green" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Your Position</h3>
                                <p className="text-zinc-400 text-sm">{instructions.bodyPosition}</p>
                            </div>
                        </div>

                        {/* Visible Side */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fitness-purple/10 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-fitness-purple" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Required View</h3>
                                <p className="text-zinc-400 text-sm">{instructions.visibleSide}</p>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800">
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-fitness-green" />
                                Quick Tips
                            </h3>
                            <ul className="space-y-2">
                                {instructions.tips.map((tip, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                                        <span className="text-fitness-green mt-0.5">•</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl"
                            onClick={onBack}
                        >
                            Back
                        </Button>
                        <Button
                            className="flex-1 bg-fitness-green text-black hover:bg-fitness-green/90 font-bold rounded-xl shadow-[0_0_20px_rgba(164,255,0,0.3)]"
                            onClick={onStart}
                        >
                            I'm Ready
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
