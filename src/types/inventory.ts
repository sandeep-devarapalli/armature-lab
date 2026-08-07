export type ComponentRequestStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "ordered"
  | "available"
  | "declined";

export type InventoryClass =
  | "fixed_equipment"
  | "serialized_asset"
  | "reusable_tray"
  | "consumable";

export interface ComponentRequest {
  id: string;
  componentName: string;
  vendorUrl: string;
  projectUseCase: string;
  quantity: number;
  urgency: "routine" | "soon" | "blocking";
  budgetBand: string;
  notes: string;
  requesterEmail?: string;
  status: ComponentRequestStatus;
  verifiedAt: string;
  createdAt: string;
  voteCount: number;
  voterIds: string[];
}

export interface InventoryLocation {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface InventoryLot {
  id: string;
  componentSlug: string;
  locationId: string;
  inventoryClass: InventoryClass;
  quantityOnHand: number;
  quantityAvailable: number;
  reorderLevel: number;
  unit: string;
  updatedAt: string;
}

export type AssetState =
  | "available"
  | "checked_out"
  | "maintenance"
  | "retired";

export interface AssetUnit {
  id: string;
  componentSlug: string;
  locationId: string;
  assetTag: string;
  state: AssetState;
  condition: "good" | "attention" | "damaged";
  checkedOutTo?: string;
}

export interface CheckoutItem {
  assetUnitId: string;
  assetTag: string;
  componentSlug: string;
  checkedOutAt: string;
  returnedAt?: string;
  returnCondition?: AssetUnit["condition"];
}

export interface CheckoutSession {
  id: string;
  memberId: string;
  state: "draft" | "open" | "completed" | "overridden";
  startedAt: string;
  dueAt: string;
  closedAt?: string;
  items: CheckoutItem[];
  notes: string;
}

export interface CabinetEvent {
  id: string;
  cabinetId: string;
  kind: "door" | "rfid" | "weight" | "camera" | "reconciliation";
  value: string;
  createdAt: string;
  flagged: boolean;
}

export interface SmartCabinet {
  id: string;
  name: string;
  locationId: string;
  state: "ready" | "open" | "reconciling" | "attention";
  lastReconciledAt: string;
}

export interface CabinetAccessIntent {
  token: string;
  cabinetId: string;
  memberId: string;
  expiresAt: string;
}

export interface InventoryState {
  requests: ComponentRequest[];
  locations: InventoryLocation[];
  lots: InventoryLot[];
  assets: AssetUnit[];
  checkoutSessions: CheckoutSession[];
  cabinets: SmartCabinet[];
  cabinetEvents: CabinetEvent[];
}

export interface PublicComponentRequestInput {
  componentName: string;
  vendorUrl: string;
  projectUseCase: string;
  quantity: number;
  urgency: ComponentRequest["urgency"];
  budgetBand: string;
  notes: string;
  email: string;
  turnstileToken: string;
}
