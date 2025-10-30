import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { apiCall } from '../utils/auth';

export default function AdminExercises() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    calories_per_hour: '300',
    category: 'other',
    intensity: 'moderate',
    muscle_groups: [],
    equipment: '',
    description: '',
  });

  const successTimeout = useRef(null);

  const CATEGORIES = ['cardio', 'strength', 'flexibility', 'sports', 'other'];
  const INTENSITIES = ['light', 'moderate', 'vigorous'];
  const MUSCLE_GROUPS = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'abs', 'core', 'obliques', 'legs', 'glutes', 'hamstrings',
    'calves', 'full body'
  ];

  useEffect(() => {
    loadActivities();
    return () => {
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
    };
  }, []);

  async function loadActivities() {
    try {
      const data = await apiCall('/api/activities');
      setActivities(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to load activities.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      calories_per_hour: '300',
      category: 'other',
      intensity: 'moderate',
      muscle_groups: [],
      equipment: '',
      description: '',
    });
    setEditingId(null);
    setShowForm(false);
    setFormError('');
  }

  function handleEdit(activity) {
    setFormData({
      name: activity.name,
      calories_per_hour: String(activity.calories_per_hour),
      category: activity.category || 'other',
      intensity: activity.intensity || 'moderate',
      muscle_groups: activity.muscle_groups || [],
      equipment: activity.equipment || '',
      description: activity.description || '',
    });
    setEditingId(activity.id);
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setFormError('Exercise name is required.');
      return;
    }

    const caloriesValue = Number(formData.calories_per_hour);
    if (!Number.isInteger(caloriesValue) || caloriesValue <= 0) {
      setFormError('Calories per hour must be a positive number.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        calories_per_hour: caloriesValue,
        category: formData.category,
        intensity: formData.intensity,
        muscle_groups: formData.muscle_groups,
        equipment: formData.equipment.trim() || null,
        description: formData.description.trim() || null,
      };

      if (editingId) {
        // Update existing
        await apiCall(`/api/activities/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess('Exercise updated successfully!');
      } else {
        // Create new
        await apiCall('/api/activities', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess('Exercise created successfully!');
      }

      await loadActivities();
      resetForm();

      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
      successTimeout.current = setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err?.message || 'Failed to save exercise.');
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete exercise "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await apiCall(`/api/activities/${id}`, { method: 'DELETE' });
      await loadActivities();
      setSuccess('Exercise deleted successfully!');

      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
      successTimeout.current = setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to delete exercise.');
    }
  }

  function toggleMuscleGroup(group) {
    setFormData((prev) => {
      const groups = prev.muscle_groups.includes(group)
        ? prev.muscle_groups.filter((g) => g !== group)
        : [...prev.muscle_groups, group];
      return { ...prev, muscle_groups: groups };
    });
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - Admin Exercises</title>
        </Head>
        <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary flex items-center justify-center">
          <div className="text-xl">Loading exercises...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Exercises - BoilerFuel</title>
        <meta name="description" content="Manage exercises and activities" />
      </Head>
      <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Navigation */}
          <nav className="flex items-center gap-4 text-sm text-theme-text-tertiary">
            <Link href="/" className="hover:text-yellow-400 transition-colors">← Home</Link>
            <span>|</span>
            <Link href="/gym" className="hover:text-yellow-400 transition-colors">Gym Dashboard</Link>
            <span>|</span>
            <Link href="/admin" className="hover:text-yellow-400 transition-colors">Admin</Link>
          </nav>

          {/* Header */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold">🏋️ Exercise Manager</h1>
              <p className="text-theme-text-tertiary">Add, edit, and manage workout exercises</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="self-start rounded bg-orange-500 px-4 py-2 font-semibold text-slate-900 hover:bg-orange-600 transition-colors"
            >
              {showForm ? 'Cancel' : '+ New Exercise'}
            </button>
          </header>

          {error && (
            <div className="rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
              {success}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <section className="border border-theme-border-primary rounded p-6 bg-theme-bg-secondary">
              <h2 className="text-2xl font-bold mb-4">
                {editingId ? 'Edit Exercise' : 'New Exercise'}
              </h2>

              {formError && (
                <div className="mb-4 rounded border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                      Exercise Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="calories" className="mb-2 block text-sm font-medium">
                      Calories per Hour *
                    </label>
                    <input
                      id="calories"
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={formData.calories_per_hour}
                      onChange={(e) => setFormData({ ...formData, calories_per_hour: e.target.value })}
                      className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="mb-2 block text-sm font-medium">
                      Category *
                    </label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="intensity" className="mb-2 block text-sm font-medium">
                      Intensity *
                    </label>
                    <select
                      id="intensity"
                      value={formData.intensity}
                      onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
                      className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {INTENSITIES.map((int) => (
                        <option key={int} value={int}>
                          {int.charAt(0).toUpperCase() + int.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="equipment" className="mb-2 block text-sm font-medium">
                      Equipment (Optional)
                    </label>
                    <input
                      id="equipment"
                      type="text"
                      value={formData.equipment}
                      onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                      placeholder="e.g., barbell, dumbbell"
                      className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Muscle Groups (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {MUSCLE_GROUPS.map((group) => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => toggleMuscleGroup(group)}
                        className={`px-3 py-2 rounded text-sm transition-colors ${
                          formData.muscle_groups.includes(group)
                            ? 'bg-orange-500 text-slate-900 font-semibold'
                            : 'bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-hover'
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="mb-2 block text-sm font-medium">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder="Brief description of the exercise..."
                    className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded bg-orange-500 px-4 py-2 font-semibold text-slate-900 hover:bg-orange-600 transition-colors"
                  >
                    {editingId ? 'Update Exercise' : 'Create Exercise'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-hover transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exercises List */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">
              Exercises ({filteredActivities.length})
            </h2>

            {filteredActivities.length === 0 ? (
              <p className="text-theme-text-tertiary">No exercises found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActivities.map((activity) => (
                  <article
                    key={activity.id}
                    className="p-4 border border-theme-border-primary rounded hover:border-orange-500 transition-colors bg-theme-bg-primary/50"
                  >
                    <h3 className="font-bold text-lg mb-2">{activity.name}</h3>
                    <div className="space-y-1 text-sm text-theme-text-secondary mb-3">
                      <p>🔥 {activity.calories_per_hour} cal/hr</p>
                      <p>📁 Category: {activity.category || 'other'}</p>
                      <p>⚡ Intensity: {activity.intensity || 'moderate'}</p>
                      {activity.equipment && <p>🏋️ Equipment: {activity.equipment}</p>}
                      {activity.muscle_groups && activity.muscle_groups.length > 0 && (
                        <p>💪 Muscles: {activity.muscle_groups.join(', ')}</p>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-xs text-theme-text-tertiary italic mb-3">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(activity)}
                        className="flex-1 px-3 py-1 rounded bg-blue-500 text-slate-900 text-sm font-semibold hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(activity.id, activity.name)}
                        className="px-3 py-1 rounded bg-red-500 text-slate-900 text-sm font-semibold hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
