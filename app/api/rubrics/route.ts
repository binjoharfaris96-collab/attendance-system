import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getUserByEmail, getTeacherByUserId, listRubrics } from '@/lib/db';

export async function GET() {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const teacher = await getTeacherByUserId(user.id);
  if (!teacher) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const rubrics = await listRubrics(teacher.id);
  return NextResponse.json({ rubrics });
}
