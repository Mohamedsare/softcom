import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { StoresPage } from '@/pages/StoresPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { SalesPage } from '@/pages/SalesPage'
import { PosPage } from '@/pages/PosPage'
import { PurchasesPage } from '@/pages/PurchasesPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { SuppliersPage } from '@/pages/SuppliersPage'
import { TransfersPage } from '@/pages/TransfersPage'
import { CashPage } from '@/pages/CashPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { AiInsightsPage } from '@/pages/AiInsightsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UsersPage } from '@/pages/UsersPage'
import { CreateSuperAdminPage } from '@/pages/CreateSuperAdminPage'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AdminTableauPage } from '@/pages/admin/AdminTableauPage'
import { AdminEntreprisesPage } from '@/pages/admin/AdminEntreprisesPage'
import { AdminBoutiquesPage } from '@/pages/admin/AdminBoutiquesPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminAIPage } from '@/pages/admin/AdminAIPage'
import { AdminRapportsPage } from '@/pages/admin/AdminRapportsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { LandingOrApp } from '@/components/LandingOrApp'
import { ROUTES } from '@/routes'

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        <Route path={ROUTES.createSuperAdmin} element={<CreateSuperAdminPage />} />
        <Route path="/" element={<LandingOrApp />}>
          <Route index element={null} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="stores/:storeId" element={<StoresPage />} />
          <Route path="stores/:storeId/pos" element={<PosPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="cash" element={<CashPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="ai" element={<AiInsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminTableauPage />} />
            <Route path="companies" element={<AdminEntreprisesPage />} />
            <Route path="stores" element={<AdminBoutiquesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="ai" element={<AdminAIPage />} />
            <Route path="reports" element={<AdminRapportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
