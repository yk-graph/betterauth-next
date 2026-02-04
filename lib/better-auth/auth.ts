import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'

import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/services'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'mysql',
  }),

  emailAndPassword: {
    enabled: true, // メール/パスワード認証を有効化
    requireEmailVerification: true, // ユーザーはログインする前に電子メールを検証する必要があります。また、ユーザーがサインインしようとするたびに、sendVerificationEmail が呼び出されます。
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendVerificationEmail({
        to: user.email,
        verificationUrl: url,
        userName: user.name || user.email,
      })
    },
  },

  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // 同じメールアドレスで複数の認証方法を許可（メール/パスワード + Google など）
  account: {
    accountLinking: {
      enabled: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7日間
    updateAge: 60 * 60 * 24, // 1日ごとに更新
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // キャッシュ(JWT)の有効期間（60分）
      strategy: 'jwt', // JWT形式でCookieに保存
    },
  },

  plugins: [nextCookies()],
})
