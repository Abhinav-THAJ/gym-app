import { useState, useEffect, useRef, useCallback } from 'react';
import { calculateAngle, EXERCISES, EXERCISE_CONFIG } from '../lib/poseUtils';
import { EXERCISE_THRESHOLDS } from '../lib/exerciseThresholds';

// MET values (Metabolic Equivalent of Task) for calorie calculation
const MET_VALUES = {
    [EXERCISES.PUSHUP]: 8.0,
    [EXERCISES.SQUAT]: 5.0,
    [EXERCISES.BICEP_CURL]: 4.0,
    [EXERCISES.JUMPING_JACK]: 14.0
};

// Time per rep estimates
const TIME_PER_REP = {
    [EXERCISES.PUSHUP]: 6,
    [EXERCISES.SQUAT]: 6,
    [EXERCISES.BICEP_CURL]: 4,
    [EXERCISES.JUMPING_JACK]: 2
};

// Squat phase constants
const SQUAT_PHASES = {
    STANDING: 'STANDING',
    DESCENT: 'DESCENT',
    BOTTOM: 'BOTTOM',
    ASCENT: 'ASCENT'
};

// Helper to get voice settings
const getVoiceSettings = () => {
    try {
        const settings = JSON.parse(localStorage.getItem('fitai_settings') || '{}');
        return {
            repCount: settings.voiceRepCount !== false,
            formTips: settings.voiceFormTips !== false
        };
    } catch {
        return { repCount: true, formTips: true };
    }
};

// Text-to-Speech helper
const speak = (text, rate = 1.2) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }
};

export function useExerciseCounter(landmarks, exerciseType, userWeight = 70) {
    const [reps, setReps] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [stage, setStage] = useState("UP");
    const [currentAngle, setCurrentAngle] = useState(0);
    const [formWarning, setFormWarning] = useState("");
    const [calories, setCalories] = useState(0);
    const [score, setScore] = useState(0);
    const [isTooFast, setIsTooFast] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [goodReps, setGoodReps] = useState(0);

    // Refs for internal state
    const stageRef = useRef("UP");
    const repsRef = useRef(0);
    const lastFeedbackTime = useRef(0);
    const lastAudioTime = useRef(0);
    const lastRepAudioTime = useRef(0);
    const previousLandmarks = useRef(null);
    const alertCount = useRef(0);
    const startTime = useRef(Date.now());

    // Calorie tracking refs
    const repStartTime = useRef(0);
    const accumulatedCalories = useRef(0);

    // Speed detection refs
    const lastAngleRef = useRef(0);
    const lastFrameTimeRef = useRef(Date.now());
    const fastFrameCount = useRef(0);

    // Squat specific refs
    const squatPhase = useRef(SQUAT_PHASES.STANDING);
    const angleHistory = useRef([]);
    const phaseFrameCount = useRef(0);
    const postureScoreHistory = useRef([]);
    const lowPostureFrameCount = useRef(0);
    const lastErrorTime = useRef(0);
    const lastErrorCountTime = useRef(0);

    // Helper: Update feedback with cooldown
    const updateFeedback = useCallback((msg, isWarning = false) => {
        const now = Date.now();
        if (msg !== feedback || (isWarning && now - lastFeedbackTime.current > 2000)) {
            setFeedback(msg);
            if (isWarning) {
                setFormWarning(msg);
                // Count form errors (with cooldown to avoid counting the same error multiple times)
                if (now - lastErrorCountTime.current > 2000) {
                    setErrorCount(prev => prev + 1);
                    lastErrorCountTime.current = now;
                }
            }
            lastFeedbackTime.current = now;
        }
    }, [feedback]);

    // Helper: Speak feedback with cooldown
    const speakFeedback = useCallback((text, cooldown = 3000) => {
        const now = Date.now();
        const settings = getVoiceSettings();
        if (settings.formTips && now - lastAudioTime.current > cooldown) {
            speak(text);
            lastAudioTime.current = now;
        }
    }, []);

    // Helper: Announce rep count
    const announceRep = useCallback((count) => {
        const settings = getVoiceSettings();
        if (settings.repCount) {
            speak(count.toString(), 1.5);
        }
    }, []);

    // Helper: Check if full body is in frame
    const checkFullBodyInFrame = useCallback((landmarks, exercise) => {
        if (!landmarks) return false;

        // For Bicep Curls, we only need upper body
        if (exercise === EXERCISES.BICEP_CURL) {
            const upperBodyPoints = [11, 12, 13, 14, 15, 16, 23, 24];
            return upperBodyPoints.every(i => landmarks[i] && landmarks[i].visibility > 0.5);
        }

        // For others, we need full body
        const essentialPoints = [11, 12, 23, 24, 27, 28];
        return essentialPoints.every(i => landmarks[i] && landmarks[i].visibility > 0.5);
    }, []);

    // Helper: Check if landmarks are unstable
    const isLandmarkUnstable = useCallback((landmarks) => {
        if (!previousLandmarks.current) {
            previousLandmarks.current = landmarks;
            return false;
        }

        let totalMotion = 0;
        const pointsToCheck = [11, 12, 23, 24]; // Shoulders and hips

        pointsToCheck.forEach(i => {
            const prev = previousLandmarks.current[i];
            const curr = landmarks[i];
            if (prev && curr) {
                const dx = curr.x - prev.x;
                const dy = curr.y - prev.y;
                totalMotion += Math.sqrt(dx * dx + dy * dy);
            }
        });

        previousLandmarks.current = landmarks;
        return (totalMotion / pointsToCheck.length) > EXERCISE_THRESHOLDS.GLOBAL.MOVEMENT_THRESHOLD;
    }, []);

    // Helper: Smooth angle
    const getSmoothedAngle = useCallback((newAngle) => {
        angleHistory.current.push(newAngle);
        if (angleHistory.current.length > EXERCISE_THRESHOLDS.GLOBAL.SMOOTHING_WINDOW) {
            angleHistory.current.shift();
        }
        return angleHistory.current.reduce((a, b) => a + b, 0) / angleHistory.current.length;
    }, []);

    // Helper: Calculate squat posture
    const calculateSquatPosture = useCallback((landmarks, side, kneeAngle) => {
        const shoulder = side === 'left' ? landmarks[11] : landmarks[12];
        const hip = side === 'left' ? landmarks[23] : landmarks[24];
        const ankle = side === 'left' ? landmarks[27] : landmarks[28];

        // 1. Depth Score
        const targetDepth = EXERCISE_THRESHOLDS.SQUAT.ANGLES.TARGET_DEPTH;
        const depthScore = Math.max(0, 1 - Math.abs(kneeAngle - targetDepth) / EXERCISE_THRESHOLDS.SQUAT.SCORES.DEPTH_TOLERANCE);

        // 2. Alignment Score (Knee over toes)
        const knee = side === 'left' ? landmarks[25] : landmarks[26];
        const alignmentScore = Math.max(0, 1 - Math.abs(knee.x - ankle.x) * EXERCISE_THRESHOLDS.SQUAT.SCORES.ALIGNMENT_STRICTNESS);

        // 3. Spine Score (Back straightness)
        const spineAngle = calculateAngle(shoulder, hip, ankle);
        const spineScore = Math.max(0, 1 - Math.abs(180 - spineAngle) / EXERCISE_THRESHOLDS.SQUAT.SCORES.SPINE_STRICTNESS);

        const aggregate = (depthScore + alignmentScore + spineScore) / 3;

        let lowestComponent = 'depth';
        if (alignmentScore < depthScore && alignmentScore < spineScore) lowestComponent = 'alignment';
        if (spineScore < depthScore && spineScore < alignmentScore) lowestComponent = 'spine';

        return { aggregate, lowestComponent };
    }, []);

    // Calculate calories dynamically (must be defined FIRST)
    const calculateDynamicCalories = useCallback((durationSeconds, formQualityScore = 1.0) => {
        let met = MET_VALUES[exerciseType] || 4.0;

        // Dynamic MET adjustments
        if (durationSeconds > 2.0) met += 0.5;
        if (formQualityScore > 0.8) met += 0.5;
        if (formWarning) met -= 1.0;

        const caloriesForRep = (Math.max(1, met) * userWeight * 0.0175) * (durationSeconds / 60);
        accumulatedCalories.current += caloriesForRep;
        return accumulatedCalories.current;
    }, [exerciseType, userWeight, formWarning]);

    // Helper: Calculate calories (wrapper for dynamic calculation)
    const calculateCalories = useCallback(() => {
        const duration = (Date.now() - repStartTime.current) / 1000;
        return calculateDynamicCalories(duration);
    }, [calculateDynamicCalories]);

    // Reset state when exercise changes
    useEffect(() => {
        stageRef.current = "UP";
        repsRef.current = 0;
        setReps(0);
        setStage("UP");
        setFeedback("");
        setFormWarning("");
        setCurrentAngle(0);
        setCalories(0);
        setScore(0);
        setIsTooFast(false);
        setErrorCount(0);
        setGoodReps(0);
        previousLandmarks.current = null;
        alertCount.current = 0;
        startTime.current = Date.now();

        // Reset squat-specific state
        squatPhase.current = SQUAT_PHASES.STANDING;
        angleHistory.current = [];
        phaseFrameCount.current = 0;
        postureScoreHistory.current = [];
        lowPostureFrameCount.current = 0;
        lastErrorTime.current = 0;

        // Reset speed state
        lastAngleRef.current = 0;
        lastFrameTimeRef.current = Date.now();
        fastFrameCount.current = 0;
    }, [exerciseType]);

    useEffect(() => {
        if (!landmarks || !exerciseType) return;

        // Check full body visibility
        if (!checkFullBodyInFrame(landmarks, exerciseType)) {
            updateFeedback("Position yourself in frame");
            return;
        }

        // Check stability
        if (isLandmarkUnstable(landmarks)) {
            return;
        }

        const config = EXERCISE_CONFIG[exerciseType];
        if (!config) {
            console.log("No config found for exercise:", exerciseType);
            return;
        }

        // --- ADVANCED SQUAT LOGIC ---
        if (exerciseType === EXERCISES.SQUAT) {
            const leftPoints = config.keypoints.left.map(i => landmarks[i]);
            const rightPoints = config.keypoints.right.map(i => landmarks[i]);

            const leftVis = leftPoints.reduce((acc, p) => acc + (p?.visibility || 0), 0) / leftPoints.length;
            const rightVis = rightPoints.reduce((acc, p) => acc + (p?.visibility || 0), 0) / rightPoints.length;

            let side = null;
            if (leftVis > rightVis && leftVis > 0.7) {
                side = 'left';
            } else if (rightVis > 0.7) {
                side = 'right';
            }

            if (!side || leftPoints.some(p => !p || p.visibility < 0.7)) {
                updateFeedback("Position yourself in frame");
                return;
            }

            // Calculate knee angle with smoothing
            const hip = side === 'left' ? landmarks[23] : landmarks[24];
            const knee = side === 'left' ? landmarks[25] : landmarks[26];
            const ankle = side === 'left' ? landmarks[27] : landmarks[28];

            const rawKneeAngle = calculateAngle(hip, knee, ankle);
            const smoothedKneeAngle = getSmoothedAngle(rawKneeAngle);
            setCurrentAngle(Math.round(smoothedKneeAngle));

            // --- SPEED DETECTION (SQUAT) ---
            const now = Date.now();
            const deltaTime = (now - lastFrameTimeRef.current) / 1000; // Seconds

            if (deltaTime > 0.05) { // Update every ~50ms
                const deltaAngle = Math.abs(smoothedKneeAngle - lastAngleRef.current);
                const velocity = deltaAngle / deltaTime; // Degrees per second
                const threshold = EXERCISE_THRESHOLDS.SPEED[EXERCISES.SQUAT];

                if (velocity > threshold) {
                    fastFrameCount.current += 1;
                } else {
                    fastFrameCount.current = Math.max(0, fastFrameCount.current - 1);
                }

                if (fastFrameCount.current >= EXERCISE_THRESHOLDS.GLOBAL.SPEED_PERSISTENCE) {
                    setIsTooFast(true);
                    updateFeedback("Too fast! Slow down.", true);
                    speakFeedback("Too fast");
                } else if (fastFrameCount.current === 0) {
                    setIsTooFast(false);
                }

                lastAngleRef.current = smoothedKneeAngle;
                lastFrameTimeRef.current = now;
            }

            // Phase detection with persistence
            const currentPhase = squatPhase.current;
            const squatConfig = EXERCISE_THRESHOLDS.SQUAT.ANGLES;

            if (currentPhase === SQUAT_PHASES.STANDING) {
                if (smoothedKneeAngle < squatConfig.STANDING - 5) {
                    phaseFrameCount.current++;
                    if (phaseFrameCount.current >= EXERCISE_THRESHOLDS.GLOBAL.PHASE_PERSISTENCE) {
                        squatPhase.current = SQUAT_PHASES.DESCENT;
                        setStage("DESCENT");
                        repStartTime.current = Date.now();
                        phaseFrameCount.current = 0;
                    }
                } else {
                    phaseFrameCount.current = 0;
                }
            } else if (currentPhase === SQUAT_PHASES.DESCENT) {
                if (smoothedKneeAngle < squatConfig.BOTTOM_MAX) {
                    phaseFrameCount.current++;
                    if (phaseFrameCount.current >= EXERCISE_THRESHOLDS.GLOBAL.PHASE_PERSISTENCE) {
                        squatPhase.current = SQUAT_PHASES.BOTTOM;
                        setStage("BOTTOM");
                        phaseFrameCount.current = 0;
                    }
                } else {
                    phaseFrameCount.current = 0;
                }
            } else if (currentPhase === SQUAT_PHASES.BOTTOM) {
                // Evaluate posture at bottom
                const postureScores = calculateSquatPosture(landmarks, side, smoothedKneeAngle);

                // Add to history for smoothing
                postureScoreHistory.current.push(postureScores.aggregate);
                if (postureScoreHistory.current.length > EXERCISE_THRESHOLDS.GLOBAL.SMOOTHING_WINDOW) {
                    postureScoreHistory.current.shift();
                }
                const avgPostureScore = postureScoreHistory.current.reduce((a, b) => a + b, 0) / postureScoreHistory.current.length;

                // Track low posture persistence
                if (avgPostureScore < EXERCISE_THRESHOLDS.SQUAT.FEEDBACK.MIN_SCORE) {
                    lowPostureFrameCount.current++;
                } else {
                    lowPostureFrameCount.current = 0;
                }

                // Provide feedback with cooldown
                const now = Date.now();
                if (lowPostureFrameCount.current >= EXERCISE_THRESHOLDS.GLOBAL.POSTURE_PERSISTENCE &&
                    now - lastErrorTime.current > EXERCISE_THRESHOLDS.GLOBAL.ERROR_COOLDOWN) {

                    const component = postureScores.lowestComponent;
                    let message = "";

                    if (component === 'depth') {
                        message = smoothedKneeAngle > squatConfig.TARGET_DEPTH + EXERCISE_THRESHOLDS.SQUAT.FEEDBACK.DEPTH_OFFSET ?
                            "Go deeper!" : "Too deep - keep hips higher!";
                    } else if (component === 'alignment') {
                        message = "Keep your knees aligned with your feet!";
                    } else if (component === 'spine') {
                        message = "Keep your chest up and back straight!";
                    }

                    updateFeedback(message, true);
                    speakFeedback(message);
                    lastErrorTime.current = now;
                    lowPostureFrameCount.current = 0;
                } else if (lowPostureFrameCount.current === 0) {
                    setFormWarning("");
                }

                // Transition to ascent
                if (smoothedKneeAngle > squatConfig.BOTTOM_MAX + 10) {
                    phaseFrameCount.current++;
                    if (phaseFrameCount.current >= EXERCISE_THRESHOLDS.GLOBAL.PHASE_PERSISTENCE) {
                        squatPhase.current = SQUAT_PHASES.ASCENT;
                        setStage("ASCENT");
                        phaseFrameCount.current = 0;
                        postureScoreHistory.current = [];
                        lowPostureFrameCount.current = 0;
                    }
                } else {
                    phaseFrameCount.current = 0;
                }
            } else if (currentPhase === SQUAT_PHASES.ASCENT) {
                if (smoothedKneeAngle > squatConfig.STANDING) {
                    phaseFrameCount.current++;
                    if (phaseFrameCount.current >= EXERCISE_THRESHOLDS.GLOBAL.PHASE_PERSISTENCE) {
                        squatPhase.current = SQUAT_PHASES.STANDING;
                        setStage("STANDING");
                        phaseFrameCount.current = 0;

                        // Count rep with duration-based calories
                        repsRef.current += 1;
                        setReps(repsRef.current);
                        if (!formWarning) setGoodReps(prev => prev + 1);

                        const repDuration = (Date.now() - repStartTime.current) / 1000;
                        const newCalories = calculateDynamicCalories(repDuration, 1.0);
                        setCalories(newCalories);
                        setScore(repsRef.current);

                        updateFeedback("Good rep!");
                        announceRep(repsRef.current);
                    }
                } else {
                    phaseFrameCount.current = 0;
                }
            }

            return;
        }

        // --- JUMPING JACKS ---
        if (exerciseType === EXERCISES.JUMPING_JACK) {
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            const leftWrist = landmarks[15];
            const rightWrist = landmarks[16];

            if (leftShoulder?.visibility > 0.5 && rightShoulder?.visibility > 0.5 &&
                leftWrist?.visibility > 0.5 && rightWrist?.visibility > 0.5) {

                const handsUp = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
                const handsDown = leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;

                if (handsDown) {
                    alertCount.current += 1;
                } else if (handsUp) {
                    alertCount.current = 0;
                }

                if (alertCount.current >= 180) {
                    updateFeedback("Keep it going. Don't stop.", true);
                    speakFeedback("Keep it going");
                    alertCount.current = 0;
                } else {
                    setFormWarning("");
                }

                if (handsUp && stageRef.current === "DOWN") {
                    stageRef.current = "UP";
                    setStage("UP");
                    repsRef.current += 1;
                    setReps(repsRef.current);
                    if (!formWarning) setGoodReps(prev => prev + 1);

                    // Calculate rep duration and update calories
                    const repDuration = (Date.now() - repStartTime.current) / 1000;
                    const newCalories = calculateDynamicCalories(repDuration, 1.0);
                    setCalories(newCalories);
                    setScore(repsRef.current);
                    updateFeedback("Good!");
                    announceRep(repsRef.current);
                } else if (handsDown && stageRef.current === "UP") {
                    stageRef.current = "DOWN";
                    setStage("DOWN");
                    repStartTime.current = Date.now(); // Start timing the rep
                }
            }
            return;
        }

        // --- REPETITION EXERCISES (Pushup, Bicep Curl) ---
        if (!config.keypoints) return;

        const leftPoints = config.keypoints.left.map(i => landmarks[i]);
        const rightPoints = config.keypoints.right.map(i => landmarks[i]);

        const leftVis = leftPoints.reduce((acc, p) => acc + (p?.visibility || 0), 0) / leftPoints.length;
        const rightVis = rightPoints.reduce((acc, p) => acc + (p?.visibility || 0), 0) / rightPoints.length;

        let activePoints = null;
        let side = null;

        if (leftVis > rightVis && leftVis > 0.5) {
            activePoints = leftPoints;
            side = 'left';
        } else if (rightVis > 0.5) {
            activePoints = rightPoints;
            side = 'right';
        }

        if (!activePoints || activePoints.some(p => !p)) {
            updateFeedback("Position yourself in frame");
            return;
        }

        // Calculate main angle
        const angle = calculateAngle(activePoints[0], activePoints[1], activePoints[2]);
        setCurrentAngle(Math.round(angle));

        // --- SPEED DETECTION (GENERIC) ---
        const now = Date.now();
        const deltaTime = (now - lastFrameTimeRef.current) / 1000; // Seconds

        if (deltaTime > 0.05) { // Update every ~50ms
            const deltaAngle = Math.abs(angle - lastAngleRef.current);
            const velocity = deltaAngle / deltaTime; // Degrees per second
            const threshold = EXERCISE_THRESHOLDS.SPEED[exerciseType] || 200;

            if (exerciseType === EXERCISES.BICEP_CURL) {
                console.log("Speed Debug:", {
                    velocity: velocity.toFixed(2),
                    threshold,
                    fastFrames: fastFrameCount.current,
                    isTooFast,
                    deltaAngle: deltaAngle.toFixed(2),
                    deltaTime: deltaTime.toFixed(3)
                });
            }

            if (velocity > threshold) {
                fastFrameCount.current += 1;
            } else {
                fastFrameCount.current = Math.max(0, fastFrameCount.current - 1);
            }

            if (fastFrameCount.current >= EXERCISE_THRESHOLDS.GLOBAL.SPEED_PERSISTENCE) {
                setIsTooFast(true);
                updateFeedback("Too fast! Slow down.", true);
                speakFeedback("Too fast");
            } else if (fastFrameCount.current === 0) {
                setIsTooFast(false);
            }

            lastAngleRef.current = angle;
            lastFrameTimeRef.current = now;
        }

        // --- FORM CHECKS ---
        let formIssue = null;

        // PUSHUP form checks
        if (exerciseType === EXERCISES.PUSHUP) {
            const shoulder = side === 'left' ? landmarks[11] : landmarks[12];
            const hip = side === 'left' ? landmarks[23] : landmarks[24];
            const ankle = side === 'left' ? landmarks[27] : landmarks[28];
            const wrist = side === 'left' ? landmarks[15] : landmarks[16];

            if (wrist && wrist.y < EXERCISE_THRESHOLDS.PUSHUP.FEEDBACK.WRIST_Y_THRESHOLD) {
                formIssue = "Place hands on the floor!";
            }

            if (!formIssue && shoulder?.visibility > 0.5 && hip?.visibility > 0.5 && ankle?.visibility > 0.5) {
                const bodyAngle = calculateAngle(shoulder, hip, ankle);
                if (bodyAngle < EXERCISE_THRESHOLDS.PUSHUP.ANGLES.BODY_ALIGNMENT) {
                    alertCount.current += 1;
                } else {
                    alertCount.current = 0;
                }

                if (alertCount.current >= EXERCISE_THRESHOLDS.GLOBAL.ALERT_THRESHOLD) {
                    formIssue = "Keep your body in a straight line from head to heels.";
                    alertCount.current = 0;
                }
            }
        }

        // BICEP CURL form checks
        if (exerciseType === EXERCISES.BICEP_CURL) {
            const shoulder = side === 'left' ? landmarks[11] : landmarks[12];
            const elbow = side === 'left' ? landmarks[13] : landmarks[14];
            const hip = side === 'left' ? landmarks[23] : landmarks[24];

            if (shoulder?.visibility > 0.5 && elbow?.visibility > 0.5 && hip?.visibility > 0.5) {
                const elbowAngle = calculateAngle(elbow, shoulder, hip);
                if (elbowAngle > EXERCISE_THRESHOLDS.BICEP_CURL.ANGLES.ELBOW_FLARE) {
                    formIssue = "Keep elbow close to body!";
                }
            }
        }

        // Report form issue
        if (formIssue) {
            updateFeedback(formIssue, true);
            speakFeedback(formIssue, 4000);
        } else {
            setFormWarning("");
        }

        // --- STATE MACHINE FOR REP COUNTING ---
        // --- STATE MACHINE FOR REP COUNTING ---
        const thresholds = EXERCISE_THRESHOLDS[exerciseType]?.ANGLES;
        const downThreshold = thresholds?.DOWN || config.thresholds.down;
        const upThreshold = thresholds?.UP || config.thresholds.up;

        if (exerciseType === EXERCISES.BICEP_CURL) {
            console.log("Bicep Debug:", {
                angle,
                stage: stageRef.current,
                downThreshold,
                upThreshold,
                thresholdsFound: !!thresholds
            });
        }

        if (stageRef.current === "UP") {
            if (angle < downThreshold) {
                stageRef.current = "DOWN";
                setStage("DOWN");
                repStartTime.current = Date.now(); // Start timing the rep
                if (!formIssue) {
                    updateFeedback("Good depth!");
                }
            }
        } else if (stageRef.current === "DOWN") {
            if (angle > upThreshold) {
                stageRef.current = "UP";
                setStage("UP");
                repsRef.current += 1;
                setReps(repsRef.current);
                if (!formIssue && !formWarning) setGoodReps(prev => prev + 1);

                // Calculate rep duration and update calories
                const repDuration = (Date.now() - repStartTime.current) / 1000;
                const newCalories = calculateDynamicCalories(repDuration, 1.0);
                setCalories(newCalories);
                setScore(repsRef.current);
                updateFeedback("Good rep!");
                announceRep(repsRef.current);
            }
        }

    }, [landmarks, exerciseType, updateFeedback, speakFeedback, announceRep, checkFullBodyInFrame, isLandmarkUnstable, calculateCalories, getSmoothedAngle, calculateSquatPosture]);

    return { reps, feedback, stage, currentAngle, formWarning, calories, score, isTooFast, errorCount, goodReps };
}
