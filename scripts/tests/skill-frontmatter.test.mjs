import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSkillDocument } from '../skill-frontmatter.mjs';

const skill = (frontmatter, newline = '\n') =>
  ['---', ...frontmatter, '---', '', '# Test'].join(newline);

test('accepts the repository frontmatter subset and quoted colons', () => {
  const parsed = parseSkillDocument(skill([
    'name: test-skill',
    'description: "Maintain a project: safely."'
  ]));

  assert.deepEqual(parsed.metadata, {
    name: 'test-skill',
    description: 'Maintain a project: safely.'
  });
  assert.match(parsed.body, /^\n# Test/);
});

test('accepts CRLF documents', () => {
  const parsed = parseSkillDocument(skill([
    'name: test-skill',
    'description: "Test description"'
  ], '\r\n'));

  assert.equal(parsed.metadata.name, 'test-skill');
});

test('rejects the unquoted colon form that npx skills cannot parse', () => {
  assert.throws(
    () => parseSkillDocument(skill([
      'name: test-skill',
      'description: Maintain a project: safely.'
    ])),
    /JSON-quoted YAML string/
  );
});

test('rejects extra or duplicate metadata', () => {
  assert.throws(
    () => parseSkillDocument(skill([
      'name: test-skill',
      'description: "Test description"',
      'unknown_field: "value"'
    ])),
    /unsupported frontmatter key/
  );
  assert.throws(
    () => parseSkillDocument(skill([
      'name: test-skill',
      'name: duplicate-skill',
      'description: "Test description"'
    ])),
    /duplicate frontmatter key/
  );
});
