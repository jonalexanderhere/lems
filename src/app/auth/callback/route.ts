import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code || (tokenHash && type)) {
    const supabase = await createClient()
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          type: type as 'email' | 'recovery' | 'signup' | 'invite' | 'magiclink',
          token_hash: tokenHash!,
        })
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const classId = typeof user.user_metadata?.class_id === 'string' && user.user_metadata.class_id
          ? user.user_metadata.class_id
          : null
        const yearEnrolled = Number.isFinite(Number(user.user_metadata?.year_enrolled))
          ? Number(user.user_metadata.year_enrolled)
          : null

        await supabase.from("profiles").upsert(
          {
            id: user.id,
            full_name: user.user_metadata?.full_name ?? null,
            username: user.user_metadata?.username ?? null,
            class_id: classId,
            year_enrolled: yearEnrolled,
          },
          { onConflict: "id" }
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
