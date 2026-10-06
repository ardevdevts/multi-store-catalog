import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getSiteSettings, readSiteTheme } from "@/lib/site";

export async function GET(request: NextRequest) {
  const site = await getSiteSettings();
  const siteTheme = readSiteTheme(site.theme);
  const faviconUrl =
    siteTheme.branding?.faviconUrl || siteTheme.branding?.logoUrl;

  if (!faviconUrl) {
    return NextResponse.redirect(new URL("/default-favicon.png", request.url));
  }

  try {
    const response = await fetch(faviconUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.redirect(new URL("/default-favicon.png", request.url));
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = new Uint8Array(arrayBuffer);

    const resizedBuffer = await sharp(imageBuffer).resize(32, 32).png().toBuffer();
    const resized = new Uint8Array(resizedBuffer);

    return new NextResponse(resized, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error fetching favicon:", error);
    return NextResponse.redirect(new URL("/default-favicon.png", request.url));
  }
}