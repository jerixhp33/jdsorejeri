const WHATSAPP_API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:8000';

export async function sendWhatsApp(phoneNumber: string, message: string) {
  try {
    const cleanPhone = String(phoneNumber).replace(/[^0-9]/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.length === 10) {
      finalPhone = '91' + finalPhone; // Default to India if 10 digits
    }
    
    console.log(`[whatsapp] Sending text to ${finalPhone}`);
    
    const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: finalPhone,
        message: message,
      }),
    });

    if (!res.ok) {
      console.error('[whatsapp] Failed to send', await res.text());
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('[whatsapp] Error:', error);
    return null;
  }
}

export async function sendWhatsAppDocument(phoneNumber: string, fileBuffer: Buffer, filename: string) {
  try {
    const cleanPhone = String(phoneNumber).replace(/[^0-9]/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.length === 10) {
      finalPhone = '91' + finalPhone;
    }
    
    console.log(`[whatsapp] Sending document ${filename} to ${finalPhone}`);
    
    const formData = new FormData();
    formData.append('phone_number', finalPhone);
    formData.append('file', new Blob([fileBuffer]), filename);

    const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/send-document`, {
      method: 'POST',
      body: formData as any,
    });

    if (!res.ok) {
      console.error('[whatsapp] Failed to send document', await res.text());
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('[whatsapp] Error sending document:', error);
    return null;
  }
}

export async function generateAndSendInvoice(phoneNumber: string, invoiceUrl: string) {
  try {
    const cleanPhone = String(phoneNumber).replace(/[^0-9]/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.length === 10) {
      finalPhone = '91' + finalPhone;
    }
    
    console.log(`[whatsapp] Requesting backend to generate and send invoice to ${finalPhone}`);
    
    const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/generate-and-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: finalPhone,
        invoice_url: invoiceUrl,
      }),
    });

    if (!res.ok) {
      console.error('[whatsapp] Failed to generate/send invoice', await res.text());
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('[whatsapp] Error:', error);
    return null;
  }
}
