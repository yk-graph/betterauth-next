'use server'

import { authSession } from '@/lib/better-auth/server'
import { prisma } from '@/lib/prisma'

export async function updateProfile() {
  const session = await authSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      image: true,
      twoFactorEnabled: true,
    },
  })

  return user
}
