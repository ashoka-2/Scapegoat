import { numberToWords } from "./numberToWords";

/**
 * Generates and prints a clean retail invoice in an isolated print frame.
 * Supports both Standard A4 Sheet and Mall-style POS Thermal Receipt (80mm).
 * @param {Object} options
 * @param {Object} options.order - The order object
 * @param {Object} options.sellerUser - The seller user object
 * @param {boolean} options.includeImages - Whether to include product images
 * @param {"A4" | "thermal"} options.paperSize - "A4" for full sheet, "thermal" for mall POS receipt
 */
export const printInvoiceDocument = ({
  order,
  sellerUser,
  includeImages = false,
  paperSize = "A4",
}) => {
  if (!order) return;

  const user = order.user || {};
  const shippingAddress = order.shippingAddress || {};
  const allItems = order.orderItems || order.items || [];

  const sellerId = sellerUser?._id?.toString();
  const sellerItems = sellerId
    ? allItems.filter(
        (item) =>
          item.seller?._id?.toString() === sellerId ||
          item.seller?.toString() === sellerId
      )
    : allItems;

  const displayItems = sellerItems.length > 0 ? sellerItems : allItems;
  const itemsSubtotal = displayItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const shippingCharges = 0;
  const grandTotal = itemsSubtotal + shippingCharges;

  const invoiceNumber = `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${String(
    order.orderId || order._id?.slice(-6) || "000000"
  ).padStart(6, "0").toUpperCase()}`;

  const isPaid = Boolean(order.isPaid);
  const paymentMethod = (order.paymentMethod || "COD").toUpperCase();
  const paymentId =
    order.paymentResult?.razorpayPaymentId ||
    order.paymentResult?.id ||
    "";

  const invoiceDateStr = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const storeName = sellerUser?.storeName || sellerUser?.fullname || "Official Store";
  const storeContact = sellerUser?.contact || "N/A";
  const storeEmail = sellerUser?.email || "seller@scapegoat.com";

  let billHtml = "";

  if (paperSize === "thermal") {
    // ----------------------------------------------------
    // POS THERMAL RECEIPT (80mm / MALL STYLE COMPACT BILL)
    // ----------------------------------------------------
    const thermalItemsHtml = displayItems
      .map((item, idx) => {
        const title = item.name || item.product?.title || "Product";
        const price = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const itemGross = price * qty;
        const selectedAttrs = item.selectedAttributes || {};
        const imgUrl = item.image || item.product?.images?.[0]?.url || item.product?.images?.[0] || "";

        const variantString =
          Object.keys(selectedAttrs).length > 0
            ? Object.entries(selectedAttrs)
                .map(([k, v]) => `${k}:${v}`)
                .join(", ")
            : "";

        return `
          <div style="padding: 6px 0; border-bottom: 1px dashed #999;">
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              ${
                includeImages && imgUrl
                  ? `<img src="${imgUrl}" alt="${title}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px; border: 1px solid #999; flex-shrink: 0;" />`
                  : ""
              }
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: bold; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${title}">
                  ${idx + 1}. ${title}
                </div>
                ${
                  variantString
                    ? `<div style="font-size: 9.5px; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">(${variantString})</div>`
                    : ""
                }
                <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-top: 3px;">
                  <span style="color: #444;">${qty} x ₹${price.toFixed(2)}</span>
                  <span style="font-weight: bold;">₹${itemGross.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    billHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>POS Receipt - ${invoiceNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 3mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
            color: #000;
            background: #fff;
            font-size: 11px;
            line-height: 1.35;
            width: 72mm;
            margin: 0 auto;
            padding: 4px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
          .flex-between { display: flex; justify-content: space-between; }
          @media print {
            body { width: 100%; margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="center" style="margin-bottom: 4px;">
          <h1 style="font-size: 18px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
            SCAPEGOAT
          </h1>
          <p style="font-size: 10px; font-weight: bold;">RETAIL POS BILL</p>
          <p style="font-size: 9.5px; color: #333;">Seller: ${storeName}</p>
          <p style="font-size: 9px; color: #555;">Ph: ${storeContact} | ${storeEmail}</p>
        </div>

        <div class="divider"></div>

        <div style="font-size: 9.5px;">
          <div class="flex-between"><span>Bill No:</span><span class="bold">${invoiceNumber}</span></div>
          <div class="flex-between"><span>Date:</span><span>${invoiceDateStr}</span></div>
          <div class="flex-between"><span>Order Ref:</span><span class="bold">#${order.orderId || order._id?.slice(-6).toUpperCase()}</span></div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 9.5px;">
          <div class="bold">CUSTOMER:</div>
          <div>${user.fullname || shippingAddress.fullname || "Customer"}</div>
          <div>Phone: ${user.contact || shippingAddress.phone || "N/A"}</div>
          <div style="font-size: 9px; color: #444;">
            ${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.pincode || ""}
          </div>
        </div>

        <div class="double-divider"></div>

        <div class="bold" style="font-size: 10px; margin-bottom: 3px;">ITEMS ORDERED</div>
        ${thermalItemsHtml}

        <div class="divider"></div>

        <div style="font-size: 11px;">
          <div class="flex-between">
            <span>Subtotal:</span>
            <span>₹${itemsSubtotal.toFixed(2)}</span>
          </div>
          <div class="flex-between">
            <span>Delivery:</span>
            <span>${shippingCharges === 0 ? "FREE" : `₹${shippingCharges.toFixed(2)}`}</span>
          </div>
          <div class="double-divider"></div>
          <div class="flex-between" style="font-size: 14px; font-weight: 900;">
            <span>TOTAL:</span>
            <span>₹${grandTotal.toFixed(2)}</span>
          </div>
          <div class="double-divider"></div>
        </div>

        <div style="margin: 6px 0; font-size: 9.5px;">
          <div class="flex-between">
            <span class="bold">Payment Mode:</span>
            <span class="bold">${paymentMethod}</span>
          </div>
          <div class="flex-between" style="margin-top: 2px;">
            <span>Status:</span>
            <span class="bold">${isPaid ? "PAID ONLINE" : "CASH ON DELIVERY"}</span>
          </div>
          ${paymentId ? `<div style="font-size: 8.5px; color: #555; margin-top: 2px;">Txn ID: ${paymentId}</div>` : ""}
        </div>

        <div class="divider"></div>

        <div class="center" style="font-size: 9px; margin-top: 6px; color: #444;">
          <p class="bold">THANK YOU FOR SHOPPING!</p>
          <p>Multi-Vendor Marketplace</p>
          <p style="margin-top: 4px; font-size: 8px;">*** End of Receipt ***</p>
        </div>
      </body>
      </html>
    `;
  } else {
    // ----------------------------------------------------
    // STANDARD A4 SHEET INVOICE
    // ----------------------------------------------------
    const itemsHtml = displayItems
      .map((item, idx) => {
        const title = item.name || item.product?.title || "Product";
        const price = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const itemGross = price * qty;
        const selectedAttrs = item.selectedAttributes || {};
        const imgUrl = item.image || item.product?.images?.[0]?.url || item.product?.images?.[0] || "";

        const variantString =
          Object.keys(selectedAttrs).length > 0
            ? Object.entries(selectedAttrs)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")
            : "";

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 6px; font-family: monospace; color: #64748b; font-size: 11px;">${idx + 1}</td>
            ${
              includeImages
                ? `<td style="padding: 8px 6px; width: 50px; text-align: center;">
                    ${
                      imgUrl
                        ? `<img src="${imgUrl}" alt="${title}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;" />`
                        : `<div style="width: 40px; height: 40px; border-radius: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 8px; display: flex; align-items: center; justify-content: center; color: #94a3b8;">N/A</div>`
                    }
                  </td>`
                : ""
            }
            <td style="padding: 10px 8px;">
              <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${title}</div>
              ${
                variantString
                  ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">Variant: <b>${variantString}</b></div>`
                  : ""
              }
            </td>
            <td style="padding: 10px 8px; text-align: center; font-family: monospace; font-weight: 700; font-size: 12px; color: #0f172a;">${qty}</td>
            <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #475569; font-size: 12px;">₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td style="padding: 10px 8px; text-align: right; font-family: monospace; font-weight: 800; color: #0f172a; font-size: 12px;">₹${itemGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        `;
      })
      .join("");

    billHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Scapegoat Receipt - ${invoiceNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            font-size: 11.5px;
            line-height: 1.4;
            padding: 0;
          }
          .invoice-card {
            max-width: 800px;
            margin: 0 auto;
            padding: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .meta-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
          }
          @media print {
            body {
              padding: 0;
            }
            .invoice-card {
              padding: 0;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          
          <!-- Header -->
          <table style="border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px;">
            <tr>
              <td style="vertical-align: top;">
                <h1 style="font-size: 22px; font-weight: 900; letter-spacing: 0.5px; color: #0f172a; text-transform: uppercase; margin-bottom: 3px;">
                  SCAPEGOAT
                </h1>
                <p style="font-size: 11px; font-weight: 700; color: #334155;">
                  Seller Store: ${storeName}
                </p>
                <p style="font-size: 10px; color: #64748b;">
                  Email: ${storeEmail} • Contact: ${storeContact}
                </p>
                <p style="font-size: 10px; color: #64748b;">
                  Platform: Scapegoat Multi-Vendor Marketplace
                </p>
              </td>
              <td style="text-align: right; vertical-align: top; font-family: monospace;">
                <div style="display: inline-block; background: #0f172a; color: #fff; padding: 4px 10px; border-radius: 4px; font-weight: 900; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">
                  RETAIL INVOICE
                </div>
                <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${invoiceNumber}</div>
                <div style="font-size: 11px; color: #64748b;">Date: ${invoiceDateStr}</div>
                <div style="font-size: 11px; color: #64748b;">Order Ref: #${order.orderId || order._id?.slice(-6).toUpperCase()}</div>
              </td>
            </tr>
          </table>

          <!-- Customer & Delivery -->
          <table style="margin-bottom: 20px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 8px;">
                <div class="meta-box">
                  <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 4px;">
                    BILLED TO (CUSTOMER)
                  </div>
                  <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${user.fullname || shippingAddress.fullname || "Customer"}</div>
                  <div style="color: #475569; font-size: 11px;">${user.email || "N/A"}</div>
                  <div style="color: #475569; font-size: 11px;">Phone: <b>${user.contact || shippingAddress.phone || "N/A"}</b></div>
                  <div style="color: #475569; font-size: 11px; margin-top: 2px;">
                    ${shippingAddress.street || ""}, ${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.pincode || ""}
                  </div>
                </div>
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 8px;">
                <div class="meta-box">
                  <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 4px;">
                    SHIP TO (DELIVERY ADDRESS)
                  </div>
                  <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${shippingAddress.fullname || user.fullname || "Recipient"}</div>
                  <div style="color: #475569; font-size: 11px;">${shippingAddress.street || "Delivery Destination"}</div>
                  <div style="color: #475569; font-size: 11px;">
                    ${shippingAddress.city || ""}, ${shippingAddress.state || ""} - <b>${shippingAddress.pincode || ""}</b>
                  </div>
                  <div style="color: #475569; font-size: 11px; margin-top: 2px;">Country: ${shippingAddress.country || "India"}</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Products Table -->
          <table style="margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b;">
                <th style="padding: 8px 6px; width: 30px;">#</th>
                ${includeImages ? '<th style="padding: 8px 6px; width: 50px; text-align: center;">Photo</th>' : ""}
                <th style="padding: 8px 8px;">Item Description</th>
                <th style="padding: 8px 8px; text-align: center; width: 45px;">Qty</th>
                <th style="padding: 8px 8px; text-align: right; width: 90px;">Price</th>
                <th style="padding: 8px 8px; text-align: right; width: 100px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Summary -->
          <table style="margin-bottom: 20px;">
            <tr>
              <td style="width: 55%; vertical-align: top; padding-right: 12px;">
                <div style="font-size: 9.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;">
                  Amount in Words:
                </div>
                <div style="font-size: 11.5px; font-weight: 800; font-style: italic; color: #1e293b;">
                  ${numberToWords(grandTotal)}
                </div>

                <div style="margin-top: 14px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                    Payment Mode: <span style="color: #0f172a;">${paymentMethod}</span>
                  </div>
                  <div style="font-size: 10px; font-weight: 700; color: ${isPaid ? "#166534" : "#9a3412"}; margin-top: 2px; text-transform: uppercase;">
                    Status: <b>${isPaid ? "PAID ONLINE" : paymentMethod === "COD" ? "CASH ON DELIVERY" : "PAYMENT PENDING"}</b>
                  </div>
                  ${paymentId ? `<div style="font-size: 9.5px; font-family: monospace; color: #64748b; margin-top: 3px;">Txn Ref: ${paymentId}</div>` : ""}
                </div>
              </td>

              <td style="width: 45%; vertical-align: top; padding-left: 12px; font-family: monospace;">
                <div class="meta-box" style="padding: 12px;">
                  <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: #475569; margin-bottom: 6px;">
                    <span>Items Subtotal:</span>
                    <span>₹${itemsSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: #475569; margin-bottom: 8px;">
                    <span>Delivery Fee:</span>
                    <span style="color: #166534; font-weight: 700;">${shippingCharges === 0 ? "FREE" : `₹${shippingCharges.toFixed(2)}`}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; color: #0f172a; padding-top: 8px; border-top: 2px solid #0f172a;">
                    <span>TOTAL AMOUNT:</span>
                    <span>₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table style="border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 10px; color: #64748b;">
            <tr>
              <td style="width: 60%; vertical-align: bottom;">
                <p style="font-weight: 700; color: #334155; margin-bottom: 2px;">Thank you for ordering on Scapegoat!</p>
                <p>This is a computer generated retail invoice and requires no physical signature.</p>
              </td>
              <td style="width: 40%; text-align: right; vertical-align: bottom;">
                <p style="font-weight: 700; color: #1e293b; text-transform: uppercase;">
                  For SCAPEGOAT / ${storeName}
                </p>
                <div style="margin-top: 16px; border-top: 1px dashed #cbd5e1; padding-top: 3px; font-size: 9px; text-transform: uppercase; color: #94a3b8;">
                  Authorized Store Representative
                </div>
              </td>
            </tr>
          </table>

        </div>
      </body>
      </html>
    `;
  }

  // Create an invisible print iframe to ensure 100% clean isolation with NO dashboard UI leaks
  const iframeId = "scapegoat-invoice-print-frame";
  let printFrame = document.getElementById(iframeId);
  if (printFrame) {
    document.body.removeChild(printFrame);
  }

  printFrame = document.createElement("iframe");
  printFrame.id = iframeId;
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow.document;
  frameDoc.open();
  frameDoc.write(billHtml);
  frameDoc.close();

  // Trigger print once content has rendered
  setTimeout(() => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (e) {
      console.error("Print error:", e);
    }
  }, 350);
};
