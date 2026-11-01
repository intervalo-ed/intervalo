// Horarios de los recordatorios. Compartidos entre la web (los de Intervalo y
// los del juego) y la app nativa: una sola lista para que el selector no cambie
// según dónde lo abras.

export const DEFAULT_REMINDER_TIME = "19:00"

// En punto, de 08:00 a 22:00 (paso de 1 hora).
export const REMINDER_TIME_OPTIONS: string[] = Array.from(
  { length: 22 - 8 + 1 },
  (_, i) => `${String(8 + i).padStart(2, "0")}:00`,
)
