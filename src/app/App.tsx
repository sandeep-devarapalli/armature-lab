import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { PwaUpdatePrompt } from "../components/PwaUpdatePrompt";
import { Shell } from "../components/Shell";
import { MemberRoute, StaffRoute } from "../components/RouteGuard";

const HomePage = lazy(() => import("../pages/HomePage").then((module) => ({ default: module.HomePage })));
const ProjectsPage = lazy(() => import("../pages/ProjectsPage").then((module) => ({ default: module.ProjectsPage })));
const BuildingVisionPage = lazy(() => import("../pages/BuildingVisionPage").then((module) => ({ default: module.BuildingVisionPage })));
const KioskPage = lazy(() => import("../pages/KioskPage").then((module) => ({ default: module.KioskPage })));
const FinancialsPage = lazy(() => import("../pages/PlanningPages").then((module) => ({ default: module.FinancialsPage })));
const ProcurementPage = lazy(() => import("../pages/PlanningPages").then((module) => ({ default: module.ProcurementPage })));
const EquipmentPage = lazy(() => import("../pages/PublicPages").then((module) => ({ default: module.EquipmentPage })));
const MembershipPage = lazy(() => import("../pages/PublicPages").then((module) => ({ default: module.MembershipPage })));
const ServicesPage = lazy(() => import("../pages/PublicPages").then((module) => ({ default: module.ServicesPage })));
const JoinPage = lazy(() => import("../pages/PublicPages").then((module) => ({ default: module.JoinPage })));
const NotFoundPage = lazy(() => import("../pages/PublicPages").then((module) => ({ default: module.NotFoundPage })));
const AuthPage = lazy(() => import("../pages/AuthPages").then((module) => ({ default: module.AuthPage })));
const AuthCallbackPage = lazy(() => import("../pages/AuthPages").then((module) => ({ default: module.AuthCallbackPage })));
const MembersPage = lazy(() => import("../pages/AuthPages").then((module) => ({ default: module.MembersPage })));
const PublicMemberPage = lazy(() => import("../pages/AuthPages").then((module) => ({ default: module.PublicMemberPage })));
const DashboardPage = lazy(() => import("../pages/MemberPages").then((module) => ({ default: module.DashboardPage })));
const ProfilePage = lazy(() => import("../pages/MemberPages").then((module) => ({ default: module.ProfilePage })));
const BookPage = lazy(() => import("../pages/MemberPages").then((module) => ({ default: module.BookPage })));
const ResourceBookingPage = lazy(() => import("../pages/MemberPages").then((module) => ({ default: module.ResourceBookingPage })));
const BookingsPage = lazy(() => import("../pages/MemberPages").then((module) => ({ default: module.BookingsPage })));
const BookingDetailPage = lazy(() => import("../pages/MemberPages").then((module) => ({ default: module.BookingDetailPage })));
const CheckInPage = lazy(() => import("../pages/MemberPages").then((module) => ({ default: module.CheckInPage })));
const AdminMembersPage = lazy(() => import("../pages/AdminPages").then((module) => ({ default: module.AdminMembersPage })));
const AdminResourcesPage = lazy(() => import("../pages/AdminPages").then((module) => ({ default: module.AdminResourcesPage })));
const AdminBookingsPage = lazy(() => import("../pages/AdminPages").then((module) => ({ default: module.AdminBookingsPage })));
const AdminAttendancePage = lazy(() => import("../pages/AdminPages").then((module) => ({ default: module.AdminAttendancePage })));
const AdminIntegrationsPage = lazy(() => import("../pages/AdminPages").then((module) => ({ default: module.AdminIntegrationsPage })));

const protectedPage = (page: ReactNode) => (
  <MemberRoute>{page}</MemberRoute>
);
const staffPage = (page: ReactNode) => (
  <MemberRoute><StaffRoute>{page}</StaffRoute></MemberRoute>
);

export const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/equipment", element: <EquipmentPage /> },
      { path: "/membership", element: <MembershipPage /> },
      { path: "/services", element: <ServicesPage /> },
      { path: "/projects", element: <ProjectsPage /> },
      { path: "/building-vision", element: <BuildingVisionPage /> },
      { path: "/financials", element: <FinancialsPage /> },
      { path: "/procurement", element: <ProcurementPage /> },
      { path: "/join", element: <JoinPage /> },
      { path: "/members", element: <MembersPage /> },
      { path: "/members/:handle", element: <PublicMemberPage /> },
      { path: "/auth", element: <AuthPage /> },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/dashboard", element: protectedPage(<DashboardPage />) },
      { path: "/profile", element: protectedPage(<ProfilePage />) },
      { path: "/book", element: protectedPage(<BookPage />) },
      { path: "/book/:resource", element: protectedPage(<ResourceBookingPage />) },
      { path: "/bookings", element: protectedPage(<BookingsPage />) },
      { path: "/bookings/:id", element: protectedPage(<BookingDetailPage />) },
      { path: "/check-in", element: protectedPage(<CheckInPage />) },
      { path: "/admin", element: <Navigate to="/admin/members" replace /> },
      { path: "/admin/members", element: staffPage(<AdminMembersPage />) },
      { path: "/admin/resources", element: staffPage(<AdminResourcesPage />) },
      { path: "/admin/bookings", element: staffPage(<AdminBookingsPage />) },
      { path: "/admin/attendance", element: staffPage(<AdminAttendancePage />) },
      { path: "/admin/integrations", element: staffPage(<AdminIntegrationsPage />) },
      { path: "*", element: <NotFoundPage /> }
    ]
  },
  { path: "/kiosk", element: <KioskPage /> }
]);

export function App() {
  return (
    <>
      <Suspense fallback={<div className="route-loading mono">Loading floor plan…</div>}>
        <RouterProvider router={router} />
      </Suspense>
      <PwaUpdatePrompt />
    </>
  );
}
