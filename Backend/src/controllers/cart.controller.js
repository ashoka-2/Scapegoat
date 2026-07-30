import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";

/**
 * Helper to compute cart totals and item count
 */
const calculateCartTotals = (cart) => {
  let totalItems = 0;
  let subtotal = 0;

  if (cart && cart.items && cart.items.length > 0) {
    cart.items.forEach((item) => {
      totalItems += item.quantity;
      if (item.product) {
        // Use sellingPrice if available, otherwise maxPrice
        const itemPrice = item.product.sellingPrice?.amount || item.product.maxPrice?.amount || 0;
        subtotal += itemPrice * item.quantity;
      }
    });
  }

  return { totalItems, subtotal: Math.round(subtotal * 100) / 100 };
};

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = async (req, res) => {
  try {
    let cart = await cartModel.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select: "title slug maxPrice sellingPrice images stock stockStatus manageStock category brand",
      populate: [
        { path: "category", select: "name slug" },
        { path: "brand", select: "name slug image" },
      ],
    });

    if (!cart) {
      cart = await cartModel.create({ user: req.user._id, items: [] });
    }

    const { totalItems, subtotal } = calculateCartTotals(cart);

    return res.status(200).json({
      success: true,
      totalItems,
      subtotal,
      data: cart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cart",
    });
  }
};

/**
 * @desc    Add item to cart (with custom typed quantity or default 1)
 * @route   POST /api/cart/add
 * @access  Private
 */
export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, selectedAttributes, quantity = 1 } = req.body;

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Verify product exists and check stock
    const product = await productModel.findById(productId);
    if (!product || product.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    if (product.manageStock && product.stock < parsedQty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`,
      });
    }

    let cart = await cartModel.findOne({ user: req.user._id });
    if (!cart) {
      cart = await cartModel.create({ user: req.user._id, items: [] });
    }

    // Check if matching item is already in cart
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (variantId ? item.variantId?.toString() === variantId : !item.variantId)
    );

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + parsedQty;
      if (product.manageStock && newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock} units available in stock`,
        });
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        variantId: variantId || null,
        selectedAttributes: selectedAttributes || {},
        quantity: parsedQty,
      });
    }

    await cart.save();

    // Re-populate and return updated cart
    const updatedCart = await cartModel.findById(cart._id).populate({
      path: "items.product",
      select: "title slug maxPrice sellingPrice images stock stockStatus manageStock",
    });

    const { totalItems, subtotal } = calculateCartTotals(updatedCart);

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      totalItems,
      subtotal,
      data: updatedCart,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add product to cart",
    });
  }
};

/**
 * @desc    Increment item quantity (+1)
 * @route   PATCH /api/cart/item/:itemId/increment
 * @access  Private
 */
export const incrementQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    // Check product stock limit
    const product = await productModel.findById(item.product);
    if (product && product.manageStock && item.quantity + 1 > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Maximum stock reached (${product.stock} units available)`,
      });
    }

    item.quantity += 1;
    await cart.save();

    const updatedCart = await cartModel.findById(cart._id).populate({
      path: "items.product",
      select: "title slug maxPrice sellingPrice images stock stockStatus manageStock",
    });

    const { totalItems, subtotal } = calculateCartTotals(updatedCart);

    return res.status(200).json({
      success: true,
      message: "Quantity increased",
      totalItems,
      subtotal,
      data: updatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to increment quantity",
    });
  }
};

/**
 * @desc    Decrement item quantity (-1). Removes item if quantity reaches 0.
 * @route   PATCH /api/cart/item/:itemId/decrement
 * @access  Private
 */
export const decrementQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      // Remove item if quantity hits 0
      cart.items.pull({ _id: itemId });
    }

    await cart.save();

    const updatedCart = await cartModel.findById(cart._id).populate({
      path: "items.product",
      select: "title slug maxPrice sellingPrice images stock stockStatus manageStock",
    });

    const { totalItems, subtotal } = calculateCartTotals(updatedCart);

    return res.status(200).json({
      success: true,
      message: "Quantity decreased",
      totalItems,
      subtotal,
      data: updatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to decrement quantity",
    });
  }
};

/**
 * @desc    Manually update item quantity to a typed integer value
 * @route   PUT /api/cart/item/:itemId
 * @access  Private
 */
export const updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity value",
      });
    }

    const cart = await cartModel.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    if (parsedQty <= 0) {
      // Remove item if typed quantity is 0 or negative
      cart.items.pull({ _id: itemId });
    } else {
      // Verify product stock limit
      const product = await productModel.findById(item.product);
      if (product && product.manageStock && parsedQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units available in stock`,
        });
      }
      item.quantity = parsedQty;
    }

    await cart.save();

    const updatedCart = await cartModel.findById(cart._id).populate({
      path: "items.product",
      select: "title slug maxPrice sellingPrice images stock stockStatus manageStock",
    });

    const { totalItems, subtotal } = calculateCartTotals(updatedCart);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      totalItems,
      subtotal,
      data: updatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update quantity",
    });
  }
};

/**
 * @desc    Remove an item from cart by Item ID
 * @route   DELETE /api/cart/item/:itemId
 * @access  Private
 */
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items.pull({ _id: itemId });
    await cart.save();

    const updatedCart = await cartModel.findById(cart._id).populate({
      path: "items.product",
      select: "title slug maxPrice sellingPrice images stock stockStatus manageStock",
    });

    const { totalItems, subtotal } = calculateCartTotals(updatedCart);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      totalItems,
      subtotal,
      data: updatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove item from cart",
    });
  }
};

/**
 * @desc    Clear all items from user's cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
export const clearCart = async (req, res) => {
  try {
    const cart = await cartModel.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      totalItems: 0,
      subtotal: 0,
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear cart",
    });
  }
};
