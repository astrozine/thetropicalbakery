import { QrCodePix } from 'qrcode-pix';

export interface PixData {
  value: number;
  transactionId: string;
}

export async function generatePixData({ value, transactionId }: PixData) {
  // Using a placeholder PIX Key until the user specifies one
  const pixKey = "pix@thetropicalbakery.com.br"; // TODO: Update with real key
  
  const qrCodePix = QrCodePix({
      version: '01',
      key: pixKey,
      name: 'The Tropical Bakery',
      city: 'UBATUBA',
      transactionId: transactionId, 
      message: 'Pedido Bakery',
      value: value,
  });

  return {
    payload: qrCodePix.payload(), // The "Copia e Cola" string
    base64: await qrCodePix.base64(), // The QR Code image
  };
}
