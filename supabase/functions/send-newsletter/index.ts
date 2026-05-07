// DEPRECATED — This Edge Function duplicates scripts/send_newsletter.py + GitHub Actions.
// The Python script is the canonical newsletter sender. Do not deploy this function.
// Now uses Brevo API instead of Resend.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendPayload {
  type: 'sunday' | 'daily_plus'
}

interface Subscriber {
  id: string
  email: string
  tier: 'free' | 'plus'
  token: string | null
}

interface Story {
  id: string
  slug: string
  title: string
  dek: string | null
  body: string | null
  hero: string | null
  reading_minutes: number | null
  published_at: string | null
}

// ---------------------------------------------------------------------------
// CORS headers for Supabase Edge Functions
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function env(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

// ---------------------------------------------------------------------------
// Supabase client (service role – full access)
// ---------------------------------------------------------------------------

function getSupabase() {
  const url = env('SUPABASE_URL')
  const serviceKey = env('SUPABASE_SERVICE_KEY')
  return createClient(url, serviceKey)
}

// ---------------------------------------------------------------------------
// Build a beautiful HTML email
// ---------------------------------------------------------------------------

function buildEmailHtml(opts: {
  hero: string
  title: string
  dek: string | null
  slug: string
  readingMinutes: number | null
  baseUrl: string
  unsubscribeUrl: string
  isPlus: boolean
}): string {
  const summary = opts.dek ?? ''
  const readingTime = opts.readingMinutes ? `${opts.readingMinutes} Min. Lesezeit` : ''
  const buttonLabel = opts.isPlus ? 'Zur Plus-Story' : 'Zur Geschichte'

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title} — NurEine</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Outer card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#FAF6EE;border-radius:16px;padding:0;box-shadow:0 2px 12px rgba(26,24,21,0.06);">

              <!-- Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 40px 0 40px;text-align:center;">
                    <span style="font-family:'Fraunces',Georgia,serif;font-size:28px;font-weight:700;color:#C4622D;letter-spacing:-0.02em;">
                      NurEine
                    </span>
                    <p style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#7A756E;margin:4px 0 0 0;text-transform:uppercase;letter-spacing:0.06em;">
                      Gute Nachrichten. Jeden Tag.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 40px 0 40px;">
                    <hr style="border:none;border-top:1px solid #E8E2D8;margin:0;">
                  </td>
                </tr>
              </table>

              <!-- Hero emoji -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px 0 40px;text-align:center;">
                    <span style="font-size:64px;line-height:1;">${opts.hero}</span>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px 40px 0 40px;text-align:center;">
                    <h1 style="font-family:'Fraunces',Georgia,serif;font-size:26px;font-weight:700;color:#1A1815;margin:0;line-height:1.3;letter-spacing:-0.01em;">
                      ${opts.title}
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Summary -->
              ${summary ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 40px 0 40px;text-align:center;">
                    <p style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;color:#4A4640;margin:0;line-height:1.6;">
                      ${summary}
                    </p>
                  </td>
                </tr>
              </table>` : ''}

              <!-- Reading time -->
              ${readingTime ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 40px 0 40px;text-align:center;">
                    <span style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#9A948C;">
                      ${readingTime}
                    </span>
                  </td>
                </tr>
              </table>` : ''}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:28px 40px 0 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:8px;background-color:#C4622D;padding:0;">
                          <a href="${opts.baseUrl}/geschichte/${opts.slug}"
                             target="_blank"
                             style="display:inline-block;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;padding:14px 36px;border-radius:8px;">
                            ${buttonLabel} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Spacer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 40px 0 40px;"></td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDE8DE;border-radius:0 0 16px 16px;">
                <tr>
                  <td style="padding:24px 40px;text-align:center;">
                    <p style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#7A756E;margin:0 0 8px 0;line-height:1.5;">
                      Du erh&auml;ltst diese E-Mail, weil du den NurEine-Newsletter abonniert hast.
                    </p>
                    <p style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#7A756E;margin:0;line-height:1.5;">
                      <a href="${opts.unsubscribeUrl}"
                         target="_blank"
                         style="color:#C4622D;text-decoration:underline;text-underline-offset:2px;">
                        Vom Newsletter abmelden
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Tiny imprint -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:16px 0 0 0;text-align:center;">
              <p style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:#9A948C;margin:0;">
                NurEine &mdash; Gute Nachrichten. Jeden Tag exakt eine.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

// ---------------------------------------------------------------------------
// Send a single email via Brevo
// ---------------------------------------------------------------------------

async function sendViaBrevo(opts: {
  to: string
  subject: string
  html: string
  brevoApiKey: string
  fromEmail: string
  fromName: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': opts.brevoApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: opts.fromName, email: opts.fromEmail },
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      return { success: false, error: `Brevo API error ${response.status}: ${body}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // --- CORS preflight ---------------------------------------------------
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // --- Method check -----------------------------------------------------
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // --- Auth check -------------------------------------------------------
  const authHeader = req.headers.get('Authorization') ?? ''
  let serviceKey: string
  try {
    serviceKey = env('SUPABASE_SERVICE_KEY')
  } catch {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!authHeader.startsWith('Bearer ') || authHeader.replace('Bearer ', '') !== serviceKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // --- Parse body -------------------------------------------------------
  let payload: SendPayload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (payload.type !== 'sunday' && payload.type !== 'daily_plus') {
    return new Response(JSON.stringify({ error: 'Invalid type. Must be "sunday" or "daily_plus".' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // --- Bootstrap --------------------------------------------------------
  const supabase = getSupabase()
  const brevoApiKey = env('BREVO_API_KEY')
  const fromEmail = env('BREVO_FROM_EMAIL')
  const fromName = env('BREVO_FROM_NAME')
  const baseUrl = env('BASE_URL')

  // -----------------------------------------------------------------------
  // 1. Fetch the hero story
  // -----------------------------------------------------------------------
  let storyQuery = supabase
    .from('nureine_stories')
    .select('id, slug, title, dek, body, hero, reading_minutes, published_at')
    .eq('is_hero', true)
    .order('published_at', { ascending: false })
    .limit(1)

  if (payload.type === 'daily_plus') {
    // Only stories published today
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
    storyQuery = storyQuery.gte('published_at', startOfDay).lt('published_at', endOfDay)
  }

  const { data: stories, error: storyError } = await storyQuery

  if (storyError) {
    console.error('Error fetching hero story:', storyError)
    return new Response(JSON.stringify({ error: 'Database query failed', detail: storyError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const story: Story | null = stories && stories.length > 0 ? stories[0] : null

  if (!story) {
    const msg = payload.type === 'daily_plus'
      ? 'No hero story found for today.'
      : 'No hero story found.'
    console.warn(msg)
    // Still log the cron run with 0 stories
    await supabase.from('nureine_cron_runs').insert({
      type: payload.type,
      stories_found: 0,
      stories_inserted: 0,
      ran_at: new Date().toISOString(),
    }).maybeSingle()
    return new Response(JSON.stringify({ message: msg, sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // -----------------------------------------------------------------------
  // 2. Fetch subscribers
  // -----------------------------------------------------------------------
  let subscriberQuery = supabase
    .from('nureine_subscribers')
    .select('id, email, tier, token')
    .eq('confirmed', true)

  if (payload.type === 'sunday') {
    subscriberQuery = subscriberQuery.in('tier', ['free', 'plus'])
  } else {
    subscriberQuery = subscriberQuery.eq('tier', 'plus')
  }

  const { data: subscribers, error: subError } = await subscriberQuery

  if (subError) {
    console.error('Error fetching subscribers:', subError)
    return new Response(JSON.stringify({ error: 'Failed to query subscribers', detail: subError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!subscribers || subscribers.length === 0) {
    const msg = 'No confirmed subscribers found.'
    console.warn(msg)
    await supabase.from('nureine_cron_runs').insert({
      type: payload.type,
      stories_found: 1,
      stories_inserted: 0,
      ran_at: new Date().toISOString(),
    }).maybeSingle()
    return new Response(JSON.stringify({ message: msg, sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // -----------------------------------------------------------------------
  // 3. Send emails
  // -----------------------------------------------------------------------
  const subject = payload.type === 'sunday'
    ? `NurEine Wochenende — ${story.title}`
    : `NurEine Plus — ${story.title}`

  const total = subscribers.length
  let sentCount = 0
  const sendErrors: Array<{ email: string; error: string }> = []
  const sendLogs: Array<{ subscriber_id: string; story_id: string; sent_at: string }> = []

  for (const subscriber of subscribers) {
    const token = subscriber.token ?? subscriber.id
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(token)}&email=${encodeURIComponent(subscriber.email)}`

    const html = buildEmailHtml({
      hero: story.hero ?? '',
      title: story.title,
      dek: story.dek,
      slug: story.slug,
      readingMinutes: story.reading_minutes,
      baseUrl,
      unsubscribeUrl,
      isPlus: payload.type === 'daily_plus',
    })

    const result = await sendViaBrevo({
      to: subscriber.email,
      subject,
      html,
      brevoApiKey,
      fromEmail,
      fromName,
    })

    if (result.success) {
      sentCount++
      sendLogs.push({
        subscriber_id: subscriber.id,
        story_id: story.id,
        sent_at: new Date().toISOString(),
      })
    } else {
      console.error(`Failed to send to ${subscriber.email}: ${result.error}`)
      sendErrors.push({ email: subscriber.email, error: result.error ?? 'Unknown error' })
    }
  }

  // -----------------------------------------------------------------------
  // 4. Log sends
  // -----------------------------------------------------------------------
  if (sendLogs.length > 0) {
    const { error: logError } = await supabase.from('nureine_newsletter_sends').insert(sendLogs)
    if (logError) {
      console.error('Failed to log newsletter sends:', logError.message)
    }
  }

  // -----------------------------------------------------------------------
  // 5. Log cron run
  // -----------------------------------------------------------------------
  const { error: cronError } = await supabase.from('nureine_cron_runs').insert({
    type: payload.type,
    stories_found: 1,
    stories_inserted: sentCount,
    ran_at: new Date().toISOString(),
  })
  if (cronError) {
    console.error('Failed to log cron run:', cronError.message)
  }

  // -----------------------------------------------------------------------
  // 6. Response
  // -----------------------------------------------------------------------
  const responseBody: Record<string, unknown> = {
    message: `Sent ${sentCount} of ${total} newsletter emails.`,
    type: payload.type,
    story: story.slug,
    sent: sentCount,
    total,
  }

  if (sendErrors.length > 0) {
    responseBody.errors = sendErrors
  }

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
