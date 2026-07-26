export type Theme = "light" | "dark" | "sepia";
export type MembershipState =
  | "pending"
  | "active"
  | "suspended"
  | "expired"
  | "cancelled";
export type BookingState = "confirmed" | "cancelled" | "completed" | "no_show";
export type AttendanceState = "open" | "closed" | "flagged";
export type CheckinAction = "check_in" | "check_out";
export type ResourceKind =
  | "robotics"
  | "fabrication"
  | "compute"
  | "electronics"
  | "flight"
  | "workspace";

export interface PublicProfile {
  id: string;
  handle: string;
  name: string;
  avatarUrl?: string;
  bio: string;
  skills: string[];
  organization: string;
  projectLinks: Array<{ label: string; url: string }>;
  socialLinks: Array<{ label: string; url: string }>;
}

export interface MemberProfile extends PublicProfile {
  email: string;
  phone: string;
  emergencyContact: string;
  membershipState: MembershipState;
  certifications: string[];
}

export interface Resource {
  id: string;
  slug: string;
  name: string;
  kind: ResourceKind;
  zone: string;
  description: string;
  capacity: number;
  maxGuests: number;
  durationMinutes: number;
  maxDurationMinutes: number;
  bookingHorizonDays: number;
  certifications: string[];
  hazardous: boolean;
  available: boolean;
  image?: string;
}

export interface Booking {
  id: string;
  resourceId: string;
  ownerId: string;
  startsAt: string;
  endsAt: string;
  purpose: string;
  guestNames: string[];
  state: BookingState;
  createdAt: string;
}

export interface AttendanceSession {
  id: string;
  bookingId: string;
  memberId: string;
  checkedInAt: string;
  checkedOutAt?: string;
  state: AttendanceState;
}

export interface CheckinIntent {
  token: string;
  memberId: string;
  bookingId: string;
  action: CheckinAction;
  expiresAt: string;
  redeemedAt?: string;
}

export interface MembershipApplication {
  id: string;
  memberId: string;
  buildSummary: string;
  requestedAt: string;
  state: "pending" | "approved" | "declined";
}

export interface CalendarSync {
  id: string;
  bookingId: string;
  resourceId: string;
  operation: "create" | "update" | "cancel";
  state: "queued" | "synced" | "failed";
  attempts: number;
  message: string;
}

export interface AvailabilitySlot {
  startsAt: string;
  endsAt: string;
  available: boolean;
  reason: string | null;
}

export interface DemoState {
  currentUserId: string | null;
  profiles: MemberProfile[];
  resources: Resource[];
  bookings: Booking[];
  attendance: AttendanceSession[];
  checkinIntents: CheckinIntent[];
  applications: MembershipApplication[];
  calendarSync: CalendarSync[];
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  priority: "P0" | "P1" | "P2";
  status: "Build Now" | "Building Soon" | "Research Track" | "Watching" | "Reference";
  description: string;
  image?: string;
  sourceUrl: string;
  infrastructure?: boolean;
  tags: string[];
}
