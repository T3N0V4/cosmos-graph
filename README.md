# Cosmos Graph

Transform the Obsidian Graph into a living cosmic visualization.

![Status](https://img.shields.io/badge/status-alpha-4ea1ff)
![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED)
![Platform](https://img.shields.io/badge/platform-desktop-blue)

---

**Cosmos Graph** is an experimental Obsidian plugin that transforms the Graph View into a dynamic cosmic environment filled with animated stars, particles, glowing connections, depth, parallax and reactive visual effects.

Instead of feeling like a static diagram, the graph becomes something atmospheric and alive.

> Current status: **Alpha**

---

# Preview

![Cosmos Graph Preview](assets/cosmos-preview.gif)

---

# What is Cosmos Graph?

Cosmos Graph reimagines Obsidian’s Graph View as a living universe.

The project started as a visual experiment, but evolved into a broader idea:

- notes as particles,
- important concepts as stars,
- major hubs as massive cosmic structures,
- connections as constellations.

The goal is not only to improve aesthetics, but to explore a more expressive and immersive way of visualizing knowledge.

---

# Why?

The default Obsidian graph is functional, but visually static.

Cosmos Graph explores the idea of turning knowledge visualization into something:

- atmospheric,
- reactive,
- cinematic,
- and emotionally expressive.

Instead of simply displaying connections, the graph becomes an interactive visual environment.

---

# Features

## Current Features

- Animated cosmic background
- Far and near star layers
- Particle system
- Dynamic glowing connections
- Mouse-based parallax depth
- Shooting stars
- Burst effects
- Interactive movement response
- Performance/debug HUD
- Reset visual state button
- Custom settings panel
- Desktop-only support

---

# Screenshots

## Full Graph View

<!-- PUT FULL GRAPH SCREENSHOT HERE -->
<!-- Idea: entire graph visible with cosmic background -->

![Full Graph View](assets/cosmos-graph-general-screen.png)

---

## Close View

<!-- PUT CLOSE-UP SCREENSHOT HERE -->
<!-- Idea: zoom showing particles and glowing connections -->

![Close View](assets/close-view.png)

---

## Settings Panel

<!-- PUT SETTINGS PANEL SCREENSHOT HERE -->
<!-- Idea: plugin settings sidebar visible -->

![Settings Panel](assets/settings-panel.png)

---

## Performance HUD

<!-- PUT PERFORMANCE HUD SCREENSHOT HERE -->
<!-- Idea: FPS/debug table visible -->

![Performance HUD](assets/performance-hud.png)

---

# Installation

## Manual installation

1. Download the latest release.
2. Copy these files into your Obsidian vault:

```txt
.obsidian/plugins/cosmos-graph/
```

Required files:

```txt
main.js
manifest.json
styles.css
```

3. Restart Obsidian.
4. Open:

```txt
Settings → Community plugins
```

5. Enable **Cosmos Graph**.

---

## Development installation

Clone the repository into your Obsidian plugins folder:

```bash
cd path/to/your/vault/.obsidian/plugins
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git cosmos-graph
cd cosmos-graph
npm install
npm run build
```

Then enable the plugin inside Obsidian.

---

# Performance Notes

Cosmos Graph is currently in alpha and uses multiple animated canvas layers and real-time rendering systems.

Performance may vary depending on:

- particle count
- connection density
- background star density
- glow intensity
- graph size
- screen resolution
- device pixel ratio
- GPU/browser performance

If performance drops, try reducing or disabling:

- particle count
- particle connections
- background layers
- glow effects
- debug HUD

---

# Current Limitations

Cosmos Graph is still experimental.

Known limitations:

- Some visual effects may be expensive on low-end devices.
- Very large graphs may reduce FPS.
- Some systems are still being optimized.
- Internal architecture is still evolving.
- Graph-aware logic is still limited.
- Desktop only.

---

# Roadmap

Planned ideas and future experiments:

- Better integration with real Obsidian graph nodes
- Visual hierarchy based on note relevance
- Different cosmic entities based on importance
- Massive node structures (stars, planets, galaxies)
- Improved performance systems
- Preset visual themes
- Cinematic graph modes
- Dynamic graph reactions
- Better support for huge vaults
- Cleaner internal graph architecture

---

# Vision

The long-term idea behind Cosmos Graph is to transform the graph from a static utility into an expressive visual experience.

Small notes could feel like particles drifting through space.

Important notes could become stars.

Major knowledge hubs could evolve into planets, galaxies or massive cosmic structures.

The graph should not only display information.

It should feel alive.

---

# Author

Created by **T3N0V4**.

---

# License

MIT License
