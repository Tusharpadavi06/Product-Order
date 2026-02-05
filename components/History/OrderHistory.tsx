
import React, { useState, useEffect } from 'react';
import { Package, Search, Calendar, ChevronDown, ChevronUp, Clock, FileSpreadsheet } from 'lucide-react';
import { Order, OrderItem } from '../../types';

export const OrderHistory: React.FC = () => {
  const [history, setHistory] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const rawData = localStorage.getItem('ginza_order_history');
    if (rawData) {
      try {
        const parsed: Order[] = JSON.parse(rawData);
        
        // Retention Policy: 5 days
        const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        // Filter out orders older than 5 days
        const filtered = parsed.filter(order => (now - (order.timestamp || 0)) <= FIVE_DAYS_MS);
        
        if (filtered.length !== parsed.length) {
          localStorage.setItem('ginza_order_history', JSON.stringify(filtered));
        }
        
        setHistory(filtered);
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
  }, []);

  const filteredHistory = history.filter(order => 
    order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search recent orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none"
        />
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="h-3 w-3 text-indigo-500" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing Last 5 Days Only</span>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
          <Clock className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No recent submissions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((order: Order) => (
            <div 
              key={order.id} 
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
            >
              <div 
                className="px-5 py-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{order.id}</span>
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase">Synced</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{order.customer?.name} • {order.branch}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-700">₹{order.items.reduce((s: number, i: OrderItem) => s + i.total, 0).toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-black">{order.orderDate}</p>
                  </div>
                  {expandedId === order.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </div>

              {expandedId === order.id && (
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sales Person</p>
                      <p className="text-xs font-bold text-slate-700">{order.salesPerson}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Info</p>
                      <p className="text-xs font-bold text-slate-700">{order.customer?.contact_no}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[9px] font-black text-slate-500 uppercase">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((item: OrderItem) => (
                          <tr key={item.id} className="text-[11px]">
                            <td className="px-3 py-2">
                                <span className="font-bold">{item.itemName}</span>
                                <span className="text-[9px] text-slate-400 block">{item.quantity} {item.uom} @ ₹{item.rate}</span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold">₹{item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
