'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { generatePixData } from '@/utils/pix';

import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [pixPayload, setPixPayload] = useState('');
  const [pixQR, setPixQR] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    address: '',
    date: ''
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp || !formData.address) return;
    
    // Generate Pix Code
    const transactionId = `ORD${Date.now()}`.substring(0, 25);
    const { payload, base64 } = await generatePixData({
      value: totalPrice,
      transactionId
    });
    
    setPixPayload(payload);
    setPixQR(base64);
    setStep(2);

    // Save to Supabase 'orders' table
    try {
      await supabase.from('orders').insert([{
        customer_name: formData.name,
        customer_email: formData.email,
        customer_whatsapp: formData.whatsapp.replace(/\D/g, ''),
        delivery_address: formData.address,
        requested_date: formData.date || null,
        total_price: totalPrice,
        pix_transaction_id: transactionId,
        status: 'PENDING'
      }]);
    } catch (err) {
      console.error("Error saving order:", err);
    }
  };

  const copyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (items.length === 0 && step === 1) {
    return (
      <main className="min-h-screen pt-32 pb-16 px-4 flex justify-center bg-[#fdfaf3]">
        <div className="text-center">
          <h1 className="text-3xl text-[#3c2a21] font-bold mb-4">Seu Carrinho está vazio</h1>
          <a href="/menu" className="btn btn-primary">Voltar para o Menu</a>
        </div>
      </main>
    );
  }

  const getNumericPrice = (priceStr: string) => parseFloat(priceStr.replace(/[^\d,]/g, '').replace(',', '.'));

  return (
    <main className="min-h-screen pt-32 pb-16 px-4 bg-[#fdfaf3]">
      <div className="container max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-[#3c2a21] mb-8" style={{ fontFamily: 'var(--font-heading)' }}>
          Finalizar Pedido
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* LEFT: FORM OR PIX */}
          <div>
            {step === 1 ? (
              <form onSubmit={handleCheckout} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#3c2a21] mb-4">Dados de Entrega</h2>
                
                <input required type="text" placeholder="Nome Completo *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg" />
                <input required type="email" placeholder="E-mail *" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-lg" />
                <input required type="text" placeholder="WhatsApp *" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full p-3 border rounded-lg" />
                <input required type="text" placeholder="Endereço Completo *" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 border rounded-lg" />
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-lg" />

                <button type="submit" className="w-full btn btn-primary mt-4 py-4 text-lg">
                  Confirmar e Gerar Pix
                </button>
              </form>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#d4af37] text-center">
                <h2 className="text-2xl font-bold text-[#3c2a21] mb-2">Quase lá!</h2>
                <p className="text-[#594a42] mb-6">Para confirmar a produção do seu pedido, realize o pagamento via Pix.</p>
                
                {/* Desktop QR Code */}
                <div className="hidden md:block mb-6">
                  <img src={pixQR} alt="QR Code Pix" className="mx-auto w-48 h-48 rounded-lg border p-2" />
                  <p className="text-sm text-gray-500 mt-2">Abra o app do seu banco e escaneie o QR Code.</p>
                </div>

                {/* Mobile Copia e Cola */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">Pix Copia e Cola</p>
                  <div className="flex bg-gray-100 rounded-lg p-3 relative overflow-hidden">
                    <span className="truncate text-gray-500 text-sm mr-12">{pixPayload}</span>
                  </div>
                  <button 
                    onClick={copyPix}
                    className="w-full mt-4 bg-[#3c2a21] text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2"
                  >
                    {copied ? '✅ Copiado!' : '📋 Copiar Código Pix'}
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-[#7a6a61]">
                  Seu pedido só começará a ser produzido após a confirmação do pagamento.
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: CART SUMMARY */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-[#3c2a21] mb-6">Resumo do Pedido</h2>
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <p className="font-bold text-[#594a42]">{item.name}</p>
                    <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-[#3c2a21]">R$ {(getNumericPrice(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-xl font-bold text-[#d4af37] pt-4">
              <span>Total:</span>
              <span>R$ {totalPrice.toFixed(2)}</span>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
