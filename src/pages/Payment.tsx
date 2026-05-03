import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

const TIMER_SECONDS = 15 * 60;

type PaymentMethod = 'promptpay' | 'visa' | 'mastercard';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart, t } = useApp();
  const state = location.state as {
    form: Record<string, string>;
    items: { product: { name: string; imageUrl: string; price: number }; quantity: number }[];
    subtotal: number;
    shipping: number;
    total: number;
  } | null;

  const [step, setStep] = useState<'confirm' | 'qr' | 'card' | 'success'>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Card form
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    if (step === 'qr') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current!); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const saveOrder = async (method: PaymentMethod) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const orderItems = state!.items.map(i => ({
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
      }));
      await supabase.from('orders').insert({
        user_id: session?.user?.id,
        customer_name: state!.form.name || '',
        phone: state!.form.phone || '',
        province: state!.form.province || '',
        district: state!.form.district || '',
        subdistrict: state!.form.subdistrict || '',
        zipcode: state!.form.zipcode || '',
        detail: state!.form.detail || '',
        items: orderItems as any,
        subtotal: state!.subtotal,
        shipping_fee: state!.shipping,
        total: state!.total,
        payment_method: method,
        status: 'paid',
      } as any);
    } catch (e) {
      console.error('Failed to save order:', e);
    }
    setSaving(false);
  };

  const handlePay = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await saveOrder(paymentMethod);
    clearCart();
    setStep('success');
  };

  const handleCardPay = async () => {
    if (!cardForm.cardNumber || !cardForm.cardName || !cardForm.expiry || !cardForm.cvv) return;
    await saveOrder(paymentMethod);
    clearCart();
    setStep('success');
  };

  const handleConfirm = () => {
    if (paymentMethod === 'promptpay') {
      setStep('qr');
    } else {
      setStep('card');
    }
  };

  if (!state) { navigate('/'); return null; }

  // SUCCESS
  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{t('ชำระสินค้าเรียบร้อย', 'Payment Successful')}</h2>
            <p className="text-muted-foreground mb-6">{t('ขอบคุณสำหรับการสั่งซื้อ', 'Thank you for your order')}</p>
            {state.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 mb-3 text-left border border-border rounded-lg p-3">
                <img src={item.product.imageUrl} alt={item.product.name} className="w-14 h-14 object-cover rounded" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                </div>
                <span className="text-sm font-semibold">{(item.product.price * item.quantity).toLocaleString()} {t('บาท', 'THB')}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 text-sm text-muted-foreground">
              <div className="flex justify-between mb-1">
                <span>{t('ยอดรวม', 'Subtotal')}</span>
                <span className="font-medium text-foreground">{state.total.toLocaleString()} {t('บาท', 'THB')}</span>
              </div>
            </div>
            <button onClick={() => navigate('/')} className="btn-order mt-6 px-8 py-3 w-full">
              {t('กลับหน้าหลัก', 'Back to Home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CARD PAYMENT FORM
  if (step === 'card') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
            <h2 className="font-bold text-foreground text-lg mb-4 text-center">
              {paymentMethod === 'visa' ? 'VISA' : 'MasterCard'} {t('ชำระเงิน', 'Payment')}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{t('หมายเลขบัตร', 'Card Number')}</label>
                <input
                  className="input-field"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardForm.cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                    setCardForm(p => ({ ...p, cardNumber: v }));
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{t('ชื่อบนบัตร', 'Name on Card')}</label>
                <input
                  className="input-field"
                  placeholder="FULL NAME"
                  value={cardForm.cardName}
                  onChange={(e) => setCardForm(p => ({ ...p, cardName: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{t('วันหมดอายุ', 'Expiry Date')}</label>
                  <input
                    className="input-field"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardForm.expiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
                      setCardForm(p => ({ ...p, expiry: v }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">CVV</label>
                  <input
                    className="input-field"
                    placeholder="***"
                    maxLength={3}
                    type="password"
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
              </div>
            </div>

            {/* Order summary */}
            {state.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 mb-3 border border-border rounded p-2">
                <img src={item.product.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-foreground">{item.product.name}</p>
                  <p className="text-muted-foreground">x{item.quantity}</p>
                </div>
                <span className="text-sm font-semibold">{(item.product.price * item.quantity).toLocaleString()} {t('บาท', 'THB')}</span>
              </div>
            ))}

            <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-3 mb-4">
              <span>{t('ยอดรวม', 'Total')}</span>
              <span className="text-primary">{state.total.toLocaleString()} {t('บาท', 'THB')}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('confirm')} className="flex-1 py-3 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                {t('กลับ', 'Back')}
              </button>
              <button
                onClick={handleCardPay}
                disabled={saving || !cardForm.cardNumber || !cardForm.cardName || !cardForm.expiry || !cardForm.cvv}
                className="btn-order flex-1 py-3 text-base disabled:opacity-50"
              >
                {saving ? t('กำลังดำเนินการ...', 'Processing...') : t('ชำระเงิน', 'Pay Now')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // QR STEP
  if (step === 'qr') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="bg-card rounded-xl border border-border p-6 max-w-lg w-full">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-secondary text-primary text-xs font-bold px-3 py-1 rounded mb-3">PromptPay</div>
                <div className="w-36 h-36 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-28 h-28">
                    <rect x="10" y="10" width="30" height="30" fill="none" stroke="black" strokeWidth="4"/>
                    <rect x="18" y="18" width="14" height="14" fill="black"/>
                    <rect x="60" y="10" width="30" height="30" fill="none" stroke="black" strokeWidth="4"/>
                    <rect x="68" y="18" width="14" height="14" fill="black"/>
                    <rect x="10" y="60" width="30" height="30" fill="none" stroke="black" strokeWidth="4"/>
                    <rect x="18" y="68" width="14" height="14" fill="black"/>
                    <rect x="45" y="45" width="6" height="6" fill="black"/>
                    <rect x="53" y="45" width="6" height="6" fill="black"/>
                    <rect x="61" y="53" width="6" height="6" fill="black"/>
                    <rect x="69" y="61" width="6" height="6" fill="black"/>
                    <rect x="77" y="69" width="6" height="6" fill="black"/>
                  </svg>
                </div>
                <div className="mt-3 bg-muted rounded px-4 py-2 text-2xl font-mono font-bold text-foreground border border-border">
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">{t('ชำระเงิน', 'Payment')}</h3>
                <div className="text-sm text-muted-foreground mb-3">
                  {state.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs mb-1">
                      <span className="truncate max-w-[140px]">{item.product.name}</span>
                      <span>{(item.product.price * item.quantity).toLocaleString()} {t('บาท', 'THB')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1 mt-1">
                    <span>{t('รวม', 'Total')}</span>
                    <span>{state.total.toLocaleString()} {t('บาท', 'THB')}</span>
                  </div>
                </div>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>{t('เปิดแอพพลิเคชันธนาคารบนมือถือ', 'Open your banking app')}</li>
                  <li>{t('เลือกเมนูโอนเงินหรือจ่ายเงิน', 'Select transfer or payment menu')}</li>
                  <li>{t('สแกน QR Code เพื่อชำระเงิน', 'Scan QR Code to pay')}</li>
                  <li>{t('โอนเงินภายใน 15 นาที', 'Transfer within 15 minutes')}</li>
                </ol>
              </div>
            </div>
            <button onClick={handlePay} disabled={saving} className="btn-order w-full mt-6 py-3 text-base disabled:opacity-50">
              {saving ? t('กำลังบันทึก...', 'Saving...') : t('จำลองการชำระเงินสำเร็จ', 'Simulate Payment Success')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CONFIRM STEP
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
          <h2 className="font-bold text-foreground text-lg mb-4 text-center">{t('เลือกช่องทางชำระเงิน', 'Select Payment Method')}</h2>

          <div className="space-y-3 mb-4">
            <div className="flex gap-3 items-center">
              <label className="text-sm text-muted-foreground w-28">{t('ชื่อ-นามสกุล', 'Full Name')}</label>
              <div className="flex-1 bg-muted rounded px-3 py-2 text-sm text-foreground">{state.form.name || '-'}</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 mb-4 bg-muted rounded p-3">
            <p>{t('เปิดแอพพลิเคชันธนาคารบนมือถือ', 'Open your banking app on mobile')}</p>
            <p>{t('เลือกเมนูโอนเงินไปยังบัญชีเงินฝาก', 'Choose transfer to savings account')}</p>
            <p>{t('ระบบจะดำเนินการโอนเงินให้อัตโนมัติเมื่อคลิก', 'System will process payment automatically')}</p>
            <p>{t('**กรุณาบันทึกภาพการชำระเงินไว้เพื่อเป็นหลักฐานการชำระเงิน', '**Please save payment screenshot as proof')}</p>
          </div>

          {state.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-3 border border-border rounded p-2">
              <img src={item.product.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-foreground">{item.product.name}</p>
                <p className="text-muted-foreground">x{item.quantity}</p>
              </div>
              <span className="text-sm font-semibold">{(item.product.price * item.quantity).toLocaleString()} {t('บาท', 'THB')}</span>
            </div>
          ))}

          <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-3 mb-4">
            <span>{t('ยอดรวม', 'Total')}</span>
            <span className="text-primary">{state.total.toLocaleString()} {t('บาท', 'THB')}</span>
          </div>

          {/* Payment method selection */}
          <div className="border border-border rounded p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-2">{t('ช่องทางการชำระเงิน', 'Payment methods')}</p>
            <div className="flex gap-2 items-center">
              {(['visa', 'mastercard', 'promptpay'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                    paymentMethod === method
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {method === 'visa' ? 'VISA' : method === 'mastercard' ? 'MasterCard' : 'PromptPay'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleConfirm} className="btn-order w-full py-3 text-base">
            {t('ยืนยัน / ชำระเงิน', 'Confirm / Pay')}
          </button>
        </div>
      </div>
    </div>
  );
}
