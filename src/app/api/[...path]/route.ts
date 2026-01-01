import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendUrl(): string {
  return process.env.BACKEND_URL ?? "http://localhost:3000";
}

async function handler(request: NextRequest): Promise<NextResponse> {
  const backendUrl = getBackendUrl();
  const path = request.nextUrl.pathname.replace(/^\/api/, "");
  const targetUrl = `${backendUrl}${path}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(targetUrl, init);
  const responseHeaders = new Headers(response.headers);
  const outgoing = new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });

  const getSetCookie = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  const setCookies = getSetCookie
    ? getSetCookie.call(response.headers)
    : response.headers.get("set-cookie")
    ? [response.headers.get("set-cookie") as string]
    : [];

  if (setCookies.length) {
    outgoing.headers.delete("set-cookie");
    setCookies.forEach((cookie) => outgoing.headers.append("set-cookie", cookie));
  }

  return outgoing;
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };
