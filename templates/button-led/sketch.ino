/*
 * Button + LED — Digital Input
 *
 * Pre-loaded template for the Arduino Virtual Simulator.
 * Connections:
 *   USB Connector → Arduino 5V + GND (power)
 *   Pushbutton Terminal A → Arduino 5V
 *   Pushbutton Terminal B → Arduino D2
 *   10kΩ Pull-down Resistor → D2 to GND
 *   Arduino D13 → 220Ω Resistor → LED Anode
 *   LED Cathode → GND
 *
 * Prueba: Presiona el botón y el LED se prende.
 * Desconecta el USB y NADA funciona — sin corriente no hay vida.
 */

const int BUTTON_PIN = 2;
const int LED_PIN = 13;
const int DEBOUNCE_DELAY = 50;

int lastButtonState = LOW;
int ledState = LOW;
unsigned long lastDebounceTime = 0;

void setup() {
  pinMode(BUTTON_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("=== Button + LED Template ===");
  Serial.println("Presiona el boton para encender el LED.");
  Serial.println("Prueba desconectar el USB connector!");
}

void loop() {
  int reading = digitalRead(BUTTON_PIN);

  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    if (reading != ledState) {
      ledState = reading;

      if (ledState == HIGH) {
        digitalWrite(LED_PIN, HIGH);
        Serial.println("BOTON: PRESIONADO | LED: ON");
      } else {
        digitalWrite(LED_PIN, LOW);
        Serial.println("BOTON: LIBRE | LED: OFF");
      }
    }
  }

  lastButtonState = reading;
}
