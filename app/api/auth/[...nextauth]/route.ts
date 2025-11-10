/**
 * NextAuth.js API Route Handler
 * すべての認証リクエストを処理
 */

import { handlers } from '@/lib/auth/config';

export const { GET, POST } = handlers;
