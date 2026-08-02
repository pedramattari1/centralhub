import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApi } from '@/lib/api';
import { useAppData } from '@/hooks/useAppData.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input, Textarea, Label } from '@/components/ui/input.jsx';
import { Spinner } from '@/components/ui/spinner.jsx';
import { ICON_OPTIONS } from '@/lib/icons';

const EMPTY = {
  name: '',
  description: '',
  url: '',
  iconName: 'Building2',
  categoryId: '',
  displayOrder: 0,
  isFeatured: false,
  searchKeywords: '',
};

export default function AdminPlatformFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const api = useApi();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories, reload } = useAppData();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const loadPlatform = useCallback(async () => {
    const { platforms } = await api.get('/admin/platforms');
    const p = platforms.find((x) => x.id === id);
    if (!p) {
      toast({ message: 'Platform not found.', variant: 'error' });
      navigate('/admin/platforms');
      return;
    }
    setForm({
      name: p.name,
      description: p.description,
      url: p.url,
      iconName: p.iconName,
      categoryId: p.categoryId,
      displayOrder: p.displayOrder,
      isFeatured: p.isFeatured,
      searchKeywords: (p.searchKeywords || []).join(', '),
    });
    setLoading(false);
  }, [api, id, navigate, toast]);

  useEffect(() => {
    if (isEdit) loadPlatform();
  }, [isEdit, loadPlatform]);

  // Default category selection once categories are available (create mode).
  useEffect(() => {
    if (!isEdit && !form.categoryId && categories.length > 0) {
      setForm((f) => ({ ...f, categoryId: categories[0].id }));
    }
  }, [isEdit, categories, form.categoryId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      name: form.name,
      description: form.description,
      url: form.url,
      iconName: form.iconName,
      categoryId: form.categoryId,
      displayOrder: Number(form.displayOrder) || 0,
      isFeatured: form.isFeatured,
      searchKeywords: form.searchKeywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (isEdit) {
        await api.put(`/admin/platforms/${id}`, payload);
        toast({ message: 'Platform updated' });
      } else {
        await api.post('/admin/platforms', payload);
        toast({ message: 'Platform created' });
      }
      await reload();
      navigate('/admin/platforms');
    } catch (err) {
      if (err.details) setErrors(err.details);
      toast({ message: err.message || 'Could not save platform.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-accent-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/admin/platforms" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to platforms
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        {isEdit ? 'Edit Platform' : 'Add Platform'}
      </h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Name" error={errors.name}>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={100} required />
          </Field>

          <Field label="Description" error={errors.description}>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              maxLength={500}
              required
            />
          </Field>

          <Field label="URL (https:// only)" error={errors.url}>
            <Input
              type="url"
              value={form.url}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://example.com/platform"
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Category" error={errors.categoryId}>
              <select
                value={form.categoryId}
                onChange={(e) => update('categoryId', e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus-visible:border-accent-500 focus-visible:outline-none"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Icon" error={errors.iconName}>
              <select
                value={form.iconName}
                onChange={(e) => update('iconName', e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus-visible:border-accent-500 focus-visible:outline-none"
              >
                {ICON_OPTIONS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Display order" error={errors.displayOrder}>
              <Input
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) => update('displayOrder', e.target.value)}
              />
            </Field>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => update('isFeatured', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus-visible:ring-accent-500"
                />
                Featured
              </label>
            </div>
          </div>

          <Field label="Search keywords (comma-separated)" error={errors.searchKeywords}>
            <Input
              value={form.searchKeywords}
              onChange={(e) => update('searchKeywords', e.target.value)}
              placeholder="leasing, applications, prospects"
            />
          </Field>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />}
              {isEdit ? 'Save Changes' : 'Create Platform'}
            </Button>
            <Link to="/admin/platforms" className="text-sm text-gray-500 hover:text-gray-800">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}
