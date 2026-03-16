import { EXERCISES } from './poseUtils';

export const EXERCISE_THRESHOLDS = {
    // Global confidence and stability
    GLOBAL: {
        MOVEMENT_THRESHOLD: 0.1, // Max allowed random jitter between frames
        SMOOTHING_WINDOW: 5,     // EMA or average window for angles
        MIN_CONFIDENCE: 0.5,     // Ignore joints below this visibility (relaxed from 0.65)
        SPEED_PERSISTENCE: 5     // Frames before warning about speed
    },

    // Maximum speed allowed (degrees/second) before penalty
    SPEED: {
        [EXERCISES.SQUAT]: 180,       // Relaxed from 120
        [EXERCISES.PUSHUP]: 200,      // Relaxed from 150
        [EXERCISES.BICEP_CURL]: 250,  // Relaxed from 180
        [EXERCISES.JUMPING_JACK]: 1000 // Inherently fast
    },

    // --- SQUAT BIOMECHANICS ---
    [EXERCISES.SQUAT]: {
        PHASES: {
            START: 150,       // Very relaxed initial standing position
            PEAK: 130,        // Minimal depth needed to count as a rep
            TARGET_DEPTH: 100 // Perfect depth
        },
        ERRORS: {
            KNEE_CAVE_TOLERANCE: 0.15,    // More lenient knee cave
            TORSO_LEAN_MIN_ANGLE: 45,     // More lenient torso lean
            DEPTH_MIN_ALLOWABLE: 145      // Half squat threshold (very relaxed)
        }
    },

    // --- PUSH-UP BIOMECHANICS ---
    [EXERCISES.PUSHUP]: {
        PHASES: {
            START: 140,       // Very relaxed elbow lockout
            PEAK: 120,        // Very relaxed bottom of pushup
            TARGET_DEPTH: 90  // Perfect depth
        },
        ERRORS: {
            HIP_SAG_MIN_ANGLE: 135,       // Very lenient sagging allowance
            BUTT_HIGH_MAX_ANGLE: 210,     // Very lenient piking allowance
            HEAD_DROP_TOLERANCE: 0.20,    // Very lenient ear drop
            DEPTH_MIN_ALLOWABLE: 135      // Half rep threshold
        }
    },

    // --- BICEP CURL BIOMECHANICS ---
    [EXERCISES.BICEP_CURL]: {
        PHASES: {
            START: 145,       // Very relaxed arm extension
            PEAK: 75,         // Very relaxed top of curl
            TARGET_PEAK: 45   // Perfect squeeze angle
        },
        ERRORS: {
            ELBOW_SWAY_TOLERANCE: 0.80,   // Extremely relaxed elbow drift
            SHOULDER_SHRUG_TOLERANCE: 0.08,// Very relaxed shoulder diff
            DEPTH_MIN_ALLOWABLE: 100      // Half rep threshold
        }
    },

    // --- JUMPING JACK BIOMECHANICS ---
    // Jumping jacks use the shoulder to wrist angle (180 = arms straight up, 0 = arms straight down)
    [EXERCISES.JUMPING_JACK]: {
        PHASES: {
            START: 60,          // Very relaxed arms down
            PEAK: 110           // Very relaxed arms overhead
        },
        ERRORS: {
            ARMS_NOT_FULL_OVERHEAD: 100,  // Very relaxed overhead check
            LEGS_NOT_WIDE: 0.6            // Very relaxed leg spread check
        }
    }
};
