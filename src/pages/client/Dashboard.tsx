import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import ClientHome from './Home';
import ProductsPage from './Products';
import OrdersPage from './Orders';
import CartPage from './Cart';
import { ClientTabNav } from '@/components/client/Sidebar';

export default function ClientDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ClientTabNav />
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <Routes>
          <Route index element={<ClientHome />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="cart" element={<CartPage />} />
        </Routes>
      </main>
    </div>
  );
}
