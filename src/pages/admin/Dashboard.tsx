import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import AdminHome from './Home';
import OrdersPage from './Orders';
import ClientsPage from './Clients';
import ProductsPage from './Products';
import InventoryPage from './Inventory';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { useState } from 'react';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} showMenuButton />
      <div className="flex">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 md:ml-64">
          <Routes>
            <Route index element={<AdminHome />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
