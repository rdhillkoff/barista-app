'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, CheckCircle2, Coffee } from 'lucide-react';
import { Product, CartItem, Order } from '@/types/product';

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', sku: 'TMP-001', name: 'Tamper หน้าเรียบ 58mm', category: 'อุปกรณ์บาร์', brand: 'MHW-3BOMBER', color: 'ดำด้าน', price: 890 },
  { id: '2', sku: 'PIT-002', name: 'Pitcher สตีมนม ปากแหลม 600ml', category: 'อุปกรณ์บาร์', brand: 'WPM', color: 'เงินสแตนเลส', price: 1250 },
  { id: '3', sku: 'BN-101', name: 'เมล็ดกาแฟ House Blend (คั่วกลาง-เข้ม) 500g', category: 'เมล็ดกาแฟ', brand: 'Roastery Lab', color: '-', price: 450 },
  { id: '4', sku: 'SCL-005', name: 'ตาชั่งดิจิทัลจับเวลา', category: 'อุปกรณ์บาร์', brand: 'Timemore', color: 'ขาว', price: 1690 },
];

export default function CustomerOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  useEffect(() => {
    const savedProducts = localStorage.getItem('barista_products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('barista_products', JSON.stringify(INITIAL_PRODUCTS));
    }
  }, []);

  const categories = ['ทั้งหมด', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.color.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = () => {
    if (!customerName.trim()) {
      alert('กรุณาระบุชื่อของคุณ หรือ หมายเลขโต๊ะในห้องเทรนครับ');
      return;
    }
    if (cart.length === 0) return;

    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      customerName,
      items: cart,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    const existingOrders: Order[] = JSON.parse(localStorage.getItem('barista_orders') || '[]');
    const updatedOrders = [newOrder, ...existingOrders];
    localStorage.setItem('barista_orders', JSON.stringify(updatedOrders));
    
    const channel = new BroadcastChannel('order_channel');
    channel.postMessage({ type: 'NEW_ORDER', order: newOrder });

    setCart([]);
    setOrderSuccess(true);
    setTimeout(() => setOrderSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-32">
      <header className="bg-amber-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-300" />
            <div>
              <h1 className="font-bold text-lg">Barista Training Store</h1>
              <p className="text-xs text-amber-200">สั่งสินค้าจากห้องเทรน เซลล์จัดเตรียมให้หน้าร้าน</p>
            </div>
          </div>
          <a href="/staff" className="text-xs bg-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-700">
            สำหรับเซลล์หน้าร้าน →
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {orderSuccess && (
          <div className="bg-emerald-600 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">ส่งรายการสั่งซื้อไปที่หน้าร้านเรียบร้อยแล้ว!</p>
              <p className="text-sm text-emerald-100">เซลล์กำลังจัดเตรียมสินค้าให้คุณ สามารถรับของหลังจบคลาสได้ทันที</p>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า, รหัส SKU, ยี่ห้อ, หรือสี..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-800 text-white'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map(product => {
            const inCart = cart.find(item => item.id === product.id);
            return (
              <div key={product.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                      รหัส: {product.sku}
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mt-2">{product.name}</h3>
                  <div className="text-xs text-stone-500 mt-1 space-x-3">
                    <span>ยี่ห้อ: <strong className="text-stone-700">{product.brand}</strong></span>
                    <span>สี: <strong className="text-stone-700">{product.color}</strong></span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100">
                  <span className="font-bold text-lg text-amber-900">฿{product.price.toLocaleString()}</span>
                  
                  {inCart ? (
                    <div className="flex items-center gap-3 bg-stone-100 rounded-lg p-1">
                      <button onClick={() => updateQuantity(product.id, -1)} className="p-1 bg-white rounded shadow-sm">
                        <Minus className="w-4 h-4 text-stone-700" />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{inCart.quantity}</span>
                      <button onClick={() => updateQuantity(product.id, 1)} className="p-1 bg-white rounded shadow-sm">
                        <Plus className="w-4 h-4 text-stone-700" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-amber-800 hover:bg-amber-900 text-white text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> เลือกสินค้า
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 shadow-2xl">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="w-full sm:w-auto flex-1">
              <input
                type="text"
                placeholder="ระบุชื่อผู้เรียน / โต๊ะ (เช่น คุณเอ โต๊ะ 2)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-700"
              />
            </div>
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4">
              <div className="text-right">
                <p className="text-xs text-stone-500">รวม {cart.reduce((s, i) => s + i.quantity, 0)} ชิ้น</p>
                <p className="font-bold text-lg text-amber-900">฿{totalAmount.toLocaleString()}</p>
              </div>
              <button
                onClick={handleSubmitOrder}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md"
              >
                <ShoppingCart className="w-5 h-5" /> ส่งออเดอร์ให้เซลล์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
