// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BookingForm } from "@/components/public/forms/booking-form";
import { InquiryForm } from "@/components/public/forms/inquiry-form";

describe("public inquiry form", () => {
  it("shows accessible validation errors before sending", async () => {
    const user = userEvent.setup();
    render(<InquiryForm />);

    await user.click(screen.getByRole("button", { name: /send inquiry/i }));

    expect(await screen.findByText("Please enter your full name.")).toBeTruthy();
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(screen.getByText("Enter a valid phone number.")).toBeTruthy();
    expect(screen.getByText("Please share a little more detail.")).toBeTruthy();
    expect(screen.getByText("Please accept the privacy notice.")).toBeTruthy();
  });

  it("submits a valid inquiry and shows a polite success state", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<InquiryForm />);

    await user.type(screen.getByLabelText(/full name/i), "Akinyi Otieno");
    await user.type(screen.getByLabelText(/phone number/i), "0712345678");
    await user.type(screen.getByLabelText(/email address/i), "akinyi@example.com");
    await user.selectOptions(screen.getByLabelText(/what can we help with/i), "savings-and-loans");
    await user.type(
      screen.getByLabelText(/your message/i),
      "I would like to understand the savings process.",
    );
    await user.click(screen.getByLabelText(/i agree that giwesa may use/i));
    await user.click(screen.getByRole("button", { name: /send inquiry/i }));

    expect(await screen.findByText("Inquiry received.")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/inquiries",
      expect.objectContaining({ method: "POST" }),
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.privacy).toBe(true);
    expect(body.company).toBe("");
    expect(body.startedAt).toBeGreaterThan(0);
  });
});

describe("public booking form", () => {
  it("requires the essential booking fields", async () => {
    const user = userEvent.setup();
    render(<BookingForm />);

    await user.click(screen.getByRole("button", { name: /request consultation/i }));

    expect(await screen.findByText("Please enter your full name.")).toBeTruthy();
    expect(screen.getByText("Choose a valid date.")).toBeTruthy();
    expect(screen.getByText("Please accept the privacy notice.")).toBeTruthy();
  });
});
