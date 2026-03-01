
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useExerciseCounter } from '../hooks/useExerciseCounter';
import { EXERCISES } from '../lib/poseUtils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ExerciseSelector from '../components/ExerciseSelector';
import ExerciseInstructions from '../components/ExerciseInstructions';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Timer, Activity, CheckCircle2, AlertCircle, AlertTriangle, Trophy } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Workout() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const { isLoaded, landmarks } = usePoseDetection(webcamRef, canvasRef);
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [currentExercise, setCurrentExercise] = useState(null);
    const [showModal, setShowModal] = useState(true);
    const [showInstructions, setShowInstructions] = useState(false);
    const [pendingExercise, setPendingExercise] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (location.state?.exercise) {
            const exercise = location.state.exercise;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPendingExercise(exercise);
            setShowModal(false);
            setShowInstructions(true);
        }
    }, [location.state]);


    const { user } = useAuth();
    const userWeight = user?.weight || 70; // Default to 70kg if not found

    const { reps, feedback, stage, currentAngle, formWarning, calories, isTooFast, errorCount, goodReps } = useExerciseCounter(landmarks, currentExercise, userWeight);

    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [sessionData, setSessionData] = useState(null);

    // TTS Helper
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSelectExercise = (exercise) => {
        setPendingExercise(exercise);
        setShowModal(false);
        setShowInstructions(true);
    };

    const handleStartWorkout = () => {
        setCurrentExercise(pendingExercise);
        setShowInstructions(false);
        setStartTime(Date.now());
        speak(`Starting ${pendingExercise.replace('_', ' ')}. Get ready.`);
    };

    const handleBackToSelector = () => {
        setShowInstructions(false);
        setPendingExercise(null);
        setShowModal(true);
    };

    // Timer
    useEffect(() => {
        let interval;
        if (startTime && !showModal) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [startTime, showModal]);

    // Generate intelligent feedback based on workout performance
    const generateFeedback = (data) => {
        const { reps, calories, duration, goodReps, errorCount, exerciseType } = data;
        const formAccuracy = reps > 0 ? Math.round((goodReps / reps) * 100) : 0;
        const caloriesPerMinute = duration > 0 ? (calories / (duration / 60)).toFixed(1) : 0;

        let rating = 'good';
        let title = 'Great Workout!';
        let message = '';
        let tips = [];

        // Determine overall rating
        if (reps === 0) {
            rating = 'none';
            title = 'Session Ended';
            message = 'No reps were recorded. Try positioning yourself better in frame next time.';
        } else if (formAccuracy >= 80 && errorCount <= 2) {
            rating = 'excellent';
            title = 'Excellent Performance! 🏆';
            message = `You crushed it with ${reps} reps and ${formAccuracy}% form accuracy! Your technique was on point.`;
            tips.push('Outstanding form! Keep up the consistency.');
        } else if (formAccuracy >= 60 && errorCount <= 5) {
            rating = 'good';
            title = 'Good Workout! 💪';
            message = `Solid session with ${reps} reps. Your form accuracy was ${formAccuracy}%.`;
            if (errorCount > 0) {
                tips.push(`Watch out for form issues - you had ${errorCount} form correction${errorCount > 1 ? 's' : ''}.`);
            }
        } else if (formAccuracy >= 40) {
            rating = 'average';
            title = 'Keep Practicing! 📈';
            message = `You completed ${reps} reps with ${formAccuracy}% form accuracy. There's room for improvement.`;
            tips.push(`Focus on technique - ${errorCount} form issues were detected.`);
            tips.push('Slow down your movements for better control.');
        } else {
            rating = 'needs_work';
            title = 'Room for Improvement 🎯';
            message = `${reps} reps completed, but only ${formAccuracy}% had good form.`;
            tips.push('Consider reducing speed to focus on proper form.');
            tips.push(`You had ${errorCount} form corrections - pay attention to the AI feedback.`);
            tips.push('Quality over quantity leads to better results!');
        }

        // Add specific exercise tips based on error count
        if (errorCount > 3) {
            const exerciseTips = {
                'pushup': 'Keep your body in a straight line from head to heels.',
                'squat': 'Focus on keeping your knees aligned with your toes.',
                'bicep_curl': 'Keep your elbows close to your body throughout the movement.',
                'jumping_jacks': 'Maintain a steady rhythm and full arm extension.'
            };
            if (exerciseTips[exerciseType]) {
                tips.push(exerciseTips[exerciseType]);
            }
        }

        // Add calorie insight
        if (calories > 0) {
            tips.push(`You burned approximately ${calories.toFixed(1)} calories (${caloriesPerMinute} cal/min).`);
        }

        return { rating, title, message, tips, formAccuracy };
    };

    const handleExit = async () => {
        const data = {
            reps,
            calories,
            duration: elapsedTime,
            goodReps,
            errorCount,
            exerciseType: currentExercise
        };

        // Save workout if any reps were done
        if (reps > 0 && currentExercise) {
            try {
                await fetch(`${API_BASE_URL}/workouts/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        exercise_type: currentExercise,
                        reps: reps,
                        duration_seconds: elapsedTime,
                        calories: calories,
                        details: { stage, goodReps, errorCount }
                    })
                });
            } catch (error) {
                console.error("Failed to save workout", error);
            }
        }

        // Generate feedback and show modal
        const feedbackData = generateFeedback(data);
        setSessionData({ ...data, ...feedbackData });
        setShowFeedbackModal(true);
    };

    const handleCloseFeedback = () => {
        setShowFeedbackModal(false);
        navigate('/dashboard');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
            <AnimatePresence>
                {showModal && <ExerciseSelector onSelect={handleSelectExercise} onClose={() => navigate('/dashboard')} />}
            </AnimatePresence>

            <AnimatePresence>
                {showInstructions && pendingExercise && (
                    <ExerciseInstructions
                        exercise={pendingExercise}
                        onStart={handleStartWorkout}
                        onBack={handleBackToSelector}
                    />
                )}
            </AnimatePresence>

            {/* Header / Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <Button variant="secondary" size="sm" onClick={handleExit} className="bg-black/80 border-zinc-800 text-white hover:bg-zinc-800">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        End Session
                    </Button>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isLoaded
                        ? 'bg-green-900/20 border-green-900/30 text-green-400'
                        : 'bg-yellow-900/20 border-yellow-900/30 text-yellow-400'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-xs font-medium uppercase tracking-wide">{isLoaded ? "AI Active" : "Initializing"}</span>
                    </div>
                    {currentExercise && (
                        <div className="px-3 py-1.5 rounded-full bg-black/80 border border-zinc-800 text-sm font-medium capitalize text-zinc-300">
                            {currentExercise.replace('_', ' ')}
                        </div>
                    )}
                    {/* Angle Display */}
                    {currentAngle > 0 && (
                        <div className="px-4 py-2 rounded-xl bg-blue-900/30 border border-blue-500/30 text-blue-400 font-mono text-lg font-bold">
                            {currentAngle}°
                        </div>
                    )}
                </div>
            </div>

            {/* Form Warning - Top Center */}
            <AnimatePresence>
                {formWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
                    >
                        <div className="bg-red-900/90 border border-red-500/50 px-6 py-3 rounded-2xl text-lg font-bold text-white shadow-2xl shadow-red-900/50 flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            {formWarning}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Camera Feed */}
            <Webcam
                ref={webcamRef}
                className="absolute top-0 left-0 w-full h-full object-cover opacity-80"
                mirrored
                videoConstraints={{
                    facingMode: "user",
                    width: 1280,
                    height: 720
                }}
                screenshotFormat="image/jpeg"
            />

            {/* Speed Warning Overlay */}
            <AnimatePresence>
                {isTooFast && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-red-500/30 z-20 pointer-events-none mix-blend-overlay"
                    />
                )}
            </AnimatePresence>

            {/* Pose Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Feedback Overlay - Centered */}
            <AnimatePresence>
                {feedback && !formWarning && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute z-20 top-32 left-1/2 transform -translate-x-1/2 pointer-events-none"
                    >
                        <div className={`bg-surface/90 backdrop-blur-md border px-8 py-4 rounded-full text-xl font-bold text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-4 ${feedback.includes('Good') ? 'border-fitness-green/50 text-fitness-green' : 'border-fitness-blue/50 text-fitness-blue'
                            }`}>
                            {feedback.includes('Good') ? (
                                <CheckCircle2 className="w-6 h-6" />
                            ) : (
                                <AlertCircle className="w-6 h-6" />
                            )}
                            {feedback}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Stats Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-8 bg-gradient-to-t from-black via-black/90 to-transparent pt-32 pointer-events-none">
                <div className="max-w-6xl mx-auto grid grid-cols-4 gap-4">
                    <StatBox label="Reps" value={reps} color="text-fitness-red" highlight />
                    <StatBox
                        label="Stage"
                        value={stage || '-'}
                        className={stage === 'UP' ? 'text-fitness-blue' : stage === 'DOWN' ? 'text-fitness-green' : 'text-zinc-500'}
                        isText
                    />
                    <StatBox label="Calories" value={calories.toFixed(1)} color="text-orange-400" />
                    <StatBox label="Time" value={formatTime(elapsedTime)} color="text-fitness-yellow" isMono />
                </div>
            </div>

            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedbackModal && sessionData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
                        >
                            {/* Header with Rating Color */}
                            <div className={`p-8 text-center ${sessionData.rating === 'excellent' ? 'bg-gradient-to-b from-fitness-green/20 to-transparent' :
                                sessionData.rating === 'good' ? 'bg-gradient-to-b from-fitness-blue/20 to-transparent' :
                                    sessionData.rating === 'average' ? 'bg-gradient-to-b from-fitness-yellow/20 to-transparent' :
                                        sessionData.rating === 'needs_work' ? 'bg-gradient-to-b from-fitness-red/20 to-transparent' :
                                            'bg-gradient-to-b from-zinc-800/50 to-transparent'
                                }`}>
                                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${sessionData.rating === 'excellent' ? 'bg-fitness-green/20 text-fitness-green' :
                                    sessionData.rating === 'good' ? 'bg-fitness-blue/20 text-fitness-blue' :
                                        sessionData.rating === 'average' ? 'bg-fitness-yellow/20 text-fitness-yellow' :
                                            sessionData.rating === 'needs_work' ? 'bg-fitness-red/20 text-fitness-red' :
                                                'bg-zinc-800 text-zinc-500'
                                    }`}>
                                    {sessionData.rating === 'excellent' && <Trophy className="w-10 h-10" />}
                                    {sessionData.rating === 'good' && <CheckCircle2 className="w-10 h-10" />}
                                    {sessionData.rating === 'average' && <Activity className="w-10 h-10" />}
                                    {sessionData.rating === 'needs_work' && <AlertTriangle className="w-10 h-10" />}
                                    {sessionData.rating === 'none' && <AlertCircle className="w-10 h-10" />}
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">{sessionData.title}</h2>
                                <p className="text-zinc-400 text-sm">{sessionData.message}</p>
                            </div>

                            {/* Stats Grid */}
                            {sessionData.reps > 0 && (
                                <div className="grid grid-cols-4 gap-2 px-6 py-4 border-t border-zinc-800">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-fitness-red">{sessionData.reps}</p>
                                        <p className="text-xs text-zinc-500">Reps</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-fitness-green">{sessionData.formAccuracy}%</p>
                                        <p className="text-xs text-zinc-500">Accuracy</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-orange-400">{sessionData.calories.toFixed(1)}</p>
                                        <p className="text-xs text-zinc-500">Calories</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-fitness-yellow">{formatTime(sessionData.duration)}</p>
                                        <p className="text-xs text-zinc-500">Time</p>
                                    </div>
                                </div>
                            )}

                            {/* Tips Section */}
                            {sessionData.tips && sessionData.tips.length > 0 && (
                                <div className="px-6 py-4 border-t border-zinc-800">
                                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Tips & Insights</h3>
                                    <ul className="space-y-2">
                                        {sessionData.tips.map((tip, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
                                                <span className="text-fitness-green mt-0.5">•</span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="p-6 border-t border-zinc-800">
                                <Button
                                    onClick={handleCloseFeedback}
                                    className="w-full h-14 text-lg font-bold rounded-xl bg-fitness-green text-black hover:bg-fitness-green/90"
                                >
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatBox({ label, value, className = "", isText = false, isMono = false, highlight = false, color = "text-white" }) {
    // Responsive sizing: smaller on mobile, larger on desktop
    let sizeClass = "text-3xl md:text-5xl"; // Default (Time)
    if (highlight) sizeClass = "text-5xl md:text-7xl"; // Reps
    if (isText) sizeClass = "text-3xl md:text-4xl"; // Stage (UP/DOWN)

    return (
        <div className="flex flex-col items-center justify-center pointer-events-auto">
            <p className="text-zinc-400 text-[10px] md:text-xs uppercase tracking-widest mb-1 md:mb-2 font-semibold">{label}</p>
            <p className={`font-bold ${sizeClass} ${isText ? 'capitalize' : ''} ${isMono ? 'font-mono tracking-tighter' : ''} ${className} ${!className.includes('text-') ? color : ''}`}>
                {value}
            </p>
        </div>
    );
}
