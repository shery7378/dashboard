import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { type = "kyb", referenceId, fields, returnUrl } = await req.json().catch(() => ({}));
    // Sanitize env values (strip inline comments/whitespace)
    const sanitize = (v?: string | null) => (v ?? "").split("#")[0].trim();
    const apiKey = sanitize(process.env.PERSONA_API_KEY);
    const envId = sanitize(process.env.PERSONA_ENV_ID) || sanitize(process.env.NEXT_PUBLIC_PERSONA_ENV_ID);
    const kybTpl = sanitize(process.env.PERSONA_KYB_TEMPLATE_ID);
    const kycTpl = sanitize(process.env.PERSONA_KYC_TEMPLATE_ID);
    const templateId = type === "kyb" ? kybTpl : kycTpl;

    if (!apiKey || !apiKey.startsWith("sk_")) {
      return NextResponse.json({ error: "persona_config_error", detail: "PERSONA_API_KEY missing or malformed. Ensure no inline comments and value starts with sk_." }, { status: 500 });
    }
    if (!templateId) {
      return NextResponse.json({ error: "persona_config_error", detail: `Missing ${type.toUpperCase()} template id.` }, { status: 500 });
    }

    // 1) Create Inquiry
    const inquiryRes = await fetch("https://withpersona.com/api/v1/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "inquiry",
          attributes: {
            templateId,
            referenceId: referenceId || null,
            fields: fields || undefined,
          },
        },
      }),
    });

    if (!inquiryRes.ok) {
      const detail = await inquiryRes.text();
      if (inquiryRes.status === 401) {
        const masked = (val: string) => (val ? `${val.slice(0, 6)}... (len:${val.length})` : 'none');
        return NextResponse.json(
          {
            error: "persona_auth_failed",
            detail,
            hint: {
              apiKeyPrefix: masked(apiKey),
            },
          },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: "persona_inquiry_failed", detail }, { status: inquiryRes.status || 500 });
    }
    const inquiryJson = await inquiryRes.json();
    const inquiryId = inquiryJson?.data?.id;

    // 2) Create Hosted Session
    const sessionRes = await fetch("https://withpersona.com/api/v1/inquiry-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "inquiry-session",
          attributes: {
            inquiryId,
            // Optionally specify return/callback url
            returnUrl: returnUrl || process.env.NEXTAUTH_URL || "http://vendor.multiKonnect.test:3001",
          },
        },
      }),
    });

    if (!sessionRes.ok) {
      const detail = await sessionRes.text();
      if (sessionRes.status === 401) {
        const masked = (val: string) => (val ? `${val.slice(0, 6)}... (len:${val.length})` : 'none');
        return NextResponse.json(
          {
            error: "persona_auth_failed",
            detail,
            hint: {
              apiKeyPrefix: masked(apiKey),
            },
          },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: "persona_session_failed", detail }, { status: sessionRes.status || 500 });
    }
    const sessionJson = await sessionRes.json();
    const hostedUrl = sessionJson?.data?.attributes?.redirectUrl || sessionJson?.data?.attributes?.url;

    return NextResponse.json({ hostedUrl, inquiryId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown_error" }, { status: 500 });
  }
}
