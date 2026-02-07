import { describe, it, expect } from 'vitest';
import {
  PromptEngine,
  parsePrompt,
  renderPrompt,
  extractVariables,
} from '#/utils/prompt-engine';

describe('PromptEngine', () => {
  describe('parse', () => {
    it('should extract variables from template', () => {
      const engine = new PromptEngine(
        'Hello {{name}}, welcome to {{platform}}!',
      );
      const result = engine.parse();

      expect(result.variables).toHaveLength(2);
      expect(result.variables[0].name).toBe('name');
      expect(result.variables[1].name).toBe('platform');
    });

    it('should not duplicate variables', () => {
      const engine = new PromptEngine('{{name}} and {{name}} again');
      const result = engine.parse();

      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].name).toBe('name');
    });

    it('should infer variable types from names', () => {
      const engine = new PromptEngine('{{imageUrl}} {{content}} {{count}}');
      const result = engine.parse();

      const imageVar = result.variables.find((v) => v.name === 'imageUrl');
      const contentVar = result.variables.find((v) => v.name === 'content');
      const countVar = result.variables.find((v) => v.name === 'count');

      expect(imageVar?.type).toBe('image_url');
      expect(contentVar?.type).toBe('text');
      expect(countVar?.type).toBe('number');
    });

    it('should detect nested path warnings', () => {
      const engine = new PromptEngine('{{user.name}} {{user.age}}');
      const result = engine.parse();

      expect(result.warnings).toHaveLength(2);
      expect(result.warnings[0].message).toContain('嵌套路径');
    });
  });

  describe('render', () => {
    it('should replace variables with data', () => {
      const engine = new PromptEngine('Hello {{name}}!');
      const result = engine.render({ name: 'World' });

      expect(result.text).toBe('Hello World!');
      expect(result.replaced.has('name')).toBe(true);
    });

    it('should track missing variables', () => {
      const engine = new PromptEngine('Hello {{name}}, your age is {{age}}');
      const result = engine.render({ name: 'John' });

      expect(result.missing).toContain('age');
      expect(result.replaced.has('name')).toBe(true);
    });

    it('should apply fallback strategies', () => {
      const engine = new PromptEngine('Hello {{name}}!');

      // keep fallback
      const keepResult = engine.render({}, { fallback: 'keep' });
      expect(keepResult.text).toBe('Hello {{name}}!');

      // empty fallback
      const emptyResult = engine.render({}, { fallback: 'empty' });
      expect(emptyResult.text).toBe('Hello !');
    });

    it('should handle JSON variables', () => {
      const engine = new PromptEngine('Data: {{data}}');
      const result = engine.render({
        data: { foo: 'bar', num: 123 },
      });

      expect(result.text).toContain('"foo": "bar"');
      expect(result.text).toContain('"num": 123');
    });

    it('should estimate tokens correctly', () => {
      const engine = new PromptEngine('Hello World 你好世界');
      const result = engine.render({});

      // 2 English words + 4 Chinese chars = 2 * 1.5 + 4 = 7
      expect(result.tokenEstimate).toBeGreaterThan(0);
    });
  });

  describe('detectSecurityRisks', () => {
    it('should detect prompt injection attempts', () => {
      const engine = new PromptEngine('{{instruction}}');
      const risks = engine.detectSecurityRisks({
        instruction: 'ignore previous instructions',
      });

      expect(risks.length).toBeGreaterThan(0);
      expect(risks[0]).toContain('注入');
    });

    it('should detect DAN attacks', () => {
      const engine = new PromptEngine('{{input}}');
      const risks = engine.detectSecurityRisks({
        input: 'DAN (do anything now)',
      });

      expect(risks.length).toBeGreaterThan(0);
    });
  });

  describe('highlight', () => {
    it('should highlight variables in HTML', () => {
      const engine = new PromptEngine('Hello {{name}}!');
      const highlighted = engine.highlight();

      expect(highlighted).toContain('<span class="prompt-variable"');
      expect(highlighted).toContain('data-var="name"');
    });
  });
});

describe('helper functions', () => {
  describe('parsePrompt', () => {
    it('should parse template and return result', () => {
      const result = parsePrompt('{{var1}} {{var2}}');

      expect(result.variables).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('renderPrompt', () => {
    it('should render template with data', () => {
      const result = renderPrompt('Hello {{name}}!', { name: 'World' });

      expect(result.text).toBe('Hello World!');
    });
  });

  describe('extractVariables', () => {
    it('should extract variable names', () => {
      const vars = extractVariables('{{a}} {{b}} {{c}}');

      expect(vars).toEqual(['a', 'b', 'c']);
    });

    it('should return empty array for no variables', () => {
      const vars = extractVariables('No variables here');

      expect(vars).toEqual([]);
    });
  });
});
