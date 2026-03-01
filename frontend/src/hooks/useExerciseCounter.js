import { useState, useEffect, useRef, useCallback } from 'react';
import { EXERCISES } from '../lib/poseUtils';
import { analyzeForm } from '../lib/formAnalysis';
import { EXERCISE_THRESHOLDS } from '../lib/exerciseThresholds';

// Critical errors per exercise — if any of these fire during a rep, the rep is BLOCKED
const CRITICAL_ERRORS = {
    [EXERCISES.BICEP_CURL]: [
        "Body swinging",   // Hip/torso cheat
        "Elbow swinging",  // Elbow drift
    ],
    [EXERCISES.SQUAT]: [
        "Left knee caving in",
        "Right knee caving in",
        "Leaning too far forward",
    ],
    [EXERCISES.PUSHUP]: [
        "Hips sagging",
        "Hips too high",
    ],
    [EXERCISES.JUMPING_JACK]: [],
};

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
    const [feedback, setFeedback] = useState("");
    const [stage, setStage] = useState("IDLE");
    const [currentAngle, setCurrentAngle] = useState(0);
    const [formWarning, setFormWarning] = useState("");
    const [calories, setCalories] = useState(0);
    const [score, setScore] = useState(100);
    const [isTooFast, setIsTooFast] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [goodReps, setGoodReps] = useState(0);

    // Refs for state machine
    const stageRef = useRef("IDLE");
    const repsRef = useRef(0);
    const repErrors = useRef(new Set());
    const criticalErrorsRef = useRef(new Set()); // Errors that BLOCK the rep from counting
    const minAngleReached = useRef(180);
    const repStartTime = useRef(0);
    const lastAngle = useRef(180);
    const smoothedAngleRef = useRef(180);
    const lastTime = useRef(0);
    const accumulatedCalories = useRef(0);

    // Speed Tracking
    const fastFrames = useRef(0);

    const checkFullBodyInFrame = useCallback((lms, exercise) => {
        if (!lms) return false;
        const confidence = EXERCISE_THRESHOLDS.GLOBAL.MIN_CONFIDENCE;

        const checkSide = (indices) => indices.every(i => lms[i] && lms[i].visibility > confidence);

        if (exercise === EXERCISES.BICEP_CURL) {
            // Need at least one arm fully visible (Shoulder, Elbow, Wrist)
            return checkSide([11, 13, 15]) || checkSide([12, 14, 16]);
        } else if (exercise === EXERCISES.SQUAT) {
            // Need at least one side of the body down to ankle
            return checkSide([11, 23, 25, 27]) || checkSide([12, 24, 26, 28]);
        } else if (exercise === EXERCISES.PUSHUP) {
            // Need arm and body
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

    useEffect(() => {
        // Reset state on exercise change
        stageRef.current = "IDLE";
        repsRef.current = 0;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReps(0);
        setStage("IDLE");
        setScore(100);
        setFormWarning("");
        setFeedback("");
        setCalories(0);
        repErrors.current.clear();
        criticalErrorsRef.current.clear();
        minAngleReached.current = 180;
        smoothedAngleRef.current = 180;
    }, [exerciseType]);

    useEffect(() => {
        if (!landmarks || !exerciseType) return;

        if (!checkFullBodyInFrame(landmarks, exerciseType)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFeedback("Please position yourself fully in frame");
            return;
        }

        // BIOMECHANICS: Instantaneous errors & metrics
        const { errors, metrics } = analyzeForm(landmarks, exerciseType);
        const rawAngle = metrics.depthAngle;

        // Apply Exponential Moving Average (EMA) to smooth out camera jitter
        if (stageRef.current === "IDLE" && smoothedAngleRef.current === 180 && rawAngle > 0 && rawAngle !== 180) {
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

        // Speed check (Tempo consistency)
        if (deltaTime > 0 && deltaTime < 1.0 && stageRef.current !== "IDLE") {
            const speed = Math.abs(angle - lastAngle.current) / Math.max(0.01, deltaTime);
            if (speed > EXERCISE_THRESHOLDS.SPEED[exerciseType]) {
                fastFrames.current++;
                if (fastFrames.current > EXERCISE_THRESHOLDS.GLOBAL.SPEED_PERSISTENCE) {
                    repErrors.current.add("Fast tempo (Control the movement)");
                    setIsTooFast(true);
                }
            } else {
                fastFrames.current = 0;
                if (stageRef.current !== "IDLE") setIsTooFast(false);
            }
        }

        lastAngle.current = angle;
        lastTime.current = now;

        // Collect continuous errors if we are in a rep
        if (stageRef.current !== "IDLE") {
            errors.forEach(e => {
                repErrors.current.add(e);
                const criticals = CRITICAL_ERRORS[exerciseType] || [];
                if (criticals.some(c => e.includes(c))) {
                    criticalErrorsRef.current.add(e);
                }
            });
        }

        // Determine direction of movement for the metric
        const isUpwardMetric = thresholds.PEAK > thresholds.START;

        // Track Minimum/Maximum Angle Reached during rep for depth analysis
        if (stageRef.current !== "IDLE") {
            if (isUpwardMetric) {
                if (angle > minAngleReached.current) minAngleReached.current = angle;
            } else {
                if (angle < minAngleReached.current) minAngleReached.current = angle;
            }
        }

        // STATE MACHINE
        // 1. Start Rep (Transition IDLE -> ACTIVE/CONCENTRIC)
        if (stageRef.current === "IDLE") {
            const startThresh = thresholds.START;
            const crossedStart = isUpwardMetric ? angle > startThresh : angle < startThresh;

            if (crossedStart) {
                console.log(`Rep started! Exercise: ${exerciseType}, Current Angle: ${angle}`);
                stageRef.current = "ACTIVE";
                setStage("ACTIVE");
                setIsTooFast(false);
                repStartTime.current = now;
                minAngleReached.current = angle;
                repErrors.current.clear();
                criticalErrorsRef.current.clear(); // Reset critical errors for new rep
                setFeedback("Rep started...");
                setFormWarning("");
                console.log(`STAGE TRANSITION: IDLE -> ACTIVE for ${exerciseType}`);
            }
        }
        // 2. Active Rep Tracking -> Reaching Peak
        else if (stageRef.current === "ACTIVE") {
            const peakThresh = thresholds.PEAK;
            const reachedPeak = isUpwardMetric ? angle >= peakThresh : angle <= peakThresh;

            if (reachedPeak) {
                console.log(`Peak reached! Exercise: ${exerciseType}, Current Angle: ${angle}`);
                stageRef.current = "PEAK";
                setStage("PEAK");
                console.log(`STAGE TRANSITION: ACTIVE -> PEAK for ${exerciseType}`);
            } else {
                // Stay in ACTIVE until PEAK or timeout. 
                // Don't auto-cancel on shallow movement to prevent false cancellations.
                if (now - repStartTime.current > 15000) { // 15s timeout
                    stageRef.current = "IDLE";
                    setStage("IDLE");
                    setFeedback("Rep timed out - Keep moving!");
                    console.log(`STAGE TRANSITION: ACTIVE -> IDLE (Timeout) for ${exerciseType}`);
                }
            }
        }
        // 3. Return to Start (Completion of Rep)
        else if (stageRef.current === "PEAK") {
            const finishMargin = 15;
            const finishThresh = isUpwardMetric ? (thresholds.START + finishMargin) : (thresholds.START - finishMargin);
            const returnedToStart = isUpwardMetric ? (angle <= finishThresh) : (angle >= finishThresh);

            if (returnedToStart) {
                console.log(`Rep finished! Exercise: ${exerciseType}, Total Reps: ${repsRef.current + 1}`);

                // Check for critical form violations — these CANCEL the rep entirely
                const criticalsFired = Array.from(criticalErrorsRef.current);
                if (criticalsFired.length > 0) {
                    // Rep does NOT count — bad posture detected
                    stageRef.current = "IDLE";
                    setStage("IDLE");
                    setIsTooFast(false);
                    criticalErrorsRef.current.clear();
                    repErrors.current.clear();
                    setScore(0);
                    setErrorCount(prev => prev + 1);
                    setFeedback("❌ Rep not counted — fix your form!");
                    setFormWarning(`Critical: ${criticalsFired[0]}`);
                    speak(`Form error. ${criticalsFired[0]}`, 1.2);
                    console.log(`Rep BLOCKED due to critical error: ${criticalsFired[0]}`);
                    return;
                }

                // Evaluate rep quality (minor errors)
                let repScore = 100;

                // Add depth error if available
                const depthMin = EXERCISE_THRESHOLDS[exerciseType]?.ERRORS?.DEPTH_MIN_ALLOWABLE;
                if (depthMin) {
                    const depthFailed = isUpwardMetric
                        ? minAngleReached.current < depthMin
                        : minAngleReached.current > depthMin;

                    if (depthFailed) repErrors.current.add("Half rep (Insufficient depth)");
                }

                if (repErrors.current.size > 0) {
                    repScore = Math.max(0, 100 - (repErrors.current.size * 15));
                }

                // Prepare output
                const errorArr = Array.from(repErrors.current);

                // State updates
                repsRef.current++;
                setReps(repsRef.current);
                setScore(repScore);

                if (repScore >= 85) {
                    setGoodReps(prev => prev + 1);
                    setFeedback(`Excellent! Form Score: ${repScore}/100`);
                    setFormWarning("");
                    speak(repsRef.current.toString(), 1.5);
                } else {
                    setErrorCount(prev => prev + 1);
                    setFeedback(`Score: ${repScore}/100`);
                    setFormWarning(`Issues: ${errorArr.join(' • ')}`);
                    speak(`${repsRef.current}. ${errorArr[0]}`, 1.3);
                }

                // Calories
                const duration = (now - repStartTime.current) / 1000;
                setCalories(calculateDynamicCalories(duration));

                // Reset for next
                stageRef.current = "IDLE";
                setStage("IDLE");
                setIsTooFast(false);
            } else if (now - repStartTime.current > 12000) {
                stageRef.current = "IDLE";
                setStage("IDLE");
                setFeedback("Rep timed out");
                setIsTooFast(false);
            }
        }

    }, [landmarks, exerciseType, checkFullBodyInFrame, calculateDynamicCalories, isTooFast]);

    return { reps, feedback, stage, currentAngle, formWarning, calories, score, isTooFast, errorCount, goodReps };
}
