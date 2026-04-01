import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_SECTION_PREFERENCES, normalizeSectionPreferences } from '@/lib/sectionPreferences';

const getUserIdFromCookie = async (req: NextRequest) => {
  const entryId = req.cookies.get('fpl_entry_id')?.value;
  if (!entryId || !/^\d+$/.test(entryId)) return null;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('fpl_entry_id', parseInt(entryId, 10))
    .single();

  return user?.id ?? null;
};

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('visible_sections')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    const preferences = normalizeSectionPreferences(data?.visible_sections ?? DEFAULT_SECTION_PREFERENCES);
    return NextResponse.json({ preferences });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookie(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const preferences = normalizeSectionPreferences(body?.preferences);

    const { error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({ user_id: userId, visible_sections: preferences }, { onConflict: 'user_id' });

    if (error) {
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true, preferences });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
