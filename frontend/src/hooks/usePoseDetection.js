import { useEffect, useRef, useState, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

// Define skeleton connections for drawing lines between joints
const POSE_CONNECTIONS = [
    // Face
    [0, 1], [1, 2], [2, 3], [3, 7], // Left eye
    [0, 4], [4, 5], [5, 6], [6, 8], // Right eye
    [9, 10], // Mouth
    // Torso
    [11, 12], // Shoulders
    [11, 23], [12, 24], // Shoulders to hips
    [23, 24], // Hips
    // Left arm
    [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
    // Right arm
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
    // Left leg
    [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
    // Right leg
    [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
];

// Color scheme for different body parts
const getLineColor = (startIdx, endIdx) => {
    // Arms - Cyan
    if ([11, 13, 15, 17, 19, 21, 12, 14, 16, 18, 20, 22].includes(startIdx) &&
        [11, 13, 15, 17, 19, 21, 12, 14, 16, 18, 20, 22].includes(endIdx)) {
        return '#00FFFF';
    }
    // Legs - Magenta
    if ([23, 25, 27, 29, 31, 24, 26, 28, 30, 32].includes(startIdx) &&
        [23, 25, 27, 29, 31, 24, 26, 28, 30, 32].includes(endIdx)) {
        return '#FF00FF';
    }
    // Torso - Yellow
    if ([11, 12, 23, 24].includes(startIdx) && [11, 12, 23, 24].includes(endIdx)) {
        return '#FFFF00';
    }
    // Face - White
    return '#FFFFFF';
};

export function usePoseDetection(videoRef, canvasRef) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [landmarks, setLandmarks] = useState(null);
    const poseRef = useRef(null);
    const cameraRef = useRef(null);
    const lastFrameTimeRef = useRef(0);
    const FRAME_INTERVAL = 1000 / 20; // 20 FPS for smoother visualization

    const onResults = useCallback((results) => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const video = videoRef.current.video;

        if (!video) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
            setLandmarks(results.poseLandmarks);
            const lm = results.poseLandmarks;

            // Draw skeleton connections (lines between joints)
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
                const start = lm[startIdx];
                const end = lm[endIdx];

                // Only draw if both points are visible enough
                if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
                    const startX = start.x * canvas.width;
                    const startY = start.y * canvas.height;
                    const endX = end.x * canvas.width;
                    const endY = end.y * canvas.height;

                    // Draw shadow for depth effect
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.lineWidth = 8;
                    ctx.stroke();

                    // Draw main line
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.strokeStyle = getLineColor(startIdx, endIdx);
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }
            }

            // Draw keypoints (joints)
            for (let i = 0; i < lm.length; i++) {
                const landmark = lm[i];
                if (landmark.visibility > 0.5) {
                    const x = landmark.x * canvas.width;
                    const y = landmark.y * canvas.height;

                    // Outer glow
                    ctx.beginPath();
                    ctx.arc(x, y, 10, 0, 2 * Math.PI);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fill();

                    // Inner circle
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, 2 * Math.PI);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fill();

                    // Core dot
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, 2 * Math.PI);
                    ctx.fillStyle = '#00FF00';
                    ctx.fill();
                }
            }
        }
        setIsLoaded(true);
        ctx.restore();
    }, [canvasRef, videoRef]);

    useEffect(() => {
        const pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        pose.setOptions({
            modelComplexity: 2,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

        pose.onResults(onResults);
        poseRef.current = pose;

        if (videoRef.current && videoRef.current.video) {
            const camera = new Camera(videoRef.current.video, {
                onFrame: async () => {
                    const now = Date.now();
                    if (now - lastFrameTimeRef.current >= FRAME_INTERVAL) {
                        lastFrameTimeRef.current = now;
                        if (videoRef.current && videoRef.current.video) {
                            await pose.send({ image: videoRef.current.video });
                        }
                    }
                },
                width: 1280,
                height: 720
            });
            camera.start();
            cameraRef.current = camera;
        }

        return () => {
            if (cameraRef.current) cameraRef.current.stop();
            if (poseRef.current) poseRef.current.close();
        };
    }, [videoRef, onResults, FRAME_INTERVAL]);

    return { isLoaded, landmarks };
}
