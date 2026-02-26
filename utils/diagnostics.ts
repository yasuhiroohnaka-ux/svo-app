export function makeDiagnosticId(prefix: string): string {
  const token = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}_${token}`;
}
