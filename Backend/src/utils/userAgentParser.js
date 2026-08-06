/**
 * Enhanced User-Agent & Device Parser Utility
 * Accurately identifies Browser (including Brave, Edge, Chrome, Safari, Firefox),
 * OS (Windows, macOS, iOS, Android, Linux), Device Type (Desktop, Mobile, Tablet),
 * and specific Device Model (iPhone, Samsung Galaxy, Google Pixel, Xiaomi, OnePlus, MacBook, Windows PC).
 */

export const parseUserAgent = (uaString = "", ip = "", headers = {}) => {
  const ua = (uaString || "").toLowerCase();
  const secChUa = (headers["sec-ch-ua"] || "").toLowerCase();

  // 1. Browser Detection
  let browser = "Chrome";
  if (secChUa.includes("brave") || ua.includes("brave") || headers["x-brave-api"]) {
    browser = "Brave";
  } else if (secChUa.includes("edg") || ua.includes("edg/")) {
    browser = "Edge";
  } else if (ua.includes("samsungbrowser")) {
    browser = "Samsung Internet";
  } else if (ua.includes("opr/") || ua.includes("opera")) {
    browser = "Opera";
  } else if (ua.includes("firefox") || ua.includes("fxios")) {
    browser = "Firefox";
  } else if (ua.includes("crios") || (ua.includes("chrome") && !ua.includes("chromium"))) {
    browser = "Chrome";
  } else if (ua.includes("safari") && !ua.includes("chrome") && !ua.includes("android")) {
    browser = "Safari";
  }

  // 2. OS Detection
  let os = "Windows";
  if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    os = "iOS";
  } else if (ua.includes("mac os") || ua.includes("macintosh")) {
    os = "macOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("windows") || ua.includes("win64") || ua.includes("win32")) {
    os = "Windows";
  }

  // 3. Device Category
  let device = "Desktop";
  if (ua.includes("ipad") || ua.includes("tablet") || (ua.includes("android") && !ua.includes("mobile"))) {
    device = "Tablet";
  } else if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) {
    device = "Mobile";
  }

  // 4. Detailed Device Model Detection
  let model = "Desktop PC";
  if (device === "Mobile" || device === "Tablet") {
    if (ua.includes("iphone")) {
      model = "Apple iPhone";
    } else if (ua.includes("ipad")) {
      model = "Apple iPad";
    } else if (ua.includes("samsung") || ua.includes("sm-")) {
      model = "Samsung Galaxy";
    } else if (ua.includes("pixel")) {
      model = "Google Pixel";
    } else if (ua.includes("redmi") || ua.includes("xiaomi") || ua.includes("poco")) {
      model = "Xiaomi / Redmi";
    } else if (ua.includes("oneplus")) {
      model = "OnePlus";
    } else if (ua.includes("oppo")) {
      model = "Oppo";
    } else if (ua.includes("vivo")) {
      model = "Vivo";
    } else if (ua.includes("realme")) {
      model = "Realme";
    } else {
      model = `${os} Mobile`;
    }
  } else {
    if (os === "macOS") model = "Apple Mac / MacBook";
    else if (os === "Windows") model = "Windows PC";
    else if (os === "Linux") model = "Linux Workstation";
  }

  return {
    device,
    browser,
    os,
    model,
    ip: ip || "127.0.0.1",
    userAgent: uaString,
  };
};
