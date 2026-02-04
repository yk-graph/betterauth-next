'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/better-auth/client'
import { signUpSchema, type SignUpInput } from '@/lib/zod'

export function SignUpForm() {
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: SignUpInput) => {
    const { error } = await authClient.signUp.email({
      name: '', // Tips: better-authにおいてsignUpメソッドのnameプロパティは必須でありオプショナルにすることは出来ない → 一時的に空文字を渡す
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(error.message ?? 'サインアップに失敗しました')
      return
    }

    toast.success('確認メールを送信しました。メールを確認してください。')
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel>Email</FieldLabel>
                  <Input {...field} type="email" autoComplete="email" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel>Password</FieldLabel>
                  <Input {...field} type="password" autoComplete="new-password" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel>Confirm Password</FieldLabel>
                  <Input {...field} type="password" autoComplete="new-password" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col w-full">
        <Field orientation="horizontal" className="flex w-full items-center justify-between flex-col gap-2">
          <Button type="submit" form="signup-form" className="cursor-pointer w-full">
            {form.formState.isSubmitting ? <Spinner className="size-6" /> : 'Sign up'}
          </Button>

          <p className="text-sm flex items-center gap-1">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-blue-500">
              Sign in
            </Link>
          </p>
        </Field>
      </CardFooter>
    </Card>
  )
}
