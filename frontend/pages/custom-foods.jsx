import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function CustomFoods() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [customFoods, setCustomFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    serving_size: '',
    notes: ''
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCustomFoods();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchCustomFoods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/custom-foods', {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomFoods(data.custom_foods || []);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load custom foods');
      }
    } catch {
      setError('Network error loading custom foods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) { setError('Food name is required'); return; }
    if (!formData.calories || formData.calories < 0) { setError('Valid calories value is required'); return; }

    const payload = {
      name: formData.name.trim(),
      calories: parseInt(formData.calories),
      macros: {
        protein: parseInt(formData.protein) || 0,
        carbs: parseInt(formData.carbs) || 0,
        fats: parseInt(formData.fats) || 0
      },
      serving_size: formData.serving_size.trim() || null,
      notes: formData.notes.trim() || null
    };

    try {
      setLoading(true);
      const url = editingId ? `/api/custom-foods/${editingId}` : '/api/custom-foods';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.accessToken}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(editingId ? 'Food updated.' : 'Food added.');
        resetForm();
        fetchCustomFoods();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to save food');
      }
    } catch {
      setError('Network error saving food');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (food) => {
    setEditingId(food.id);
    setFormData({
      name: food.name,
      calories: food.calories.toString(),
      protein: food.macros.protein.toString(),
      carbs: food.macros.carbs.toString(),
      fats: food.macros.fats.toString(),
      serving_size: food.serving_size || '',
      notes: food.notes || ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this food?')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/custom-foods/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (res.ok) {
        setSuccess('Food deleted.');
        fetchCustomFoods();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to delete food');
      }
    } catch {
      setError('Network error deleting food');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', calories: '', protein: '', carbs: '', fats: '', serving_size: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const inputCls = 'w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-sm font-mono placeholder:text-theme-text-tertiary/40 focus:outline-none focus:border-theme-text-primary/50 transition-colors';
  const labelCls = 'block text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-1.5';

  return (
    <>
      <Head>
        <title>Custom Foods - BoilerFuel</title>
        <meta name="description" content="Manage your custom food entries" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-20 space-y-10">

          {/* Header */}
          <header className="space-y-4">
            <button onClick={() => router.back()} className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </button>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Custom Foods</h1>
            <div className="w-12 h-px bg-theme-text-primary/30" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              Personal food library
            </p>
          </header>

          {/* Auth gate */}
          {status === 'loading' && (
            <div className="text-xs uppercase tracking-widest text-theme-text-tertiary py-12">Loading...</div>
          )}

          {status === 'unauthenticated' && (
            <div className="border border-theme-text-primary/20 px-6 py-8 space-y-3">
              <p className="text-xs uppercase tracking-widest text-theme-text-tertiary">Sign-in required</p>
              <p className="text-sm text-theme-text-secondary">Please sign in to manage your custom foods.</p>
            </div>
          )}

          {status === 'authenticated' && (
            <>
              {/* Status messages */}
              {error && (
                <div className="border border-theme-text-primary/30 px-4 py-3 text-xs text-theme-text-secondary uppercase tracking-wider">
                  {error}
                </div>
              )}
              {success && (
                <div className="border border-theme-text-primary/20 px-4 py-3 text-xs text-theme-text-tertiary uppercase tracking-wider">
                  {success}
                </div>
              )}

              {/* Add / Edit form */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-theme-text-primary/10 pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">
                    {showForm ? (editingId ? 'Edit Food' : 'New Food') : `Your Foods (${customFoods.length})`}
                  </h2>
                  <button
                    onClick={() => { if (showForm) resetForm(); else { setShowForm(true); setError(''); setSuccess(''); } }}
                    className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors border-b border-theme-text-primary/20"
                  >
                    {showForm ? 'Cancel' : '+ Add Food'}
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={handleSubmit} className="border border-theme-text-primary/10 p-6 space-y-5">
                    {/* Name */}
                    <div>
                      <label className={labelCls}>Food Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={inputCls}
                        placeholder="e.g., Homemade Chicken Salad"
                        required
                      />
                    </div>

                    {/* Calories + Serving */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Calories *</label>
                        <input
                          type="number" min="0"
                          value={formData.calories}
                          onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                          className={inputCls}
                          placeholder="300"
                          required
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Serving Size</label>
                        <input
                          type="text"
                          value={formData.serving_size}
                          onChange={(e) => setFormData({ ...formData, serving_size: e.target.value })}
                          className={inputCls}
                          placeholder="1 cup, 100g, etc."
                        />
                      </div>
                    </div>

                    {/* Macros */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { key: 'protein', label: 'Protein (g)', placeholder: '25' },
                        { key: 'carbs',   label: 'Carbs (g)',   placeholder: '30' },
                        { key: 'fats',    label: 'Fats (g)',    placeholder: '10' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className={labelCls}>{label}</label>
                          <input
                            type="number" min="0"
                            value={formData[key]}
                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                            className={inputCls}
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className={labelCls}>Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className={`${inputCls} resize-none`}
                        rows="2"
                        placeholder="Any additional notes..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-px pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-theme-text-primary text-theme-bg-primary text-xs font-bold uppercase tracking-widest hover:bg-theme-text-secondary transition-colors disabled:opacity-40"
                      >
                        {loading ? 'Saving...' : (editingId ? 'Update Food' : 'Add Food')}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-2.5 border border-theme-text-primary/20 text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </section>

              {/* Foods list */}
              {!showForm && (
                <section className="space-y-4">
                  {loading && customFoods.length === 0 ? (
                    <div className="text-xs uppercase tracking-widest text-theme-text-tertiary py-12">Loading...</div>
                  ) : customFoods.length === 0 ? (
                    <div className="border border-theme-text-primary/10 px-4 py-10 text-center space-y-2">
                      <p className="text-xs uppercase tracking-widest text-theme-text-tertiary">No custom foods yet</p>
                      <p className="text-[10px] text-theme-text-tertiary/60">Click + Add Food to create your first entry</p>
                    </div>
                  ) : (
                    <div className="border border-theme-text-primary/10 divide-y divide-theme-text-primary/5">
                      {customFoods.map((food) => (
                        <div key={food.id} className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-theme-bg-secondary transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate">{food.name}</p>
                            <p className="text-[10px] text-theme-text-tertiary mt-0.5 font-mono">
                              {food.calories} cal
                              {food.serving_size && <span className="ml-2 opacity-60">{food.serving_size}</span>}
                            </p>
                            <p className="text-[10px] text-theme-text-tertiary/70 font-mono mt-0.5">
                              P {food.macros.protein}g &middot; C {food.macros.carbs}g &middot; F {food.macros.fats}g
                            </p>
                            {food.notes && (
                              <p className="text-[10px] text-theme-text-tertiary/50 mt-1 italic truncate">{food.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-3 shrink-0 pt-0.5">
                            <button
                              onClick={() => handleEdit(food)}
                              className="text-[10px] uppercase tracking-wider text-theme-text-tertiary/50 hover:text-theme-text-primary transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(food.id)}
                              className="text-[10px] uppercase tracking-wider text-theme-text-tertiary/40 hover:text-theme-text-primary transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/stats" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Stats</Link>
              <Link href="/compare" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Compare</Link>
              <Link href="/profile" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Profile</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
              <Link href="/changelog" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Changelog</Link>
              <Link href="/privacy" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Privacy</Link>
              <Link href="/admin" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Admin</Link>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary/40">BoilerFuel · {new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>
    </>
  );
}

CustomFoods.getLayout = (page) => page;
