import {
  ChatLanguageModel,
  ProviderOptions,
  StreamingTextResponse,
} from '@ai-sdk/provider';
import type { CoreMessage, Streamable, ApiResponse } from '@ai-sdk/provider';

export class CustomChatLanguageModel extends ChatLanguageModel {
  specificationVersion = 'v1';
  provider = 'patient-ai-provider';
  modelId: string;
  defaultObjectGenerationMode = 'json';

  constructor(
    modelId: string,
    settings: any,
    options: ProviderOptions
  ) {
    super(modelId, settings, options);
    this.modelId = modelId;
  }

  async doGenerate(
    messages: CoreMessage[],
    abortSignal: AbortSignal
  ) {
    const userText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');

    const res = await fetch(
      `${this.options.baseURL}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers(),
        },
        body: JSON.stringify({
          metadata: { sessionId: this.settings.sessionId },
          userContext: {},
          payload: userText,
        }),
        signal: abortSignal,
      }
    );

    const data: ApiResponse = await res.json();
    return {
      text: data.payload.message,
      parts: [{ type: 'text', text: data.payload.message }],
      metadata: data.metadata,
    };
  }

  doStream(
    messages: CoreMessage[],
    abortSignal: AbortSignal
  ): Streamable {
    const stream = fetch(
      `${this.options.baseURL}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers(),
        },
        body: JSON.stringify({
          metadata: { sessionId: this.settings.sessionId },
          userContext: {},
          payload: messages
            .filter((m) => m.role === 'user')
            .map((m) => m.content)
            .join('\n'),
        }),
        signal: abortSignal,
      }
    ).then((r) => r.body!);

    return new StreamingTextResponse(stream);
  }
}