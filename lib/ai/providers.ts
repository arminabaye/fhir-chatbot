import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { groq } from '@ai-sdk/groq';
import { xai } from '@ai-sdk/xai';
import { isTestEnvironment } from '../constants';
import { patientProvider } from './patient-provider';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
    : customProvider({
      languageModels: {
        'chat-model':       patientProvider('patient-model', {sessionId: '1234'}), // TODO: fetch session id from launch
        'chat-model-reasoning':
                             patientProvider('patient-model', {sessionId: '1234'}),
        'title-model':      patientProvider('patient-model', {sessionId: '1234'}),
        'artifact-model':   patientProvider('patient-model', {sessionId: '1234'}),
      },
    });
