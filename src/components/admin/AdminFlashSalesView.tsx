'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Tag, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { FlashSale, Product } from '@/types';

export function AdminFlashSalesView() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percentage: 20,
    start_at: '',
    end_at: '',
    is_active: false,
    product_ids: [] as string[]
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/admin/flash-sales');
      if (!res.ok) throw new Error('Failed to fetch flash sales');
      const data = await res.json();
      setSales(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const toggleProduct = (id: string) => {
    setFormData(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(id) 
        ? prev.product_ids.filter(p => p !== id)
        : [...prev.product_ids, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert local time to ISO strings
      const payload = {
        ...formData,
        start_at: new Date(formData.start_at).toISOString(),
        end_at: new Date(formData.end_at).toISOString(),
      };

      const res = await fetch('/api/admin/flash-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create flash sale');
      
      toast.success('Flash sale created successfully!');
      setShowForm(false);
      fetchSales();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/flash-sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Status updated');
      fetchSales();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteSale = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale?')) return;
    try {
      const res = await fetch(`/api/admin/flash-sales/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Sale deleted');
      fetchSales();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Flash Sales</h2>
          <p className="text-muted-foreground">Manage time-limited promotions and discounts.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-200">
          {showForm ? 'Cancel' : <><Plus className="h-4 w-4" /> Create Sale</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sale Title</label>
                <input
                  required
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Weekend Flash Sale"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Percentage (%)</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.discount_percentage}
                  onChange={e => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time (Local)</label>
                <input
                  required
                  type="datetime-local"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.start_at}
                  onChange={e => setFormData({ ...formData, start_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time (Local)</label>
                <input
                  required
                  type="datetime-local"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.end_at}
                  onChange={e => setFormData({ ...formData, end_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Products ({formData.product_ids.length} selected)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {products.map(p => (
                  <label key={p.id} className="flex items-center space-x-2 text-sm p-1 hover:bg-muted rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.product_ids.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="rounded border-input"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-input"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Activate immediately</label>
            </div>

            <button type="submit" className="w-full bg-luxe-accent text-white px-4 py-2 rounded-md font-medium hover:opacity-90">Create Flash Sale</button>
          </form>
        </div>
      )}

      {loading ? (
        <div>Loading sales...</div>
      ) : (
        <div className="grid gap-4">
          {sales.map(sale => {
            const isWindowActive = new Date() >= new Date(sale.start_at) && new Date() < new Date(sale.end_at);
            const status = sale.is_active ? (isWindowActive ? 'Active' : 'Expired / Scheduled') : 'Disabled';
            
            return (
              <div key={sale.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-card border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{sale.title}</h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {sale.discount_percentage}% OFF
                    </span>
                    {sale.is_active && isWindowActive ? (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Live
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {status}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(sale.start_at).toLocaleString()} - {new Date(sale.end_at).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Products included: {sale.products?.length || 0}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <button className="px-3 py-1.5 border border-input bg-background rounded-md text-sm hover:bg-accent hover:text-accent-foreground" onClick={() => toggleActive(sale.id, sale.is_active)}>
                    {sale.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md" onClick={() => deleteSale(sale.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
