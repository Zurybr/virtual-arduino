import { describe, it, expect } from "vitest";
import { Circuit } from "../../src/simulation/core/circuit";
import { Board } from "../../src/simulation/core/board";
import { Wire } from "../../src/simulation/core/wire";
import { ATMEGA328P } from "../../src/simulation/core/board-model";
import { PinRef } from "../../src/types";

describe("Circuit", () => {
  function createBoard(): Board {
    return new Board(ATMEGA328P);
  }

  describe("creation", () => {
    it("creates circuit with board", () => {
      const board = createBoard();
      const circuit = new Circuit(board);
      expect(circuit.board).toBe(board);
      expect(circuit.wires.size).toBe(0);
    });
  });

  describe("addWire", () => {
    it("connects two pins", () => {
      const board = createBoard();
      const circuit = new Circuit(board);
      const startPin: PinRef = {
        parentId: "arduino-uno",
        pinId: "D9",
        parentType: "board",
      };
      const endPin: PinRef = {
        parentId: "led-1",
        pinId: "anode",
        parentType: "component",
      };
      const wire = new Wire("w1", startPin, endPin, [], "#ff0000");
      circuit.addWire(wire);
      expect(circuit.wires.has("w1")).toBe(true);
    });
  });

  describe("resolveNet", () => {
    it("finds pins connected through breadboard internal connections (same row)", () => {
      const board = createBoard();
      const circuit = new Circuit(board);
      circuit.setBreadboardId("breadboard-1");

      const wireToBreadboard = new Wire(
        "w1",
        { parentId: "arduino-uno", pinId: "D9", parentType: "board" },
        { parentId: "breadboard-1", pinId: "a5", parentType: "component" },
        [],
        "#ff0000",
      );
      circuit.addWire(wireToBreadboard);

      const net = circuit.resolveNet({
        parentId: "arduino-uno",
        pinId: "D9",
        parentType: "board",
      });

      const pinIds = Array.from(net).map((ref) => ref.pinId);
      expect(pinIds).toContain("D9");
      expect(pinIds).toContain("a5");
      expect(pinIds).toContain("b5");
      expect(pinIds).toContain("c5");
      expect(pinIds).toContain("d5");
      expect(pinIds).toContain("e5");
    });
  });

  describe("signal propagation", () => {
    it("propagates signal through a wire", () => {
      const board = createBoard();
      const circuit = new Circuit(board);

      const wire = new Wire(
        "w1",
        { parentId: "arduino-uno", pinId: "D9", parentType: "board" },
        { parentId: "arduino-uno", pinId: "D10", parentType: "board" },
        [],
        "#ff0000",
      );
      circuit.addWire(wire);

      circuit.propagate(
        { parentId: "arduino-uno", pinId: "D9", parentType: "board" },
        { type: "digital", high: true },
      );

      const pin10 = board.getPin("D10");
      expect(pin10?.getValue()).toEqual({ type: "digital", high: true });
    });
  });

  describe("removeWire", () => {
    it("disconnects pins", () => {
      const board = createBoard();
      const circuit = new Circuit(board);

      const wire = new Wire(
        "w1",
        { parentId: "arduino-uno", pinId: "D9", parentType: "board" },
        { parentId: "arduino-uno", pinId: "D10", parentType: "board" },
        [],
        "#ff0000",
      );
      circuit.addWire(wire);
      expect(circuit.wires.has("w1")).toBe(true);

      const removed = circuit.removeWire("w1");
      expect(removed).toBe(true);
      expect(circuit.wires.has("w1")).toBe(false);
    });
  });
});
