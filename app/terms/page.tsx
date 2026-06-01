// Standalone /terms page — same content shown in the first-visit modal.
import Link from "next/link";

export const metadata = { title: "{ask-it} — Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">← Back</Link>
      <TosContent />
    </div>
  );
}

export function TosContent() {
  return (
    <article className="prose prose-invert prose-sm max-w-none text-gray-300 [&_h1]:text-white [&_h2]:text-white [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_p]:text-gray-400 [&_li]:text-gray-400 [&_strong]:text-gray-200">
      <h1 className="text-2xl font-bold text-white">{"{ask-it}"} Terms of Service</h1>
      <p className="text-xs text-gray-600">Last Updated: June 1, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using Ask-It ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these Terms, you must not access or use the Service.</p>

      <h2>2. Description of Service</h2>
      <p>Ask-It provides access to artificial intelligence tools and AI-generated content.</p>
      <p>Responses are generated automatically and may be inaccurate, incomplete, misleading, offensive, or outdated. Users are solely responsible for verifying any information provided by the Service before relying upon it.</p>

      <h2>3. Eligibility</h2>
      <p>You must be at least 13 years old, or the minimum age required by the laws of your jurisdiction, to use the Service.</p>
      <p>By using the Service, you represent that you meet these requirements.</p>

      <h2>4. User Accounts</h2>
      <p>You are responsible for maintaining the confidentiality and security of your account. You agree not to:</p>
      <ul>
        <li>Share your account with others.</li>
        <li>Circumvent subscription limits or restrictions.</li>
        <li>Abuse, overload, or interfere with the Service.</li>
        <li>Attempt unauthorized access to any system, account, or network.</li>
        <li>Use the Service in violation of applicable laws.</li>
      </ul>

      <h2>5. AI-Generated Content</h2>
      <p>You acknowledge and agree that:</p>
      <ul>
        <li>AI-generated content may be inaccurate or incorrect.</li>
        <li>Outputs may not reflect factual information.</li>
        <li>Outputs do not constitute legal, financial, medical, engineering, or professional advice.</li>
        <li>You are solely responsible for evaluating and verifying all generated content.</li>
        <li>Ask-It does not guarantee the accuracy, reliability, completeness, or suitability of any output.</li>
      </ul>
      <p>Use of generated content is entirely at your own risk.</p>

      <h2>6. Prohibited Uses</h2>
      <p>You may not use the Service to:</p>
      <ul>
        <li>Violate any applicable law or regulation.</li>
        <li>Harass, threaten, exploit, or abuse others.</li>
        <li>Commit fraud or deceptive practices.</li>
        <li>Distribute malicious software or harmful code.</li>
        <li>Infringe intellectual property rights.</li>
        <li>Interfere with the operation of the Service.</li>
        <li>Attempt unauthorized access to systems or networks.</li>
      </ul>

      <h2>7. Subscriptions and Payments</h2>
      <p>Certain features may require payment. By purchasing a subscription, you agree that:</p>
      <ul>
        <li>Subscription fees may be charged on a recurring basis.</li>
        <li>Subscriptions automatically renew unless canceled before renewal.</li>
        <li>Fees are non-refundable except where required by applicable law.</li>
        <li>Ask-It may change pricing, features, or subscription plans at any time.</li>
      </ul>

      <h2>8. Cookies and Similar Technologies</h2>
      <p>By using Ask-It, you consent to the use of cookies and similar technologies. Cookies may be used for:</p>
      <ul>
        <li>Authentication</li>
        <li>Security</li>
        <li>User preferences</li>
        <li>Analytics</li>
        <li>Performance monitoring</li>
        <li>Service functionality</li>
      </ul>
      <p>Disabling cookies may impact the functionality of certain features of the Service.</p>

      <h2>9. Intellectual Property</h2>
      <p>The Ask-It website, branding, software, design, and related materials remain the property of Ask-It and its operators. Users retain ownership of content they submit to the Service. Users are responsible for ensuring that their use of generated outputs complies with applicable laws and third-party rights.</p>

      <h2>10. Disclaimer of Warranties</h2>
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, ASK-IT DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AVAILABILITY, AND NON-INFRINGEMENT.</p>

      <h2>11. Limitation of Liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ASK-IT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO THE USE OF THE SERVICE. NOTHING IN THESE TERMS SHALL LIMIT LIABILITY WHERE SUCH LIMITATION IS PROHIBITED BY APPLICABLE LAW.</p>

      <h2>12. Disputes and Claims</h2>
      <p>By using the Service, you agree to attempt to resolve disputes through good-faith communication before initiating legal proceedings.</p>

      <h2>13. Suspension and Termination</h2>
      <p>Ask-It may suspend, restrict, or terminate access to the Service at any time for violations of these Terms, security concerns, abuse, legal compliance requirements, or operational reasons.</p>

      <h2>14. Changes to These Terms</h2>
      <p>Ask-It reserves the right to modify these Terms at any time. Continued use of the Service after changes become effective constitutes acceptance of the revised Terms.</p>

      <h2>15. Privacy</h2>
      <p>Use of the Service may involve the collection and processing of information necessary to operate the Service. By using Ask-It, you consent to such processing as described in any applicable Privacy Policy.</p>

      <h2>16. Contact</h2>
      <p>Questions regarding these Terms may be submitted through any contact methods made available on the Ask-It website.</p>
      <p className="text-xs text-gray-600">Operator: Ask-It · Last Updated: June 1, 2026</p>
    </article>
  );
}
