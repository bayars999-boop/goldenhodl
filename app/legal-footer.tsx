import Link from 'next/link';
import { officialContact } from './official-contact';

const footerLinks = [
  ['Privacy Policy', 'privacy'],
  ['Cookie Policy', 'cookies'],
  ['Terms and Conditions', 'terms'],
  ['Risk Disclosure', 'risk'],
  ['AML & KYC Policy', 'aml'],
  ['Refund & Disputes', 'refund'],
  ['Vulnerability Disclosure', 'vulnerability'],
] as const;

export default function LegalFooter() {
  return (
    <footer className="legal-footer">
      <div className="legal-footer-inner">
        <div>
          <strong>GoldenHODL</strong>
          <p>Trading technology and digital services. Market risk applies.</p>
        </div>
        <nav aria-label="Legal documents" className="legal-footer-links">
          {footerLinks.map(([label, id]) => <Link key={id} href={`/legal-documents?document=${id}`}>{label}</Link>)}
        </nav>
        <p className="legal-footer-contact">Risk warning: capital is at risk. Questions? <a href="mailto:info@goldenhodl.com">info@goldenhodl.com</a></p>
        <address className="legal-footer-address"><strong>Official contact</strong><br />{officialContact.legalName}<br />{officialContact.address}<br /><a href={`mailto:${officialContact.email}`}>{officialContact.email}</a>{officialContact.phone !== 'Not configured' && <><br />{officialContact.phone}</>}</address>
      </div>
    </footer>
  );
}
