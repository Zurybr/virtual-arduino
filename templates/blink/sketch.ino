/*
 * Blink — LED on Pin 13
 *
 * Pre-loaded template for the Arduino Virtual Simulator.
 * Connections:
 *   USB Connector → Arduino 5V (power)
 *   USB Connector → Arduino GND (ground)
 *   Arduino D13 → Resistor 220Ω → LED Anode
 *   LED Cathode → Arduino GND
 *
 * Prueba: Desconecta el USB connector y observa que el LED se apaga.
 * Reconecta y debería volver a funcionar.
 */

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("=== Blink Template ===");
  Serial.println("LED en pin 13, USB conectado.");
  Serial.println("Desconecta el USB para ver que se apaga!");
}

void loop() {
  digitalWrite(13, HIGH);   // LED ON
  Serial.println("LED: ON");
  delay(1000);

  digitalWrite(13, LOW);    // LED OFF
  Serial.println("LED: OFF");
  delay(1000);
}
