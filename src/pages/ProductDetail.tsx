import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import { products } from '@/data/products';
import { useApp } from '@/context/AppContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, addToCart, setShowAuthModal, wishlist, toggleWishlist, showAuthModal, t, language } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const product = products.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">{t('ไม่พบสินค้า', 'Product not found')}</p>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  // Use same image for carousel demo (in production would have multiple images)
  const images = [product.imageUrl, product.imageUrl, product.imageUrl];

  const handleOrder = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    addToCart(product, quantity);
    navigate('/cart');
  };

  const displayName = language === 'th' ? product.name : product.nameEn;
  const displayDesc = language === 'th' ? product.description : product.descriptionEn;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {showAuthModal && <AuthModal />}

      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          {t('กลับ', 'Back')}
        </button>

        <div className="bg-card rounded-xl border border-border p-6 flex flex-col md:flex-row gap-8">
          {/* Image carousel */}
          <div className="flex-shrink-0 w-full md:w-80">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={images[imgIdx]}
                alt={displayName}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1 hover:bg-card transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-1 hover:bg-card transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 mt-2 justify-center">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                    imgIdx === i ? 'border-primary' : 'border-border'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-xl font-bold text-foreground leading-tight">{displayName}</h1>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`ml-4 flex-shrink-0 ${isWishlisted ? 'text-accent' : 'text-muted-foreground'} hover:text-accent transition-colors`}
              >
                <Heart size={22} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Description */}
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              {displayDesc.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>

            {/* Specs */}
            <div className="text-sm text-muted-foreground mb-4 space-y-1">
              <p><span className="text-foreground font-medium">{t('วัสดุ:', 'Material:')}</span> {product.material}</p>
              <p><span className="text-foreground font-medium">{t('ประเภท:', 'Type:')}</span> {product.type}</p>
              <p><span className="text-foreground font-medium">{t('สต็อก:', 'Stock:')}</span> {product.stock} {t('ชิ้น', 'pcs')}</p>
            </div>

            {/* Price */}
            <p className="text-2xl font-bold text-foreground mb-4">
              {t('ราคา', 'Price')} {product.price.toLocaleString()} {t('บาท', 'THB')}
            </p>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-muted-foreground">{t('จำนวน:', 'Qty:')}</span>
              <div className="flex items-center border border-border rounded-full overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={handleOrder}
              className="btn-order self-start px-10 py-3 text-base"
            >
              {t('สั่งซื้อ', 'Order')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
