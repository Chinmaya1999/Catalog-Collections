import React, { useEffect, useState } from 'react';
import { Edit, ImagePlus, Loader2, PackageSearch, Save, Trash2, X } from 'lucide-react';
import { API_ENDPOINTS, getImageUrl } from '../../config/api';

const emptyForm = {
  name: '',
  brand: '',
  material: '',
  description: '',
  price: '',
  categoryName: '',
  badges: '',
  imageUrl: '',
  isPublished: false,
  status: 'pending'
};

const ProductManagementTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductEditor, setShowProductEditor] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.productExtraction}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setProducts(await response.json());
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const getPrimaryImage = (product) => product.images?.find(image => image.isPrimary) || product.images?.[0];

  const startEditing = (product) => {
    const primaryImage = getPrimaryImage(product);
    const price = product.variants?.[0]?.sellingPrice ?? product.variants?.[0]?.mrp ?? product.priceFrom ?? '';
    setEditingProduct(product);
    setShowProductEditor(true);
    setSelectedImageFiles([]);
    setForm({
      name: product.name || '',
      brand: product.brand || '',
      material: product.material || '',
      description: product.description || '',
      price,
      categoryName: product.categoryName || product.categoryNames?.[0] || '',
      badges: (product.badges || []).join(', '),
      imageUrl: primaryImage?.path || '',
      isPublished: Boolean(product.isPublished),
      status: product.status || 'pending'
    });
  };

  const closeEditor = () => {
    setEditingProduct(null);
    setShowProductEditor(false);
    setForm(emptyForm);
    setSelectedImageFiles([]);
  };

  const startCreating = () => {
    setEditingProduct(null);
    setShowProductEditor(true);
    setSelectedImageFiles([]);
    setForm({ ...emptyForm, isPublished: true, status: 'approved' });
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !editingProduct) return;

    const data = new FormData();
    files.forEach(file => data.append('images', file));
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.productExtraction}/products/${editingProduct._id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });
      const updatedProduct = await response.json();
      if (!response.ok) throw new Error(updatedProduct.message || 'Image upload failed');
      setProducts(current => current.map(product => product._id === updatedProduct._id ? updatedProduct : product));
      startEditing(updatedProduct);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!editingProduct) {
        const createResponse = await fetch(`${API_ENDPOINTS.productExtraction}/products`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            brand: form.brand || null,
            material: form.material || null,
            description: form.description || null,
            categoryName: form.categoryName || null,
            badges: form.badges.split(',').map(value => value.trim()).filter(Boolean),
            price: form.price,
            isPublished: form.isPublished,
            status: form.status
          })
        });
        let createdProduct = await createResponse.json();
        if (!createResponse.ok) throw new Error(createdProduct.message || 'Product creation failed');

        if (selectedImageFiles.length > 0) {
          const imageData = new FormData();
          selectedImageFiles.forEach(file => imageData.append('images', file));
          const imageResponse = await fetch(`${API_ENDPOINTS.productExtraction}/products/${createdProduct._id}/images`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: imageData
          });
          createdProduct = await imageResponse.json();
          if (!imageResponse.ok) throw new Error(createdProduct.message || 'Image upload failed');
        }

        setProducts(current => [createdProduct, ...current]);
        closeEditor();
        return;
      }
      const currentImage = getPrimaryImage(editingProduct);
      const variants = [...(editingProduct.variants || [])];
      if (variants.length === 0) variants.push({});
      variants[0] = { ...variants[0], sellingPrice: form.price === '' ? null : Number(form.price) };

      const response = await fetch(`${API_ENDPOINTS.productExtraction}/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand || null,
          material: form.material || null,
          description: form.description || null,
          badges: form.badges.split(',').map(value => value.trim()).filter(Boolean),
          variants,
          images: form.imageUrl && currentImage
            ? editingProduct.images.map(image => image._id === currentImage._id ? { ...image, path: form.imageUrl } : image)
            : editingProduct.images,
          categoryName: form.categoryName || null,
          isPublished: form.isPublished,
          status: form.status
        })
      });
      const updatedProduct = await response.json();
      if (!response.ok) throw new Error(updatedProduct.message || 'Product update failed');
      setProducts(current => current.map(product => product._id === updatedProduct._id ? updatedProduct : product));
      closeEditor();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.name || 'this product'}?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.productExtraction}/products/${product._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Product could not be deleted');
      setProducts(current => current.filter(item => item._id !== product._id));
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-yellow-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shop Product Management</h2>
          <p className="mt-1 text-gray-600">Edit the products, images, prices and details shown on the public Shop page.</p>
        </div>
        <div className="flex items-center gap-3"><button onClick={startCreating} className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-yellow-500">+ Add Product</button><span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-800">{products.length} products</span></div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-lg"><PackageSearch className="mx-auto mb-3 h-12 w-12 text-gray-300" /><p className="text-gray-500">No products found.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map(product => {
            const primaryImage = getPrimaryImage(product);
            return (
              <div key={product._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="relative h-52 bg-gray-100">
                  {primaryImage ? <img src={getImageUrl(primaryImage.path)} alt={product.name || 'Product'} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center"><PackageSearch className="h-10 w-10 text-gray-300" /></div>}
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${product.isPublished ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{product.isPublished ? 'Published' : 'Hidden'}</span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-yellow-600">{product.categoryName || 'Uncategorized'}</p>
                  <h3 className="mt-1 line-clamp-2 text-lg font-bold text-gray-900">{product.name || 'Unnamed product'}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">{product.description || 'No description'}</p>
                  <p className="mt-3 font-bold text-gray-900">{product.priceFrom == null ? 'Price on request' : `₹${product.priceFrom.toLocaleString('en-IN')}`}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEditing(product)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm font-bold text-white hover:bg-blue-600"><Edit className="h-4 w-4" /> Edit</button>
                    <button onClick={() => handleDelete(product)} className="inline-flex items-center justify-center rounded-lg bg-red-100 px-3 py-2 text-red-600 hover:bg-red-200" aria-label={`Delete ${product.name || 'product'}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showProductEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSave} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between"><h3 className="text-2xl font-bold text-gray-900">{editingProduct ? 'Edit Shop Product' : 'Add Shop Product'}</h3><button type="button" onClick={closeEditor} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close editor"><X className="h-5 w-5" /></button></div>
            <div className="grid gap-5 sm:grid-cols-2">
              {['name', 'brand', 'material', 'categoryName', 'price'].map(field => <label key={field} className="block text-sm font-semibold text-gray-700">{field === 'categoryName' ? 'Category' : field === 'price' ? 'Price' : field.charAt(0).toUpperCase() + field.slice(1)}<input type={field === 'price' ? 'number' : 'text'} value={form[field]} onChange={event => setForm({ ...form, [field]: event.target.value })} className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-yellow-400 focus:outline-none" /></label>)}
            </div>
            <label className="mt-5 block text-sm font-semibold text-gray-700">Description<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} rows="4" className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-yellow-400 focus:outline-none" /></label>
            <label className="mt-5 block text-sm font-semibold text-gray-700">Badges <input value={form.badges} onChange={event => setForm({ ...form, badges: event.target.value })} placeholder="New, Bestseller" className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-yellow-400 focus:outline-none" /></label>
            <label className="mt-5 block text-sm font-semibold text-gray-700">Image URL <input value={form.imageUrl} onChange={event => setForm({ ...form, imageUrl: event.target.value })} className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-yellow-400 focus:outline-none" /></label>
            <label className="mt-5 flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 hover:border-yellow-400"><ImagePlus className="h-5 w-5" /> {editingProduct ? 'Upload more product images' : 'Choose product images'}<input type="file" accept="image/*" multiple onChange={event => editingProduct ? handleImageUpload(event) : setSelectedImageFiles(Array.from(event.target.files || []))} className="hidden" /></label>
            {!editingProduct && selectedImageFiles.length > 0 && <p className="mt-2 text-xs text-gray-500">{selectedImageFiles.length} image{selectedImageFiles.length === 1 ? '' : 's'} selected</p>}
            <div className="mt-5 flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isPublished} onChange={event => setForm({ ...form, isPublished: event.target.checked })} className="h-5 w-5 accent-yellow-400" /> Show in Shop</label><label className="flex items-center gap-2 text-sm font-semibold">Status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })} className="rounded-lg border border-gray-300 px-2 py-1"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label></div>
            <div className="mt-7 flex gap-3"><button type="button" onClick={closeEditor} className="flex-1 rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 hover:bg-gray-200">Cancel</button><button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-gray-900 hover:bg-yellow-500 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save changes'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductManagementTab;
