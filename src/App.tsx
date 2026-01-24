import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { authService } from './services/auth.service';
import Login from './pages/Login';
import AgentSignup from './pages/AgentSignup';
import AgentDashboard from './pages/AgentDashboard';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import KycReview from './pages/KycReview';
import PolicyReview from './pages/PolicyReview';
import NomineeReview from './pages/NomineeReview';
import Companies from './pages/Companies';
import Policies from './pages/Policies';
import Alerts from './pages/Alerts';
import AdminActions from './pages/AdminActions';
import Notifications from './pages/Notifications';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Agents from './pages/Agents';
import BannerManagement from './pages/BannerManagement';
import OfferBannerManagement from './pages/OfferBannerManagement';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const admin = authService.getStoredAdmin();
  if (!authService.isAuthenticated() || !admin) {
    return <Navigate to="/login" replace />;
  }

  // Agents should never see the admin Layout; send them to agent dashboard
  if (admin.role === 'AGENT') {
    return <Navigate to="/agent" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/agent/login" element={<Navigate to="/login" replace />} />
          <Route path="/agent/signup" element={<AgentSignup />} />
          <Route
            path="/agent"
            element={
              <AuthRoute>
                <AgentDashboard />
              </AuthRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="kyc-review" element={<KycReview />} />
            <Route path="policy-review" element={<PolicyReview />} />
            <Route path="nominee-review" element={<NomineeReview />} />
            <Route path="companies" element={<Companies />} />
            <Route path="policies" element={<Policies />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="actions" element={<AdminActions />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="subscription-plans" element={<SubscriptionPlans />} />
            <Route path="agents" element={<Agents />} />
            <Route path="banners" element={<BannerManagement />} />
            <Route path="offer-banners" element={<OfferBannerManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

