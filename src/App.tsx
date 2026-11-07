import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Kasir from "./pages/Kasir";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Customers from "./pages/Customers";
import AuditLogs from "./pages/AuditLogs";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Rute HANYA untuk OWNER */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["OWNER"]}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["OWNER"]}>
              <Layout>
                <AuditLogs />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["OWNER"]}>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
              <Layout>
                <Transactions />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["OWNER"]}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Rute HANYA untuk OWNER */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={["OWNER"]}>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Rute untuk ADMIN dan OWNER (Kasir/POS) */}
        <Route
          path="/kasir"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "OWNER"]}>
              <Layout>
                <Kasir />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
