import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const body = await request.json();
  const minutes = Math.max(1, Number(body.notifyIntervalMinutes) || 60);

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: { notifyIntervalMinutes: minutes },
    create: { id: 1, notifyIntervalMinutes: minutes },
  });

  return NextResponse.json(settings);
}
