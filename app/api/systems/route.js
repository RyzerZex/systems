import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const entries = await prisma.systemEntry.findMany({
    orderBy: { minutes: 'asc' },
  });
  return NextResponse.json(entries);
}

export async function POST(request) {
  const body = await request.json();
  const { task, minutes } = body;

  if (!task || !task.trim() || !minutes) {
    return NextResponse.json(
      { error: 'task and minutes are required' },
      { status: 400 }
    );
  }

  const entry = await prisma.systemEntry.create({
    data: { task: task.trim(), minutes: Number(minutes) },
  });

  return NextResponse.json(entry);
}
