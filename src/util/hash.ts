/**
 * A deterministic, dependency-free 128-bit-ish hash built from four FNV-1a
 * variants with distinct seeds, rendered as 32 hex characters. Used to give a
 * job a stable identity from its URL across runs. Not cryptographic — just a
 * fast, collision-resistant fingerprint.
 */
export function stableHash(input: string | number | null | undefined): string {
  const s = String(input || '');
  const seeds = [0x811c9dc5, 0x45d9f3b, 0x27d4eb2d, 0x165667b1];
  return seeds
    .map((seed, i) => {
      let h = seed ^ s.length ^ i;
      for (let n = 0; n < s.length; n++) {
        h ^= s.charCodeAt(n);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0).toString(16).padStart(8, '0');
    })
    .join('');
}
