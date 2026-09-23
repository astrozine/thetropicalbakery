import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') // e.g., 'whatsapp:+14155238886'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: any
  old_record: any
}

// Ensure the number is formatted correctly for WhatsApp
const formatPhoneNumber = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  return `whatsapp:+${cleaned}`
}

async function sendTwilioMessage(to: string, body: string) {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const data = new URLSearchParams()
  data.append('To', formatPhoneNumber(to))
  data.append('From', TWILIO_PHONE_NUMBER!)
  data.append('Body', body)

  const authHeader = `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data.toString(),
  })
  
  if (!response.ok) {
    const result = await response.json()
    console.error('Twilio Error:', result)
    throw new Error(`Twilio Error: ${result.message}`)
  }
  return await response.json()
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2))

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Missing Twilio credentials in environment variables.')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (payload.type !== 'INSERT' && payload.type !== 'UPDATE') {
      return new Response(JSON.stringify({ message: 'Ignored: Not an INSERT/UPDATE' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 1. Handle Tasting Boxes (Notify Waitlist)
    if (payload.table === 'tasting_boxes' && payload.record.is_active === true) {
      // Check if it just became active (for UPDATE) or is active on INSERT
      const wasActive = payload.old_record?.is_active === true;
      if (wasActive) {
        return new Response(JSON.stringify({ message: 'Box was already active, ignoring.' }), { status: 200 })
      }

      console.log('New active box detected! Fetching waitlist...')
      const { data: waitlist, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('notified', false)

      if (error) throw error;
      
      if (!waitlist || waitlist.length === 0) {
        return new Response(JSON.stringify({ message: 'No one on waitlist to notify.' }), { status: 200 })
      }

      const boxTitle = payload.record.title;
      let notifiedCount = 0;
      
      for (const entry of waitlist) {
        try {
          const message = `Olá ${entry.name}! 🎉 O novo lote da Tropical Bakery ("${boxTitle}") acabou de ficar disponível! Corra no site antes que esgote: https://thetropicalbakery.com/caixas`;
          await sendTwilioMessage(entry.whatsapp, message);
          
          // Mark as notified
          await supabase.from('waitlist').update({ notified: true }).eq('id', entry.id);
          notifiedCount++;
        } catch (err) {
          console.error(`Failed to notify ${entry.whatsapp}`, err);
        }
      }
      
      return new Response(JSON.stringify({ success: true, notifiedCount }), { status: 200 })
    }

    let customerPhone = ''
    let messageBody = ''

    // 2. Handle Course / Retreat Registrations
    if (payload.table === 'course_registrations' && payload.type === 'INSERT') {
      const record = payload.record
      customerPhone = record.customer_whatsapp
      messageBody = `Your appointment is coming up on ${new Date(record.requested_date).toLocaleDateString('pt-BR')} at The Tropical Bakery`
    } 
    // 3. Handle Orders
    else if (payload.table === 'orders' && payload.type === 'INSERT') {
      const record = payload.record
      customerPhone = record.customer_whatsapp
      messageBody = `Your order ${record.id || 'Nova Encomenda'} is confirmed.`
    } else {
      return new Response(JSON.stringify({ message: 'Ignored: Table or event not supported' }), { status: 200 })
    }

    if (!customerPhone) {
      return new Response(JSON.stringify({ error: 'No customer phone provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const to = formatPhoneNumber(customerPhone)
    const result = await sendTwilioMessage(to, messageBody)

    console.log('Message sent successfully!', result.sid)

    return new Response(JSON.stringify({ success: true, sid: result.sid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Error processing webhook:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
