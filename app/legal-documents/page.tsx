'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { legalDocuments, type LegalDocumentId } from '../legal-documents';

const isDocumentId = (value: string | null): value is LegalDocumentId => legalDocuments.some((document) => document.id === value);

export default function LegalDocumentsPage() {
  const [selectedId, setSelectedId] = useState<LegalDocumentId>('privacy');
  const selected = legalDocuments.find((document) => document.id === selectedId) || legalDocuments[0];

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('document');
    if (isDocumentId(requested)) window.setTimeout(() => setSelectedId(requested), 0);
  }, []);

  return (
    <main className="legal-page">
      <section className="legal-shell">
        <header className="legal-header">
          <div><p className="legal-eyebrow">GOLDENHODL LEGAL CENTER</p><h1>Legal Documents</h1><p>Review the current policies, agreements, and disclosures that govern your account and services.</p></div>
          <Link className="legal-back-link" href="/">Back to platform</Link>
        </header>
        <div className="legal-workspace">
          <aside className="legal-folders" aria-label="Legal document folders">
            <p className="legal-folder-label">DOCUMENT FOLDER</p>
            {legalDocuments.map((document) => <button type="button" key={document.id} className={selectedId === document.id ? 'legal-folder active' : 'legal-folder'} onClick={() => setSelectedId(document.id)}><span className="legal-folder-tab">{document.shortTitle}</span><strong>{document.title}</strong><small>{document.id === 'risk' || document.id === 'terms' ? 'Agreement / disclosure' : 'Policy'}</small></button>)}
          </aside>
          <article className="legal-document" aria-live="polite">
            <div className="legal-document-heading"><div><p className="legal-eyebrow">CURRENT DOCUMENT</p><h2>{selected.title}</h2><p>{selected.summary}</p></div><span className="legal-status">Published · Sep 2026</span></div>
            <div className="legal-document-body">{selected.sections.map((section) => <section key={section.heading}><h3>{section.heading}</h3>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.table && <div className="legal-table-wrap"><table className="legal-table"><thead><tr>{section.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{section.table.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>}</section>)}</div>
            <div className="legal-document-note">This page displays the version currently published by GoldenHODL. Contact info@goldenhodl.com for questions or correction requests.</div>
          </article>
        </div>
      </section>
    </main>
  );
}
