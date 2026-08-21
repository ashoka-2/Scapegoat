// Dynamic Razorpay SDK loader — avoids preloading 80+ payment chunks on every
// page load. The script is fetched only when a checkout is initiated.

let razorpayPromise = null;

/**
 * Lazily load the Razorpay Checkout SDK.
 * Returns a Promise that resolves with `window.Razorpay` once the script is
 * ready. Subsequent calls reuse the same promise (no duplicate loads).
 */
export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayPromise) return razorpayPromise;

  razorpayPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(new Error("Razorpay loaded but constructor not found."));
      }
    };
    script.onerror = () => {
      razorpayPromise = null; // allow retry on next call
      reject(new Error("Failed to load Razorpay SDK. Check your network connection."));
    };
    document.head.appendChild(script);
  });

  return razorpayPromise;
};
