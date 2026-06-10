/*
 * Potentiometer + PWM LED — Analog I/O
 *
 * Pre-loaded template for the Arduino Virtual Simulator.
 * Connections:
 *   USB Connector → Arduino 5V + GND (power)
 *   Potentiometer VCC → Arduino 5V
 *   Potentiometer Wiper → Arduino A0
 *   Potentiometer GND → Arduino GND
 *   Arduino D9 (PWM) → 220Ω Resistor → RGB LED Red pin
 *   RGB LED GND → Arduino GND
 *
 * Prueba: Gira el potenciómetro y el brillo del LED cambia.
 * Mira el Serial Monitor para ver los valores exactos.
 * Desconecta el USB → todo muere.
 */

const int POT_PIN = A0;
const int LED_PIN = 9;

int potValue = 0;
int brightness = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("=== Potentiometer + PWM LED Template ===");
  Serial.println("Gira la perilla para cambiar el brillo!");
  Serial.println("Pin A0 = analogRead | Pin D9 = PWM output");
}

void loop() {
  potValue = analogRead(POT_PIN);       // 0 - 1023
  brightness = map(potValue, 0, 1023, 0, 255);

  analogWrite(LED_PIN, brightness);

  Serial.print("Pot: ");
  Serial.print(potValue);
  Serial.print(" | Brightness: ");
  Serial.print(brightness);
  Serial.print("/255");
  Serial.print(" | Voltage: ");
  Serial.print(potValue * 5.0 / 1023.0, 2);
  Serial.println("V");

  delay(100);
}
