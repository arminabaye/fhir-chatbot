import {
  createCustomProvider,
  generateId,
  withoutTrailingSlash,
} from '@ai-sdk/provider-utils';
import type { CustomChatSettings } from '@ai-sdk/provider';

export const patientAI = createCustomProvider<CustomChatSettings>({
  baseURL: withoutTrailingSlash("http://52.23.217.141"),
  headers: () => ({
    patientId: document.cookie
      .split('; ')
      .find((c) => c.startsWith('patientId='))
      ?.split('=')[1] ?? 'example', // default to example patient for now
  }),
  generateId,
});

export function patientProvider(
  modelId: 'patient-model',
  settings?: CustomChatSettings
) {
  return patientAI(modelId, settings);
}