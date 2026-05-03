import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';

interface ShippingForm {
  name: string;
  phone: string;
  province: string;
  subdistrict: string;
  district: string;
  zipcode: string;
  detail: string;
}

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, cartSubtotal, shippingFee, cartTotal, t, user } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState<ShippingForm>({
    name: '', phone: '', province: '', subdistrict: '', district: '', zipcode: '', detail: '',
  });

  const handleChange = (key: keyof ShippingForm, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/payment', { state: { form, items: cart, subtotal: cartSubtotal, shipping: shippingFee, total: cartTotal } });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center flex-col gap-4">
          <p className="text-muted-foreground text-lg">{t('ตะกร้าสินค้าว่างเปล่า', 'Your cart is empty')}</p>
          <button onClick={() => navigate('/')} className="btn-order px-8">
            {t('เลือกซื้อสินค้า', 'Shop Now')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <button onClick={() => navigate(-1)} className="mb-4 px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          {t('กลับ', 'Back')}
        </button>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="bg-muted px-4 py-3 flex justify-end gap-16 text-sm font-medium text-muted-foreground border-b border-border">
            <span>{t('จำนวน', 'Quantity')}</span>
            <span>{t('ราคา', 'Price')}</span>
          </div>

          {/* Cart items */}
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                <X size={18} />
              </button>
              <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded border border-border flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
              </div>
              {/* Qty controls */}
              <div className="flex items-center border border-border rounded-full overflow-hidden flex-shrink-0">
                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted text-muted-foreground">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted text-muted-foreground">
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-sm font-semibold text-foreground w-24 text-right flex-shrink-0">
                {(item.product.price * item.quantity).toLocaleString()} {t('บาท', 'THB')}
              </span>
            </div>
          ))}

          {/* Summary */}
          <div className="px-4 py-3 border-b border-border flex justify-end gap-6 text-sm">
            <div className="text-right space-y-1">
              <div className="flex gap-8 justify-between">
                <span className="text-muted-foreground">{t('ยอดรวม:', 'Subtotal:')}</span>
                <span className="font-medium">{cartSubtotal.toLocaleString()} {t('บาท', 'THB')}</span>
              </div>
              <div className="flex gap-8 justify-between">
                <span className="text-muted-foreground">{t('ค่าจัดส่ง:', 'Shipping:')}</span>
                <span className={`font-medium ${shippingFee === 0 ? 'text-primary' : 'text-foreground'}`}>
                  {shippingFee === 0 ? t('ฟรี', 'FREE') : `${shippingFee} ${t('บาท', 'THB')}`}
                </span>
              </div>
              <div className="flex gap-8 justify-between border-t border-border pt-1">
                <span className="font-semibold">{t('รวมทั้งหมด:', 'Total:')}</span>
                <span className="font-bold text-primary">{cartTotal.toLocaleString()} {t('บาท', 'THB')}</span>
              </div>
            </div>
          </div>

          {/* Shipping form */}
          <div className="p-4">
            <h2 className="font-semibold text-foreground mb-3 text-sm">{t('ข้อมูลการจัดส่งสินค้า', 'Shipping Information')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name', label: t('ชื่อ-นามสกุล', 'Full Name') },
                { key: 'phone', label: t('เบอร์โทรศัพท์', 'Phone Number') },
                { key: 'province', label: t('จังหวัด', 'Province') },
                { key: 'subdistrict', label: t('แขวง/ตำบล', 'Sub-district') },
                { key: 'district', label: t('เขต/อำเภอ', 'District') },
                { key: 'zipcode', label: t('รหัสไปรษณีย์', 'Zipcode') },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                  <input
                    className="input-field"
                    value={form[field.key as keyof ShippingForm]}
                    onChange={(e) => handleChange(field.key as keyof ShippingForm, e.target.value)}
                    placeholder={field.label}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">{t('รายละเอียดเพิ่มเติม', 'Additional Details')}</label>
                <input
                  className="input-field"
                  value={form.detail}
                  onChange={(e) => handleChange('detail', e.target.value)}
                  placeholder={t('รายละเอียดเพิ่มเติม (บ้านเลขที่, ซอย, ถนน)', 'House number, soi, road...')}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={handleCheckout} className="btn-order px-8 py-3 text-base">
                {t('ชำระเงิน', 'Checkout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
