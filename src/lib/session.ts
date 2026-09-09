// Manejo de sesión del cliente: token, llamadas autenticadas a la API y
// credencial local para poder ingresar cuando la droguería se queda sin internet.

const TOKEN_KEY = "vexapos_token";
const USER_KEY = "vexapos_user";
const CREDENTIAL_KEY = "vexapos_offline_credential";

// PBKDF2 con el parámetro recomendado por OWASP para SHA-256.
const PBKDF2_ITERATIONS = 310000;

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch (err) {
    return "";
  }
}

export function setToken(token: string) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    /* almacenamiento no disponible */
  }
}

export function clearToken() {
  setToken("");
}

// Sesión guardada por una versión anterior de la app, que todavía no tiene
// token. Sirve para pedir un reingreso limpio al abrir, en vez de dejar que
// el usuario choque con un 401 en plena venta.
export function hasLegacySession(): boolean {
  try {
    return !!localStorage.getItem(USER_KEY) && !localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Llamadas autenticadas
// ---------------------------------------------------------------------------

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

// Reemplaza a fetch() para todo lo que va a /api: adjunta el token y avisa a
// la app cuando el servidor responde que la sesión ya no vale.
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  // Un 401 en /api/auth/* significa "contraseña incorrecta", no "sesión
  // vencida": no debe sacar de la sesión a quien está reconfirmando su clave.
  const isAuthRoute = input.startsWith("/api/auth/");
  if (response.status === 401 && !isAuthRoute) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
  }

  return response;
}

// ---------------------------------------------------------------------------
// Credencial local para modo offline
// ---------------------------------------------------------------------------
// Tras un ingreso exitoso en línea se guarda en este equipo un hash de la
// contraseña (nunca la contraseña). Si después se cae la conexión, el mismo
// usuario puede volver a entrar en este equipo con su contraseña real.

interface StoredCredential {
  email: string;
  salt: string;
  hash: string;
  iterations: number;
  user: any;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function subtleCrypto(): SubtleCrypto | null {
  try {
    return window.crypto && window.crypto.subtle ? window.crypto.subtle : null;
  } catch (err) {
    return null;
  }
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const subtle = subtleCrypto();
  if (!subtle) throw new Error("WebCrypto no disponible");

  const keyMaterial = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", salt: salt as any, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function cacheOfflineCredential(email: string, password: string, user: any) {
  try {
    if (!subtleCrypto()) return;
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const hash = await derivePasswordHash(password, salt, PBKDF2_ITERATIONS);
    const record: StoredCredential = {
      email: email.trim().toLowerCase(),
      salt: bytesToHex(salt),
      hash,
      iterations: PBKDF2_ITERATIONS,
      user
    };
    localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(record));
  } catch (err) {
    /* si no se puede guardar, simplemente no habrá ingreso offline */
  }
}

// Devuelve el usuario guardado si la contraseña coincide; null en cualquier
// otro caso (sin credencial guardada, otro correo, contraseña equivocada).
export async function verifyOfflineCredential(email: string, password: string): Promise<any | null> {
  try {
    const raw = localStorage.getItem(CREDENTIAL_KEY);
    if (!raw) return null;

    const record: StoredCredential = JSON.parse(raw);
    if (!record || record.email !== email.trim().toLowerCase()) return null;

    const hash = await derivePasswordHash(password, hexToBytes(record.salt), record.iterations);
    if (hash.length !== record.hash.length) return null;

    // Comparación en tiempo constante para no filtrar el hash por temporización.
    let diff = 0;
    for (let i = 0; i < hash.length; i++) {
      diff |= hash.charCodeAt(i) ^ record.hash.charCodeAt(i);
    }
    return diff === 0 ? record.user : null;
  } catch (err) {
    return null;
  }
}

export function clearOfflineCredential() {
  try {
    localStorage.removeItem(CREDENTIAL_KEY);
  } catch (err) {
    /* nada que limpiar */
  }
}
