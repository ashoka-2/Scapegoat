import { useDispatch, useSelector } from "react-redux";
import { setSettings, setLoading, setError } from "../State/settings.slice";
import * as api from "../Services/settings.api";
import { addToast } from "../../../utils/toast.slice";

export const useSettings = () => {
  const dispatch = useDispatch();
  const { settings } = useSelector((state) => state.settings);

  const toast = (message, type = "success") => dispatch(addToast({ message, type }));
  const errMsg = (e) => e?.response?.data?.message || "Failed to load settings.";

  const handleGetSettings = async () => {
    // Skip if already loaded (avoid redundant calls)
    if (settings) return;

    dispatch(setLoading(true));
    try {
      const data = await api.getSettings();
      if (data.settings) {
        dispatch(setSettings(data.settings));
      }
      return data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateSettings = async (settingsData) => {
    dispatch(setLoading(true));
    try {
      const data = await api.updateSettings(settingsData);
      if (data.settings) {
        dispatch(setSettings(data.settings));
        toast("Settings saved & published to all users! ⚡");
      }
      return data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateAboutSettings = async (aboutData) => {
    dispatch(setLoading(true));
    try {
      const data = await api.updateAbout(aboutData);
      if (data.settings) {
        dispatch(setSettings(data.settings));
        toast("About page content saved! 📝");
      }
      return data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateContactSettings = async (contactData) => {
    dispatch(setLoading(true));
    try {
      const data = await api.updateContact(contactData);
      if (data.settings) {
        dispatch(setSettings(data.settings));
        toast("Contact & Map settings saved! 📍");
      }
      return data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateFooterSettings = async (footerData) => {
    dispatch(setLoading(true));
    try {
      const data = await api.updateFooter(footerData);
      if (data.settings) {
        dispatch(setSettings(data.settings));
        toast("Footer settings saved & published! 🧩");
      }
      return data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateLegalSettings = async (legalData) => {
    dispatch(setLoading(true));
    try {
      const data = await api.updateLegal(legalData);
      if (data.settings) {
        dispatch(setSettings(data.settings));
        toast("All Legal Pages updated! ⚖️");
      }
      return data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdatePrivacyPolicy = async (privacyPolicy) => {
    dispatch(setLoading(true));
    try {
      const data = await api.updatePrivacyPolicy(privacyPolicy);
      if (data.settings) {
        dispatch(setSettings(data.settings));
        toast("Privacy Policy saved! 🔒");
      }
      return data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateReturnPolicy = async (returnPolicy) => {
    dispatch(setLoading(true));
    try {
      const data = await api.updateReturnPolicy(returnPolicy);
      if (data.settings) {
        dispatch(setSettings(data.settings));
        toast("Return Policy saved! 📦");
      }
      return data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateTermsOfService = async (termsOfService) => {
    dispatch(setLoading(true));
    try {
      const data = await api.updateTermsOfService(termsOfService);
      if (data.settings) {
        dispatch(setSettings(data.settings));
        toast("Terms of Service saved! 📝");
      }
      return data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    handleGetSettings,
    handleUpdateSettings,
    handleUpdateAboutSettings,
    handleUpdateContactSettings,
    handleUpdateFooterSettings,
    handleUpdateLegalSettings,
    handleUpdatePrivacyPolicy,
    handleUpdateReturnPolicy,
    handleUpdateTermsOfService,
  };
};
