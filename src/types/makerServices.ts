export type PlaceholderPrice = "Rs [rate]";
export type ServiceAvailability = "available" | "limited" | "unavailable";

export type LockerSize = "small" | "medium" | "tall";
export type LockerPlanTerm = "week" | "month" | "year";

export interface LockerPlan {
  term: LockerPlanTerm;
  label: string;
  rate: PlaceholderPrice;
}

export interface LockerOffering {
  slug: string;
  size: LockerSize;
  name: string;
  description: string;
  suitedFor: string[];
  plans: LockerPlan[];
  availability: ServiceAvailability;
  storageRules: string[];
}

export interface LockerUnit {
  id: string;
  code: string;
  size: LockerSize;
  state: "available" | "assigned" | "maintenance";
}

export type ConsumableCategory =
  | "Fasteners"
  | "Wire and cable"
  | "Prototyping"
  | "Soldering"
  | "Protection"
  | "Adhesives"
  | "Batteries";

export interface ConsumableItem {
  slug: string;
  skuCode: string;
  name: string;
  category: ConsumableCategory;
  description: string;
  purchaseUnit: string;
  price: PlaceholderPrice;
  availability: ServiceAvailability;
  safetyNotes: string[];
}

export type ToolkitKind =
  | "electronics_bench"
  | "mechanical_assembly"
  | "soldering"
  | "precision"
  | "field_diagnostics";

export interface ToolkitRentalPlan {
  period: "session" | "day" | "week";
  rate: PlaceholderPrice;
}

export interface ToolkitTemplate {
  slug: string;
  kind: ToolkitKind;
  name: string;
  description: string;
  includedContents: string[];
  rentalPlans: ToolkitRentalPlan[];
  deposit: PlaceholderPrice;
  requiredCertification: string | null;
  safetyNotes: string[];
  availability: ServiceAvailability;
}

export interface MemberLockerAssignment {
  id: string;
  memberId: string;
  lockerSlug: string;
  lockerLabel: string;
  planTerm: LockerPlanTerm;
  startsOn: string;
  endsOn: string;
  state: "reserved" | "active" | "expiring" | "ended";
  autoRenew: boolean;
}

export interface ConsumableOrderLine {
  consumableSlug: string;
  quantity: number;
  unit: string;
}

export interface ConsumableOrder {
  id: string;
  memberId: string;
  lines: ConsumableOrderLine[];
  total: PlaceholderPrice;
  state: "draft" | "submitted" | "ready" | "collected" | "cancelled";
  requestedAt: string;
  collectionPoint: string;
}

export interface ToolkitRental {
  id: string;
  memberId: string;
  toolkitSlug: string;
  assetTag: string;
  period: ToolkitRentalPlan["period"];
  startsAt: string;
  dueAt: string;
  state: "reserved" | "checked_out" | "returned" | "overdue";
  deposit: PlaceholderPrice;
  checkoutCondition: "good" | "attention";
  returnCondition?: "good" | "attention" | "damaged";
  returnedAt?: string;
}

export interface MakerServicesDemoState {
  lockerUnits: LockerUnit[];
  lockerAssignments: MemberLockerAssignment[];
  consumableOrders: ConsumableOrder[];
  toolkitRentals: ToolkitRental[];
}
