export type WorkerConnectionPoint = {
    index: number;
    x: number;
    y: number;
    depth: number;
};

export type WorkerMouseState = {
    x: number;
    y: number;
    influence: number;
    glowRadius: number;
    glowEnabled: boolean;
};

export type WorkerConnectionSettings = {
    connectionDistance: number;
    maxConnectionsPerParticle: number;
};

export type ConnectionWorkerRequest = {
    id: number;
    points: WorkerConnectionPoint[];
    mouse: WorkerMouseState;
    settings: WorkerConnectionSettings;
};

export type ConnectionWorkerResponse = {
    id: number;
    pairs: Array<{
        aIndex: number;
        bIndex: number;
    }>;
    gridMs: number;
    scanMs: number;
};

export function createConnectionWorker() {
    const workerSource = `
self.onmessage = (event) => {
    const request = event.data;
    const gridStart = performance.now();
    const points = request.points;
    const connectionDistance = request.settings.connectionDistance;
    const cellSize = connectionDistance;
    const grid = new Map();

    for (const point of points) {
        const cellX = Math.floor(point.x / cellSize);
        const cellY = Math.floor(point.y / cellSize);
        const cellKey = cellX + "," + cellY;
        let cell = grid.get(cellKey);

        if (!cell) {
            cell = [];
            grid.set(cellKey, cell);
        }

        cell.push(point);
    }

    const gridMs = performance.now() - gridStart;
    const scanStart = performance.now();
    const maxConnectionsPerParticle = Math.max(
        1,
        request.settings.maxConnectionsPerParticle || 4
    );
    const pairs = [];

    for (const a of points) {
        const cellX = Math.floor(a.x / cellSize);
        const cellY = Math.floor(a.y / cellSize);
        const bestCandidates = [];

        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                const neighborKey =
                    (cellX + offsetX) + "," + (cellY + offsetY);
                const neighbors = grid.get(neighborKey);

                if (!neighbors) {
                    continue;
                }

                for (const b of neighbors) {
                    if (b.index <= a.index) {
                        continue;
                    }

                    const score = getConnectionCandidateScore(
                        a,
                        b,
                        connectionDistance,
                        request.mouse
                    );

                    if (score <= 0) {
                        continue;
                    }

                    addBestConnectionCandidate(
                        bestCandidates,
                        {
                            point: b,
                            score
                        },
                        maxConnectionsPerParticle
                    );
                }
            }
        }

        for (const candidate of bestCandidates) {
            pairs.push({
                aIndex: a.index,
                bIndex: candidate.point.index
            });
        }
    }

    self.postMessage({
        id: request.id,
        pairs,
        gridMs,
        scanMs: performance.now() - scanStart
    });
};

function getConnectionCandidateScore(
    a,
    b,
    connectionDistance,
    mouse
) {
    const depthDifference = Math.abs(a.depth - b.depth);

    if (depthDifference > 0.42) {
        return 0;
    }

    const depthAverage = (a.depth + b.depth) / 2;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distanceSquared = dx * dx + dy * dy;
    const depthConnectionDistance =
        connectionDistance * (0.65 + depthAverage * 0.35);
    const maxDistanceSquared =
        depthConnectionDistance * depthConnectionDistance;

    if (distanceSquared >= maxDistanceSquared) {
        return 0;
    }

    const distance = Math.sqrt(distanceSquared);
    const opacity = 1 - distance / depthConnectionDistance;
    let mouseGlow = 0;

    if (mouse.glowEnabled) {
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const mouseDx = mouse.x - midX;
        const mouseDy = mouse.y - midY;
        const mouseDistanceSquared =
            mouseDx * mouseDx + mouseDy * mouseDy;
        const mouseGlowRadiusSquared =
            mouse.glowRadius * mouse.glowRadius;

        if (mouseDistanceSquared < mouseGlowRadiusSquared) {
            const mouseDistance =
                Math.sqrt(mouseDistanceSquared);
            mouseGlow =
                (1 - mouseDistance / mouse.glowRadius) *
                mouse.influence;
        }
    }

    return (
        opacity *
        (0.7 + depthAverage * 0.3) +
        mouseGlow * 0.25
    );
}

function addBestConnectionCandidate(
    candidates,
    candidate,
    maxCandidates
) {
    if (candidates.length < maxCandidates) {
        candidates.push(candidate);
        return;
    }

    let weakestIndex = 0;
    let weakestScore = candidates[0].score;

    for (let i = 1; i < candidates.length; i++) {
        if (candidates[i].score < weakestScore) {
            weakestScore = candidates[i].score;
            weakestIndex = i;
        }
    }

    if (candidate.score > weakestScore) {
        candidates[weakestIndex] = candidate;
    }
}
`;

    const blob = new Blob(
        [workerSource],
        {
            type: "text/javascript"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const worker =
        new Worker(url);

    return {
        worker,
        dispose: () => {
            worker.terminate();
            URL.revokeObjectURL(url);
        }
    };
}
