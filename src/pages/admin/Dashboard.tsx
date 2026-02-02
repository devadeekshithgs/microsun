import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import AdminHome from './Home';
import OrdersPage from './Orders';
import ClientsPage from './Clients';
import ProductsPage from './Products';
import InventoryPage from './Inventory';
import WorkersPage from './Workers';
import { AdminTabNav, AdminMobileNav } from '@/components/admin/Sidebar';

export default function AdminDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header
        showMenuButton={true}
        onMenuClick={() => setMobileMenuOpen(true)}
      />
      <AdminTabNav />
      <AdminMobileNav
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="workers" element={<WorkersPage />} />
        </Routes>
      </main>
    </div>
  );
}
