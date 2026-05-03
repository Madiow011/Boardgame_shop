import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export default function OrderHistory() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setOrders((data as any[]) || []);
      setLoading(false);
    };
    fetchOrders();
  }, [navigate]);

  const methodLabel = (m: string) => {
    if (m === 'visa') return 'VISA';
    if (m === 'mastercard') return 'MasterCard';
    return 'PromptPay';
  };

  const statusLabel = (s: string) => {
    const map: Record<string, [string, string]> = {
      pending: ['รอชำระเงิน', 'Pending'],
      paid: ['ชำระแล้ว', 'Paid'],
      shipped: ['จัดส่งแล้ว', 'Shipped'],
      completed: ['สำเร็จ', 'Completed'],
      cancelled: ['ยกเลิก', 'Cancelled'],
    };
    const v = map[s] || [s, s];
    return t(v[0], v[1]);
  };

  const statusColor = (s: string) => {
    if (s === 'paid') return 'bg-primary/20 text-primary';
    if (s === 'shipped') return 'bg-blue-100 text-blue-700';
    if (s === 'completed') return 'bg-green-100 text-green-700';
    if (s === 'cancelled') return 'bg-destructive/20 text-destructive';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <button onClick={() => navigate(-1)} className="mb-4 px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          {t('กลับ', 'Back')}
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6">{t('ประวัติการสั่งซื้อ', 'Order History')}</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">{t('ยังไม่มีประวัติการสั่งซื้อ', 'No orders yet')}</p>
            <button onClick={() => navigate('/shop')} className="btn-order px-8">
              {t('เลือกซื้อสินค้า', 'Shop Now')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Order header */}
                <div className="px-4 py-3 bg-muted flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{methodLabel(order.payment_method)}</span>
                </div>

                {/* Items */}
                <div className="px-4 py-3">
                  {(order.items as OrderItem[]).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-foreground">{item.name} <span className="text-muted-foreground">x{item.quantity}</span></span>
                      <span className="font-medium">{(item.price * item.quantity).toLocaleString()} {t('บาท', 'THB')}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="px-4 py-3 border-t border-border flex justify-between text-sm font-bold">
                  <span>{t('ยอดรวม', 'Total')}</span>
                  <span className="text-primary">{order.total.toLocaleString()} {t('บาท', 'THB')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
