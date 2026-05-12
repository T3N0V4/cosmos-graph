export interface BurstSettings {
    gravityCooldownMs: number;

    burstParticleLimit: number;
    burstGlowIntensity: number;
    burstGlowSize: number;

    radialBurstAmount: number;
    radialCoreAmount: number;

    directionalBurstAmount: number;
    directionalSpread: number;

    gravityBurstAmount: number;
    gravityForce: number;
    gravityDurationMs: number;
    gravityBounceDistance: number;
}

export const BURST_DEFAULTS: BurstSettings = {
    gravityCooldownMs: 2000,

    burstParticleLimit: 300,
    burstGlowIntensity: 0.18,
    burstGlowSize: 4.2,

    radialBurstAmount: 34,
    radialCoreAmount: 8,

    directionalBurstAmount: 26,
    directionalSpread: 0.14,

    gravityBurstAmount: 22,
    gravityForce: 90,
    gravityDurationMs: 3600,
    gravityBounceDistance: 14
};