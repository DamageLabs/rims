import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import Welcome from './components/Welcome';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EditProfile from './components/auth/EditProfile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ItemList from './components/items/ItemList';
import ItemDetail from './components/items/ItemDetail';
import ItemForm from './components/items/ItemForm';
import DataImport from './components/items/DataImport';
import BarcodeScanner from './components/items/BarcodeScanner';
import PrintLabels from './components/items/PrintLabels';
import ReorderAlerts from './components/items/ReorderAlerts';
import UserList from './components/users/UserList';
import UserDetail from './components/users/UserDetail';
import Dashboard from './components/reports/Dashboard';
import ValuationReport from './components/reports/ValuationReport';
import MovementReport from './components/reports/MovementReport';
import CustomReport from './components/reports/CustomReport';
import ItemTemplates from './components/items/ItemTemplates';
import BOMList from './components/bom/BOMList';
import BOMForm from './components/bom/BOMForm';
import BOMDetail from './components/bom/BOMDetail';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './components/auth/ResendVerification';
import CategoryManager from './components/settings/CategoryManager';
import InventoryTypeManager from './components/settings/InventoryTypeManager';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Welcome />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="verify-email" element={<VerifyEmail />} />
                <Route path="resend-verification" element={<ResendVerification />} />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <EditProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="items"
                  element={
                    <ProtectedRoute>
                      <ItemList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="items/new"
                  element={
                    <ProtectedRoute>
                      <ItemForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="items/:id"
                  element={
                    <ProtectedRoute>
                      <ItemDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="items/:id/edit"
                  element={
                    <ProtectedRoute>
                      <ItemForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="items/import"
                  element={
                    <ProtectedRoute>
                      <DataImport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="items/scanner"
                  element={
                    <ProtectedRoute>
                      <BarcodeScanner />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="items/labels"
                  element={
                    <ProtectedRoute>
                      <PrintLabels />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="items/reorder"
                  element={
                    <ProtectedRoute>
                      <ReorderAlerts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="items/templates"
                  element={
                    <ProtectedRoute>
                      <ItemTemplates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="bom"
                  element={
                    <ProtectedRoute>
                      <BOMList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="bom/new"
                  element={
                    <ProtectedRoute>
                      <BOMForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="bom/:id"
                  element={
                    <ProtectedRoute>
                      <BOMDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="bom/:id/edit"
                  element={
                    <ProtectedRoute>
                      <BOMForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings/categories"
                  element={
                    <ProtectedRoute requireAdmin>
                      <CategoryManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings/inventory-types"
                  element={
                    <ProtectedRoute requireAdmin>
                      <InventoryTypeManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute requireAdmin>
                      <UserList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="users/:id"
                  element={
                    <ProtectedRoute>
                      <UserDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports/valuation"
                  element={
                    <ProtectedRoute>
                      <ValuationReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports/movement"
                  element={
                    <ProtectedRoute>
                      <MovementReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports/custom"
                  element={
                    <ProtectedRoute>
                      <CustomReport />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
