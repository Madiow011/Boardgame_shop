import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/data/products';
import { DbProduct } from '@/hooks/useProducts';
import { useApp } from '@/context/AppContext';

interface ProductCardProps {
  product: Product | DbProduct;
}

function isDbProduct(p: Product | DbProduct): p is DbProduct {
  return 'name_en' in p;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user, addToCart, setShowAuthModal, wishlist, toggleWishlist, language, t } = useApp();
  const navigate = useNavigate();
  const isWishlisted = wishlist.includes(product.id);

  // Convert DbProduct to Product for addToCart compatibility
  const toStaticProduct = (): Product => {
    if (isDbProduct(product)) {
      return {
        id: product.id,
        name: product.name,
        nameEn: product.name_en,
        price: product.price,
        category: product.category,
        imageUrl: product.image_url || '/placeholder.svg',
        description: product.description,
        descriptionEn: product.description_en,
        material: product.material,
        type: product.type,
        stock: product.stock,
      };
    }
    return product as Product;
  };

  const handleOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    addToCart(toStaticProduct());
    navigate('/cart');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const displayName = language === 'th' ? product.name : (isDbProduct(product) ? product.name_en : (product as Product).nameEn);

  return (
    <div
      className="product-card cursor-pointer flex flex-col"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative bg-muted aspect-square overflow-hidden">
        <img
          src={isDbProduct(product) ? (product.image_url || '/placeholder.svg') : product.imageUrl}
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 left-2 w-8 h-8 rounded-full bg-card/90 border border-border flex items-center justify-center transition-all hover:scale-110 ${
            isWishlisted ? 'text-accent' : 'text-muted-foreground'
          }`}
          title={t('รายการโปรด', 'Wishlist')}
        >
          <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-center text-foreground font-medium leading-tight mb-3 line-clamp-2 min-h-[2.5rem]">
          {displayName}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-semibold text-foreground">
            {product.price.toLocaleString()} {t('บาท', 'THB')}
          </span>
          <button
            className="btn-order"
            onClick={handleOrder}
          >
            {t('สั่งซื้อ', 'Order')}
          </button>
        </div>
      </div>
    </div>
  );
}
