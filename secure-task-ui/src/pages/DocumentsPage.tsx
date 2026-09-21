import { Upload } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import type { DocumentItem } from '../types';
import { useAppController } from '../core/AppContext';

export function DocumentsPage() {
  const controller = useAppController();
  const documents = controller.documents;
  const [query, setQuery] = useState('');
  const [fileType, setFileType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [type, setType] = useState('PDF');
  const [localError, setLocalError] = useState<string | null>(null);

  const filtered = useMemo(() => documents.filter((d) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || d.fileName.toLowerCase().includes(q) || (d.linkedTask ?? '').toLowerCase().includes(q) || d.uploadedBy.toLowerCase().includes(q);
    return matchesQuery && (fileType === 'all' || d.type === fileType);
  }), [documents, query, fileType]);

  const submitUpload = () => {
    if (!fileName.trim()) { setLocalError('Please provide a file name'); return; }
    const result = controller.uploadDocument({ fileName: fileName.trim(), type });
    if (!result) {
      setLocalError(controller.lastError ?? 'Upload failed');
      return;
    }
    setFileName(''); setType('PDF'); setUploading(false); setLocalError(null);
  };

  return (
    <>
      <PageHeader title="Documents" description="Securely upload, link, preview, and audit document access." action={<button className="primary-button" disabled={!controller.accessService.canUploadDocument(controller.user)} onClick={() => setUploading((u) => !u)}><Upload size={16}/> Upload Document</button>} />

      {uploading && (
        <section className="card">
          <h3>Upload Document</h3>
          {localError && <div className="form-error">{localError}</div>}
          <div className="form-row"><input placeholder="File name (e.g. doc.pdf)" value={fileName} onChange={(e) => setFileName(e.target.value)} /></div>
          <div className="form-row"><select value={type} onChange={(e) => setType(e.target.value)}><option>PDF</option><option>DOCX</option><option>XLSX</option></select></div>
          <div className="form-row"><button className="primary-button" onClick={submitUpload}>Upload</button> <button onClick={() => { setUploading(false); setLocalError(null); }}>Cancel</button></div>
        </section>
      )}

      <div className="toolbar">
        <input aria-label="Search documents" placeholder="Search documents..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Filter documents by file type" value={fileType} onChange={(event) => setFileType(event.target.value)}>
          <option value="all">All file types</option><option>PDF</option><option>DOCX</option><option>XLSX</option>
        </select>
      </div>
      <section className="card table-card"><table><thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded By</th><th>Date</th><th /></tr></thead><tbody>
        {filtered.map((doc: DocumentItem) => <tr key={doc.id}><td><strong>{doc.fileName}</strong><span>{doc.linkedTask}</span></td><td>{doc.type}</td><td>{doc.size}</td><td>{doc.uploadedBy}</td><td>{doc.uploadedAt}</td><td><button onClick={() => controller.openDocument(doc.id)}>Open</button></td></tr>)}
        {filtered.length === 0 && <tr><td colSpan={6} className="empty-table">No documents match the current filters.</td></tr>}
      </tbody></table></section>
    </>
  );
}
