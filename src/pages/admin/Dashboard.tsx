import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import AdminHome from './Home';
import OrdersPage from './Orders';
import ClientsPage from './Clients';
import ProductsPage from './Products';
import InventoryPage from './Inventory';
import { AdminTabNav } from '@/components/admin/Sidebar';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminTabNav />
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
        </Routes>
      </main>
    </div>
  );
}
