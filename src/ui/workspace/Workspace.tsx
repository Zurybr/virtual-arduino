import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Stage, Layer } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { DotGrid } from "./DotGrid";
import { ComponentItem, getComponentPins } from "./ComponentItem";
import { WireLayer } from "./WireLayer";
import { InteractionLayer } from "./InteractionLayer";
import {
  MIN_ZOOM,
  MAX_ZOOM,
  snapToGrid,
  type PlacedComponent,
  type Wire,
  type PinConnectionPoint,
  type InteractionMode,
} from "./types";

interface WorkspaceProps {
  components: PlacedComponent[];
  wires: Wire[];
  onComponentPlaced: (type: string, x: number, y: number) => void;
  onComponentMoved: (id: string, x: number, y: number) => void;
  onComponentRotated: (id: string, rotation: number) => void;
  onComponentDeleted: (id: string) => void;
  onWireCreated: (
    startPin: { componentId: string; pinId: string },
    endPin: { componentId: string; pinId: string },
  ) => void;
  onWireDeleted: (id: string) => void;
  onComponentSelected: (id: string | null) => void;
}

function getPinWorldPosition(
  componentId: string,
  pinId: string,
  components: PlacedComponent[],
  componentPins: Record<string, PinConnectionPoint[]>,
): { x: number; y: number } | null {
  const comp = components.find((c) => c.id === componentId);
  if (!comp) return null;
  const pins = componentPins[componentId];
  if (!pins) return null;
  const pin = pins.find((p) => p.id === pinId);
  if (!pin) return null;

  const rad = (comp.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: comp.x + pin.x * cos - pin.y * sin,
    y: comp.y + pin.x * sin + pin.y * cos,
  };
}

export const Workspace: React.FC<WorkspaceProps> = ({
  components,
  wires,
  onComponentPlaced,
  onComponentMoved,
  onComponentRotated,
  onComponentDeleted,
  onWireCreated,
  onWireDeleted,
  onComponentSelected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<InteractionMode>("select");
  const [wireDrawing, setWireDrawing] = useState<{
    startComponentId: string;
    startPinId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [rubberBand, setRubberBand] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [ghostComponent, setGhostComponent] = useState<{
    type: string;
    x: number;
    y: number;
  } | null>(null);
  const isPanning = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const spaceHeld = useRef(false);

  const componentPins = useMemo(() => {
    const map: Record<string, PinConnectionPoint[]> = {};
    for (const comp of components) {
      map[comp.id] = getComponentPins(comp.type, comp.state);
    }
    return map;
  }, [components]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        spaceHeld.current = true;
      }
      if (e.key === "Escape") {
        setWireDrawing(null);
        setGhostComponent(null);
        setMode("select");
        setSelectedIds([]);
        onComponentSelected(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        for (const id of selectedIds) {
          const comp = components.find((c) => c.id === id);
          if (comp) {
            onComponentDeleted(id);
          }
        }
        const wiresToDelete = wires.filter(
          (w) =>
            selectedIds.includes(w.startPin.componentId) ||
            selectedIds.includes(w.endPin.componentId),
        );
        for (const w of wiresToDelete) {
          onWireDeleted(w.id);
        }
        setSelectedIds([]);
        onComponentSelected(null);
      }
      if (
        (e.key === "r" || e.key === "R") &&
        !e.ctrlKey &&
        !e.metaKey &&
        selectedIds.length > 0
      ) {
        for (const id of selectedIds) {
          const comp = components.find((c) => c.id === id);
          if (comp) {
            const newRotation = ((comp.rotation + 90) % 360) as
              | 0
              | 90
              | 180
              | 270;
            onComponentRotated(id, newRotation);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        spaceHeld.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    selectedIds,
    components,
    wires,
    onComponentDeleted,
    onWireDeleted,
    onComponentRotated,
    onComponentSelected,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
      if (!stageRef.current) return;
      const stage = stageRef.current;
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const worldX = (pointerPos.x - stagePos.x) / scale;
      const worldY = (pointerPos.y - stagePos.y) / scale;
      const type = e.dataTransfer?.getData("component-type") ?? "generic";
      setGhostComponent({
        type,
        x: snapToGrid(worldX),
        y: snapToGrid(worldY),
      });
    };

    const handleDragLeave = () => {
      setGhostComponent(null);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer?.getData("component-type");
      if (!type || !stageRef.current) {
        setGhostComponent(null);
        return;
      }
      const stage = stageRef.current;
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) {
        setGhostComponent(null);
        return;
      }

      const worldX = (pointerPos.x - stagePos.x) / scale;
      const worldY = (pointerPos.y - stagePos.y) / scale;
      onComponentPlaced(type, snapToGrid(worldX), snapToGrid(worldY));
      setGhostComponent(null);
    };

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("dragleave", handleDragLeave);
    container.addEventListener("drop", handleDrop);
    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("dragleave", handleDragLeave);
      container.removeEventListener("drop", handleDrop);
    };
  }, [stagePos, scale, onComponentPlaced]);

  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const oldScale = scale;
      const scaleBy = 1.08;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy),
      );

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setScale(newScale);
      setStagePos(newPos);
    },
    [scale, stagePos],
  );

  const getWorldPos = useCallback(
    (e: KonvaEventObject<MouseEvent | DragEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return null;
      const pointer = stage.getPointerPosition();
      if (!pointer) return null;
      return {
        x: (pointer.x - stagePos.x) / scale,
        y: (pointer.y - stagePos.y) / scale,
      };
    },
    [stagePos, scale],
  );

  const handleStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (
        e.evt.button === 1 ||
        (e.evt.button === 0 && spaceHeld.current)
      ) {
        isPanning.current = true;
        lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY };
        return;
      }

      if (e.evt.button === 0 && mode === "select") {
        const clickedOnEmpty =
          e.target === e.target.getStage() ||
          e.target.name() === "dot-grid" ||
          e.target.getParent()?.name() === "dot-grid-layer";
        if (clickedOnEmpty) {
          if (!e.evt.shiftKey) {
            setSelectedIds([]);
            onComponentSelected(null);
          }
          const worldPos = getWorldPos(e);
          if (worldPos) {
            setRubberBand({
              x1: worldPos.x,
              y1: worldPos.y,
              x2: worldPos.x,
              y2: worldPos.y,
            });
          }
        }
      }
    },
    [mode, getWorldPos, onComponentSelected],
  );

  const handleStageMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (isPanning.current) {
        const dx = e.evt.clientX - lastPointerPos.current.x;
        const dy = e.evt.clientY - lastPointerPos.current.y;
        setStagePos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY };
        return;
      }

      if (wireDrawing) {
        const worldPos = getWorldPos(e);
        if (worldPos) {
          setWireDrawing((prev) =>
            prev ? { ...prev, currentX: worldPos.x, currentY: worldPos.y } : null,
          );
        }
        return;
      }

      if (rubberBand) {
        const worldPos = getWorldPos(e);
        if (worldPos) {
          setRubberBand((prev) =>
            prev ? { ...prev, x2: worldPos.x, y2: worldPos.y } : null,
          );
        }
      }
    },
    [wireDrawing, rubberBand, getWorldPos],
  );

  const handleStageMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (isPanning.current && e.evt.button === 1) {
        isPanning.current = false;
        return;
      }
      if (isPanning.current && e.evt.button === 0 && spaceHeld.current) {
        isPanning.current = false;
        return;
      }

      if (rubberBand) {
        setRubberBand(null);
      }
    },
    [rubberBand],
  );

  const handleComponentDragStart = useCallback(
    (id: string) => {
      setSelectedIds([id]);
      onComponentSelected(id);
    },
    [onComponentSelected],
  );

  const handleComponentDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      onComponentMoved(id, snapToGrid(x), snapToGrid(y));
    },
    [onComponentMoved],
  );

  const handleComponentSelect = useCallback(
    (id: string) => {
      setSelectedIds([id]);
      onComponentSelected(id);
    },
    [onComponentSelected],
  );

  const handlePinClick = useCallback(
    (componentId: string, pinId: string) => {
      if (!wireDrawing) {
        const pos = getPinWorldPosition(
          componentId,
          pinId,
          components,
          componentPins,
        );
        if (pos) {
          setWireDrawing({
            startComponentId: componentId,
            startPinId: pinId,
            startX: pos.x,
            startY: pos.y,
            currentX: pos.x,
            currentY: pos.y,
          });
        }
        setMode("wire");
      } else {
        if (componentId === wireDrawing.startComponentId && pinId === wireDrawing.startPinId) {
          return;
        }
        onWireCreated(
          {
            componentId: wireDrawing.startComponentId,
            pinId: wireDrawing.startPinId,
          },
          { componentId, pinId },
        );
        setWireDrawing(null);
        setMode("select");
      }
    },
    [wireDrawing, components, componentPins, onWireCreated],
  );

  const handlePinHover = useCallback(
    (_componentId: string, _pinId: string | null) => {
    },
    [],
  );

  const previewWire = wireDrawing
    ? {
        start: { x: wireDrawing.startX, y: wireDrawing.startY },
        end: { x: wireDrawing.currentX, y: wireDrawing.currentY },
      }
    : null;

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: "hidden",
        backgroundColor: "#1e1e1e",
        position: "relative",
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        draggable={false}
      >
        <Layer name="grid-layer">
          <DotGrid
            stageWidth={dimensions.width}
            stageHeight={dimensions.height}
            stageX={stagePos.x}
            stageY={stagePos.y}
            scale={scale}
          />
        </Layer>
        <Layer name="wire-layer">
          <WireLayer wires={wires} previewWire={previewWire} />
        </Layer>
        <Layer name="components-layer">
          {components.map((comp) => (
            <ComponentItem
              key={comp.id}
              component={comp}
              pins={componentPins[comp.id] ?? []}
              selected={selectedIds.includes(comp.id)}
              dragging={false}
              onDragStart={handleComponentDragStart}
              onDragEnd={handleComponentDragEnd}
              onSelect={handleComponentSelect}
              onPinClick={handlePinClick}
              onPinHover={handlePinHover}
            />
          ))}
        </Layer>
        <Layer name="interaction-layer">
          <InteractionLayer
            stageX={stagePos.x}
            stageY={stagePos.y}
            scale={scale}
            components={components}
            componentPins={componentPins}
            mode={mode}
            selectedIds={selectedIds}
            wireDrawing={wireDrawing}
            rubberBand={rubberBand}
            ghostComponent={ghostComponent}
            onStageMouseDown={handleStageMouseDown}
            onStageMouseMove={handleStageMouseMove}
            onStageMouseUp={handleStageMouseUp}
          />
        </Layer>
      </Stage>
    </div>
  );
};
