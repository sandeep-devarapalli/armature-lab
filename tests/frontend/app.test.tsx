import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addMinutes } from "date-fns";
import { useState } from "react";
import { AppProvider, useApp } from "../../src/context/AppContext";
import { ThemeProvider, useTheme } from "../../src/context/ThemeContext";

vi.mock("../../src/lib/supabase", () => ({
  dataMode: "demo",
  isSupabaseConfigured: false,
  supabase: null
}));

function ThemeHarness() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <output>{theme}</output>
      <button type="button" onClick={() => setTheme("sepia")}>Sepia</button>
    </>
  );
}

function BookingHarness() {
  const { currentMember, signInDemo, state, createBooking } = useApp();
  const [error, setError] = useState("");
  const start = addMinutes(new Date(), 45).toISOString();
  return (
    <>
      <output>{currentMember?.name ?? "signed out"}</output>
      <output data-testid="count">{state.bookings.length}</output>
      <output data-testid="error">{error}</output>
      <button type="button" onClick={signInDemo}>Sign in</button>
      <button
        type="button"
        onClick={async () => {
          try {
            await createBooking({
              resourceId: "res-gpu",
              startsAt: start,
              durationMinutes: 60,
              purpose: "Test the local booking ledger",
              guestNames: []
            });
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "failed");
          }
        }}
      >
        Book
      </button>
    </>
  );
}

describe("frontend foundation", () => {
  beforeEach(() => window.localStorage.clear());

  it("persists the explicit three-mode theme choice", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeHarness /></ThemeProvider>);
    expect(screen.getByText("light")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sepia" }));
    expect(screen.getByText("sepia")).toBeInTheDocument();
    expect(window.localStorage.getItem("armature-theme")).toBe("sepia");
    expect(document.documentElement.dataset.theme).toBe("sepia");
  });

  it("runs a local member sign-in and conflict-checked booking", async () => {
    const user = userEvent.setup();
    render(<AppProvider><BookingHarness /></AppProvider>);
    const initial = Number(screen.getByTestId("count").textContent);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Anika Rao")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Book" }));
    expect(screen.getByTestId("count")).toHaveTextContent(String(initial + 1));
    await user.click(screen.getByRole("button", { name: "Book" }));
    expect(screen.getByTestId("error")).toHaveTextContent("overlaps");
  });
});
