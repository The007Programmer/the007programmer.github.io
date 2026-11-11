# Room — open items

The 3D desk room (`src/components/room/`) is live on `main` but was built as a
prototype. These are the things still outstanding before it counts as finished.

## Copy
- [ ] Rewrite placeholder lines marked `// SPIKE COPY`:
  - [ ] HELLO card subtitle "who put this here" — `src/components/room/stations.ts`
  - [ ] Notepad line "I read everything" — `src/components/room/Scene.tsx`
  - [ ] Mug spill / mop toasts — `src/components/room/Scene.tsx`
  - [ ] Lucky cat toast "Lucky." — `src/components/room/Critters.tsx`
  - [ ] Light-switch toast — `src/components/room/Room.tsx`
  - [ ] 2D desk fallback zone subtitles — `src/components/canvas/desk.tsx`
- [ ] Confirm the HELLO polaroid photo (`public/img/photo.jpg`) is the one to keep

## Performance
- [ ] Adaptive quality tiers (drei `PerformanceMonitor`: drop DPR, contact shadows, glow sprites when frame time slips)
- [ ] Merge static props / instance repeats to cut draw calls (~140 at 1440×900 today)
- [ ] Consider baked lighting for the static room and KTX2 textures
- [ ] Profile on a real GPU — all numbers so far are headless software GL

## Real-device checks
- [ ] Phone: the 3D room now loads at all widths — check frame rate, drag-to-look, tap targets, bottom sheet
- [ ] Laptop: Chrome performance panel on the production build
- [ ] Sticky note size at 390×844 after the last enlargement

## Accuracy (approximate today)
- [ ] GMK Matsu keycap colours and TGR 910 GAF layout — `MATSU` in `src/components/room/Props.tsx`
- [ ] Mouse model — match the owner's mouse (`SPEC` in `src/components/room/Mouse.tsx`)
- [ ] Watch hand / index shapes, tick layouts, bracelet links — `drawDial()` in `src/components/room/Watch.tsx`
- [ ] Canon R8 button layout and lens markings — `src/components/room/Canon.tsx`

## Untested interactions
- [ ] Sticky note click → monitor focus, and hide-after-first-open
- [ ] Watch click-to-zoom at its final spot by the lamp
- [ ] Keyboard close-up after the keyboard moved back
- [ ] Mug spill and mop after the mug moved
- [ ] Camera flash pop + Instagram link after the camera moved
- [ ] Drawer slide timing
- [ ] Reduced-motion path (instant camera cuts)

## Code health
- [ ] Tests for the room (none yet); `Seam.test.ts` currently skips because there is no scrolling page
- [ ] Remove dead code from the old scrolling site and the 2D spikes once the room is final
- [ ] Accessibility pass: keyboard path through every station, screen-reader text for the 3D scene, contrast in both themes
- [ ] Update `README.md` for the room
