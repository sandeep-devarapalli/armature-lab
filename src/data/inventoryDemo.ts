import { addDays, addMinutes } from "date-fns";
import type { InventoryState } from "../types/inventory";

export const INVENTORY_STORAGE_KEY = "armature-inventory-demo-v1";

const now = new Date();

export const initialInventoryState: InventoryState = {
  requests: [
    {
      id: "request-force-sensor",
      componentName: "Compact six-axis force/torque sensor",
      vendorUrl: "https://www.ati-ia.com/",
      projectUseCase:
        "Measure grasp and insertion loads for tactile manipulation experiments.",
      quantity: 2,
      urgency: "soon",
      budgetBand: "Rs 1,00,000 - Rs 3,00,000",
      notes: "Prefer ROS 2 support and a documented calibration workflow.",
      status: "under_review",
      verifiedAt: now.toISOString(),
      createdAt: addDays(now, -4).toISOString(),
      voteCount: 7,
      voterIds: ["member-active"]
    },
    {
      id: "request-solder-tips",
      componentName: "Fine soldering tip and hot-air nozzle set",
      vendorUrl: "",
      projectUseCase:
        "Repair camera, controller, and sensor boards at the electronics bench.",
      quantity: 4,
      urgency: "routine",
      budgetBand: "Under Rs 10,000",
      notes: "Consumable stock for shared benches.",
      status: "approved",
      verifiedAt: now.toISOString(),
      createdAt: addDays(now, -9).toISOString(),
      voteCount: 3,
      voterIds: []
    }
  ],
  locations: [
    {
      id: "loc-cabinet-a",
      code: "CAB-A",
      name: "Electronics cabinet A",
      description: "Zone 05, drawers A01-A12"
    },
    {
      id: "loc-robotics-rack",
      code: "ROB-R1",
      name: "Robotics rack 1",
      description: "Zone 04, tagged reusable assets"
    },
    {
      id: "loc-smart-cabinet",
      code: "SC-01",
      name: "Smart cabinet pilot",
      description: "Zone 05, supervised pilot enclosure"
    }
  ],
  lots: [
    {
      id: "lot-arduino-r4",
      componentSlug: "arduino-uno-r4-wifi",
      locationId: "loc-cabinet-a",
      inventoryClass: "reusable_tray",
      quantityOnHand: 12,
      quantityAvailable: 10,
      reorderLevel: 4,
      unit: "boards",
      updatedAt: now.toISOString()
    },
    {
      id: "lot-esp32-c6",
      componentSlug: "esp32-c6",
      locationId: "loc-cabinet-a",
      inventoryClass: "consumable",
      quantityOnHand: 20,
      quantityAvailable: 18,
      reorderLevel: 6,
      unit: "boards",
      updatedAt: now.toISOString()
    },
    {
      id: "lot-bno055",
      componentSlug: "bno055-imu",
      locationId: "loc-smart-cabinet",
      inventoryClass: "serialized_asset",
      quantityOnHand: 12,
      quantityAvailable: 10,
      reorderLevel: 3,
      unit: "sensors",
      updatedAt: now.toISOString()
    },
    {
      id: "lot-so101",
      componentSlug: "so101-pair",
      locationId: "loc-robotics-rack",
      inventoryClass: "fixed_equipment",
      quantityOnHand: 5,
      quantityAvailable: 4,
      reorderLevel: 1,
      unit: "sets",
      updatedAt: now.toISOString()
    }
  ],
  assets: [
    {
      id: "asset-bno-123",
      componentSlug: "bno055-imu",
      locationId: "loc-smart-cabinet",
      assetTag: "ARM-SEN-000123",
      state: "available",
      condition: "good"
    },
    {
      id: "asset-bno-124",
      componentSlug: "bno055-imu",
      locationId: "loc-smart-cabinet",
      assetTag: "ARM-SEN-000124",
      state: "available",
      condition: "good"
    },
    {
      id: "asset-camera-041",
      componentSlug: "raspberry-pi-camera-v2",
      locationId: "loc-cabinet-a",
      assetTag: "ARM-CAM-000041",
      state: "available",
      condition: "good"
    }
  ],
  checkoutSessions: [],
  cabinets: [
    {
      id: "cabinet-pilot",
      name: "Cabinet pilot 01",
      locationId: "loc-smart-cabinet",
      state: "ready",
      lastReconciledAt: addMinutes(now, -42).toISOString()
    }
  ],
  cabinetEvents: []
};

export function readInventoryState(): InventoryState {
  if (typeof window === "undefined") return initialInventoryState;
  try {
    const stored = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as InventoryState) : initialInventoryState;
  } catch {
    return initialInventoryState;
  }
}

export function hasOpenDemoLoans(memberId: string) {
  return readInventoryState().checkoutSessions.some(
    (session) => session.memberId === memberId && session.state === "open"
  );
}
