import { privacyDataMatrix } from './privacy-data-matrix';
import { dataLocation } from './data-location';
import { officialContact } from './official-contact';

export type LegalDocumentId = 'privacy' | 'cookies' | 'terms' | 'risk' | 'aml' | 'refund' | 'vulnerability';

export type LegalDocument = {
  id: LegalDocumentId;
  title: string;
  shortTitle: string;
  summary: string;
  sections: Array<{ heading: string; paragraphs: string[]; table?: { headers: string[]; rows: string[][] } }>;
};

export const legalDocuments: LegalDocument[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy',
    summary: 'How GoldenHODL collects, uses, shares, and protects personal information.',
    sections: [
      { heading: 'Last updated and official contact', paragraphs: [`September 8, 2026. Legal entity: ${officialContact.legalName}. Official address: ${officialContact.address}. Contact: ${officialContact.email}. Phone: ${officialContact.phone}.`] },
      { heading: '1. General Provisions', paragraphs: ['This Privacy Policy explains how GoldenHODL collects, uses, stores, and protects personal information. The platform integrates with MetaTrader 5, MetaApi Cloud, and digital payment systems and follows applicable data protection standards.'] },
      { heading: '2. Information We Collect', paragraphs: ['Registration information: full name, email, phone number, and residential country or address.', 'Financial and trading information: selected portfolio, account balance, MT5 account number, and server-related technical information.', 'Technical and access information: IP address, browser type, operating system, platform usage history, and cookie information.'] },
      { heading: '3. Purpose of Using Information', paragraphs: ['Information is used to provide Copy Trading and EA Rental services, confirm orders, implement portfolio and contract terms, calculate fees, process payments through Lemon Squeezy, prevent fraud, meet KYC/AML requirements, and send service or technical notices.'] },
      {
        heading: '3A. What Information Do We Retain and For How Long?',
        paragraphs: ['We do not retain all information for the same period. We collect and retain only the information needed for the stated service, security, verification, and legal purposes below. Active account information is retained for the duration of the service relationship. Financial transaction history may be archived for up to 5 years for legal and tax reporting requirements. IP addresses, security logs, cookies, and technical usage data are automatically deleted after 90 days unless a shorter consent period applies.'],
        table: {
          headers: ['Data Field', 'Necessity', 'Legal Basis', 'Retention Period'],
          rows: privacyDataMatrix.map(({ field, necessity, legalBasis, retention }) => [field, necessity, legalBasis, retention]),
        },
      },
      { heading: '4. Third-Party Data Transfers', paragraphs: ['We do not sell personal information. We disclose personal information only to the named providers below when necessary to perform the service, protect security, process a payment, or comply with a legal obligation. Each provider may process the information only for the documented service purpose and may not reuse it for an unrelated purpose under our instructions and applicable data-processing terms.'], table: { headers: ['Provider', 'Purpose', 'Data shared', 'Legal basis and restriction'], rows: [
        ['Supabase', 'Database storage, authentication, profile management, and RLS-protected account services', 'Account identifier, email, profile fields, consent and request records', 'Performance of contract and security; processor may not use the data for unrelated purposes'],
        ['Vercel (application hosting)', 'Run the web application and server-side API requests', 'Request metadata, IP address, and data required to serve authenticated requests', 'Performance of contract and legitimate security interest; limited to hosting and security operations'],
        ['MetaApi Cloud', 'Connect to and retrieve authorized MetaTrader trading account data', 'Trading account identifier, positions, orders, deals, and technical connection data', 'Performance of contract and security; limited to the requested trading integration'],
        ['Lemon Squeezy', 'Payment checkout, transaction confirmation, fraud prevention, and billing support', 'Email, order details, amount, currency, and checkout metadata; card data is handled by the provider', 'Performance of contract and legal/payment obligations; payment data is not used by GoldenHODL for unrelated purposes'],
      ] } },
      { heading: '4A. International Transfers', paragraphs: ['Service providers may process information in countries outside your residence. We use contractual, technical, and organizational safeguards appropriate to the transfer and disclose a provider when required by applicable law.'] },
      { heading: '4B. Data Storage Locations and Transfer Safeguards', paragraphs: [`The declared primary database provider is ${dataLocation.cloudProvider}, with the project region configured as: ${dataLocation.supabaseRegion}. Application hosting is configured for: ${dataLocation.appHostingRegion}. Payment processing is provided by ${dataLocation.paymentProvider}; payment card details are not stored by GoldenHODL. Cross-border transfers use: ${dataLocation.transferMechanism}. The declared technical and organizational security standards are: ${dataLocation.securityStandards}. These locations and safeguards must be verified against the provider contracts and deployment console before production processing begins.`] },
      { heading: '5. Security and Your Rights', paragraphs: ['We use SSL encryption, secure server-to-server API connections, and access restrictions. Internet transmission cannot be guaranteed to be completely secure.', 'You may access, correct, or request deletion of your information, subject to legal and financial recordkeeping obligations, and opt out of marketing communications.'] },
      { heading: '5A. Requests and Children', paragraphs: ['Send an access, correction, erasure, or machine-readable portability request to info@goldenhodl.com or through the account request channel. We may verify your identity before acting and respond within the period required by applicable law. GoldenHODL is an adult-only financial trading service. Users must be at least 18 years old, provide a valid date of birth, and pass age verification before registration can continue. We do not knowingly accept accounts from minors, so a parental-consent workflow is not used for this service.'] },
      { heading: '5B. Inactive Accounts and Erasure Requests', paragraphs: ['When an account becomes inactive, we restrict processing and begin the applicable retention period shown in the matrix. After the retention period expires, personal information is deleted or irreversibly anonymized within 30 days, unless it must be retained for tax, anti-money laundering, payment, fraud prevention, legal claims, or other legal obligations. When you submit a verified erasure request, we delete or anonymize eligible information within 7 business days of verification and explain any information that must be archived or retained.'] },
      { heading: '6. Changes and Contact', paragraphs: ['Updates take effect when posted on this page. Questions can be sent to info@goldenhodl.com.'] },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    shortTitle: 'Cookies',
    summary: 'How cookies and similar technologies support security, preferences, and analytics.',
    sections: [
      { heading: 'Last updated and official contact', paragraphs: [`September 8, 2026. Legal entity: ${officialContact.legalName}. Official address: ${officialContact.address}. Contact: ${officialContact.email}. Phone: ${officialContact.phone}.`] },
      { heading: '1. What Are Cookies?', paragraphs: ['Cookies are small text files stored on a computer or mobile device. GoldenHODL uses cookies and similar technologies to operate the website, improve the user experience, and collect analytical data.'] },
      { heading: '2. Types of Cookies', paragraphs: ['Strictly necessary cookies support sessions and security. Functional cookies remember preferences. Analytics cookies may use Google Analytics to measure visits, device and browser information, approximate location, IP-derived technical data, and website usage history so we can understand performance and improve the service. Marketing cookies may use Meta Pixel to measure campaign performance, advertising interactions, browser/device information, and website events. Google Analytics and Meta Pixel are not loaded before the relevant consent.'] },
      { heading: '3. Consent and Management', paragraphs: ['On first visit, the cookie preference banner lets visitors keep functional cookies active and independently enable or disable Analytics Cookies (Google Analytics) and Marketing Cookies (Meta Pixel). Selecting Reject optional disables both optional categories. Visitors can reopen Cookie preferences at any time to switch them off. Visitors may also use Google\'s Analytics opt-out browser add-on or browser privacy controls, and Meta\'s ad preferences and cookie controls. Removing the consent cookie or clearing browser storage disables the optional scripts until a new choice is made.'] },
      { heading: '4. Changes', paragraphs: ['Updates will be posted on this page when technology or regulatory requirements change.'] },
    ],
  },
  {
    id: 'terms',
    title: 'Terms and Conditions',
    shortTitle: 'Terms',
    summary: 'The legal relationship and service rules for Copy Trading and EA Rental.',
    sections: [
      { heading: 'Last updated and official contact', paragraphs: [`September 8, 2026. Legal entity: ${officialContact.legalName}. Official address: ${officialContact.address}. Contact: ${officialContact.email}. Phone: ${officialContact.phone}.`] },
      { heading: '1. General Provisions', paragraphs: ['GoldenHODL is an online platform providing Forex EA Rental and Copy Trading services through MetaTrader 5, MetaApi Cloud, and digital payment systems. These Terms govern the relationship between the platform and each user or investor.'] },
      { heading: '2. Registration and Account Security', paragraphs: ['Users must provide accurate registration information and are responsible for the security of their username and password. Encrypted technology is used for MetaApi Cloud and MT5 connections.'] },
      { heading: '3. Payments, Fees, and Balance', paragraphs: ['When a user tops up a balance or rents an EA service, the applicable fee rate, ranging from 3% to 29% for Copy Trading, and the selected duration apply. Payments are made in USD through Lemon Squeezy and official channels.'] },
      { heading: '4. Liability', paragraphs: ['Forex and automated trading carry significant risks, including loss of the initial investment. The platform is not responsible for actual market losses or failures caused by third-party infrastructure.'] },
      { heading: '5. Account Suspension and Termination', paragraphs: ['We may suspend or terminate an account without prior notice when we reasonably believe the user has materially breached these Terms, engaged in prohibited or unlawful activity, uploaded unlawful content, attempted unauthorized access, attacked or disrupted the platform, committed fraud, or created an immediate security, legal, or financial risk.'] },
      { heading: '5A. Notice for Ordinary Closure', paragraphs: ['For an ordinary breach that does not require immediate protective action, or an account that has remained inactive for a prolonged period, we will normally notify the registered email address at least 14 days before suspension or closure and provide an opportunity to remedy the issue where appropriate. We may shorten or waive notice where required by law, a regulator, a payment provider, or an urgent security investigation.'] },
      { heading: '5B. Closure, Complaints, and Data Export', paragraphs: ['A user may request account closure by contacting info@goldenhodl.com. Before a planned closure, or after receiving a closure notice, the user may request a machine-readable export of eligible account information through the data export function or support channel. Export access may be restricted for security, fraud prevention, legal hold, or third-party rights. Complaints about a suspension or termination may be submitted to info@goldenhodl.com and will be reviewed in good faith. Account closure does not remove financial, tax, anti-money laundering, payment, fraud, or legal records that must be retained by law; eligible personal information is deleted or anonymized under the Privacy Policy.'] },
      { heading: '6. Platform Intellectual Property', paragraphs: ['The website design, user interface, logo, GoldenHODL and GoldMaster names, trademarks, source code, object code, software, documentation, graphics, and other platform materials are owned by or licensed to GoldenHODL and are protected by applicable intellectual property laws. Except for the limited right to use the service under these Terms, users may not copy, reverse engineer, reproduce, modify, distribute, publish, sublicense, sell, or use these materials without prior written permission.'] },
      { heading: '6A. User Content License', paragraphs: ['Users retain ownership of lawful information and content they submit to the platform. To operate, secure, maintain, and improve the service, the user grants GoldenHODL a worldwide, non-exclusive, royalty-free, limited license to host, store, reproduce, process, and display that content only for those service purposes. The license ends when the content is deleted, except for backups, legal records, dispute evidence, or content already lawfully shared with other users. Users must have the rights and permissions necessary to submit their content.'] },
      { heading: '7. Governing Law and Jurisdiction', paragraphs: ['These Terms and the relationship between the user and GoldenHODL are governed by the laws of Mongolia, without prejudice to mandatory consumer protections that cannot lawfully be waived. The parties will first attempt to resolve any complaint or dispute through good-faith consultation by contacting info@goldenhodl.com. If the dispute is not resolved through consultation, it will be submitted to the competent courts of Mongolia with lawful jurisdiction over the company or dispute.'] },
      { heading: '8. Force Majeure', paragraphs: ['Neither party is liable for delay or failure caused by events outside reasonable control, including natural disasters, war, government action, telecommunications failure, cyber incidents affecting a third-party provider, or interruption of payment, hosting, broker, or trading infrastructure.'] },
    ],
  },
  {
    id: 'risk',
    title: 'Risk Disclosure',
    shortTitle: 'Risk',
    summary: 'Important risks relating to Forex, EA Rental, Copy Trading, and technology.',
    sections: [
      { heading: '1. Financial Market Risk', paragraphs: ['Forex and digital asset trading require knowledge and experience and carry a risk of completely losing the initial investment.'] },
      { heading: '2. Automated Trading and Technology Risk', paragraphs: ['Temporary delays, interruptions, or failures in MetaTrader 5, MetaApi Cloud, internet connectivity, or server infrastructure may cause discrepancies in trading performance.'] },
      { heading: '3. Past Performance', paragraphs: ['Past performance and historical trading results displayed on the platform do not guarantee identical future returns.'] },
      { heading: '4. User Responsibility', paragraphs: ['Users should only commit capital they can afford to lose, review the service terms before payment, and understand that market conditions can change rapidly.'] },
    ],
  },
  {
    id: 'aml',
    title: 'AML & KYC Policy',
    shortTitle: 'AML & KYC',
    summary: 'Anti-money laundering, counter-terrorist financing, and identity verification controls.',
    sections: [
      { heading: '1. Purpose', paragraphs: ['GoldenHODL follows applicable anti-money laundering and counter-terrorist financing standards to prevent the platform from being used for illegal transactions.'] },
      { heading: '2. Know Your Customer', paragraphs: ['When necessary, the platform may request documents to verify identity, country of residence, and source of funds.'] },
      { heading: '3. Transaction Monitoring', paragraphs: ['Suspicious, unusually high-value, or illegal transactions may be temporarily suspended and reported to competent authorities where required.'] },
    ],
  },
  {
    id: 'refund',
    title: 'Refund, Cancellation and Dispute Policy',
    shortTitle: 'Refunds',
    summary: 'The conditions and process for cancellation, refunds, and payment disputes.',
    sections: [
      { heading: 'Last updated and official contact', paragraphs: [`September 8, 2026. Legal entity: ${officialContact.legalName}. Official address: ${officialContact.address}. Contact: ${officialContact.email}. Phone: ${officialContact.phone}.`] },
      { heading: '1. Cancellation and Refund Deadline', paragraphs: ['A cancellation or refund request must be submitted within 14 calendar days after payment and before the applicable service has been activated, delivered, or materially used, unless mandatory consumer law provides a longer or different right. Requests must be sent from the account contact to info@goldenhodl.com and include the order reference, service, payment date, amount, and reason.'] },
      { heading: '2. Eligibility and Exclusions', paragraphs: ['Eligible refunds may apply to a duplicate charge, failed delivery, or a qualifying cancellation before activation. Fees for a service that has already been activated, delivered, or materially used may be non-refundable to the extent permitted by applicable law. Market losses, trading performance, broker losses, and third-party downtime are not refundable service fees. We do not charge an administrative refund fee; payment-provider fees, taxes, or legally required deductions will be disclosed before processing where applicable.'] },
      { heading: '3. Review and Processing', paragraphs: ['GoldenHODL will acknowledge a complete request within 2 business days and issue an eligibility decision within 7 business days. An approved refund is returned to the original payment method through Lemon Squeezy or the original payment provider within 5 to 10 business days after approval, subject to the provider and issuing bank. We will provide the refund reference or reason for denial.'] },
      { heading: '4. Complaints, Chargebacks, and Dispute Resolution', paragraphs: ['First, submit a complaint to GoldenHODL at info@goldenhodl.com. We will investigate and attempt good-faith resolution within 15 business days. If unresolved, the customer may contact the competent consumer protection authority in Mongolia, including the Authority for Fair Competition and Consumer Protection, or pursue the competent courts of Mongolia under applicable law. Please contact GoldenHODL before filing a chargeback where reasonably possible so the transaction can be investigated. Nothing in this policy limits mandatory consumer rights.'] },
    ],
  },
  {
    id: 'vulnerability',
    title: 'Vulnerability Disclosure Policy',
    shortTitle: 'Security',
    summary: 'How to report security vulnerabilities responsibly to GoldenHODL.',
    sections: [
      { heading: '1. Scope', paragraphs: ['This policy applies to the website, user dashboards, and associated API services. GoldenHODL welcomes good-faith security research concerning MT5, MetaApi Cloud, and payment integrations.'] },
      { heading: '2. Reporting', paragraphs: ['Please email info@goldenhodl.com before public disclosure. Include the affected URL or component, reproduction steps, and an assessment of potential impact.'] },
      { heading: '3. Commitment', paragraphs: ['Reports will be reviewed in a timely manner. Good-faith researchers who follow this policy and avoid disruption will not be subject to legal action under this policy.'] },
    ],
  },
];
