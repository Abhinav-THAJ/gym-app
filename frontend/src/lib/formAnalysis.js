import { calculateAngle, calculateAngle2D, EXERCISES } from './poseUtils';
import { EXERCISE_THRESHOLDS } from './exerciseThresholds';

// MediaPipe landmark indices reference:
// 0=nose, 7=leftEar, 8=rightEar, 11=leftShoulder, 12=rightShoulder
// 13=leftElbow, 14=rightElbow, 15=leftWrist, 16=rightWrist
// 23=leftHip, 24=rightHip, 25=leftKnee, 26=rightKnee, 27=leftAnkle, 28=rightAnkle

function getDistance(a, b) {
    if (!a || !b) return 0;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function getShoulderWidth(landmarks) {
    const l = landmarks[11];
    const r = landmarks[12];
    if (l && r && l.visibility > 0.4 && r.visibility > 0.4) {
        return Math.max(0.05, getDistance(l, r));
    }
    return 0.15;
}

function getBestTargetSide(landmarks, leftIndices, rightIndices) {
    const leftVis = leftIndices.reduce((sum, i) => sum + (landmarks[i]?.visibility || 0), 0);
    const rightVis = rightIndices.reduce((sum, i) => sum + (landmarks[i]?.visibility || 0), 0);
    if (leftVis < 0.25 * leftIndices.length && rightVis < 0.25 * rightIndices.length) return null;
    return leftVis > rightVis ? leftIndices : rightIndices;
}

function lm(landmarks, i) {
    const p = landmarks[i];
    return p && p.visibility > 0.3 ? p : null;
}

const AnalysisModules = {

    // ─── SQUAT ───────────────────────────────────────────────────────
    // Key metric: Hip-Knee-Ankle angle (decreases as you squat down)
    // Full posture checks: knee cave, torso lean, back rounding, back heel
    [EXERCISES.SQUAT]: (landmarks) => {
        const errors = [];
        const config = EXERCISE_THRESHOLDS[EXERCISES.SQUAT].ERRORS;
        const shoulderWidth = getShoulderWidth(landmarks);

        const lShoulder = lm(landmarks, 11);
        const rShoulder = lm(landmarks, 12);
        const lHip = lm(landmarks, 23);
        const rHip = lm(landmarks, 24);
        const lKnee = lm(landmarks, 25);
        const rKnee = lm(landmarks, 26);
        const lAnkle = lm(landmarks, 27);
        const rAnkle = lm(landmarks, 28);

        // ── 1. Knee Valgus (knees collapsing inward) ──
        if (lKnee && lAnkle) {
            const kneeInward = (lAnkle.x - lKnee.x) / shoulderWidth;
            if (kneeInward > config.KNEE_CAVE_TOLERANCE) errors.push("Left knee caving in");
        }
        if (rKnee && rAnkle && !errors.find(e => e.includes("knee caving"))) {
            const kneeInward = (rKnee.x - rAnkle.x) / shoulderWidth;
            if (kneeInward > config.KNEE_CAVE_TOLERANCE) errors.push("Right knee caving in");
        }

        // ── 2. Torso / Forward Lean (Shoulder–Hip–Knee angle) ──
        const sideForTorso = getBestTargetSide(landmarks, [11, 23, 25], [12, 24, 26]);
        if (sideForTorso) {
            const torsoAngle = calculateAngle2D(
                landmarks[sideForTorso[0]],  // shoulder
                landmarks[sideForTorso[1]],  // hip
                landmarks[sideForTorso[2]]   // knee
            );
            if (torsoAngle < config.TORSO_LEAN_MIN_ANGLE) {
                errors.push("Leaning too far forward – keep chest up");
            }
        }

        // ── 3. Back Rounding (Shoulder too far ahead of Hip horizontally) ──
        if (lShoulder && lHip) {
            const fwdLean = (lShoulder.x - lHip.x) / shoulderWidth;
            if (Math.abs(fwdLean) > 0.35) errors.push("Back rounding – brace your core");
        }

        // ── 4. Hip Drop (asymmetric hips) ──
        if (lHip && rHip) {
            const hipDrop = Math.abs(lHip.y - rHip.y) / shoulderWidth;
            if (hipDrop > 0.12) errors.push("Hip dropping to one side");
        }

        // ── 5. Shoulder Alignment (shoulder over ankle, not toes) ──
        if (lShoulder && lAnkle) {
            const shoulderForward = (lAnkle.x - lShoulder.x) / shoulderWidth;
            if (shoulderForward < -0.5) errors.push("Shoulders too far forward");
        }

        // ─── DEPTH ANGLE (Hip–Knee–Ankle for rep counting) ───
        const side = getBestTargetSide(landmarks, [23, 25, 27], [24, 26, 28]);
        let depthAngle = 180;
        if (side) {
            depthAngle = calculateAngle2D(landmarks[side[0]], landmarks[side[1]], landmarks[side[2]]);
        } else if (lHip && lKnee && lAnkle) {
            depthAngle = calculateAngle2D(lHip, lKnee, lAnkle);
        } else if (rHip && rKnee && rAnkle) {
            depthAngle = calculateAngle2D(rHip, rKnee, rAnkle);
        }

        return { errors, metrics: { depthAngle } };
    },

    // ─── PUSH-UP ──────────────────────────────────────────────────────
    // Key metric: Shoulder–Elbow–Wrist angle (decreases as you lower)
    // Full posture checks: hip sag, hip pike, head dropping, elbow flare, body line
    [EXERCISES.PUSHUP]: (landmarks) => {
        const errors = [];
        const config = EXERCISE_THRESHOLDS[EXERCISES.PUSHUP].ERRORS;
        const shoulderWidth = getShoulderWidth(landmarks);

        const lShoulder = lm(landmarks, 11);
        const rShoulder = lm(landmarks, 12);
        const lElbow = lm(landmarks, 13);
        const rElbow = lm(landmarks, 14);
        const lWrist = lm(landmarks, 15);
        const rWrist = lm(landmarks, 16);
        const lHip = lm(landmarks, 23);
        const rHip = lm(landmarks, 24);
        const lAnkle = lm(landmarks, 27);
        const rAnkle = lm(landmarks, 28);
        const lEar = lm(landmarks, 7);

        // ── 1. Body Line / Hip Sag (Shoulder–Hip–Ankle angle) ──
        const sideBody = getBestTargetSide(landmarks, [11, 23, 27], [12, 24, 28]);
        if (sideBody) {
            const bodyAngle = calculateAngle2D(
                landmarks[sideBody[0]], landmarks[sideBody[1]], landmarks[sideBody[2]]
            );
            if (bodyAngle < config.HIP_SAG_MIN_ANGLE) {
                errors.push("Hips sagging – keep body in a straight line");
            } else if (bodyAngle > config.BUTT_HIGH_MAX_ANGLE) {
                errors.push("Hips too high – lower your hips");
            }
        }

        // ── 2. Head dropping ──
        if (lEar && lShoulder) {
            if (lEar.y > lShoulder.y + config.HEAD_DROP_TOLERANCE) {
                errors.push("Head dropping – keep neck neutral");
            }
        }

        // ── 3. Elbow Flaring (elbow width vs shoulder width) ──
        if (lElbow && rElbow) {
            const elbowDist = getDistance(lElbow, rElbow);
            if ((elbowDist / shoulderWidth) > 2.5) {
                errors.push("Elbows flaring out – tuck elbows closer");
            }
        }

        // ── 4. Asymmetric hip position ──
        if (lHip && rHip) {
            const hipDiff = Math.abs(lHip.y - rHip.y) / shoulderWidth;
            if (hipDiff > 0.15) errors.push("Hips rotated – keep level");
        }

        // ── 5. Shoulder blades (shoulder higher/lower vs hip during rep) ──
        if (lShoulder && rShoulder) {
            const shoulderDiff = Math.abs(lShoulder.y - rShoulder.y) / shoulderWidth;
            if (shoulderDiff > 0.1) errors.push("Shoulders uneven");
        }

        // ─── DEPTH ANGLE (Shoulder–Elbow–Wrist) ───
        const side = getBestTargetSide(landmarks, [11, 13, 15], [12, 14, 16]);
        let depthAngle = 180;
        if (side) {
            depthAngle = calculateAngle2D(landmarks[side[0]], landmarks[side[1]], landmarks[side[2]]);
        } else if (lShoulder && lElbow && lWrist) {
            depthAngle = calculateAngle2D(lShoulder, lElbow, lWrist);
        } else if (rShoulder && rElbow && rWrist) {
            depthAngle = calculateAngle2D(rShoulder, rElbow, rWrist);
        }

        return { errors, metrics: { depthAngle } };
    },

    // ─── BICEP CURL ───────────────────────────────────────────────────
    // Key metric: Shoulder–Elbow–Wrist angle (decreases as you curl up)
    // Full posture checks: elbow sway, shoulder shrug, back lean, wrist curl
    [EXERCISES.BICEP_CURL]: (landmarks) => {
        const errors = [];
        const config = EXERCISE_THRESHOLDS[EXERCISES.BICEP_CURL].ERRORS;
        const shoulderWidth = getShoulderWidth(landmarks);

        const lShoulder = lm(landmarks, 11);
        const rShoulder = lm(landmarks, 12);
        const lHip = lm(landmarks, 23);
        const rHip = lm(landmarks, 24);
        const lElbow = lm(landmarks, 13);
        const rElbow = lm(landmarks, 14);
        const nose = lm(landmarks, 0);

        // Best arm for rep counting
        const side = getBestTargetSide(landmarks, [11, 13, 15, 23], [12, 14, 16, 24]);
        let depthAngle = 180;

        if (side) {
            const shoulder = landmarks[side[0]];
            const elbow = landmarks[side[1]];
            const wrist = landmarks[side[2]];
            const hip = landmarks[side[3]];

            if (shoulder && elbow && wrist) {
                depthAngle = calculateAngle2D(shoulder, elbow, wrist);
            }

            // ── 1. Elbow drifting forward (upper arm should stay vertical) ──
            if (shoulder && elbow && hip) {
                // Elbow should not move forward of the shoulder on Y axis
                const elbowForward = (shoulder.x - elbow.x) / shoulderWidth;
                // Use config.ELBOW_SWAY_TOLERANCE (which we relaxed to 0.80) instead of hardcoded 0.25
                if (Math.abs(elbowForward) > config.ELBOW_SWAY_TOLERANCE) {
                    errors.push("Elbow swinging – keep it pinned to your side");
                }
            }
        }

        // ── 2. Shoulder shrug / compensation ──
        if (lShoulder && rShoulder) {
            const shoulderDiff = Math.abs(lShoulder.y - rShoulder.y);
            if (shoulderDiff > config.SHOULDER_SHRUG_TOLERANCE) {
                errors.push("Shoulder shrugging – keep shoulders down");
            }
        }

        // ── 3. Back lean (torso swinging back to cheat the curl) ──
        const sideTorso = getBestTargetSide(landmarks, [11, 23], [12, 24]);
        if (sideTorso) {
            const shoulder = landmarks[sideTorso[0]];
            const hip = landmarks[sideTorso[1]];
            if (shoulder && hip) {
                const leanAngle = Math.abs(shoulder.x - hip.x) / shoulderWidth;
                // Relaxed from 0.2 to 0.65 to allow significantly more body swing
                if (leanAngle > 0.65) {
                    errors.push("Body swinging – stay upright");
                }
            }
        }

        // ── 4. Both elbows – check left and right ──
        if (lElbow && lShoulder && lHip) {
            const leftElbowFwd = Math.abs(lShoulder.x - lElbow.x) / shoulderWidth;
            if (leftElbowFwd > 0.3) errors.push("Left elbow drifting");
        }
        if (rElbow && rShoulder && rHip && !errors.find(e => e.includes("elbow"))) {
            const rightElbowFwd = Math.abs(rShoulder.x - rElbow.x) / shoulderWidth;
            if (rightElbowFwd > 0.3) errors.push("Right elbow drifting");
        }

        // ── 5. Head forward (common cheat - chin jutting out) ──
        if (nose && lShoulder) {
            const headFwd = (lShoulder.x - nose.x) / shoulderWidth;
            if (headFwd > 0.35) errors.push("Head jutting forward – chin tucked");
        }

        return { errors, metrics: { depthAngle } };
    },

    // ─── JUMPING JACKS ────────────────────────────────────────────────
    // Key metric: Hip–Shoulder–Elbow angle (increases as arms raise)
    // Full posture checks: arms overhead, legs wide, symmetry
    [EXERCISES.JUMPING_JACK]: (landmarks) => {
        const errors = [];
        const config = EXERCISE_THRESHOLDS[EXERCISES.JUMPING_JACK].ERRORS;
        const shoulderWidth = getShoulderWidth(landmarks);

        const lShoulder = lm(landmarks, 11);
        const rShoulder = lm(landmarks, 12);
        const lWrist = lm(landmarks, 15);
        const rWrist = lm(landmarks, 16);
        const lAnkle = lm(landmarks, 27);
        const rAnkle = lm(landmarks, 28);
        const lHip = lm(landmarks, 23);
        const rHip = lm(landmarks, 24);

        // ─── Arm angle for rep counting (Hip–Shoulder–Wrist) ───
        const lHipPoint = lHip || lm(landmarks, 23);
        const rHipPoint = rHip || lm(landmarks, 24);
        let depthAngle = 0;

        if (lShoulder && lWrist && lHipPoint) {
            const leftArm = calculateAngle2D(lHipPoint, lShoulder, lWrist);
            const rightArm = (rShoulder && rWrist && rHipPoint)
                ? calculateAngle2D(rHipPoint, rShoulder, rWrist)
                : leftArm;
            depthAngle = (leftArm + rightArm) / 2;
        } else if (rShoulder && rWrist && rHipPoint) {
            depthAngle = calculateAngle2D(rHipPoint, rShoulder, rWrist);
        }

        // ── 1. Legs not wide enough (ankle distance vs shoulder width) ──
        if (lAnkle && rAnkle) {
            const legDist = getDistance(lAnkle, rAnkle) / shoulderWidth;
            if (legDist < config.LEGS_NOT_WIDE) {
                errors.push("Spread legs wider apart");
            }
        }

        // ── 2. Arms not fully overhead ──
        if (lWrist && lShoulder && lWrist.y < lShoulder.y) {
            if (rWrist && rShoulder && rWrist.y < rShoulder.y) {
                const armSpan = (lWrist && rWrist) ? getDistance(lWrist, rWrist) : 0;
                if (armSpan / shoulderWidth < 0.5) {
                    errors.push("Bring arms fully overhead");
                }
            }
        }

        // ── 3. Hip drop / asymmetry during jacks ──
        if (lHip && rHip) {
            const hipDiff = Math.abs(lHip.y - rHip.y) / shoulderWidth;
            if (hipDiff > 0.1) errors.push("Hips uneven");
        }

        // ── 4. Shoulder symmetry ──
        if (lShoulder && rShoulder) {
            const diff = Math.abs(lShoulder.y - rShoulder.y) / shoulderWidth;
            if (diff > 0.1) errors.push("Shoulders uneven");
        }

        return { errors, metrics: { depthAngle } };
    }
};

export function analyzeForm(landmarks, exerciseType) {
    if (!landmarks || !exerciseType) return { errors: [], metrics: { depthAngle: 0 } };
    const analyzer = AnalysisModules[exerciseType];
    if (!analyzer) return { errors: [], metrics: { depthAngle: 0 } };
    return analyzer(landmarks);
}
