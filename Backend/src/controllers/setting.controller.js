import SiteSettings from "../models/siteSettings.model.js";
import AboutSetting from "../models/settings/about.setting.js";
import ContactSetting from "../models/settings/contact.setting.js";
import FooterSetting from "../models/settings/footer.setting.js";
import LegalSetting from "../models/settings/legal.setting.js";
import { broadcastUpdate } from "../services/socket.service.js";

// Helper function to ensure all sub-settings documents exist and are connected
async function getPopulatedSettings() {
    let settings = await SiteSettings.findOne();
    if (!settings) {
        const about = await AboutSetting.create({});
        const contact = await ContactSetting.create({});
        const footer = await FooterSetting.create({});
        const legal = await LegalSetting.create({});
        settings = await SiteSettings.create({
            about: about._id,
            contact: contact._id,
            footer: footer._id,
            legal: legal._id,
        });
    } else {
        let modified = false;
        if (!settings.about) {
            const about = await AboutSetting.create({});
            settings.about = about._id;
            modified = true;
        }
        if (!settings.contact) {
            const contact = await ContactSetting.create({});
            settings.contact = contact._id;
            modified = true;
        }
        if (!settings.footer) {
            const footer = await FooterSetting.create({});
            settings.footer = footer._id;
            modified = true;
        }
        if (!settings.legal) {
            const legal = await LegalSetting.create({});
            settings.legal = legal._id;
            modified = true;
        }
        if (modified) {
            await settings.save();
        }
    }
    return await SiteSettings.findOne()
        .populate("about")
        .populate("contact")
        .populate("footer")
        .populate("legal");
}

/**
 * @desc    Get site settings
 * @route   GET /api/settings
 * @access  Public
 */
export const getSettings = async (_req, res) => {
    try {
        const settings = await getPopulatedSettings();
        return res.status(200).json({ success: true, settings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update site settings
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
export const updateSettings = async (req, res) => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not initialized" });
        }

        if (req.body.about) {
            await AboutSetting.findByIdAndUpdate(settings.about._id, req.body.about, { new: true });
        }
        if (req.body.contact) {
            await ContactSetting.findByIdAndUpdate(settings.contact._id, req.body.contact, { new: true });
        }
        if (req.body.footer) {
            await FooterSetting.findByIdAndUpdate(settings.footer._id, req.body.footer, { new: true });
        }
        if (req.body.legal) {
            await LegalSetting.findByIdAndUpdate(settings.legal._id, req.body.legal, { new: true });
        }

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        return res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update about page settings
 * @route   PUT /api/settings/about
 * @access  Private/Admin
 */
export const updateAboutSettings = async (req, res) => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not initialized" });
        }

        await AboutSetting.findByIdAndUpdate(settings.about._id, req.body, { new: true, runValidators: true });

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        return res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update contact settings
 * @route   PUT /api/settings/contact
 * @access  Private/Admin
 */
export const updateContactSettings = async (req, res) => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not initialized" });
        }

        await ContactSetting.findByIdAndUpdate(settings.contact._id, req.body, { new: true, runValidators: true });

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        return res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update footer settings
 * @route   PUT /api/settings/footer
 * @access  Private/Admin
 */
export const updateFooterSettings = async (req, res) => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not initialized" });
        }

        await FooterSetting.findByIdAndUpdate(settings.footer._id, req.body, { new: true, runValidators: true });

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        return res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update legal settings
 * @route   PUT /api/settings/legal
 * @access  Private/Admin
 */
export const updateLegalSettings = async (req, res) => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not initialized" });
        }

        await LegalSetting.findByIdAndUpdate(settings.legal._id, req.body, { new: true, runValidators: true });

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        return res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update privacy policy settings
 * @route   PUT /api/settings/legal/privacy
 * @access  Private/Admin
 */
export const updatePrivacyPolicy = async (req, res) => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not initialized" });
        }

        const { privacyPolicy } = req.body;
        await LegalSetting.findByIdAndUpdate(settings.legal._id, { privacyPolicy }, { new: true, runValidators: true });

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        return res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update return policy settings
 * @route   PUT /api/settings/legal/returns
 * @access  Private/Admin
 */
export const updateReturnPolicy = async (req, res) => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not initialized" });
        }

        const { returnPolicy } = req.body;
        await LegalSetting.findByIdAndUpdate(settings.legal._id, { returnPolicy }, { new: true, runValidators: true });

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        return res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update terms of service settings
 * @route   PUT /api/settings/legal/terms
 * @access  Private/Admin
 */
export const updateTermsOfService = async (req, res) => {
    try {
        const settings = await getPopulatedSettings();
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not initialized" });
        }

        const { termsOfService } = req.body;
        await LegalSetting.findByIdAndUpdate(settings.legal._id, { termsOfService }, { new: true, runValidators: true });

        const updatedSettings = await SiteSettings.findOne()
            .populate("about")
            .populate("contact")
            .populate("footer")
            .populate("legal");

        if (updatedSettings) {
            broadcastUpdate("settings_update", updatedSettings.toObject());
        }

        return res.status(200).json({ success: true, settings: updatedSettings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
