import { QrCodePix } from 'qrcode-pix';

export interface PixData {
  value: number;
  transactionId: string;
}

export async function generatePixData({ value, transactionId }: PixData) {
  // CPF registered as a Pix key with the receiving bank account.
  const pixKey = "23968541863";
  
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
