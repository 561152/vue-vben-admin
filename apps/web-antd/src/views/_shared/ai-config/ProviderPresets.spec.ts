import { describe, expect, it } from 'vitest';

import { PROVIDER_PRESETS } from './ProviderPresets';

describe('PROVIDER_PRESETS', () => {
  it('has entries for every AiProvider', () => {
    expect(Object.keys(PROVIDER_PRESETS).sort()).toEqual(
      [
        'ANTHROPIC',
        'CUSTOM',
        'DEEPSEEK',
        'MOONSHOT',
        'OLLAMA',
        'ONEAPI',
        'OPENAI',
        'QWEN',
      ].sort(),
    );
  });

  it('every entry has defaultBaseUrl string + valid model entries', () => {
    for (const [provider, preset] of Object.entries(PROVIDER_PRESETS)) {
      expect(preset.defaultBaseUrl, `${provider}.defaultBaseUrl`).toBeTypeOf('string');
      for (const model of preset.models) {
        expect(model.name, `${provider} model name`).toBeTypeOf('string');
        expect(['LLM', 'VISION', 'EMBEDDING']).toContain(model.capability);
      }
    }
  });

  it('every non-CUSTOM provider has at least one model', () => {
    for (const [provider, preset] of Object.entries(PROVIDER_PRESETS)) {
      if (provider === 'CUSTOM') continue;
      expect(preset.models.length, `${provider}.models`).toBeGreaterThan(0);
    }
  });

  it('OPENAI preset includes gpt-4o LLM and text-embedding-3-large EMBEDDING', () => {
    const models = PROVIDER_PRESETS.OPENAI.models;
    expect(models).toContainEqual({ name: 'gpt-4o', capability: 'LLM' });
    expect(models).toContainEqual({
      name: 'text-embedding-3-large',
      capability: 'EMBEDDING',
    });
  });

  it('QWEN preset includes qwen-vl VISION model', () => {
    const models = PROVIDER_PRESETS.QWEN.models;
    expect(models.some((m) => m.capability === 'VISION')).toBe(true);
  });

  it('CUSTOM preset has empty models (user-supplied)', () => {
    expect(PROVIDER_PRESETS.CUSTOM.models).toEqual([]);
  });
});
