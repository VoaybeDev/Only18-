import { ReactNode, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/layouts/app-shell";
import { SplashScreen } from "@/components/splash-screen";
import { ToastCenter } from "@/components/toast-center";
import { ChatPage } from "@/pages/chat-page";
import { ContentViewerPage } from "@/pages/content-viewer-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { HomePage } from "@/pages/home-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { OnboardingPage } from "@/pages/onboarding-page";
import { ProfilePage } from "@/pages/profile-page";
import { RegisterPage } from "@/pages/register-page";
import { ProtectedRoute } from "@/routes/protected-route";
import { selectCurrentUser, useAppStore } from "@/store/useAppStore";

function RootRedirect() {
  const currentUser = useAppStore(selectCurrentUser);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);

  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/home" replace />;
}

function ProtectedShell({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <ToastCenter />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/home"
          element={
            <ProtectedShell>
              <HomePage />
            </ProtectedShell>
          }
        />
        <Route
          path="/content/:contentId"
          element={
            <ProtectedShell>
              <ContentViewerPage />
            </ProtectedShell>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedShell>
              <ChatPage />
            </ProtectedShell>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedShell>
              <ProfilePage />
            </ProtectedShell>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["modele", "chateur"]}>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
