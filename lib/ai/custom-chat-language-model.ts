import {
    LanguageModelV1,
    LanguageModelV1CallOptions,
    LanguageModelV1StreamPart,
    LanguageModelV1FinishReason,
    LanguageModelV1TextPart,
    LanguageModelV1ImagePart,
    LanguageModelV1FilePart,
  } from '@ai-sdk/provider';
  import {
    combineHeaders,
    postJsonToApi,
    createJsonResponseHandler,
  } from '@ai-sdk/provider-utils';
  import { z } from 'zod';
  
  const chatResponseSchema = z.object({
    metadata: z.record(z.any()),
    payload: z.object({
      message: z.string(),
    }),
    suggestedQueries: z.array(z.string()).optional(),
  });
  type ChatResponse = z.infer<typeof chatResponseSchema>;
  
  export interface ProviderConfig {
    provider: string;
    baseURL: string;
    headers: () => Record<string, string>;
    fetch?: typeof fetch;
  }
  
  export interface CustomChatSettings {
    sessionId: string;
    patientId?: string;
  }

  function isTextPart(
    part: LanguageModelV1TextPart | LanguageModelV1ImagePart | LanguageModelV1FilePart
  ): part is LanguageModelV1TextPart {
    return part.type === 'text';
  }
  
  export class CustomChatLanguageModel implements LanguageModelV1 {
    readonly specificationVersion = 'v1';
    readonly defaultObjectGenerationMode = 'json';
    readonly provider: string;
    readonly modelId: string;
    readonly settings: CustomChatSettings;
    private readonly config: ProviderConfig;
  
    constructor(
      modelId: string,
      settings: CustomChatSettings,
      config: ProviderConfig
    ) {
      this.modelId = modelId;
      this.settings = settings;
      this.config = config;
      this.provider = config.provider;
    }
    
  
    async doGenerate(
      options: LanguageModelV1CallOptions
    ): Promise<{
      text?: string;
      finishReason: LanguageModelV1FinishReason;
      usage: { promptTokens: number; completionTokens: number };
      rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
      rawResponse?: { headers?: Record<string, string>; body?: unknown };
    }> {
      console.dir(options.prompt, { depth: null });
      const body = {
        metadata: { sessionId: this.settings.sessionId },
        userContext: {},
        payload: options.prompt
        .filter(m => m.role === 'user')
        .map(m => {
          // if content is already a string, just return it
          if (typeof m.content === 'string') {
            return m.content;
          }

          if (Array.isArray(m.content)) {
            return m.content
              .filter(isTextPart)
              .map(part => part.text) 
              .join('');
          }
          return JSON.stringify(m.content);
        })
        .join('\n'),
      };
      console.log('Making request to /query');
      const headers = combineHeaders(this.config.headers(), options.headers);
      console.log('Headers');
      console.log(headers);
      console.log('Body');
      console.dir(body, { depth: null });
  
      const { responseHeaders, value: response, rawValue } =
        await postJsonToApi({
          url: `${this.config.baseURL}/query`,
          headers: headers,
          body,
          successfulResponseHandler: createJsonResponseHandler(chatResponseSchema),
          failedResponseHandler: (res) => {
            throw new Error(`Upstream error: ${res.response.status}`);
          },
          fetch: this.config.fetch,
          abortSignal: options.abortSignal,
        });
  
      console.log('🟢 Raw response from backend:');
      console.dir(response, { depth: null });
      return {
        text: response.payload.message,
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: {
          rawPrompt: options.prompt,
          rawSettings: (({ prompt, ...rest }) => rest)(options) as Record<string, unknown>,
        },
        rawResponse: { headers: responseHeaders, body: rawValue },
      };
    }
  
    async doStream(
      options: LanguageModelV1CallOptions
    ): Promise<{
      stream: ReadableStream<LanguageModelV1StreamPart>;
      rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
    }> {
      const result = await this.doGenerate(options);
      const { text, finishReason, usage } = result;
  
      return {
        rawCall: result.rawCall,
        stream: new ReadableStream<LanguageModelV1StreamPart>({
          start(controller) {
            // 1) metadata
            controller.enqueue({ type: 'response-metadata' });
            // 2) text chunk
            if (text) {
              controller.enqueue({ type: 'text-delta', textDelta: text });
            }
            // 3) finish
            controller.enqueue({ type: 'finish', finishReason, usage });
            controller.close();
          },
        }),
      };
    }
  }
  