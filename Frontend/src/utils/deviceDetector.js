/**
 * Client-Side Accurate Device & Browser Detector
 * Detects Brave Browser via navigator.brave.isBrave(),
 * OS, Device Type (Desktop, Mobile, Tablet), and Mobile Hardware Models.
 */

export const getClientDeviceInfo = async () => {
  let browser = "Chrome";
  const ua = (navigator.userAgent || "").toLowerCase();

  // 1. Precise Brave Browser Detection
  if (navigator.brave && typeof navigator.brave.isBrave === "function") {
    try {
      const isBrave = await navigator.brave.isBrave();
      if (isBrave) browser = "Brave";
    } catch (e) {}
  }

  // 2. Fallback Browser Detection if not Brave
  if (browser !== "Brave") {
    if (ua.includes("edg/")) browser = "Edge";
    else if (ua.includes("samsungbrowser")) browser = "Samsung Internet";
    else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
    else if (ua.includes("chrome")) browser = "Chrome";
  }

  // 3. Operating System Detection
  let os = "Windows";
  if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) os = "iOS";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("windows")) os = "Windows";

  // 4. Device Category & Hardware Model
  let device = "Desktop";
  let model = os === "macOS" ? "Apple Mac" : os === "Windows" ? "Windows PC" : "Linux PC";

  const isTouch = navigator.maxTouchPoints > 0;
  const isMobileUA = /mobi|android|iphone|ipad/i.test(ua);

  if (isMobileUA || (isTouch && window.innerWidth <= 768)) {
    device = "Mobile";
    if (ua.includes("iphone")) model = "Apple iPhone";
    else if (ua.includes("ipad")) model = "Apple iPad";
    else if (ua.includes("samsung") || ua.includes("sm-")) model = "Samsung Galaxy";
    else if (ua.includes("pixel")) model = "Google Pixel";
    else if (ua.includes("redmi") || ua.includes("xiaomi") || ua.includes("poco")) model = "Xiaomi / Redmi";
    else if (ua.includes("oneplus")) model = "OnePlus";
    else if (ua.includes("oppo")) model = "Oppo";
    else if (ua.includes("vivo")) model = "Vivo";
    else if (ua.includes("realme")) model = "Realme";
    else model = `${os} Mobile`;
  } else if (isTouch && window.innerWidth <= 1024) {
    device = "Tablet";
    model = ua.includes("ipad") ? "Apple iPad" : `${os} Tablet`;
  }

  return {
    device,
    browser,
    os,
    model,
    userAgent: navigator.userAgent,
  };
};
