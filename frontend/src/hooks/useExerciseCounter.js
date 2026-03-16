import { useState, useEffect, useRef, useCallback } from 'react';
import { EXERCISES } from '../lib/poseUtils';
import { analyzeForm } from '../lib/formAnalysis';
import { EXERCISE_THRESHOLDS } from '../lib/exerciseThresholds';

const MET_VALUES = {
    [EXERCISES.PUSHUP]: 8.0,
    [EXERCISES.SQUAT]: 5.0,
    [EXERCISES.BICEP_CURL]: 4.0,
    [EXERCISES.JUMPING_JACK]: 14.0
};

const speak = (text, rate = 1.1) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        window.speechSynthesis.speak(utterance);
    }
};

export function useExerciseCounter(landmarks, exerciseType, userWeight = 70) {
    const [reps, setReps] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [stage, setStage] = useState('IDLE');
    const [currentAngle, setCurrentAngle] = useState(0);
    const [formWarning, setFormWarning] = useState('');
    const [calories, setCalories] = useState(0);
    const [score, setScore] = useState(100);
    const [isTooFast, setIsTooFast] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [goodReps, setGoodReps] = useState(0);

    // Refs for state machine
    const stageRef = useRef('IDLE');
    const repsRef = useRef(0);

    // ALL errors seen during this rep (any error = rep blocked)
    const repErrors = useRef(new Set());

    const minAngleReached = useRef(180);
    const repStartTime = useRef(0);
    const lastAngle = useRef(180);
    const smoothedAngleRef = useRef(180);
    const lastTime = useRef(0);
    const accumulatedCalories = useRef(0);
    const fastFrames = useRef(0);

    // Live warning: update immediately during active rep, throttled when idle
    const lastWarningTime = useRef(0);

    const checkFullBodyInFrame = useCallback((lms, exercise) => {
        if (!lms) return false;
        const confidence = EXERCISE_THRESHOLDS.GLOBAL.MIN_CONFIDENCE;
        const checkSide = (indices) => indices.every(i => lms[i] && lms[i].visibility > confidence);

        if (exercise === EXERCISES.BICEP_CURL) {
            return checkSide([11, 13, 15]) || checkSide([12, 14, 16]);
        } else if (exercise === EXERCISES.SQUAT) {
            return checkSide([11, 23, 25, 27]) || checkSide([12, 24, 26, 28]);
        } else if (exercise === EXERCISES.PUSHUP) {
            return checkSide([11, 13, 15, 23, 27]) || checkSide([12, 14, 16, 24, 28]);
        } else if (exercise === EXERCISES.JUMPING_JACK) {
            return checkSide([11, 12, 15, 16, 27, 28]);
        }
        return true;
    }, []);

    const calculateDynamicCalories = useCallback((duration) => {
        const met = MET_VALUES[exerciseType] || 4.0;
        const caloriesForRep = (Math.max(1, met) * userWeight * 0.0175) * (duration / 60);
        accumulatedCalories.current += caloriesForRep;
        return accumulatedCalories.current;
    }, [exerciseType, userWeight]);

    // Reset everything when exercise changes
    useEffect(() => {
        stageRef.current = 'IDLE';
        repsRef.current = 0;
        setReps(0);
        setStage('IDLE');
        setScore(100);
        setFormWarning('');
        setFeedback('');
        setCalories(0);
        setErrorCount(0);
        setGoodReps(0);
        repErrors.current.clear();
        minAngleReached.current = 180;
        smoothedAngleRef.current = 180;
        fastFrames.current = 0;
        accumulatedCalories.current = 0;
    }, [exerciseType]);

    useEffect(() => {
        if (!landmarks || !exerciseType) return;

        if (!checkFullBodyInFrame(landmarks, exerciseType)) {
            setFeedback('Please position yourself fully in frame');
            return;
        }

        // ── Biomechanics: get real-time errors & angle ──
        const { errors, metrics } = analyzeForm(landmarks, exerciseType);
        const rawAngle = metrics.depthAngle;

        // Smooth angle with EMA
        if (stageRef.current === 'IDLE' && smoothedAngleRef.current === 180 && rawAngle > 0 && rawAngle !== 180) {
            smoothedAngleRef.current = rawAngle;
        } else {
            smoothedAngleRef.current = (rawAngle * 0.45) + (smoothedAngleRef.current * 0.55);
        }

        const angle = smoothedAngleRef.current;
        setCurrentAngle(Math.round(angle));

        const thresholds = EXERCISE_THRESHOLDS[exerciseType]?.PHASES;
        if (!thresholds) return;

        const now = Date.now();
        const deltaTime = (now - lastTime.current) / 1000;

        // ── Speed check ──
        if (deltaTime > 0 && deltaTime < 1.0 && stageRef.current !== 'IDLE') {
            const speed = Math.abs(angle - lastAngle.current) / Math.max(0.01, deltaTime);
            if (speed > EXERCISE_THRESHOLDS.SPEED[exerciseType]) {
                fastFrames.current++;
                if (fastFrames.current > EXERCISE_THRESHOLDS.GLOBAL.SPEED_PERSISTENCE) {
                    repErrors.current.add('Too fast — slow down & control the movement');
                    setIsTooFast(true);
                }
            } else {
                fastFrames.current = 0;
                setIsTooFast(false);
            }
        }

        lastAngle.current = angle;
        lastTime.current = now;

        // ── Collect errors during rep ──
        const isInRep = stageRef.current !== 'IDLE';
        if (isInRep) {
            errors.forEach(e => repErrors.current.add(e));
        }

        // ── Live real-time posture warning ──
        // During an active rep: show errors immediately (no throttle)
        // When idle: throttle to once per 1.5s to avoid flicker
        const nowLive = Date.now();
        if (errors.length > 0) {
            const throttle = isInRep ? 800 : 1500;
            if (nowLive - lastWarningTime.current > throttle) {
                setFormWarning(errors[0]);
                lastWarningTime.current = nowLive;
                // Speak the first error immediately during a rep
                if (isInRep) {
                    speak(errors[0], 1.2);
                }
            }
        } else {
            // Form looks correct — clear warning after short delay
            if (nowLive - lastWarningTime.current > 1000) {
                setFormWarning('');
                lastWarningTime.current = nowLive;
            }
        }

        // ── Track extreme angle reached for depth check ──
        const isUpwardMetric = thresholds.PEAK > thresholds.START;
        if (isInRep) {
            if (isUpwardMetric) {
                if (angle > minAngleReached.current) minAngleReached.current = angle;
            } else {
                if (angle < minAngleReached.current) minAngleReached.current = angle;
            }
        }

        // ═══════════════════════════════════════════════════
        //  STATE MACHINE
        // ═══════════════════════════════════════════════════

        // 1. IDLE → ACTIVE: rep begins
        if (stageRef.current === 'IDLE') {
            const startThresh = thresholds.START;
            const crossedStart = isUpwardMetric ? angle > startThresh : angle < startThresh;

            if (crossedStart) {
                stageRef.current = 'ACTIVE';
                setStage('ACTIVE');
                setIsTooFast(false);
                repStartTime.current = now;
                minAngleReached.current = angle;
                repErrors.current.clear();
                fastFrames.current = 0;
                setFeedback('🔄 Rep in progress...');
                setFormWarning('');
            }
        }

        // 2. ACTIVE → PEAK: reached full range
        else if (stageRef.current === 'ACTIVE') {
            const peakThresh = thresholds.PEAK;
            const reachedPeak = isUpwardMetric ? angle >= peakThresh : angle <= peakThresh;

            if (reachedPeak) {
                stageRef.current = 'PEAK';
                setStage('PEAK');
            } else if (now - repStartTime.current > 15000) {
                // 15s timeout
                stageRef.current = 'IDLE';
                setStage('IDLE');
                repErrors.current.clear();
                setFeedback('Rep timed out — keep moving!');
            }
        }

        // 3. PEAK → IDLE: rep completes, evaluate quality
        else if (stageRef.current === 'PEAK') {
            const finishMargin = 15;
            const finishThresh = isUpwardMetric
                ? (thresholds.START + finishMargin)
                : (thresholds.START - finishMargin);
            const returnedToStart = isUpwardMetric
                ? (angle <= finishThresh)
                : (angle >= finishThresh);

            if (returnedToStart) {
                // ── Depth check: add error if half-rep ──
                const depthMin = EXERCISE_THRESHOLDS[exerciseType]?.ERRORS?.DEPTH_MIN_ALLOWABLE;
                if (depthMin) {
                    const depthFailed = isUpwardMetric
                        ? minAngleReached.current < depthMin
                        : minAngleReached.current > depthMin;
                    if (depthFailed) {
                        repErrors.current.add('Half rep — go through full range of motion');
                    }
                }

                const errorArr = Array.from(repErrors.current);

                // ══════════════════════════════════════════
                //  ANY error = rep BLOCKED, not counted
                // ══════════════════════════════════════════
                if (errorArr.length > 0) {
                    stageRef.current = 'IDLE';
                    setStage('IDLE');
                    setIsTooFast(false);
                    repErrors.current.clear();
                    setScore(0);
                    setErrorCount(prev => prev + 1);

                    // Show most important error prominently
                    const topError = errorArr[0];
                    setFeedback(`❌ Rep not counted!`);
                    setFormWarning(`Fix: ${topError}`);
                    speak(`Not counted. ${topError}`, 1.2);
                    return;
                }

                // ══════════════════════════════════════════
                //  PERFECT REP — zero errors, count it!
                // ══════════════════════════════════════════
                repsRef.current++;
                setReps(repsRef.current);
                setScore(100);
                setGoodReps(prev => prev + 1);
                setFeedback(`✅ Perfect! ${repsRef.current} rep${repsRef.current > 1 ? 's' : ''}`);
                setFormWarning('');
                speak(repsRef.current.toString(), 1.5);

                // Calories only for counted reps
                const duration = (now - repStartTime.current) / 1000;
                setCalories(calculateDynamicCalories(duration));

                stageRef.current = 'IDLE';
                setStage('IDLE');
                setIsTooFast(false);

            } else if (now - repStartTime.current > 12000) {
                stageRef.current = 'IDLE';
                setStage('IDLE');
                repErrors.current.clear();
                setFeedback('Rep timed out');
                setIsTooFast(false);
            }
        }

    }, [landmarks, exerciseType, checkFullBodyInFrame, calculateDynamicCalories, isTooFast]);

    return { reps, feedback, stage, currentAngle, formWarning, calories, score, isTooFast, errorCount, goodReps };
}
