import { UAParser } from "ua-parser-js";

/**
 * Standard User-Agent & Device Parser using ua-parser-js
 * Identifies Browser, OS, Device Category (Desktop, Mobile, Tablet),
 * and exact Mobile Vendor & Model (e.g. Samsung Galaxy S23, Apple iPhone, Xiaomi Redmi Note 12).
 */
export const parseUserAgent = (uaString = "", ip = "", headers = {}) => {
  const parser = new UAParser(uaString);
  const result = parser.getResult();

  // 1. Browser Detection
  let browser = result.browser.name || "Chrome";
  const secChUa = (headers["sec-ch-ua"] || "").toLowerCase();
  if (secChUa.includes("brave") || (uaString || "").toLowerCase().includes("brave")) {
    browser = "Brave";
  }

  // 2. OS Detection
  const os = result.os.name || "Windows";
  const isMobileOS = os === "Android" || os === "iOS";

  // 3. Device Category (Desktop, Mobile, Tablet)
  let device = "Desktop";
  const secChMobile = (headers["sec-ch-ua-mobile"] || "").toLowerCase();
  const isMobileHeader = secChMobile.includes("1") || secChMobile.includes("true") || secChMobile.includes("?1");
  const isMobileUA = /mobi|android|iphone|ipad|ipod|touch|fennec|opera mini/i.test(uaString);

  if (result.device.type === "mobile" || isMobileOS || isMobileHeader || isMobileUA) {
    device = (result.device.type === "tablet" || /ipad|tablet/i.test(uaString)) ? "Tablet" : "Mobile";
  } else if (result.device.type === "tablet") {
    device = "Tablet";
  }

  // 4. Model Construction
  let model = "Desktop PC";
  if (device === "Mobile" || device === "Tablet") {
    const vendor = result.device.vendor || "";
    const devModel = result.device.model || "";
    if (vendor && devModel) {
      model = `${vendor} ${devModel}`;
    } else if (vendor) {
      model = `${vendor} Mobile`;
    } else if (devModel) {
      model = devModel;
    } else {
      model = `${os} Smartphone`;
    }
  } else {
    if (os === "macOS" || os === "Mac OS") model = "Apple Mac / MacBook";
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
