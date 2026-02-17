export function maskFieldValue(value: string): string {
  if (!value) return value;

  const atIndex = value.indexOf("@");

  if (atIndex > 0) {
    const local = value.slice(0, atIndex);
    const domain = value.slice(atIndex);
    if (local.length <= 2) return local[0] + "***" + domain;
    return local[0] + "***" + domain;
  }

  if (value.length <= 2) return value[0] + "*";
  if (value.length <= 4) return value[0] + "*".repeat(value.length - 2) + value[value.length - 1];
  return value[0] + "*".repeat(value.length - 2) + value[value.length - 1];
}
