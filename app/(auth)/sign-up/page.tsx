import { SignUpForm } from '@/components/sign-up'
import { authIsNotRequired } from '@/lib/better-auth/server'

export default async function SignUpPage() {
  await authIsNotRequired()

  return <SignUpForm />
}
