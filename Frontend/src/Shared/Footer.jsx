import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMessages } from "../Features/Messages/Hooks/useMessages";

const appName = "ScapeGoat";

const Footer = () => {
  const { handleSubmitMessage } = useMessages();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const footerData = {
    blocks: [
      { id: "brand", type: "brand", visible: true },
      { id: "links", type: "links", visible: true },
      { id: "socials", type: "socials", visible: true },
      { id: "legal", type: "legal", visible: true },
    ],
    socialLinks: [
      { id: "instagram", platform: "Instagram", icon: "ri-instagram-line", url: "https://instagram.com" },
      { id: "twitter", platform: "X / Twitter", icon: "ri-twitter-x-line", url: "https://twitter.com" },
      { id: "facebook", platform: "Facebook", icon: "ri-facebook-circle-line", url: "https://facebook.com" },
    ],
  };

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      await handleSubmitMessage({ email: newsletterEmail, type: "newsletter" });
      setSubscribed(true);
      setNewsletterEmail("");
    } catch (_) {
    } finally {
      setSubscribing(false);
    }
  };

  const renderBlock = (block) => {
    if (!block.visible) return null;

    switch (block.type) {
      case "brand":
        return (
          <div className="space-y-5" key={block.id}>
            <Link
              to="/"
              className="text-2xl font-[800] tracking-[0.1em] uppercase text-foreground hover:text-accent transition-all block"
            >
              {appName}
            </Link>
            <p className="text-xs text-foreground/60 font-bold uppercase tracking-widest leading-relaxed">
              Redefining the binary boundary between tech and style.
            </p>

            <div className="pt-2">
              <p className="text-[10px] font-black tracking-[0.4em] uppercase mb-4 text-accent">
                Join the collective
              </p>
              {subscribed ? (
                <p className="text-xs font-bold text-accent">✓ You're in! Check your inbox.</p>
              ) : (
                <form onSubmit={handleNewsletter} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="ENTER EMAIL"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="bg-surface border border-border-theme rounded-full px-4 py-2 outline-none focus:border-accent text-xs font-mono w-full text-foreground"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-accent hover:text-accent-content transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
                  >
                    <i className={subscribing ? "ri-loader-4-line animate-spin" : "ri-arrow-right-line"} />
                  </button>
                </form>
              )}
            </div>
          </div>
        );

      case "links":
        return (
          <div key={block.id}>
            <h3 className="text-[10px] font-black tracking-[0.4em] uppercase mb-6 text-foreground/50">
              Navigation
            </h3>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
              <li>
                <Link to="/shop" className="hover:text-accent transition-colors">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="hover:text-accent transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">
                  Our Vision
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Support Hub
                </Link>
              </li>
            </ul>
          </div>
        );

      case "legal":
        return (
          <div key={block.id}>
            <h3 className="text-[10px] font-black tracking-[0.4em] uppercase mb-6 text-foreground/50">
              Legal
            </h3>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
              <li>
                <Link to="/privacy-policy" className="hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/returns-policy" className="hover:text-accent transition-colors">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        );

      case "socials":
        return (
          <div key={block.id}>
            <h3 className="text-[10px] font-black tracking-[0.4em] uppercase mb-6 text-foreground/50">
              Socials
            </h3>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
              {(footerData.socialLinks || []).map((social) => (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-accent transition-colors flex items-center gap-3"
                  >
                    <i className={`${social.icon} text-lg`} />
                    {social.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );

      default:
        return null;
    }
  };

  const visibleBlocks = (footerData.blocks || []).filter((b) => b.visible);

  return (
    <footer className="bg-background text-foreground border-t border-border-theme/40 pt-16 pb-8 px-6 md:px-12 mt-auto font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        {visibleBlocks.map((block) => renderBlock(block))}
      </div>

      <div className="max-w-7xl mx-auto border-t border-border-theme/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <p className="text-[9px] font-bold text-foreground/50 tracking-[0.3em] uppercase">
          London • Mumbai • Tokyo • Paris
        </p>
        <p className="text-[9px] font-black tracking-[0.5em] text-accent uppercase">
          © {new Date().getFullYear()} {appName} ®
        </p>
      </div>
    </footer>
  );
};

export default Footer;
