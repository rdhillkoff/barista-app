'use client';

import React, { useState, useEffect } from 'react';
import { Bell, PlusCircle, PackageCheck, Clock, CheckCircle, QrCode, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Order, Product } from '@/types/product';

export default function StaffDashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'manage-products' | 'qrcode'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appUrl, setAppUrl] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');

  const [formState, setFormState] = useState({
    sku: '',
    name: '',
    category: 'อุปกรณ์บาร์',
    brand: '',
    color: '',
    price: '',
    image: '',
  });

  useEffect(() => {
    setAppUrl(window.location.origin);
    setOrders(JSON.parse(localStorage.getItem('barista_orders') || '[]'));
    setProducts(JSON.parse(localStorage.getItem('barista_products') || '[]'));

    const channel = new BroadcastChannel('order_channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_ORDER') {
        setOrders(prev => [event.data.order, ...prev]);
      }
    };
    return () => channel.close();
  }, []);

  const syncProducts = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('barista_products', JSON.stringify(updated));
    const channel = new BroadcastChannel('order_channel');
    channel.postMessage({ type: 'PRODUCTS_UPDATED' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scale = MAX_WIDTH / img.width;
        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? img.height * scale : img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        setFormState(prev => ({ ...prev, image: compressed }));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.sku || !formState.name || !formState.price) return;

    const productData: Product = {
      id: editingId || Date.now().toString(),
      sku: formState.sku,
      name: formState.name,
      category: formState.category,
      brand: formState.brand || '-',
      color: formState.color || '-',
      price: Number(formState.price),
      image: formState.image,
    };

    const updated = editingId
      ? products.map(p => (p.id === editingId ? productData : p))
      : [productData, ...products];

    syncProducts(updated);
    alert(editingId ? 'อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว!' : 'เพิ่มสินค้าใหม่เข้าระบบเรียบร้อยแล้ว!');
    resetForm();
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setFormState({
      sku: product.sku,
      name: product.name,
      category: product.category,
      brand: product.brand === '-' ? '' : product.brand,
      color: product.color === '-' ? '' : product.color,
      price: product.price.toString(),
      image: product.image || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = (product: Product) => {
    if (!confirm(`ต้องการลบสินค้า "${product.name}" (${product.sku}) ออกจากระบบใช่หรือไม่?`)) return;
    syncProducts(products.filter(p => p.id !== product.id));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormState({ sku: '', name: '', category: 'อุปกรณ์บาร์', brand: '', color: '', price: '', image: '' });
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updated = orders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o));
    setOrders(updated);
    localStorage.setItem('barista_orders', JSON.stringify(updated));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <h1 className="font-bold text-lg">ระบบรับออเดอร์หน้าร้าน (Staff Dashboard)</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'orders' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              ออเดอร์เข้า ({orders.filter(o => o.status !== 'completed').length})
            </button>
            <button
              onClick={() => setActiveTab('manage-products')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                activeTab === 'manage-products' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> จัดการสินค้า (เพิ่ม/แก้ไข/ลบ)
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                activeTab === 'qrcode' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <QrCode className="w-4 h-4" /> QR ห้องเทรน
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center text-slate-500 border border-slate-200">
                ยังไม่มีรายการสั่งซื้อจากห้องเทรนในขณะนี้
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className={`bg-white p-5 rounded-xl border-l-8 shadow-sm ${
                    order.status === 'pending' ? 'border-l-rose-500' : order.status === 'preparing' ? 'border-l-amber-500' : 'border-l-emerald-500 opacity-75'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 mr-2">#{order.id}</span>
                      <span className="font-bold text-lg text-slate-900">{order.customerName}</span>
                      <span className="text-xs text-slate-400 ml-3">สั่งเมื่อ {order.createdAt} น.</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
                          <Clock className="w-4 h-4" /> รับออเดอร์ / กำลังจัดของ
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'completed')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
                          <PackageCheck className="w-4 h-4" /> จัดของเสร็จพร้อมส่งมอบ
                        </button>
                      )}
                      {order.status === 'completed' && (
                        <span className="text-emerald-600 font-bold text-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> เตรียมเสร็จแล้ว
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="p-2">รูป</th>
                          <th className="p-2">รหัส SKU</th>
                          <th className="p-2">ชื่อสินค้า</th>
                          <th className="p-2">ยี่ห้อ</th>
                          <th className="p-2">สี</th>
                          <th className="p-2 text-center">จำนวน</th>
                          <th className="p-2 text-right">รวม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map(item => (
                          <tr key={item.id}>
                            <td className="p-2">
                              {item.image ? <img src={item.image} alt="" className="w-10 h-10 object-cover rounded border" /> : <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-400" /></div>}
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-700">{item.sku}</td>
                            <td className="p-2 font-medium">{item.name}</td>
                            <td className="p-2 text-slate-600">{item.brand}</td>
                            <td className="p-2 text-slate-600">{item.color}</td>
                            <td className="p-2 text-center font-bold text-base text-amber-700">x{item.quantity}</td>
                            <td className="p-2 text-right">฿{(item.price * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-right font-bold text-lg text-slate-900">
                    ยอดรวมสุทธิ: ฿{order.totalAmount.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'manage-products' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-xl text-slate-800">
                  {editingId ? `แก้ไขข้อมูลสินค้า: ${formState.name}` : 'เพิ่มรายการสินค้าใหม่เข้าระบบ'}
                </h2>
                {editingId && (
                  <button type="button" onClick={resetForm} className="text-xs bg-slate-200 px-3 py-1.5 rounded-lg font-medium">
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formState.image ? (
                      <img src={formState.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400 text-center px-2">ไม่มีรูปภาพ</span>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <label className="block text-sm font-medium text-slate-700">รูปภาพสินค้า (อัปโหลดไฟล์ หรือ วางลิงก์ URL)</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-xs text-slate-600" />
                    <input
                      type="url"
                      placeholder="หรือวางลิงก์รูปภาพ (https://...)"
                      value={formState.image.startsWith('http') ? formState.image : ''}
                      onChange={e => setFormState({ ...formState, image: e.target.value })}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    {formState.image && (
                      <button type="button" onClick={() => setFormState({ ...formState, image: '' })} className="text-xs text-rose-600 hover:underline">
                        ลบรูปภาพออก
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">รหัสสินค้า (SKU) *</label>
                    <input required type="text" value={formState.sku} onChange={e => setFormState({ ...formState, sku: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทสินค้า *</label>
                    <input required type="text" list="category-list" value={formState.category} onChange={e => setFormState({ ...formState, category: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" />
                    <datalist id="category-list">
                      <option value="อุปกรณ์บาร์" />
                      <option value="เมล็ดกาแฟ" />
                      <option value="เครื่องชงและเครื่องบด" />
                      <option value="ไซรัปและวัตถุดิบ" />
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อสินค้า *</label>
                  <input required type="text" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ยี่ห้อ (Brand)</label>
                    <input type="text" value={formState.brand} onChange={e => setFormState({ ...formState, brand: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">สี (Color)</label>
                    <input type="text" value={formState.color} onChange={e => setFormState({ ...formState, color: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ราคา (บาท) *</label>
                    <input required type="number" value={formState.price} onChange={e => setFormState({ ...formState, price: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-md transition">
                  {editingId ? 'บันทึกการแก้ไขสินค้า' : 'บันทึกสินค้าเข้าระบบ'}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 className="font-bold text-lg text-slate-800">รายการสินค้าทั้งหมดในระบบ ({products.length} รายการ)</h3>
                <input
                  type="text"
                  placeholder="ค้นหาสินค้าเพื่อแก้ไข/ลบ..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2.5">รูป</th>
                      <th className="p-2.5">รหัส SKU</th>
                      <th className="p-2.5">ชื่อสินค้า</th>
                      <th className="p-2.5">ประเภท</th>
                      <th className="p-2.5">ยี่ห้อ / สี</th>
                      <th className="p-2.5 text-right">ราคา</th>
                      <th className="p-2.5 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          {p.image ? <img src={p.image} alt="" className="w-12 h-12 object-cover rounded-lg border" /> : <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">ไม่มีรูป</div>}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-700">{p.sku}</td>
                        <td className="p-2.5 font-medium text-slate-900">{p.name}</td>
                        <td className="p-2.5"><span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{p.category}</span></td>
                        <td className="p-2.5 text-xs text-slate-600">{p.brand} / {p.color}</td>
                        <td className="p-2.5 text-right font-bold text-amber-900">฿{p.price.toLocaleString()}</td>
                        <td className="p-2.5 text-center space-x-1 whitespace-nowrap">
                          <button onClick={() => startEdit(p)} className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded text-xs font-semibold">
                            <Pencil className="w-3 h-3" /> แก้ไข
                          </button>
                          <button onClick={() => handleDeleteProduct(p)} className="inline-flex items-center gap-1 bg-rose-100 hover:bg-rose-200 text-rose-700 px-2.5 py-1 rounded text-xs font-semibold">
                            <Trash2 className="w-3 h-3" /> ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qrcode' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md mx-auto text-center space-y-4">
            <h2 className="font-bold text-xl text-slate-800">QR Code สำหรับวางในห้องเทรน</h2>
            <p className="text-sm text-slate-500">ให้ผู้เรียนสแกนเพื่อเลือกสั่งสินค้า เซลล์หน้าร้านจะได้รับรายการทันที</p>
            <div className="flex justify-center p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl">
              {appUrl && <QRCodeSVG value={appUrl} size={220} />}
            </div>
            <p className="text-xs font-mono text-slate-400 break-all">{appUrl}</p>
            <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium">
              พิมพ์ป้าย QR Code
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
