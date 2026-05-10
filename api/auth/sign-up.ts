import { z } from 'zod';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE
} from '../../src/shared/authPolicy';
import {
  getAuthErrorStatus,
  normalizeAuthErrorMessage
} from '../_lib/authErrors';
import {
  handleApiError,
  handleCorsPreflight,
  parseRequestBody,
  requireMethod,
  sendJson
} from '../_lib/http';
import {
  createSupabaseAdminClient,
  createSupabaseServerClient
} from '../_lib/supabase';
import { getConfirmEmailRedirectUrl } from '../_lib/url';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const EMAIL_EXISTS_MESSAGE =
  'このメールアドレスはすでに登録されています。ログイン画面からお試しください。';
const USER_LOOKUP_PAGE_SIZE = 1000;
const USER_LOOKUP_MAX_PAGES = 50;

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE)
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hasExistingAuthUser = async (email: string) => {
  const supabase = createSupabaseAdminClient();
  const targetEmail = normalizeEmail(email);

  for (let page = 1; page <= USER_LOOKUP_MAX_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: USER_LOOKUP_PAGE_SIZE
    });

    if (error) {
      throw error;
    }

    const users = data.users ?? [];

    if (
      users.some((user) => normalizeEmail(user.email ?? '') === targetEmail)
    ) {
      return true;
    }

    if (users.length < USER_LOOKUP_PAGE_SIZE) {
      return false;
    }
  }

  throw new Error('ユーザー情報の確認に失敗しました。');
};

const hasObfuscatedDuplicateUser = (data: {
  user?: { identities?: unknown[] | null } | null;
}) =>
  Boolean(
    data.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
  );

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (handleCorsPreflight(req, res)) {
      return;
    }

    requireMethod(req.method, ['POST']);
    const body = bodySchema.parse(parseRequestBody(req.body));

    if (await hasExistingAuthUser(body.email)) {
      sendJson(res, 409, { error: EMAIL_EXISTS_MESSAGE });
      return;
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      ...body,
      options: {
        emailRedirectTo: getConfirmEmailRedirectUrl()
      }
    });

    if (error) {
      const message = normalizeAuthErrorMessage(error.message);
      sendJson(res, getAuthErrorStatus(error.message), { error: message });
      return;
    }

    if (hasObfuscatedDuplicateUser(data)) {
      sendJson(res, 409, { error: EMAIL_EXISTS_MESSAGE });
      return;
    }

    sendJson(res, 200, {
      user: null,
      message:
        '確認メールを送信しました。メール内のリンクから認証を完了してください。'
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
