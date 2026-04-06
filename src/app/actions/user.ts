'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateUserCargo(cargo: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Não autorizado');

  await (prisma as any).user.update({
    where: { id: session.user.id },
    data: { cargo }
  });

  revalidatePath('/perfil');
  revalidatePath('/settings');
  return { success: true };
}

export async function changeUserPassword(formData: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Não autorizado');

  const { currentPassword, newPassword, confirmPassword } = formData;

  // Validação de Complexidade (Server-side)
  const isLengthValid = newPassword.length >= 8 && newPassword.length <= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  if (!isLengthValid || !hasUpper || !hasLower || !hasNumber) {
    throw new Error('A nova senha não atende aos requisitos de complexidade (8-12 caracteres, maiúsculas, minúsculas e números)');
  }

  if (newPassword !== confirmPassword) {
    throw new Error('As novas senhas não coincidem');
  }

  const user = await (prisma as any).user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || !user.password) throw new Error('Usuário não encontrado');

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) throw new Error('A senha atual está incorreta');

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await (prisma as any).user.update({
    where: { id: session.user.id },
    data: { password: hashedNewPassword }
  });

  return { success: true };
}

export async function resetUserPassword(userId: string) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN' && (session?.user as any)?.role !== 'NIVEL2') {
     // Apenas usuários com certas permissões podem resetar senhas de outros.
     // Se o projeto usa apenas ADMIN para isso, ajuste conforme necessário.
     throw new Error('Não autorizado');
  }

  const hashedPassword = await bcrypt.hash('123456', 10);

  await (prisma as any).user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  revalidatePath('/users');
  return { success: true };
}
