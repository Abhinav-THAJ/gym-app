import { EXERCISES } from './poseUtils';

export const EXERCISE_THRESHOLDS = {
    // Speed Detection Thresholds (degrees per second)
    SPEED: {
        [EXERCISES.SQUAT]: 150,
        [EXERCISES.PUSHUP]: 200,
        [EXERCISES.BICEP_CURL]: 250,
        [EXERCISES.JUMPING_JACK]: 800
    },

    // Squat Specific Thresholds
    SQUAT: {
        ANGLES: {
            STANDING: 155,      // Leg angle to be considered standing
            BOTTOM_MIN: 95,     // Minimum angle for bottom of squat
            BOTTOM_MAX: 100,    // Maximum angle to enter bottom phase
            TARGET_DEPTH: 90    // Ideal depth angle
        },
        SCORES: {
            DEPTH_TOLERANCE: 50, // Range for depth scoring
            ALIGNMENT_STRICTNESS: 2, // Multiplier for alignment deviation
            SPINE_STRICTNESS: 45 // Divisor for spine deviation
        },
        FEEDBACK: {
            MIN_SCORE: 0.7, // Minimum aggregate score to trigger feedback
            DEPTH_OFFSET: 10 // Degrees above target to trigger "Go deeper"
        }
    },

    // Pushup Specific Thresholds
    PUSHUP: {
        ANGLES: {
            UP: 160,
            DOWN: 85,
            BODY_ALIGNMENT: 160 // Min angle for body straightness
        },
        FEEDBACK: {
            WRIST_Y_THRESHOLD: 0.5 // Maximum Y position for wrist (lower is higher on screen)
        }
    },

    // Bicep Curl Specific Thresholds
    BICEP_CURL: {
        ANGLES: {
            UP: 160,
            DOWN: 45,
            ELBOW_FLARE: 48 // Max angle for elbow flare
        }
    },

    // Jumping Jack Specific Thresholds
    JUMPING_JACK: {
        ANGLES: {
            UP: 150,
            DOWN: 20
        }
    },

    // Global Sensitivity Settings
    GLOBAL: {
        MOVEMENT_THRESHOLD: 0.1,    // Landmark stability check
        SMOOTHING_WINDOW: 6,        // Frames to smooth angles over
        PHASE_PERSISTENCE: 6,       // Frames to confirm phase change
        POSTURE_PERSISTENCE: 10,    // Frames to confirm bad posture
        SPEED_PERSISTENCE: 5,       // Frames to confirm too fast
        ERROR_COOLDOWN: 5000,       // Ms between same error feedback
        ALERT_THRESHOLD: 50         // Accumulator threshold for generic alerts
    }
};
