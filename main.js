var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => CosmosGraphPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian9 = require("obsidian");

// src/render/particleSystem.ts
var ParticleSystem = class {
  constructor() {
    this.particles = [];
    this.spawnTimer = 0;
    this.clusterPoints = [];
  }
  hasParticles() {
    return this.particles.length > 0;
  }
  applyVisualSettings(settings) {
    for (const particle of this.particles) {
      if (particle.kind !== "ambient") {
        continue;
      }
      particle.size = Math.max(
        settings.starMinSize,
        Math.min(
          settings.starMaxSize,
          particle.size
        )
      );
      particle.hue = Math.max(
        settings.starHueMin,
        Math.min(
          settings.starHueMax,
          particle.hue
        )
      );
      const currentSpeed = Math.sqrt(
        particle.speedX * particle.speedX + particle.speedY * particle.speedY
      );
      if (currentSpeed > 0 && settings.baseSpeed > 0) {
        const speedRatio = settings.baseSpeed / currentSpeed;
        particle.speedX *= speedRatio;
        particle.speedY *= speedRatio;
      }
      particle.glow = Math.max(
        particle.glow ?? 0,
        0.04
      );
    }
  }
  addAmbientParticle(particle) {
    this.particles.push({
      ...particle,
      kind: "ambient",
      depth: particle.depth ?? this.randomDepth(),
      life: void 0,
      maxLife: void 0,
      gravityX: void 0,
      gravityY: void 0,
      bounceCount: void 0,
      maxBounces: void 0,
      gravityTime: void 0,
      maxGravityTime: void 0,
      affectedByGravity: void 0,
      glow: 0
    });
  }
  createParticles(width, height, amount, settings) {
    if (width <= 0 || height <= 0)
      return;
    this.particles = [];
    this.generateClusterPoints(width, height);
    for (let i = 0; i < amount; i++) {
      this.particles.push(
        this.createInitialUniverseParticle(width, height, settings)
      );
    }
  }
  update(width, height, mouse, delta, settings) {
    this.generateProgressively(width, height, delta, settings);
    for (const particle of this.particles) {
      const depth = particle.depth ?? 1;
      const depthMotion = particle.kind === "deep" ? 0.08 : 0.35 + depth * 0.65;
      particle.speedX += this.random(-6e-3, 6e-3) * depthMotion;
      particle.speedY += this.random(-6e-3, 6e-3) * depthMotion;
      particle.speedX *= 0.992;
      particle.speedY *= 0.992;
      const mouseDx = mouse.x - particle.x;
      const mouseDy = mouse.y - particle.y;
      const mouseDistance = Math.sqrt(
        mouseDx * mouseDx + mouseDy * mouseDy
      );
      if (settings.enableMouseField && particle.kind === "ambient" && mouseDistance < settings.mouseFieldRadius) {
        const force = (settings.mouseFieldRadius - mouseDistance) / settings.mouseFieldRadius;
        const angle = Math.atan2(mouseDy, mouseDx);
        const depthForce = force * settings.mouseRepulseStrength * depthMotion;
        const targetX = particle.x - Math.cos(angle) * depthForce;
        const targetY = particle.y - Math.sin(angle) * depthForce;
        particle.vx += (targetX - particle.x) / particle.density;
        particle.vy += (targetY - particle.y) / particle.density;
      }
      particle.x += (particle.speedX + particle.vx * 0.05) * depthMotion;
      particle.y += (particle.speedY + particle.vy * 0.05) * depthMotion;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      if (particle.x < -50)
        particle.x = width + 50;
      if (particle.x > width + 50)
        particle.x = -50;
      if (particle.y < -50)
        particle.y = height + 50;
      if (particle.y > height + 50)
        particle.y = -50;
    }
  }
  draw(ctx, time, mouse, settings) {
    const parallax = this.getParallaxOffset(ctx, mouse, settings);
    if (settings.enableConnections) {
      this.drawConnections(ctx, mouse, settings, parallax);
    }
    this.drawParticles(ctx, time, mouse, settings, parallax);
  }
  limitParticles(maxParticles) {
    if (this.particles.length <= maxParticles)
      return;
    const excess = this.particles.length - maxParticles;
    let removed = 0;
    this.particles = this.particles.filter((particle) => {
      if (removed < excess && particle.kind === "ambient") {
        removed++;
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
  }
  generateProgressively(width, height, delta, settings) {
    if (!settings.enableAutoSpawn || this.particles.length >= settings.maxParticles) {
      return;
    }
    this.spawnTimer += delta;
    if (this.spawnTimer < settings.autoSpawnIntervalMs)
      return;
    this.spawnTimer = 0;
    for (let i = 0; i < settings.autoSpawnAmount; i++) {
      const particle = this.createAmbientParticle(
        width,
        height,
        true,
        settings
      );
      particle.glow = 0.16;
      this.particles.push(particle);
    }
  }
  createInitialUniverseParticle(width, height, settings) {
    const centerX = width / 2;
    const centerY = height / 2;
    const safeMargin = 45;
    const cleanRadius = Math.min(width, height) * settings.initialCleanRadiusRatio;
    const minRadiusX = width * settings.initialMinRadiusRatio;
    const minRadiusY = height * settings.initialMinRadiusRatio;
    const maxRadiusX = width * settings.initialMaxRadiusRatio;
    const maxRadiusY = height * settings.initialMaxRadiusRatio;
    let x = centerX;
    let y = centerY;
    let attempts = 0;
    do {
      const angle = Math.random() * Math.PI * 2;
      let radiusFactor;
      const zone = Math.random();
      if (zone < 0.78) {
        radiusFactor = this.random(0.78, 1);
      } else if (zone < 0.94) {
        radiusFactor = this.random(0.58, 0.78);
      } else {
        radiusFactor = this.random(0.42, 0.58);
      }
      const clusterSnap = Math.random() < settings.initialClusterChance;
      const finalAngle = clusterSnap ? Math.round(angle * 4) / 4 : angle;
      x = centerX + Math.cos(finalAngle) * this.random(minRadiusX, maxRadiusX) * radiusFactor;
      y = centerY + Math.sin(finalAngle) * this.random(minRadiusY, maxRadiusY) * radiusFactor;
      x += this.random(-28, 28);
      y += this.random(-28, 28);
      const useCluster = this.clusterPoints.length > 0 && Math.random() < 0.35;
      if (useCluster) {
        const cluster = this.clusterPoints[Math.floor(
          Math.random() * this.clusterPoints.length
        )];
        x += (cluster.x - x) * this.random(0.18, 0.42);
        y += (cluster.y - y) * this.random(0.18, 0.42);
      }
      attempts++;
    } while (attempts < 40 && (x < safeMargin || x > width - safeMargin || y < safeMargin || y > height - safeMargin || this.distance(x, y, centerX, centerY) < cleanRadius));
    x = Math.max(safeMargin, Math.min(width - safeMargin, x));
    y = Math.max(safeMargin, Math.min(height - safeMargin, y));
    const isDeep = this.shouldCreateDeepParticle();
    return {
      x,
      y,
      depth: isDeep ? this.random(0.25, 0.45) : this.randomDepth(),
      size: isDeep ? this.random(
        settings.starMinSize * 0.35,
        settings.starMinSize * 0.75
      ) : this.random(
        settings.starMinSize,
        settings.starMaxSize
      ),
      density: isDeep ? this.random(38, 70) : this.random(10, 36),
      hue: isDeep ? this.random(205, 245) : this.random(
        settings.starHueMin,
        settings.starHueMax
      ),
      speedX: isDeep ? this.random(
        -settings.baseSpeed * 0.15,
        settings.baseSpeed * 0.15
      ) : this.random(
        -settings.baseSpeed,
        settings.baseSpeed
      ),
      speedY: isDeep ? this.random(
        -settings.baseSpeed * 0.15,
        settings.baseSpeed * 0.15
      ) : this.random(
        -settings.baseSpeed,
        settings.baseSpeed
      ),
      vx: 0,
      vy: 0,
      kind: isDeep ? "deep" : "ambient",
      glow: 0
    };
  }
  createAmbientParticle(width, height, preferPeriphery, settings) {
    let x = Math.random() * width;
    let y = Math.random() * height;
    if (preferPeriphery) {
      const centerX = width / 2;
      const centerY = height / 2;
      const cleanRadius = Math.min(width, height) * settings.initialCleanRadiusRatio;
      const minRadiusX = width * settings.initialMinRadiusRatio;
      const minRadiusY = height * settings.initialMinRadiusRatio;
      const maxRadiusX = width * settings.initialMaxRadiusRatio;
      const maxRadiusY = height * settings.initialMaxRadiusRatio;
      let attempts = 0;
      do {
        const angle = Math.random() * Math.PI * 2;
        x = centerX + Math.cos(angle) * this.random(minRadiusX, maxRadiusX);
        y = centerY + Math.sin(angle) * this.random(minRadiusY, maxRadiusY);
        const useCluster = this.clusterPoints.length > 0 && Math.random() < 0.25;
        if (useCluster) {
          const cluster = this.clusterPoints[Math.floor(
            Math.random() * this.clusterPoints.length
          )];
          x += (cluster.x - x) * this.random(0.14, 0.32);
          y += (cluster.y - y) * this.random(0.14, 0.32);
        }
        attempts++;
      } while (attempts < 30 && this.distance(x, y, centerX, centerY) < cleanRadius);
    }
    return {
      x,
      y,
      depth: this.randomDepth(),
      size: this.random(settings.starMinSize, settings.starMaxSize),
      density: this.random(8, 32),
      hue: this.random(settings.starHueMin, settings.starHueMax),
      speedX: this.random(-settings.baseSpeed, settings.baseSpeed),
      speedY: this.random(-settings.baseSpeed, settings.baseSpeed),
      vx: 0,
      vy: 0,
      kind: "ambient",
      glow: 0
    };
  }
  drawParticles(ctx, time, mouse, settings, parallax) {
    for (const particle of this.particles) {
      const renderPosition = this.getRenderPosition(particle, parallax);
      const depth = particle.depth ?? 1;
      const isDeep = particle.kind === "deep";
      const depthSize = isDeep ? 0.22 + depth * 0.18 : 0.45 + depth * 0.75;
      const depthAlpha = isDeep ? 0.12 + depth * 0.18 : 0.32 + depth * 0.68;
      const mouseGlow = this.getMouseGlow(
        particle,
        mouse,
        settings,
        parallax
      );
      let alpha = (0.24 + Math.sin(time * 1e-3 + particle.density) * 0.1) * depthAlpha;
      if (isDeep)
        alpha *= 0.7;
      alpha += mouseGlow * settings.mouseGlowParticleAlpha * depthAlpha;
      const size = particle.size * depthSize + mouseGlow * settings.mouseGlowParticleSize * depthSize + (particle.glow ?? 0) * 0.8 * depthSize;
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
      if (!isDeep && (mouseGlow > 0.05 || (particle.glow ?? 0) > 0.01)) {
        const gradient = ctx.createRadialGradient(
          renderPosition.x,
          renderPosition.y,
          0,
          renderPosition.x,
          renderPosition.y,
          size * 4.2
        );
        gradient.addColorStop(
          0,
          `hsla(${particle.hue}, ${glowSaturation}%, ${glowLightness}%, ${(0.06 + mouseGlow * 0.12 + (particle.glow ?? 0) * 0.13) * depthAlpha * glowMultiplier})`
        );
        gradient.addColorStop(
          1,
          `hsla(${particle.hue}, ${glowSaturation}%, ${glowLightness}%, 0)`
        );
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(
          renderPosition.x,
          renderPosition.y,
          size * 4.2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = `hsla(${particle.hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.arc(
        renderPosition.x,
        renderPosition.y,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
      if (particle.glow !== void 0 && particle.glow > 0) {
        particle.glow -= 2e-3;
        if (particle.glow < 0)
          particle.glow = 0;
      }
    }
  }
  drawConnections(ctx, mouse, settings, parallax) {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        if (a.kind === "deep" || b.kind === "deep")
          continue;
        const depthA = a.depth ?? 1;
        const depthB = b.depth ?? 1;
        const depthDifference = Math.abs(depthA - depthB);
        if (depthDifference > 0.42)
          continue;
        const depthAverage = (depthA + depthB) / 2;
        const renderA = this.getRenderPosition(a, parallax);
        const renderB = this.getRenderPosition(b, parallax);
        const dx = renderA.x - renderB.x;
        const dy = renderA.y - renderB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const depthConnectionDistance = settings.connectionDistance * (0.65 + depthAverage * 0.35);
        if (distance < depthConnectionDistance) {
          const opacity = 1 - distance / depthConnectionDistance;
          const midX = (renderA.x + renderB.x) / 2;
          const midY = (renderA.y + renderB.y) / 2;
          const mouseDx = mouse.x - midX;
          const mouseDy = mouse.y - midY;
          const mouseDistance = Math.sqrt(
            mouseDx * mouseDx + mouseDy * mouseDy
          );
          let mouseGlow = 0;
          if (settings.enableMouseGlow && mouse.x >= 0 && mouseDistance < settings.mouseGlowRadius) {
            mouseGlow = 1 - mouseDistance / settings.mouseGlowRadius;
          }
          const depthOpacity = 0.25 + depthAverage * 0.75;
          const finalOpacity = opacity * (settings.connectionBaseOpacity + mouseGlow * settings.mouseGlowConnectionOpacity) * depthOpacity;
          ctx.strokeStyle = `rgba(${settings.connectionColor}, ${finalOpacity})`;
          ctx.lineWidth = (settings.connectionLineWidth + mouseGlow * settings.mouseGlowLineWidth) * (0.45 + depthAverage * 0.55);
          ctx.beginPath();
          ctx.moveTo(renderA.x, renderA.y);
          ctx.lineTo(renderB.x, renderB.y);
          ctx.stroke();
        }
      }
    }
  }
  getMouseGlow(particle, mouse, settings, parallax) {
    if (!settings.enableMouseGlow || mouse.x < 0 || mouse.y < 0) {
      return 0;
    }
    if (particle.kind === "deep")
      return 0;
    const depth = particle.depth ?? 1;
    const renderPosition = this.getRenderPosition(particle, parallax);
    const dx = mouse.x - renderPosition.x;
    const dy = mouse.y - renderPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > settings.mouseGlowRadius)
      return 0;
    const glow = 1 - distance / settings.mouseGlowRadius;
    return glow * glow * (0.35 + depth * 0.65);
  }
  getParallaxOffset(ctx, mouse, settings) {
    if (!settings.enableParallax || mouse.x < 0 || mouse.y < 0) {
      return { x: 0, y: 0 };
    }
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    if (centerX <= 0 || centerY <= 0) {
      return { x: 0, y: 0 };
    }
    const offsetX = (mouse.x - centerX) / centerX;
    const offsetY = (mouse.y - centerY) / centerY;
    const maxOffset = 30;
    return {
      x: offsetX * maxOffset,
      y: offsetY * maxOffset
    };
  }
  getRenderPosition(particle, parallax) {
    const depth = particle.depth ?? 1;
    const parallaxStrength = particle.kind === "deep" ? 1.35 : 1 - depth;
    return {
      x: particle.x - parallax.x * parallaxStrength,
      y: particle.y - parallax.y * parallaxStrength
    };
  }
  generateClusterPoints(width, height) {
    this.clusterPoints = [];
    const clusterCount = Math.floor(
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
  randomDepth() {
    const roll = Math.random();
    if (roll < 0.55) {
      return this.random(0.35, 0.55);
    }
    if (roll < 0.85) {
      return this.random(0.55, 0.8);
    }
    return this.random(0.8, 1);
  }
  shouldCreateDeepParticle() {
    return Math.random() < 0.45;
  }
  distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }
  random(min, max) {
    return min + Math.random() * (max - min);
  }
};

// src/render/shootingStars.ts
var ShootingStars = class {
  constructor() {
    this.stars = [];
    this.nextShootingStar = 0;
  }
  scheduleNext(time) {
    this.nextShootingStar = time + this.random(2500, 6500);
  }
  update(delta, time, width, height, enabled) {
    if (enabled && time > this.nextShootingStar) {
      this.create(width, height);
      this.nextShootingStar = time + this.random(3500, 9e3);
    }
    this.stars = this.stars.filter((star) => {
      star.x += star.vx * (delta / 1e3);
      star.y += star.vy * (delta / 1e3);
      star.life -= delta;
      return star.life > 0;
    });
  }
  draw(ctx) {
    for (const star of this.stars) {
      const alpha = Math.max(star.life / star.maxLife, 0);
      const endX = star.x - star.vx * 0.08;
      const endY = star.y - star.vy * 0.08;
      const gradient = ctx.createLinearGradient(
        star.x,
        star.y,
        endX,
        endY
      );
      gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }
  clear() {
    this.stars = [];
  }
  create(width, height) {
    const fromLeft = Math.random() > 0.5;
    this.stars.push({
      x: fromLeft ? -100 : width + 100,
      y: Math.random() * height * 0.55,
      vx: fromLeft ? this.random(550, 950) : -this.random(550, 950),
      vy: this.random(160, 360),
      life: this.random(700, 1300),
      maxLife: 1300
    });
  }
  random(min, max) {
    return min + Math.random() * (max - min);
  }
};

// src/render/interactionEffects.ts
var InteractionEffects = class {
  constructor(burstSystem) {
    this.burstSystem = burstSystem;
    this.burstCharges = 1;
    this.maxBurstCharges = 1;
    this.burstRechargeProgress = 0;
  }
  update(delta, burstCooldownMs) {
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
  handleClick(x, y, canvasWidth, canvasHeight, clickEffectMode, particleLimit) {
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
  getBurstCooldownProgress(burstCooldownMs) {
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
};

// src/render/burstSystem.ts
var BurstSystem = class {
  constructor(particleSystem) {
    this.particleSystem = particleSystem;
    this.particles = [];
  }
  createRadialBurst(x, y) {
    const burstAmount = 34;
    for (let i = 0; i < burstAmount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.random(45, 115);
      this.particles.push({
        x: x + Math.cos(angle) * this.random(2, 6),
        y: y + Math.sin(angle) * this.random(2, 6),
        size: this.random(0.6, 1.8),
        density: this.random(6, 18),
        hue: this.random(200, 265),
        speedX: Math.cos(angle) * this.random(0.6, 1.8),
        speedY: Math.sin(angle) * this.random(0.6, 1.8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        kind: "burst",
        life: this.random(2800, 3800),
        maxLife: 3800,
        glow: 0.55
      });
    }
    const coreAmount = 8;
    for (let i = 0; i < coreAmount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.random(10, 32);
      this.particles.push({
        x: x + Math.cos(angle) * this.random(3, 12),
        y: y + Math.sin(angle) * this.random(3, 12),
        size: this.random(0.9, 2.1),
        density: this.random(5, 12),
        hue: this.random(205, 255),
        speedX: Math.cos(angle) * this.random(0.1, 0.5),
        speedY: Math.sin(angle) * this.random(0.1, 0.5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        kind: "burst",
        life: this.random(2400, 3400),
        maxLife: 3400,
        glow: 0.5
      });
    }
  }
  createDirectionalBurst(x, y, baseAngle) {
    const burstAmount = 26;
    for (let i = 0; i < burstAmount; i++) {
      const angle = baseAngle + this.random(-0.14, 0.14);
      const speed = this.random(65, 135);
      this.particles.push({
        x,
        y,
        size: this.random(0.6, 1.9),
        density: this.random(6, 18),
        hue: this.random(200, 265),
        speedX: Math.cos(angle) * this.random(1.1, 2.8),
        speedY: Math.sin(angle) * this.random(1.1, 2.8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        kind: "burst",
        life: this.random(2200, 3200),
        maxLife: 3200,
        glow: 0.55
      });
    }
  }
  createGravityBurst(x, y) {
    const burstAmount = 22;
    for (let i = 0; i < burstAmount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.random(35, 85);
      this.particles.push({
        x,
        y,
        size: this.random(0.6, 1.8),
        density: this.random(6, 18),
        hue: this.random(200, 265),
        speedX: Math.cos(angle) * this.random(0.8, 2.2),
        speedY: Math.sin(angle) * this.random(0.8, 2.2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        kind: "burst",
        gravityX: x,
        gravityY: y,
        bounceCount: 0,
        maxBounces: 2,
        gravityTime: 3600,
        maxGravityTime: 3600,
        affectedByGravity: true,
        glow: 0.6
      });
    }
  }
  update(width, height, delta) {
    const finishedParticles = [];
    for (const particle of this.particles) {
      if (particle.affectedByGravity && particle.gravityX !== void 0 && particle.gravityY !== void 0 && particle.gravityTime !== void 0) {
        this.updateGravityParticle(particle, delta);
        if (particle.gravityTime <= 0) {
          finishedParticles.push(particle);
        }
      } else if (particle.life !== void 0) {
        particle.life -= delta;
        if (particle.life <= 0) {
          finishedParticles.push(particle);
        }
      }
      particle.x += particle.speedX + particle.vx * 0.05;
      particle.y += particle.speedY + particle.vy * 0.05;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      particle.speedX *= 0.992;
      particle.speedY *= 0.992;
      if (particle.glow !== void 0 && particle.glow > 0) {
        particle.glow -= delta * 16e-5;
        if (particle.glow < 0) {
          particle.glow = 0;
        }
      }
      if (particle.x < -50)
        particle.x = width + 50;
      if (particle.x > width + 50)
        particle.x = -50;
      if (particle.y < -50)
        particle.y = height + 50;
      if (particle.y > height + 50)
        particle.y = -50;
    }
    this.particles = this.particles.filter((particle) => {
      const normalAlive = particle.life === void 0 || particle.life > 0;
      const gravityAlive = particle.gravityTime === void 0 || particle.gravityTime > 0;
      return normalAlive && gravityAlive;
    });
    for (const particle of finishedParticles) {
      this.particleSystem.addAmbientParticle({
        ...particle,
        kind: "ambient",
        life: void 0,
        maxLife: void 0,
        gravityX: void 0,
        gravityY: void 0,
        bounceCount: void 0,
        maxBounces: void 0,
        gravityTime: void 0,
        maxGravityTime: void 0,
        affectedByGravity: void 0,
        glow: 0
      });
    }
  }
  draw(ctx, mouse) {
    for (const particle of this.particles) {
      const fade = this.getParticleFade(particle);
      const alpha = 0.04 + fade * 0.5;
      const size = particle.size + (particle.glow ?? 0) * 0.8;
      if ((particle.glow ?? 0) > 0.03) {
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          size * 4.2
        );
        gradient.addColorStop(
          0,
          `hsla(${particle.hue}, 85%, 72%, ${(particle.glow ?? 0) * 0.18})`
        );
        gradient.addColorStop(
          1,
          `hsla(${particle.hue}, 85%, 72%, 0)`
        );
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(
          particle.x,
          particle.y,
          size * 4.2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = `hsla(${particle.hue}, 80%, 72%, ${alpha})`;
      ctx.arc(
        particle.x,
        particle.y,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  limitParticles(maxParticles) {
    if (this.particles.length <= maxParticles) {
      return;
    }
    this.particles.splice(
      0,
      this.particles.length - maxParticles
    );
  }
  clear() {
    this.particles = [];
  }
  updateGravityParticle(particle, delta) {
    particle.gravityTime -= delta;
    const dx = particle.gravityX - particle.x;
    const dy = particle.gravityY - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      const angle = Math.atan2(dy, dx);
      const gravityForce = 90 / Math.max(distance, 100);
      particle.vx += Math.cos(angle) * gravityForce;
      particle.vy += Math.sin(angle) * gravityForce;
    }
    if (distance < 14) {
      const outwardAngle = Math.atan2(
        particle.y - particle.gravityY,
        particle.x - particle.gravityX
      );
      particle.vx = Math.cos(outwardAngle) * this.random(45, 75);
      particle.vy = Math.sin(outwardAngle) * this.random(45, 75);
      particle.bounceCount = (particle.bounceCount ?? 0) + 1;
    }
  }
  getParticleFade(particle) {
    if (particle.affectedByGravity && particle.gravityTime !== void 0 && particle.maxGravityTime !== void 0) {
      const ratio = Math.max(particle.gravityTime / particle.maxGravityTime, 0);
      return ratio * ratio * (3 - 2 * ratio);
    }
    if (particle.life !== void 0 && particle.maxLife !== void 0) {
      const ratio = Math.max(particle.life / particle.maxLife, 0);
      return ratio * ratio * (3 - 2 * ratio);
    }
    return 1;
  }
  random(min, max) {
    return min + Math.random() * (max - min);
  }
};

// src/render/cosmicObjects.ts
var CosmicObjects = class {
  constructor() {
    this.objects = [];
    this.zoom = 1;
    this.targetZoom = 1;
  }
  create(width, height) {
    this.objects = [];
    this.createGalaxies(width, height);
    this.createPlanets(width, height);
  }
  handleWheel(deltaY) {
    const direction = deltaY < 0 ? 1 : -1;
    this.targetZoom = this.clamp(
      this.targetZoom + direction * 0.06,
      0.78,
      1.45
    );
  }
  update(delta) {
    this.zoom += (this.targetZoom - this.zoom) * 0.08;
    for (const object of this.objects) {
      object.rotation += object.rotationSpeed * delta;
    }
  }
  draw(ctx, time, mouse, enableParallax) {
    for (const object of this.objects) {
      if (object.kind === "galaxy") {
        this.drawGalaxy(
          ctx,
          object,
          mouse,
          enableParallax
        );
      }
    }
    for (const object of this.objects) {
      if (object.kind === "planet") {
        this.drawPlanet(
          ctx,
          object,
          time,
          mouse,
          enableParallax
        );
      }
    }
  }
  createGalaxies(width, height) {
    const amount = Math.floor(
      this.random(2, 4)
    );
    for (let i = 0; i < amount; i++) {
      this.objects.push({
        kind: "galaxy",
        x: this.random(
          width * 0.1,
          width * 0.9
        ),
        y: this.random(
          height * 0.1,
          height * 0.9
        ),
        radius: this.random(120, 210),
        hue: this.random(205, 275),
        alpha: this.random(0.09, 0.16),
        depth: this.random(0.06, 0.22),
        rotation: this.random(
          0,
          Math.PI * 2
        ),
        rotationSpeed: this.random(
          -35e-6,
          35e-6
        )
      });
    }
  }
  createPlanets(width, height) {
    const amount = Math.floor(
      this.random(2, 5)
    );
    for (let i = 0; i < amount; i++) {
      this.objects.push({
        kind: "planet",
        x: this.random(
          width * 0.12,
          width * 0.88
        ),
        y: this.random(
          height * 0.12,
          height * 0.88
        ),
        radius: this.random(20, 42),
        hue: this.random(185, 295),
        alpha: this.random(0.34, 0.52),
        depth: this.random(0.24, 0.52),
        rotation: this.random(
          0,
          Math.PI * 2
        ),
        rotationSpeed: this.random(
          -8e-5,
          8e-5
        ),
        hasRing: Math.random() < 0.5
      });
    }
  }
  drawGalaxy(ctx, object, mouse, enableParallax) {
    const position = this.getRenderPosition(
      ctx,
      object,
      mouse,
      enableParallax
    );
    const scale = this.getZoomScale(object);
    const radius = object.radius * scale;
    ctx.save();
    ctx.translate(
      position.x,
      position.y
    );
    ctx.rotate(object.rotation);
    ctx.scale(1, 0.34);
    const gradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      radius
    );
    gradient.addColorStop(
      0,
      `hsla(${object.hue}, 85%, 76%, ${object.alpha})`
    );
    gradient.addColorStop(
      0.28,
      `hsla(${object.hue + 18}, 78%, 62%, ${object.alpha * 0.62})`
    );
    gradient.addColorStop(
      0.65,
      `hsla(${object.hue - 20}, 70%, 45%, ${object.alpha * 0.22})`
    );
    gradient.addColorStop(
      1,
      `hsla(${object.hue}, 80%, 50%, 0)`
    );
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(
      0,
      0,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }
  drawPlanet(ctx, object, time, mouse, enableParallax) {
    const position = this.getRenderPosition(
      ctx,
      object,
      mouse,
      enableParallax
    );
    const scale = this.getZoomScale(object);
    const radius = object.radius * scale;
    const pulse = 0.9 + Math.sin(
      time * 45e-5 + object.radius
    ) * 0.1;
    ctx.save();
    ctx.translate(
      position.x,
      position.y
    );
    ctx.rotate(object.rotation);
    if (object.hasRing) {
      ctx.save();
      ctx.rotate(-0.4);
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${object.hue}, 58%, 76%, ${object.alpha * 0.9})`;
      ctx.lineWidth = 1.2;
      ctx.ellipse(
        0,
        0,
        radius * 1.9,
        radius * 0.55,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();
    }
    const glow = ctx.createRadialGradient(
      0,
      0,
      radius * 0.2,
      0,
      0,
      radius * 3.4
    );
    glow.addColorStop(
      0,
      `hsla(${object.hue}, 82%, 72%, ${object.alpha * 0.32 * pulse})`
    );
    glow.addColorStop(
      1,
      `hsla(${object.hue}, 80%, 70%, 0)`
    );
    ctx.beginPath();
    ctx.fillStyle = glow;
    ctx.arc(
      0,
      0,
      radius * 3.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    const body = ctx.createRadialGradient(
      -radius * 0.35,
      -radius * 0.35,
      radius * 0.1,
      0,
      0,
      radius
    );
    body.addColorStop(
      0,
      `hsla(${object.hue + 14}, 72%, 78%, ${object.alpha})`
    );
    body.addColorStop(
      0.55,
      `hsla(${object.hue}, 64%, 50%, ${object.alpha * 0.95})`
    );
    body.addColorStop(
      1,
      `hsla(${object.hue - 24}, 62%, 24%, ${object.alpha * 0.8})`
    );
    ctx.beginPath();
    ctx.fillStyle = body;
    ctx.arc(
      0,
      0,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = `rgba(0, 0, 0, ${object.alpha * 0.42})`;
    ctx.arc(
      radius * 0.28,
      radius * 0.12,
      radius * 0.95,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }
  getRenderPosition(ctx, object, mouse, enableParallax) {
    const centerX = ctx.canvas.clientWidth / 2;
    const centerY = ctx.canvas.clientHeight / 2;
    const zoomInfluence = 0.18 + object.depth * 0.65;
    const zoomedX = centerX + (object.x - centerX) * (1 + (this.zoom - 1) * zoomInfluence);
    const zoomedY = centerY + (object.y - centerY) * (1 + (this.zoom - 1) * zoomInfluence);
    if (!enableParallax || mouse.x < 0 || mouse.y < 0) {
      return {
        x: zoomedX,
        y: zoomedY
      };
    }
    const offsetX = (mouse.x - centerX) / centerX;
    const offsetY = (mouse.y - centerY) / centerY;
    const parallaxStrength = 32 * (1 - object.depth);
    return {
      x: zoomedX - offsetX * parallaxStrength,
      y: zoomedY - offsetY * parallaxStrength
    };
  }
  getZoomScale(object) {
    const zoomInfluence = 0.22 + object.depth * 0.55;
    return 1 + (this.zoom - 1) * zoomInfluence;
  }
  random(min, max) {
    return min + Math.random() * (max - min);
  }
  clamp(value, min, max) {
    return Math.max(
      min,
      Math.min(max, value)
    );
  }
  applySettings(_settings) {
  }
};

// src/render/backgroundRenderer.ts
var BackgroundRenderer = class {
  constructor() {
    this.graphView = null;
    this.layerFar = null;
    this.layerNear = null;
  }
  setContainer(container, settings) {
    this.graphView = container;
    this.graphView.style.position = "relative";
    this.graphView.style.overflow = "hidden";
    this.graphView.style.background = "#00020a";
    this.applySettings(settings);
  }
  applySettings(settings) {
    if (!this.graphView)
      return;
    if (!this.layerFar || !this.layerNear) {
      this.clearLayers();
      this.createLayers(settings);
      return;
    }
    this.syncLayer(
      this.layerFar,
      settings.backgroundFarStarCount,
      settings.backgroundFarStarMinSize,
      settings.backgroundFarStarMaxSize,
      settings
    );
    this.syncLayer(
      this.layerNear,
      settings.backgroundNearStarCount,
      settings.backgroundNearStarMinSize,
      settings.backgroundNearStarMaxSize,
      settings
    );
    this.applyStarVisuals(
      this.layerFar,
      settings.backgroundFarStarMinSize,
      settings.backgroundFarStarMaxSize,
      settings
    );
    this.applyStarVisuals(
      this.layerNear,
      settings.backgroundNearStarMinSize,
      settings.backgroundNearStarMaxSize,
      settings
    );
    this.applyAnimationSettings(settings);
  }
  regenerate(settings) {
    if (!this.graphView)
      return;
    this.clearLayers();
    this.createLayers(settings);
  }
  updateMouse(mouseX, mouseY, enabled, settings) {
    if (!enabled || !this.graphView || !this.layerFar || !this.layerNear) {
      return;
    }
    const rect = this.graphView.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const offsetX = (mouseX - centerX) / centerX;
    const offsetY = (mouseY - centerY) / centerY;
    this.layerFar.style.transform = `translate(${offsetX * -settings.backgroundFarParallax}px, ${offsetY * -settings.backgroundFarParallax}px)`;
    this.layerNear.style.transform = `translate(${offsetX * -settings.backgroundNearParallax}px, ${offsetY * -settings.backgroundNearParallax}px)`;
  }
  resetMouse() {
    if (this.layerFar) {
      this.layerFar.style.transform = "translate(0px, 0px)";
    }
    if (this.layerNear) {
      this.layerNear.style.transform = "translate(0px, 0px)";
    }
  }
  update(_enabled) {
  }
  createLayers(settings) {
    if (!this.graphView)
      return;
    this.layerFar = this.createLayer(
      "cosmos-stars-far",
      settings.backgroundFarStarCount,
      settings.backgroundFarStarMinSize,
      settings.backgroundFarStarMaxSize,
      settings
    );
    this.layerNear = this.createLayer(
      "cosmos-stars-near",
      settings.backgroundNearStarCount,
      settings.backgroundNearStarMinSize,
      settings.backgroundNearStarMaxSize,
      settings
    );
    this.graphView.prepend(this.layerFar);
    this.graphView.prepend(this.layerNear);
    this.applyAnimationSettings(settings);
  }
  createLayer(className, amount, minSize, maxSize, settings) {
    const layer = document.createElement("div");
    layer.className = className;
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.width = "100%";
    layer.style.height = "100%";
    layer.style.pointerEvents = "none";
    layer.style.zIndex = "0";
    layer.style.transition = "transform 220ms ease-out";
    for (let i = 0; i < amount; i++) {
      layer.appendChild(
        this.createStar(minSize, maxSize, settings)
      );
    }
    return layer;
  }
  syncLayer(layer, targetAmount, minSize, maxSize, settings) {
    const currentAmount = layer.children.length;
    if (currentAmount < targetAmount) {
      const missing = targetAmount - currentAmount;
      for (let i = 0; i < missing; i++) {
        layer.appendChild(
          this.createStar(minSize, maxSize, settings)
        );
      }
      return;
    }
    if (currentAmount > targetAmount) {
      const excess = currentAmount - targetAmount;
      for (let i = 0; i < excess; i++) {
        layer.lastElementChild?.remove();
      }
    }
  }
  applyStarVisuals(layer, minSize, maxSize, settings) {
    for (const child of Array.from(layer.children)) {
      const star = child;
      const currentSize = parseFloat(star.dataset.size ?? "1");
      const size = Math.max(
        minSize,
        Math.min(maxSize, currentSize)
      );
      const alpha = Math.max(
        settings.backgroundStarMinAlpha,
        Math.min(
          settings.backgroundStarMaxAlpha,
          parseFloat(star.dataset.alpha ?? "0.6")
        )
      );
      const hue = Math.max(
        settings.backgroundStarHueMin,
        Math.min(
          settings.backgroundStarHueMax,
          parseFloat(star.dataset.hue ?? "220")
        )
      );
      star.dataset.size = `${size}`;
      star.dataset.alpha = `${alpha}`;
      star.dataset.hue = `${hue}`;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.opacity = `${alpha}`;
      star.style.background = `hsla(${hue}, 80%, 88%, 1)`;
      star.style.boxShadow = `0 0 ${size * 4}px hsla(${hue}, 90%, 78%, ${alpha * 0.7})`;
    }
  }
  createStar(minSize, maxSize, settings) {
    const star = document.createElement("div");
    const size = this.random(minSize, maxSize);
    const alpha = this.random(
      settings.backgroundStarMinAlpha,
      settings.backgroundStarMaxAlpha
    );
    const hue = this.random(
      settings.backgroundStarHueMin,
      settings.backgroundStarHueMax
    );
    star.dataset.size = `${size}`;
    star.dataset.alpha = `${alpha}`;
    star.dataset.hue = `${hue}`;
    star.style.position = "absolute";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.borderRadius = "50%";
    star.style.opacity = `${alpha}`;
    star.style.background = `hsla(${hue}, 80%, 88%, 1)`;
    star.style.boxShadow = `0 0 ${size * 4}px hsla(${hue}, 90%, 78%, ${alpha * 0.7})`;
    if (Math.random() < settings.backgroundPulseChance) {
      star.style.animation = `cosmosPulse ${this.random(4, 10)}s ease-in-out infinite`;
    }
    return star;
  }
  applyAnimationSettings(settings) {
    if (this.layerFar) {
      this.layerFar.style.animation = `cosmosDriftFar ${settings.backgroundFarDriftSeconds}s linear infinite`;
    }
    if (this.layerNear) {
      this.layerNear.style.animation = `cosmosDriftNear ${settings.backgroundNearDriftSeconds}s linear infinite`;
    }
  }
  clearLayers() {
    this.layerFar?.remove();
    this.layerNear?.remove();
    this.layerFar = null;
    this.layerNear = null;
  }
  random(min, max) {
    return min + Math.random() * (max - min);
  }
};

// src/render/cosmosRenderer.ts
var CosmosRenderer = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.canvas = null;
    this.ctx = null;
    this.graphView = null;
    this.eventsBoundTo = null;
    this.resizeObserver = null;
    this.animationFrame = null;
    this.lastTime = 0;
    this.particleSystem = new ParticleSystem();
    this.burstSystem = new BurstSystem(
      this.particleSystem
    );
    this.shootingStars = new ShootingStars();
    this.cosmicObjects = new CosmicObjects();
    this.backgroundRenderer = new BackgroundRenderer();
    this.interactionEffects = new InteractionEffects(
      this.burstSystem
    );
    this.mouse = {
      x: -9999,
      y: -9999,
      radius: 130
    };
    this.animate = (time) => {
      const delta = Math.min(
        time - this.lastTime,
        32
      );
      this.lastTime = time;
      this.update(delta, time);
      this.draw(time);
      this.animationFrame = requestAnimationFrame(
        this.animate
      );
    };
  }
  start() {
    this.injectLoop();
  }
  reloadSettings() {
    this.backgroundRenderer.applySettings(
      this.plugin.settings
    );
    this.particleSystem.limitParticles(
      this.plugin.settings.maxParticles
    );
    this.particleSystem.applyVisualSettings(
      this.plugin.settings
    );
    this.burstSystem.limitParticles(
      this.plugin.settings.burstParticleLimit
    );
    this.cosmicObjects.applySettings?.(
      this.plugin.settings
    );
    this.mouse.radius = this.plugin.settings.mouseFieldRadius;
  }
  destroy() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(
        this.animationFrame
      );
    }
    this.resizeObserver?.disconnect();
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
    this.graphView = null;
    this.eventsBoundTo = null;
  }
  injectLoop() {
    window.setInterval(() => {
      this.injectCosmos();
    }, 1e3);
  }
  injectCosmos() {
    const graphView = document.querySelector(
      '.workspace-leaf-content[data-type="graph"] .view-content, .workspace-leaf-content[data-type="localgraph"] .view-content'
    );
    if (!graphView)
      return;
    const isNewGraphView = this.graphView !== graphView;
    if (!isNewGraphView && this.canvas?.isConnected) {
      return;
    }
    this.graphView = graphView;
    this.backgroundRenderer.setContainer(
      graphView,
      this.plugin.settings
    );
    let canvas = graphView.querySelector(
      ".cosmos-animation-canvas"
    );
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "cosmos-animation-canvas";
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "5";
      canvas.style.opacity = "1";
      canvas.style.mixBlendMode = "screen";
      graphView.appendChild(canvas);
    }
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;
    this.ctx = ctx;
    this.setupResizeObserver();
    this.resizeCanvas();
    this.setupEvents();
    if (this.canvas.clientWidth <= 0 || this.canvas.clientHeight <= 0) {
      return;
    }
    if (isNewGraphView || !this.particleSystem.hasParticles()) {
      this.burstSystem.clear();
      this.cosmicObjects.create(
        this.canvas.clientWidth,
        this.canvas.clientHeight
      );
      this.particleSystem.createParticles(
        this.canvas.clientWidth,
        this.canvas.clientHeight,
        this.plugin.settings.particleCount,
        this.plugin.settings
      );
    }
    this.shootingStars.scheduleNext(
      performance.now()
    );
    if (this.animationFrame === null) {
      this.lastTime = performance.now();
      this.animate(this.lastTime);
    }
  }
  setupResizeObserver() {
    if (!this.graphView)
      return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    this.resizeObserver.observe(
      this.graphView
    );
  }
  resizeCanvas() {
    if (!this.canvas || !this.graphView || !this.ctx) {
      return;
    }
    const rect = this.graphView.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(
      rect.width * dpr
    );
    this.canvas.height = Math.floor(
      rect.height * dpr
    );
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );
  }
  setupEvents() {
    if (!this.graphView)
      return;
    if (this.eventsBoundTo === this.graphView) {
      return;
    }
    this.eventsBoundTo = this.graphView;
    this.graphView.addEventListener(
      "mousemove",
      (event) => {
        if (!this.canvas)
          return;
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
        this.backgroundRenderer.updateMouse(
          this.mouse.x,
          this.mouse.y,
          this.plugin.settings.enableParallax,
          this.plugin.settings
        );
      }
    );
    this.graphView.addEventListener(
      "mouseleave",
      () => {
        this.mouse.x = -9999;
        this.mouse.y = -9999;
        this.backgroundRenderer.resetMouse();
      }
    );
    this.graphView.addEventListener(
      "wheel",
      (event) => {
        this.cosmicObjects.handleWheel(
          event.deltaY
        );
      },
      {
        passive: true
      }
    );
    this.graphView.addEventListener(
      "click",
      (event) => {
        if (!this.canvas)
          return;
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.interactionEffects.handleClick(
          x,
          y,
          this.canvas.clientWidth,
          this.canvas.clientHeight,
          this.plugin.settings.clickEffectMode,
          this.plugin.settings.burstParticleLimit
        );
      }
    );
  }
  update(delta, time) {
    if (!this.canvas)
      return;
    this.interactionEffects.update(
      delta,
      this.plugin.settings.gravityCooldownMs
    );
    this.backgroundRenderer.update(
      this.plugin.settings.enableParallax
    );
    this.cosmicObjects.update(
      delta
    );
    this.particleSystem.update(
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      this.mouse,
      delta,
      this.plugin.settings
    );
    this.burstSystem.update(
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      delta
    );
    this.shootingStars.update(
      delta,
      time,
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      this.plugin.settings.enableShootingStars
    );
  }
  draw(time) {
    if (!this.canvas || !this.ctx) {
      return;
    }
    this.ctx.clearRect(
      0,
      0,
      this.canvas.clientWidth,
      this.canvas.clientHeight
    );
    if (this.plugin.settings.enableParticles) {
      this.cosmicObjects.draw(
        this.ctx,
        time,
        this.mouse,
        this.plugin.settings.enableParallax
      );
      this.particleSystem.draw(
        this.ctx,
        time,
        this.mouse,
        this.plugin.settings
      );
      this.burstSystem.draw(
        this.ctx,
        this.mouse
      );
    }
    this.shootingStars.draw(
      this.ctx
    );
    this.drawBurstCooldownHud(
      this.ctx
    );
  }
  drawBurstCooldownHud(ctx) {
    if (this.plugin.settings.clickEffectMode === "none" || this.mouse.x < 0 || this.mouse.y < 0) {
      return;
    }
    const progress = this.interactionEffects.getBurstCooldownProgress(
      this.plugin.settings.gravityCooldownMs
    );
    const ready = this.interactionEffects.canUseBurst();
    const x = this.mouse.x + 14;
    const y = this.mouse.y + 18;
    const radius = 6;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = ready ? "rgba(210, 235, 255, 0.9)" : "rgba(160, 190, 255, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.arc(
      x,
      y,
      radius,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(120, 190, 255, 0.95)";
    ctx.lineWidth = 2;
    ctx.arc(
      x,
      y,
      radius,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * progress
    );
    ctx.stroke();
    if (ready) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(180, 220, 255, 0.75)";
      ctx.arc(
        x,
        y,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }
};

// src/settings/settingsTab.ts
var import_obsidian7 = require("obsidian");

// src/ui/renderBackgroundSettings.ts
var import_obsidian = require("obsidian");

// src/ui/createSettingSection.ts
function createSettingSection(containerEl, title, description) {
  const section = containerEl.createDiv();
  section.addClass("cosmos-settings-section");
  section.createEl("h3", {
    text: title
  }).addClass("cosmos-settings-section-title");
  if (description) {
    section.createEl("p", {
      text: description
    }).addClass("cosmos-settings-section-description");
  }
  return section;
}

// src/ui/renderBackgroundSettings.ts
function renderBackgroundSettings(containerEl, plugin) {
  const section = createSettingSection(
    containerEl,
    "Background Stars",
    "Configure the static starfield layers behind the graph."
  );
  new import_obsidian.Setting(section).setName("Far star count").setDesc("Amount of small stars in the far background layer.").addSlider((slider) => {
    slider.setLimits(0, 1e3, 10).setValue(plugin.settings.backgroundFarStarCount).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundFarStarCount = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Near star count").setDesc("Amount of brighter stars in the near background layer.").addSlider((slider) => {
    slider.setLimits(0, 600, 10).setValue(plugin.settings.backgroundNearStarCount).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundNearStarCount = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Far star min size").addSlider((slider) => {
    slider.setLimits(0.1, 2, 0.1).setValue(plugin.settings.backgroundFarStarMinSize).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundFarStarMinSize = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Far star max size").addSlider((slider) => {
    slider.setLimits(0.2, 4, 0.1).setValue(plugin.settings.backgroundFarStarMaxSize).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundFarStarMaxSize = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Near star min size").addSlider((slider) => {
    slider.setLimits(0.2, 4, 0.1).setValue(plugin.settings.backgroundNearStarMinSize).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundNearStarMinSize = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Near star max size").addSlider((slider) => {
    slider.setLimits(0.4, 6, 0.1).setValue(plugin.settings.backgroundNearStarMaxSize).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundNearStarMaxSize = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Minimum brightness").addSlider((slider) => {
    slider.setLimits(0.05, 1, 0.05).setValue(plugin.settings.backgroundStarMinAlpha).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundStarMinAlpha = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Maximum brightness").addSlider((slider) => {
    slider.setLimits(0.1, 1, 0.05).setValue(plugin.settings.backgroundStarMaxAlpha).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundStarMaxAlpha = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Hue min").setDesc("HSL hue value. 200 blue/cyan, 240 blue, 280 violet.").addSlider((slider) => {
    slider.setLimits(0, 360, 1).setValue(plugin.settings.backgroundStarHueMin).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundStarHueMin = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Hue max").addSlider((slider) => {
    slider.setLimits(0, 360, 1).setValue(plugin.settings.backgroundStarHueMax).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundStarHueMax = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Far parallax").addSlider((slider) => {
    slider.setLimits(0, 30, 1).setValue(plugin.settings.backgroundFarParallax).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundFarParallax = value;
      await plugin.saveSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Near parallax").addSlider((slider) => {
    slider.setLimits(0, 50, 1).setValue(plugin.settings.backgroundNearParallax).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundNearParallax = value;
      await plugin.saveSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Far drift duration").setDesc("Higher value = slower movement.").addSlider((slider) => {
    slider.setLimits(40, 300, 5).setValue(plugin.settings.backgroundFarDriftSeconds).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundFarDriftSeconds = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Near drift duration").setDesc("Higher value = slower movement.").addSlider((slider) => {
    slider.setLimits(40, 240, 5).setValue(plugin.settings.backgroundNearDriftSeconds).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundNearDriftSeconds = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
  new import_obsidian.Setting(section).setName("Pulse chance").setDesc("Percentage of stars that softly pulse.").addSlider((slider) => {
    slider.setLimits(0, 0.4, 0.01).setValue(plugin.settings.backgroundPulseChance).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundPulseChance = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    });
  });
}

// src/ui/renderGeneralSettings.ts
var import_obsidian2 = require("obsidian");
function renderGeneralSettings(containerEl, plugin) {
  const section = createSettingSection(
    containerEl,
    "General",
    "Main visual systems and global interaction mode."
  );
  new import_obsidian2.Setting(section).setName("Particles").setDesc("Enable or disable galaxy particles.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableParticles).onChange(async (value) => {
      plugin.settings.enableParticles = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian2.Setting(section).setName("Shooting stars").setDesc("Enable or disable shooting stars.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableShootingStars).onChange(async (value) => {
      plugin.settings.enableShootingStars = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian2.Setting(section).setName("Mouse field").setDesc("Enable or disable particle reaction around the mouse.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableMouseField).onChange(async (value) => {
      plugin.settings.enableMouseField = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian2.Setting(section).setName("Parallax").setDesc("Enable or disable subtle background movement.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableParallax).onChange(async (value) => {
      plugin.settings.enableParallax = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian2.Setting(section).setName("Click effect").setDesc("Choose what happens when clicking on the graph.").addDropdown(
    (dropdown) => dropdown.addOption("none", "None").addOption("radial", "Radial burst").addOption("directional", "Directional burst").addOption("gravity", "Gravity burst").setValue(plugin.settings.clickEffectMode).onChange(async (value) => {
      plugin.settings.clickEffectMode = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
}

// src/ui/renderUniverseSettings.ts
var import_obsidian3 = require("obsidian");
function renderUniverseSettings(containerEl, plugin) {
  const section = createSettingSection(
    containerEl,
    "Universe",
    "Control star amount, size, color, speed and initial distribution."
  );
  new import_obsidian3.Setting(section).setName("Initial particles").setDesc("Amount of stars created when the graph opens.").addSlider(
    (slider) => slider.setLimits(50, 700, 10).setValue(plugin.settings.particleCount).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.particleCount = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Max particles").setDesc("Maximum amount of ambient stars.").addSlider(
    (slider) => slider.setLimits(50, 1e3, 10).setValue(plugin.settings.maxParticles).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.maxParticles = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Base speed").setDesc("Base movement speed of ambient stars.").addSlider(
    (slider) => slider.setLimits(0.02, 1, 0.02).setValue(plugin.settings.baseSpeed).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.baseSpeed = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Star min size").setDesc("Minimum size of ambient stars.").addSlider(
    (slider) => slider.setLimits(0.1, 3, 0.05).setValue(plugin.settings.starMinSize).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.starMinSize = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Star max size").setDesc("Maximum size of ambient stars.").addSlider(
    (slider) => slider.setLimits(0.2, 5, 0.05).setValue(plugin.settings.starMaxSize).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.starMaxSize = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Star hue min").setDesc("Minimum hue value for ambient stars.").addSlider(
    (slider) => slider.setLimits(0, 360, 1).setValue(plugin.settings.starHueMin).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.starHueMin = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Star hue max").setDesc("Maximum hue value for ambient stars.").addSlider(
    (slider) => slider.setLimits(0, 360, 1).setValue(plugin.settings.starHueMax).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.starHueMax = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Clean center radius").setDesc("How empty the center starts.").addSlider(
    (slider) => slider.setLimits(0.05, 0.5, 0.01).setValue(plugin.settings.initialCleanRadiusRatio).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.initialCleanRadiusRatio = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Periphery min radius").setDesc("Minimum initial distance from the center.").addSlider(
    (slider) => slider.setLimits(0.05, 0.5, 0.01).setValue(plugin.settings.initialMinRadiusRatio).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.initialMinRadiusRatio = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Periphery max radius").setDesc("Maximum initial distance from the center.").addSlider(
    (slider) => slider.setLimits(0.1, 0.6, 0.01).setValue(plugin.settings.initialMaxRadiusRatio).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.initialMaxRadiusRatio = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(section).setName("Constellation clustering").setDesc("Chance of stars grouping into constellation-like arcs.").addSlider(
    (slider) => slider.setLimits(0, 1, 0.01).setValue(plugin.settings.initialClusterChance).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.initialClusterChance = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  const autoSpawnSection = createSettingSection(
    containerEl,
    "Auto Spawn",
    "Control progressive star generation after the universe has started."
  );
  new import_obsidian3.Setting(autoSpawnSection).setName("Auto spawn").setDesc("Generate new stars progressively.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableAutoSpawn).onChange(async (value) => {
      plugin.settings.enableAutoSpawn = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(autoSpawnSection).setName("Auto spawn interval").setDesc("Time between automatic star generation, in milliseconds.").addSlider(
    (slider) => slider.setLimits(250, 5e3, 250).setValue(plugin.settings.autoSpawnIntervalMs).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.autoSpawnIntervalMs = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian3.Setting(autoSpawnSection).setName("Auto spawn amount").setDesc("How many stars are generated per interval.").addSlider(
    (slider) => slider.setLimits(1, 10, 1).setValue(plugin.settings.autoSpawnAmount).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.autoSpawnAmount = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
}

// src/ui/renderConnectionSettings.ts
var import_obsidian4 = require("obsidian");
function renderConnectionSettings(containerEl, plugin) {
  const section = createSettingSection(
    containerEl,
    "Connections",
    "Control constellation lines, distance, thickness, opacity and color."
  );
  new import_obsidian4.Setting(section).setName("Enable connections").setDesc("Enable or disable constellation lines.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableConnections).onChange(async (value) => {
      plugin.settings.enableConnections = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian4.Setting(section).setName("Connection distance").setDesc("Maximum distance between stars to create connections.").addSlider(
    (slider) => slider.setLimits(20, 400, 5).setValue(plugin.settings.connectionDistance).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.connectionDistance = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian4.Setting(section).setName("Connection line width").setDesc("Thickness of constellation lines.").addSlider(
    (slider) => slider.setLimits(0.05, 2, 0.05).setValue(plugin.settings.connectionLineWidth).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.connectionLineWidth = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian4.Setting(section).setName("Connection opacity").setDesc("Base opacity of constellation lines.").addSlider(
    (slider) => slider.setLimits(0.01, 1, 0.01).setValue(plugin.settings.connectionBaseOpacity).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.connectionBaseOpacity = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian4.Setting(section).setName("Connection color").setDesc("Pick the color used for constellation lines.").addColorPicker(
    (color) => color.setValue(rgbToHex(plugin.settings.connectionColor)).onChange(async (value) => {
      plugin.settings.connectionColor = hexToRgb(value);
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
}
function rgbToHex(rgb) {
  const parts = rgb.split(",").map((value) => Number(value.trim()));
  const r = getValidColorPart(parts[0], 120);
  const g = getValidColorPart(parts[1], 195);
  const b = getValidColorPart(parts[2], 255);
  return "#" + toHex(r) + toHex(g) + toHex(b);
}
function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
function getValidColorPart(value, fallback) {
  if (isNaN(value)) {
    return fallback;
  }
  return Math.max(
    0,
    Math.min(255, Math.round(value))
  );
}
function toHex(value) {
  return ("0" + value.toString(16)).slice(-2);
}

// src/ui/renderMouseSettings.ts
var import_obsidian5 = require("obsidian");
function renderMouseSettings(containerEl, plugin) {
  const glowSection = createSettingSection(
    containerEl,
    "Mouse Glow",
    "Control how stars and connections light up near the mouse."
  );
  new import_obsidian5.Setting(glowSection).setName("Enable mouse glow").setDesc("Enable constellation glow near the mouse.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableMouseGlow).onChange(async (value) => {
      plugin.settings.enableMouseGlow = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian5.Setting(glowSection).setName("Mouse glow radius").setDesc("Radius where constellations light up near the mouse.").addSlider(
    (slider) => slider.setLimits(50, 600, 10).setValue(plugin.settings.mouseGlowRadius).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.mouseGlowRadius = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian5.Setting(glowSection).setName("Mouse connection glow").setDesc("How much mouse proximity increases connection opacity.").addSlider(
    (slider) => slider.setLimits(0, 1, 0.01).setValue(plugin.settings.mouseGlowConnectionOpacity).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.mouseGlowConnectionOpacity = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian5.Setting(glowSection).setName("Mouse line width boost").setDesc("How much mouse proximity thickens connection lines.").addSlider(
    (slider) => slider.setLimits(0, 3, 0.05).setValue(plugin.settings.mouseGlowLineWidth).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.mouseGlowLineWidth = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian5.Setting(glowSection).setName("Mouse particle brightness").setDesc("How much nearby stars brighten around the mouse.").addSlider(
    (slider) => slider.setLimits(0, 1, 0.01).setValue(plugin.settings.mouseGlowParticleAlpha).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.mouseGlowParticleAlpha = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian5.Setting(glowSection).setName("Mouse particle size boost").setDesc("How much nearby stars grow around the mouse.").addSlider(
    (slider) => slider.setLimits(0, 3, 0.05).setValue(plugin.settings.mouseGlowParticleSize).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.mouseGlowParticleSize = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  const fieldSection = createSettingSection(
    containerEl,
    "Mouse Field",
    "Control the physical repulsion effect around the mouse."
  );
  new import_obsidian5.Setting(fieldSection).setName("Mouse field radius").setDesc("Radius of particle repulsion around the mouse.").addSlider(
    (slider) => slider.setLimits(20, 400, 5).setValue(plugin.settings.mouseFieldRadius).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.mouseFieldRadius = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian5.Setting(fieldSection).setName("Mouse repulse strength").setDesc("Strength of mouse particle repulsion.").addSlider(
    (slider) => slider.setLimits(0, 500, 10).setValue(plugin.settings.mouseRepulseStrength).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.mouseRepulseStrength = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
}

// src/ui/renderBurstSettings.ts
var import_obsidian6 = require("obsidian");
function renderBurstSettings(containerEl, plugin) {
  const burstSection = createSettingSection(
    containerEl,
    "Bursts",
    "Control global burst behavior, cooldown and glow."
  );
  new import_obsidian6.Setting(burstSection).setName("Cooldown Burst").setDesc("Global cooldown for all burst effects, in seconds.").addSlider(
    (slider) => slider.setLimits(0.5, 8, 0.5).setValue(plugin.settings.gravityCooldownMs / 1e3).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.gravityCooldownMs = value * 1e3;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian6.Setting(burstSection).setName("Burst particle limit").setDesc("Maximum amount of temporary burst particles.").addSlider(
    (slider) => slider.setLimits(20, 800, 10).setValue(plugin.settings.burstParticleLimit).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.burstParticleLimit = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian6.Setting(burstSection).setName("Burst glow intensity").setDesc("Brightness of burst particle glow.").addSlider(
    (slider) => slider.setLimits(0, 1, 0.01).setValue(plugin.settings.burstGlowIntensity).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.burstGlowIntensity = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian6.Setting(burstSection).setName("Burst glow size").setDesc("Size of burst glow aura.").addSlider(
    (slider) => slider.setLimits(1, 10, 0.1).setValue(plugin.settings.burstGlowSize).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.burstGlowSize = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  const radialSection = createSettingSection(
    containerEl,
    "Radial Burst",
    "Control circular click explosions."
  );
  new import_obsidian6.Setting(radialSection).setName("Radial particles").setDesc("Amount of particles in radial burst.").addSlider(
    (slider) => slider.setLimits(5, 120, 1).setValue(plugin.settings.radialBurstAmount).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.radialBurstAmount = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian6.Setting(radialSection).setName("Radial core particles").setDesc("Amount of slower particles near the center of radial burst.").addSlider(
    (slider) => slider.setLimits(0, 60, 1).setValue(plugin.settings.radialCoreAmount).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.radialCoreAmount = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  const directionalSection = createSettingSection(
    containerEl,
    "Directional Burst",
    "Control cone-shaped bursts fired away from the graph center."
  );
  new import_obsidian6.Setting(directionalSection).setName("Directional particles").setDesc("Amount of particles in directional burst.").addSlider(
    (slider) => slider.setLimits(5, 120, 1).setValue(plugin.settings.directionalBurstAmount).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.directionalBurstAmount = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian6.Setting(directionalSection).setName("Directional spread").setDesc("Opening angle of directional burst.").addSlider(
    (slider) => slider.setLimits(0.01, 1, 0.01).setValue(plugin.settings.directionalSpread).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.directionalSpread = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  const gravitySection = createSettingSection(
    containerEl,
    "Gravity Burst",
    "Control click bursts that pull particles back toward the click point."
  );
  new import_obsidian6.Setting(gravitySection).setName("Gravity particles").setDesc("Amount of particles in gravity burst.").addSlider(
    (slider) => slider.setLimits(5, 120, 1).setValue(plugin.settings.gravityBurstAmount).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.gravityBurstAmount = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian6.Setting(gravitySection).setName("Gravity force").setDesc("Strength of attraction in gravity burst.").addSlider(
    (slider) => slider.setLimits(10, 300, 5).setValue(plugin.settings.gravityForce).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.gravityForce = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian6.Setting(gravitySection).setName("Gravity duration").setDesc("Duration of gravity burst in milliseconds.").addSlider(
    (slider) => slider.setLimits(500, 8e3, 100).setValue(plugin.settings.gravityDurationMs).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.gravityDurationMs = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian6.Setting(gravitySection).setName("Gravity bounce distance").setDesc("Distance from center where particles bounce outward.").addSlider(
    (slider) => slider.setLimits(2, 80, 1).setValue(plugin.settings.gravityBounceDistance).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.gravityBounceDistance = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
}

// src/settings/settingsTab.ts
var CosmosSettingTab = class extends import_obsidian7.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", {
      text: "Cosmos Graph"
    });
    renderBackgroundSettings(
      containerEl,
      this.plugin
    );
    renderGeneralSettings(
      containerEl,
      this.plugin
    );
    renderUniverseSettings(
      containerEl,
      this.plugin
    );
    renderConnectionSettings(
      containerEl,
      this.plugin
    );
    renderMouseSettings(
      containerEl,
      this.plugin
    );
    renderBurstSettings(
      containerEl,
      this.plugin
    );
  }
};

// src/settings/sections/background.ts
var DEFAULT_BACKGROUND_SETTINGS = {
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

// src/settings/sections/general.ts
var GENERAL_DEFAULTS = {
  enableParticles: true,
  enableShootingStars: true,
  enableMouseField: true,
  enableParallax: true,
  clickEffectMode: "radial"
};

// src/settings/sections/universe.ts
var UNIVERSE_DEFAULTS = {
  particleCount: 220,
  maxParticles: 320,
  enableAutoSpawn: true,
  autoSpawnIntervalMs: 1e3,
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

// src/settings/sections/connections.ts
var CONNECTION_DEFAULTS = {
  enableConnections: true,
  connectionDistance: 115,
  connectionLineWidth: 0.35,
  connectionColor: "120, 195, 255",
  connectionBaseOpacity: 0.06
};

// src/settings/sections/mouse.ts
var MOUSE_DEFAULTS = {
  enableMouseGlow: true,
  mouseGlowRadius: 260,
  mouseGlowConnectionOpacity: 0.22,
  mouseGlowLineWidth: 0.55,
  mouseGlowParticleAlpha: 0.22,
  mouseGlowParticleSize: 0.45,
  mouseFieldRadius: 130,
  mouseRepulseStrength: 160
};

// src/settings/sections/bursts.ts
var BURST_DEFAULTS = {
  gravityCooldownMs: 2e3,
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

// src/settings/default.ts
var DEFAULT_SETTINGS = {
  ...GENERAL_DEFAULTS,
  ...UNIVERSE_DEFAULTS,
  ...CONNECTION_DEFAULTS,
  ...MOUSE_DEFAULTS,
  ...BURST_DEFAULTS,
  ...DEFAULT_BACKGROUND_SETTINGS
};

// src/ui/cosmosControlView.ts
var import_obsidian8 = require("obsidian");
var COSMOS_CONTROL_VIEW_TYPE = "cosmos-control-view";
var CosmosControlView = class extends import_obsidian8.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return COSMOS_CONTROL_VIEW_TYPE;
  }
  getDisplayText() {
    return "Cosmos Control";
  }
  getIcon() {
    return "sparkles";
  }
  async onOpen() {
    this.render();
  }
  async onClose() {
  }
  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("cosmos-control-panel");
    container.createEl("h2", {
      text: "Cosmos Control"
    });
    container.createEl("p", {
      text: "Live visual controls for Cosmos Graph."
    });
    renderGeneralSettings(
      container,
      this.plugin
    );
    renderUniverseSettings(
      container,
      this.plugin
    );
    renderConnectionSettings(
      container,
      this.plugin
    );
    renderMouseSettings(
      container,
      this.plugin
    );
    renderBurstSettings(
      container,
      this.plugin
    );
    renderBackgroundSettings(
      container,
      this.plugin
    );
  }
};

// src/main.ts
var CosmosGraphPlugin = class extends import_obsidian9.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.renderer = null;
  }
  async onload() {
    await this.loadSettings();
    this.renderer = new CosmosRenderer(this);
    this.renderer.start();
    this.registerView(
      COSMOS_CONTROL_VIEW_TYPE,
      (leaf) => new CosmosControlView(leaf, this)
    );
    this.addRibbonIcon(
      "sparkles",
      "Open Cosmos Control",
      () => {
        this.activateCosmosControlView();
      }
    );
    this.addCommand({
      id: "open-cosmos-control",
      name: "Open Cosmos Control",
      callback: () => {
        this.activateCosmosControlView();
      }
    });
    this.addSettingTab(
      new CosmosSettingTab(this.app, this)
    );
  }
  onunload() {
    this.renderer?.destroy();
    this.renderer = null;
  }
  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.renderer?.reloadSettings();
  }
  async activateCosmosControlView() {
    const leaves = this.app.workspace.getLeavesOfType(
      COSMOS_CONTROL_VIEW_TYPE
    );
    if (leaves.length > 0) {
      this.app.workspace.revealLeaf(leaves[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf)
      return;
    await leaf.setViewState({
      type: COSMOS_CONTROL_VIEW_TYPE,
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
  }
};
