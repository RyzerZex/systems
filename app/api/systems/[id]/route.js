import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
  const body = await request.json();

  const entry = await prisma.systemEntry.update({
    where: { id: params.id },
    data: { done: Boolean(body.done) },
  });

  return NextResponse.json(entry);
}

export async function DELETE(request, { params }) {
  await prisma.systemEntry.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
