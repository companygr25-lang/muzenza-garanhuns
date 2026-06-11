/**
 * Utility to generate a static PIX BRCode payload
 */
/**
 * Utility to generate a static PIX BRCode payload
 */
export function sanitizePixKey(key: string): string {
  const trimmed = key.trim();
  
  // 1. Check if email
  if (trimmed.includes('@')) {
    return trimmed.replace(/[^a-zA-Z0-9@.+\-_]/g, '');
  }

  // Generate a digits-only version to check for CPF/CNPJ/Phone
  const digitsOnly = trimmed.replace(/\D/g, '');

  // 2. Check if CPF (11 digits)
  if (digitsOnly.length === 11) {
    return digitsOnly;
  }

  // 3. Check if CNPJ (14 digits)
  if (digitsOnly.length === 14) {
    return digitsOnly;
  }

  // 4. Check if it is a UUID / Random Key (usually 36 characters with hyphens)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(trimmed)) {
    return trimmed;
  }

  // 5. Check if phone number
  if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
    if (digitsOnly.length === 11 && !digitsOnly.startsWith('9')) {
      return `+55${digitsOnly}`;
    }
    if (digitsOnly.startsWith('55') && digitsOnly.length >= 12) {
      return `+${digitsOnly}`;
    }
    if (!digitsOnly.startsWith('55') && (digitsOnly.length === 10 || digitsOnly.length === 11)) {
      return `+55${digitsOnly}`;
    }
  }

  // Fallback: default sanitization keeping essential PIX characters
  return trimmed.replace(/[^a-zA-Z0-9@.+\-_]/g, '');
}

export function generatePixPayload(key: string, name: string, city: string = 'GARANHUNS', amount?: number): string {
  const cleanKey = sanitizePixKey(key);
  const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().slice(0, 25);
  const cleanCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().slice(0, 15);

  function formatField(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return id + len + value;
  }

  // Merchant Account Info
  const gui = "0014br.gov.bcb.pix";
  const keyField = formatField("01", cleanKey);
  const merchantAccountInfo = formatField("26", gui + keyField);

  let payload = "000201";
  payload += merchantAccountInfo;
  payload += "52040000"; // Merchant Category Code
  payload += "5303986";  // Currency (BRL)
  
  if (amount && amount > 0) {
    payload += formatField("54", amount.toFixed(2));
  }
  
  payload += "5802BR";   // Country Code
  payload += formatField("59", cleanName || "MUZENZA");
  payload += formatField("60", cleanCity);
  
  // Dynamic safe alphanumeric TxID (many banks reject ***)
  const txidField = formatField("05", "MUZENZA");
  payload += formatField("62", txidField);
  
  payload += "6304"; // CRC16 indicator

  // Simple CRC16 CCITT
  function crc16(data: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  return payload + crc16(payload);
}
