
# MicroSun Order Management System (OMS)
## Digitizing Kitchen Wire Products Manufacturing

---

### 🎯 What We're Building

A Progressive Web App (PWA) that transforms MicroSun's paper-based order process into a streamlined digital workflow. Three distinct portals for Clients, Admin (Owner), and Workers - all connected to a single database.

---

### 👥 The Three User Portals

#### 1. **Client Portal** (B2B Customers)
- **Product Catalog**: Browse all products with live inventory status (In Stock / Low Stock / Request Only)
- **Smart Ordering**: Select product, choose variant (steps: 2/3/4-step, sizes: S/M/L), enter quantity
- **No Pricing Displayed**: Clients see products but not prices - quotations handled separately
- **Order History**: Track all orders with real-time status updates
- **Self-Registration**: Sign up → Wait for admin approval → Start ordering

#### 2. **Admin Portal** (Owner/Manager)
- **Dashboard**: At-a-glance view of pending orders, low stock alerts, and daily activity
- **Order Management**: 
  - View all client orders with full details
  - Approve/Reject pending orders
  - Update order status through the workflow
- **Client View**: See all products ordered by a specific client
- **Aggregated View**: Table showing total units ordered per product across all clients (for production planning)
- **Inventory Management**: Update stock levels, set low-stock thresholds
- **Client Approval**: Review and approve new client registrations
- **Sales Analytics**: Visual charts showing order trends, top products, top clients

#### 3. **Worker Portal** (Factory Staff - Mobile Optimized)
- **Simple Order List**: Large cards showing Client Name, Product Name, Quantity
- **Dispatch Updates**: One-tap button to mark orders as "Dispatched"
- **No Sensitive Data**: Workers cannot see pricing or detailed client info
- **Production View**: See what needs to be manufactured today

---

### 📦 Order Status Flow

```
📝 Pending → ✅ Confirmed → 🏭 In Production → 📦 Ready → 🚚 Dispatched → ✓ Delivered
```

- **Pending**: Client submitted, waiting for admin review
- **Confirmed**: Admin approved the order
- **In Production**: Factory is manufacturing
- **Ready**: Products complete, waiting to ship
- **Dispatched**: Worker marked as sent (updates via app)
- **Delivered**: Client confirmed receipt

---

### 📊 Key Features for Production Planning

#### Client Order View
A table showing what each client has ordered:
| Client Name | Products Ordered | Quantities | Status |
|-------------|------------------|------------|--------|
| ABC Trading | Corner Stand 3-step, Fruit Basket | 50, 100 | Confirmed |

#### Aggregated Production View
A matrix showing total demand across all orders:
| Product | Total Units | Clients Ordered |
|---------|-------------|-----------------|
| Corner Stand 3-step | 250 | 5 |
| Fruit Basket Large | 180 | 3 |

This helps the factory know exactly how many of each product to manufacture.

---

### 📱 Mobile-First Worker Experience

Since workers use phones on the factory floor:
- **Extra-large touch targets** (buttons at least 48px)
- **High contrast colors** for visibility
- **Simple navigation** - maximum 2 taps to any action
- **Quick dispatch** - swipe or tap to update status
- **Works offline** - queues updates when internet is spotty (future enhancement)

---

### 🔐 Security & Access

- **Role-Based Access**: Separate permissions for Client, Worker, Admin
- **Secure Registration**: Clients must be approved before ordering
- **Data Protection**: Workers see only what they need to do their job
- **Audit Trail**: All status changes logged with timestamps

---

### 📧 Notifications

- **In-App Notifications**: Bell icon showing unread updates
- **Email Alerts** (via Resend):
  - Client receives email when order is confirmed
  - Client receives email when order is dispatched
  - Admin receives email for new orders and registrations

---

### 🎨 Brand & Design

- **Logo**: MicroSun branding with blue grid pattern
- **Colors**: Primary Blue (#2d75ae), Dark Purple accent (#281e50)
- **Modern UI**: Clean, professional interface using shadcn/ui components
- **Animations**: Subtle transitions using Magic UI for dashboard highlights

---

### 📐 Product Structure

Categories include:
- Corner Stands (2/3/4-step variants)
- Fruit Stands (S/M/L sizes)
- Trolleys
- Shelves
- Organizers
- Plate Stands
- Baskets (Tokra)
- Racks
- Accessories

Each product can have multiple variants (size, steps, dimensions).

---

### 🚀 What's NOT in MVP (Future Phases)

These features were discussed but will come later:
- ❌ Rod cutting optimization algorithm
- ❌ Product mix profitability analysis (7M factors)
- ❌ WhatsApp integration
- ❌ Client-specific pricing
- ❌ Offline mode for workers
- ❌ Waste/scrap tracking
- ❌ Payment tracking

---

### 🛠 Technical Foundation

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database + Auth + Real-time updates)
- **Notifications**: Resend for email delivery
- **Hosting**: PWA for installation on phones

---

### 📋 Build Sequence

1. **Database Setup**: Products, Clients, Orders, Inventory tables with proper security
2. **Authentication**: Login, Registration with approval workflow
3. **Client Portal**: Product browsing and order placement
4. **Admin Portal**: Order management and approval
5. **Worker Portal**: Mobile-optimized dispatch interface
6. **Analytics**: Dashboard charts and production views
7. **Email Notifications**: Order status alerts
