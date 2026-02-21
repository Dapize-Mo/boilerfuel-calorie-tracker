import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';

export default function CustomFoods() {
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
  }, [status]);

  const fetchCustomFoods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/custom-foods', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCustomFoods(data.custom_foods || []);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load custom foods');
      }
    } catch (err) {
      setError('Network error loading custom foods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate
    if (!formData.name.trim()) {
      setError('Food name is required');
      return;
    }
    if (!formData.calories || formData.calories < 0) {
      setError('Valid calories value is required');
      return;
    }

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(editingId ? 'Food updated successfully!' : 'Food created successfully!');
        resetForm();
        fetchCustomFoods();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to save food');
      }
    } catch (err) {
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
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this food?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/custom-foods/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (res.ok) {
        setSuccess('Food deleted successfully!');
        fetchCustomFoods();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to delete food');
      }
    } catch (err) {
      setError('Network error deleting food');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      serving_size: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="text-lg">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-center">Please sign in to manage your custom foods.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Custom Foods</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : '+ Add Custom Food'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
            {success}
          </div>
        )}

        {showForm && (
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Custom Food' : 'Add New Custom Food'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Food Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Homemade Chicken Salad"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Calories *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Serving Size</label>
                  <input
                    type="text"
                    value={formData.serving_size}
                    onChange={(e) => setFormData({ ...formData, serving_size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="1 cup, 100g, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.carbs}
                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fats (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.fats}
                    onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Any additional notes about this food..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {loading ? 'Saving...' : (editingId ? 'Update Food' : 'Add Food')}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Your Custom Foods ({customFoods.length})</h2>
          </div>

          {loading && customFoods.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Loading...
            </div>
          ) : customFoods.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">No custom foods yet.</p>
              <p className="text-sm">Click &ldquo;Add Custom Food&rdquo; to create your first one!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {customFoods.map((food) => (
                <div key={food.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{food.name}</h3>
                      {food.serving_size && (
                        <p className="text-sm text-gray-600 mt-1">Serving: {food
.serving_size}</p>
                      )}
                      <div className="mt-2 flex gap-4 text-sm">
                        <span className="font-medium">{food.calories} cal</span>
                        <span className="text-gray-600">P: {food.macros.protein}g</span>
                        <span className="text-gray-600">C: {food.macros.carbs}g</span>
                        <span className="text-gray-600">F: {food.macros.fats}g</span>
                      </div>
                      {food.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">{food.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(food)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(food.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
