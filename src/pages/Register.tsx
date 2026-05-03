import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Register() {
  const { register, language, setLanguage, t } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    birthday: '',
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const set = (key: string, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username) e.username = t('กรุณากรอกชื่อผู้ใช้', 'Username required');
    if (!form.password) e.password = t('กรุณากรอกรหัสผ่าน', 'Password required');
    if (form.password !== form.confirmPassword)
      e.confirmPassword = t('รหัสผ่านไม่ตรงกัน', 'Passwords do not match');
    if (!form.email) e.email = t('กรุณากรอกอีเมล', 'Email required');
    if (!form.terms)
      e.terms = t('กรุณายอมรับเงื่อนไข', 'Please accept terms');
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    register(form.username, form.email, form.password);
    setSuccess(true);
    setTimeout(() => navigate('/login'), 2500);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t('สมัครสมาชิกเรียบร้อย', 'Registration Successful')}
          </h2>
          <p className="text-muted-foreground mb-6">{t('ขอบคุณที่เข้าร่วมกับเรา', 'Thank you for joining us')}</p>
          <p className="text-primary text-sm">
            {t('กำลังนำคุณกลับหน้าล็อคอิน...', 'Redirecting to login...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          {t('กลับหน้าล็อคอิน', 'Back to Login')}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('เปลี่ยนภาษา', 'Language')}</span>
          <button onClick={() => setLanguage('th')} className={`text-lg ${language === 'th' ? '' : 'opacity-40'}`}>🇹🇭</button>
          <button onClick={() => setLanguage('en')} className={`text-lg ${language === 'en' ? '' : 'opacity-40'}`}>🇬🇧</button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-8">
        <div className="bg-card rounded-xl border border-border p-8 w-full max-w-md shadow-lg">
          <h1 className="text-xl font-bold text-center text-foreground mb-6">
            {t('สมัครสมาชิก', 'Register')}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'username', label: t('ชื่อผู้ใช้งาน', 'Username'), type: 'text' },
              { key: 'password', label: t('รหัสผ่าน', 'Password'), type: 'password' },
              { key: 'confirmPassword', label: t('ยืนยันรหัสผ่าน', 'Confirm Password'), type: 'password' },
              { key: 'email', label: t('อีเมลล์', 'Email'), type: 'email' },
            ].map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <label className="w-32 text-sm text-muted-foreground flex-shrink-0">{field.label}</label>
                <div className="flex-1">
                  <input
                    type={field.type}
                    className="input-field"
                    value={form[field.key as keyof typeof form] as string}
                    onChange={(e) => set(field.key, e.target.value)}
                  />
                  {errors[field.key] && (
                    <p className="text-destructive text-xs mt-0.5">{errors[field.key]}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Birthday */}
            <div className="flex items-center gap-3">
              <label className="w-32 text-sm text-muted-foreground flex-shrink-0">{t('วันเกิด', 'Birthday')}</label>
              <div className="flex-1">
                <input
                  type="date"
                  name="calendar"
                  className="input-field"
                  value={form.birthday}
                  onChange={(e) => set('birthday', e.target.value)}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-0.5 accent-primary w-4 h-4"
                checked={form.terms}
                onChange={(e) => set('terms', e.target.checked)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                {t('กรุณาตกลง ข้อตกลงและเงื่อนไขในการใช้งานเว็บไซต์', 'Please agree to Terms and Conditions')}
              </label>
            </div>
            {errors.terms && <p className="text-destructive text-xs">{errors.terms}</p>}

            <div className="flex justify-end">
              <button type="submit" className="btn-order px-8 py-2.5">
                {t('ยืนยันข้อมูล', 'Submit')}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              {t('มีบัญชีแล้ว? เข้าสู่ระบบ', 'Already have an account? Login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
