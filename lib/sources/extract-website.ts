import Firecrawl from "firecrawl";



import { SourceExtractionError } from "./extract-file";
import { assertPublicHttpsUrl } from "@/lib/sources/url-validation";

let firecrawlClient: Firecrawl | null = null;

function getFirecrawlClient() {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new SourceExtractionError("FIRECRAWL_API_KEY is not configured");
  }

  if (!firecrawlClient) {
    firecrawlClient = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
  }

  return firecrawlClient;
}

function normalizeWebsiteText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new SourceExtractionError("No readable page content found");
  }
  return trimmed;
}

function titleFromUrl(url: URL) {
  const hostname = url.hostname.replace(/^www\./, "");
  return hostname.charAt(0).toUpperCase() + hostname.slice(1);
}

export async function extractWebsiteSource(urlInput: string, titleOverride?: string) {
  const url = await assertPublicHttpsUrl(urlInput);
  const client = getFirecrawlClient();

  let document;
  try {
    document = await client.scrape(url.toString(), {
      formats: ["markdown"],
      onlyMainContent: true,
    });
  } catch {
    throw new SourceExtractionError("Could not scrape this webpage");
  }

  const resolvedUrl = document.metadata?.url ?? document.metadata?.sourceURL;
  if (resolvedUrl) {
    await assertPublicHttpsUrl(resolvedUrl);
  }

  const extractedText = normalizeWebsiteText(document.markdown ?? "");
  const title = titleOverride?.trim() || document.metadata?.title?.trim() || titleFromUrl(url);

  return {
    title,
    originalUrl: resolvedUrl ?? url.toString(),
    extractedText,
  };
}
