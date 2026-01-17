import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    Activity,
    Flame,
    Timer,
    Calendar,
    ChevronRight,
    Play,
    Trophy,
    Dumbbell,
    Zap,
    TrendingUp,
    CheckCircle2,
    Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

// Import workout images
import pushupImg from '../assets/pushup.png';
import squatImg from '../assets/squat.png';
import bicepCurlImg from '../assets/bicep_curl.png';
import jumpingJackImg from '../assets/jumping_jack.png';
import gymBg from '../assets/gym_bg.png';

export default function Dashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({
        stats: {
            total_workouts: 0,
            total_reps: 0,
            total_duration: 0,
            total_calories: 0,
            today_reps: 0,
            today_duration: 0,
            today_calories: 0,
            streak: 0
        },
        weekly: [],
        challenge: {
            title: "Loading...",
            description: "",
            progress: 0,
            target: 1,
            unit: "",
            is_completed: false,
            type: ""
        },
        recentWorkouts: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                try {
                    const headers = { 'Authorization': `Bearer ${token}` };

                    const [statsRes, weeklyRes, challengeRes, workoutsRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/workouts/stats`, { headers }),
                        fetch(`${API_BASE_URL}/workouts/weekly`, { headers }),
                        fetch(`${API_BASE_URL}/workouts/challenge`, { headers }),
                        fetch(`${API_BASE_URL}/workouts/?limit=5`, { headers })
                    ]);

                    const stats = await statsRes.json();
                    const weekly = await weeklyRes.json();
                    const challenge = await challengeRes.json();
                    const workouts = await workoutsRes.json();

                    setDashboardData({
                        stats,
                        weekly,
                        challenge,
                        recentWorkouts: workouts
                    });
                } catch (err) {
                    console.error("Error fetching dashboard data:", err);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchData();
        }
    }, [token]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const moveGoal = 100;
    const exerciseGoal = 30;
    const caloriesGoal = 500;

    const moveProgress = Math.min((dashboardData.stats.today_reps / moveGoal) * 100, 100);
    const exerciseProgress = Math.min(((dashboardData.stats.today_duration / 60) / exerciseGoal) * 100, 100);
    const caloriesProgress = Math.min((dashboardData.stats.today_calories / caloriesGoal) * 100, 100);

    return (
        <div className="min-h-screen text-white pb-24 relative overflow-hidden">
            {/* Background Image with Blur */}
            <div className="fixed inset-0 z-0">
                <img src={gymBg} alt="Gym Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
            </div>
            <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 space-y-8">

                {/* Header */}
                <header className="flex items-start justify-between pt-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-6xl font-bold tracking-tight text-white"
                        >
                            Welcome back,
                        </motion.h1>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-6xl font-bold tracking-tight text-fitness-green"
                        >
                            {user?.full_name?.split(' ')[0] || 'there'}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-zinc-400 text-base mt-4"
                        >
                            Ready to crush your goals today?
                        </motion.p>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 hover:border-fitness-green/30 transition-all duration-300 backdrop-blur-sm group"
                    >
                        <div className="w-9 h-9 rounded-full bg-fitness-green/20 flex items-center justify-center border border-fitness-green/30 group-hover:bg-fitness-green/30 transition-colors">
                            <span className="text-fitness-green font-bold text-sm">
                                {user?.full_name?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-white text-sm font-medium leading-tight">{user?.full_name?.split(' ')[0] || 'Profile'}</p>
                            <p className="text-zinc-500 text-xs">View Profile</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-fitness-green group-hover:translate-x-1 transition-all" />
                    </motion.button>
                </header>

                {/* Activity Rings / Main Stats */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <Card className="bg-surface col-span-1 md:col-span-2 lg:col-span-1 min-h-[300px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="w-32 h-32 text-fitness-green" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-semibold mb-6">Activity</h2>
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-fitness-red font-medium">Move</span>
                                            <span className="text-fitness-red font-bold">{dashboardData.stats.today_reps} <span className="text-zinc-500 font-normal">reps</span></span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${moveProgress}%` }}
                                                transition={{ duration: 1, delay: 0.2 }}
                                                className="h-full bg-fitness-red rounded-full shadow-[0_0_10px_rgba(250,17,79,0.5)]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-fitness-green font-medium">Exercise</span>
                                            <span className="text-fitness-green font-bold">{Math.floor(dashboardData.stats.today_duration / 60)} <span className="text-zinc-500 font-normal">min</span></span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${exerciseProgress}%` }}
                                                transition={{ duration: 1, delay: 0.4 }}
                                                className="h-full bg-fitness-green rounded-full shadow-[0_0_10px_rgba(164,255,0,0.5)]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-fitness-yellow font-medium">Calories</span>
                                            <span className="text-fitness-yellow font-bold">{Math.round(dashboardData.stats.today_calories)} <span className="text-zinc-500 font-normal">kcal</span></span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${caloriesProgress}%` }}
                                                transition={{ duration: 1, delay: 0.6 }}
                                                className="h-full bg-fitness-yellow rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-zinc-800">
                                <p className="text-zinc-400 text-sm">Keep moving to close your rings!</p>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            icon={Flame}
                            value={dashboardData.stats.total_workouts}
                            label="Workouts"
                            color="text-fitness-red"
                            bgColor="bg-fitness-red/10"
                        />
                        <StatCard
                            icon={Timer}
                            value={`${Math.floor(dashboardData.stats.total_duration / 60)}m`}
                            label="Duration"
                            color="text-fitness-green"
                            bgColor="bg-fitness-green/10"
                        />
                        <StatCard
                            icon={Trophy}
                            value={dashboardData.stats.total_reps}
                            label="Total Reps"
                            color="text-fitness-yellow"
                            bgColor="bg-fitness-yellow/10"
                        />
                        <StatCard
                            icon={Zap}
                            value={dashboardData.stats.streak || 0}
                            label="Streak"
                            color="text-fitness-blue"
                            bgColor="bg-fitness-blue/10"
                        />
                    </div>
                </motion.div>

                {/* Weekly Activity Chart */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    <Card className="col-span-1 lg:col-span-2 bg-surface p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Weekly Activity</h2>
                            <div className="flex gap-4">
                                <span className="flex items-center text-xs text-zinc-400"><div className="w-2 h-2 rounded-full bg-fitness-green mr-2"></div> Exercise</span>
                                <span className="flex items-center text-xs text-zinc-400"><div className="w-2 h-2 rounded-full bg-fitness-red mr-2"></div> Move</span>
                                <span className="flex items-center text-xs text-zinc-400"><div className="w-2 h-2 rounded-full bg-fitness-yellow mr-2"></div> Calories</span>
                            </div>
                        </div>
                        <div className="h-48 flex items-end justify-between gap-2">
                            {dashboardData.weekly.map((dayData, i) => {
                                const maxExercise = 60; // 60 min goal
                                const maxReps = 100; // 100 reps goal
                                const maxCalories = 200; // 200 kcal goal per day

                                const exerciseHeight = Math.min((dayData.exercise_min / maxExercise) * 100, 100);
                                const repsHeight = Math.min((dayData.move_reps / maxReps) * 100, 100);
                                const caloriesHeight = Math.min(((dayData.calories || 0) / maxCalories) * 100, 100);

                                return (
                                    <div key={dayData.day} className="flex-1 flex flex-col justify-end gap-1 group cursor-pointer relative">
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 min-w-[120px]">
                                            <p className="text-xs font-bold text-white mb-2">{dayData.day}</p>
                                            <div className="space-y-1 text-xs">
                                                <p className="text-fitness-green">{dayData.exercise_min} min</p>
                                                <p className="text-fitness-red">{dayData.move_reps} reps</p>
                                                <p className="text-fitness-yellow">{dayData.calories || 0} kcal</p>
                                            </div>
                                        </div>

                                        {/* Bar Container */}
                                        <div className="w-full bg-zinc-800 rounded-t-sm relative h-full flex items-end overflow-hidden">
                                            {/* Exercise (Green) */}
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${exerciseHeight}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className="w-1/3 bg-fitness-green/80 absolute bottom-0 left-0 group-hover:bg-fitness-green transition-colors"
                                            />
                                            {/* Move/Reps (Red) */}
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${repsHeight}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 + 0.1 }}
                                                className="w-1/3 bg-fitness-red/80 absolute bottom-0 left-1/3 group-hover:bg-fitness-red transition-colors"
                                            />
                                            {/* Calories (Yellow) */}
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${caloriesHeight}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 + 0.2 }}
                                                className="w-1/3 bg-fitness-yellow/80 absolute bottom-0 right-0 group-hover:bg-fitness-yellow transition-colors"
                                            />
                                        </div>
                                        <span className="text-xs text-center text-zinc-500 font-medium">{dayData.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card className={`col-span-1 bg-gradient-to-br p-6 relative overflow-hidden ${dashboardData.challenge.is_completed
                        ? 'from-fitness-green/20 to-surface border-fitness-green/30'
                        : 'from-fitness-purple/20 to-surface border-fitness-purple/20'
                        }`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            {dashboardData.challenge.is_completed ? (
                                <CheckCircle2 className="w-32 h-32 text-fitness-green" />
                            ) : (
                                <Trophy className="w-32 h-32 text-fitness-purple" />
                            )}
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${dashboardData.challenge.is_completed
                                    ? 'bg-fitness-green/20 text-fitness-green'
                                    : 'bg-fitness-purple/20 text-fitness-purple'
                                    }`}>
                                    {dashboardData.challenge.is_completed ? '✓ Challenge Complete!' : 'Weekly Challenge'}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{dashboardData.challenge.title}</h3>
                                <p className="text-zinc-400 text-sm">{dashboardData.challenge.description}</p>
                            </div>
                            <div className="mt-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white font-medium">Progress</span>
                                    <span className={`font-bold ${dashboardData.challenge.is_completed ? 'text-fitness-green' : 'text-fitness-purple'
                                        }`}>
                                        {dashboardData.challenge.progress}/{dashboardData.challenge.target} {dashboardData.challenge.unit}
                                    </span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((dashboardData.challenge.progress / dashboardData.challenge.target) * 100, 100)}%` }}
                                        className={`h-full rounded-full ${dashboardData.challenge.is_completed ? 'bg-fitness-green' : 'bg-fitness-purple'
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Quick Start Section */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Workouts</h2>
                        <Button variant="ghost" size="sm" className="text-fitness-green hover:text-fitness-green" onClick={() => navigate('/workout')}>
                            See All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <WorkoutCard
                            title="Pushups"
                            subtitle="Upper Body"
                            image={pushupImg}
                            color="bg-fitness-red"
                            onClick={() => navigate('/workout', { state: { exercise: 'pushup' } })}
                        />
                        <WorkoutCard
                            title="Squats"
                            subtitle="Lower Body"
                            image={squatImg}
                            color="bg-fitness-green"
                            onClick={() => navigate('/workout', { state: { exercise: 'squat' } })}
                        />
                        <WorkoutCard
                            title="Bicep Curls"
                            subtitle="Arms"
                            image={bicepCurlImg}
                            color="bg-fitness-blue"
                            onClick={() => navigate('/workout', { state: { exercise: 'bicep_curl' } })}
                        />
                        <WorkoutCard
                            title="Jumping Jacks"
                            subtitle="Cardio"
                            image={jumpingJackImg}
                            color="bg-fitness-yellow"
                            onClick={() => navigate('/workout', { state: { exercise: 'jumping_jacks' } })}
                        />
                    </div>
                </motion.div>

                {/* Recent History */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="pb-10"
                >
                    <h2 className="text-xl font-bold mb-4">History</h2>
                    <Card className="p-0 overflow-hidden bg-surface">
                        <div className="divide-y divide-zinc-800">
                            {isLoading ? (
                                <div className="p-8 text-center text-zinc-500">Loading...</div>
                            ) : dashboardData.recentWorkouts.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500">No recent workouts</div>
                            ) : (
                                dashboardData.recentWorkouts.map((workout, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-fitness-green">
                                                <Dumbbell className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold capitalize">{workout.exercise_type.replace('_', ' ')}</p>
                                                <p className="text-xs text-zinc-500">{new Date(workout.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="font-bold text-fitness-green">{workout.reps}</p>
                                                <p className="text-xs text-zinc-500">reps</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-fitness-yellow">{Math.round(workout.calories || 0)}</p>
                                                <p className="text-xs text-zinc-500">kcal</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-zinc-400">{Math.floor(workout.duration_seconds)}s</p>
                                                <p className="text-xs text-zinc-500">time</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, value, label, color, bgColor }) {
    return (
        <Card className="flex flex-col justify-between p-5 hover:bg-zinc-800/50 transition-colors">
            <div className={`w-8 h-8 rounded-full ${bgColor} ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <h3 className="text-2xl font-bold">{value}</h3>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
            </div>
        </Card>
    );
}

function WorkoutCard({ title, subtitle, image, color, textColor = "text-white", onClick }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl p-6 text-left h-48 flex flex-col justify-between ${textColor} group`}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className={`absolute inset-0 opacity-40 mix-blend-overlay ${color}`} />
            </div>

            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Play className="w-10 h-10 fill-current drop-shadow-lg" />
            </div>

            <div className="relative z-10 mt-auto">
                <h3 className="font-bold text-2xl mb-1 drop-shadow-md">{title}</h3>
                <p className="opacity-90 text-sm font-medium drop-shadow-md">{subtitle}</p>
            </div>

            <div className="relative z-10 flex items-center text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity mt-4 text-fitness-green">
                Start Workout <ChevronRight className="w-3 h-3 ml-1" />
            </div>
        </motion.button>
    );
}
