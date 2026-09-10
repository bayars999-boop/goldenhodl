import { randomInt } from 'crypto';

export type OtpChannel = 'email' | 'sms';

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

// Resend (https://resend.com) transactional email API.
async function sendOtpEmail(to: string, code: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_ADDRESS;
  if (!apiKey || !fromAddress) return { success: false, error: 'Email OTP provider is not configured (RESEND_API_KEY/RESEND_FROM_ADDRESS missing).' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject: 'Your GoldMaster verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return { success: false, error: `Resend API responded with ${response.status}: ${detail}` };
  }
  return { success: true };
}

// Twilio (https://www.twilio.com) programmable SMS API.
async function sendOtpSms(to: string, code: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) return { success: false, error: 'SMS OTP provider is not configured (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER missing).' };

  const body = new URLSearchParams({ To: to, From: fromNumber, Body: `Your GoldMaster verification code is ${code}. It expires in 10 minutes.` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return { success: false, error: `Twilio API responded with ${response.status}: ${detail}` };
  }
  return { success: true };
}

export async function sendOtpCode(channel: OtpChannel, contact: string, code: string): Promise<{ success: boolean; error?: string }> {
  return channel === 'email' ? sendOtpEmail(contact, code) : sendOtpSms(contact, code);
}
