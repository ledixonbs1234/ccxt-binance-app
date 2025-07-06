// File: lib/utils.ts

let idCounter = 0;

/**
 * Generates a unique ID using a timestamp and a counter.
 * Ensures uniqueness even for calls within the same millisecond.
 * @returns {number} A unique number ID.
 */
export function generateUniqueId(): number {
  const timestamp = Date.now();
  // Reset counter if time has changed to keep numbers smaller
  if (timestamp > (idCounter - (idCounter % 1000))) {
    idCounter = timestamp * 1000;
  } else {
    idCounter++;
  }
  return idCounter;
}

/**
 * Generates a unique string ID using a timestamp and a random component.
 * Useful for keys where a string is preferred.
 * @returns {string} A unique string ID.
 */
export function generateUniqueStringId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}