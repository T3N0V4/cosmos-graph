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

// src/effects/parallaxEffect.ts
function getParallaxOffset(mouseX, mouseY, width, height, strength) {
  if (width <= 0 || height <= 0) {
    return { x: 0, y: 0 };
  }
  const centerX = width / 2;
  const centerY = height / 2;
  const offsetX = (mouseX - centerX) / centerX;
  const offsetY = (mouseY - centerY) / centerY;
  return {
    x: offsetX * strength,
    y: offsetY * strength
  };
}

// src/Controller/parallaxController.ts
var ParallaxController = class {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.radius = 130;
    this.isInside = false;
    this.initialized = false;
  }
  setSize(width, height) {
    this.width = width;
    this.height = height;
    if (!this.initialized && width > 0 && height > 0) {
      this.currentX = width / 2;
      this.currentY = height / 2;
      this.targetX = width / 2;
      this.targetY = height / 2;
      this.initialized = true;
    }
  }
  setRadius(radius) {
    this.radius = radius;
  }
  move(x, y) {
    this.isInside = true;
    this.targetX = x;
    this.targetY = y;
  }
  leave() {
    this.isInside = false;
    this.targetX = this.width / 2;
    this.targetY = this.height / 2;
  }
  update(delta) {
    const smoothing = 1 - Math.pow(
      1e-3,
      delta / 1e3
    );
    this.currentX += (this.targetX - this.currentX) * smoothing;
    this.currentY += (this.targetY - this.currentY) * smoothing;
  }
  getMouse() {
    return {
      x: this.currentX,
      y: this.currentY,
      radius: this.radius,
      isInside: this.isInside
    };
  }
  getOffset(strength) {
    return getParallaxOffset(
      this.currentX,
      this.currentY,
      this.width,
      this.height,
      strength
    );
  }
  reset() {
    this.isInside = false;
    this.currentX = this.width / 2;
    this.currentY = this.height / 2;
    this.targetX = this.width / 2;
    this.targetY = this.height / 2;
  }
};

// src/render/particleSystem.ts
var ParticleSystem = class {
  constructor() {
    this.particles = [];
    this.spawnTimer = 0;
    this.clusterPoints = [];
    this.currentMaxParticles = 320;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.resizeGraceTime = 0;
    this.resizeGraceDuration = 180;
    this.mouseInfluence = 0;
    /*
        Connection cache:
        - Las partículas se siguen moviendo cada frame.
        - Las conexiones se recalculan cada cierto tiempo.
        - Cada frame se redibujan usando posiciones actuales.
    */
    this.cachedConnectionPairs = [];
    this.lastConnectionCacheTime = 0;
    this.connectionCacheIntervalMs = 80;
    this.debugMetrics = {
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
  }
  hasParticles() {
    return this.particles.length > 0;
  }
  getParticleCount() {
    return this.particles.length;
  }
  getDebugMetrics() {
    return this.debugMetrics;
  }
  applyVisualSettings(_settings) {
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
    this.limitParticles(this.currentMaxParticles);
    this.invalidateConnectionCache();
  }
  createParticles(width, height, amount, settings) {
    if (width <= 0 || height <= 0)
      return;
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
  update(width, height, mouse, delta, settings) {
    if (width <= 0 || height <= 0) {
      return;
    }
    this.handleResize(
      width,
      height
    );
    if (this.resizeGraceTime > 0) {
      this.resizeGraceTime = Math.max(
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
    const targetMouseInfluence = mouse.isInside === true ? 1 : 0;
    const mouseFadeSpeed = targetMouseInfluence > this.mouseInfluence ? 0.018 : 6e-3;
    this.mouseInfluence += (targetMouseInfluence - this.mouseInfluence) * Math.min(
      1,
      delta * mouseFadeSpeed
    );
    const mouseFieldEnabled = settings.enableMouseField && this.mouseInfluence > 0.01 && mouse.x >= 0 && mouse.y >= 0;
    const mouseFieldRadiusSquared = settings.mouseFieldRadius * settings.mouseFieldRadius;
    const baseSpeedForce = this.getBaseSpeedMultiplier(settings);
    for (const particle of this.particles) {
      if (particle.connectionAge !== void 0 && particle.connectionFadeDuration !== void 0) {
        particle.connectionAge += delta;
        if (particle.connectionAge > particle.connectionFadeDuration) {
          particle.connectionAge = particle.connectionFadeDuration;
        }
      }
      const depth = particle.depth ?? 1;
      const depthMotion = particle.kind === "deep" ? 0.08 : 0.35 + depth * 0.65;
      particle.speedX += this.random(-6e-3, 6e-3) * depthMotion * baseSpeedForce;
      particle.speedY += this.random(-6e-3, 6e-3) * depthMotion * baseSpeedForce;
      particle.speedX *= 0.992;
      particle.speedY *= 0.992;
      if (mouseFieldEnabled && particle.kind === "ambient") {
        const mouseDx = mouse.x - particle.x;
        const mouseDy = mouse.y - particle.y;
        const mouseDistanceSquared = mouseDx * mouseDx + mouseDy * mouseDy;
        if (mouseDistanceSquared < mouseFieldRadiusSquared) {
          const mouseDistance = Math.sqrt(mouseDistanceSquared) || 1;
          const force = (settings.mouseFieldRadius - mouseDistance) / settings.mouseFieldRadius;
          const depthForce = force * settings.mouseRepulseStrength * depthMotion * this.mouseInfluence;
          const directionX = mouseDx / mouseDistance;
          const directionY = mouseDy / mouseDistance;
          particle.vx -= directionX * depthForce / particle.density;
          particle.vy -= directionY * depthForce / particle.density;
        }
      }
      if (particle.affectedByGravity && particle.gravityX !== void 0 && particle.gravityY !== void 0) {
        const dx = particle.gravityX - particle.x;
        const dy = particle.gravityY - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;
        const attractionForce = Math.min(
          2.8,
          dist * 0.012
        );
        particle.vx += dirX * attractionForce;
        particle.vy += dirY * attractionForce;
        if (dist < 120) {
          particle.vx *= 0.9;
          particle.vy *= 0.9;
        }
        particle.vx *= 0.94;
        particle.vy *= 0.94;
      }
      particle.x += (particle.speedX + particle.vx * 0.05) * depthMotion;
      particle.y += (particle.speedY + particle.vy * 0.05) * depthMotion;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      if (this.resizeGraceTime <= 0) {
        if (particle.x < -50)
          particle.x = width + 50;
        if (particle.x > width + 50)
          particle.x = -50;
        if (particle.y < -50)
          particle.y = height + 50;
        if (particle.y > height + 50)
          particle.y = -50;
      } else {
        particle.x = Math.max(
          -50,
          Math.min(
            width + 50,
            particle.x
          )
        );
        particle.y = Math.max(
          -50,
          Math.min(
            height + 50,
            particle.y
          )
        );
      }
    }
  }
  draw(ctx, time, mouse, settings) {
    const parallax = this.getParallaxOffset(
      ctx,
      mouse,
      settings
    );
    this.debugMetrics.particleCount = this.particles.length;
    if (settings.enableConnections) {
      const connectionsStart = performance.now();
      this.drawConnections(
        ctx,
        mouse,
        settings,
        parallax
      );
      this.debugMetrics.drawConnectionsMs = performance.now() - connectionsStart;
    } else {
      this.debugMetrics.drawConnectionsMs = 0;
      this.debugMetrics.connectionGridMs = 0;
      this.debugMetrics.connectionScanMs = 0;
      this.debugMetrics.connectionStrokeMs = 0;
      this.debugMetrics.connectionSegments = 0;
      this.debugMetrics.connectionBuckets = 0;
      this.debugMetrics.connectionRenderPoints = 0;
    }
    const particlesStart = performance.now();
    this.drawParticles(
      ctx,
      time,
      mouse,
      settings,
      parallax
    );
    this.debugMetrics.drawParticlesMs = performance.now() - particlesStart;
  }
  limitParticles(maxParticles) {
    if (maxParticles <= 0) {
      this.particles = [];
      this.invalidateConnectionCache();
      return;
    }
    if (this.particles.length <= maxParticles)
      return;
    let excess = this.particles.length - maxParticles;
    this.particles = this.particles.filter((particle) => {
      if (excess > 0 && particle.kind === "ambient") {
        excess--;
        return false;
      }
      return true;
    });
    if (this.particles.length <= maxParticles) {
      this.invalidateConnectionCache();
      return;
    }
    excess = this.particles.length - maxParticles;
    this.particles = this.particles.filter((particle) => {
      if (excess > 0 && particle.kind === "deep") {
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
  generateProgressively(width, height, delta, settings) {
    if (!settings.enableAutoSpawn) {
      return;
    }
    const availableSlots = settings.maxParticles - this.particles.length;
    if (availableSlots <= 0) {
      this.limitParticles(settings.maxParticles);
      return;
    }
    this.spawnTimer += delta;
    if (this.spawnTimer < settings.autoSpawnIntervalMs) {
      return;
    }
    this.spawnTimer = 0;
    const amountToSpawn = Math.min(
      settings.autoSpawnAmount,
      availableSlots
    );
    for (let i = 0; i < amountToSpawn; i++) {
      const particle = this.createAmbientParticle(
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
    } while (attempts < 40 && (x < safeMargin || x > width - safeMargin || y < safeMargin || y > height - safeMargin || this.distance(
      x,
      y,
      centerX,
      centerY
    ) < cleanRadius));
    x = Math.max(
      safeMargin,
      Math.min(width - safeMargin, x)
    );
    y = Math.max(
      safeMargin,
      Math.min(height - safeMargin, y)
    );
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
      hue: isDeep ? this.random(205, 245) : this.getParticleHue(settings),
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
      } while (attempts < 30 && this.distance(
        x,
        y,
        centerX,
        centerY
      ) < cleanRadius);
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
  drawParticles(ctx, time, mouse, settings, parallax) {
    const mouseGlowEnabled = settings.enableMouseGlow && this.mouseInfluence > 0.01 && mouse.x >= 0 && mouse.y >= 0;
    const colorProfile = this.getParticleColorProfile(settings);
    const particleBrightness = this.clamp(
      settings.particleBrightness,
      0,
      3
    );
    const particleGlow = this.clamp(
      settings.particleGlow,
      0,
      1
    );
    for (const particle of this.particles) {
      const renderPosition = this.getRenderPosition(
        particle,
        parallax
      );
      const depth = particle.depth ?? 1;
      const isDeep = particle.kind === "deep";
      const depthSize = isDeep ? 0.22 + depth * 0.18 : 0.45 + depth * 0.75;
      const depthAlpha = isDeep ? 0.12 + depth * 0.18 : 0.32 + depth * 0.68;
      const mouseGlow = mouseGlowEnabled ? this.getMouseGlow(
        particle,
        mouse,
        settings,
        renderPosition
      ) * this.mouseInfluence : 0;
      const particleHue = this.getRenderParticleHue(
        particle,
        settings
      );
      const baseSize = isDeep ? particle.size : this.clamp(
        particle.size,
        settings.starMinSize,
        settings.starMaxSize
      );
      let alpha = (0.24 + Math.sin(
        time * 1e-3 + particle.density
      ) * 0.1) * depthAlpha * particleBrightness;
      if (isDeep)
        alpha *= 0.7;
      alpha += mouseGlow * settings.mouseGlowParticleAlpha * depthAlpha;
      const size = baseSize * depthSize + mouseGlow * settings.mouseGlowParticleSize * depthSize + (particle.glow ?? 0) * 0.8 * depthSize;
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
      saturation = this.applyParticleColorSaturation(
        saturation,
        colorProfile
      );
      lightness = this.applyParticleColorLightness(
        lightness,
        colorProfile
      );
      glowSaturation = this.applyParticleColorSaturation(
        glowSaturation,
        colorProfile
      );
      glowLightness = this.applyParticleColorLightness(
        glowLightness,
        colorProfile
      );
      alpha = this.clamp(
        alpha,
        0,
        1
      );
      if (!isDeep && particleGlow > 0 && (mouseGlow > 0.08 || (particle.glow ?? 0) > 0.01)) {
        const glowAlpha = this.clamp(
          (0.06 + particleGlow + mouseGlow * 0.12 + (particle.glow ?? 0) * 0.13) * depthAlpha * glowMultiplier,
          0,
          1
        );
        const gradient = ctx.createRadialGradient(
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
          size * (4.2 + particleGlow * 8),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = `hsla(${particleHue}, ${saturation}%, ${lightness}%, ${alpha})`;
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
        if (particle.glow < 0) {
          particle.glow = 0;
        }
      }
    }
  }
  drawConnections(ctx, mouse, settings, parallax) {
    const connectionDistance = settings.connectionDistance;
    if (connectionDistance <= 0) {
      return;
    }
    const now = performance.now();
    const mouseGlowEnabled = settings.enableMouseGlow && this.mouseInfluence > 0.01 && mouse.x >= 0 && mouse.y >= 0;
    const mouseGlowRadiusSquared = settings.mouseGlowRadius * settings.mouseGlowRadius;
    const renderPoints = [];
    const renderPointByIndex = [];
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (particle.kind === "deep") {
        continue;
      }
      const renderPosition = this.getRenderPosition(
        particle,
        parallax
      );
      const point = {
        particle,
        index: i,
        x: renderPosition.x,
        y: renderPosition.y,
        depth: particle.depth ?? 1
      };
      renderPoints.push(point);
      renderPointByIndex[i] = point;
    }
    this.debugMetrics.connectionRenderPoints = renderPoints.length;
    const shouldRebuildCache = this.cachedConnectionPairs.length === 0 || now - this.lastConnectionCacheTime >= this.connectionCacheIntervalMs;
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
    const buckets = /* @__PURE__ */ new Map();
    let segmentCount = 0;
    for (const pair of this.cachedConnectionPairs) {
      const a = renderPointByIndex[pair.aIndex];
      const b = renderPointByIndex[pair.bIndex];
      if (!a || !b) {
        continue;
      }
      const depthDifference = Math.abs(a.depth - b.depth);
      if (depthDifference > 0.42) {
        continue;
      }
      const depthAverage = (a.depth + b.depth) / 2;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distanceSquared = dx * dx + dy * dy;
      const depthConnectionDistance = connectionDistance * (0.65 + depthAverage * 0.35);
      const maxDistanceSquared = depthConnectionDistance * depthConnectionDistance;
      if (distanceSquared >= maxDistanceSquared) {
        continue;
      }
      const distance = Math.sqrt(distanceSquared);
      const opacity = 1 - distance / depthConnectionDistance;
      let mouseGlow = 0;
      if (mouseGlowEnabled) {
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const mouseDx = mouse.x - midX;
        const mouseDy = mouse.y - midY;
        const mouseDistanceSquared = mouseDx * mouseDx + mouseDy * mouseDy;
        if (mouseDistanceSquared < mouseGlowRadiusSquared) {
          const mouseDistance = Math.sqrt(
            mouseDistanceSquared
          );
          mouseGlow = 1 - mouseDistance / settings.mouseGlowRadius;
          mouseGlow *= this.mouseInfluence;
        }
      }
      const fadeA = a.particle.connectionAge !== void 0 && a.particle.connectionFadeDuration !== void 0 ? a.particle.connectionAge / a.particle.connectionFadeDuration : 1;
      const fadeB = b.particle.connectionAge !== void 0 && b.particle.connectionFadeDuration !== void 0 ? b.particle.connectionAge / b.particle.connectionFadeDuration : 1;
      const connectionFade = Math.min(fadeA, fadeB);
      const finalOpacity = opacity * (settings.connectionBaseOpacity + mouseGlow * settings.mouseGlowConnectionOpacity) * (0.25 + depthAverage * 0.75) * connectionFade;
      if (finalOpacity < 0.02) {
        continue;
      }
      const lineWidth = (settings.connectionLineWidth + mouseGlow * settings.mouseGlowLineWidth) * (0.45 + depthAverage * 0.55);
      const opacityBucket = Math.round(finalOpacity * 20) / 20;
      const widthBucket = Math.round(lineWidth * 2) / 2;
      const bucketKey = `${opacityBucket}-${widthBucket}`;
      let bucket = buckets.get(bucketKey);
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
      ctx.strokeStyle = `rgba(${settings.connectionColor}, ${bucket.opacity})`;
      ctx.lineWidth = bucket.lineWidth;
      ctx.stroke(bucket.path);
    }
    this.debugMetrics.connectionStrokeMs = performance.now() - strokeStart;
    this.debugMetrics.connectionSegments = segmentCount;
    this.debugMetrics.connectionBuckets = buckets.size;
  }
  rebuildConnectionCache(renderPoints, connectionDistance, mouse, settings, mouseGlowEnabled, mouseGlowRadiusSquared) {
    const gridStart = performance.now();
    const cellSize = connectionDistance;
    const grid = /* @__PURE__ */ new Map();
    for (const point of renderPoints) {
      const cellX = Math.floor(point.x / cellSize);
      const cellY = Math.floor(point.y / cellSize);
      const cellKey = `${cellX},${cellY}`;
      let cell = grid.get(cellKey);
      if (!cell) {
        cell = [];
        grid.set(cellKey, cell);
      }
      cell.push(point);
    }
    this.debugMetrics.connectionGridMs = performance.now() - gridStart;
    const scanStart = performance.now();
    const maxConnectionsPerParticle = Math.max(
      1,
      settings.maxConnectionsPerParticle ?? 4
    );
    const newPairs = [];
    for (const a of renderPoints) {
      const cellX = Math.floor(a.x / cellSize);
      const cellY = Math.floor(a.y / cellSize);
      const bestCandidates = [];
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        for (let offsetY = -1; offsetY <= 1; offsetY++) {
          const neighborKey = `${cellX + offsetX},${cellY + offsetY}`;
          const neighbors = grid.get(neighborKey);
          if (!neighbors) {
            continue;
          }
          for (const b of neighbors) {
            if (b.index <= a.index) {
              continue;
            }
            const score = this.getConnectionCandidateScore(
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
    this.debugMetrics.connectionScanMs = performance.now() - scanStart;
  }
  getConnectionCandidateScore(a, b, connectionDistance, mouse, settings, mouseGlowEnabled, mouseGlowRadiusSquared) {
    const depthDifference = Math.abs(a.depth - b.depth);
    if (depthDifference > 0.42) {
      return 0;
    }
    const depthAverage = (a.depth + b.depth) / 2;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distanceSquared = dx * dx + dy * dy;
    const depthConnectionDistance = connectionDistance * (0.65 + depthAverage * 0.35);
    const maxDistanceSquared = depthConnectionDistance * depthConnectionDistance;
    if (distanceSquared >= maxDistanceSquared) {
      return 0;
    }
    const distance = Math.sqrt(distanceSquared);
    const opacity = 1 - distance / depthConnectionDistance;
    let mouseGlow = 0;
    if (mouseGlowEnabled) {
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const mouseDx = mouse.x - midX;
      const mouseDy = mouse.y - midY;
      const mouseDistanceSquared = mouseDx * mouseDx + mouseDy * mouseDy;
      if (mouseDistanceSquared < mouseGlowRadiusSquared) {
        const mouseDistance = Math.sqrt(
          mouseDistanceSquared
        );
        mouseGlow = 1 - mouseDistance / settings.mouseGlowRadius;
        mouseGlow *= this.mouseInfluence;
      }
    }
    return opacity * (0.7 + depthAverage * 0.3) + mouseGlow * 0.25;
  }
  addBestConnectionCandidate(candidates, candidate, maxCandidates) {
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
  getMouseGlow(particle, mouse, settings, renderPosition) {
    if (!settings.enableMouseGlow || mouse.x < 0 || mouse.y < 0 || particle.kind === "deep") {
      return 0;
    }
    const dx = mouse.x - renderPosition.x;
    const dy = mouse.y - renderPosition.y;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSquared = settings.mouseGlowRadius * settings.mouseGlowRadius;
    if (distanceSquared > radiusSquared) {
      return 0;
    }
    const distance = Math.sqrt(distanceSquared);
    const glow = 1 - distance / settings.mouseGlowRadius;
    const depth = particle.depth ?? 1;
    return glow * glow * (0.35 + depth * 0.65);
  }
  getParallaxOffset(ctx, mouse, settings) {
    if (!settings.enableParallax || mouse.x < 0 || mouse.y < 0) {
      return { x: 0, y: 0 };
    }
    const centerX = ctx.canvas.clientWidth / 2;
    const centerY = ctx.canvas.clientHeight / 2;
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
  getParticleHue(settings) {
    const color = settings.particleColor;
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      return this.hexToHsl(color).hue;
    }
    return this.random(
      settings.starHueMin,
      settings.starHueMax
    );
  }
  getRenderParticleHue(particle, settings) {
    const color = settings.particleColor;
    if (particle.kind !== "deep" && /^#[0-9a-fA-F]{6}$/.test(color)) {
      return this.hexToHsl(color).hue;
    }
    return particle.hue;
  }
  getBaseSpeedMultiplier(settings) {
    const defaultBaseSpeed = 0.22;
    return this.clamp(
      settings.baseSpeed / defaultBaseSpeed,
      0,
      5
    );
  }
  getParticleColorProfile(settings) {
    const color = settings.particleColor;
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return {
        saturation: 100,
        lightness: 60
      };
    }
    const hsl = this.hexToHsl(color);
    return {
      saturation: hsl.saturation,
      lightness: hsl.lightness
    };
  }
  applyParticleColorSaturation(baseSaturation, profile) {
    const saturationFactor = 0.35 + profile.saturation / 100 * 0.75;
    return this.clamp(
      baseSaturation * saturationFactor,
      0,
      100
    );
  }
  applyParticleColorLightness(baseLightness, profile) {
    const lightnessOffset = (profile.lightness - 60) * 0.35;
    return this.clamp(
      baseLightness + lightnessOffset,
      12,
      94
    );
  }
  hexToHsl(hex) {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = (max + min) / 2;
    if (delta === 0) {
      return {
        hue: 0,
        saturation: 0,
        lightness: Math.round(lightness * 100)
      };
    }
    let hue = 0;
    if (max === r) {
      hue = (g - b) / delta % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    const saturation = delta / (1 - Math.abs(2 * lightness - 1));
    return {
      hue: Math.round((hue * 60 + 360) % 360),
      saturation: Math.round(saturation * 100),
      lightness: Math.round(lightness * 100)
    };
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
  clamp(value, min, max) {
    return Math.max(
      min,
      Math.min(max, value)
    );
  }
  invalidateConnectionCache() {
    this.cachedConnectionPairs = [];
    this.lastConnectionCacheTime = 0;
  }
  handleResize(width, height) {
    if (this.lastWidth <= 0 || this.lastHeight <= 0) {
      this.lastWidth = width;
      this.lastHeight = height;
      return;
    }
    if (width === this.lastWidth && height === this.lastHeight) {
      return;
    }
    const scaleX = width / this.lastWidth;
    const scaleY = height / this.lastHeight;
    for (const particle of this.particles) {
      particle.x *= scaleX;
      particle.y *= scaleY;
      if (particle.gravityX !== void 0) {
        particle.gravityX *= scaleX;
      }
      if (particle.gravityY !== void 0) {
        particle.gravityY *= scaleY;
      }
    }
    for (const cluster of this.clusterPoints) {
      cluster.x *= scaleX;
      cluster.y *= scaleY;
    }
    this.lastWidth = width;
    this.lastHeight = height;
    this.resizeGraceTime = this.resizeGraceDuration;
    this.invalidateConnectionCache();
  }
};

// src/util/math.ts
function lerp(current, target, speed) {
  return current + (target - current) * speed;
}
function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

// src/util/random.ts
function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}
function randomChance(chance) {
  return Math.random() < chance;
}

// src/util/canvas.ts
function createRadialGlow(ctx, x, y, radius, innerColor, outerColor, options) {
  const innerX = options?.innerX ?? x;
  const innerY = options?.innerY ?? y;
  const innerRadius = options?.innerRadius ?? 0;
  const outerX = options?.outerX ?? x;
  const outerY = options?.outerY ?? y;
  const gradient = ctx.createRadialGradient(
    innerX,
    innerY,
    innerRadius,
    outerX,
    outerY,
    radius
  );
  if (options?.colorStops !== void 0) {
    for (const stop of options.colorStops) {
      gradient.addColorStop(
        stop.offset,
        stop.color
      );
    }
    return gradient;
  }
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(1, outerColor);
  return gradient;
}
function createLinearFade(ctx, startX, startY, endX, endY, startColor, endColor) {
  const gradient = ctx.createLinearGradient(
    startX,
    startY,
    endX,
    endY
  );
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  return gradient;
}
function drawFilledCircle(ctx, x, y, radius, fillStyle) {
  ctx.beginPath();
  ctx.fillStyle = fillStyle;
  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// src/render/cosmicObjects.ts
var CosmicObjects = class {
  constructor() {
    this.galaxies = [];
    this.planets = [];
    this.zoom = 1;
    this.targetZoom = 1;
  }
  create(width, height) {
    this.galaxies = [];
    this.planets = [];
    this.createGalaxies(width, height);
    this.createPlanets(width, height);
  }
  handleWheel(deltaY) {
    const direction = deltaY < 0 ? 1 : -1;
    this.targetZoom = clamp(
      this.targetZoom + direction * 0.06,
      0.78,
      1.45
    );
  }
  update(delta) {
    this.zoom += (this.targetZoom - this.zoom) * 0.08;
    for (const galaxy of this.galaxies) {
      galaxy.rotation += galaxy.rotationSpeed * delta;
    }
    for (const planet of this.planets) {
      planet.rotation += planet.rotationSpeed * delta;
    }
  }
  draw(ctx, time, mouse, enableParallax) {
    for (const galaxy of this.galaxies) {
      this.drawGalaxy(
        ctx,
        galaxy,
        mouse,
        enableParallax
      );
    }
    for (const planet of this.planets) {
      this.drawPlanet(
        ctx,
        planet,
        time,
        mouse,
        enableParallax
      );
    }
  }
  applySettings(_settings) {
  }
  createGalaxies(width, height) {
    const amount = Math.floor(
      randomFloat(2, 4)
    );
    for (let i = 0; i < amount; i++) {
      this.galaxies.push({
        x: randomFloat(
          width * 0.1,
          width * 0.9
        ),
        y: randomFloat(
          height * 0.1,
          height * 0.9
        ),
        radius: randomFloat(120, 210),
        hue: randomFloat(205, 275),
        alpha: randomFloat(0.09, 0.16),
        depth: randomFloat(0.06, 0.22),
        rotation: randomFloat(
          0,
          Math.PI * 2
        ),
        rotationSpeed: randomFloat(
          -35e-6,
          35e-6
        )
      });
    }
  }
  createPlanets(width, height) {
    const amount = Math.floor(
      randomFloat(2, 5)
    );
    for (let i = 0; i < amount; i++) {
      this.planets.push({
        x: randomFloat(
          width * 0.12,
          width * 0.88
        ),
        y: randomFloat(
          height * 0.12,
          height * 0.88
        ),
        radius: randomFloat(20, 42),
        hue: randomFloat(185, 295),
        alpha: randomFloat(0.34, 0.52),
        depth: randomFloat(0.24, 0.52),
        rotation: randomFloat(
          0,
          Math.PI * 2
        ),
        rotationSpeed: randomFloat(
          -8e-5,
          8e-5
        ),
        hasRing: randomChance(0.5)
      });
    }
  }
  drawGalaxy(ctx, galaxy, mouse, enableParallax) {
    const position = this.getRenderPosition(
      ctx,
      galaxy,
      mouse,
      enableParallax
    );
    const scale = this.getZoomScale(galaxy);
    const radius = galaxy.radius * scale;
    ctx.save();
    ctx.translate(
      position.x,
      position.y
    );
    ctx.rotate(galaxy.rotation);
    ctx.scale(1, 0.34);
    const gradient = createRadialGlow(
      ctx,
      0,
      0,
      radius,
      `hsla(${galaxy.hue}, 85%, 76%, ${galaxy.alpha})`,
      `hsla(${galaxy.hue}, 80%, 50%, 0)`,
      {
        colorStops: [
          {
            offset: 0,
            color: `hsla(${galaxy.hue}, 85%, 76%, ${galaxy.alpha})`
          },
          {
            offset: 0.28,
            color: `hsla(${galaxy.hue + 18}, 78%, 62%, ${galaxy.alpha * 0.62})`
          },
          {
            offset: 0.65,
            color: `hsla(${galaxy.hue - 20}, 70%, 45%, ${galaxy.alpha * 0.22})`
          },
          {
            offset: 1,
            color: `hsla(${galaxy.hue}, 80%, 50%, 0)`
          }
        ]
      }
    );
    drawFilledCircle(
      ctx,
      0,
      0,
      radius,
      gradient
    );
    ctx.restore();
  }
  drawPlanet(ctx, planet, time, mouse, enableParallax) {
    const position = this.getRenderPosition(
      ctx,
      planet,
      mouse,
      enableParallax
    );
    const scale = this.getZoomScale(planet);
    const radius = planet.radius * scale;
    const pulse = 0.9 + Math.sin(
      time * 45e-5 + planet.radius
    ) * 0.1;
    ctx.save();
    ctx.translate(
      position.x,
      position.y
    );
    ctx.rotate(planet.rotation);
    if (planet.hasRing) {
      ctx.save();
      ctx.rotate(-0.4);
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${planet.hue}, 58%, 76%, ${planet.alpha * 0.9})`;
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
    const glow = createRadialGlow(
      ctx,
      0,
      0,
      radius * 3.4,
      `hsla(${planet.hue}, 82%, 72%, ${planet.alpha * 0.32 * pulse})`,
      `hsla(${planet.hue}, 80%, 70%, 0)`,
      {
        innerRadius: radius * 0.2
      }
    );
    drawFilledCircle(
      ctx,
      0,
      0,
      radius * 3.4,
      glow
    );
    const body = createRadialGlow(
      ctx,
      0,
      0,
      radius,
      `hsla(${planet.hue + 14}, 72%, 78%, ${planet.alpha})`,
      `hsla(${planet.hue - 24}, 62%, 24%, ${planet.alpha * 0.8})`,
      {
        innerX: -radius * 0.35,
        innerY: -radius * 0.35,
        innerRadius: radius * 0.1,
        colorStops: [
          {
            offset: 0,
            color: `hsla(${planet.hue + 14}, 72%, 78%, ${planet.alpha})`
          },
          {
            offset: 0.55,
            color: `hsla(${planet.hue}, 64%, 50%, ${planet.alpha * 0.95})`
          },
          {
            offset: 1,
            color: `hsla(${planet.hue - 24}, 62%, 24%, ${planet.alpha * 0.8})`
          }
        ]
      }
    );
    drawFilledCircle(
      ctx,
      0,
      0,
      radius,
      body
    );
    drawFilledCircle(
      ctx,
      radius * 0.28,
      radius * 0.12,
      radius * 0.95,
      `rgba(0, 0, 0, ${planet.alpha * 0.42})`
    );
    ctx.restore();
  }
  getRenderPosition(ctx, entity, mouse, enableParallax) {
    const centerX = ctx.canvas.clientWidth / 2;
    const centerY = ctx.canvas.clientHeight / 2;
    const zoomInfluence = 0.18 + entity.depth * 0.65;
    const zoomedX = centerX + (entity.x - centerX) * (1 + (this.zoom - 1) * zoomInfluence);
    const zoomedY = centerY + (entity.y - centerY) * (1 + (this.zoom - 1) * zoomInfluence);
    if (!enableParallax || mouse.x < 0 || mouse.y < 0) {
      return {
        x: zoomedX,
        y: zoomedY
      };
    }
    const offsetX = (mouse.x - centerX) / centerX;
    const offsetY = (mouse.y - centerY) / centerY;
    const parallaxStrength = 32 * (1 - entity.depth);
    return {
      x: zoomedX - offsetX * parallaxStrength,
      y: zoomedY - offsetY * parallaxStrength
    };
  }
  getZoomScale(entity) {
    const zoomInfluence = 0.22 + entity.depth * 0.55;
    return 1 + (this.zoom - 1) * zoomInfluence;
  }
};

// src/render/backgroundRenderer.ts
var BackgroundRenderer = class {
  constructor() {
    this.graphView = null;
    this.root = null;
    this.farCanvas = null;
    this.farCtx = null;
    this.nearCanvas = null;
    this.nearCtx = null;
    this.starsFar = [];
    this.starsNear = [];
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.parallaxX = 0;
    this.parallaxY = 0;
    this.targetParallaxX = 0;
    this.targetParallaxY = 0;
    this.farVisibility = 0.45;
    this.nearVisibility = 1;
    this.farLayerDirty = true;
    this.settings = null;
    this.lastFarDrawTime = 0;
    this.farFrameInterval = 1e3 / 30;
    this.lastNearDrawTime = 0;
    this.nearFrameInterval = 1e3 / 45;
  }
  setContainer(container, settings) {
    const isNewContainer = this.graphView !== container;
    this.graphView = container;
    this.graphView.style.position = "relative";
    this.graphView.style.background = "#00020a";
    if (isNewContainer) {
      this.destroyCanvasOnly();
    }
    this.ensureRoot();
    this.ensureCanvasLayers();
    if (isNewContainer || this.starsFar.length === 0 && this.starsNear.length === 0) {
      this.createStars(settings);
    }
    this.resize();
    this.applySettings(settings);
  }
  regenerate(settings) {
    if (!this.graphView) {
      return;
    }
    this.createStars(settings);
    this.resize();
    this.farLayerDirty = true;
  }
  update(enableParallax) {
    if (!this.graphView || !this.graphView.isConnected || !this.farCtx || !this.nearCtx) {
      return;
    }
    const rect = this.graphView.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      return;
    }
    this.resize();
    if (!enableParallax) {
      this.parallaxX = lerp(
        this.parallaxX,
        0,
        0.08
      );
      this.parallaxY = lerp(
        this.parallaxY,
        0,
        0.08
      );
    } else {
      this.parallaxX = lerp(
        this.parallaxX,
        this.targetParallaxX,
        0.04
      );
      this.parallaxY = lerp(
        this.parallaxY,
        this.targetParallaxY,
        0.04
      );
    }
    this.draw();
  }
  setParallax(x, y) {
    this.targetParallaxX = clamp(
      x,
      -50,
      50
    );
    this.targetParallaxY = clamp(
      y,
      -50,
      50
    );
  }
  applySettings(settings) {
    const shouldRegenerate = !this.settings && this.starsFar.length === 0 && this.starsNear.length === 0 || this.settings !== null && (this.settings.backgroundFarStarCount !== settings.backgroundFarStarCount || this.settings.backgroundNearStarCount !== settings.backgroundNearStarCount);
    this.settings = {
      ...settings
    };
    if (shouldRegenerate) {
      this.createStars(settings);
    }
    this.farVisibility = 0.45;
    this.nearVisibility = 1;
    this.farLayerDirty = true;
  }
  destroy() {
    this.destroyCanvasOnly();
    this.graphView = null;
  }
  ensureRoot() {
    if (!this.graphView || this.root) {
      return;
    }
    const existing = this.graphView.querySelector(
      ".cosmos-background-root"
    );
    if (existing) {
      this.root = existing;
      this.farCanvas = existing.querySelector(
        ".cosmos-background-far-canvas"
      );
      this.nearCanvas = existing.querySelector(
        ".cosmos-background-near-canvas"
      );
      this.farCtx = this.farCanvas?.getContext("2d") ?? null;
      this.nearCtx = this.nearCanvas?.getContext("2d") ?? null;
      return;
    }
    const root = document.createElement(
      "div"
    );
    root.className = "cosmos-background-root";
    root.style.position = "absolute";
    root.style.inset = "0";
    root.style.pointerEvents = "none";
    root.style.overflow = "hidden";
    root.style.zIndex = "1";
    this.graphView.prepend(
      root
    );
    this.root = root;
  }
  ensureCanvasLayers() {
    if (!this.root) {
      return;
    }
    if (!this.farCanvas) {
      const farCanvas = this.createCanvas(
        "cosmos-background-far-canvas",
        "1"
      );
      this.root.appendChild(
        farCanvas
      );
      this.farCanvas = farCanvas;
      this.farCtx = farCanvas.getContext("2d");
    }
    if (!this.nearCanvas) {
      const nearCanvas = this.createCanvas(
        "cosmos-background-near-canvas",
        "2"
      );
      this.root.appendChild(
        nearCanvas
      );
      this.nearCanvas = nearCanvas;
      this.nearCtx = nearCanvas.getContext("2d");
    }
  }
  createCanvas(className, zIndex) {
    const canvas = document.createElement(
      "canvas"
    );
    canvas.className = className;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = zIndex;
    return canvas;
  }
  resize() {
    if (!this.graphView || !this.farCanvas || !this.nearCanvas) {
      return;
    }
    const rect = this.graphView.getBoundingClientRect();
    const width = Math.max(
      1,
      Math.floor(rect.width)
    );
    const height = Math.max(
      1,
      Math.floor(rect.height)
    );
    const dpr = Math.max(
      1,
      window.devicePixelRatio || 1
    );
    if (width === this.width && height === this.height && dpr === this.dpr) {
      return;
    }
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.farLayerDirty = true;
    this.resizeCanvas(
      this.farCanvas,
      this.farCtx,
      width,
      height,
      dpr
    );
    this.resizeCanvas(
      this.nearCanvas,
      this.nearCtx,
      width,
      height,
      dpr
    );
  }
  resizeCanvas(canvas, ctx, width, height, dpr) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx?.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );
  }
  createStars(settings) {
    this.starsFar = this.generateStars(
      settings.backgroundFarStarCount,
      {
        minDepth: 0.15,
        maxDepth: 0.45
      }
    );
    this.starsNear = this.generateStars(
      settings.backgroundNearStarCount,
      {
        minDepth: 0.5,
        maxDepth: 1
      }
    );
    this.farLayerDirty = true;
  }
  generateStars(count, config) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: randomFloat(
          0,
          1
        ),
        y: randomFloat(
          0,
          1
        ),
        sizeRatio: randomFloat(0, 1),
        depth: randomFloat(
          config.minDepth,
          config.maxDepth
        ),
        opacityRatio: randomFloat(0, 1),
        hueRatio: randomFloat(0, 1),
        pulseRoll: randomFloat(0, 1),
        twinkleOffset: randomFloat(
          0,
          Math.PI * 2
        ),
        twinkleSpeed: randomFloat(
          0.25,
          0.8
        )
      });
    }
    return stars;
  }
  draw() {
    if (!this.farCtx || !this.nearCtx) {
      return;
    }
    const now = performance.now();
    const time = now * 1e-3;
    const settings = this.settings;
    if (!settings) {
      return;
    }
    if (this.farLayerDirty || now - this.lastFarDrawTime >= this.farFrameInterval) {
      this.lastFarDrawTime = now;
      this.clearLayer(
        this.farCtx
      );
      this.drawStars(
        this.farCtx,
        this.starsFar,
        this.parallaxX * settings.backgroundFarParallax,
        this.parallaxY * settings.backgroundFarParallax,
        this.farVisibility,
        false,
        time,
        settings
      );
      this.farLayerDirty = false;
    }
    if (now - this.lastNearDrawTime < this.nearFrameInterval) {
      return;
    }
    this.lastNearDrawTime = now;
    this.clearLayer(
      this.nearCtx
    );
    this.drawStars(
      this.nearCtx,
      this.starsNear,
      this.parallaxX * settings.backgroundNearParallax,
      this.parallaxY * settings.backgroundNearParallax,
      this.nearVisibility,
      true,
      time,
      settings
    );
  }
  clearLayer(ctx) {
    ctx.clearRect(
      0,
      0,
      this.width,
      this.height
    );
  }
  drawStars(ctx, stars, parallaxX, parallaxY, visibility, drawSoftGlow, time, settings) {
    const baseMargin = drawSoftGlow ? 80 : 24;
    for (const star of stars) {
      const size = this.getStarSize(
        star,
        drawSoftGlow,
        settings
      );
      const twinkle = star.pulseRoll <= settings.backgroundPulseChance ? Math.sin(
        time * star.twinkleSpeed + star.twinkleOffset
      ) * 0.035 : 0;
      const opacity = clamp(
        (this.getStarOpacity(
          star,
          drawSoftGlow,
          settings
        ) + twinkle) * visibility,
        0,
        1
      );
      if (opacity <= 0.01) {
        continue;
      }
      const x = star.x * this.width + parallaxX * star.depth + this.getStarDriftX(
        star,
        drawSoftGlow,
        time,
        settings
      );
      const y = star.y * this.height + parallaxY * star.depth + this.getStarDriftY(
        star,
        drawSoftGlow,
        time,
        settings
      );
      const visualRadius = drawSoftGlow ? size * 2.2 : size;
      const margin = baseMargin + visualRadius;
      if (x + visualRadius < -margin || x - visualRadius > this.width + margin || y + visualRadius < -margin || y - visualRadius > this.height + margin) {
        continue;
      }
      this.drawStar(
        ctx,
        x,
        y,
        size,
        opacity,
        this.getStarColor(
          star,
          settings
        ),
        drawSoftGlow
      );
    }
  }
  getStarDriftX(star, isNearLayer, time, settings) {
    const duration = isNearLayer ? settings.backgroundNearDriftSeconds : settings.backgroundFarDriftSeconds;
    const safeDuration = Math.max(1, duration);
    return Math.cos(
      time / safeDuration * Math.PI * 2 + star.twinkleOffset
    ) * 12 * star.depth;
  }
  getStarDriftY(star, isNearLayer, time, settings) {
    const duration = isNearLayer ? settings.backgroundNearDriftSeconds : settings.backgroundFarDriftSeconds;
    const safeDuration = Math.max(1, duration);
    return Math.sin(
      time / safeDuration * Math.PI * 2 + star.twinkleOffset
    ) * 7 * star.depth;
  }
  getStarSize(star, isNearLayer, settings) {
    const minSize = isNearLayer ? settings.backgroundNearStarMinSize : settings.backgroundFarStarMinSize;
    const maxSize = isNearLayer ? settings.backgroundNearStarMaxSize : settings.backgroundFarStarMaxSize;
    const safeMin = Math.max(0.05, Math.min(minSize, maxSize));
    const safeMax = Math.max(safeMin, Math.max(minSize, maxSize));
    return safeMin + (safeMax - safeMin) * star.sizeRatio;
  }
  getStarOpacity(star, isNearLayer, settings) {
    const safeMin = clamp(
      Math.min(
        settings.backgroundStarMinAlpha,
        settings.backgroundStarMaxAlpha
      ),
      0,
      1
    );
    const safeMax = clamp(
      Math.max(
        settings.backgroundStarMinAlpha,
        settings.backgroundStarMaxAlpha
      ),
      safeMin,
      1
    );
    const layerMultiplier = isNearLayer ? 0.72 : 0.32;
    return (safeMin + (safeMax - safeMin) * star.opacityRatio) * layerMultiplier;
  }
  getStarColor(star, settings) {
    const hueMin = settings.backgroundStarHueMin;
    const hueMax = settings.backgroundStarHueMax;
    const hue = hueMin + (hueMax - hueMin) * star.hueRatio;
    return `hsl(${hue}, 85%, 86%)`;
  }
  drawStar(ctx, x, y, size, opacity, color, drawSoftGlow) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      size,
      0,
      Math.PI * 2
    );
    ctx.fill();
    if (drawSoftGlow) {
      ctx.globalAlpha = opacity * 0.16;
      ctx.beginPath();
      ctx.arc(
        x,
        y,
        size * 2.1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }
  destroyCanvasOnly() {
    this.farCanvas?.remove();
    this.nearCanvas?.remove();
    this.root?.remove();
    this.root = null;
    this.farCanvas = null;
    this.farCtx = null;
    this.nearCanvas = null;
    this.nearCtx = null;
    this.starsFar = [];
    this.starsNear = [];
    this.width = 0;
    this.height = 0;
    this.farLayerDirty = true;
    this.lastNearDrawTime = 0;
    this.lastFarDrawTime = 0;
  }
};

// src/render/canvasLayer.ts
var COSMOS_CANVAS_CLASS = "cosmos-graph-canvas";
var LEGACY_CANVAS_CLASS = "cosmos-animation-canvas";
var CanvasLayer = class {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }
  attach(graphView) {
    this.removeLegacyCanvas(graphView);
    let canvas = graphView.querySelector(
      `.${COSMOS_CANVAS_CLASS}`
    );
    if (!canvas) {
      canvas = document.createElement(
        "canvas"
      );
      canvas.className = COSMOS_CANVAS_CLASS;
      graphView.appendChild(canvas);
    }
    this.applyCanvasStyles(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return false;
    }
    this.canvas = canvas;
    this.ctx = ctx;
    return true;
  }
  resize(graphView) {
    if (!this.canvas || !this.ctx) {
      return false;
    }
    const rect = graphView.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
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
    return true;
  }
  clear() {
    if (!this.canvas || !this.ctx) {
      return;
    }
    this.ctx.clearRect(
      0,
      0,
      this.canvas.clientWidth,
      this.canvas.clientHeight
    );
  }
  getCanvas() {
    return this.canvas;
  }
  getContext() {
    return this.ctx;
  }
  isConnected() {
    return this.canvas?.isConnected ?? false;
  }
  getWidth() {
    return this.canvas?.clientWidth ?? 0;
  }
  getHeight() {
    return this.canvas?.clientHeight ?? 0;
  }
  destroy() {
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
  }
  static cleanupAll() {
    document.querySelectorAll(
      [
        `.${COSMOS_CANVAS_CLASS}`,
        `.${LEGACY_CANVAS_CLASS}`
      ].join(", ")
    ).forEach((element) => {
      element.remove();
    });
  }
  applyCanvasStyles(canvas) {
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "2";
    canvas.style.opacity = "1";
    canvas.style.mixBlendMode = "screen";
    canvas.style.overflow = "hidden";
  }
  removeLegacyCanvas(graphView) {
    graphView.querySelectorAll(
      `.${LEGACY_CANVAS_CLASS}`
    ).forEach((element) => {
      element.remove();
    });
  }
};

// src/effects/shootingStars.ts
var ShootingStars = class {
  constructor() {
    this.stars = [];
    this.nextShootingStar = 0;
  }
  scheduleNext(time) {
    this.nextShootingStar = time + randomFloat(2500, 6500);
  }
  update(delta, time, width, height, enabled) {
    if (enabled && time > this.nextShootingStar) {
      this.create(width, height);
      this.nextShootingStar = time + randomFloat(3500, 9e3);
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
      const alpha = Math.max(
        star.life / star.maxLife,
        0
      );
      const endX = star.x - star.vx * 0.08;
      const endY = star.y - star.vy * 0.08;
      const gradient = createLinearFade(
        ctx,
        star.x,
        star.y,
        endX,
        endY,
        `rgba(255,255,255,${alpha})`,
        "rgba(255,255,255,0)"
      );
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
  getStarCount() {
    return this.stars.length;
  }
  create(width, height) {
    const fromLeft = Math.random() > 0.5;
    this.stars.push({
      x: fromLeft ? -100 : width + 100,
      y: Math.random() * height * 0.55,
      vx: fromLeft ? randomFloat(550, 950) : -randomFloat(550, 950),
      vy: randomFloat(160, 360),
      life: randomFloat(700, 1300),
      maxLife: 1300
    });
  }
};

// src/effects/interactionEffects.ts
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
  handleClick(x, y, canvasWidth, canvasHeight, clickEffectMode, settings) {
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

// src/effects/burstSystem.ts
var BurstSystem = class {
  constructor(particleSystem) {
    this.particleSystem = particleSystem;
    this.particles = [];
  }
  createRadialBurst(x, y, settings) {
    for (let i = 0; i < settings.radialBurstAmount; i++) {
      const angle = randomFloat(
        0,
        Math.PI * 2
      );
      this.particles.push(
        this.createBurstStar(
          x,
          y,
          angle,
          randomFloat(38, 105),
          randomFloat(1800, 5200)
        )
      );
    }
    for (let i = 0; i < settings.radialCoreAmount; i++) {
      const angle = randomFloat(
        0,
        Math.PI * 2
      );
      this.particles.push(
        this.createBurstStar(
          x,
          y,
          angle,
          randomFloat(8, 34),
          randomFloat(1400, 3600)
        )
      );
    }
  }
  getParticleCount() {
    return this.particles.length;
  }
  createDirectionalBurst(x, y, baseAngle, settings) {
    for (let i = 0; i < settings.directionalBurstAmount; i++) {
      const angle = baseAngle + randomFloat(
        -settings.directionalSpread,
        settings.directionalSpread
      );
      this.particles.push(
        this.createBurstStar(
          x,
          y,
          angle,
          randomFloat(45, 115),
          randomFloat(1800, 5200)
        )
      );
    }
  }
  createGravityBurst(x, y, settings) {
    for (let i = 0; i < settings.gravityBurstAmount; i++) {
      const angle = randomFloat(
        0,
        Math.PI * 2
      );
      const spawnDistance = randomFloat(
        settings.gravityBounceDistance,
        settings.gravityBounceDistance * 2.4
      );
      const particle = this.createBurstStar(
        x + Math.cos(angle) * spawnDistance,
        y + Math.sin(angle) * spawnDistance,
        angle,
        settings.gravityForce,
        settings.gravityDurationMs
      );
      particle.gravityX = x;
      particle.gravityY = y;
      particle.affectedByGravity = true;
      particle.burstGravityForce = settings.gravityForce;
      particle.collapseDistance = settings.gravityBounceDistance;
      this.particles.push(particle);
    }
  }
  update(width, height, delta, maxAmbientParticles) {
    const releasedParticles = [];
    for (const particle of this.particles) {
      particle.age += delta;
      if (particle.affectedByGravity && particle.gravityX !== void 0 && particle.gravityY !== void 0) {
        this.updateGravityParticle(particle);
      }
      particle.x += particle.speedX + particle.vx * 0.05;
      particle.y += particle.speedY + particle.vy * 0.05;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      particle.speedX *= 0.992;
      particle.speedY *= 0.992;
      if (particle.x < -50)
        particle.x = width + 50;
      if (particle.x > width + 50)
        particle.x = -50;
      if (particle.y < -50)
        particle.y = height + 50;
      if (particle.y > height + 50)
        particle.y = -50;
      if (particle.age >= particle.releaseAfter) {
        releasedParticles.push(particle);
      }
    }
    this.particles = this.particles.filter(
      (particle) => particle.age < particle.releaseAfter
    );
    for (const particle of releasedParticles) {
      this.particleSystem.addAmbientParticle(
        {
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
          connectionAge: 0,
          connectionFadeDuration: 200,
          glow: 0.2
        }
      );
    }
    this.limitParticles(maxAmbientParticles);
  }
  draw(ctx, _mouse, settings) {
    for (const particle of this.particles) {
      const alpha = 0.86;
      const size = particle.size + (particle.glow ?? 0) * 0.8;
      const glow = createRadialGlow(
        ctx,
        particle.x,
        particle.y,
        size * settings.burstGlowSize,
        `hsla(${particle.hue}, 90%, 76%, ${(particle.glow ?? 0.45) * settings.burstGlowIntensity})`,
        `hsla(${particle.hue}, 90%, 76%, 0)`
      );
      drawFilledCircle(
        ctx,
        particle.x,
        particle.y,
        size * settings.burstGlowSize,
        glow
      );
      drawFilledCircle(
        ctx,
        particle.x,
        particle.y,
        size,
        `hsla(${particle.hue}, 90%, 76%, ${alpha})`
      );
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
  createBurstStar(x, y, angle, force, releaseAfter) {
    return {
      x,
      y,
      size: randomFloat(0.7, 1.9),
      density: randomFloat(6, 18),
      hue: randomFloat(200, 265),
      speedX: Math.cos(angle) * randomFloat(0.7, 1.8),
      speedY: Math.sin(angle) * randomFloat(0.7, 1.8),
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force,
      kind: "burst",
      depth: randomFloat(0.55, 1),
      age: 0,
      releaseAfter,
      glow: 0.55
    };
  }
  updateGravityParticle(particle) {
    const dx = particle.gravityX - particle.x;
    const dy = particle.gravityY - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= 0) {
      return;
    }
    const angle = Math.atan2(dy, dx);
    const gravityForce = (particle.burstGravityForce ?? 90) / Math.max(
      distance,
      particle.collapseDistance ?? 14
    );
    particle.vx += Math.cos(angle) * gravityForce;
    particle.vy += Math.sin(angle) * gravityForce;
  }
};

// src/interaction/InteractionManager.ts
var InteractionManager = class {
  constructor(options) {
    this.destroyed = false;
    this.handleMouseMove = (event) => {
      if (this.destroyed)
        return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
      this.mouse.isInside = true;
      this.parallaxController.move(
        this.mouse.x,
        this.mouse.y
      );
    };
    this.handleMouseLeave = () => {
      if (this.destroyed)
        return;
      this.mouse.isInside = false;
      this.parallaxController.leave();
    };
    this.handleWheel = (event) => {
      if (this.destroyed)
        return;
      this.cosmicObjects.handleWheel(
        event.deltaY
      );
    };
    this.handleClick = (event) => {
      if (this.destroyed)
        return;
      const settings = this.getSettings();
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.interactionEffects.handleClick(
        x,
        y,
        this.canvas.clientWidth,
        this.canvas.clientHeight,
        settings.clickEffectMode,
        settings
      );
    };
    this.graphView = options.graphView;
    this.canvas = options.canvas;
    this.mouse = options.mouse;
    this.parallaxController = options.parallaxController;
    this.interactionEffects = options.interactionEffects;
    this.cosmicObjects = options.cosmicObjects;
    this.getSettings = options.getSettings;
  }
  attach() {
    this.destroyed = false;
    this.graphView.addEventListener(
      "mousemove",
      this.handleMouseMove
    );
    this.graphView.addEventListener(
      "mouseleave",
      this.handleMouseLeave
    );
    this.graphView.addEventListener(
      "wheel",
      this.handleWheel,
      {
        passive: true
      }
    );
    this.graphView.addEventListener(
      "click",
      this.handleClick
    );
  }
  destroy() {
    this.destroyed = true;
    this.graphView.removeEventListener(
      "mousemove",
      this.handleMouseMove
    );
    this.graphView.removeEventListener(
      "mouseleave",
      this.handleMouseLeave
    );
    this.graphView.removeEventListener(
      "wheel",
      this.handleWheel
    );
    this.graphView.removeEventListener(
      "click",
      this.handleClick
    );
  }
};

// src/render/burstCooldownHud.ts
function drawBurstCooldownHud(ctx, mouse, clickEffectMode, cooldownProgress, ready) {
  if (clickEffectMode === "none" || !mouse.isInside) {
    return;
  }
  const x = mouse.x + 14;
  const y = mouse.y + 18;
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
    -Math.PI / 2 + Math.PI * 2 * cooldownProgress
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

// src/util/performanceProfiler.ts
var PerformanceProfiler = class {
  constructor(title = "Cosmos performance") {
    this.title = title;
    // esto es para medir el rendimiento de diferentes partes del código y reportarlo periódicamente en la consola. No es un profiler tradicional, sino más bien una herramienta de medición personalizada.
    this.values = /* @__PURE__ */ new Map();
    this.counts = /* @__PURE__ */ new Map();
    this.units = /* @__PURE__ */ new Map();
    this.lastReport = performance.now();
  }
  measure(label, callback) {
    const start = performance.now();
    callback();
    this.record(
      label,
      performance.now() - start,
      "ms"
    );
  }
  record(label, value, unit = "ms") {
    this.values.set(
      label,
      (this.values.get(label) ?? 0) + value
    );
    this.counts.set(
      label,
      (this.counts.get(label) ?? 0) + 1
    );
    this.units.set(
      label,
      unit
    );
  }
  reportEvery(ms) {
    const now = performance.now();
    if (now - this.lastReport < ms) {
      return;
    }
    const rows = [];
    for (const [label, total] of this.values) {
      const count = this.counts.get(label) ?? 1;
      rows.push({
        label,
        avg: (total / count).toFixed(2),
        unit: this.units.get(label) ?? "ms",
        samples: count
      });
    }
    console.group(this.title);
    console.table(rows);
    console.groupEnd();
    this.values.clear();
    this.counts.clear();
    this.units.clear();
    this.lastReport = now;
  }
};

// src/render/cosmosRenderer.ts
var RESET_BUTTON_CLASS = "cosmos-reset-stars-button";
var SYSTEM_STATS_CLASS = "cosmos-system-stats";
var SYSTEM_STATS_TOGGLE_CLASS = "cosmos-system-stats-toggle";
var CosmosRenderer = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.canvasLayer = new CanvasLayer();
    this.graphView = null;
    this.resizeObserver = null;
    this.animationFrame = null;
    this.injectInterval = null;
    this.destroyed = false;
    this.resetButton = null;
    this.statsPanel = null;
    this.statsBody = null;
    this.statsToggleButton = null;
    this.statsCollapsed = false;
    this.statsPinned = true;
    this.statsClosed = false;
    this.statsDragStart = null;
    this.lastTime = 0;
    /*
            DEBUG HUD BASE
    
            Luego estos valores deberían venir desde settings.
        */
    this.debugHudEnabled = true;
    this.debugHudOptions = {
      showPerformance: true,
      showEntities: true,
      showCanvas: true,
      showMouse: true
    };
    this.fps = 0;
    this.fpsFrameCount = 0;
    this.fpsTimer = 0;
    this.frameMs = 0;
    this.updateMs = 0;
    this.drawMs = 0;
    this.profiler = new PerformanceProfiler();
    this.particleSystem = new ParticleSystem();
    this.parallaxController = new ParallaxController();
    this.burstSystem = new BurstSystem(
      this.particleSystem
    );
    this.shootingStars = new ShootingStars();
    this.cosmicObjects = new CosmicObjects();
    this.backgroundRenderer = new BackgroundRenderer();
    this.interactionEffects = new InteractionEffects(
      this.burstSystem
    );
    this.interactionManager = null;
    this.mouse = {
      x: 0,
      y: 0,
      radius: 130,
      isInside: false
    };
    this.handleResetStars = (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.resetStars();
    };
    this.animate = (time) => {
      if (this.destroyed) {
        return;
      }
      if (this.isGraphDetached()) {
        this.teardownGraphInstance();
        return;
      }
      const canvas = this.canvasLayer.getCanvas();
      const ctx = this.canvasLayer.getContext();
      if (!canvas || !ctx) {
        this.animationFrame = null;
        return;
      }
      if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) {
        this.animationFrame = requestAnimationFrame(
          this.animate
        );
        return;
      }
      const frameStart = performance.now();
      const rawDelta = time - this.lastTime;
      const delta = Math.min(
        rawDelta,
        32
      );
      this.lastTime = time;
      this.updateFps(rawDelta);
      const updateStart = performance.now();
      this.update(
        delta,
        time
      );
      this.updateMs = performance.now() - updateStart;
      const drawStart = performance.now();
      this.draw(time);
      this.drawMs = performance.now() - drawStart;
      this.frameMs = performance.now() - frameStart;
      if (this.destroyed) {
        return;
      }
      this.animationFrame = requestAnimationFrame(
        this.animate
      );
    };
    this.handleStatsDragStart = (event) => {
      if (!this.statsPanel || event.target instanceof HTMLElement && event.target.closest("button")) {
        return;
      }
      event.preventDefault();
      const panelRect = this.statsPanel.getBoundingClientRect();
      const parentRect = this.statsPanel.offsetParent instanceof HTMLElement ? this.statsPanel.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
      this.statsDragStart = {
        mouseX: event.clientX,
        mouseY: event.clientY,
        left: panelRect.left - parentRect.left,
        top: panelRect.top - parentRect.top
      };
      document.addEventListener(
        "mousemove",
        this.handleStatsDragMove
      );
      document.addEventListener(
        "mouseup",
        this.handleStatsDragEnd
      );
    };
    this.handleStatsDragMove = (event) => {
      if (!this.statsPanel || !this.statsDragStart) {
        return;
      }
      const nextLeft = this.statsDragStart.left + event.clientX - this.statsDragStart.mouseX;
      const nextTop = this.statsDragStart.top + event.clientY - this.statsDragStart.mouseY;
      this.statsPanel.style.left = `${Math.max(0, nextLeft)}px`;
      this.statsPanel.style.top = `${Math.max(0, nextTop)}px`;
      this.statsPanel.style.right = "auto";
    };
    this.handleStatsDragEnd = () => {
      this.statsDragStart = null;
      document.removeEventListener(
        "mousemove",
        this.handleStatsDragMove
      );
      document.removeEventListener(
        "mouseup",
        this.handleStatsDragEnd
      );
    };
    this.particleSettingsSnapshot = this.getParticleSettingsSnapshot(
      this.plugin.settings
    );
  }
  start() {
    if (this.injectInterval !== null) {
      return;
    }
    this.destroyed = false;
    this.injectCosmos();
    this.injectInterval = window.setInterval(() => {
      if (this.destroyed) {
        return;
      }
      this.injectCosmos();
    }, 1e3);
  }
  reloadSettings() {
    if (this.destroyed)
      return;
    const currentParticleSettings = this.getParticleSettingsSnapshot(
      this.plugin.settings
    );
    const didMaxParticlesChange = this.particleSettingsSnapshot.maxParticles !== currentParticleSettings.maxParticles;
    const didParticleVisualSettingsChange = this.didParticleVisualSettingsChange(
      this.particleSettingsSnapshot,
      currentParticleSettings
    );
    this.backgroundRenderer.applySettings(
      this.plugin.settings
    );
    if (didMaxParticlesChange) {
      this.particleSystem.limitParticles(
        this.plugin.settings.maxParticles
      );
    }
    if (didParticleVisualSettingsChange) {
      this.particleSystem.applyVisualSettings(
        this.plugin.settings
      );
    }
    this.particleSettingsSnapshot = currentParticleSettings;
    this.burstSystem.limitParticles(
      this.plugin.settings.burstParticleLimit
    );
    this.cosmicObjects.applySettings?.(
      this.plugin.settings
    );
    this.mouse.radius = this.plugin.settings.mouseFieldRadius;
    this.parallaxController.setRadius(
      this.plugin.settings.mouseFieldRadius
    );
  }
  getParticleSettingsSnapshot(settings) {
    return {
      maxParticles: settings.maxParticles,
      starMinSize: settings.starMinSize,
      starMaxSize: settings.starMaxSize,
      starHueMin: settings.starHueMin,
      starHueMax: settings.starHueMax,
      particleColor: settings.particleColor,
      baseSpeed: settings.baseSpeed
    };
  }
  didParticleVisualSettingsChange(previous, current) {
    return previous.starMinSize !== current.starMinSize || previous.starMaxSize !== current.starMaxSize || previous.starHueMin !== current.starHueMin || previous.starHueMax !== current.starHueMax || previous.particleColor !== current.particleColor || previous.baseSpeed !== current.baseSpeed;
  }
  destroy() {
    this.destroyed = true;
    if (this.injectInterval !== null) {
      window.clearInterval(
        this.injectInterval
      );
      this.injectInterval = null;
    }
    this.teardownGraphInstance();
    this.cleanupCosmosElements();
    this.cleanupGraphViewStyles();
  }
  injectCosmos() {
    if (this.destroyed)
      return;
    const graphView = document.querySelector(
      '.workspace-leaf-content[data-type="graph"] .view-content, .workspace-leaf-content[data-type="localgraph"] .view-content'
    );
    if (!graphView)
      return;
    const isNewGraphView = this.graphView !== graphView;
    if (!isNewGraphView && this.canvasLayer.isConnected()) {
      return;
    }
    if (isNewGraphView && this.graphView !== null) {
      this.teardownGraphInstance();
    }
    this.graphView = graphView;
    this.backgroundRenderer.setContainer(
      graphView,
      this.plugin.settings
    );
    this.ensureResetButton(graphView);
    this.ensureSystemStatsPanel(graphView);
    const attached = this.canvasLayer.attach(graphView);
    if (!attached)
      return;
    this.setupResizeObserver();
    this.resizeCanvas();
    const canvas = this.canvasLayer.getCanvas();
    if (!canvas)
      return;
    this.parallaxController.setSize(
      canvas.clientWidth,
      canvas.clientHeight
    );
    this.setupInteractionManager();
    if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) {
      return;
    }
    if (isNewGraphView || !this.particleSystem.hasParticles()) {
      this.burstSystem.clear();
      this.cosmicObjects.create(
        canvas.clientWidth,
        canvas.clientHeight
      );
      this.particleSystem.createParticles(
        canvas.clientWidth,
        canvas.clientHeight,
        this.plugin.settings.particleCount,
        this.plugin.settings
      );
    }
    this.shootingStars.scheduleNext(
      performance.now()
    );
    if (this.animationFrame === null) {
      this.lastTime = performance.now();
      this.animate(
        this.lastTime
      );
    }
  }
  isGraphDetached() {
    return !this.graphView || !this.graphView.isConnected;
  }
  teardownGraphInstance() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(
        this.animationFrame
      );
      this.animationFrame = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.interactionManager?.destroy();
    this.interactionManager = null;
    this.removeResetButton();
    this.removeSystemStatsPanel();
    this.canvasLayer.destroy();
    this.graphView = null;
  }
  ensureResetButton(graphView) {
    let button = graphView.querySelector(
      `.${RESET_BUTTON_CLASS}`
    );
    if (!button) {
      button = document.createElement(
        "button"
      );
      button.className = RESET_BUTTON_CLASS;
      button.textContent = "Reset stars";
      button.title = "Reset Cosmos stars";
      button.addEventListener(
        "click",
        this.handleResetStars
      );
      graphView.appendChild(button);
    }
    this.resetButton = button;
  }
  resetStars() {
    const width = this.canvasLayer.getWidth();
    const height = this.canvasLayer.getHeight();
    if (width <= 0 || height <= 0) {
      return;
    }
    this.burstSystem.clear();
    this.backgroundRenderer.regenerate(
      this.plugin.settings
    );
    this.cosmicObjects.create(
      width,
      height
    );
    this.particleSystem.createParticles(
      width,
      height,
      this.plugin.settings.particleCount,
      this.plugin.settings
    );
  }
  removeResetButton() {
    this.resetButton?.removeEventListener(
      "click",
      this.handleResetStars
    );
    this.resetButton?.remove();
    this.resetButton = null;
    document.removeEventListener(
      "mousemove",
      this.handleStatsDragMove
    );
    document.removeEventListener(
      "mouseup",
      this.handleStatsDragEnd
    );
  }
  setupInteractionManager() {
    if (!this.graphView)
      return;
    const canvas = this.canvasLayer.getCanvas();
    if (!canvas)
      return;
    this.interactionManager?.destroy();
    this.interactionManager = new InteractionManager({
      graphView: this.graphView,
      canvas,
      mouse: this.mouse,
      parallaxController: this.parallaxController,
      interactionEffects: this.interactionEffects,
      cosmicObjects: this.cosmicObjects,
      getSettings: () => this.plugin.settings
    });
    this.interactionManager.attach();
  }
  cleanupCosmosElements() {
    CanvasLayer.cleanupAll();
    document.querySelectorAll(
      [
        ".cosmos-background-root",
        ".cosmos-background-canvas",
        ".cosmos-background-layer",
        ".cosmos-stars-far",
        ".cosmos-stars-near",
        `.${SYSTEM_STATS_CLASS}`,
        `.${RESET_BUTTON_CLASS}`
      ].join(", ")
    ).forEach((element) => {
      element.remove();
    });
  }
  setupResizeObserver() {
    if (!this.graphView)
      return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      if (this.destroyed) {
        return;
      }
      if (this.isGraphDetached()) {
        this.teardownGraphInstance();
        return;
      }
      this.resizeCanvas();
    });
    this.resizeObserver.observe(
      this.graphView
    );
  }
  resizeCanvas() {
    if (this.destroyed || !this.graphView) {
      return;
    }
    const resized = this.canvasLayer.resize(
      this.graphView
    );
    if (!resized)
      return;
    this.parallaxController.setSize(
      this.canvasLayer.getWidth(),
      this.canvasLayer.getHeight()
    );
  }
  updateFps(delta) {
    this.fpsFrameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer < 500) {
      return;
    }
    this.fps = Math.round(
      this.fpsFrameCount * 1e3 / this.fpsTimer
    );
    this.fpsFrameCount = 0;
    this.fpsTimer = 0;
  }
  update(delta, time) {
    if (this.destroyed) {
      return;
    }
    const canvas = this.canvasLayer.getCanvas();
    if (!canvas)
      return;
    this.parallaxController.setSize(
      canvas.clientWidth,
      canvas.clientHeight
    );
    this.profiler.measure(
      "parallaxController.update",
      () => {
        this.parallaxController.update(
          delta
        );
      }
    );
    this.profiler.measure(
      "interactionEffects.update",
      () => {
        this.interactionEffects.update(
          delta,
          this.plugin.settings.gravityCooldownMs
        );
      }
    );
    this.profiler.measure(
      "backgroundRenderer.update",
      () => {
        const backgroundParallax = this.parallaxController.getOffset(
          1
        );
        this.backgroundRenderer.setParallax(
          backgroundParallax.x,
          backgroundParallax.y
        );
        this.backgroundRenderer.update(
          this.plugin.settings.enableParallax
        );
      }
    );
    this.profiler.measure(
      "cosmicObjects.update",
      () => {
        this.cosmicObjects.update(
          delta
        );
      }
    );
    this.profiler.measure(
      "particleSystem.update",
      () => {
        this.particleSystem.update(
          canvas.clientWidth,
          canvas.clientHeight,
          this.mouse,
          delta,
          this.plugin.settings
        );
      }
    );
    this.profiler.measure(
      "burstSystem.update",
      () => {
        this.burstSystem.update(
          canvas.clientWidth,
          canvas.clientHeight,
          delta,
          this.plugin.settings.maxParticles
        );
      }
    );
    this.profiler.measure(
      "shootingStars.update",
      () => {
        this.shootingStars.update(
          delta,
          time,
          canvas.clientWidth,
          canvas.clientHeight,
          this.plugin.settings.enableShootingStars
        );
      }
    );
  }
  draw(time) {
    if (this.destroyed) {
      return;
    }
    const ctx = this.canvasLayer.getContext();
    if (!ctx) {
      return;
    }
    const visualMouse = this.parallaxController.getMouse();
    this.profiler.measure(
      "canvasLayer.clear",
      () => {
        this.canvasLayer.clear();
      }
    );
    if (this.plugin.settings.enableParticles) {
      this.profiler.measure(
        "cosmicObjects.draw",
        () => {
          this.cosmicObjects.draw(
            ctx,
            time,
            visualMouse,
            this.plugin.settings.enableParallax
          );
        }
      );
      this.profiler.measure(
        "particleSystem.draw",
        () => {
          this.particleSystem.draw(
            ctx,
            time,
            visualMouse,
            this.plugin.settings
          );
        }
      );
      this.profiler.measure(
        "burstSystem.draw",
        () => {
          this.burstSystem.draw(
            ctx,
            this.mouse,
            this.plugin.settings
          );
        }
      );
    }
    this.profiler.measure(
      "shootingStars.draw",
      () => {
        this.shootingStars.draw(
          ctx
        );
      }
    );
    this.profiler.measure(
      "burstCooldownHud.draw",
      () => {
        drawBurstCooldownHud(
          ctx,
          this.mouse,
          this.plugin.settings.clickEffectMode,
          this.interactionEffects.getBurstCooldownProgress(
            this.plugin.settings.gravityCooldownMs
          ),
          this.interactionEffects.canUseBurst()
        );
      }
    );
    this.updateSystemStatsPanel();
    this.profiler.reportEvery(
      1e3
    );
  }
  updateSystemStatsPanel() {
    if (!this.debugHudEnabled) {
      return;
    }
    if (this.statsClosed) {
      return;
    }
    if (!this.statsBody) {
      return;
    }
    const metrics = this.getDebugHudMetrics();
    this.statsBody.empty();
    if (this.statsCollapsed) {
      return;
    }
    this.addStatsRow(
      "FPS",
      `${metrics.fps}`
    );
    this.addStatsRow(
      "Frame time",
      `${metrics.frameMs.toFixed(2)} ms`
    );
    this.addStatsRow(
      "Update",
      `${metrics.updateMs.toFixed(2)} ms`
    );
    this.addStatsRow(
      "Draw",
      `${metrics.drawMs.toFixed(2)} ms`
    );
    this.addStatsDivider();
    this.addStatsRow(
      "Particles",
      `${metrics.particles}`
    );
    this.addStatsRow(
      "Burst particles",
      `${metrics.burstParticles}`
    );
    this.addStatsRow(
      "Shooting stars",
      `${metrics.shootingStars}`
    );
    this.addStatsDivider();
    this.addStatsRow(
      "Connections",
      `${metrics.connectionSegments}`
    );
    this.addStatsRow(
      "Connection time",
      `${metrics.connectionDrawMs.toFixed(2)} ms`
    );
    this.addStatsRow(
      "Canvas",
      `${metrics.canvasWidth} x ${metrics.canvasHeight}`
    );
    this.addStatsRow(
      "Mouse",
      metrics.mouseInside ? "Inside" : "Outside"
    );
  }
  ensureSystemStatsPanel(graphView) {
    this.ensureSystemStatsToggle(
      graphView
    );
    if (this.statsClosed) {
      return;
    }
    if (this.statsPanel?.isConnected) {
      return;
    }
    const panel = document.createElement("div");
    panel.className = SYSTEM_STATS_CLASS;
    const header = panel.createDiv({
      cls: "cosmos-system-stats-header"
    });
    header.createEl("span", {
      text: "System"
    });
    const actions = header.createDiv({
      cls: "cosmos-system-stats-actions"
    });
    const collapseButton = actions.createEl("button", {
      text: "\u2212",
      cls: "cosmos-system-stats-button"
    });
    const pinButton = actions.createEl("button", {
      text: "Pin",
      cls: "cosmos-system-stats-button"
    });
    const closeButton = actions.createEl("button", {
      text: "x",
      cls: "cosmos-system-stats-button"
    });
    const body = panel.createDiv({
      cls: "cosmos-system-stats-body"
    });
    header.addEventListener(
      "mousedown",
      this.handleStatsDragStart
    );
    collapseButton.onclick = () => {
      this.statsCollapsed = !this.statsCollapsed;
      collapseButton.textContent = this.statsCollapsed ? "+" : "\u2212";
      panel.toggleClass(
        "is-collapsed",
        this.statsCollapsed
      );
    };
    pinButton.onclick = () => {
      this.statsPinned = !this.statsPinned;
      pinButton.textContent = this.statsPinned ? "Pin" : "Float";
      panel.toggleClass(
        "is-floating",
        !this.statsPinned
      );
    };
    closeButton.onclick = () => {
      this.statsClosed = true;
      this.statsPanel?.remove();
      this.statsPanel = null;
      this.statsBody = null;
      this.statsToggleButton?.show();
    };
    graphView.appendChild(panel);
    this.statsPanel = panel;
    this.statsBody = body;
    this.statsToggleButton?.hide();
  }
  ensureSystemStatsToggle(graphView) {
    if (this.statsToggleButton?.isConnected) {
      return;
    }
    const button = document.createElement("button");
    button.className = SYSTEM_STATS_TOGGLE_CLASS;
    button.textContent = "System";
    button.title = "Open system stats";
    button.onclick = () => {
      this.statsClosed = false;
      button.hide();
      this.ensureSystemStatsPanel(
        graphView
      );
    };
    graphView.appendChild(button);
    this.statsToggleButton = button;
    if (!this.statsClosed) {
      button.hide();
    }
  }
  removeSystemStatsPanel() {
    this.statsPanel?.remove();
    this.statsToggleButton?.remove();
    this.statsPanel = null;
    this.statsBody = null;
    this.statsToggleButton = null;
  }
  addStatsRow(label, value) {
    if (!this.statsBody) {
      return;
    }
    const row = this.statsBody.createDiv({
      cls: "cosmos-system-stats-row"
    });
    row.createSpan({
      text: label
    });
    row.createSpan({
      text: value
    });
  }
  addStatsDivider() {
    this.statsBody?.createDiv({
      cls: "cosmos-system-stats-divider"
    });
  }
  getDebugHudMetrics() {
    const particleMetrics = this.particleSystem.getDebugMetrics();
    return {
      fps: this.fps,
      frameMs: this.frameMs,
      updateMs: this.updateMs,
      drawMs: this.drawMs,
      particleDrawMs: particleMetrics.drawParticlesMs,
      connectionDrawMs: particleMetrics.drawConnectionsMs,
      connectionGridMs: particleMetrics.connectionGridMs,
      connectionScanMs: particleMetrics.connectionScanMs,
      connectionStrokeMs: particleMetrics.connectionStrokeMs,
      connectionSegments: particleMetrics.connectionSegments,
      connectionBuckets: particleMetrics.connectionBuckets,
      connectionRenderPoints: particleMetrics.connectionRenderPoints,
      particles: this.particleSystem.getParticleCount(),
      burstParticles: this.burstSystem.getParticleCount(),
      shootingStars: this.shootingStars.getStarCount(),
      canvasWidth: this.canvasLayer.getWidth(),
      canvasHeight: this.canvasLayer.getHeight(),
      mouseInside: this.mouse.isInside,
      clickEffectMode: this.plugin.settings.clickEffectMode
    };
  }
  cleanupGraphViewStyles() {
    const graphViews = document.querySelectorAll(
      '.workspace-leaf-content[data-type="graph"] .view-content, .workspace-leaf-content[data-type="localgraph"] .view-content'
    );
    graphViews.forEach(
      (graphView) => {
        graphView.style.removeProperty(
          "background"
        );
        graphView.style.removeProperty(
          "background-color"
        );
        graphView.style.removeProperty(
          "position"
        );
        graphView.style.removeProperty(
          "overflow"
        );
      }
    );
  }
};

// src/settings/settingsTab.ts
var import_obsidian = require("obsidian");
var CosmosSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h1", {
      text: "Cosmos Graph"
    });
    containerEl.createEl("p", {
      text: "Most Cosmos Graph settings are now managed from the Cosmos Control panel."
    });
    new import_obsidian.Setting(containerEl).setName("Open Cosmos Control").setDesc(
      "Open the dedicated Cosmos Graph control panel."
    ).addButton(
      (button) => button.setButtonText("Open").onClick(() => {
        this.plugin.activateCosmosControlView();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Reset all settings").setDesc(
      "Restore all Cosmos Graph settings to default values."
    ).addButton(
      (button) => button.setWarning().setButtonText("Reset").onClick(async () => {
        await this.plugin.resetSettings();
      })
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
  enableBackground: true,
  enableParticles: true,
  enableShootingStars: true,
  enableMouseField: true,
  enableParallax: true,
  clickEffectMode: "radial",
  particleCount: 220,
  maxParticles: 1e3,
  enableAutoSpawn: true,
  autoSpawnIntervalMs: 1e3,
  performanceMode: "balanced"
};

// src/settings/sections/universe.ts
var UNIVERSE_DEFAULTS = {
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

// src/settings/sections/connections.ts
var CONNECTION_DEFAULTS = {
  enableConnections: true,
  connectionDistance: 115,
  connectionLineWidth: 0.35,
  connectionColor: "120, 195, 255",
  connectionBaseOpacity: 0.06,
  maxConnectionsPerParticle: 4
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
  directionalAngle: 0,
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

// src/ui/renderGeneralSettings.ts
var import_obsidian2 = require("obsidian");

// src/ui/addSectionReset.ts
function addSectionReset(section, plugin, keys) {
  const button = section.headerEl.createEl("button", {
    text: "Reset",
    cls: "cosmos-section-reset-button"
  });
  button.onclick = async (event) => {
    event.stopPropagation();
    event.preventDefault();
    for (const key of keys) {
      plugin.settings[key] = DEFAULT_SETTINGS[key];
    }
    await plugin.saveSettings();
    window.dispatchEvent(
      new CustomEvent(
        "cosmos-settings-reset"
      )
    );
  };
}

// src/ui/createSettingSection.ts
function createSettingSection(containerEl, title, options = {}) {
  let isCollapsed = options.collapsed ?? false;
  const sectionEl = containerEl.createDiv();
  sectionEl.addClass("cosmos-settings-section");
  const headerEl = sectionEl.createDiv();
  headerEl.addClass("cosmos-settings-section-header");
  const titleWrapperEl = headerEl.createDiv();
  titleWrapperEl.addClass("cosmos-settings-section-title-wrapper");
  const arrowEl = titleWrapperEl.createSpan();
  arrowEl.addClass("cosmos-settings-section-arrow");
  const titleEl = titleWrapperEl.createEl("h3", {
    text: title
  });
  titleEl.addClass("cosmos-settings-section-title");
  if (options.description) {
    const descriptionEl = sectionEl.createEl("p", {
      text: options.description
    });
    descriptionEl.addClass("cosmos-settings-section-description");
  }
  const contentEl = sectionEl.createDiv();
  contentEl.addClass("cosmos-settings-section-content");
  const applyCollapsedState = () => {
    if (isCollapsed) {
      sectionEl.addClass("is-collapsed");
      contentEl.hide();
      arrowEl.setText("\u25B6");
    } else {
      sectionEl.removeClass("is-collapsed");
      contentEl.show();
      arrowEl.setText("\u25BC");
    }
  };
  const setCollapsed = (collapsed) => {
    isCollapsed = collapsed;
    applyCollapsedState();
  };
  const toggle = () => {
    setCollapsed(!isCollapsed);
  };
  headerEl.addEventListener(
    "click",
    toggle
  );
  applyCollapsedState();
  return {
    rootEl: sectionEl,
    headerEl,
    contentEl,
    setCollapsed,
    toggle
  };
}

// src/ui/renderGeneralSettings.ts
function renderGeneralSettings(containerEl, plugin) {
  const section = createSettingSection(
    containerEl,
    "General",
    {
      description: "Global systems and basic behavior."
    }
  );
  addSectionReset(
    section,
    plugin,
    [
      "enableBackground",
      "enableParticles",
      "enableShootingStars",
      "enableMouseField",
      "enableParallax",
      "clickEffectMode",
      "particleCount",
      "maxParticles",
      "enableAutoSpawn",
      "autoSpawnIntervalMs",
      "performanceMode"
    ]
  );
  const sectionEl = section.contentEl;
  new import_obsidian2.Setting(sectionEl).setName("Particles").setDesc("Enable or disable ambient particles.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableParticles).onChange(async (value) => {
      plugin.settings.enableParticles = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian2.Setting(sectionEl).setName("Shooting stars").setDesc("Enable or disable shooting stars.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableShootingStars).onChange(async (value) => {
      plugin.settings.enableShootingStars = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian2.Setting(sectionEl).setName("Click effect").setDesc("Choose what happens when clicking on the graph.").addDropdown(
    (dropdown) => dropdown.addOption("none", "None").addOption("radial", "Radial burst").addOption("directional", "Directional burst").addOption("gravity", "Gravity burst").setValue(plugin.settings.clickEffectMode).onChange(async (value) => {
      plugin.settings.clickEffectMode = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian2.Setting(sectionEl).setName("Initial particles").setDesc("Amount of particles created when the graph opens.").addSlider(
    (slider) => slider.setLimits(50, 1e4, 10).setValue(plugin.settings.particleCount).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.particleCount = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian2.Setting(sectionEl).setName("Max particles").setDesc("Maximum amount of particles allowed.").addSlider(
    (slider) => slider.setLimits(50, 1e4, 50).setValue(plugin.settings.maxParticles).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.maxParticles = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian2.Setting(sectionEl).setName("Auto spawn").setDesc("Generate new particles progressively.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableAutoSpawn).onChange(async (value) => {
      plugin.settings.enableAutoSpawn = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian2.Setting(sectionEl).setName("Auto spawn rate").setDesc("Time between automatic particle spawns, in milliseconds.").addSlider(
    (slider) => slider.setLimits(250, 5e3, 250).setValue(plugin.settings.autoSpawnIntervalMs).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.autoSpawnIntervalMs = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian2.Setting(sectionEl).setName("Parallax").setDesc("Enable or disable parallax movement.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableParallax).onChange(async (value) => {
      plugin.settings.enableParallax = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian2.Setting(sectionEl).setName("Performance mode").setDesc("Choose the global balance between visual quality and performance.").addDropdown(
    (dropdown) => dropdown.addOption("quality", "Quality").addOption("balanced", "Balanced").addOption("performance", "Performance").setValue(plugin.settings.performanceMode).onChange(async (value) => {
      applyPerformanceModePreset(
        plugin,
        value
      );
      await plugin.saveSettings();
    })
  );
}
function applyPerformanceModePreset(plugin, mode) {
  plugin.settings.performanceMode = mode;
  if (mode === "quality") {
    plugin.settings.particleCount = 1400;
    plugin.settings.maxParticles = 3e3;
    plugin.settings.autoSpawnAmount = 4;
    plugin.settings.autoSpawnIntervalMs = 900;
    plugin.settings.enableConnections = true;
    plugin.settings.connectionDistance = 260;
    plugin.settings.maxConnectionsPerParticle = 8;
    plugin.settings.backgroundFarStarCount = 700;
    plugin.settings.backgroundNearStarCount = 320;
    plugin.settings.enableShootingStars = true;
    return;
  }
  if (mode === "balanced") {
    plugin.settings.particleCount = 650;
    plugin.settings.maxParticles = 1200;
    plugin.settings.autoSpawnAmount = 2;
    plugin.settings.autoSpawnIntervalMs = 1400;
    plugin.settings.enableConnections = true;
    plugin.settings.connectionDistance = 180;
    plugin.settings.maxConnectionsPerParticle = 4;
    plugin.settings.backgroundFarStarCount = 420;
    plugin.settings.backgroundNearStarCount = 180;
    plugin.settings.enableShootingStars = true;
    return;
  }
  plugin.settings.particleCount = 260;
  plugin.settings.maxParticles = 520;
  plugin.settings.autoSpawnAmount = 1;
  plugin.settings.autoSpawnIntervalMs = 2400;
  plugin.settings.enableConnections = true;
  plugin.settings.connectionDistance = 120;
  plugin.settings.maxConnectionsPerParticle = 2;
  plugin.settings.backgroundFarStarCount = 220;
  plugin.settings.backgroundNearStarCount = 80;
  plugin.settings.enableShootingStars = false;
}

// src/ui/renderUniverseSettings.ts
var import_obsidian3 = require("obsidian");
function renderUniverseSettings(containerEl, plugin) {
  const section = createSettingSection(
    containerEl,
    "Particles",
    {
      description: "Base appearance of ambient particles."
    }
  );
  addSectionReset(
    section,
    plugin,
    [
      "autoSpawnAmount",
      "initialCleanRadiusRatio",
      "initialMinRadiusRatio",
      "initialMaxRadiusRatio",
      "initialClusterChance",
      "starMinSize",
      "starMaxSize",
      "starHueMin",
      "starHueMax",
      "particleColor",
      "baseSpeed",
      "particleGlow",
      "particleBrightness"
    ]
  );
  const sectionEl = section.contentEl;
  new import_obsidian3.Setting(sectionEl).setName("Particle base speed").setDesc("Base movement speed of ambient particles.").addSlider(
    (slider) => slider.setLimits(0.02, 1, 0.02).setValue(plugin.settings.baseSpeed).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.baseSpeed = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian3.Setting(sectionEl).setName("Particle color").setDesc("Base color used by ambient particles.").addColorPicker(
    (color) => color.setValue(
      getValidHexColor(
        plugin.settings.particleColor
      )
    ).onChange(async (value) => {
      const hue = hexToHue(value);
      plugin.settings.particleColor = value;
      plugin.settings.starHueMin = hue;
      plugin.settings.starHueMax = hue;
      await plugin.saveSettings();
    })
  );
  new import_obsidian3.Setting(sectionEl).setName("Particle glow").setDesc("Base glow intensity of ambient particles.").addSlider(
    (slider) => slider.setLimits(0, 0.4, 0.01).setValue(plugin.settings.particleGlow).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.particleGlow = value;
      await plugin.saveSettings();
    })
  );
  new import_obsidian3.Setting(sectionEl).setName("Particle brightness").setDesc("Brightness multiplier for ambient particles.").addSlider(
    (slider) => slider.setLimits(0.2, 2, 0.05).setValue(plugin.settings.particleBrightness).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.particleBrightness = value;
      await plugin.saveSettings();
    })
  );
}
function getValidHexColor(value) {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }
  return "#7db7ff";
}
function hexToHue(hex) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) {
    return 0;
  }
  let hue = 0;
  if (max === r) {
    hue = (g - b) / delta % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  return Math.round((hue * 60 + 360) % 360);
}

// src/ui/renderConnectionSettings.ts
var import_obsidian4 = require("obsidian");

// src/util/updateSetting.ts
async function updateSetting(plugin, key, value) {
  plugin.settings[key] = value;
  await plugin.saveSettings();
}

// src/ui/renderConnectionSettings.ts
function renderConnectionSettings(containerEl, plugin) {
  const section = createSettingSection(
    containerEl,
    "Constellations",
    {
      description: "Control constellation lines, distance, thickness, opacity and color."
    }
  );
  addSectionReset(
    section,
    plugin,
    [
      "enableConnections",
      "connectionDistance",
      "connectionLineWidth",
      "connectionColor",
      "connectionBaseOpacity",
      "maxConnectionsPerParticle"
    ]
  );
  new import_obsidian4.Setting(section.contentEl).setName("Max connections per particle").setDesc("Maximum amount of constellation lines each particle can create.").addSlider(
    (slider) => slider.setLimits(1, 12, 1).setValue(plugin.settings.maxConnectionsPerParticle).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.maxConnectionsPerParticle = value;
      await plugin.saveSettings();
      plugin.renderer?.reloadSettings();
    })
  );
  new import_obsidian4.Setting(section.contentEl).setName("Enable connections").setDesc("Enable or disable constellation lines.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableConnections).onChange(async (value) => {
      await updateSetting(
        plugin,
        "enableConnections",
        value
      );
    })
  );
  new import_obsidian4.Setting(section.contentEl).setName("Connection distance").setDesc("Maximum distance between stars to create connections.").addSlider(
    (slider) => slider.setLimits(20, 400, 5).setValue(plugin.settings.connectionDistance).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "connectionDistance",
        value
      );
    })
  );
  new import_obsidian4.Setting(section.contentEl).setName("Connection line width").setDesc("Thickness of constellation lines.").addSlider(
    (slider) => slider.setLimits(0.05, 2, 0.05).setValue(plugin.settings.connectionLineWidth).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "connectionLineWidth",
        value
      );
    })
  );
  new import_obsidian4.Setting(section.contentEl).setName("Connection opacity").setDesc("Base opacity of constellation lines.").addSlider(
    (slider) => slider.setLimits(0.01, 1, 0.01).setValue(plugin.settings.connectionBaseOpacity).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "connectionBaseOpacity",
        value
      );
    })
  );
  new import_obsidian4.Setting(section.contentEl).setName("Connection color").setDesc("Pick the color used for constellation lines.").addColorPicker(
    (color) => color.setValue(rgbToHex(plugin.settings.connectionColor)).onChange(async (value) => {
      await updateSetting(
        plugin,
        "connectionColor",
        hexToRgb(value)
      );
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
    {
      description: "Control the light effect around the mouse."
    }
  );
  addSectionReset(
    glowSection,
    plugin,
    [
      "enableMouseGlow",
      "mouseGlowRadius",
      "mouseGlowConnectionOpacity",
      "mouseGlowLineWidth",
      "mouseGlowParticleAlpha",
      "mouseGlowParticleSize"
    ]
  );
  new import_obsidian5.Setting(glowSection.contentEl).setName("Enable").setDesc("Enable glow near the mouse.").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enableMouseGlow).onChange(async (value) => {
      await updateSetting(
        plugin,
        "enableMouseGlow",
        value
      );
    })
  );
  new import_obsidian5.Setting(glowSection.contentEl).setName("Size").setDesc("How far the glow reaches.").addSlider(
    (slider) => slider.setLimits(50, 600, 10).setValue(plugin.settings.mouseGlowRadius).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "mouseGlowRadius",
        value
      );
    })
  );
  new import_obsidian5.Setting(glowSection.contentEl).setName("Connection Glow").setDesc("How much nearby connections light up.").addSlider(
    (slider) => slider.setLimits(0, 1, 0.01).setValue(plugin.settings.mouseGlowConnectionOpacity).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "mouseGlowConnectionOpacity",
        value
      );
    })
  );
  new import_obsidian5.Setting(glowSection.contentEl).setName("Particle Glow").setDesc("How much nearby particles light up.").addSlider(
    (slider) => slider.setLimits(0, 1, 0.01).setValue(plugin.settings.mouseGlowParticleAlpha).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "mouseGlowParticleAlpha",
        value
      );
    })
  );
  new import_obsidian5.Setting(glowSection.contentEl).setName("Particle Size").setDesc("How much nearby particles grow.").addSlider(
    (slider) => slider.setLimits(0, 3, 0.05).setValue(plugin.settings.mouseGlowParticleSize).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "mouseGlowParticleSize",
        value
      );
    })
  );
  const fieldSection = createSettingSection(
    containerEl,
    "Mouse Force",
    {
      description: "Control how the mouse pushes particles away."
    }
  );
  addSectionReset(
    fieldSection,
    plugin,
    [
      "mouseFieldRadius",
      "mouseRepulseStrength"
    ]
  );
  new import_obsidian5.Setting(fieldSection.contentEl).setName("Range").setDesc("How far the mouse force reaches.").addSlider(
    (slider) => slider.setLimits(20, 400, 5).setValue(plugin.settings.mouseFieldRadius).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "mouseFieldRadius",
        value
      );
    })
  );
  new import_obsidian5.Setting(fieldSection.contentEl).setName("Strength").setDesc("How strongly the mouse pushes particles.").addSlider(
    (slider) => slider.setLimits(0, 500, 10).setValue(plugin.settings.mouseRepulseStrength).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "mouseRepulseStrength",
        value
      );
    })
  );
}

// src/ui/renderBurstSettings.ts
var import_obsidian6 = require("obsidian");
function renderBurstSettings(containerEl, plugin) {
  const burstSection = createSettingSection(
    containerEl,
    "Burst",
    {
      description: "Shared behavior for click burst effects."
    }
  );
  addSectionReset(
    burstSection,
    plugin,
    [
      "gravityCooldownMs",
      "burstParticleLimit",
      "burstGlowIntensity",
      "burstGlowSize"
    ]
  );
  new import_obsidian6.Setting(burstSection.contentEl).setName("Cooldown").setDesc("Time before another burst can be used.").addSlider(
    (slider) => slider.setLimits(0.5, 8, 0.5).setValue(plugin.settings.gravityCooldownMs / 1e3).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "gravityCooldownMs",
        value * 1e3
      );
    })
  );
  new import_obsidian6.Setting(burstSection.contentEl).setName("Particle Limit").setDesc("Maximum amount of temporary burst particles.").addSlider(
    (slider) => slider.setLimits(20, 800, 10).setValue(plugin.settings.burstParticleLimit).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "burstParticleLimit",
        value
      );
    })
  );
  new import_obsidian6.Setting(burstSection.contentEl).setName("Glow").setDesc("Brightness of burst particle glow.").addSlider(
    (slider) => slider.setLimits(0, 1, 0.01).setValue(plugin.settings.burstGlowIntensity).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "burstGlowIntensity",
        value
      );
    })
  );
  new import_obsidian6.Setting(burstSection.contentEl).setName("Glow Size").setDesc("Size of burst glow aura.").addSlider(
    (slider) => slider.setLimits(1, 10, 0.1).setValue(plugin.settings.burstGlowSize).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "burstGlowSize",
        value
      );
    })
  );
  const radialSection = createSettingSection(
    containerEl,
    "Radial Burst",
    {
      description: "Control circular click explosions."
    }
  );
  addSectionReset(
    radialSection,
    plugin,
    [
      "radialBurstAmount",
      "radialCoreAmount"
    ]
  );
  new import_obsidian6.Setting(radialSection.contentEl).setName("Amount").setDesc("Amount of particles in radial burst.").addSlider(
    (slider) => slider.setLimits(5, 120, 1).setValue(plugin.settings.radialBurstAmount).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "radialBurstAmount",
        value
      );
    })
  );
  new import_obsidian6.Setting(radialSection.contentEl).setName("Core Density").setDesc("Amount of slower particles near the center of radial burst.").addSlider(
    (slider) => slider.setLimits(0, 60, 1).setValue(plugin.settings.radialCoreAmount).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "radialCoreAmount",
        value
      );
    })
  );
  const directionalSection = createSettingSection(
    containerEl,
    "Directional Burst",
    {
      description: "Control cone-shaped bursts fired away from the graph center."
    }
  );
  addSectionReset(
    directionalSection,
    plugin,
    [
      "directionalBurstAmount",
      "directionalAngle",
      "directionalSpread"
    ]
  );
  new import_obsidian6.Setting(directionalSection.contentEl).setName("Amount").setDesc("Amount of particles in directional burst.").addSlider(
    (slider) => slider.setLimits(5, 120, 1).setValue(plugin.settings.directionalBurstAmount).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "directionalBurstAmount",
        value
      );
    })
  );
  createDirectionControl(
    directionalSection.contentEl,
    plugin
  );
  new import_obsidian6.Setting(directionalSection.contentEl).setName("Cone Width").setDesc("How wide the particle cone becomes.").addSlider(
    (slider) => slider.setLimits(0.01, 1, 0.01).setValue(plugin.settings.directionalSpread).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "directionalSpread",
        value
      );
    })
  );
  const gravitySection = createSettingSection(
    containerEl,
    "Gravity Burst",
    {
      description: "Control click bursts that pull particles back toward the click point."
    }
  );
  addSectionReset(
    gravitySection,
    plugin,
    [
      "gravityBurstAmount",
      "gravityForce",
      "gravityDurationMs",
      "gravityBounceDistance"
    ]
  );
  new import_obsidian6.Setting(gravitySection.contentEl).setName("Amount").setDesc("Amount of particles in gravity burst.").addSlider(
    (slider) => slider.setLimits(5, 120, 1).setValue(plugin.settings.gravityBurstAmount).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "gravityBurstAmount",
        value
      );
    })
  );
  new import_obsidian6.Setting(gravitySection.contentEl).setName("Gravity Strength").setDesc("Strength of attraction in this burst.").addSlider(
    (slider) => slider.setLimits(10, 300, 5).setValue(plugin.settings.gravityForce).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "gravityForce",
        value
      );
    })
  );
  new import_obsidian6.Setting(gravitySection.contentEl).setName("Gravity Duration").setDesc("How long burst particles stay temporary.").addSlider(
    (slider) => slider.setLimits(500, 8e3, 100).setValue(plugin.settings.gravityDurationMs).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "gravityDurationMs",
        value
      );
    })
  );
  new import_obsidian6.Setting(gravitySection.contentEl).setName("Collapse Distance").setDesc("Distance from the center where the pull tightens.").addSlider(
    (slider) => slider.setLimits(2, 80, 1).setValue(plugin.settings.gravityBounceDistance).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "gravityBounceDistance",
        value
      );
    })
  );
}
function createDirectionControl(containerEl, plugin) {
  const setting = new import_obsidian6.Setting(containerEl).setName("Shooting Direction").setDesc("Direction used by directional bursts.");
  const padEl = setting.controlEl.createDiv({
    cls: "cosmos-direction-control"
  });
  const lineEl = padEl.createDiv({
    cls: "cosmos-direction-control-line"
  });
  const handleEl = padEl.createDiv({
    cls: "cosmos-direction-control-handle"
  });
  const updateVisual = () => {
    const angle = plugin.settings.directionalAngle;
    const radius = 34;
    const center = 44;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    handleEl.style.left = `${x}px`;
    handleEl.style.top = `${y}px`;
    lineEl.style.transform = `rotate(${angle}rad)`;
  };
  const updateValue = async (event) => {
    const rect = padEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(
      event.clientY - centerY,
      event.clientX - centerX
    );
    plugin.settings.directionalAngle = angle;
    updateVisual();
    await plugin.saveSettings();
  };
  let isDragging = false;
  const handleMouseMove = (event) => {
    if (!isDragging) {
      return;
    }
    void updateValue(event);
  };
  const handleMouseUp = () => {
    isDragging = false;
    document.removeEventListener(
      "mousemove",
      handleMouseMove
    );
    document.removeEventListener(
      "mouseup",
      handleMouseUp
    );
  };
  padEl.addEventListener(
    "mousedown",
    (event) => {
      isDragging = true;
      void updateValue(event);
      document.addEventListener(
        "mousemove",
        handleMouseMove
      );
      document.addEventListener(
        "mouseup",
        handleMouseUp
      );
    }
  );
  updateVisual();
}

// src/ui/renderBackgroundSettings.ts
var import_obsidian7 = require("obsidian");
function renderBackgroundSettings(containerEl, plugin) {
  const farSection = createSettingSection(
    containerEl,
    "Far Stars",
    {
      description: "Subtle stars behind the graph."
    }
  );
  addSectionReset(
    farSection,
    plugin,
    [
      "backgroundFarStarCount",
      "backgroundFarStarMinSize",
      "backgroundFarStarMaxSize",
      "backgroundFarParallax",
      "backgroundFarDriftSeconds"
    ]
  );
  new import_obsidian7.Setting(farSection.contentEl).setName("Amount").setDesc("Amount of stars.").addSlider((slider) => {
    slider.setLimits(0, 1e3, 10).setValue(plugin.settings.backgroundFarStarCount).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "backgroundFarStarCount",
        value
      );
    });
  });
  new import_obsidian7.Setting(farSection.contentEl).setName("Size").setDesc("Overall size of these stars.").addSlider((slider) => {
    slider.setLimits(0.2, 3, 0.1).setValue(
      getFarStarSize(
        plugin
      )
    ).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundFarStarMinSize = value * 0.5;
      plugin.settings.backgroundFarStarMaxSize = value * 1.4;
      await plugin.saveSettings();
    });
  });
  new import_obsidian7.Setting(farSection.contentEl).setName("Mouse movement").setDesc("How much these stars move with the mouse.").addSlider((slider) => {
    slider.setLimits(0, 30, 1).setValue(plugin.settings.backgroundFarParallax).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "backgroundFarParallax",
        value
      );
    });
  });
  const nearSection = createSettingSection(
    containerEl,
    "Near Stars",
    {
      description: "Brighter stars that sit closer to the graph."
    }
  );
  addSectionReset(
    nearSection,
    plugin,
    [
      "backgroundNearStarCount",
      "backgroundNearStarMinSize",
      "backgroundNearStarMaxSize",
      "backgroundNearParallax",
      "backgroundNearDriftSeconds"
    ]
  );
  new import_obsidian7.Setting(nearSection.contentEl).setName("Amount").setDesc("Amount of stars.").addSlider((slider) => {
    slider.setLimits(0, 600, 10).setValue(plugin.settings.backgroundNearStarCount).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "backgroundNearStarCount",
        value
      );
    });
  });
  new import_obsidian7.Setting(nearSection.contentEl).setName("Size").setDesc("Overall size of these stars.").addSlider((slider) => {
    slider.setLimits(0.4, 5, 0.1).setValue(
      getNearStarSize(
        plugin
      )
    ).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundNearStarMinSize = value * 0.5;
      plugin.settings.backgroundNearStarMaxSize = value * 1.4;
      await plugin.saveSettings();
    });
  });
  new import_obsidian7.Setting(nearSection.contentEl).setName("Mouse movement").setDesc("How much these stars move with the mouse.").addSlider((slider) => {
    slider.setLimits(0, 50, 1).setValue(plugin.settings.backgroundNearParallax).setDynamicTooltip().onChange(async (value) => {
      await updateSetting(
        plugin,
        "backgroundNearParallax",
        value
      );
    });
  });
  const styleSection = createSettingSection(
    containerEl,
    "Star Style",
    {
      description: "Shared brightness and color for background stars."
    }
  );
  addSectionReset(
    styleSection,
    plugin,
    [
      "backgroundStarMinAlpha",
      "backgroundStarMaxAlpha",
      "backgroundStarHueMin",
      "backgroundStarHueMax",
      "backgroundPulseChance"
    ]
  );
  new import_obsidian7.Setting(styleSection.contentEl).setName("Brightness").setDesc("Overall brightness of background stars.").addSlider((slider) => {
    slider.setLimits(0.1, 1, 0.05).setValue(
      getStarBrightness(
        plugin
      )
    ).setDynamicTooltip().onChange(async (value) => {
      plugin.settings.backgroundStarMinAlpha = value * 0.25;
      plugin.settings.backgroundStarMaxAlpha = value;
      await plugin.saveSettings();
    });
  });
  new import_obsidian7.Setting(styleSection.contentEl).setName("Color").setDesc("Base color of background stars.").addColorPicker((color) => {
    color.setValue(
      hueToHex(
        getStarHue(plugin)
      )
    ).onChange(async (value) => {
      const hue = hexToHue2(value);
      plugin.settings.backgroundStarHueMin = hue - 12;
      plugin.settings.backgroundStarHueMax = hue + 12;
      await plugin.saveSettings();
    });
  });
}
function getFarStarSize(plugin) {
  return (plugin.settings.backgroundFarStarMinSize + plugin.settings.backgroundFarStarMaxSize) / 2;
}
function getNearStarSize(plugin) {
  return (plugin.settings.backgroundNearStarMinSize + plugin.settings.backgroundNearStarMaxSize) / 2;
}
function getStarBrightness(plugin) {
  return plugin.settings.backgroundStarMaxAlpha;
}
function getStarHue(plugin) {
  return (plugin.settings.backgroundStarHueMin + plugin.settings.backgroundStarHueMax) / 2;
}
function hueToHex(hue) {
  const normalizedHue = (hue % 360 + 360) % 360;
  const chroma = 1;
  const x = chroma * (1 - Math.abs(
    normalizedHue / 60 % 2 - 1
  ));
  let r = 0;
  let g = 0;
  let b = 0;
  if (normalizedHue < 60) {
    r = chroma;
    g = x;
  } else if (normalizedHue < 120) {
    r = x;
    g = chroma;
  } else if (normalizedHue < 180) {
    g = chroma;
    b = x;
  } else if (normalizedHue < 240) {
    g = x;
    b = chroma;
  } else if (normalizedHue < 300) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }
  const match = 0.7;
  return "#" + toHex2((r + match) * 0.5 * 255) + toHex2((g + match) * 0.5 * 255) + toHex2((b + match) * 0.5 * 255);
}
function hexToHue2(hex) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) {
    return 0;
  }
  let hue = 0;
  if (max === r) {
    hue = (g - b) / delta % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  return Math.round((hue * 60 + 360) % 360);
}
function toHex2(value) {
  return ("0" + Math.max(
    0,
    Math.min(255, Math.round(value))
  ).toString(16)).slice(-2);
}

// src/ui/cosmosControlView.ts
var COSMOS_CONTROL_VIEW_TYPE = "cosmos-control-view";
var CosmosControlView = class extends import_obsidian8.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.handleSettingsReset = () => {
      this.render();
    };
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
    window.addEventListener(
      "cosmos-settings-reset",
      this.handleSettingsReset
    );
    this.render();
  }
  async onClose() {
    window.removeEventListener(
      "cosmos-settings-reset",
      this.handleSettingsReset
    );
  }
  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("cosmos-control-panel");
    const header = container.createDiv({
      cls: "cosmos-control-header"
    });
    header.createEl("h2", {
      text: "Cosmos Control"
    });
    const headerActions = header.createDiv({
      cls: "cosmos-control-header-actions"
    });
    const resetAllButton = headerActions.createEl("button", {
      text: "Reset all",
      cls: "cosmos-control-reset-all-button"
    });
    resetAllButton.onclick = async () => {
      await this.plugin.resetSettings();
      this.render();
    };
    const closeButton = headerActions.createEl("button", {
      text: "x",
      cls: "cosmos-control-close-button"
    });
    closeButton.onclick = async () => {
      await this.leaf.detach();
    };
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
    this.settings = structuredClone(DEFAULT_SETTINGS);
    this.renderer = null;
  }
  async onload() {
    await this.loadSettings();
    this.renderer = new CosmosRenderer(this);
    this.renderer.start();
    this.registerView(
      COSMOS_CONTROL_VIEW_TYPE,
      (leaf) => new CosmosControlView(
        leaf,
        this
      )
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
      new CosmosSettingTab(
        this.app,
        this
      )
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
    await this.saveData(
      this.settings
    );
    this.renderer?.reloadSettings();
  }
  async resetSettings() {
    this.settings = structuredClone(
      DEFAULT_SETTINGS
    );
    await this.saveSettings();
  }
  async activateCosmosControlView() {
    const leaves = this.app.workspace.getLeavesOfType(
      COSMOS_CONTROL_VIEW_TYPE
    );
    if (leaves.length > 0) {
      await leaves[0].detach();
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
