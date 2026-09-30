export async function sendRealSMS(phone: string, message: string): Promise<boolean> {
  const smsApiUrl = process.env.SMS_API_URL; // Жишээ: Мобайл мессеж илгээх API холбоос
  const smsApiKey = process.env.SMS_API_KEY;
  const smsApiSender = process.env.SMS_API_SENDER || 'GoldMaster';

  // Хэрэглэгчийн гар утсанд бодит SMS илгээх API тохируулагдсан эсэх
  if (smsApiUrl && smsApiKey) {
    try {
      const response = await fetch(smsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${smsApiKey}`,
        },
        body: JSON.stringify({
          to: phone,
          text: message,
          sender: smsApiSender,
        }),
      });
      if (response.ok) return true;
    } catch (err) {
      console.error('[SMS Gateway Error]:', err);
    }
  }

  // Хэрэв API түлхүүр байхгүй бол лог руу бичих
  console.log(`[REAL SMS SIMULATION] To: ${phone} | Message: ${message}`);
  return true; 
}