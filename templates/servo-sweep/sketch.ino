/*
 * Servo Sweep — PWM Motor Control
 *
 * Pre-loaded template for the Arduino Virtual Simulator.
 * Connections:
 *   USB Connector → Arduino 5V + GND (power)
 *   Servo VCC → Arduino 5V
 *   Servo GND → Arduino GND
 *   Servo Signal → Arduino D9 (PWM)
 *   Arduino D13 → 220Ω Resistor → Status LED → GND
 *
 * Prueba: El servo barre de 0° a 180° y vuelve.
 * El LED de status parpadea mientras el servo se mueve.
 * Desconecta el USB → servo se detiene, LED se apaga.
 */

#include <Servo.h>

const int SERVO_PIN = 9;
const int STATUS_LED = 13;

Servo myServo;

int angle = 0;
int direction = 1;
bool ledToggle = false;

void setup() {
  myServo.attach(SERVO_PIN);
  pinMode(STATUS_LED, OUTPUT);
  Serial.begin(9600);
  Serial.println("=== Servo Sweep Template ===");
  Serial.println("Servo en pin 9 (PWM). Status LED en pin 13.");
  Serial.println("Desconecta el USB para cortar la corriente!");
}

void loop() {
  myServo.write(angle);

  // Toggle status LED on each step
  ledToggle = !ledToggle;
  digitalWrite(STATUS_LED, ledToggle ? HIGH : LOW);

  Serial.print("Angulo: ");
  Serial.print(angle);
  Serial.println(" grados");

  angle += direction;

  // Reverse at limits
  if (angle >= 180 || angle <= 0) {
    direction = -direction;
    Serial.println(">>> Cambio de direccion!");
  }

  delay(15);
}
