import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSettings } from "../../Settings/Hooks/useSettings";
import { useMessages } from "../../Messages/Hooks/useMessages";
import { InputField, TextAreaField } from "../../../Shared/FormFields";
import BannerCarousel from "../Components/BannerCarousel";

const Contact = () => {
  const { handleGetSettings } = useSettings();
  const { handleSubmitMessage } = useMessages();
  const { settings, loading } = useSelector((state) => state.settings);

  const [form, setForm] = useState({ name: "", email: "", subject: "", content: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    handleGetSettings();
  }, []);

  const contactData = settings?.contact || {
    email: "support@scapegoat.com",
    phone: "+91 98765 43210",
    address: "123 Fashion Street, Mumbai 400001",
    mapLat: 19.076,
    mapLng: 72.8777,
    mapZoom: 14,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await handleSubmitMessage({ ...form, type: "contact" });
      setSent(true);
      setForm({ name: "", email: "", subject: "", content: "" });
    } catch (_) {
    } finally {
      setSending(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-pulse text-xl font-bold tracking-[0.5em] uppercase text-foreground/50">
        Loading...
      </div>
    );
  }

  const mapUrl =
    contactData.mapEmbedUrl && contactData.mapEmbedUrl.trim()
      ? contactData.mapEmbedUrl.trim()
      : `https://www.openstreetmap.org/export/embed.html?bbox=${contactData.mapLng - 0.01},${contactData.mapLat - 0.01},${contactData.mapLng + 0.01},${contactData.mapLat + 0.01}&layer=mapnik&marker=${contactData.mapLat},${contactData.mapLng}`;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto font-sans">
      {/* Inline Contact Banner */}
      <BannerCarousel page="contact" placement="inline" />

      <div className="text-center mb-12 md:mb-16 space-y-4">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase text-foreground">
          Support & Contact
        </h1>
        <div className="w-20 h-1 bg-accent mx-auto rounded-full"></div>
        <p className="text-xs md:text-sm font-bold tracking-widest uppercase text-foreground/60">
          Have a question or feedback? We're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Contact Form */}
        <div className="bg-surface border border-border-theme p-8 md:p-10 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-xl font-black uppercase tracking-wider text-foreground">Send a Message</h2>
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <i className="ri-check-line text-3xl" />
              </div>
              <p className="text-lg font-black uppercase tracking-wider text-foreground">Message Sent!</p>
              <p className="text-xs text-foreground/60 max-w-xs">
                Thank you for reaching out. We will respond to your inquiry shortly.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-accent text-xs font-bold uppercase tracking-widest hover:underline cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  required
                  label="Your Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  icon="ri-user-3-line"
                />
                <InputField
                  required
                  type="email"
                  label="Email Address"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  icon="ri-mail-line"
                />
              </div>

              <InputField
                label="Subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Order Inquiry / Feedback"
                icon="ri-question-line"
              />

              <TextAreaField
                required
                rows={5}
                label="Message Content"
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="How can we assist you today?"
              />

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 bg-accent text-accent-content font-black tracking-widest uppercase rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {sending ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" /> Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Contact Info & Interactive Map */}
        <div className="space-y-8 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-wider text-foreground">Get In Touch</h2>
            <div className="space-y-5 text-xs font-semibold tracking-wide text-foreground/80">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0 border border-accent/20">
                  <i className="ri-map-pin-line text-lg" />
                </div>
                <p className="mt-2 leading-relaxed whitespace-pre-wrap">{contactData.address}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0 border border-accent/20">
                  <i className="ri-mail-line text-lg" />
                </div>
                <a href={`mailto:${contactData.email}`} className="hover:text-accent transition-colors">
                  {contactData.email}
                </a>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0 border border-accent/20">
                  <i className="ri-phone-line text-lg" />
                </div>
                <a href={`tel:${contactData.phone}`} className="hover:text-accent transition-colors">
                  {contactData.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Interactive OpenStreetMap Embed */}
          <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden border border-border-theme shadow-xl relative bg-surface">
            <iframe
              title="Store Location Map"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={mapUrl}
              className="w-full h-full filter saturate-[0.8] contrast-[1.1]"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
