"use client";

import React, { useCallback, useState } from "react";
import Button from "@mui/material/Button";

type Props = {
  type?: "kyb" | "kyc";
  referenceId?: string | number | null;
  label?: string;
  className?: string;
  fullWidth?: boolean;
};

export default function PersonaVerifyButton({
  type = "kyb",
  referenceId,
  label = "Verify with Persona",
  className,
  fullWidth = false,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    try {
      setLoading(true);
      const { Inquiry } = await import("@persona-im/inquiry");
      const res = await fetch("/api/persona/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, referenceId }),
      });
      if (!res.ok) throw new Error("Failed to create inquiry");
      const { inquiryId, templateId, environmentId } = await res.json();
      if (!Inquiry) throw new Error("Persona SDK not available");
      Inquiry.open({
        inquiryId,
        templateId,
        environmentId: environmentId || process.env.NEXT_PUBLIC_PERSONA_ENV_ID || "sandbox",
        onComplete: () => {
          setLoading(false);
          window.dispatchEvent(new CustomEvent("persona:completed"));
        },
        onCancel: () => setLoading(false),
        onError: () => setLoading(false),
      });
    } catch (e) {
      setLoading(false);
    }
  }, [type, referenceId]);

  return (
    <Button variant="contained" color="primary" onClick={handleClick} disabled={loading} className={className} fullWidth={fullWidth}>
      {loading ? "Starting..." : label}
    </Button>
  );
}
