'use client';

import React, { useState, useEffect } from 'react';
import { Bell, PlusCircle, PackageCheck, Clock, CheckCircle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Order, Product } from '@/types/product';

export default function StaffDashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'add-product' | 'qrcode'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appUrl, setAppUrl] = useState<string>('');

  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'อุปกรณ์บาร์',
    brand: '',
    color: '',
    price: '',
  });

  useEffect(() => {
    setAppUrl(window.location.origin);

    const savedOrders = JSON.parse(localStorage.getItem('barista_orders') || '[]');
    const savedProducts = JSON.parse(localStorage.getItem('barista_products') || '[]');
    setOrders(savedOrders);
    setProducts(savedProducts);

    const channel = new BroadcastChannel('order_channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_ORDER') {
        setOrders(prev => [event.data.order, ...prev]);
        try {
          new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
        } catch (e) {}
      }
    };

    return () => channel.close();
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updated = orders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o));
    setOrders(updated);
    localStorage.setItem('barista_orders', JSON.stringify(updated));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.sku || !newProduct.name || !newProduct.price) return;

    const productToAdd: Product = {
      id: Date.now().toString(),
      sku: newProduct.sku,
      name: newProduct.name,
      category: newProduct.category,
      brand: newProduct.brand || '-',
      color: newProduct.color || '-',
      price: Number(newProduct.price),
    };

    const updatedProducts = [productToAdd, ...products];
    setProducts(updatedProducts);
    localStorage.setItem('barista_products', JSON.stringify(updatedProducts));

    setNewProduct({ sku: '', name: '', category: 'อุปกรณ์บาร์', brand: '', color: '', price: '' });
    alert('เพิ่มสินค้าใหม่เข้าระบบเรียบร้อยแล้ว! ลูกค้าในห้องเทรนสามารถเห็นและสั่งซื้อได้ทันที');
  };

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
              onClick={() => setActiveTab('add-product')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                activeTab === 'add-product' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> เพิ่มสินค้าใหม่
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
                    order.status === 'pending'
                      ? 'border-l-rose-500'
                      : order.status === 'preparing'
                      ? 'border-l-amber-500'
                      : 'border-l-emerald-500 opacity-75'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 mr-2">
                        #{order.id}
                      </span>
                      <span className="font-bold text-lg text-slate-900">{order.customerName}</span>
                      <span className="text-xs text-slate-400 ml-3">สั่งเมื่อ {order.createdAt} น.</span>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                          <Clock className="w-4 h-4" /> รับออเดอร์ / กำลังจัดของ
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                        >
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

        {activeTab === 'add-product' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <h2 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-amber-600" /> เพิ่มรายการสินค้าใหม่เข้าระบบ
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">รหัสสินค้า (SKU) *</label>
                  <input
                    required
                    type="text"
                    placeholder="เช่น TMP-009"
                    value={newProduct.sku}
                    onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทสินค้า *</label>
                  <input
                    required
                    type="text"
                    list="category-list"
                    placeholder="เลือกหรือพิมพ์ประเภทใหม่"
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                  <datalist id="category-list">
                    <option value="อุปกรณ์บาร์" />
                    <option value="เมล็ดกาแฟ" />
                    <option value="เครื่องชงและเครื่องบด" />
                    <option value="ไซรัปและวัตถุดิบ" />
                    <option value="แก้วและบรรจุภัณฑ์" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อสินค้า *</label>
                <input
                  required
                  type="text"
                  placeholder="เช่น กาดริปคอห่านไฟฟ้า 800ml"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ยี่ห้อ (Brand)</label>
                  <input
                    type="text"
                    placeholder="เช่น Brewista"
                    value={newProduct.brand}
                    onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">สี (Color)</label>
                  <input
                    type="text"
                    placeholder="เช่น ขาวมุก / ดำ"
                    value={newProduct.color}
                    onChange={e => setNewProduct({ ...newProduct, color: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ราคา (บาท) *</label>
                  <input
                    required
                    type="number"
                    placeholder="0"
                    value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-md transition"
              >
                บันทึกสินค้าเข้าระบบ
              </button>
            </form>
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
            <button
              onClick={() => window.print()}
              className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium"
            >
              พิมพ์ป้าย QR Code
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
