import { BurstSystem } from "./burstSystem";
import {
    ClickEffectMode,
    CosmosSettings
} from "../settings/settings";

export class InteractionEffects {
    private burstCharges = 1;
    private readonly maxBurstCharges = 1;
    private burstRechargeProgress = 0;

    constructor(
        private burstSystem: BurstSystem
    ) {}

    update(delta: number, burstCooldownMs: number) {
        if (this.burstCharges >= this.maxBurstCharges) {
            this.burstRechargeProgress = burstCooldownMs;
            return;
        }

        this.burstRechargeProgress += delta;

        if (this.burstRechargeProgress >= burstCooldownMs) {
            this.burstCharges++;
            this.burstRechargeProgress = burstCooldownMs;
        }
    }

    handleClick(
        x: number,
        y: number,
        canvasWidth: number,
        canvasHeight: number,
        clickEffectMode: ClickEffectMode,
        settings: CosmosSettings
    ) {
        if (clickEffectMode === "none") {
            return;
        }

        if (this.burstCharges <= 0) {
            return;
        }

        this.burstCharges--;
        this.burstRechargeProgress = 0;

        if (clickEffectMode === "radial") {
            this.burstSystem.createRadialBurst(
                x,
                y,
                settings
            );
        }

        if (clickEffectMode === "directional") {
            this.burstSystem.createDirectionalBurst(
                x,
                y,
                settings.directionalAngle,
                settings
            );
        }

        if (clickEffectMode === "gravity") {
            this.burstSystem.createGravityBurst(
                x,
                y,
                settings
            );
        }

        this.burstSystem.limitParticles(
            settings.burstParticleLimit
        );
    }

    getBurstCooldownProgress(burstCooldownMs: number) {
        if (this.burstCharges > 0) {
            return 1;
        }

        return Math.min(
            this.burstRechargeProgress / burstCooldownMs,
            1
        );
    }

    canUseBurst() {
        return this.burstCharges > 0;
    }
}
