import { demoModeEnabled, isBackendAvailable } from "../lib/supabase";

const enabled = (value: string | undefined) => value === "true";

export const memberPlatformEnabled = enabled(
  import.meta.env.VITE_MEMBER_PLATFORM_ENABLED
);

export const componentRequestsEnabled = enabled(
  import.meta.env.VITE_COMPONENT_REQUESTS_ENABLED
);

export const memberPlatformAvailable =
  isBackendAvailable && (demoModeEnabled || memberPlatformEnabled);

export const componentRequestsAvailable =
  isBackendAvailable && (demoModeEnabled || componentRequestsEnabled);
