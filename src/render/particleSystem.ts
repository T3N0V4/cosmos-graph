// src/render/particleSystem.ts

import type { CosmosSettings } from "../settings/settings";

export type GalaxyParticle = {
    x: number;
    y: number;

    size: number;
    density: number;
    hue: number;

    speedX: number;
    speedY: number;

    vx: number;
    vy: number;

    kind: "ambient" | "burst" | "deep";

    depth?: number;

    life?: number;
    maxLife?: number;

    gravityX?: number;
    gravityY?: number;

    bounceCount?: number;
    maxBounces?: number;

    gravityTime?: number;
    maxGravityTime?: number;
    affectedByGravity?: boolean;

    glow?: number;
    connectionAge?: number;
    connectionFadeDuration?: number;
};

export type MouseState = {
    x: number;
    y: number;
    radius: number;
    isInside?: boolean;
};

type ConnectionRenderPoint = {
    particle: GalaxyParticle;
    index: number;
    x: number;
    y: number;
    depth: number;
};

type ConnectionBucket = {
    opacity: number;
    lineWidth: number;
    path: Path2D;
    count: number;
};

type ConnectionPair = {
    aIndex: number;
    bIndex: number;
};

type ConnectionCandidate = {
    point: ConnectionRenderPoint;
    score: number;
};

type ParticleColorProfile = {
    saturation: number;
    lightness: number;
};

export type ParticleSystemDebugMetrics = {
    drawParticlesMs: number;
    drawConnectionsMs: number;

    connectionGridMs: number;
    connectionScanMs: number;
    connectionStrokeMs: number;

    connectionSegments: number;
    connectionBuckets: number;
    connectionRenderPoints: number;

    particleCount: number;
};

export class ParticleSystem {
    private particles: GalaxyParticle[] = [];
    private spawnTimer = 0;
    private clusterPoints: { x: number; y: number }[] = [];
    private currentMaxParticles = 320;

    private lastWidth = 0;
    private lastHeight = 0;

    private resizeGraceTime = 0;
    private resizeGraceDuration = 180;
    private mouseInfluence = 0;
    /*
        Connection cache:
        - Las partículas se siguen moviendo cada frame.
        - Las conexiones se recalculan cada cierto tiempo.
        - Cada frame se redibujan usando posiciones actuales.
    */
    private cachedConnectionPairs: ConnectionPair[] = [];
    private lastConnectionCacheTime = 0;
    private connectionCacheIntervalMs = 80;

    private debugMetrics: ParticleSystemDebugMetrics = {
        drawParticlesMs: 0,
        drawConnectionsMs: 0,

        connectionGridMs: 0,
        connectionScanMs: 0,
        connectionStrokeMs: 0,

        connectionSegments: 0,
        connectionBuckets: 0,
        connectionRenderPoints: 0,

        particleCount: 0
    };

    hasParticles() {
        return this.particles.length > 0;
    }

    getParticleCount() {
        return this.particles.length;
    }

    getDebugMetrics() {
        return this.debugMetrics;
    }

    applyVisualSettings(_settings: CosmosSettings) {}

    addAmbientParticle(particle: GalaxyParticle) {
        this.particles.push({
            ...particle,
            kind: "ambient",
            depth: particle.depth ?? this.randomDepth(),
            life: undefined,
            maxLife: undefined,
            gravityX: undefined,
            gravityY: undefined,
            bounceCount: undefined,
            maxBounces: undefined,
            gravityTime: undefined,
            maxGravityTime: undefined,
            affectedByGravity: undefined,
            glow: 0
        });

        this.limitParticles(this.currentMaxParticles);
        this.invalidateConnectionCache();
    }

    createParticles(
        width: number,
        height: number,
        amount: number,
        settings: CosmosSettings
    ) {
        if (width <= 0 || height <= 0) return;
        this.lastWidth = width;
        this.lastHeight = height;
        this.resizeGraceTime = 0;
        this.currentMaxParticles = settings.maxParticles;

        const safeAmount = Math.min(
            amount,
            settings.maxParticles
        );

        this.particles = [];
        this.generateClusterPoints(width, height);

        for (let i = 0; i < safeAmount; i++) {
            this.particles.push(
                this.createInitialUniverseParticle(
                    width,
                    height,
                    settings
                )
            );
        }

        this.limitParticles(settings.maxParticles);
        this.invalidateConnectionCache();
    }

    update(
        width: number,
        height: number,
        mouse: MouseState,
        delta: number,
        settings: CosmosSettings
    ) {
        if (width <= 0 || height <= 0) {
            return;
            }

            this.handleResize(
                width,
                height
            );

            if (this.resizeGraceTime > 0) {
                this.resizeGraceTime =
                    Math.max(
                        0,
                        this.resizeGraceTime - delta
                    );
            }
        this.currentMaxParticles = settings.maxParticles;

        this.generateProgressively(
            width,
            height,
            delta,
            settings
        );

        this.limitParticles(settings.maxParticles);

        const targetMouseInfluence =
            mouse.isInside === true
                ? 1
                : 0;

        const mouseFadeSpeed =
            targetMouseInfluence > this.mouseInfluence
                ? 0.018
                : 0.006;

        this.mouseInfluence +=
            (
                targetMouseInfluence -
                this.mouseInfluence
            ) *
            Math.min(
                1,
                delta * mouseFadeSpeed
            );

        const mouseFieldEnabled =
            settings.enableMouseField &&
            this.mouseInfluence > 0.01 &&
            mouse.x >= 0 &&
            mouse.y >= 0;

        const mouseFieldRadiusSquared =
            settings.mouseFieldRadius *
            settings.mouseFieldRadius;

        const baseSpeedForce =
            this.getBaseSpeedMultiplier(settings);

        for (const particle of this.particles) {
            if (
                particle.connectionAge !== undefined &&
                particle.connectionFadeDuration !== undefined
            ) {
                particle.connectionAge += delta;

                if (
                    particle.connectionAge >
                    particle.connectionFadeDuration
                ) {
                    particle.connectionAge =
                        particle.connectionFadeDuration;
                }
            }

            const depth = particle.depth ?? 1;

            const depthMotion =
                particle.kind === "deep"
                    ? 0.08
                    : 0.35 + depth * 0.65;

            particle.speedX +=
                this.random(-0.006, 0.006) *
                depthMotion *
                baseSpeedForce;

            particle.speedY +=
                this.random(-0.006, 0.006) *
                depthMotion *
                baseSpeedForce;

            particle.speedX *= 0.992;
            particle.speedY *= 0.992;

            if (
                mouseFieldEnabled &&
                particle.kind === "ambient"
            ) {
                const mouseDx = mouse.x - particle.x;
                const mouseDy = mouse.y - particle.y;

                const mouseDistanceSquared =
                    mouseDx * mouseDx +
                    mouseDy * mouseDy;

                if (
                    mouseDistanceSquared <
                    mouseFieldRadiusSquared
                ) {
                    const mouseDistance =
                        Math.sqrt(mouseDistanceSquared) || 1;

                    const force =
                        (
                            settings.mouseFieldRadius -
                            mouseDistance
                        ) / settings.mouseFieldRadius;

                    const depthForce =
                        force *
                        settings.mouseRepulseStrength *
                        depthMotion *
                        this.mouseInfluence;

                    const directionX =
                        mouseDx / mouseDistance;

                    const directionY =
                        mouseDy / mouseDistance;

                    particle.vx -=
                        directionX *
                        depthForce /
                        particle.density;

                    particle.vy -=
                        directionY *
                        depthForce /
                        particle.density;
                }
            }

            if (
                particle.affectedByGravity &&
                particle.gravityX !== undefined &&
                particle.gravityY !== undefined
            ) {
                const dx = particle.gravityX - particle.x;
                const dy = particle.gravityY - particle.y;

                const dist =
                    Math.sqrt(dx * dx + dy * dy) || 1;

                const dirX = dx / dist;
                const dirY = dy / dist;

                const attractionForce = Math.min(
                    2.8,
                    dist * 0.012
                );

                particle.vx += dirX * attractionForce;
                particle.vy += dirY * attractionForce;

                if (dist < 120) {
                    particle.vx *= 0.90;
                    particle.vy *= 0.90;
                }

                particle.vx *= 0.94;
                particle.vy *= 0.94;
            }

            particle.x +=
                (
                    particle.speedX +
                    particle.vx * 0.05
                ) * depthMotion;

            particle.y +=
                (
                    particle.speedY +
                    particle.vy * 0.05
                ) * depthMotion;

            particle.vx *= 0.95;
            particle.vy *= 0.95;

            if (this.resizeGraceTime <= 0) {
            if (particle.x < -50) particle.x = width + 50;
            if (particle.x > width + 50) particle.x = -50;
            if (particle.y < -50) particle.y = height + 50;
            if (particle.y > height + 50) particle.y = -50;
        } else {
            particle.x =
                Math.max(
                    -50,
                    Math.min(
                        width + 50,
                        particle.x
                    )
                );

            particle.y =
                Math.max(
                    -50,
                    Math.min(
                        height + 50,
                        particle.y
                    )
                );
        }
        }
    }

    draw(
        ctx: CanvasRenderingContext2D,
        time: number,
        mouse: MouseState,
        settings: CosmosSettings
    ) {
        const parallax =
            this.getParallaxOffset(
                ctx,
                mouse,
                settings
            );

        this.debugMetrics.particleCount =
            this.particles.length;

        if (settings.enableConnections) {
            const connectionsStart =
                performance.now();

            this.drawConnections(
                ctx,
                mouse,
                settings,
                parallax
            );

            this.debugMetrics.drawConnectionsMs =
                performance.now() -
                connectionsStart;
        } else {
            this.debugMetrics.drawConnectionsMs = 0;
            this.debugMetrics.connectionGridMs = 0;
            this.debugMetrics.connectionScanMs = 0;
            this.debugMetrics.connectionStrokeMs = 0;
            this.debugMetrics.connectionSegments = 0;
            this.debugMetrics.connectionBuckets = 0;
            this.debugMetrics.connectionRenderPoints = 0;
        }

        const particlesStart =
            performance.now();

        this.drawParticles(
            ctx,
            time,
            mouse,
            settings,
            parallax
        );

        this.debugMetrics.drawParticlesMs =
            performance.now() -
            particlesStart;
    }

    limitParticles(maxParticles: number) {
        if (maxParticles <= 0) {
            this.particles = [];
            this.invalidateConnectionCache();
            return;
        }

        if (this.particles.length <= maxParticles) return;

        let excess =
            this.particles.length - maxParticles;

        this.particles =
            this.particles.filter((particle) => {
                if (
                    excess > 0 &&
                    particle.kind === "ambient"
                ) {
                    excess--;
                    return false;
                }

                return true;
            });

        if (this.particles.length <= maxParticles) {
            this.invalidateConnectionCache();
            return;
        }

        excess =
            this.particles.length - maxParticles;

        this.particles =
            this.particles.filter((particle) => {
                if (
                    excess > 0 &&
                    particle.kind === "deep"
                ) {
                    excess--;
                    return false;
                }

                return true;
            });

        if (this.particles.length > maxParticles) {
            this.particles.splice(
                0,
                this.particles.length - maxParticles
            );
        }

        this.invalidateConnectionCache();
    }

    private generateProgressively(
        width: number,
        height: number,
        delta: number,
        settings: CosmosSettings
    ) {
        if (!settings.enableAutoSpawn) {
            return;
        }

        const availableSlots =
            settings.maxParticles -
            this.particles.length;

        if (availableSlots <= 0) {
            this.limitParticles(settings.maxParticles);
            return;
        }

        this.spawnTimer += delta;

        if (
            this.spawnTimer <
            settings.autoSpawnIntervalMs
        ) {
            return;
        }

        this.spawnTimer = 0;

        const amountToSpawn = Math.min(
            settings.autoSpawnAmount,
            availableSlots
        );

        for (let i = 0; i < amountToSpawn; i++) {
            const particle =
                this.createAmbientParticle(
                    width,
                    height,
                    true,
                    settings
                );

            particle.glow = 0.16;

            this.particles.push(particle);
        }

        this.limitParticles(settings.maxParticles);
        this.invalidateConnectionCache();
    }

    private createInitialUniverseParticle(
        width: number,
        height: number,
        settings: CosmosSettings
    ): GalaxyParticle {
        const centerX = width / 2;
        const centerY = height / 2;

        const safeMargin = 45;

        const cleanRadius =
            Math.min(width, height) *
            settings.initialCleanRadiusRatio;

        const minRadiusX =
            width *
            settings.initialMinRadiusRatio;

        const minRadiusY =
            height *
            settings.initialMinRadiusRatio;

        const maxRadiusX =
            width *
            settings.initialMaxRadiusRatio;

        const maxRadiusY =
            height *
            settings.initialMaxRadiusRatio;

        let x = centerX;
        let y = centerY;

        let attempts = 0;

        do {
            const angle =
                Math.random() * Math.PI * 2;

            let radiusFactor: number;

            const zone = Math.random();

            if (zone < 0.78) {
                radiusFactor =
                    this.random(0.78, 1);
            } else if (zone < 0.94) {
                radiusFactor =
                    this.random(0.58, 0.78);
            } else {
                radiusFactor =
                    this.random(0.42, 0.58);
            }

            const clusterSnap =
                Math.random() <
                settings.initialClusterChance;

            const finalAngle = clusterSnap
                ? Math.round(angle * 4) / 4
                : angle;

            x =
                centerX +
                Math.cos(finalAngle) *
                this.random(minRadiusX, maxRadiusX) *
                radiusFactor;

            y =
                centerY +
                Math.sin(finalAngle) *
                this.random(minRadiusY, maxRadiusY) *
                radiusFactor;

            x += this.random(-28, 28);
            y += this.random(-28, 28);

            const useCluster =
                this.clusterPoints.length > 0 &&
                Math.random() < 0.35;

            if (useCluster) {
                const cluster =
                    this.clusterPoints[
                        Math.floor(
                            Math.random() *
                            this.clusterPoints.length
                        )
                    ];

                x +=
                    (cluster.x - x) *
                    this.random(0.18, 0.42);

                y +=
                    (cluster.y - y) *
                    this.random(0.18, 0.42);
            }

            attempts++;
        } while (
            attempts < 40 &&
            (
                x < safeMargin ||
                x > width - safeMargin ||
                y < safeMargin ||
                y > height - safeMargin ||
                this.distance(
                    x,
                    y,
                    centerX,
                    centerY
                ) < cleanRadius
            )
        );

        x = Math.max(
            safeMargin,
            Math.min(width - safeMargin, x)
        );

        y = Math.max(
            safeMargin,
            Math.min(height - safeMargin, y)
        );

        const isDeep =
            this.shouldCreateDeepParticle();

        return {
            x,
            y,

            depth: isDeep
                ? this.random(0.25, 0.45)
                : this.randomDepth(),

            size: isDeep
                ? this.random(
                    settings.starMinSize * 0.35,
                    settings.starMinSize * 0.75
                )
                : this.random(
                    settings.starMinSize,
                    settings.starMaxSize
                ),

            density: isDeep
                ? this.random(38, 70)
                : this.random(10, 36),

            hue: isDeep
                ? this.random(205, 245)
                : this.getParticleHue(settings),

            speedX: isDeep
                ? this.random(
                    -settings.baseSpeed * 0.15,
                    settings.baseSpeed * 0.15
                )
                : this.random(
                    -settings.baseSpeed,
                    settings.baseSpeed
                ),

            speedY: isDeep
                ? this.random(
                    -settings.baseSpeed * 0.15,
                    settings.baseSpeed * 0.15
                )
                : this.random(
                    -settings.baseSpeed,
                    settings.baseSpeed
                ),

            vx: 0,
            vy: 0,

            kind: isDeep
                ? "deep"
                : "ambient",

            glow: 0
        };
    }

    private createAmbientParticle(
        width: number,
        height: number,
        preferPeriphery: boolean,
        settings: CosmosSettings
    ): GalaxyParticle {
        let x = Math.random() * width;
        let y = Math.random() * height;

        if (preferPeriphery) {
            const centerX = width / 2;
            const centerY = height / 2;

            const cleanRadius =
                Math.min(width, height) *
                settings.initialCleanRadiusRatio;

            const minRadiusX =
                width *
                settings.initialMinRadiusRatio;

            const minRadiusY =
                height *
                settings.initialMinRadiusRatio;

            const maxRadiusX =
                width *
                settings.initialMaxRadiusRatio;

            const maxRadiusY =
                height *
                settings.initialMaxRadiusRatio;

            let attempts = 0;

            do {
                const angle =
                    Math.random() * Math.PI * 2;

                x =
                    centerX +
                    Math.cos(angle) *
                    this.random(minRadiusX, maxRadiusX);

                y =
                    centerY +
                    Math.sin(angle) *
                    this.random(minRadiusY, maxRadiusY);

                const useCluster =
                    this.clusterPoints.length > 0 &&
                    Math.random() < 0.25;

                if (useCluster) {
                    const cluster =
                        this.clusterPoints[
                            Math.floor(
                                Math.random() *
                                this.clusterPoints.length
                            )
                        ];

                    x +=
                        (cluster.x - x) *
                        this.random(0.14, 0.32);

                    y +=
                        (cluster.y - y) *
                        this.random(0.14, 0.32);
                }

                attempts++;
            } while (
                attempts < 30 &&
                this.distance(
                    x,
                    y,
                    centerX,
                    centerY
                ) < cleanRadius
            );
        }

        return {
            x,
            y,

            depth: this.randomDepth(),

            size: this.random(
                settings.starMinSize,
                settings.starMaxSize
            ),

            density: this.random(8, 32),

            hue: this.getParticleHue(settings),

            speedX: this.random(
                -settings.baseSpeed,
                settings.baseSpeed
            ),

            speedY: this.random(
                -settings.baseSpeed,
                settings.baseSpeed
            ),

            vx: 0,
            vy: 0,

            kind: "ambient",

            glow: 0
        };
    }

    private drawParticles(
        ctx: CanvasRenderingContext2D,
        time: number,
        mouse: MouseState,
        settings: CosmosSettings,
        parallax: { x: number; y: number }
    ) {
        const mouseGlowEnabled =
            settings.enableMouseGlow &&
            this.mouseInfluence > 0.01 &&
            mouse.x >= 0 &&
            mouse.y >= 0;

        const colorProfile =
            this.getParticleColorProfile(settings);

        const particleBrightness =
            this.clamp(
                settings.particleBrightness,
                0,
                3
            );

        const particleGlow =
            this.clamp(
                settings.particleGlow,
                0,
                1
            );

        for (const particle of this.particles) {
            const renderPosition =
                this.getRenderPosition(
                    particle,
                    parallax
                );

            const depth = particle.depth ?? 1;
            const isDeep = particle.kind === "deep";

            const depthSize = isDeep
                ? 0.22 + depth * 0.18
                : 0.45 + depth * 0.75;

            const depthAlpha = isDeep
                ? 0.12 + depth * 0.18
                : 0.32 + depth * 0.68;

            const mouseGlow = mouseGlowEnabled
                ? this.getMouseGlow(
                    particle,
                    mouse,
                    settings,
                    renderPosition
                ) *
                this.mouseInfluence
                : 0;

            const particleHue =
                this.getRenderParticleHue(
                    particle,
                    settings
                );

            const baseSize =
                isDeep
                    ? particle.size
                    : this.clamp(
                        particle.size,
                        settings.starMinSize,
                        settings.starMaxSize
                    );

            let alpha =
            (
                0.24 +
                Math.sin(
                    time * 0.001 +
                    particle.density
                ) * 0.1
            ) *
            depthAlpha *
            particleBrightness;

            if (isDeep) alpha *= 0.7;

            alpha +=
                mouseGlow *
                settings.mouseGlowParticleAlpha *
                depthAlpha;

            const size =
                baseSize *
                depthSize +
                mouseGlow *
                settings.mouseGlowParticleSize *
                depthSize +
                (particle.glow ?? 0) *
                0.8 *
                depthSize;

            let saturation = 82;
            let lightness = 72;

            let glowSaturation = 90;
            let glowLightness = 76;
            let glowMultiplier = 1;

            if (isDeep) {
                saturation = 28;
                lightness = 54;

                glowSaturation = 25;
                glowLightness = 52;
                glowMultiplier = 0.12;
            } else if (depth < 0.55) {
                saturation = 42;
                lightness = 62;

                glowSaturation = 38;
                glowLightness = 58;
                glowMultiplier = 0.35;
            } else if (depth < 0.8) {
                saturation = 68;
                lightness = 68;

                glowSaturation = 65;
                glowLightness = 68;
                glowMultiplier = 0.65;
            } else {
                saturation = 92;
                lightness = 78;

                glowSaturation = 96;
                glowLightness = 80;
                glowMultiplier = 1;
            }

            saturation =
                this.applyParticleColorSaturation(
                    saturation,
                    colorProfile
                );

            lightness =
                this.applyParticleColorLightness(
                    lightness,
                    colorProfile
                );

            glowSaturation =
                this.applyParticleColorSaturation(
                    glowSaturation,
                    colorProfile
                );

            glowLightness =
                this.applyParticleColorLightness(
                    glowLightness,
                    colorProfile
                );

            alpha =
                this.clamp(
                    alpha,
                    0,
                    1
                );

            if (
                !isDeep &&
                particleGlow > 0 &&
                (
                    mouseGlow > 0.08 ||
                    (particle.glow ?? 0) > 0.01
                )
            ) {
                const glowAlpha =
                    this.clamp(
                        (
                            0.06 +
                            particleGlow +
                            mouseGlow * 0.12 +
                            (particle.glow ?? 0) * 0.13
                        ) *
                        depthAlpha *
                        glowMultiplier,
                        0,
                        1
                    );

                const gradient =
                    ctx.createRadialGradient(
                        renderPosition.x,
                        renderPosition.y,
                        0,
                        renderPosition.x,
                        renderPosition.y,
                        size * (4.2 + particleGlow * 8)
                    );

                gradient.addColorStop(
                    0,
                    `hsla(${particleHue}, ${glowSaturation}%, ${glowLightness}%, ${glowAlpha})`
                );

                gradient.addColorStop(
                    1,
                    `hsla(${particleHue}, ${glowSaturation}%, ${glowLightness}%, 0)`
                );

                ctx.beginPath();
                ctx.fillStyle = gradient;

                ctx.arc(
                    renderPosition.x,
                    renderPosition.y,
                    size * (4.2 + particleGlow * 8) , 
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }

            ctx.beginPath();

            ctx.fillStyle =
                `hsla(${particleHue}, ${saturation}%, ${lightness}%, ${alpha})`;

            ctx.arc(
                renderPosition.x,
                renderPosition.y,
                size,
                0,
                Math.PI * 2
            );

            ctx.fill();

            if (
                particle.glow !== undefined &&
                particle.glow > 0
            ) {
                particle.glow -= 0.002;

                if (particle.glow < 0) {
                    particle.glow = 0;
                }
            }
        }
    }

    private drawConnections(
        ctx: CanvasRenderingContext2D,
        mouse: MouseState,
        settings: CosmosSettings,
        parallax: { x: number; y: number }
    ) {
        const connectionDistance =
            settings.connectionDistance;

        if (connectionDistance <= 0) {
            return;
        }

        const now = performance.now();

        const mouseGlowEnabled =
            settings.enableMouseGlow &&
            this.mouseInfluence > 0.01 &&
            mouse.x >= 0 &&
            mouse.y >= 0;

        const mouseGlowRadiusSquared =
            settings.mouseGlowRadius *
            settings.mouseGlowRadius;

        const renderPoints:
            ConnectionRenderPoint[] = [];

        const renderPointByIndex:
            Array<ConnectionRenderPoint | undefined> = [];

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            if (particle.kind === "deep") {
                continue;
            }

            const renderPosition =
                this.getRenderPosition(
                    particle,
                    parallax
                );

            const point: ConnectionRenderPoint = {
                particle,
                index: i,
                x: renderPosition.x,
                y: renderPosition.y,
                depth: particle.depth ?? 1
            };

            renderPoints.push(point);
            renderPointByIndex[i] = point;
        }

        this.debugMetrics.connectionRenderPoints =
            renderPoints.length;

        const shouldRebuildCache =
            this.cachedConnectionPairs.length === 0 ||
            now - this.lastConnectionCacheTime >=
                this.connectionCacheIntervalMs;

        if (shouldRebuildCache) {
            this.rebuildConnectionCache(
                renderPoints,
                connectionDistance,
                mouse,
                settings,
                mouseGlowEnabled,
                mouseGlowRadiusSquared
            );

            this.lastConnectionCacheTime = now;
        } else {
            this.debugMetrics.connectionGridMs = 0;
            this.debugMetrics.connectionScanMs = 0;
        }

        const strokeStart = performance.now();

        const buckets =
            new Map<string, ConnectionBucket>();

        let segmentCount = 0;

        for (const pair of this.cachedConnectionPairs) {
            const a =
                renderPointByIndex[pair.aIndex];

            const b =
                renderPointByIndex[pair.bIndex];

            if (!a || !b) {
                continue;
            }

            const depthDifference =
                Math.abs(a.depth - b.depth);

            if (depthDifference > 0.42) {
                continue;
            }

            const depthAverage =
                (a.depth + b.depth) / 2;

            const dx = a.x - b.x;
            const dy = a.y - b.y;

            const distanceSquared =
                dx * dx + dy * dy;

            const depthConnectionDistance =
                connectionDistance *
                (0.65 + depthAverage * 0.35);

            const maxDistanceSquared =
                depthConnectionDistance *
                depthConnectionDistance;

            if (
                distanceSquared >=
                maxDistanceSquared
            ) {
                continue;
            }

            const distance =
                Math.sqrt(distanceSquared);

            const opacity =
                1 -
                distance /
                depthConnectionDistance;

            let mouseGlow = 0;

            if (mouseGlowEnabled) {
                const midX = (a.x + b.x) / 2;
                const midY = (a.y + b.y) / 2;

                const mouseDx = mouse.x - midX;
                const mouseDy = mouse.y - midY;

                const mouseDistanceSquared =
                    mouseDx * mouseDx +
                    mouseDy * mouseDy;

                if (
                    mouseDistanceSquared <
                    mouseGlowRadiusSquared
                ) {
                    const mouseDistance =
                        Math.sqrt(
                            mouseDistanceSquared
                        );

                    mouseGlow =
                        1 -
                        mouseDistance /
                        settings.mouseGlowRadius;

                    mouseGlow *=
                        this.mouseInfluence;
                }
            }

            const fadeA =
                a.particle.connectionAge !== undefined &&
                a.particle.connectionFadeDuration !== undefined
                    ? a.particle.connectionAge /
                      a.particle.connectionFadeDuration
                    : 1;

            const fadeB =
                b.particle.connectionAge !== undefined &&
                b.particle.connectionFadeDuration !== undefined
                    ? b.particle.connectionAge /
                      b.particle.connectionFadeDuration
                    : 1;

            const connectionFade =
                Math.min(fadeA, fadeB);

            const finalOpacity =
                opacity *
                (
                    settings.connectionBaseOpacity +
                    mouseGlow *
                    settings.mouseGlowConnectionOpacity
                ) *
                (
                    0.25 +
                    depthAverage * 0.75
                ) *
                connectionFade;

            if (finalOpacity < 0.02) {
                continue;
            }

            const lineWidth =
                (
                    settings.connectionLineWidth +
                    mouseGlow *
                    settings.mouseGlowLineWidth
                ) *
                (
                    0.45 +
                    depthAverage * 0.55
                );

            const opacityBucket =
                Math.round(finalOpacity * 20) / 20;

            const widthBucket =
                Math.round(lineWidth * 2) / 2;

            const bucketKey =
                `${opacityBucket}-${widthBucket}`;

            let bucket =
                buckets.get(bucketKey);

            if (!bucket) {
                bucket = {
                    opacity: opacityBucket,
                    lineWidth: widthBucket,
                    path: new Path2D(),
                    count: 0
                };

                buckets.set(bucketKey, bucket);
            }

            bucket.path.moveTo(
                a.x,
                a.y
            );

            bucket.path.lineTo(
                b.x,
                b.y
            );

            bucket.count++;
            segmentCount++;
        }

        for (const bucket of buckets.values()) {
            if (bucket.count === 0) {
                continue;
            }

            ctx.strokeStyle =
                `rgba(${settings.connectionColor}, ${bucket.opacity})`;

            ctx.lineWidth =
                bucket.lineWidth;

            ctx.stroke(bucket.path);
        }

        this.debugMetrics.connectionStrokeMs =
            performance.now() - strokeStart;

        this.debugMetrics.connectionSegments =
            segmentCount;

        this.debugMetrics.connectionBuckets =
            buckets.size;
    }

    private rebuildConnectionCache(
        renderPoints: ConnectionRenderPoint[],
        connectionDistance: number,
        mouse: MouseState,
        settings: CosmosSettings,
        mouseGlowEnabled: boolean,
        mouseGlowRadiusSquared: number
    ) {
        const gridStart =
            performance.now();

        const cellSize =
            connectionDistance;

        const grid =
            new Map<
                string,
                ConnectionRenderPoint[]
            >();

        for (const point of renderPoints) {
            const cellX =
                Math.floor(point.x / cellSize);

            const cellY =
                Math.floor(point.y / cellSize);

            const cellKey =
                `${cellX},${cellY}`;

            let cell =
                grid.get(cellKey);

            if (!cell) {
                cell = [];
                grid.set(cellKey, cell);
            }

            cell.push(point);
        }

        this.debugMetrics.connectionGridMs =
            performance.now() - gridStart;

        const scanStart =
            performance.now();

        const maxConnectionsPerParticle =
        Math.max(
            1,
            settings.maxConnectionsPerParticle ?? 4
        );

const newPairs: ConnectionPair[] = [];

        for (const a of renderPoints) {
            const cellX =
                Math.floor(a.x / cellSize);

            const cellY =
                Math.floor(a.y / cellSize);

            const bestCandidates:
                ConnectionCandidate[] = [];

            for (
                let offsetX = -1;
                offsetX <= 1;
                offsetX++
            ) {
                for (
                    let offsetY = -1;
                    offsetY <= 1;
                    offsetY++
                ) {
                    const neighborKey =
                        `${cellX + offsetX},${cellY + offsetY}`;

                    const neighbors =
                        grid.get(neighborKey);

                    if (!neighbors) {
                        continue;
                    }

                    for (const b of neighbors) {
                        if (b.index <= a.index) {
                            continue;
                        }

                        const score =
                            this.getConnectionCandidateScore(
                                a,
                                b,
                                connectionDistance,
                                mouse,
                                settings,
                                mouseGlowEnabled,
                                mouseGlowRadiusSquared
                            );

                        if (score <= 0) {
                            continue;
                        }

                        this.addBestConnectionCandidate(
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
                newPairs.push({
                    aIndex: a.index,
                    bIndex: candidate.point.index
                });
            }
        }

        this.cachedConnectionPairs = newPairs;

        this.debugMetrics.connectionScanMs =
            performance.now() - scanStart;
    }

    private getConnectionCandidateScore(
        a: ConnectionRenderPoint,
        b: ConnectionRenderPoint,
        connectionDistance: number,
        mouse: MouseState,
        settings: CosmosSettings,
        mouseGlowEnabled: boolean,
        mouseGlowRadiusSquared: number
    ) {
        const depthDifference =
            Math.abs(a.depth - b.depth);

        if (depthDifference > 0.42) {
            return 0;
        }

        const depthAverage =
            (a.depth + b.depth) / 2;

        const dx = a.x - b.x;
        const dy = a.y - b.y;

        const distanceSquared =
            dx * dx + dy * dy;

        const depthConnectionDistance =
            connectionDistance *
            (0.65 + depthAverage * 0.35);

        const maxDistanceSquared =
            depthConnectionDistance *
            depthConnectionDistance;

        if (
            distanceSquared >=
            maxDistanceSquared
        ) {
            return 0;
        }

        const distance =
            Math.sqrt(distanceSquared);

        const opacity =
            1 -
            distance /
            depthConnectionDistance;

        let mouseGlow = 0;

        if (mouseGlowEnabled) {
            const midX =
                (a.x + b.x) / 2;

            const midY =
                (a.y + b.y) / 2;

            const mouseDx =
                mouse.x - midX;

            const mouseDy =
                mouse.y - midY;

            const mouseDistanceSquared =
                mouseDx * mouseDx +
                mouseDy * mouseDy;

            if (
                mouseDistanceSquared <
                mouseGlowRadiusSquared
            ) {
                const mouseDistance =
                    Math.sqrt(
                        mouseDistanceSquared
                    );

                mouseGlow =
                    1 -
                    mouseDistance /
                    settings.mouseGlowRadius;

                mouseGlow *=
                    this.mouseInfluence;
            }
        }

        return (
            opacity *
            (0.7 + depthAverage * 0.3) +
            mouseGlow * 0.25
        );
    }

    private addBestConnectionCandidate(
        candidates: ConnectionCandidate[],
        candidate: ConnectionCandidate,
        maxCandidates: number
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

    private getMouseGlow(
        particle: GalaxyParticle,
        mouse: MouseState,
        settings: CosmosSettings,
        renderPosition: { x: number; y: number }
    ) {
        if (
            !settings.enableMouseGlow ||
            mouse.x < 0 ||
            mouse.y < 0 ||
            particle.kind === "deep"
        ) {
            return 0;
        }

        const dx =
            mouse.x - renderPosition.x;

        const dy =
            mouse.y - renderPosition.y;

        const distanceSquared =
            dx * dx + dy * dy;

        const radiusSquared =
            settings.mouseGlowRadius *
            settings.mouseGlowRadius;

        if (distanceSquared > radiusSquared) {
            return 0;
        }

        const distance =
            Math.sqrt(distanceSquared);

        const glow =
            1 -
            distance /
            settings.mouseGlowRadius;

        const depth = particle.depth ?? 1;

        return (
            glow *
            glow *
            (0.35 + depth * 0.65)
        );
    }

    private getParallaxOffset(
        ctx: CanvasRenderingContext2D,
        mouse: MouseState,
        settings: CosmosSettings
    ) {
        if (
            !settings.enableParallax ||
            mouse.x < 0 ||
            mouse.y < 0
        ) {
            return { x: 0, y: 0 };
        }

        const centerX =
            ctx.canvas.clientWidth / 2;

        const centerY =
            ctx.canvas.clientHeight / 2;

        if (centerX <= 0 || centerY <= 0) {
            return { x: 0, y: 0 };
        }

        const offsetX =
            (mouse.x - centerX) / centerX;

        const offsetY =
            (mouse.y - centerY) / centerY;

        const maxOffset = 30;

        return {
            x: offsetX * maxOffset,
            y: offsetY * maxOffset
        };
    }

    private getRenderPosition(
        particle: GalaxyParticle,
        parallax: { x: number; y: number }
    ) {
        const depth =
            particle.depth ?? 1;

        const parallaxStrength =
            particle.kind === "deep"
                ? 1.35
                : 1 - depth;

        return {
            x:
                particle.x -
                parallax.x * parallaxStrength,

            y:
                particle.y -
                parallax.y * parallaxStrength
        };
    }

    private generateClusterPoints(
        width: number,
        height: number
    ) {
        this.clusterPoints = [];

        const clusterCount =
            Math.floor(
                this.random(4, 8)
            );

        for (let i = 0; i < clusterCount; i++) {
            this.clusterPoints.push({
                x: this.random(
                    width * 0.12,
                    width * 0.88
                ),

                y: this.random(
                    height * 0.12,
                    height * 0.88
                )
            });
        }
    }

    private randomDepth() {
        const roll = Math.random();

        if (roll < 0.55) {
            return this.random(0.35, 0.55);
        }

        if (roll < 0.85) {
            return this.random(0.55, 0.8);
        }

        return this.random(0.8, 1);
    }

    private getParticleHue(settings: CosmosSettings) {
        const color = settings.particleColor;

        if (/^#[0-9a-fA-F]{6}$/.test(color)) {
            return this.hexToHsl(color).hue;
        }

        return this.random(
            settings.starHueMin,
            settings.starHueMax
        );
    }

    private getRenderParticleHue(
        particle: GalaxyParticle,
        settings: CosmosSettings
    ) {
        const color = settings.particleColor;

        if (
            particle.kind !== "deep" &&
            /^#[0-9a-fA-F]{6}$/.test(color)
        ) {
            return this.hexToHsl(color).hue;
        }

        return particle.hue;
    }

    private getBaseSpeedMultiplier(
        settings: CosmosSettings
    ) {
        const defaultBaseSpeed = 0.22;

        return this.clamp(
            settings.baseSpeed / defaultBaseSpeed,
            0,
            5
        );
    }

    private getParticleColorProfile(
        settings: CosmosSettings
    ): ParticleColorProfile {
        const color = settings.particleColor;

        if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            return {
                saturation: 100,
                lightness: 60
            };
        }

        const hsl =
            this.hexToHsl(color);

        return {
            saturation: hsl.saturation,
            lightness: hsl.lightness
        };
    }

    private applyParticleColorSaturation(
        baseSaturation: number,
        profile: ParticleColorProfile
    ) {
        const saturationFactor =
            0.35 +
            (profile.saturation / 100) * 0.75;

        return this.clamp(
            baseSaturation * saturationFactor,
            0,
            100
        );
    }

    private applyParticleColorLightness(
        baseLightness: number,
        profile: ParticleColorProfile
    ) {
        const lightnessOffset =
            (profile.lightness - 60) * 0.35;

        return this.clamp(
            baseLightness + lightnessOffset,
            12,
            94
        );
    }

    private hexToHsl(hex: string) {
        const cleanHex = hex.replace("#", "");

        const r =
            parseInt(cleanHex.substring(0, 2), 16) / 255;

        const g =
            parseInt(cleanHex.substring(2, 4), 16) / 255;

        const b =
            parseInt(cleanHex.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        const lightness =
            (max + min) / 2;

        if (delta === 0) {
            return {
                hue: 0,
                saturation: 0,
                lightness: Math.round(lightness * 100)
            };
        }

        let hue = 0;

        if (max === r) {
            hue = ((g - b) / delta) % 6;
        } else if (max === g) {
            hue = (b - r) / delta + 2;
        } else {
            hue = (r - g) / delta + 4;
        }

        const saturation =
            delta /
            (
                1 -
                Math.abs(2 * lightness - 1)
            );

        return {
            hue: Math.round((hue * 60 + 360) % 360),
            saturation: Math.round(saturation * 100),
            lightness: Math.round(lightness * 100)
        };
    }

    private shouldCreateDeepParticle() {
        return Math.random() < 0.45;
    }

    private distance(
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ) {
        const dx = x1 - x2;
        const dy = y1 - y2;

        return Math.sqrt(dx * dx + dy * dy);
    }

    private random(
        min: number,
        max: number
    ) {
        return min + Math.random() * (max - min);
    }

    private clamp(
        value: number,
        min: number,
        max: number
    ) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }

    private invalidateConnectionCache() {
        this.cachedConnectionPairs = [];
        this.lastConnectionCacheTime = 0;
    }
    private handleResize(
    width: number,
    height: number
) {
    if (
        this.lastWidth <= 0 ||
        this.lastHeight <= 0
    ) {
        this.lastWidth = width;
        this.lastHeight = height;
        return;
    }

    if (
        width === this.lastWidth &&
        height === this.lastHeight
    ) {
        return;
    }

    const scaleX =
        width / this.lastWidth;

    const scaleY =
        height / this.lastHeight;

    for (const particle of this.particles) {
        particle.x *= scaleX;
        particle.y *= scaleY;

        if (particle.gravityX !== undefined) {
            particle.gravityX *= scaleX;
        }

        if (particle.gravityY !== undefined) {
            particle.gravityY *= scaleY;
        }
    }

    for (const cluster of this.clusterPoints) {
        cluster.x *= scaleX;
        cluster.y *= scaleY;
    }

    this.lastWidth = width;
    this.lastHeight = height;

    this.resizeGraceTime =
        this.resizeGraceDuration;

    this.invalidateConnectionCache();
}
}
