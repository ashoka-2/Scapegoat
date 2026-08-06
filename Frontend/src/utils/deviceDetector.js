import { UAParser } from "ua-parser-js";

/**
 * Client-Side Device & Browser Detector powered by ua-parser-js
 * Detects Brave Browser via native navigator.brave.isBrave(), High-Entropy Hardware Models,
 * OS, Device Type (Desktop, Mobile, Tablet), and Mobile Hardware Vendors/Models.
 */
export const getClientDeviceInfo = async () => {
  const parser = new UAParser(navigator.userAgent);
  const result = parser.getResult();

  // 1. Precise Brave Browser Detection via Client Web API
  let browser = result.browser.name || "Chrome";
  if (navigator.brave && typeof navigator.brave.isBrave === "function") {
    try {
      const isBrave = await navigator.brave.isBrave();
      if (isBrave) browser = "Brave";
    } catch (e) {}
  }

  // 2. Operating System
  const os = result.os.name || "Windows";
  const isMobileOS = os === "Android" || os === "iOS";

  // 3. Device Category (Desktop, Mobile, Tablet)
  let device = "Desktop";
  const isTouch = navigator.maxTouchPoints > 0;
  const isMobileHint = navigator.userAgentData?.mobile === true;
  const isMobileUA = /mobi|android|iphone|ipad|ipod|touch/i.test(navigator.userAgent);

  if (result.device.type === "mobile" || isMobileOS || isMobileHint || isMobileUA) {
    device = result.device.type === "tablet" || /ipad|tablet/i.test(navigator.userAgent) ? "Tablet" : "Mobile";
  } else if (result.device.type === "tablet") {
    device = "Tablet";
  }

  // 4. Model Construction with High-Entropy Fallback
  let model = os === "macOS" || os === "Mac OS" ? "Apple Mac" : os === "Windows" ? "Windows PC" : "Linux PC";

  // Try High-Entropy Client Hints for exact OS model string if available
  let highEntropyModel = "";
  if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === "function") {
    try {
      const entropy = await navigator.userAgentData.getHighEntropyValues(["model"]);
      if (entropy && entropy.model && entropy.model.trim()) {
        highEntropyModel = entropy.model.trim();
      }
    } catch (e) {}
  }

  if (device === "Mobile" || device === "Tablet") {
    const vendor = result.device.vendor || "";
    const devModel = result.device.model || "";

    if (highEntropyModel) {
      model = highEntropyModel;
    } else if (vendor && devModel) {
      model = `${vendor} ${devModel}`;
    } else if (vendor) {
      model = `${vendor} Mobile`;
    } else if (devModel) {
      model = devModel;
    } else {
      model = `${os} Smartphone`;
    }
  }

  return {
    device,
    browser,
    os,
    model,
    userAgent: navigator.userAgent,
  };
};
