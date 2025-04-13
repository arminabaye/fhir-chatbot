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

export function postLaunch({ patientId, sessionId }: { patientId: string; sessionId: string }) {
  console.log('Firing /launch in background...');

  fetch('http://52.23.217.141/launch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      patientId,
    },
    body: JSON.stringify({
      metadata: { sessionId },
      userContext: {},
    }),
    // `keepalive` helps if the page is unloading, but is optional
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) {
        console.error('Launch failed:', res.status);
      } else {
        console.log('Launch started');
      }
    })
    .catch((err) => {
      console.error('Launch error:', err);
    });
}