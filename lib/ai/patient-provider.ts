import { withoutTrailingSlash } from '@ai-sdk/provider-utils';
import { CustomChatLanguageModel, CustomChatSettings } from './custom-chat-language-model';
import type { ProviderConfig } from './custom-chat-language-model';

export type CustomChatModelId = 'patient-model';

export interface CustomProvider {
  (modelId: CustomChatModelId, settings: CustomChatSettings): CustomChatLanguageModel;
  chat(modelId: CustomChatModelId, settings: CustomChatSettings): CustomChatLanguageModel;
}

export interface CustomProviderSettings {
  baseURL?: string;
  headers?: Record<string, string>;
}

export function createCustomProvider(
  options: CustomProviderSettings = {}
): CustomProvider {
  const createModel = (
    modelId: CustomChatModelId,
    settings: CustomChatSettings
  ) =>
    new CustomChatLanguageModel(modelId, settings, {
      provider: 'patient-ai-provider',
      baseURL: withoutTrailingSlash(options.baseURL) ?? 'http://52.23.217.141',
      headers: () => options.headers ?? {},
      fetch: fetch,
    } as ProviderConfig);

  const provider = (modelId: CustomChatModelId, settings: CustomChatSettings) =>
    createModel(modelId, settings);
  provider.chat = createModel;
  return provider;
}

export const patientProvider = createCustomProvider({
    baseURL: "http://52.23.217.141",
    headers: { patientId: "example" }, // TODO get this from the user
  });

