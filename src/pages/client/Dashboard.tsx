import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import ClientHome from './Home';
import ProductsPage from './Products';
import OrdersPage from './Orders';
import CartPage from './Cart';
import { ClientSidebar } from '@/components/client/Sidebar';
import { useState } from 'react';

export default function ClientDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} showMenuButton />
      <div className="flex">
        <ClientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 md:ml-64">
          <Routes>
            <Route index element={<ClientHome />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="cart" element={<CartPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
