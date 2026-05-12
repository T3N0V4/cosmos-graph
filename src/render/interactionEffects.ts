import { BurstSystem } from "./burstSystem";
import { ClickEffectMode } from "../settings/settings";

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
        particleLimit: number
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
            this.burstSystem.createRadialBurst(x, y);
        }

        if (clickEffectMode === "directional") {
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;

            const dx = x - centerX;
            const dy = y - centerY;

            const angle = Math.atan2(dy, dx);

            this.burstSystem.createDirectionalBurst(x, y, angle);
        }

        if (clickEffectMode === "gravity") {
            this.burstSystem.createGravityBurst(x, y);
        }

        this.burstSystem.limitParticles(particleLimit);
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