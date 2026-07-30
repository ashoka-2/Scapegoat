import mongoose from "mongoose";

// Default content constants for Legal Pages
// These are used as default values when the admin hasn't customized them yet.
export const DEFAULT_PRIVACY_POLICY = `<h2><strong>1. Information We Collect</strong></h2>
<p>We collect personal information that you provide to us, such as your name, shipping address, email address, phone number, and payment information when you make a purchase on ScapeGoat.</p>

<h2><strong>2. How We Use Your Information</strong></h2>
<p>We use your information to process transactions, manage your account, deliver products, communicate with you about orders and promotions, and improve our website and services.</p>

<h2><strong>3. Data Security</strong></h2>
<p>We implement a variety of security measures, including SSL encryption and secure payment gateways, to maintain the safety of your personal information.</p>

<h2><strong>4. Cookies</strong></h2>
<p>We use cookies to enhance your browsing experience, analyze site traffic, and understand user behavior to deliver personalized recommendations.</p>

<h2><strong>5. Third-Party Disclosures</strong></h2>
<p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except to trusted partners who assist us in operating our website and processing payments.</p>`;

export const DEFAULT_RETURN_POLICY = `<h2><strong>1. Return & Exchange Window</strong></h2>
<p>We offer a hassle-free 15-day return and exchange policy from the date of delivery. Items must be unworn, unwashed, and in their original packaging with all tags intact.</p>

<h2><strong>2. Refund Process</strong></h2>
<p>Once we receive and inspect your returned items, we will notify you of the approval or rejection of your refund. Approved refunds will be credited back to your original payment method within 5-7 business days.</p>

<h2><strong>3. Return Shipping</strong></h2>
<p>For convenience, we offer free reverse pickups in major locations. If your pin code is not eligible for reverse pickup, you will need to ship the item back to us, and we will reimburse shipping costs up to a specified limit.</p>

<h2><strong>4. Non-Returnable Items</strong></h2>
<p>For hygiene reasons, certain products such as innerwear, socks, and custom-tailored apparel are non-returnable unless they arrive damaged or defective.</p>`;

export const DEFAULT_TERMS_OF_SERVICE = `<h2><strong>1. Agreement to Terms</strong></h2>
<p>By accessing and shopping at ScapeGoat, you agree to be bound by these Terms of Service. If you do not agree, please do not use our website or services.</p>

<h2><strong>2. Account & Eligibility</strong></h2>
<p>You must be at least 18 years old or browsing under parent supervision to create an account and shop. You are responsible for maintaining the confidentiality of your account credentials.</p>

<h2><strong>3. Pricing & Product Details</strong></h2>
<p>We strive to display product colors and prices as accurately as possible. However, we reserve the right to correct any pricing errors and update product availability without prior notice.</p>

<h2><strong>4. Intellectual Property</strong></h2>
<p>All content on this website, including text, graphics, logos, images, and software, is the property of ScapeGoat and is protected by copyright and intellectual property laws.</p>

<h2><strong>5. Limitation of Liability</strong></h2>
<p>ScapeGoat shall not be liable for any indirect, incidental, or consequential damages resulting from your use or inability to use our website or products.</p>`;

const legalSettingSchema = new mongoose.Schema(
    {
        privacyPolicy: { type: String, default: DEFAULT_PRIVACY_POLICY },
        returnPolicy: { type: String, default: DEFAULT_RETURN_POLICY },
        termsOfService: { type: String, default: DEFAULT_TERMS_OF_SERVICE },
    },
    { timestamps: true }
);

const LegalSetting = mongoose.model("LegalSetting", legalSettingSchema);

export default LegalSetting;
