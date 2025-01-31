type TriggerValues = Record<string, any>; // Object containing key-value pairs for replacement

export function parseDynamicFields<T>(
  data: T,
  triggerValues: TriggerValues,
): T {
  if (typeof data === "string") {
    return data.replace(/{{trigger\.(\w+)}}/g, (match, key) => {
      return key in triggerValues ? triggerValues[key] : match; // Keep unresolved placeholders
    }) as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => parseDynamicFields(item, triggerValues)) as T;
  }

  if (typeof data === "object" && data !== null) {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      result[key] = parseDynamicFields(value, triggerValues);
    }

    return result as T;
  }

  return data; // Return unchanged for numbers, booleans, etc.
}
