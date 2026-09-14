import { Upload } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import type { DocumentItem } from '../types';

export function DocumentsPage({
  documents,
  onOpenDocument,
  onUploadDocument,
}: {
  documents: DocumentItem[];
  onOpenDocument: (id: string) => void;
  onUploadDocument: (payload?: Partial<DocumentItem>) => void;
}) {
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [type, setType] = useState('PDF');

  const filtered = useMemo(() => documents.filter((d) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return d.fileName.toLowerCase().includes(q) || (d.linkedTask ?? '').toLowerCase().includes(q) || d.uploadedBy.toLowerCase().includes(q);
  }), [documents, query]);

  const submitUpload = () => {
    if (!fileName.trim()) return;
    onUploadDocument({ fileName: fileName.trim(), type, uploadedBy: undefined });
    setFileName(''); setType('PDF'); setUploading(false);
  };

  return (
    <>
      <PageHeader title="Documents" description="Securely upload, link, preview, and audit document access." action={<button className="primary-button" onClick={() => setUploading((u) => !u)}><Upload size={16}/> Upload Document</button>} />

      {uploading && (
        <section className="card">
          <h3>Upload Document</h3>
          <div className="form-row"><input placeholder="File name (e.g. doc.pdf)" value={fileName} onChange={(e) => setFileName(e.target.value)} /></div>
          <div className="form-row"><select value={type} onChange={(e) => setType(e.target.value)}><option>PDF</option><option>DOCX</option><option>XLSX</option></select></div>
          <div className="form-row"><button className="primary-button" onClick={submitUpload}>Upload</button> <button onClick={() => setUploading(false)}>Cancel</button></div>
        </section>
      )}

      <div className="toolbar"><input placeholder="Search documents..." value={query} onChange={(e) => setQuery(e.target.value)} /><select><option>All file types</option><option>PDF</option><option>DOCX</option><option>XLSX</option></select></div>
      <section className="card table-card"><table><thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded By</th><th>Date</th><th /></tr></thead><tbody>
        {filtered.map((doc) => <tr key={doc.id}><td><strong>{doc.fileName}</strong><span>{doc.linkedTask}</span></td><td>{doc.type}</td><td>{doc.size}</td><td>{doc.uploadedBy}</td><td>{doc.uploadedAt}</td><td><button onClick={() => onOpenDocument(doc.id)}>Open</button></td></tr>)}
      </tbody></table></section>
    </>
  );
}
