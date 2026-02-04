import { SignInForm } from '@/components/sign-in'
import { authIsNotRequired } from '@/lib/better-auth/server'

export default async function SignInPage() {
  await authIsNotRequired()

  return <SignInForm />
}
