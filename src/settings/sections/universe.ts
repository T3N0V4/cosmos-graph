export interface UniverseSettings {
    autoSpawnAmount: number;

    initialCleanRadiusRatio: number;
    initialMinRadiusRatio: number;
    initialMaxRadiusRatio: number;
    initialClusterChance: number;

    starMinSize: number;
    starMaxSize: number;
    starHueMin: number;
    starHueMax: number;

    particleColor: string;
    baseSpeed: number;

    particleGlow: number;
    particleBrightness: number;
}

export const UNIVERSE_DEFAULTS: UniverseSettings = {
    autoSpawnAmount: 1,

    initialCleanRadiusRatio: 0.28,
    initialMinRadiusRatio: 0.28,
    initialMaxRadiusRatio: 0.44,
    initialClusterChance: 0.42,

    starMinSize: 0.35,
    starMaxSize: 1.45,
    starHueMin: 200,
    starHueMax: 260,

    particleColor: "#7db7ff",
    baseSpeed: 0.22,

    particleGlow: 0.04,
    particleBrightness: 1
};
