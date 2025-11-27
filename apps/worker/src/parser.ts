type TriggerValues = Record<string, any>;

//Replace Placeholders
export function parseDynamicFields<T>(
  data: T,
  triggerValues: TriggerValues,
): T {
  const replaceValue = (value: any): any => {
    if (typeof value === "string") {
      return value.replace(/{{([\w.]+)}}/g, (match, fullKey) => {
        const keys = fullKey.split(".");
        let current: any = triggerValues;

        for (const key of keys) {
          if (current === undefined || current === null) break;
          if (Array.isArray(current) && /^\d+$/.test(key)) {
            current = current[parseInt(key, 10)];
          } else {
            current = current[key];
          }
        }

        return current !== undefined ? current : match;
      });
    }
    return value;
  };

  if (typeof data === "string") {
    return replaceValue(data) as T;
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

  return data;
}
