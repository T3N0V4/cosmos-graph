export type ClickEffectMode =
    | "none"
    | "radial"
    | "directional"
    | "gravity";

export type PerformanceMode =
    | "quality"
    | "balanced"
    | "performance";

export interface GeneralSettings {
    enableBackground: boolean;
    enableParticles: boolean;
    enableShootingStars: boolean;
    enableMouseField: boolean;
    enableParallax: boolean;

    clickEffectMode: ClickEffectMode;

    particleCount: number;
    maxParticles: number;

    enableAutoSpawn: boolean;
    autoSpawnIntervalMs: number;

    performanceMode: PerformanceMode;
}

export const GENERAL_DEFAULTS: GeneralSettings = {
    enableBackground: true,
    enableParticles: true,
    enableShootingStars: true,
    enableMouseField: true,
    enableParallax: true,

    clickEffectMode: "radial",

    particleCount: 220,
    maxParticles: 1000,

    enableAutoSpawn: true,
    autoSpawnIntervalMs: 1000,

    performanceMode: "balanced"
};