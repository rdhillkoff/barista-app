export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  color: string;
  price: number;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'completed';
  createdAt: string;
}
