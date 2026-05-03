import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Login() {
  const { login, language, setLanguage, t } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(username, password);
    if (ok) {
      navigate('/');
    } else {
      setError(t('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'Invalid username or password'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          {t('กลับหน้าร้าน', 'Back to Shop')}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('เปลี่ยนภาษา', 'Language')}</span>
          <button onClick={() => setLanguage('th')} className={`text-lg ${language === 'th' ? '' : 'opacity-40'}`}>🇹🇭</button>
          <button onClick={() => setLanguage('en')} className={`text-lg ${language === 'en' ? '' : 'opacity-40'}`}>🇬🇧</button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="bg-card rounded-xl border border-border p-8 w-full max-w-sm shadow-lg">
          <h1 className="text-xl font-bold text-center text-foreground mb-6">
            {t('ล็อคอิน', 'Login')}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">{t('ยูเซอร์เนม', 'Username')}</label>
              <input
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('กรอกชื่อผู้ใช้', 'Enter username')}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">{t('พาสเวิร์ด', 'Password')}</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('กรอกรหัสผ่าน', 'Enter password')}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <button type="submit" className="btn-order w-full py-2.5 text-base">
              {t('ยืนยัน', 'Sign In')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/register" className="text-sm text-primary hover:underline">
              {t('สมัครสมาชิก', 'Register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
