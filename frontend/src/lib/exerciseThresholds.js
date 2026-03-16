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
            START: 165,       // Stand up straighter (relaxed from 160)
            PEAK: 115,        // Threshold to enter squat (relaxed from 100)
            TARGET_DEPTH: 90  // Perfect depth
        },
        ERRORS: {
            KNEE_CAVE_TOLERANCE: 0.1,     // Normalized knee cave (knee vs ankle)
            TORSO_LEAN_MIN_ANGLE: 55,     // Shoulder-hip-knee angle threshold
            DEPTH_MIN_ALLOWABLE: 125      // Half squat threshold (hip-knee-ankle)
        }
    },

    // --- PUSH-UP BIOMECHANICS ---
    [EXERCISES.PUSHUP]: {
        PHASES: {
            START: 155,       // Lockout (relaxed from 150)
            PEAK: 105,        // Bottom of pushup (relaxed from 90)
            TARGET_DEPTH: 80  // Perfect depth
        },
        ERRORS: {
            HIP_SAG_MIN_ANGLE: 155,       // Body must stay straight (shoulder-hip-ankle > 155)
            BUTT_HIGH_MAX_ANGLE: 190,     // Piking is bad
            HEAD_DROP_TOLERANCE: 0.12,    // Ear drop below shoulder
            DEPTH_MIN_ALLOWABLE: 120      // Half rep threshold
        }
    },

    // --- BICEP CURL BIOMECHANICS ---
    [EXERCISES.BICEP_CURL]: {
        PHASES: {
            START: 160,       // Arm extended (relaxed from 155)
            PEAK: 60,         // Top of curl (relaxed from 45)
            TARGET_PEAK: 35   // Perfect squeeze angle
        },
        ERRORS: {
            ELBOW_SWAY_TOLERANCE: 0.45,   // Very relaxed elbow drift (was 0.25)
            SHOULDER_SHRUG_TOLERANCE: 0.04,// Shoulder diff
            DEPTH_MIN_ALLOWABLE: 90       // Half rep threshold
        }
    },

    // --- JUMPING JACK BIOMECHANICS ---
    // Jumping jacks use the shoulder to wrist angle (180 = arms straight up, 0 = arms straight down)
    [EXERCISES.JUMPING_JACK]: {
        PHASES: {
            START: 50,          // Arms down (relaxed from 40)
            PEAK: 130           // Arms overhead
        },
        ERRORS: {
            ARMS_NOT_FULL_OVERHEAD: 130,  // If they only go up to 130 degrees -> not fully overhead
            LEGS_NOT_WIDE: 0.8            // Ratio of ankle distance to shoulder width must be > 0.8
        }
    }
};
