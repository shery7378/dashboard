"use client";

import FusePageSimple from "@fuse/core/FusePageSimple";
import { Box, Button, Card, CardContent, CardHeader, Stack, Typography, Alert } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

export default function VendorKybPage() {
  const [status, setStatus] = useState<string>("not_verified");
  const { data: session } = useSession();
  const vendorId = useMemo(() => (session as any)?.db?.id || (session as any)?.user?.id || null, [session]);

  useEffect(() => {
    function onDone() {
      // TODO: call your API to refresh vendor verification status
      setStatus("pending_review");
    }
    window.addEventListener("persona:completed", onDone as EventListener);
    return () => window.removeEventListener("persona:completed", onDone as EventListener);
  }, []);

  return (
    <FusePageSimple
      header={
        <Box sx={{ px: { xs: 2, md: 4 }, py: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            KYB Verification
          </Typography>
          <Typography color="text.secondary">Verify your business with Persona</Typography>
        </Box>
      }
      content={
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Alert severity={status === "verified" ? "success" : status === "rejected" ? "error" : status === "pending_review" ? "info" : "warning"}>
              Status: {status}
            </Alert>

            <Card>
              <CardHeader title="Business Verification (Hosted)" />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click the button to open Persona in a new window and complete verification.
                </Typography>
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/persona/hosted", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "kyb", referenceId: vendorId })
                      });
                      const json = await res.json();
                      const url = json?.hostedUrl;
                      if (url) {
                        window.location.href = url;
                      }
                    } catch {}
                  }}
                >
                  Verify with Persona
                </Button>
              </CardContent>
            </Card>

            <Box>
              <Button variant="outlined" onClick={() => location.reload()}>Refresh Status</Button>
            </Box>
          </Stack>
        </Box>
      }
    />
  );
}
