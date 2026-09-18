import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignIn from "@/components/auth/SignIn";
import SignUp from "@/components/auth/SignUp";
import ForgetPassword from "@/components/auth/ForgetPassword";

const clerk = vi.hoisted(() => ({
  loaded: true,
  create: vi.fn(), attemptFirstFactor: vi.fn(), setActive: vi.fn(),
  signUpCreate: vi.fn(), prepareVerification: vi.fn(), verify: vi.fn(),
  session: { status: "active", currentTask: null as null | { key: string } },
}));
vi.mock("@clerk/clerk-react", () => ({
  useSignIn: () => ({ isLoaded: clerk.loaded, signIn: { create: clerk.create, attemptFirstFactor: clerk.attemptFirstFactor }, setActive: clerk.setActive }),
  useClerk: () => ({ setActive: clerk.setActive }),
  useSignUp: () => ({ isLoaded: clerk.loaded, signUp: { create: clerk.signUpCreate, prepareEmailAddressVerification: clerk.prepareVerification, attemptEmailAddressVerification: clerk.verify }, setActive: clerk.setActive }),
}));
beforeEach(() => {
  clerk.loaded = true;
  for (const mock of [clerk.create, clerk.attemptFirstFactor, clerk.setActive, clerk.signUpCreate, clerk.prepareVerification, clerk.verify]) mock.mockReset();
  clerk.session = { status: "active", currentTask: null };
  clerk.setActive.mockImplementation(async ({ navigate }) => { await navigate({ session: clerk.session }); });
});
function page(element: React.ReactNode) {
  const router = createMemoryRouter([{ path: "/auth", element }, { path: "/", element: <p>Home destination</p> }, { path: "/dashboard", element: <p>Dashboard destination</p> }], { initialEntries: ["/auth"] });
  return { router, ...render(<RouterProvider router={router} />) };
}
function signInSubmit() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.invalid" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "synthetic-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
}
async function resetSubmit() {
  clerk.create.mockResolvedValue({ status: "needs_first_factor" });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.invalid" } });
  fireEvent.click(screen.getByRole("button", { name: "Send reset Code" }));
  fireEvent.change(await screen.findByLabelText("Reset Code"), { target: { value: "123456" } });
  fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "synthetic-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Reset Password" }));
}

describe("Clerk reliability", () => {
  it("explains unsupported sign-up requirements without activating a session", async () => {
    clerk.signUpCreate.mockResolvedValue({}); clerk.prepareVerification.mockResolvedValue({});
    clerk.verify.mockResolvedValue({ status: "missing_requirements", createdSessionId: null });
    const { router } = page(<SignUp />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "synthetic-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
    fireEvent.change(await screen.findByLabelText(/Verification code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify Email" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Contact the application administrator");
    expect(clerk.setActive).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/auth");
  });
  it.each(["setup-mfa", "reset-password", "choose-organization", "unrecognized-secret-task"])("blocks sign-in navigation for required task %s", async (key) => {
    clerk.session = { status: "pending", currentTask: { key } };
    clerk.create.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    const { router } = page(<SignIn />); signInSubmit();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Contact the application administrator");
    expect(alert.textContent).toContain("do not disable the requirement");
    expect(alert.textContent).not.toContain("secret-task");
    expect(router.state.location.pathname).toBe("/auth");
  });
  it("does not treat an active status as permission to skip an outstanding task", async () => {
    clerk.session.currentTask = { key: "setup-mfa" };
    clerk.create.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    const { router } = page(<SignIn />); signInSubmit();
    expect((await screen.findByRole("alert")).textContent).toContain("(MFA) setup");
    expect(router.state.location.pathname).toBe("/auth");
  });
  it.each(["pending", "ended", "revoked"])("does not navigate for non-active session status %s without a task", async (status) => {
    clerk.session.status = status;
    clerk.create.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    const { router } = page(<SignIn />); signInSubmit();
    expect((await screen.findByRole("alert")).textContent).toContain("session is not ready");
    expect(router.state.location.pathname).toBe("/auth");
  });
  it("fails closed if activation does not supply a session to the navigation callback", async () => {
    clerk.setActive.mockResolvedValue(undefined);
    clerk.create.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    const { router } = page(<SignIn />); signInSubmit();
    await screen.findByRole("alert");
    expect(router.state.location.pathname).toBe("/auth");
  });
  it("does not navigate when activation rejects after checking an active session", async () => {
    clerk.setActive.mockImplementation(async ({ navigate }) => {
      await navigate({ session: clerk.session });
      throw new Error("synthetic sensitive failure");
    });
    clerk.create.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    const { router } = page(<SignIn />); signInSubmit();
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to sign in");
    expect(router.state.location.pathname).toBe("/auth");
  });
  it("keeps a completed password reset on the form when a session task remains", async () => {
    clerk.session = { status: "pending", currentTask: { key: "setup-mfa" } };
    clerk.attemptFirstFactor.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    const { router } = page(<ForgetPassword />); await resetSubmit();
    expect((await screen.findByRole("alert")).textContent).toContain("(MFA) setup");
    expect(router.state.location.pathname).toBe("/auth");
  });
  it("keeps verified sign-up on the form when an organization task remains", async () => {
    clerk.session = { status: "pending", currentTask: { key: "choose-organization" } };
    clerk.signUpCreate.mockResolvedValue({}); clerk.prepareVerification.mockResolvedValue({});
    clerk.verify.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    const { router } = page(<SignUp />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "synthetic-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
    fireEvent.change(await screen.findByLabelText(/Verification code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify Email" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Organization selection");
    expect(router.state.location.pathname).toBe("/auth");
  });
  it("activates the password-reset session and waits before navigating", async () => {
    let finish!: () => void;
    clerk.setActive.mockImplementation(async ({ navigate }) => {
      await new Promise<void>((resolve) => { finish = resolve; });
      await navigate({ session: clerk.session });
    });
    clerk.attemptFirstFactor.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    const { router } = page(<ForgetPassword />);
    await resetSubmit();
    await waitFor(() => expect(clerk.setActive).toHaveBeenCalledWith({ session: "synthetic-session", navigate: expect.any(Function) }));
    expect(router.state.location.pathname).toBe("/auth");
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { finish(); });
    await screen.findByText("Home destination");
  });
  it("does not navigate if password-reset activation fails", async () => {
    clerk.attemptFirstFactor.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    clerk.setActive.mockRejectedValue(new Error("secret URL"));
    const { router } = page(<ForgetPassword />);
    await resetSubmit();
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to complete password reset");
    expect(router.state.location.pathname).toBe("/auth");
    expect(screen.getByRole("alert").textContent).not.toContain("secret");
  });
  it("reports incomplete reset MFA without activating a session", async () => {
    clerk.attemptFirstFactor.mockResolvedValue({ status: "needs_second_factor", createdSessionId: null });
    page(<ForgetPassword />); await resetSubmit();
    expect((await screen.findByRole("alert")).textContent).toContain("MFA");
    expect(clerk.setActive).not.toHaveBeenCalled();
  });
  it.each(["needs_second_factor", "needs_first_factor", "needs_new_password", "needs_identifier", null])("reports incomplete sign-in status %s", async (status) => {
    clerk.create.mockResolvedValue({ status, createdSessionId: null });
    const { router } = page(<SignIn />); signInSubmit();
    expect((await screen.findByRole("alert")).textContent?.length).toBeGreaterThan(20);
    expect(router.state.location.pathname).toBe("/auth");
    expect(clerk.setActive).not.toHaveBeenCalled();
    if (status === "needs_second_factor") expect(screen.getByRole("alert").textContent).toContain("MFA");
  });
  it("does not activate a null session when complete lacks a session ID", async () => {
    clerk.create.mockResolvedValue({ status: "complete", createdSessionId: null });
    page(<SignIn />); signInSubmit();
    await screen.findByRole("alert"); expect(clerk.setActive).not.toHaveBeenCalled();
  });
  it("preserves successful sign-in session activation and navigation", async () => {
    clerk.create.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    page(<SignIn />); signInSubmit();
    await screen.findByText("Home destination");
    expect(clerk.setActive).toHaveBeenCalledWith({ session: "synthetic-session", navigate: expect.any(Function) });
  });
  it("disables sign-in while pending and shows safe failure feedback", async () => {
    let reject!: (reason: unknown) => void;
    clerk.create.mockReturnValue(new Promise((_resolve, no) => { reject = no; }));
    page(<SignIn />); signInSubmit();
    expect((screen.getByRole("button", { name: "Signing in..." }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { reject(new Error("secret URL https://example.invalid/?token=secret")); });
    expect(screen.getByRole("alert").textContent).toContain("Unable to sign in");
    expect(screen.getByRole("alert").textContent).not.toContain("secret");
  });
  it.each([<SignIn />, <SignUp />, <ForgetPassword />])("disables submission until Clerk is ready", (element) => {
    clerk.loaded = false; page(element);
    const submit = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.submit(submit.closest("form")!);
    expect(clerk.create).not.toHaveBeenCalled(); expect(clerk.signUpCreate).not.toHaveBeenCalled();
  });
  it("preserves sign-up email verification and completed-session behavior", async () => {
    clerk.signUpCreate.mockResolvedValue({}); clerk.prepareVerification.mockResolvedValue({});
    clerk.verify.mockResolvedValue({ status: "complete", createdSessionId: "synthetic-session" });
    page(<SignUp />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "synthetic-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
    fireEvent.change(await screen.findByLabelText(/Verification code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify Email" }));
    await screen.findByText("Dashboard destination");
    expect(clerk.prepareVerification).toHaveBeenCalledWith({ strategy: "email_code" });
    expect(clerk.setActive).toHaveBeenCalledWith({ session: "synthetic-session", navigate: expect.any(Function) });
  });
});
