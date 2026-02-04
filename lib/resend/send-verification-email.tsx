import { Resend } from 'resend'

import { VerificationEmail } from '@/emails'

const resend = new Resend(process.env.RESEND_API_KEY)

type EmailProps = {
  to: string
  verificationUrl: string
  userName: string
}

export const sendVerificationEmail = async ({ to, verificationUrl, userName }: EmailProps) => {
  await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to,
    subject: 'Welcome to betterauth-next',
    react: <VerificationEmail verificationUrl={verificationUrl} userName={userName} />,
  })
}
