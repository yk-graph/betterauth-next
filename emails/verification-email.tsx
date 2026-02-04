import { Body, Button, Container, Head, Html, Preview, Section, Tailwind, Text } from '@react-email/components'

interface VerificationEmailProps {
  verificationUrl: string
  userName: string
  appName?: string
}

export const VerificationEmail = ({
  verificationUrl,
  userName,
  appName = 'betterauth-next',
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Tailwind>
      <Body className="bg-white font-Betterauth-next">
        <Preview>Verify your email for {appName}</Preview>
        <Container className="mx-auto py-5 pb-12">
          <Text className="text-[16px] leading-6">Hi {userName},</Text>
          <Text className="text-[16px] leading-6">
            Welcome to Betterauth-next. Thank you for signing up for {appName}. Please confirm your email address by
            clicking the button below.
          </Text>
          <Section className="text-center">
            <Button
              className="bg-[#5F51E8] rounded-[3px] text-white text-[16px] no-underline text-center block p-3"
              href={verificationUrl}
            >
              Verify your email
            </Button>
          </Section>

          <Text className="text-[#8898aa] text-[12px]">
            If you did not create an account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
