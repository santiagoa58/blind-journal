export function hasOwn<K extends string | number | symbol>(
  input: unknown,
  key: K,
): input is Record<K, unknown> {
  if (input == null) {
    return false;
  }
  return Object.hasOwn(input, key);
}
