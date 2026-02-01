import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import WorkerHome from './Home';
import OrdersPage from './Orders';

export default function WorkerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 max-w-2xl">
        <Routes>
          <Route index element={<WorkerHome />} />
          <Route path="orders" element={<OrdersPage />} />
        </Routes>
      </main>
    </div>
  );
}
