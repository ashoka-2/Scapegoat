import React, { useState } from "react";
import { Link } from "react-router";
import { useSelector } from "react-redux";

const appName = "ScapeGoat";
const Footer = () => {



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
        privacyPolicyLink: "/privacy",
        returnPolicyLink: "/returns",
    };

    const handleNewsletter = async (e) => {
        e.preventDefault();
        if (!newsletterEmail.trim()) return;
        setSubscribing(true);
        try {
            await handleSubmitMessage({ email: newsletterEmail, type: "newsletter" });
            setSubscribed(true);
            setNewsletterEmail("");
        } catch (_) {} finally {
            setSubscribing(false);
        }
    };

    // Render a block column based on its type
    const renderBlock = (block) => {
        if (!block.visible) return null;

        switch (block.type) {
            case "brand":
                return (
                    <div className="space-y-5" key={block.id}>
                        <Link to="/" className="text-2xl font-[800] tracking-[0.1em] uppercase text-foreground hover:text-accent transition-all block">
                            {appName}
                        </Link>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            Redefining the binary boundary between tech and style.
                        </p>
                        {/* Newsletter inline in brand block */}
                        <div className="pt-2">
                            <p className="text-[10px] font-black tracking-[0.4em] uppercase mb-4 text-accent">Join the collective</p>
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
                                        className="bg-surface border border-border-theme/50 rounded-full px-4 py-2 outline-none focus:border-accent text-xs font-mono w-full"
                                    />
                                    <button
                                        type="submit"
                                        disabled={subscribing}
                                        className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0 disabled:opacity-60"
                                    >
                                        <i className={subscribing ? "ri-loader-4-line animate-spin" : "ri-arrow-right-line"}></i>
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                );

            case "links":
                return (
                    <div key={block.id}>
                        <h3 className="text-[10px] font-black tracking-[0.4em] uppercase mb-6 text-gray-400">Navigation</h3>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                            <li><Link to="/shop" className="hover:text-accent transition-colors">Shop All</Link></li>
                            <li><Link to="/" className="hover:text-accent transition-colors">Latest Drops</Link></li>
                            <li><Link to="/about" className="hover:text-accent transition-colors">Our Vision</Link></li>
                            <li><Link to="/contact" className="hover:text-accent transition-colors">Support Hub</Link></li>
                        </ul>
                    </div>
                );

            case "legal":
                return (
                    <div key={block.id}>
                        <h3 className="text-[10px] font-black tracking-[0.4em] uppercase mb-6 text-gray-400">Legal</h3>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                            <li><a href={footerData.privacyPolicyLink || "/privacy"} className="hover:text-accent transition-colors">Privacy Policy</a></li>
                            <li><a href={footerData.returnPolicyLink || "/returns"} className="hover:text-accent transition-colors">Return Policy</a></li>
                            <li><Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                );

            case "socials":
                return (
                    <div key={block.id}>
                        <h3 className="text-[10px] font-black tracking-[0.4em] uppercase mb-6 text-gray-400">Socials</h3>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                            {(footerData.socialLinks || []).map((social) => (
                                <li key={social.id}>
                                    <a
                                        href={social.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hover:text-accent transition-colors flex items-center gap-3"
                                    >
                                        <i className={`${social.icon} text-lg`}></i>
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

    const visibleBlocks = (footerData.blocks || []).filter(b => b.visible);

    return (
        <footer className="bg-background text-foreground border-t border-border-theme/30 pt-16 pb-8 px-6 md:px-12 mt-auto">
            <div className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(visibleBlocks.length, 4)} gap-12 mb-16`}>
                {(footerData.blocks || []).map(block => renderBlock(block))}
            </div>

            <div className="max-w-7xl mx-auto border-t border-border-theme/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[9px] font-bold text-gray-500 tracking-[0.3em] uppercase">London • Mumbai • Tokyo • Paris</p>
                <p className="text-[9px] font-black tracking-[0.5em] text-accent uppercase">© {new Date().getFullYear()} {appName} ®</p>
            </div>
        </footer>
    );
};

export default Footer;
