
import React, { useState, useEffect } from 'react';
import { Search, User as UserIcon, Plus, Check, Loader2, Trash2, Package, Truck, Hash, ReceiptText, Edit2, ShoppingBag, XCircle, Save, RefreshCw, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { submitToGoogleSheets } from '../../services/googleSheets';
import { toast } from 'react-hot-toast';
import { OrderItem, Order } from '../../types';
import { BRANCHES, CATEGORIES, UOMS, SALESMEN, GRADES } from '../../constants';
import { User } from '@supabase/supabase-js';

interface ItemState {
  category: string;
  grade: string;
  itemName: string;
  manualItem: boolean;
  color: string;
  width: string;
  uom: string;
  quantity: string;
  rate: string;
  discount: string;
  dispatchDate: string;
  remark: string;
}

const CATEGORY_DB_MAP: Record<string, string> = {
  'CKU': 'cku', 'WARP': 'warp', 'EMB': 'embroidary', 'HOOK & EYE': 'eye_n_hook',
  'ELASTIC': 'elastic', 'TLU': 'tlu', 'CROCHET': 'cro', 'VAU': 'vau', 
  'PRINTING': 'printing', 'CUP': 'cup'
};

const DRAFT_KEY = 'ginza_order_draft_v2';

const generateOrderId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  const time = Date.now().toString().slice(-4);
  return `GNZ-${random}-${time}`;
};

export const OrderForm: React.FC = () => {
  const getInitialState = () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const draft = getInitialState();

  const [orderId, setOrderId] = useState(draft?.orderId || generateOrderId());
  const [branch, setBranch] = useState(draft?.branch || '');
  const [salesPerson, setSalesPerson] = useState(draft?.salesPerson || '');
  const [salesContact, setSalesContact] = useState(draft?.salesContact || '');
  const [customerPONo, setCustomerPONo] = useState(draft?.customerPONo || '');
  const [transporterName, setTransporterName] = useState(draft?.transporterName || '');
  const [accountStatus, setAccountStatus] = useState(draft?.accountStatus || '');

  const [customerSearch, setCustomerSearch] = useState(draft?.customerSearch || '');
  const [customerEmail, setCustomerEmail] = useState(draft?.customerEmail || '');
  const [customerContact, setCustomerContact] = useState(draft?.customerContact || '');
  const [billingAddress, setBillingAddress] = useState(draft?.billingAddress || '');
  const [deliveryAddress, setDeliveryAddress] = useState(draft?.deliveryAddress || '');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<boolean>(draft?.selectedCustomer || false);

  const [currentItem, setCurrentItem] = useState<ItemState>(draft?.currentItem || {
    category: '', grade: '', itemName: '', manualItem: false, color: '', width: '', uom: '', 
    quantity: '', rate: '', discount: '', 
    dispatchDate: new Date().toISOString().split('T')[0], remark: ''
  });
  
  const [items, setItems] = useState<OrderItem[]>(draft?.items || []);
  const [itemSearch, setItemSearch] = useState(draft?.itemSearch || '');
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Auto-fill sales contact
  useEffect(() => {
    const found = SALESMEN.find(s => s.name === salesPerson);
    if (found) setSalesContact(found.contact);
  }, [salesPerson]);

  useEffect(() => {
    const dataToSave = {
      orderId, branch, salesPerson, salesContact, customerPONo, transporterName, accountStatus,
      customerSearch, customerEmail, customerContact, billingAddress, deliveryAddress,
      selectedCustomer, currentItem, items, itemSearch
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
    setLastSaved(Date.now());
  }, [
    orderId, branch, salesPerson, salesContact, customerPONo, transporterName, accountStatus,
    customerSearch, customerEmail, customerContact, billingAddress, deliveryAddress,
    selectedCustomer, currentItem, items, itemSearch
  ]);

  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 1 || selectedCustomer || !branch) { 
        if (customerSearch.length === 0) setCustomers([]);
        return; 
      }
      
      setIsSearchingCustomer(true);
      try {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('branch', branch)
          .or(`customer_name.ilike.%${customerSearch}%,mob_no.ilike.%${customerSearch}%`)
          .limit(10);
        setCustomers(data || []);
      } finally {
        setIsSearchingCustomer(false);
      }
    };
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, branch, selectedCustomer]);

  useEffect(() => {
    const fetchProducts = async () => {
      const dbCol = CATEGORY_DB_MAP[currentItem.category];
      if (!dbCol || itemSearch.length === 0) { setSuggestedProducts([]); return; }
      setIsSearchingProduct(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .not(dbCol, 'is', null)
        .neq(dbCol, '')
        .ilike(dbCol, `%${itemSearch}%`)
        .order(dbCol, { ascending: true })
        .limit(20);
      setSuggestedProducts(data || []);
      setIsSearchingProduct(false);
    };
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [itemSearch, currentItem.category]);

  const onSelectCustomer = (c: any) => {
    setCustomerSearch(c.customer_name);
    setCustomerEmail(c.email_id || '');
    setCustomerContact(c.mob_no || '');
    setBillingAddress(c.address || c.billing_address || '');
    setAccountStatus(c.account_status || ''); 
    setSelectedCustomer(true);
    setCustomers([]);
  };

  const onSelectProduct = (product: any) => {
    const category = currentItem.category;
    const dbCol = CATEGORY_DB_MAP[category];
    const pName = product[dbCol] || '';
    const pWidth = product[`width_${dbCol}`] || product.width || '';
    setCurrentItem({ ...currentItem, itemName: pName, width: String(pWidth), uom: product.uom || '' });
    setItemSearch(pName);
    setShowProductSuggestions(false);
  };

  const addItemToPreview = () => {
    let finalItemName = currentItem.itemName || itemSearch;
    
    if (!currentItem.category) { toast.error('Please select Category'); return; }
    if (!finalItemName.trim()) { toast.error('Item Name required'); return; }
    if (currentItem.category === 'ELASTIC' && !currentItem.grade) { toast.error('Please select Grade for Elastic'); return; }
    if (!currentItem.uom) { toast.error('Unit required'); return; }
    if (!currentItem.quantity || Number(currentItem.quantity) <= 0) { toast.error('Valid Quantity required'); return; }
    if (!currentItem.rate || Number(currentItem.rate) <= 0) { toast.error('Valid Rate required'); return; }

    // Logic for Elastic Grade formatting
    if (currentItem.category === 'ELASTIC') {
      finalItemName = `${finalItemName} - ${currentItem.grade}`;
    }

    const qty = Number(currentItem.quantity);
    const rate = Number(currentItem.rate);
    const disc = Number(currentItem.discount) || 0;
    
    const newItem: OrderItem = {
      id: editingId || crypto.randomUUID(),
      category: currentItem.category,
      itemName: finalItemName.trim(),
      manualItem: currentItem.manualItem,
      color: currentItem.color.trim() || 'STD',
      width: currentItem.width.trim() || 'STD',
      uom: currentItem.uom,
      quantity: qty,
      rate: rate,
      discount: disc,
      dispatchDate: currentItem.dispatchDate,
      transportName: transporterName,
      remark: currentItem.remark,
      total: (qty * rate) * (1 - (disc / 100))
    };

    if (editingId) {
      setItems(items.map((it: OrderItem) => it.id === editingId ? newItem : it));
      setEditingId(null);
      toast.success('Updated');
    } else {
      setItems(prev => [...prev, newItem]);
      toast.success('Added to list');
    }

    setItemSearch('');
    setCurrentItem({ 
      ...currentItem, 
      itemName: '', 
      grade: '',
      color: '', 
      width: '', 
      quantity: '', 
      rate: '', 
      discount: '', 
      remark: '' 
    });
  };

  const handleSubmitOrder = async () => {
    if (!customerSearch || !branch || !salesPerson || items.length === 0) {
      toast.error('Missing required form data'); 
      return;
    }
    setIsSubmitting(true);
    const order: Order = {
      id: orderId, 
      orderDate: new Date().toLocaleDateString('en-GB'),
      branch, 
      salesPerson, 
      customerPONo,
      customer: { id: '', name: customerSearch, email: customerEmail, contact_no: customerContact, address: billingAddress },
      billingAddress, 
      deliveryAddress, 
      accountStatus,
      items: items.map((it: OrderItem) => ({ ...it, transportName: transporterName })), 
      timestamp: Date.now()
    };
    
    const success = await submitToGoogleSheets(order);
    if (success) {
      const history = JSON.parse(localStorage.getItem('ginza_order_history') || '[]');
      localStorage.setItem('ginza_order_history', JSON.stringify([order, ...history]));
      toast.success('Order Submitted to Sheets');
      localStorage.removeItem(DRAFT_KEY);
      setItems([]); 
      setOrderId(generateOrderId());
    } else {
      toast.error('Submission failed. Check network.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Order Details</h3>
          <div className="bg-indigo-600 px-3 py-1 rounded-full text-[10px] font-black text-white tracking-widest">
            {orderId}
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold">
              <option value="">Select Branch</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Sales Person</label>
            <select value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold">
              <option value="">Select Salesman</option>
              {SALESMEN.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Sales Contact</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input type="text" readOnly value={salesContact} className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-indigo-500" />
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Customer Information</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Customer Name*</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(false); }} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Search customer..." />
                {isSearchingCustomer && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-500" />}
              </div>
              <AnimatePresence>
                {customers.length > 0 && !selectedCustomer && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                    {customers.map((c: any) => (
                      <button key={c.id} onClick={() => onSelectCustomer(c)} className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex flex-col border-b border-slate-50">
                        <span className="text-sm font-black text-slate-800">{c.customer_name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black">{c.mob_no} • {c.branch}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Customer PO No</label>
              <input type="text" value={customerPONo} onChange={(e) => setCustomerPONo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Billing Address</label>
              <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm h-16 resize-none font-bold" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Delivery Address</label>
                <button onClick={() => setDeliveryAddress(billingAddress)} className="text-[9px] font-black text-indigo-600 uppercase">Copy Billing</button>
              </div>
              <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm h-16 resize-none font-bold" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-indigo-600">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-600" />
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Item Entry</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Production Unit*</label>
              <select value={currentItem.category} onChange={(e) => { setCurrentItem({...currentItem, category: e.target.value, grade: ''}); setItemSearch(''); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none">
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            {currentItem.category === 'ELASTIC' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Grade*</label>
                <select value={currentItem.grade} onChange={(e) => setCurrentItem({...currentItem, grade: e.target.value})} className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-700">
                  <option value="">Select Grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}

            <div className={`relative space-y-1.5 ${currentItem.category === 'ELASTIC' ? 'md:col-span-1' : 'md:col-span-2'}`}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Item Name*</label>
              <div className="relative">
                <input type="text" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} onFocus={() => setShowProductSuggestions(true)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold" placeholder="Search product..." disabled={!currentItem.category} />
                {isSearchingProduct && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
              </div>
              <AnimatePresence>
                {showProductSuggestions && suggestedProducts.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute z-40 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {suggestedProducts.map((p, idx) => (
                      <button key={idx} onClick={() => onSelectProduct(p)} className="w-full px-4 py-3 text-left hover:bg-indigo-50 text-sm font-bold text-slate-700 border-b border-slate-50">
                        {p[CATEGORY_DB_MAP[currentItem.category]]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Unit*</label>
              <select value={currentItem.uom} onChange={(e) => setCurrentItem({...currentItem, uom: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold">
                <option value="">Select Unit</option>
                {UOMS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Color</label>
              <input type="text" value={currentItem.color} onChange={(e) => setCurrentItem({...currentItem, color: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold" placeholder="STD" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Width</label>
              <input type="text" value={currentItem.width} onChange={(e) => setCurrentItem({...currentItem, width: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold" placeholder="STD" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Quantity*</label>
              <input type="number" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})} className="w-full bg-white border-2 border-indigo-100 rounded-xl px-3 py-2.5 text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Rate (₹)*</label>
              <input type="number" value={currentItem.rate} onChange={(e) => setCurrentItem({...currentItem, rate: e.target.value})} className="w-full bg-white border-2 border-indigo-100 rounded-xl px-3 py-2.5 text-sm font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Delivery Date</label>
              <input type="date" value={currentItem.dispatchDate} onChange={(e) => setCurrentItem({...currentItem, dispatchDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Item Remark</label>
              <input type="text" value={currentItem.remark} onChange={(e) => setCurrentItem({...currentItem, remark: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold" placeholder="Any special instruction..." />
            </div>
            <button onClick={addItemToPreview} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg">
              {editingId ? <><Edit2 className="h-4 w-4" /> Update Item</> : <><Plus className="h-4 w-4" /> Add Item to Batch</>}
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden min-h-[200px]">
          <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-indigo-400" />
              <h3 className="text-white font-black text-[11px] uppercase tracking-widest">Order Summary ({items.length})</h3>
            </div>
            {items.length > 0 && (
              <div className="text-sm font-black text-indigo-400 uppercase tracking-widest">
                Total: ₹{items.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            {items.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-2">
                <ShoppingBag className="h-10 w-10 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No items added yet</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Item Details</th>
                    <th className="px-6 py-4 text-right">Qty/Unit</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((i) => (
                    <tr key={i.id} className="text-sm">
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-900">{i.itemName}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase">{i.category} • {i.color} • {i.width}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-black text-slate-800">{i.quantity} {i.uom}</p>
                        <p className="text-[10px] text-slate-400 font-black">@ ₹{i.rate}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-black text-slate-900">₹{i.total.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setEditingId(i.id); setCurrentItem({...currentItem, category: i.category, itemName: i.itemName, uom: i.uom, quantity: String(i.quantity), rate: String(i.rate)}); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => setItems(items.filter(x => x.id !== i.id))} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center py-6">
          {items.length > 0 && (
            <button onClick={handleSubmitOrder} disabled={isSubmitting} className="flex items-center gap-3 px-12 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95">
              {isSubmitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /><span className="text-xs font-black uppercase tracking-widest">Submitting...</span></>
              ) : (
                <><Check className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-widest">Submit Final Order</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
