export function calculateAngle(a, b, c) {
    if (!a || !b || !c) return 0;
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180.0) {
        angle = 360 - angle;
    }

    return angle;
}

export const EXERCISES = {
    PUSHUP: 'pushup',
    SQUAT: 'squat',
    BICEP_CURL: 'bicep_curl',
    JUMPING_JACK: 'jumping_jacks'
};

export const EXERCISE_CONFIG = {
    [EXERCISES.PUSHUP]: {
        type: 'repetition',
        thresholds: {
            up: 160,
            down: 85
        },
        keypoints: {
            left: [11, 13, 15], // Shoulder, Elbow, Wrist
            right: [12, 14, 16]
        },
        formCheck: {
            bodyAlignment: {
                points: [11, 23, 27], // Shoulder, Hip, Ankle
                min: 150,
                message: "Keep your back straight!"
            }
        }
    },
    [EXERCISES.SQUAT]: {
        type: 'repetition',
        thresholds: {
            up: 170,
            down: 90
        },
        keypoints: {
            left: [23, 25, 27], // Hip, Knee, Ankle
            right: [24, 26, 28]
        },
        formCheck: {
            depth: {
                message: "Go lower!"
            }
        }
    },
    [EXERCISES.BICEP_CURL]: {
        type: 'repetition',
        thresholds: {
            up: 160,
            down: 45
        },
        keypoints: {
            left: [11, 13, 15], // Shoulder, Elbow, Wrist
            right: [12, 14, 16]
        },
        formCheck: {
            elbowFlare: {
                points: [11, 13, 23], // Shoulder, Elbow, Hip
                max: 30, // Elbow shouldn't flare out more than 30 degrees
                message: "Keep your elbow close to your body!"
            }
        }
    },
    [EXERCISES.JUMPING_JACK]: {
        type: 'repetition',
        thresholds: {
            up: 150, // Hands above head (shoulder-elbow-wrist angle roughly straight but vertical) - logic is different
            down: 20 // Hands down
        },
        // Jumping jacks logic is custom in the hook
    }
};
