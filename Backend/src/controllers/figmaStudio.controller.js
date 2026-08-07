import FigmaDocument from "../models/figmaStudio.model.js";
import User from "../models/user.model.js";
import { uploadFile } from "../services/imagekit.service.js";

// @desc    Get all Figma documents accessible to current user (Admin or authorized Seller)
// @route   GET /api/figma-studio/documents
// @access  Private
export const getFigmaDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const isUserAdmin = req.user.role === "admin";

    let query = {};
    if (!isUserAdmin) {
      // Sellers only see docs owned by them or shared with them
      query = {
        $or: [{ owner: userId }, { sharedWithSellers: userId }, { isPublic: true }],
      };
    }

    const documents = await FigmaDocument.find(query)
      .populate("owner", "fullname email profilePic role")
      .populate("sharedWithSellers", "fullname email profilePic role")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single Figma document by ID
// @route   GET /api/figma-studio/documents/:id
// @access  Private
export const getFigmaDocumentById = async (req, res) => {
  try {
    const document = await FigmaDocument.findById(req.params.id)
      .populate("owner", "fullname email profilePic role")
      .populate("sharedWithSellers", "fullname email profilePic role");

    if (!document) {
      return res.status(404).json({ success: false, message: "Design document not found" });
    }

    res.status(200).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new Figma document
// @route   POST /api/figma-studio/documents
// @access  Private
export const createFigmaDocument = async (req, res) => {
  try {
    const { title, pages, activePageIndex } = req.body;

    const defaultPages = pages || [
      {
        id: "page-1",
        name: "Page 1",
        canvasBg: "#1e1e1e",
        elements: [],
      },
    ];

    const document = await FigmaDocument.create({
      title: title || "Untitled Design",
      owner: req.user._id,
      pages: defaultPages,
      activePageIndex: activePageIndex || 0,
    });

    res.status(201).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Figma document
// @route   PUT /api/figma-studio/documents/:id
// @access  Private
export const updateFigmaDocument = async (req, res) => {
  try {
    const { title, pages, activePageIndex, sharedWithSellers, isPublic } = req.body;

    const document = await FigmaDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Design document not found" });
    }

    if (title !== undefined) document.title = title;
    if (pages !== undefined) document.pages = pages;
    if (activePageIndex !== undefined) document.activePageIndex = activePageIndex;
    if (sharedWithSellers !== undefined) document.sharedWithSellers = sharedWithSellers;
    if (isPublic !== undefined) document.isPublic = isPublic;

    // Optional thumbnail upload via ImageKit
    if (req.file) {
      const uploadRes = await uploadFile(req.file.buffer, req.file.originalname, "/figma_thumbnails");
      document.thumbnail = uploadRes.url;
    }

    await document.save();
    res.status(200).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Figma document
// @route   DELETE /api/figma-studio/documents/:id
// @access  Private
export const deleteFigmaDocument = async (req, res) => {
  try {
    const document = await FigmaDocument.findByIdAndDelete(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: "Design document not found" });
    }
    res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin grants or revokes Figma Studio access for a Seller
// @route   POST /api/figma-studio/grant-access
// @access  Private/Admin
export const toggleSellerFigmaAccess = async (req, res) => {
  try {
    const { userId, hasFigmaAccess } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    targetUser.hasFigmaAccess = hasFigmaAccess;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `Figma Studio access ${hasFigmaAccess ? "granted to" : "revoked from"} ${targetUser.fullname}`,
      user: targetUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
