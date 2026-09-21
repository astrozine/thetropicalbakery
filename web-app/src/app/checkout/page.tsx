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
      <div className="container max-w-5xl mx-auto">
        
        {/* Progress Steps */}
        <div className="mb-10 flex justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-[#d4af37] text-white' : 'bg-[#3c2a21] text-white'}`}>1</div>
            <span className={`font-semibold ${step === 1 ? 'text-[#d4af37]' : 'text-[#3c2a21]'}`}>Dados</span>
          </div>
          <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full bg-[#d4af37] transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-[#d4af37] text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <span className={`font-semibold ${step === 2 ? 'text-[#d4af37]' : 'text-gray-400'}`}>Pagamento</span>
          </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-8">
          
          {/* LEFT: FORM OR PIX (Takes up more space) */}
          <div className="flex-grow lg:w-2/3">
            {step === 1 ? (
              <form onSubmit={handleCheckout} className="bg-white p-8 rounded-2xl shadow-xl shadow-black/5 border border-gray-100">
                <h2 className="text-2xl font-bold text-[#3c2a21] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Informações de Entrega</h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#594a42] mb-1">Nome Completo</label>
                    <input required type="text" placeholder="Ex: João da Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all outline-none" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#594a42] mb-1">E-mail</label>
                      <input required type="email" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#594a42] mb-1">WhatsApp (com DDD)</label>
                      <input required type="tel" placeholder="Ex: 11999999999" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#594a42] mb-1">Endereço Completo</label>
                    <input required type="text" placeholder="Rua, Número, Bairro, CEP" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#594a42] mb-1">Data de Entrega Desejada</label>
                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all outline-none" />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button type="submit" className="w-full bg-[#3c2a21] hover:bg-[#2a1d17] text-white py-4 rounded-xl text-lg font-bold tracking-wide transition-all transform hover:scale-[1.02] shadow-lg flex justify-center items-center gap-2">
                    Continuar para Pagamento <span className="text-xl">→</span>
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                    🔒 Pagamento 100% seguro via Pix
                  </p>
                </div>
              </form>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-xl shadow-black/5 border border-[#d4af37] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#d4af37] to-[#e8c65f]"></div>
                
                <h2 className="text-3xl font-bold text-[#3c2a21] mb-2 mt-4" style={{ fontFamily: 'var(--font-heading)' }}>Pagamento Pix</h2>
                <p className="text-[#594a42] mb-8 text-lg">Seu pedido foi registrado. Realize o pagamento para confirmar a produção.</p>
                
                {/* Desktop QR Code */}
                <div className="hidden md:flex flex-col items-center mb-8">
                  <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm mb-4">
                    <img src={pixQR} alt="QR Code Pix" className="w-56 h-56 object-contain" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Abra o app do seu banco e escaneie o QR Code acima</p>
                </div>

                <div className="md:hidden flex items-center justify-center mb-8">
                    <div className="w-full max-w-[250px] aspect-square rounded-2xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-400">
                        <span className="text-4xl mb-2">📱</span>
                        <p className="text-sm font-medium text-center">QR Code disponível no Computador</p>
                    </div>
                </div>

                {/* Mobile Copia e Cola */}
                <div className="max-w-md mx-auto mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Pix Copia e Cola</span>
                  </div>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-2 relative">
                    <div className="truncate text-gray-500 text-sm pl-2 pr-4 w-full select-all">{pixPayload}</div>
                    <button 
                      onClick={copyPix}
                      className={`min-w-[120px] py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-[#3c2a21] text-white hover:bg-[#2a1d17]'}`}
                    >
                      {copied ? '✅ Copiado!' : 'Copiar Código'}
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-sm text-[#7a6a61] bg-[#fdfaf3] p-4 rounded-lg border border-[#e8e1d7]">
                    💡 <strong>Atenção:</strong> Seu pedido só começará a ser produzido após a confirmação do pagamento pelo banco.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: CART SUMMARY (Sticky sidebar) */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-2xl shadow-lg shadow-black/5 border border-gray-100 sticky top-32">
              <h2 className="text-xl font-bold text-[#3c2a21] mb-6 pb-4 border-b border-gray-100" style={{ fontFamily: 'var(--font-heading)' }}>Resumo do Pedido</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{item.quantity}</span>
                    </div>
                    <div className="flex-grow">
                      <p className="font-bold text-[#594a42] text-sm leading-tight mb-1">{item.name}</p>
                      <p className="font-bold text-[#3c2a21] text-sm">R$ {(getNumericPrice(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Frete</span>
                  <span className="text-[#d4af37] font-semibold">A Combinar</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-lg font-bold text-[#3c2a21]">Total</span>
                  <span className="text-2xl font-bold text-[#d4af37]">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
