type ConfigValue = unknown;
type ConfigObject = Record<string, ConfigValue>;

function isPlainObject(value: unknown): value is ConfigObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMerge(target: ConfigObject, source: ConfigObject): ConfigObject {
  const result: ConfigObject = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (Array.isArray(sourceValue)) {
      // Arrays replace, don't concat
      result[key] = sourceValue;
    } else if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      // Nested objects merge recursively
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

export function mergeConfigs(...configs: ConfigObject[]): ConfigObject {
  return configs.reduce((acc, config) => deepMerge(acc, config), {} as ConfigObject);
}
