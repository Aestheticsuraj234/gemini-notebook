import dns from "node:dns/promises";

import ipaddr from "ipaddr.js";

const BLOCKED_HOSTNAMES = new Set(["localhost"]);

function isBlockedIpAddress(address: string) {
  try {
    const parsed = ipaddr.parse(address);
    const range = parsed.range();
    return (
      range === "private" ||
      range === "loopback" ||
      range === "linkLocal" ||
      range === "uniqueLocal" ||
      range === "carrierGradeNat"
    );
  } catch {
    return false;
  }
}

export async function assertPublicHttpsUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("Only public HTTPS URLs are supported");
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    throw new Error("Localhost URLs are not allowed");
  }

  if (ipaddr.isValid(hostname)) {
    if (isBlockedIpAddress(hostname)) {
      throw new Error("Private network URLs are not allowed");
    }
    return url;
  }

  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0) {
    throw new Error("Could not resolve URL hostname");
  }

  for (const record of records) {
    if (isBlockedIpAddress(record.address)) {
      throw new Error("Private network URLs are not allowed");
    }
  }

  return url;
}
