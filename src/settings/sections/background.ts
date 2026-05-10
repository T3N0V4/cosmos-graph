export interface BackgroundSettings {
    backgroundFarStarCount: number;
    backgroundNearStarCount: number;

    backgroundFarStarMinSize: number;
    backgroundFarStarMaxSize: number;

    backgroundNearStarMinSize: number;
    backgroundNearStarMaxSize: number;

    backgroundStarMinAlpha: number;
    backgroundStarMaxAlpha: number;

    backgroundStarHueMin: number;
    backgroundStarHueMax: number;

    backgroundFarParallax: number;
    backgroundNearParallax: number;

    backgroundFarDriftSeconds: number;
    backgroundNearDriftSeconds: number;

    backgroundPulseChance: number;
}

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
    backgroundFarStarCount: 420,
    backgroundNearStarCount: 180,

    backgroundFarStarMinSize: 0.45,
    backgroundFarStarMaxSize: 1.2,

    backgroundNearStarMinSize: 0.9,
    backgroundNearStarMaxSize: 2.2,

    backgroundStarMinAlpha: 0.2,
    backgroundStarMaxAlpha: 1,

    backgroundStarHueMin: 200,
    backgroundStarHueMax: 240,

    backgroundFarParallax: 6,
    backgroundNearParallax: 14,

    backgroundFarDriftSeconds: 180,
    backgroundNearDriftSeconds: 120,

    backgroundPulseChance: 0.06
};