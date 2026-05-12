export interface UniverseSettings {
    particleCount: number;
    maxParticles: number;

    enableAutoSpawn: boolean;
    autoSpawnIntervalMs: number;
    autoSpawnAmount: number;

    initialCleanRadiusRatio: number;
    initialMinRadiusRatio: number;
    initialMaxRadiusRatio: number;
    initialClusterChance: number;

    starMinSize: number;
    starMaxSize: number;
    starHueMin: number;
    starHueMax: number;
    baseSpeed: number;
}

export const UNIVERSE_DEFAULTS: UniverseSettings = {
    particleCount: 220,
    maxParticles: 320,

    enableAutoSpawn: true,
    autoSpawnIntervalMs: 1000,
    autoSpawnAmount: 1,

    initialCleanRadiusRatio: 0.28,
    initialMinRadiusRatio: 0.28,
    initialMaxRadiusRatio: 0.44,
    initialClusterChance: 0.42,

    starMinSize: 0.35,
    starMaxSize: 1.45,
    starHueMin: 200,
    starHueMax: 260,
    baseSpeed: 0.22
};