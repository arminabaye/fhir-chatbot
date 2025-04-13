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
    console.log('did sign in, now going to do launch');

    const patientId = EMAIL_TO_PATIENT_ID_MAPPING[validatedData.email] ?? "";

    const launchRes = await postLaunch({patientId: patientId, sessionId: ""});

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

    const patientId = EMAIL_TO_PATIENT_ID_MAPPING[validatedData.email] ?? "";
    const launchRes = await postLaunch({patientId: patientId, sessionId: ""});

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
