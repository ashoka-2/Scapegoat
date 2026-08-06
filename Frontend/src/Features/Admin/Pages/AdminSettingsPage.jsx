import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addToast } from "../../../utils/toast.slice";

const AdminSettingsPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);

  // 1. About Us Form State
  const [aboutForm, setAboutForm] = useState({
    title: "Our Vision & Legacy",
    content: "ScapeGoat is a luxury e-commerce platform redefining modern fashion and digital commerce.",
    missionStatement: "To deliver high-quality, sustainable products to customers worldwide.",
  });

  // 2. Contact Info & Map State
  const [contactForm, setContactForm] = useState({
    email: "support@scapegoat.com",
    phone: "+91 98765 43210",
    address: "123 Fashion Street, Bandra West, Mumbai, MH - 400050",
    supportHours: "Mon - Sat: 9:00 AM - 8:00 PM IST",
    mapLat: 19.076,
    mapLng: 72.8777,
    mapZoom: 14,
  });

  // 3. Footer & Social Links State (Dynamic list matching Snitch architecture)
  const [footerForm, setFooterForm] = useState({
    copyrightText: `© ${new Date().getFullYear()} ScapeGoat Inc. All Rights Reserved.`,
    socialLinks: [
      { id: "instagram", platform: "Instagram", icon: "ri-instagram-line", url: "https://instagram.com/scapegoat" },
      { id: "twitter", platform: "X / Twitter", icon: "ri-twitter-x-line", url: "https://twitter.com/scapegoat" },
      { id: "facebook", platform: "Facebook", icon: "ri-facebook-circle-line", url: "https://facebook.com/scapegoat" },
      { id: "youtube", platform: "YouTube", icon: "ri-youtube-line", url: "https://youtube.com/scapegoat" },
    ],
  });

  // 4. Legal Policies State
  const [legalForm, setLegalForm] = useState({
    privacyPolicy: `<h2><strong>1. Information We Collect</strong></h2><p>We collect personal information that you provide to us, such as your name, shipping address, email address, phone number, and payment information when you make a purchase on ScapeGoat.</p><h2><strong>2. How We Use Your Information</strong></h2><p>We use your information to process transactions, manage your account, deliver products, communicate with you about orders and promotions, and improve our website and services.</p>`,
    termsOfService: `<h2><strong>1. Agreement to Terms</strong></h2><p>By accessing and shopping at ScapeGoat, you agree to be bound by these Terms of Service. If you do not agree, please do not use our website or services.</p><h2><strong>2. Pricing & Product Details</strong></h2><p>We strive to display product colors and prices as accurately as possible. However, we reserve the right to correct any pricing errors.</p>`,
    returnPolicy: `<h2><strong>1. Return & Exchange Window</strong></h2><p>We offer a hassle-free 15-day return and exchange policy from the date of delivery. Items must be unworn, unwashed, and in their original packaging.</p><h2><strong>2. Refund Process</strong></h2><p>Approved refunds will be credited back to your original payment method within 5-7 business days.</p>`,
  });

  // Fetch Existing Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/settings", { withCredentials: true });
      const settingsData = res.data.settings || res.data.data;
      if (res.data.success && settingsData) {
        const { about, contact, footer, legal } = settingsData;
        if (about) {
          setAboutForm({
            title: about.title || aboutForm.title,
            content: about.content || aboutForm.content,
            missionStatement: about.missionStatement || aboutForm.missionStatement,
          });
        }
        if (contact) {
          setContactForm({
            email: contact.email || contactForm.email,
            phone: contact.phone || contactForm.phone,
            address: contact.address || contactForm.address,
            supportHours: contact.supportHours || contactForm.supportHours,
            mapLat: contact.mapLat ?? contactForm.mapLat,
            mapLng: contact.mapLng ?? contactForm.mapLng,
            mapZoom: contact.mapZoom ?? contactForm.mapZoom,
          });
        }
        if (footer) {
          setFooterForm({
            copyrightText: footer.copyrightText || footerForm.copyrightText,
            socialLinks: footer.socialLinks?.length > 0 ? footer.socialLinks : footerForm.socialLinks,
          });
        }
        if (legal) {
          setLegalForm({
            privacyPolicy: legal.privacyPolicy || legalForm.privacyPolicy,
            termsOfService: legal.termsOfService || legalForm.termsOfService,
            returnPolicy: legal.returnPolicy || legalForm.returnPolicy,
          });
        }
      }
    } catch (e) {
      dispatch(addToast({ message: "Loaded default site settings", type: "info" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ── Section Save Handlers ──

  const saveAboutSection = async (e) => {
    e.preventDefault();
    setSavingSection("about");
    try {
      const res = await axios.put("http://localhost:3000/api/settings/about", aboutForm, { withCredentials: true });
      if (res.data.success) {
        dispatch(addToast({ message: "About Us section updated!", type: "success" }));
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || "Failed to update About Us", type: "error" }));
    } finally {
      setSavingSection(null);
    }
  };

  const saveContactSection = async (e) => {
    e.preventDefault();
    setSavingSection("contact");
    try {
      const res = await axios.put("http://localhost:3000/api/settings/contact", contactForm, { withCredentials: true });
      if (res.data.success) {
        dispatch(addToast({ message: "Contact & Map settings updated!", type: "success" }));
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || "Failed to update Contact settings", type: "error" }));
    } finally {
      setSavingSection(null);
    }
  };

  const saveFooterSection = async (e) => {
    e.preventDefault();
    setSavingSection("footer");
    try {
      const res = await axios.put("http://localhost:3000/api/settings/footer", footerForm, { withCredentials: true });
      if (res.data.success) {
        dispatch(addToast({ message: "Footer & Social links updated!", type: "success" }));
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || "Failed to update Footer links", type: "error" }));
    } finally {
      setSavingSection(null);
    }
  };

  const savePrivacySection = async (e) => {
    e.preventDefault();
    setSavingSection("privacy");
    try {
      const res = await axios.put(
        "http://localhost:3000/api/settings/legal/privacy",
        { privacyPolicy: legalForm.privacyPolicy },
        { withCredentials: true }
      );
      if (res.data.success) {
        dispatch(addToast({ message: "Privacy Policy updated!", type: "success" }));
      }
    } catch (err) {
      dispatch(addToast({ message: "Failed to update Privacy Policy", type: "error" }));
    } finally {
      setSavingSection(null);
    }
  };

  const saveTermsSection = async (e) => {
    e.preventDefault();
    setSavingSection("terms");
    try {
      const res = await axios.put(
        "http://localhost:3000/api/settings/legal/terms",
        { termsOfService: legalForm.termsOfService },
        { withCredentials: true }
      );
      if (res.data.success) {
        dispatch(addToast({ message: "Terms of Service updated!", type: "success" }));
      }
    } catch (err) {
      dispatch(addToast({ message: "Failed to update Terms of Service", type: "error" }));
    } finally {
      setSavingSection(null);
    }
  };

  const saveReturnsSection = async (e) => {
    e.preventDefault();
    setSavingSection("returns");
    try {
      const res = await axios.put(
        "http://localhost:3000/api/settings/legal/returns",
        { returnPolicy: legalForm.returnPolicy },
        { withCredentials: true }
      );
      if (res.data.success) {
        dispatch(addToast({ message: "Return Policy updated!", type: "success" }));
      }
    } catch (err) {
      dispatch(addToast({ message: "Failed to update Return Policy", type: "error" }));
    } finally {
      setSavingSection(null);
    }
  };

  // Social Links Handlers
  const addSocialLink = () => {
    if (footerForm.socialLinks.length >= 5) {
      dispatch(addToast({ message: "Maximum 5 social links allowed", type: "error" }));
      return;
    }
    const newLink = {
      id: `social_${Date.now()}`,
      platform: "New Platform",
      icon: "ri-link",
      url: "https://",
    };
    setFooterForm({ ...footerForm, socialLinks: [...footerForm.socialLinks, newLink] });
  };

  const removeSocialLink = (index) => {
    const updated = footerForm.socialLinks.filter((_, idx) => idx !== index);
    setFooterForm({ ...footerForm, socialLinks: updated });
  };

  const updateSocialLink = (index, field, value) => {
    const updated = [...footerForm.socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setFooterForm({ ...footerForm, socialLinks: updated });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
            Storefront Configuration
          </span>
          <h1 className="text-2xl font-black text-foreground">Global Site Settings</h1>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-1.5 bg-background/60 p-1.5 rounded-2xl border border-border-theme overflow-x-auto">
        {[
          { key: "about", label: "About Us Page", icon: "ri-information-line" },
          { key: "contact", label: "Contact & Map", icon: "ri-map-pin-line" },
          { key: "footer", label: "Footer & Social Links", icon: "ri-share-line" },
          { key: "privacy", label: "Privacy Policy", icon: "ri-shield-user-line" },
          { key: "terms", label: "Terms of Service", icon: "ri-file-text-line" },
          { key: "returns", label: "Return Policy", icon: "ri-restart-line" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === tab.key
                ? "bg-accent text-accent-content shadow-sm scale-[1.02]"
                : "text-foreground/70 hover:text-foreground hover:bg-surface"
            }`}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 1. About Us Tab ── */}
      {activeTab === "about" && (
        <form onSubmit={saveAboutSection} className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">About Us Page Content</h2>
              <p className="text-xs text-foreground/50">Manage mission statements and brand story</p>
            </div>
            <button
              type="submit"
              disabled={savingSection === "about"}
              className="px-5 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {savingSection === "about" ? "Saving..." : "Save About Settings"}
            </button>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div className="space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Headline Title</label>
              <input
                type="text"
                value={aboutForm.title}
                onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Brand Overview / Content</label>
              <textarea
                rows={5}
                value={aboutForm.content}
                onChange={(e) => setAboutForm({ ...aboutForm, content: e.target.value })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Mission Statement</label>
              <textarea
                rows={3}
                value={aboutForm.missionStatement}
                onChange={(e) => setAboutForm({ ...aboutForm, missionStatement: e.target.value })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent resize-none"
              />
            </div>
          </div>
        </form>
      )}

      {/* ── 2. Contact & Map Tab ── */}
      {activeTab === "contact" && (
        <form onSubmit={saveContactSection} className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Contact & Map Coordinates</h2>
              <p className="text-xs text-foreground/50">Manage store address, map pin coordinates, support email and phone</p>
            </div>
            <button
              type="submit"
              disabled={savingSection === "contact"}
              className="px-5 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {savingSection === "contact" ? "Saving..." : "Save Contact Settings"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Support Email</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Support Phone</label>
              <input
                type="text"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Headquarters Address</label>
              <input
                type="text"
                value={contactForm.address}
                onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Support Working Hours</label>
              <input
                type="text"
                value={contactForm.supportHours}
                onChange={(e) => setContactForm({ ...contactForm, supportHours: e.target.value })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            {/* Map Latitude & Longitude Selection */}
            <div className="space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Map Latitude (Lat)</label>
              <input
                type="number"
                step="any"
                value={contactForm.mapLat}
                onChange={(e) => setContactForm({ ...contactForm, mapLat: parseFloat(e.target.value) || 0 })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Map Longitude (Lng)</label>
              <input
                type="number"
                step="any"
                value={contactForm.mapLng}
                onChange={(e) => setContactForm({ ...contactForm, mapLng: parseFloat(e.target.value) || 0 })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Interactive Map Preview Box */}
          <div className="p-4 bg-background/50 border border-border-theme rounded-2xl space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-accent flex items-center gap-1.5">
              <i className="ri-map-pin-2-line" /> Map Coordinates Preview: Lat {contactForm.mapLat}, Lng {contactForm.mapLng}
            </span>
            <div className="w-full h-40 bg-surface border border-border-theme rounded-xl flex items-center justify-center text-foreground/50 text-xs font-mono">
              <iframe
                title="Google Maps Location Preview"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, borderRadius: "12px" }}
                src={`https://maps.google.com/maps?q=${contactForm.mapLat},${contactForm.mapLng}&z=15&output=embed`}
              />
            </div>
          </div>
        </form>
      )}

      {/* ── 3. Footer & Social Links Tab ── */}
      {activeTab === "footer" && (
        <form onSubmit={saveFooterSection} className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Footer Copyright & Social Links</h2>
              <p className="text-xs text-foreground/50">Manage dynamic social media channels (Max 5 links)</p>
            </div>
            <button
              type="submit"
              disabled={savingSection === "footer"}
              className="px-5 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {savingSection === "footer" ? "Saving..." : "Save Footer Settings"}
            </button>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div className="space-y-1.5">
              <label className="text-foreground/70 text-[10px] font-extrabold uppercase">Copyright Notice</label>
              <input
                type="text"
                value={footerForm.copyrightText}
                onChange={(e) => setFooterForm({ ...footerForm, copyrightText: e.target.value })}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            {/* Social Links List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Social Channels ({footerForm.socialLinks.length}/5)
                </span>
                {footerForm.socialLinks.length < 5 && (
                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="px-3 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 text-xs font-bold hover:bg-accent hover:text-accent-content transition cursor-pointer"
                  >
                    + Add Link
                  </button>
                )}
              </div>

              {footerForm.socialLinks.map((link, idx) => (
                <div key={idx} className="p-4 bg-background/50 border border-border-theme/40 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="Platform Name (e.g. Instagram)"
                    value={link.platform}
                    onChange={(e) => updateSocialLink(idx, "platform", e.target.value)}
                    className="w-full sm:w-1/3 bg-surface border border-border-theme rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                  />

                  <input
                    type="text"
                    placeholder="Icon Class (e.g. ri-instagram-line)"
                    value={link.icon}
                    onChange={(e) => updateSocialLink(idx, "icon", e.target.value)}
                    className="w-full sm:w-1/4 bg-surface border border-border-theme rounded-xl px-3 py-2 text-foreground font-mono text-[11px] focus:outline-none focus:border-accent"
                  />

                  <input
                    type="text"
                    placeholder="URL (https://...)"
                    value={link.url}
                    onChange={(e) => updateSocialLink(idx, "url", e.target.value)}
                    className="w-full sm:flex-1 bg-surface border border-border-theme rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                  />

                  <button
                    type="button"
                    onClick={() => removeSocialLink(idx)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer shrink-0"
                    title="Remove Link"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* ── 4. Privacy Policy Tab (Rich HTML Editor View) ── */}
      {activeTab === "privacy" && (
        <form onSubmit={savePrivacySection} className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Privacy Policy Document</h2>
              <p className="text-xs text-foreground/50">Formatted HTML policy text displayed at /privacy-policy</p>
            </div>
            <button
              type="submit"
              disabled={savingSection === "privacy"}
              className="px-5 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {savingSection === "privacy" ? "Saving..." : "Save Privacy Policy"}
            </button>
          </div>

          <div className="space-y-4">
            <textarea
              rows={12}
              value={legalForm.privacyPolicy}
              onChange={(e) => setLegalForm({ ...legalForm, privacyPolicy: e.target.value })}
              className="w-full bg-background border border-border-theme rounded-2xl p-4 text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:border-accent resize-y"
            />
            <div className="p-4 bg-background/40 rounded-2xl border border-border-theme/40 space-y-2">
              <span className="text-[10px] font-black uppercase text-accent">Live Formatted Preview</span>
              <div
                className="prose dark:prose-invert max-w-none text-xs text-foreground/90 space-y-2"
                dangerouslySetInnerHTML={{ __html: legalForm.privacyPolicy }}
              />
            </div>
          </div>
        </form>
      )}

      {/* ── 5. Terms of Service Tab ── */}
      {activeTab === "terms" && (
        <form onSubmit={saveTermsSection} className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Terms of Service Document</h2>
              <p className="text-xs text-foreground/50">Formatted HTML terms displayed at /terms-of-service</p>
            </div>
            <button
              type="submit"
              disabled={savingSection === "terms"}
              className="px-5 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {savingSection === "terms" ? "Saving..." : "Save Terms of Service"}
            </button>
          </div>

          <div className="space-y-4">
            <textarea
              rows={12}
              value={legalForm.termsOfService}
              onChange={(e) => setLegalForm({ ...legalForm, termsOfService: e.target.value })}
              className="w-full bg-background border border-border-theme rounded-2xl p-4 text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:border-accent resize-y"
            />
            <div className="p-4 bg-background/40 rounded-2xl border border-border-theme/40 space-y-2">
              <span className="text-[10px] font-black uppercase text-accent">Live Formatted Preview</span>
              <div
                className="prose dark:prose-invert max-w-none text-xs text-foreground/90 space-y-2"
                dangerouslySetInnerHTML={{ __html: legalForm.termsOfService }}
              />
            </div>
          </div>
        </form>
      )}

      {/* ── 6. Return Policy Tab ── */}
      {activeTab === "returns" && (
        <form onSubmit={saveReturnsSection} className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Return & Refund Policy Document</h2>
              <p className="text-xs text-foreground/50">Formatted HTML policy displayed at /returns-policy</p>
            </div>
            <button
              type="submit"
              disabled={savingSection === "returns"}
              className="px-5 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {savingSection === "returns" ? "Saving..." : "Save Return Policy"}
            </button>
          </div>

          <div className="space-y-4">
            <textarea
              rows={12}
              value={legalForm.returnPolicy}
              onChange={(e) => setLegalForm({ ...legalForm, returnPolicy: e.target.value })}
              className="w-full bg-background border border-border-theme rounded-2xl p-4 text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:border-accent resize-y"
            />
            <div className="p-4 bg-background/40 rounded-2xl border border-border-theme/40 space-y-2">
              <span className="text-[10px] font-black uppercase text-accent">Live Formatted Preview</span>
              <div
                className="prose dark:prose-invert max-w-none text-xs text-foreground/90 space-y-2"
                dangerouslySetInnerHTML={{ __html: legalForm.returnPolicy }}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettingsPage;
