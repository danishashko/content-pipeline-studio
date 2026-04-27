import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LIFETIME_LIMIT = 5;

function resolveIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();

  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();

  return "unknown";
}

export interface RateLimitOk {
  ok: true;
  ip: string;
  count: number;
  remaining: number;
}

export interface RateLimitDenied {
  ok: false;
  response: NextResponse;
}

export async function enforceIpLimit(
  request: NextRequest,
): Promise<RateLimitOk | RateLimitDenied> {
  const ip = resolveIp(request);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("increment_ip_usage", {
    p_ip: ip,
  });

  if (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Rate limiter unavailable" },
        { status: 503 },
      ),
    };
  }

  const count = typeof data === "number" ? data : Number(data);

  if (count > LIFETIME_LIMIT) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Rate limit reached (${LIFETIME_LIMIT} requests per IP, lifetime). Fork the project on GitHub and run with your own keys for unlimited use.`,
          fork_url: "https://github.com/danishashko/content-pipeline-studio/fork",
          api_url:
            "https://brightdata.com/cp/start?utm_source=content-pipeline-studio&utm_medium=demo&utm_campaign=rate-limit",
        },
        { status: 429 },
      ),
    };
  }

  return { ok: true, ip, count, remaining: LIFETIME_LIMIT - count };
}
