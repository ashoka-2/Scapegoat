import React from "react";
import MarketTaxInvoice from "../../Seller/Components/MarketTaxInvoice";

/**
 * OrderReceiptModal wrapper for Admin dashboard orders list.
 * Leverages the isolated, portaled MarketTaxInvoice engine.
 */
const OrderReceiptModal = ({ order, sellerUser = null, onClose }) => {
  if (!order) return null;

  return (
    <MarketTaxInvoice
      order={order}
      sellerUser={sellerUser}
      onClose={onClose}
    />
  );
};

export default OrderReceiptModal;
