export type ClickEffectMode =
    | "none"
    | "radial"
    | "directional"
    | "gravity";

export interface GeneralSettings {
    enableParticles: boolean;
    enableShootingStars: boolean;
    enableMouseField: boolean;
    enableParallax: boolean;
    clickEffectMode: ClickEffectMode;
}

export const GENERAL_DEFAULTS: GeneralSettings = {
    enableParticles: true,
    enableShootingStars: true,
    enableMouseField: true,
    enableParallax: true,
    clickEffectMode: "radial"
};