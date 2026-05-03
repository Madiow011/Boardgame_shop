import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, LogOut, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: () => void;
}

export default function Header({ searchValue = '', onSearchChange, onSearchSubmit }: HeaderProps) {
  const { user, logout, language, setLanguage, cartCount, t } = useApp();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch(e as unknown as React.FormEvent);
  };

  return (
    <header className="header-sticky sticky top-0 z-50">
      {/* Free shipping banner */}
      <div className="free-shipping-banner">
        เมื่อสั่งซื้อสินค้าราคา 2,000 บาทขึ้นไป จัดส่งฟรี!!!
      </div>

      <div className="px-4 py-2 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 mr-2">
          <span className="font-display text-primary text-lg font-bold tracking-wide whitespace-nowrap">
            TOP LEGACY
          </span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center bg-white rounded border border-border overflow-hidden max-w-xl">
          <div className="flex items-center px-3 text-muted-foreground">
            <Search size={16} />
          </div>
          <input
            className="flex-1 py-2 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder={t('ค้นหาสินค้า...', 'Search products...')}
            value={onSearchChange ? searchValue : localSearch}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value);
              else setLocalSearch(e.target.value);
            }}
            onKeyDown={handleKey}
          />
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:brightness-110 transition-all"
          >
            {t('ค้นหา', 'Search')}
          </button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          {/* Wishlist */}
          <Link to="/wishlist" className="flex items-center gap-1 text-secondary-foreground hover:text-primary transition-colors text-sm">
            <Heart size={18} />
            <span className="hidden md:inline">{t('รายการโปรด', 'Wishlist')}</span>
          </Link>

          {/* Language toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLanguage('th')}
              className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${language === 'th' ? 'bg-primary text-primary-foreground' : 'text-primary/60 hover:text-primary'}`}
              title="ภาษาไทย"
            >
              TH
            </button>
            <span className="text-muted-foreground text-xs">/</span>
            <button
              onClick={() => setLanguage('en')}
              className={`text-sm font-bold px-2 py-0.5 rounded transition-all ${language === 'en' ? 'bg-primary text-primary-foreground' : 'text-primary/60 hover:text-primary'}`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* User */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/orders" className="text-secondary-foreground hover:text-primary transition-colors text-sm hidden md:inline">
                {user.username}
              </Link>
              <button onClick={logout} className="text-secondary-foreground hover:text-primary transition-colors" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-1 text-secondary-foreground hover:text-primary transition-colors text-sm">
              <User size={18} />
              <span className="hidden md:inline">{t('เข้าสู่ระบบ', 'Login')}</span>
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative flex items-center text-secondary-foreground hover:text-primary transition-colors">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-background border-b border-border px-4 flex gap-1">
        {[
          { label: t('หน้าแรก', 'Home'), to: '/' },
          { label: t('โปรโมชั่น', 'Promotions'), to: '/promotions' },
          { label: t('ติดต่อเรา', 'Contact'), to: '/contact' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-b-2 border-transparent hover:border-primary"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
