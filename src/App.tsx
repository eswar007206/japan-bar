import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CastAuthProvider } from "@/contexts/CastAuthContext";
import { StaffAuthProvider } from "@/contexts/StaffAuthContext";
import Index from "./pages/Index";
import CustomerBillPage from "./pages/CustomerBillPage";
import CastLoginPage from "./pages/CastLoginPage";
import CastStoreSelectPage from "./pages/CastStoreSelectPage";
import CastTableLayoutPage from "./pages/CastTableLayoutPage";
import CastOrderAddPage from "./pages/CastOrderAddPage";
import CastEarningsPage from "./pages/CastEarningsPage";
import CastLayout from "./layouts/CastLayout";
import StaffLoginPage from "./pages/StaffLoginPage";
import StaffDashboard from "./pages/StaffDashboard";
import StaffReportsPage from "./pages/StaffReportsPage";
import QRCodesPage from "./pages/QRCodesPage";
import CastManagementPage from "./pages/CastManagementPage";
import SettingsPage from "./pages/SettingsPage";
import StaffShiftApprovalsPage from "./pages/StaffShiftApprovalsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CastAuthProvider>
        <StaffAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/customer/:readToken" element={<CustomerBillPage />} />
              <Route path="/table/:tableId" element={<CustomerBillPage />} />
              
              {/* Cast Routes */}
              <Route path="/cast/login" element={<CastLoginPage />} />
              <Route element={<CastLayout />}>
                <Route path="/cast" element={<CastStoreSelectPage />} />
                <Route path="/cast/store/:storeId" element={<CastTableLayoutPage />} />
                <Route path="/cast/store/:storeId/table/:tableId" element={<CastOrderAddPage />} />
                <Route path="/cast/earnings" element={<CastEarningsPage />} />
              </Route>

              {/* Staff Routes */}
              <Route path="/staff" element={<StaffLoginPage />} />
              <Route path="/staff/login" element={<StaffLoginPage />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/reports" element={<StaffReportsPage />} />
              <Route path="/staff/qr-codes" element={<QRCodesPage />} />
              <Route path="/staff/cast-management" element={<CastManagementPage />} />
              <Route path="/staff/settings" element={<SettingsPage />} />
              <Route path="/staff/approvals" element={<StaffShiftApprovalsPage />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </StaffAuthProvider>
      </CastAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
