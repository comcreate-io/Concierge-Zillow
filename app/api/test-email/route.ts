import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend'

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured in .env' },
        { status: 500 }
      )
    }

    const testEmail = process.env.CONTACT_EMAIL || 'brody@cadizlluis.com'

    const result = await sendEmail({
      to: testEmail,
      subject: 'Resend Test Email - Cadiz & Lluis',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #000; }
              .container { max-width: 600px; margin: 0 auto; background: #0a0a0a; }
              .header { background: linear-gradient(135deg, #000 0%, #0a0a0a 100%); color: white; padding: 50px 40px; text-align: center; border-bottom: 1px solid #1f1f1f; }
              .logo { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #fff; text-transform: uppercase; }
              .tagline { font-size: 13px; letter-spacing: 5px; color: #d9d9d9; text-transform: uppercase; font-weight: 600; margin-top: 8px; }
              .content { padding: 45px 40px; color: #fff; }
              .badge { display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #fff; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 2px; margin-top: 20px; text-transform: uppercase; }
              .footer { background: #000; padding: 30px 40px; text-align: center; border-top: 1px solid #1f1f1f; }
              .footer-text { font-size: 13px; color: #b3b3b3; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">CADIZ & LLUIS</div>
                <div class="tagline">Luxury Living</div>
                <div class="badge">Email Service Active</div>
              </div>
              <div class="content">
                <h2 style="color: #fff; margin-top: 0;">Resend Integration Test</h2>
                <p>This is a test email confirming that the Resend email service is properly configured and working.</p>
                <p style="color: #b3b3b3;">Sent at: ${new Date().toLocaleString()}</p>
              </div>
              <div class="footer">
                <p class="footer-text">Cadiz & Lluis - Luxury Living</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Resend Integration Test\n\nThis is a test email confirming that the Resend email service is properly configured and working.\n\nSent at: ${new Date().toLocaleString()}`,
    })

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      data: result,
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
