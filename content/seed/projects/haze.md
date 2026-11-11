---
title: "haze"
summary: "A WebGL playground for volumetric light. Shaders, no framework, 40 KB total."
date: "2026-11-04"
status: "wip"
stack:
  - WebGL2
  - GLSL
  - TypeScript
cover: "/covers/haze.svg"
repo: "https://github.com/jacky/haze"
demo: "https://haze.jacky.dev"
featured: false
order: 5
---

`haze` is a shader sketchbook: one canvas, one fragment shader, and a raymarcher that renders light through participating media. It exists because I wanted to see what happens when you stop paying for a scene graph.

## Current approach

- **Single fullscreen pass.** No geometry, no draw calls per object — a signed distance field evaluated in the fragment shader.
- **Volumetric march.** 64 steps along the view ray, with an exponential height fog density.
- **Temporal accumulation.** When the camera is still, frames accumulate in a ping-pong buffer, so the noisy 64-sample march converges to something smooth within a second.

```glsl
float density(vec3 p) {
    return exp(-p.y * 0.9) * 0.35;
}

vec3 march(vec3 ro, vec3 rd) {
    vec3 acc = vec3(0.0);
    float transmittance = 1.0;
    for (int i = 0; i < 64; i++) {
        vec3 p = ro + rd * (float(i) * 0.08);
        float d = density(p);
        vec3 light = lightAt(p);
        acc += light * d * transmittance * 0.08;
        transmittance *= exp(-d * 0.08);
    }
    return acc;
}
```

## Why it is still a work in progress

The accumulation buffer breaks the moment the camera moves, and the fallback (single-frame, 64 samples) is visibly noisy. There is a denoiser shaped hole in the design and I have not decided whether to fill it with a bilateral filter or with more samples and a lower resolution.

- [x] Raymarched height fog
- [x] Temporal accumulation when static
- [x] Live shader editing with hot reload
- [ ] Motion-aware accumulation reset
- [ ] Bilateral denoise pass
- [ ] Mobile performance budget under 16 ms
