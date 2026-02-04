import * as z from 'zod'

// 共通フィールドバリデーション
export const emailField = z.email('有効なメールアドレスを入力してください')

export const passwordField = z
  .string()
  .min(1, 'パスワードを入力してください')
  .min(8, 'パスワードは8文字以上で入力してください')

export const nameField = z.string().min(1, '名前を入力してください').min(2, '名前は2文字以上で入力してください')
