/**
 * NextAuth.js 設定
 * X (Twitter) OAuth 2.0 認証の設定
 */

import NextAuth, { type NextAuthConfig } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma/client';
import { encrypt, decrypt } from '@/lib/crypto';

/**
 * X OAuth トークンをリフレッシュ
 */
async function refreshAccessToken(token: Record<string, any>) {
  try {
    const url = 'https://api.twitter.com/2/oauth2/token';
    const clientId = process.env.TWITTER_CLIENT_ID!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

/**
 * NextAuth.js 設定
 */
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      authorization: {
        url: 'https://twitter.com/i/oauth2/authorize',
        params: {
          scope: 'tweet.read tweet.write users.read follows.read offline.access',
        },
      },
    } as any),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    /**
     * JWT コールバック
     * トークン作成・更新時に呼ばれる
     */
    async jwt({ token, account, user, profile }: any) {
      // 初回サインイン時
      if (account && user) {
        // X アカウント情報を取得
        const twitterId = (profile as any)?.data?.id || account.providerAccountId;
        const username = (profile as any)?.data?.username || '';

        // アクセストークンとリフレッシュトークンを暗号化
        const encryptedAccessToken = encrypt(account.access_token!);
        const encryptedRefreshToken = account.refresh_token
          ? encrypt(account.refresh_token)
          : null;

        // XAccount レコードを作成または更新
        await prisma.xAccount.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            twitterId,
            username,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
          update: {
            twitterId,
            username,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
        });

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 2 * 60 * 60 * 1000, // デフォルト2時間
          userId: user.id,
          twitterId,
          username,
        };
      }

      // トークンがまだ有効な場合はそのまま返す
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // トークンが期限切れの場合はリフレッシュ
      console.log('Access token expired, refreshing...');
      return refreshAccessToken(token);
    },

    /**
     * セッション コールバック
     * クライアントにセッション情報を返す前に呼ばれる
     */
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.twitterId = token.twitterId as string;
        session.user.username = token.username as string;
        session.error = token.error as string | undefined;
      }

      return session;
    },

    /**
     * サインイン コールバック
     * サインインを許可するかどうかを判定
     */
    async signIn({ account, profile }: any) {
      if (account?.provider === 'twitter') {
        // 必要に応じて追加の検証を実行
        return true;
      }
      return false;
    },
  },

  events: {
    /**
     * サインイン イベント
     */
    async signIn({ user, account, profile, isNewUser }: any) {
      console.log('User signed in:', { userId: user.id, isNewUser });

      // 新規ユーザーの場合、UserProfileを作成
      if (isNewUser && user.id) {
        await prisma.userProfile.create({
          data: {
            userId: user.id,
            tone: 'PROFESSIONAL',
          },
        });
      }
    },

    /**
     * サインアウト イベント
     */
    async signOut({ token }: any) {
      console.log('User signed out:', { userId: token?.userId });
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

/**
 * NextAuth インスタンス
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * ユーザーの暗号化されたトークンを復号化して取得
 */
export async function getDecryptedTokens(userId: string) {
  const xAccount = await prisma.xAccount.findUnique({
    where: { userId },
    select: {
      accessToken: true,
      refreshToken: true,
      tokenExpiry: true,
    },
  });

  if (!xAccount) {
    throw new Error('X account not found');
  }

  return {
    accessToken: decrypt(xAccount.accessToken),
    refreshToken: xAccount.refreshToken ? decrypt(xAccount.refreshToken) : null,
    tokenExpiry: xAccount.tokenExpiry,
  };
}
