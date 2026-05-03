import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminProducts, DbProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Shield, LogOut, Plus, Pencil, Trash2, Upload, X, Package,
  ChevronDown, ChevronUp, Save, ImagePlus, AlertCircle
} from 'lucide-react';
import { products as staticProducts } from '@/data/products';

type Category = 'warhammer40k' | 'ageofsigmar' | 'killteam';

const categoryLabels: Record<Category, string> = {
  warhammer40k: 'Warhammer 40,000',
  ageofsigmar: 'Age of Sigmar',
  killteam: 'Kill Team',
};

const emptyForm = {
  name: '', name_en: '', price: 0, category: 'warhammer40k' as Category,
  material: 'พลาสติกคุณภาพสูง (Citadel Plastic)', type: 'มินิเจอร์สำหรับวาดสี',
  stock: 0, description: [''], description_en: [''], image_url: '',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdminAuth();
  const { products, loading, refetch } = useAdminProducts();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">กำลังตรวจสอบสิทธิ์...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-muted-foreground mb-4">คุณต้องล็อกอินด้วยบัญชี Admin</p>
          <Button onClick={() => navigate('/admin/login')}>ไปหน้า Admin Login</Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url || null;
    setUploading(true);
    const ext = imageFile.name.split('.').pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, imageFile, { upsert: true });
    setUploading(false);
    if (error) { setError('อัปโหลดรูปภาพไม่สำเร็จ'); return null; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) { setError('กรุณากรอกชื่อสินค้าและราคา'); return; }
    setSaving(true); setError('');

    const imageUrl = await uploadImage();

    const payload = {
      name: form.name,
      name_en: form.name_en || form.name,
      price: form.price,
      category: form.category,
      material: form.material,
      type: form.type,
      stock: form.stock,
      description: form.description.filter(Boolean),
      description_en: form.description_en.filter(Boolean),
      image_url: imageUrl,
    };

    let err;
    if (editId !== null) {
      ({ error: err } = await supabase.from('products').update(payload).eq('id', editId));
    } else {
      ({ error: err } = await supabase.from('products').insert([payload]));
    }

    setSaving(false);
    if (err) { setError('บันทึกไม่สำเร็จ: ' + err.message); return; }

    setShowForm(false);
    setEditId(null);
    setForm({ ...emptyForm });
    setImageFile(null);
    setImagePreview('');
    refetch();
  };

  const handleEdit = (p: DbProduct) => {
    setEditId(p.id);
    setForm({
      name: p.name, name_en: p.name_en, price: p.price,
      category: p.category, material: p.material, type: p.type,
      stock: p.stock,
      description: p.description.length ? p.description : [''],
      description_en: p.description_en.length ? p.description_en : [''],
      image_url: p.image_url || '',
    });
    setImagePreview(p.image_url || '');
    setImageFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    await supabase.from('products').delete().eq('id', id);
    setDeleteConfirm(null);
    refetch();
  };

  const handleCancel = () => {
    setShowForm(false); setEditId(null);
    setForm({ ...emptyForm }); setImageFile(null); setImagePreview(''); setError('');
  };

  const handleSeedData = async () => {
    setSeeding(true);
    const rows = staticProducts.map((p) => ({
      name: p.name, name_en: p.nameEn, price: p.price,
      category: p.category, material: p.material, type: p.type, stock: p.stock,
      description: p.description, description_en: p.descriptionEn, image_url: null,
    }));
    await supabase.from('products').upsert(rows, { onConflict: 'id' });
    setSeeding(false);
    refetch();
  };

  const updateDesc = (arr: string[], idx: number, val: string, key: 'description' | 'description_en') => {
    const next = [...arr]; next[idx] = val; setForm((f) => ({ ...f, [key]: next }));
  };
  const addDesc = (key: 'description' | 'description_en') =>
    setForm((f) => ({ ...f, [key]: [...f[key], ''] }));
  const removeDesc = (arr: string[], idx: number, key: 'description' | 'description_en') => {
    setForm((f) => ({ ...f, [key]: arr.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Admin Dashboard</span>
            <Badge variant="secondary" className="text-xs">Top Legacy Board Game</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>ดูหน้าร้าน</Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={14} /> ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {(['warhammer40k', 'ageofsigmar', 'killteam'] as Category[]).map((cat) => (
            <div key={cat} className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">{categoryLabels[cat]}</p>
              <p className="text-2xl font-bold text-foreground">
                {products.filter((p) => p.category === cat).length}
              </p>
              <p className="text-xs text-muted-foreground">รายการสินค้า</p>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Package size={20} /> สินค้าทั้งหมด ({products.length})
          </h2>
          <div className="flex gap-2">
            {products.length === 0 && (
              <Button variant="outline" size="sm" onClick={handleSeedData} disabled={seeding}>
                {seeding ? 'กำลัง Import...' : '📦 Import สินค้าตัวอย่าง'}
              </Button>
            )}
            <Button size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ ...emptyForm }); }}>
              {showForm ? <ChevronUp size={14} /> : <Plus size={14} />}
              {showForm ? 'ซ่อนฟอร์ม' : 'เพิ่มสินค้า'}
            </Button>
          </div>
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-5">
            <h3 className="font-bold text-foreground text-base">
              {editId !== null ? `✏️ แก้ไขสินค้า #${editId}` : '➕ เพิ่มสินค้าใหม่'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* Image upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-40 h-40 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden bg-muted/30 transition-colors"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <ImagePlus size={32} />
                    <span className="text-xs mt-1">คลิกเพื่ออัปโหลด</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {imagePreview && (
                <button onClick={() => { setImagePreview(''); setImageFile(null); setForm(f => ({ ...f, image_url: '' })); }}
                  className="text-xs text-destructive hover:underline flex items-center gap-1">
                  <X size={12} /> ลบรูป
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">ชื่อสินค้า (TH) *</label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">ชื่อสินค้า (EN)</label>
                <Input value={form.name_en} onChange={(e) => setForm(f => ({ ...f, name_en: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">ราคา (บาท) *</label>
                <Input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: +e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">สต็อก *</label>
                <Input type="number" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: +e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">หมวดหมู่ *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value as Category }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {(Object.keys(categoryLabels) as Category[]).map((c) => (
                    <option key={c} value={c}>{categoryLabels[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">วัสดุ</label>
                <Input value={form.material} onChange={(e) => setForm(f => ({ ...f, material: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">ประเภท</label>
                <Input value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">รายละเอียด (TH)</label>
                <div className="space-y-2">
                  {form.description.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={d} onChange={(e) => updateDesc(form.description, i, e.target.value, 'description')} placeholder={`รายละเอียด ${i + 1}`} />
                      {form.description.length > 1 && (
                        <button onClick={() => removeDesc(form.description, i, 'description')} className="text-destructive hover:text-destructive/80"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addDesc('description')}><Plus size={12} /> เพิ่มบรรทัด</Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">รายละเอียด (EN)</label>
                <div className="space-y-2">
                  {form.description_en.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={d} onChange={(e) => updateDesc(form.description_en, i, e.target.value, 'description_en')} placeholder={`Detail ${i + 1}`} />
                      {form.description_en.length > 1 && (
                        <button onClick={() => removeDesc(form.description_en, i, 'description_en')} className="text-destructive hover:text-destructive/80"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addDesc('description_en')}><Plus size={12} /> Add line</Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving || uploading}>
                {saving || uploading ? (uploading ? <><Upload size={14} /> กำลังอัปโหลด...</> : <><Save size={14} /> กำลังบันทึก...</>) : <><Save size={14} /> บันทึก</>}
              </Button>
              <Button variant="outline" onClick={handleCancel}>ยกเลิก</Button>
            </div>
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">กำลังโหลด...</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
            <Package size={40} />
            <p>ยังไม่มีสินค้า กด "Import สินค้าตัวอย่าง" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">รูป</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">ชื่อสินค้า</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">หมวดหมู่</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">ราคา</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">สต็อก</th>
                    <th className="text-center px-4 py-3 text-muted-foreground font-medium">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-muted-foreground" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground"># {p.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{categoryLabels[p.category]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        ฿{p.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${p.stock === 0 ? 'text-destructive' : p.stock <= 3 ? 'text-yellow-500' : 'text-foreground'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="h-8 w-8 p-0">
                            <Pencil size={14} />
                          </Button>
                          {deleteConfirm === p.id ? (
                            <div className="flex gap-1">
                              <Button variant="destructive" size="sm" className="h-8 text-xs px-2" onClick={() => handleDelete(p.id)}>ยืนยัน</Button>
                              <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => setDeleteConfirm(null)}>ยกเลิก</Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(p.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
