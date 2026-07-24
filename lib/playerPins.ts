// Per-player 3-digit codes, one env var per player: <NAME>_PIN (e.g.
// KARL_PIN="677"). Mirrors ADMIN_PIN's "shared secret in an env var" model —
// not real auth, just enough to stop someone tapping a name that isn't
// theirs. Names are transliterated to ASCII for the env var key (æøå have no
// portable representation in env var names — Next.js's env loader silently
// drops non-ASCII variable names) but the player's stored name keeps its
// real spelling.
const TRANSLITERATE: Record<string, string> = { Æ: "AE", Ø: "O", Å: "A" };

function envKeyFor(name: string): string {
  const ascii = name
    .toUpperCase()
    .split("")
    .map((ch) => TRANSLITERATE[ch] ?? ch)
    .join("")
    .replace(/[^A-Z0-9]/g, "");
  return `${ascii}_PIN`;
}

export function getPlayerPin(name: string): string | null {
  return process.env[envKeyFor(name)] ?? null;
}
