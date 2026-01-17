import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Activity, Calendar, Clock } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function History() {
    const { token } = useAuth();
    const [workouts, setWorkouts] = useState([]);

    useEffect(() => {
        if (token) {
            fetch(`${API_BASE_URL}/workouts/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => setWorkouts(data))
                .catch(err => console.error(err));
        }
    }, [token]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-24">
            <header className="mb-12 flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">History</h1>
                    <p className="text-zinc-500 text-lg">A complete log of your training sessions.</p>
                </div>
                {/* Avatar Link */}
                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 cursor-pointer hover:border-fitness-green transition-colors">
                    <a href="/profile" className="w-full h-full flex items-center justify-center text-zinc-500 font-bold no-underline">
                        U
                    </a>
                </div>
            </header>

            <Card className="p-0 overflow-hidden bg-surface border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-highlight border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-medium text-zinc-400 uppercase tracking-wider">Exercise</th>
                                <th className="px-6 py-4 font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 font-medium text-zinc-400 uppercase tracking-wider text-right">Reps</th>
                                <th className="px-6 py-4 font-medium text-zinc-400 uppercase tracking-wider text-right">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {workouts.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-zinc-500">
                                        No workouts found.
                                    </td>
                                </tr>
                            ) : (
                                workouts.map((workout) => (
                                    <tr key={workout.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white capitalize flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-fitness-green/10 flex items-center justify-center text-fitness-green">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            {workout.exercise_type.replace('_', ' ')}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            {formatDate(workout.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 text-white font-bold text-right tabular-nums text-lg">
                                            {workout.reps}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 text-right tabular-nums">
                                            {Math.floor(workout.duration_seconds)}s
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
