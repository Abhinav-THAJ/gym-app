export function calculateAngle2D(a, b, c) {
    if (!a || !b || !c) return 0;
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
}

export function calculateAngle(a, b, c) {
    if (!a || !b || !c) return 0;

    // Check if we have 3D coordinates (x, y, z)
    if (a.z !== undefined && b.z !== undefined && c.z !== undefined) {
        // Create vectors BA and BC
        const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
        const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

        // Dot product
        const dotProduct = (ba.x * bc.x) + (ba.y * bc.y) + (ba.z * bc.z);

        // Magnitudes
        const magBa = Math.sqrt(ba.x * ba.x + ba.y * ba.y + ba.z * ba.z);
        const magBc = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z);

        // Avoid division by zero
        if (magBa === 0 || magBc === 0) return 0;

        // Calculate angle and convert to degrees
        let angle = Math.acos(dotProduct / (magBa * magBc));
        return Math.abs(angle * 180.0 / Math.PI);
    }

    // Fallback to 2D calculate angle if z is not present
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
