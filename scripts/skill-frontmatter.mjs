const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const ALLOWED_KEYS = new Set(['name', 'version', 'description', 'when_to_use', 'license', 'metadata']);

export function parseSkillDocument(text) {
  if (typeof text !== 'string') throw new TypeError('Skill document must be text');

  const match = text.match(FRONTMATTER);
  if (!match) throw new Error('YAML frontmatter missing');

  const metadata = {};
  for (const [index, line] of match[1].split(/\r?\n/).entries()) {
    if (!line.trim()) continue;

    const separator = line.indexOf(':');
    if (separator < 1) throw new Error(`frontmatter line ${index + 1} is malformed`);

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    if (!ALLOWED_KEYS.has(key)) throw new Error(`unsupported frontmatter key: ${key}`);
    if (Object.hasOwn(metadata, key)) throw new Error(`duplicate frontmatter key: ${key}`);

    if (key === 'name') {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawValue)) {
        throw new Error('name must use lower-case hyphen-case');
      }
      metadata.name = rawValue;
      continue;
    }

    if (key === 'version') {
      const ver = rawValue.startsWith('"') && rawValue.endsWith('"')
        ? JSON.parse(rawValue)
        : rawValue;
      if (!/^\d+\.\d+\.\d+$/.test(ver)) {
        throw new Error('version must be a semver string like "1.2.3"');
      }
      metadata.version = ver;
      continue;
    }

    // All other fields (description, when_to_use, license, metadata) must be JSON-quoted strings
    if (!rawValue.startsWith('"') || !rawValue.endsWith('"')) {
      throw new Error(`${key} must be a JSON-quoted YAML string`);
    }

    let value;
    try {
      value = JSON.parse(rawValue);
    } catch (error) {
      throw new Error(`${key} is not a valid quoted string: ${error.message}`);
    }
    
    if (key === 'description' || key === 'when_to_use') {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`${key} must be a non-empty string`);
      }
    }
    
    metadata[key] = value;
  }

  for (const key of ALLOWED_KEYS) {
    if (['version', 'when_to_use', 'license', 'metadata'].includes(key)) continue; // optional fields
    if (!Object.hasOwn(metadata, key)) throw new Error(`frontmatter ${key} missing`);
  }

  return { metadata, body: text.slice(match[0].length) };
}
