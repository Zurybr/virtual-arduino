# Tasks: Tinkercad UI Clone — Slice 1

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1400–1800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (foundation) → PR 2 (core UI) → PR 3 (polish/integration) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types, CommandManager, property schemas, recentlyUsed utility | PR 1 | Base: feature/tinkercad-ui-clone. Tests + pure logic. ~350 lines |
| 2 | Layout (TopBar, RightPanel, ResizablePanel), UndoContext, ContextMenu | PR 2 | Base: PR 1 branch. ~450 lines |
| 3 | PropertyPanel, PropertyField, CustomValueInput, TinkercadPalette, hover highlights | PR 3 | Base: PR 2 branch. ~500 lines |
| 4 | app.tsx restructure + Workspace wiring + integration tests | PR 4 | Base: PR 3 branch. ~400 lines |

## Phase 1: Foundation — Types & Pure Logic

- [x] 1.1 Create `src/ui/undo/types.ts` — `Command` interface, `UndoContextValue` type [CAP-003]
- [x] 1.2 Write tests in `tests/ui/undo/command-manager.test.ts` — execute, undo, redo, stack depth 50, FIFO eviction, redo-clear [CAP-003]
- [x] 1.3 Create `src/ui/undo/CommandManager.ts` — stack manager, maxDepth 50, FIFO eviction [CAP-003]
- [x] 1.4 Write tests in `tests/ui/undo/commands.test.ts` — each command execute/undo with mock setters [CAP-003]
- [x] 1.5 Create `src/ui/undo/commands.ts` — AddComponent, RemoveComponent, MoveComponent, RotateComponent, AddWire, RemoveWire, ChangeProperty [CAP-003]
- [x] 1.6 Write tests in `tests/ui/properties/schemas.test.ts` — parseValue for Ω/kΩ/MΩ, pF/nF/μF, validation, SCHEMA_MAP completeness [CAP-002]
- [x] 1.7 Create `src/ui/properties/schemas.ts` — `PropertySchema` type, `SCHEMA_MAP` for all 12 component types [CAP-002]
- [x] 1.8 Write tests in `tests/ui/palette/recently-used.test.ts` — add, dedup, cap 5, localStorage round-trip [CAP-006]
- [x] 1.9 Create `src/ui/palette/recentlyUsed.ts` — `addToRecentlyUsed`, `getRecentlyUsed`, localStorage key `palette-recently-used` [CAP-006]
- [x] 1.10 Create barrel exports: `src/ui/undo/index.ts`, `src/ui/properties/index.ts` [CAP-003, CAP-002]

## Phase 2: Layout Components & Undo Context

- [x] 2.1 Write tests in `tests/ui/layout/resizable-panel.test.tsx` — drag resize, min/max constraints, localStorage persistence [CAP-001]
- [x] 2.2 Create `src/ui/layout/ResizablePanel.tsx` — drag-to-resize wrapper, min/max width, localStorage persistence [CAP-001]
- [x] 2.3 Write tests in `tests/ui/layout/top-bar.test.tsx` — circuit name input, undo/redo button disabled states [CAP-001, CAP-003]
- [x] 2.4 Create `src/ui/layout/TopBar.tsx` — circuit name input, sim controls, undo/redo buttons, export placeholder [CAP-001]
- [x] 2.5 Write tests in `tests/ui/layout/right-panel.test.tsx` — tab switching, code/serial content rendering [CAP-001, CAP-002]
- [x] 2.6 Create `src/ui/layout/RightPanel.tsx` — tabbed panel (Code Editor / Serial Monitor), property panel slot [CAP-001]
- [x] 2.7 Create `src/ui/undo/UndoContext.tsx` — React context provider, `useUndo` hook, keyboard shortcut listener with input-guard [CAP-003]
- [x] 2.8 Write tests in `tests/ui/context-menu/context-menu.test.tsx` — viewport clamping, Escape dismiss, click-outside dismiss [CAP-004]
- [x] 2.9 Create `src/ui/context-menu/ContextMenu.tsx` — portal to body, viewport clamping, dismiss handlers [CAP-004]
- [x] 2.10 Create `src/ui/context-menu/menuConfigs.ts` — menu item definitions per context type (canvas, component, wire, pin) [CAP-004]
- [x] 2.11 Create barrel export: `src/ui/context-menu/index.ts` [CAP-004]
- [x] 2.12 Create `src/ui/layout/LeftPanel.tsx` — palette container using ResizablePanel [CAP-001]
- [x] 2.13 Restructure `src/ui/app.tsx` — Tinkercad layout with TopBar + LeftPanel + Workspace + RightPanel wrapped in UndoProvider [CAP-001]
- [x] 2.14 Create `src/styles/layout.css` — dark theme variables and layout styles [CAP-001]

## Phase 3: Property Editor & Palette Components

- [x] 3.1 Write tests in `tests/ui/properties/property-field.test.ts` — dropdown renders options, color picker fires onChange, slider clamps to min/max [CAP-002]
- [x] 3.2 Create `src/ui/properties/PropertyField.tsx` — polymorphic field renderer (dropdown, color, slider, text, number) [CAP-002]
- [x] 3.3 Write tests in `tests/ui/properties/custom-value-input.test.ts` — parse "3.3k"→3300, reject "abc", inline error display [CAP-002]
- [x] 3.4 Create `src/ui/properties/CustomValueInput.tsx` — numeric input with unit suffix parsing, inline validation [CAP-002]
- [x] 3.5 Write tests in `tests/ui/properties/property-panel.test.ts` — shows placeholder when no selection, renders fields for selected component [CAP-002]
- [x] 3.6 Create `src/ui/properties/PropertyPanel.tsx` — header with type label, iterates SCHEMA_MAP, shows placeholder [CAP-002]
- [x] 3.7 Write tests in `tests/ui/palette/tinkercad-palette.test.ts` — collapse/expand category, search filter, recently used section [CAP-006]
- [x] 3.8 Create `src/ui/palette/TinkercadPalette.tsx` — collapsible categories, search bar, recently used, drag-to-canvas, thumbnails [CAP-006]

## Phase 4: Workspace Integration & App Restructure

- [x] 4.1 Add `ContextMenuState` and `WireDrawingState` types to `src/ui/workspace/types.ts` [CAP-004, CAP-005]
- [x] 4.2 Add hover highlight constants (`HOVER_SHADOW`, `WIRE_MODE_VALID_COLOR`, etc.) to `src/ui/workspace/types.ts` [CAP-005]
- [x] 4.3 Create `src/ui/workspace/hover-effects.ts` — pure utility functions for Konva hover effects (applyComponentHover, removeComponentHover, applyPinHover, removePinHover, applyWireModeHighlight, removeWireModeHighlight) [CAP-005]
- [x] 4.4 Modify `src/ui/workspace/ComponentItem.tsx` — add mouseenter/mouseleave glow on Group, wire-drawing pin highlighting (green/red), context menu event handling [CAP-004, CAP-005]
- [x] 4.5 Create `src/ui/workspace/PinTooltip.tsx` — HTML overlay via React portal showing pin labels [CAP-005]
- [x] 4.6 Modify `src/ui/workspace/Workspace.tsx` — add context menu state/handler, stage contextmenu event, pass wireDrawing to ComponentItem [CAP-003, CAP-004, CAP-005]
- [x] 4.7 Modify `src/ui/app.tsx` — integrate context menu with action dispatch (rotate, delete, duplicate, properties), wire CommandManager actions through menu item callbacks [CAP-001, CAP-003, CAP-004]
- [x] 4.8 Write tests in `tests/ui/workspace/types-extended.test.ts` — ContextMenuState, WireDrawingState, hover constants [CAP-004, CAP-005]
- [x] 4.9 Write tests in `tests/ui/workspace/hover-effects.test.ts` — applyComponentHover, removeComponentHover, applyPinHover, removePinHover, applyWireModeHighlight, removeWireModeHighlight [CAP-005]
- [x] 4.10 Write tests in `tests/ui/workspace/hover-integration.test.ts` — hover lifecycle, pin validity logic, wire-mode highlight lifecycle [CAP-005]
- [x] 4.11 Write tests in `tests/ui/workspace/pin-tooltip.test.tsx` — visibility, label rendering, positioning, styling [CAP-005]
- [x] 4.12 Write integration tests `tests/ui/integration/context-menu-flow.test.tsx` — menu configs, ContextMenu rendering, action dispatch [CAP-004]
- [x] 4.13 Write integration tests `tests/ui/integration/tinkercad-ui.test.tsx` — property change flow, palette drag flow, context menu delete/undo, rotate/undo, undo stack behavior [CAP-002, CAP-003, CAP-004]
- [x] 4.14 Write integration tests `tests/ui/integration/layout.test.tsx` — property schema completeness, recently used persistence [CAP-002, CAP-006]
- [x] 4.15 Write integration tests `tests/ui/integration/property-flow.test.tsx` — select component → change property → undo → revert, palette drag → add → undo, context menu delete → undo, rotate → undo [CAP-002, CAP-003]
- [x] 4.16 Fix pre-existing TypeScript issues: PaletteItem missing `icon` field, PropertyPanel unused import [CAP-006]
- [x] 4.17 Final polish: TypeScript compiles clean, all 572 tests passing (502 original + 70 new)
