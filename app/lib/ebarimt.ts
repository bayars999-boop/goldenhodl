// Mongolian VAT receipt (e-Barimt) issuance. Lemon Squeezy is an international merchant of record and
// does not integrate with the Mongolian General Department of Taxation, so a receipt must be requested
// from a configured e-Barimt gateway (POS terminal software or third-party aggregator) after each order.
export type EbarimtReceiptInput = {
  orderId: string;
  customerEmail: string | null;
  totalAmount: number;
  taxAmount: number;
  currency: string;
  issuedAt: string;
};

export type EbarimtReceiptResult = { success: boolean; receiptId?: string; error?: string };

export async function issueEbarimtReceipt(input: EbarimtReceiptInput): Promise<EbarimtReceiptResult> {
  const apiUrl = process.env.EBARIMT_API_URL;
  const apiKey = process.env.EBARIMT_API_KEY;
  if (!apiUrl || !apiKey) {
    return { success: false, error: 'E-Barimt integration is not configured (EBARIMT_API_URL/EBARIMT_API_KEY missing).' };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: input.orderId,
        customerEmail: input.customerEmail,
        totalAmount: input.totalAmount,
        taxAmount: input.taxAmount,
        currency: input.currency,
        issuedAt: input.issuedAt,
      }),
    });
    const result = await response.json().catch(() => ({})) as { receiptId?: string; error?: string };
    if (!response.ok) return { success: false, error: result.error || `E-Barimt gateway responded with ${response.status}.` };
    return { success: true, receiptId: result.receiptId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'E-Barimt request failed.' };
  }
}
