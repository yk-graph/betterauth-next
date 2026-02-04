import * as z from 'zod'

import { emailField, nameField, passwordField } from './fields'

// サインイン用バリデーションスキーマ
export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'パスワードを入力してください'),
})

export type SignInInput = z.infer<typeof signInSchema>

// サインアップ用バリデーションスキーマ
export const signUpSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'パスワード（確認）を入力してください'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export type SignUpInput = z.infer<typeof signUpSchema>
