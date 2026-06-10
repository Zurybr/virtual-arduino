import { describe, it, expect, vi } from "vitest";
import { PWMBus } from "../../src/simulation/core/bus";
import { PinValue } from "../../src/types";

describe("PWMBus", () => {
  describe("duty cycle", () => {
    it("defaults to 0", () => {
      const bus = new PWMBus("PWM_0");
      expect(bus.getDutyCycle()).toBe(0);
    });

    it("setDutyCycle(128) sets duty cycle", () => {
      const bus = new PWMBus("PWM_0");
      bus.setDutyCycle(128);
      expect(bus.getDutyCycle()).toBe(128);
    });

    it("setDutyCycle(300) clamps to 255", () => {
      const bus = new PWMBus("PWM_0");
      bus.setDutyCycle(300);
      expect(bus.getDutyCycle()).toBe(255);
    });

    it("setDutyCycle(-10) clamps to 0", () => {
      const bus = new PWMBus("PWM_0");
      bus.setDutyCycle(-10);
      expect(bus.getDutyCycle()).toBe(0);
    });
  });

  describe("frequency", () => {
    it("setFrequency(980) sets frequency", () => {
      const bus = new PWMBus("PWM_0");
      bus.setFrequency(980);
      expect(bus.getFrequency()).toBe(980);
    });
  });

  describe("propagate", () => {
    it("with PWM PinValue sets duty cycle and frequency", () => {
      const bus = new PWMBus("PWM_0");
      const value: PinValue = { type: "pwm", dutyCycle: 200, frequency: 980 };
      bus.propagate("D9", value);
      expect(bus.getDutyCycle()).toBe(200);
      expect(bus.getFrequency()).toBe(980);
    });

    it("with digital HIGH PinValue sets duty to 255", () => {
      const bus = new PWMBus("PWM_0");
      bus.propagate("D9", { type: "digital", high: true });
      expect(bus.getDutyCycle()).toBe(255);
    });

    it("with digital LOW PinValue sets duty to 0", () => {
      const bus = new PWMBus("PWM_0");
      bus.setDutyCycle(128);
      bus.propagate("D9", { type: "digital", high: false });
      expect(bus.getDutyCycle()).toBe(0);
    });
  });

  describe("getState", () => {
    it("returns correct shape", () => {
      const bus = new PWMBus("PWM_0");
      bus.setDutyCycle(64);
      bus.setFrequency(490);
      bus.registerPin("D9");
      const state = bus.getState();
      expect(state).toEqual({
        dutyCycle: 64,
        frequency: 490,
        pinIds: ["D9"],
      });
    });
  });

  describe("pin registration", () => {
    it("pin registration works", () => {
      const bus = new PWMBus("PWM_0");
      bus.registerPin("D9");
      bus.registerPin("D10");
      expect(bus.hasPin("D9")).toBe(true);
      expect(bus.hasPin("D10")).toBe(true);
      expect(bus.hasPin("D3")).toBe(false);
    });
  });

  describe("observable notifications", () => {
    it("change notifications fire on propagate", () => {
      const bus = new PWMBus("PWM_0");
      const callback = vi.fn();
      bus.subscribe(callback);

      bus.propagate("D9", { type: "pwm", dutyCycle: 128, frequency: 980 });

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(
        bus,
        "D9",
        { type: "pwm", dutyCycle: 128, frequency: 980 },
      );
    });
  });
});
