/**
 * Utility to generate a static PIX BRCode payload
 */
export function generatePixPayload(key: string, name: string, city: string = 'GARANHUNS', amount?: number): string {
  const cleanKey = key.replace(/[^a-zA-Z0-9@.+]/g, '');
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
  payload += "62070503***"; // Additional Data (TxID as ***)
  payload += "6304"; // CRC16 indicator

  // Simple CRC16 CCITT
  function crc16(data: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  return payload + crc16(payload);
}
