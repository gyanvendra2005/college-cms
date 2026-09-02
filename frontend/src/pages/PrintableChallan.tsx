import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { challanService } from '../services/challanService';
import { format } from 'date-fns';

export const PrintableChallan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallan = async () => {
      try {
        const res = await challanService.getChallanById(id!);
        setChallan(res.data);
      } catch (error) {
        console.error('Failed to load challan', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchChallan();
  }, [id]);

  useEffect(() => {
    if (!loading && challan) {
      // Trigger print dialog automatically when loaded
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, challan]);

  if (loading) return <div className="p-8 text-center">Loading Invoice...</div>;
  if (!challan) return <div className="p-8 text-center text-red-500">Invoice not found</div>;

  return (
    <div className="bg-white min-h-screen text-black p-10 max-w-4xl mx-auto">
      {/* Hide back button when printing */}
      <div className="print:hidden mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="text-slate-500 hover:text-slate-900 underline"
        >
          &larr; Back to Challans
        </button>
      </div>

      <div className="border border-slate-300 p-8 rounded">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">FOOTWEAR RETAIL</h1>
            <p className="text-sm text-slate-500 mt-1">123 Industrial Parkway, New Delhi</p>
            <p className="text-sm text-slate-500">contact@footwearretail.in | +91 6396491411</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-slate-800">TAX INVOICE / CHALLAN</h2>
            <p className="text-slate-600 font-medium mt-1">#{challan.challanNumber}</p>
            <p className="text-sm text-slate-500">Date: {format(new Date(challan.createdAt), 'dd MMM yyyy')}</p>
            <p className="text-sm text-slate-500">Status: <span className="font-semibold">{challan.status}</span></p>
          </div>
        </div>

        <div className="mb-10 p-4 bg-slate-50 border border-slate-200 rounded">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To:</h3>
          <p className="text-lg font-bold text-slate-800">{challan.customer.businessName}</p>
          <p className="text-slate-600">{challan.customer.name}</p>
          {challan.customer.address && <p className="text-slate-600">{challan.customer.address}</p>}
          <p className="text-slate-600">{challan.customer.email} | {challan.customer.mobile}</p>
          {challan.customer.gstNumber && <p className="text-slate-600 font-medium mt-1">GSTIN: {challan.customer.gstNumber}</p>}
        </div>

        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="border-b-2 border-slate-300 text-slate-700">
              <th className="py-3 px-2">Item / Description</th>
              <th className="py-3 px-2">SKU</th>
              <th className="py-3 px-2 text-right">Qty</th>
              <th className="py-3 px-2 text-right">Unit Price</th>
              <th className="py-3 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-4 px-2 text-slate-800 font-medium">{item.productNameSnapshot}</td>
                <td className="py-4 px-2 text-slate-500 text-sm">{item.skuSnapshot}</td>
                <td className="py-4 px-2 text-right text-slate-800">{item.quantity}</td>
                <td className="py-4 px-2 text-right text-slate-800">${item.unitPriceSnapshot.toFixed(2)}</td>
                <td className="py-4 px-2 text-right text-slate-900 font-semibold">${item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-16">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-800 font-medium">${challan.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold">
              <span className="text-slate-900">Total Amount</span>
              <span className="text-slate-900">${challan.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-300 pt-8 flex justify-between items-end text-sm text-slate-500">
          <div>
            <p className="font-semibold text-slate-700 mb-1">Terms & Conditions:</p>
            <p>1. Goods once sold cannot be returned.</p>
            <p>2. Subject to Metro City jurisdiction.</p>
            {challan.notes && <p className="mt-2 text-slate-700"><strong>Notes:</strong> {challan.notes}</p>}
          </div>
          <div className="text-center">
            <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
            <p>Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
