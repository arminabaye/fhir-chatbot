'use server';

import { z } from 'zod';

import { createUser, getUser } from '@/lib/db/queries';

import { auth, signIn } from './auth';
import getServerSession from 'next-auth';
import { EMAIL_TO_PATIENT_ID_MAPPING } from '@/lib/constants';
import { postLaunch } from '../(chat)/actions';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    const session = await auth();
    if (!session?.user?.id) {
      return { status: 'failed' };
    }
    let patientId = session.user.id;
    if (session.user.email) {
      patientId = EMAIL_TO_PATIENT_ID_MAPPING[session.user.email] ?? patientId;
    }

    const launchRes = await postLaunch({patientId: patientId, sessionId: session.user?.id})

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }
    await createUser(validatedData.email, validatedData.password);
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    const session = await auth();
    if (!session?.user?.id) {
      return { status: 'failed' };
    }
    let patientId = session.user.id;
    if (session.user.email) {
      patientId = EMAIL_TO_PATIENT_ID_MAPPING[session.user.email] ?? patientId;
    }

    const launchRes = await postLaunch({patientId: patientId, sessionId: session.user?.id})

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
