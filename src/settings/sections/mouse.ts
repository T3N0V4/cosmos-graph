export interface MouseSettings {
    enableMouseGlow: boolean;
    mouseGlowRadius: number;
    mouseGlowConnectionOpacity: number;
    mouseGlowLineWidth: number;
    mouseGlowParticleAlpha: number;
    mouseGlowParticleSize: number;

    mouseFieldRadius: number;
    mouseRepulseStrength: number;
}

export const MOUSE_DEFAULTS: MouseSettings = {
    enableMouseGlow: true,
    mouseGlowRadius: 260,
    mouseGlowConnectionOpacity: 0.22,
    mouseGlowLineWidth: 0.55,
    mouseGlowParticleAlpha: 0.22,
    mouseGlowParticleSize: 0.45,

    mouseFieldRadius: 130,
    mouseRepulseStrength: 160
};