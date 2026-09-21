import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') // e.g., 'whatsapp:+14155238886'

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

    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Ignored: Not an INSERT' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let customerPhone = ''
    let messageBody = ''

    // 1. Handle Course / Retreat Registrations
    if (payload.table === 'course_registrations') {
      const record = payload.record
      customerPhone = record.customer_whatsapp
      
      messageBody = `Your appointment is coming up on ${new Date(record.requested_date).toLocaleDateString('pt-BR')} at The Tropical Bakery`
    } 
    // 2. Handle Orders (e.g. Caixa de Degustação)
    else if (payload.table === 'orders') {
      const record = payload.record
      customerPhone = record.customer_whatsapp
      
      messageBody = `Your order ${record.id || 'Nova Encomenda'} is confirmed.`
    } else {
      return new Response(JSON.stringify({ message: 'Ignored: Table not supported' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!customerPhone) {
      return new Response(JSON.stringify({ error: 'No customer phone provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const to = formatPhoneNumber(customerPhone)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const data = new URLSearchParams()
    data.append('To', to)
    data.append('From', TWILIO_PHONE_NUMBER)
    data.append('Body', messageBody)

    console.log(`Sending message to ${to}...`)

    // Encode credentials for Basic Auth
    const authHeader = `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data.toString(),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Twilio Error:', result)
      throw new Error(`Twilio Error: ${result.message}`)
    }

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
