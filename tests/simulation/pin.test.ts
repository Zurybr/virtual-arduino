import { describe, it, expect } from "vitest";
import { Pin } from "../../src/simulation/core/pin";
import { PinMode, PinCapability, PinValue } from "../../src/types";

describe("Pin", () => {
  function makeDigitalPin(id: string = "D0"): Pin {
    return new Pin(id, "board", "arduino-uno", id, [
      PinCapability.DIGITAL_READ,
      PinCapability.DIGITAL_WRITE,
    ]);
  }

  function makePWMPin(id: string = "D3"): Pin {
    return new Pin(id, "board", "arduino-uno", id, [
      PinCapability.DIGITAL_READ,
      PinCapability.DIGITAL_WRITE,
      PinCapability.PWM_WRITE,
    ]);
  }

  function makeAnalogPin(id: string = "A0"): Pin {
    return new Pin(id, "board", "arduino-uno", id, [
      PinCapability.DIGITAL_READ,
      PinCapability.DIGITAL_WRITE,
      PinCapability.ANALOG_READ,
    ]);
  }

  describe("initial state", () => {
    it("starts in INPUT mode", () => {
      const pin = makeDigitalPin();
      expect(pin.mode).toBe(PinMode.INPUT);
    });

    it("starts with floating value", () => {
      const pin = makeDigitalPin();
      expect(pin.value).toEqual({ type: "floating" });
    });

    it("starts with null busId", () => {
      const pin = makeDigitalPin();
      expect(pin.busId).toBeNull();
    });

    it("stores id, parentType, parentId, label", () => {
      const pin = new Pin("D13", "board", "arduino-uno", "LED", [
        PinCapability.DIGITAL_WRITE,
      ]);
      expect(pin.id).toBe("D13");
      expect(pin.parentType).toBe("board");
      expect(pin.parentId).toBe("arduino-uno");
      expect(pin.label).toBe("LED");
    });
  });

  describe("mode transitions", () => {
    it("transitions from INPUT to OUTPUT", () => {
      const pin = makeDigitalPin();
      pin.setMode(PinMode.OUTPUT);
      expect(pin.mode).toBe(PinMode.OUTPUT);
    });

    it("transitions from OUTPUT to INPUT", () => {
      const pin = makeDigitalPin();
      pin.setMode(PinMode.OUTPUT);
      pin.setMode(PinMode.INPUT);
      expect(pin.mode).toBe(PinMode.INPUT);
    });

    it("transitions from INPUT to INPUT_PULLUP", () => {
      const pin = makeDigitalPin();
      pin.setMode(PinMode.INPUT_PULLUP);
      expect(pin.mode).toBe(PinMode.INPUT_PULLUP);
    });

    it("transitions from OUTPUT to PWM on a PWM-capable pin", () => {
      const pin = makePWMPin();
      pin.setMode(PinMode.OUTPUT);
      pin.setMode(PinMode.PWM);
      expect(pin.mode).toBe(PinMode.PWM);
    });

    it("transitions from INPUT to PWM on a PWM-capable pin", () => {
      const pin = makePWMPin();
      pin.setMode(PinMode.PWM);
      expect(pin.mode).toBe(PinMode.PWM);
    });
  });

  describe("mode validation", () => {
    it("throws when setting PWM on a non-PWM pin", () => {
      const pin = makeDigitalPin();
      expect(() => pin.setMode(PinMode.PWM)).toThrow(
        `Pin D0 does not support mode ${PinMode.PWM}`,
      );
    });

    it("throws when setting I2C_SDA on a digital-only pin", () => {
      const pin = makeDigitalPin();
      expect(() => pin.setMode(PinMode.I2C_SDA)).toThrow();
    });

    it("throws when setting SPI_MOSI on a digital-only pin", () => {
      const pin = makeDigitalPin();
      expect(() => pin.setMode(PinMode.SPI_MOSI)).toThrow();
    });

    it("throws when setting UART_RX on a digital-only pin", () => {
      const pin = makeDigitalPin();
      expect(() => pin.setMode(PinMode.UART_RX)).toThrow();
    });
  });

  describe("value updates", () => {
    it("sets digital HIGH", () => {
      const pin = makeDigitalPin();
      pin.setValue({ type: "digital", high: true });
      expect(pin.getValue()).toEqual({ type: "digital", high: true });
    });

    it("sets digital LOW", () => {
      const pin = makeDigitalPin();
      pin.setValue({ type: "digital", high: false });
      expect(pin.getValue()).toEqual({ type: "digital", high: false });
    });

    it("sets analog value 0", () => {
      const pin = makeAnalogPin();
      pin.setValue({ type: "analog", value: 0 });
      expect(pin.getValue()).toEqual({ type: "analog", value: 0 });
    });

    it("sets analog value 1023", () => {
      const pin = makeAnalogPin();
      pin.setValue({ type: "analog", value: 1023 });
      expect(pin.getValue()).toEqual({ type: "analog", value: 1023 });
    });

    it("sets analog mid-range value 512", () => {
      const pin = makeAnalogPin();
      pin.setValue({ type: "analog", value: 512 });
      expect(pin.getValue()).toEqual({ type: "analog", value: 512 });
    });

    it("sets PWM duty cycle 0", () => {
      const pin = makePWMPin();
      pin.setValue({ type: "pwm", dutyCycle: 0, frequency: 490 });
      expect(pin.getValue()).toEqual({ type: "pwm", dutyCycle: 0, frequency: 490 });
    });

    it("sets PWM duty cycle 255", () => {
      const pin = makePWMPin();
      pin.setValue({ type: "pwm", dutyCycle: 255, frequency: 980 });
      expect(pin.getValue()).toEqual({ type: "pwm", dutyCycle: 255, frequency: 980 });
    });

    it("sets PWM duty cycle 127 (50%)", () => {
      const pin = makePWMPin();
      pin.setValue({ type: "pwm", dutyCycle: 127, frequency: 490 });
      expect(pin.getValue()).toEqual({ type: "pwm", dutyCycle: 127, frequency: 490 });
    });

    it("can transition from digital to analog value", () => {
      const pin = makeAnalogPin();
      pin.setValue({ type: "digital", high: true });
      pin.setValue({ type: "analog", value: 800 });
      expect(pin.getValue()).toEqual({ type: "analog", value: 800 });
    });

    it("can set floating value", () => {
      const pin = makeDigitalPin();
      pin.setValue({ type: "digital", high: true });
      pin.setValue({ type: "floating" });
      expect(pin.getValue()).toEqual({ type: "floating" });
    });
  });

  describe("value events", () => {
    it("subscribe callback fires on setValue", () => {
      const pin = makeDigitalPin();
      const changes: Array<{ oldVal: PinValue; newVal: PinValue }> = [];
      pin.subscribe((_p, oldVal, newVal) => {
        changes.push({ oldVal, newVal });
      });
      pin.setValue({ type: "digital", high: true });
      expect(changes).toHaveLength(1);
      expect(changes[0].oldVal).toEqual({ type: "floating" });
      expect(changes[0].newVal).toEqual({ type: "digital", high: true });
    });

    it("fires callback on every setValue call", () => {
      const pin = makeDigitalPin();
      let count = 0;
      pin.subscribe(() => {
        count++;
      });
      pin.setValue({ type: "digital", high: true });
      pin.setValue({ type: "digital", high: false });
      pin.setValue({ type: "floating" });
      expect(count).toBe(3);
    });

    it("unsubscribe stops callbacks", () => {
      const pin = makeDigitalPin();
      let count = 0;
      const unsub = pin.subscribe(() => {
        count++;
      });
      pin.setValue({ type: "digital", high: true });
      unsub();
      pin.setValue({ type: "digital", high: false });
      expect(count).toBe(1);
    });

    it("unsubscribe via returned function works", () => {
      const pin = makeDigitalPin();
      let count = 0;
      const unsub = pin.subscribe(() => {
        count++;
      });
      unsub();
      pin.setValue({ type: "digital", high: true });
      expect(count).toBe(0);
    });

    it("multiple subscribers all get notified", () => {
      const pin = makeDigitalPin();
      let count1 = 0;
      let count2 = 0;
      pin.subscribe(() => { count1++; });
      pin.subscribe(() => { count2++; });
      pin.setValue({ type: "digital", high: true });
      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });

    it("callback receives correct pin reference", () => {
      const pin = makeDigitalPin();
      let receivedPin: Pin | null = null;
      pin.subscribe((p) => {
        receivedPin = p;
      });
      pin.setValue({ type: "digital", high: true });
      expect(receivedPin).toBe(pin);
    });
  });

  describe("capability checks", () => {
    it("returns true for a capability the pin has", () => {
      const pin = makeDigitalPin();
      expect(pin.hasCapability(PinCapability.DIGITAL_READ)).toBe(true);
      expect(pin.hasCapability(PinCapability.DIGITAL_WRITE)).toBe(true);
    });

    it("returns false for a capability the pin lacks", () => {
      const pin = makeDigitalPin();
      expect(pin.hasCapability(PinCapability.PWM_WRITE)).toBe(false);
      expect(pin.hasCapability(PinCapability.ANALOG_READ)).toBe(false);
      expect(pin.hasCapability(PinCapability.I2C)).toBe(false);
    });

    it("PWM pin reports PWM_WRITE capability", () => {
      const pin = makePWMPin();
      expect(pin.hasCapability(PinCapability.PWM_WRITE)).toBe(true);
    });

    it("analog pin reports ANALOG_READ capability", () => {
      const pin = makeAnalogPin();
      expect(pin.hasCapability(PinCapability.ANALOG_READ)).toBe(true);
    });
  });

  describe("reset", () => {
    it("returns to INPUT mode", () => {
      const pin = makeDigitalPin();
      pin.setMode(PinMode.OUTPUT);
      pin.reset();
      expect(pin.mode).toBe(PinMode.INPUT);
    });

    it("returns to floating value", () => {
      const pin = makeDigitalPin();
      pin.setValue({ type: "digital", high: true });
      pin.reset();
      expect(pin.value).toEqual({ type: "floating" });
    });

    it("clears busId", () => {
      const pin = makeDigitalPin();
      pin.busId = "some-bus";
      pin.reset();
      expect(pin.busId).toBeNull();
    });

    it("resets PWM pin back to INPUT", () => {
      const pin = makePWMPin();
      pin.setMode(PinMode.PWM);
      pin.setValue({ type: "pwm", dutyCycle: 200, frequency: 980 });
      pin.reset();
      expect(pin.mode).toBe(PinMode.INPUT);
      expect(pin.value).toEqual({ type: "floating" });
      expect(pin.busId).toBeNull();
    });
  });
});
