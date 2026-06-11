# Proposal: Tinkercad UI Clone — Slice 1: Core Interactions

## Intent

The current UI is a flat IDE-like layout with inline palette, bottom-paned editor/serial, and a right-side pin inspector. It does not match Tinkercad Circuits' interface, which is the target UX benchmark. Users cannot edit component values, undo mistakes, right-click for context actions, or see hover feedback. This change brings the workspace interaction layer to Tinkercad parity.

## Scope

### In Scope
- Layout refactor to Tinkercad proportions (top bar, collapsible left palette, center canvas, right tabbed panel)
- Component property editor (resistor E12 values, capacitor values, LED colors, potentiometer, power supply)
- Undo/redo system via Command pattern (max 50 depth, Ctrl+Z / Ctrl+Shift+Z)
- Context menu (canvas, component, wire targets)
- Hover highlights (component glow, pin tooltip, wire-mode pin highlighting)
- Palette improvements (collapsible categories, search/filter, recently used)

### Out of Scope
- LED/state animations and waveform visualizations (Slice 2)
- Simulation engine changes
- Real component value validation against simulation
- Touch/gesture support
- Multi-select property editing
- I18n/accessibility (future slices)

## Capabilities

### New Capabilities
- `component-property-editor`: Schema-driven property panel for editing component values (resistance, capacitance, LED color, voltage, potentiometer position)
- `undo-redo-system`: Command-pattern undo/redo with 50-depth stack, keyboard shortcuts, and toolbar buttons
- `context-menu`: Right-click menus for canvas, component, and wire targets with contextual actions
- `hover-highlights`: Konva-layer hover effects — component outline glow, pin tooltip with name/number, wire-mode pin highlighting
- `tinkercad-layout`: Top bar (circuit name + sim controls), collapsible left palette, center canvas, right tabbed panel (Code Editor / Serial Monitor)

### Modified Capabilities
- `component-palette`: Add collapsible categories, search/filter, recently used section, SVG thumbnails (currently flat list in `app.tsx`)
- `workspace`: Wire undo/redo commands into existing mutation handlers (add, move, delete, wire, rotate, property change)
- `sim-controls`: Move into redesigned top bar with editable circuit name field

## Approach

Incremental enhancement — no full rewrite. The existing `Workspace.tsx` Konva canvas, `ComponentItem.tsx` visuals, `WireLayer`, and `InteractionLayer` are preserved. New features are composed:

1. **Layout**: Replace `app.tsx` layout structure with Tinkercad-style flex containers. Top bar gets circuit name input + sim controls + export buttons. Right panel becomes tabbed (Code Editor + Serial Monitor). Bottom panel removed — content moves to right tabs.
2. **Property Editor**: New `ComponentPropertyEditor` component driven by a per-type property schema (`ComponentPropertySchema`). Schema maps component types to field definitions (dropdown, color picker, slider, text input). Selected component's `state` object is mutated through undo-able commands.
3. **Undo/Redo**: `CommandManager` class implementing `execute(command)`, `undo()`, `redo()`. Each mutation (add, move, delete, wire, rotate, property change) becomes a `Command` object with `execute()`/`undo()`. Max stack depth 50. Global keyboard listener (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y).
4. **Context Menu**: React portal-based `ContextMenu` component. Positioned at mouse coordinates. Action handlers dispatch to existing mutation callbacks + new commands (duplicate, bring-to-front, send-to-back).
5. **Hover Highlights**: Extend `ComponentItem` with Konva `shadowBlur`/`stroke` on mouseenter/leave. Extend `PinPoint` with tooltip in wire-mode. No new Konva layers needed.
6. **Palette**: Refactor inline palette into standalone `TinkercadPalette` component. Add `useState` for collapsed categories. Add search input. Track `recentlyUsed` in localStorage.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/ui/app.tsx` | Modified | Full layout restructure to Tinkercad layout |
| `src/ui/workspace/Workspace.tsx` | Modified | Wire undo/redo, context menu, hover state propagation |
| `src/ui/workspace/ComponentItem.tsx` | Modified | Hover glow effects, property-driven body rendering |
| `src/ui/workspace/types.ts` | Modified | New types: `Command`, `CommandManager`, `PropertySchema` |
| `src/ui/toolbar/sim-controls.tsx` | Modified | Move into top bar, add circuit name input |
| `src/ui/palette/component-palette.tsx` | Modified | Collapsible categories, search, recently used |
| `src/ui/editor/code-editor.tsx` | Modified | Move into right tabbed panel |
| `src/ui/serial-monitor.tsx` | Modified | Move into right tabbed panel |
| `src/ui/properties/` | New | Property editor component + schema definitions |
| `src/ui/context-menu/` | New | Context menu component + menu item definitions |
| `src/ui/undo/` | New | Command pattern implementation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Konva shadowBlur performance on many components | Med | Use `listening: false` on non-interactive layers; batch shadow updates; limit shadow radius |
| Undo/redo stack memory with large circuits | Low | Hard 50-command limit; commands store minimal diffs not full state snapshots |
| Context menu z-index conflicts with Konva Stage | Med | Use React portal rendered outside Stage container; stop propagation from Konva events |
| Layout refactor breaks existing drag-drop | Med | Incremental approach — layout CSS only, keep Workspace props identical; test after each step |
| Property schema divergence from simulation engine | Low | Schema is UI-only; simulation reads from component `state` as before |

## Rollback Plan

1. Each feature area is a separate directory (`properties/`, `context-menu/`, `undo/`). Remove directory + revert layout to restore previous state.
2. Layout changes are CSS-only in `app.tsx` — single commit revert.
3. Undo/redo is opt-in — `CommandManager` wraps existing handlers. Without it, mutations call directly as before.
4. Feature flags via a `features` object in config if granular rollback needed.

## Dependencies

- Requires existing Konva canvas (already built)
- Requires existing component types and pin system (already built)
- Blocks Slice 2 (animations need property editor + hover highlights in place)

## Success Criteria

- [ ] Layout matches Tinkercad proportions: top bar with circuit name + sim controls, left collapsible palette, center canvas, right tabbed panel
- [ ] Selecting a resistor shows property panel with E12 value dropdown + custom input; changing value updates component state
- [ ] Ctrl+Z undoes last action; Ctrl+Shift+Z redoes; stack caps at 50
- [ ] Right-click on component shows Rotate, Delete, Duplicate, Properties, Bring to Front, Send to Back
- [ ] Hovering a component shows blue/cyan outline glow
- [ ] Hovering a pin shows tooltip with pin name
- [ ] Palette categories collapse/expand; search filters components; recently used section appears
- [ ] All existing tests pass; new code has ≥80% coverage
