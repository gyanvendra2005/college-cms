import React, { useEffect, useState } from 'react';
import { challanService } from '../services/challanService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const SalesChallans: React.FC = () => {
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Form states
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);

  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const fetchData = async () => {
    try {
      const res = await challanService.getChallans();
      setChallans(res.data.challans);
    } catch (error) {
      toast.error('Failed to load sales challans');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customerService.getCustomers(),
        productService.getProducts()
      ]);
      setCustomers(custRes.data.customers);
      setProducts(prodRes.data.products);
      if (custRes.data.customers.length > 0) setCustomerId(custRes.data.customers[0].id);
      if (prodRes.data.products.length > 0) {
        setItems([{ productId: prodRes.data.products[0].id, quantity: 1 }]);
      }
    } catch (error) {
      toast.error('Failed to load form data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    loadDependencies();
    setShowModal(true);
  };

  const handleAddItem = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    if (field === 'productId') newItems[index].productId = value;
    if (field === 'quantity') newItems[index].quantity = parseInt(value, 10) || 1;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await challanService.createChallan({
        customerId,
        status,
        notes,
        items
      });
      toast.success('Sales Challan created successfully!');
      setShowModal(false);
      setItems([{ productId: products[0]?.id || '', quantity: 1 }]);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create challan');
    }
  };

  const handleConfirm = async (id: string) => {
    if (!window.confirm("Confirm this challan? This will deduct stock permanently.")) return;
    try {
      await challanService.confirmChallan(id);
      toast.success('Challan confirmed and stock deducted!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm challan');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sales Challans</h1>
        {canEdit && (
          <button 
            onClick={openModal}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            + Create Challan
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading challans...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="py-3 px-4">Challan #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Total Qty</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-sm text-slate-900">{c.challanNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{c.customer.businessName}</td>
                  <td className="py-3 px-4 text-slate-600">{c.totalQuantity} items</td>
                  <td className="py-3 px-4 text-slate-900">${c.totalAmount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      c.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right flex justify-end gap-2">
                    <a 
                      href={`/challans/${c.id}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
                    >
                      Download PDF
                    </a>
                    {c.status === 'DRAFT' && canEdit && (
                      <button 
                        onClick={() => handleConfirm(c.id)}
                        className="text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded transition-colors"
                      >
                        Confirm Order
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {challans.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No challans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Create Sales Challan</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                  <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900">
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.businessName} ({c.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="DRAFT">Save as Draft</option>
                    <option value="CONFIRMED">Direct Confirm (Deducts Stock)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-800">Line Items</h3>
                  <button type="button" onClick={handleAddItem} className="text-sm text-slate-600 hover:text-slate-900 font-medium">+ Add Item row</button>
                </div>
                
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 mb-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                      <select required value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900">
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.sku} - {p.name} (Stock: {p.currentStock})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                      <input required type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900" />
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(index)} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent">
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g. Urgent delivery" />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 mt-4 shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                  {status === 'CONFIRMED' ? 'Create & Confirm Challan' : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
