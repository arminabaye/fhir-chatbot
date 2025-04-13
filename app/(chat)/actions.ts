'use server';

import { generateText, Message } from 'ai';
import { cookies } from 'next/headers';

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';
import { isTestEnvironment } from '@/lib/constants';
import { patientProvider } from '@/lib/ai/patient-provider';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
  patientId,
  sessionId,
}: {
  message: Message;
  patientId: string,
  sessionId: string,
}) {
  const model = isTestEnvironment ? myProvider.languageModel('title-model') : patientProvider('patient-model', {sessionId: sessionId, patientId})
  const { text: title } = await generateText({
    model: model,
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function postLaunch({patientId,  sessionId}:{ patientId: string, sessionId: string}) {
  console.log('POSTing to /launch')
  console.log(patientId)

  const controller = new AbortController();
  const timeoutMs = 2 * 60_000;
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const launchRes = await fetch('http://52.23.217.141/launch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        patientId,
      },
      body: JSON.stringify({
        metadata: { sessionId },
        userContext: {},
      }),
      signal: controller.signal,
    });

    console.log('Got response from launch', launchRes.status);

    if (!launchRes.ok) {
      console.error('Launch failed:', await launchRes.text());
    } else {
      console.log('Launch success', await launchRes.json());
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error(`Launch request aborted after ${timeoutMs}ms`);
    } else {
      console.error('Launch request error:', err);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}