import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.PUSH_CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  const intervalMs = settings.notifyIntervalMinutes * 60 * 1000;
  const now = new Date();
  const due =
    !settings.lastNotifiedAt ||
    now.getTime() - settings.lastNotifiedAt.getTime() >= intervalMs;

  if (!due) {
    return NextResponse.json({ sent: false, reason: 'not due yet' });
  }

  const subscriptions = await prisma.pushSubscription.findMany();
  const payload = JSON.stringify({
    title: 'Systems',
    body: 'Time to check in on your systems.',
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent += 1;
    } catch (err) {
      // 404/410 means the subscription is dead (uninstalled, expired) — remove it.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      } else {
        console.error('Push send failed', err);
      }
    }
  }

  await prisma.settings.update({
    where: { id: 1 },
    data: { lastNotifiedAt: now },
  });

  return NextResponse.json({ sent: true, count: sent });
}
