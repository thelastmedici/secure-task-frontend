import { File as FileIcon, FileImage, FileSpreadsheet, FileText, Grid2X2, List, Upload, X } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import type { DocumentItem } from '../types';
import { useAppController } from '../core/AppContext';
import { DocumentFileService } from '../services/DocumentFileService';
import { PermissionButton } from '../components/PermissionButton';
import { EmptyState } from '../components/EmptyState';

const fileStorage = new DocumentFileService();
const formatBytes = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const typeFromFile = (file: File) => file.name.split('.').pop()?.toUpperCase() ?? '';
const TypeIcon = ({ type }: { type: string }) => {
  if (type === 'PNG') return <FileImage size={20} />;
  if (type === 'XLSX') return <FileSpreadsheet size={20} />;
  if (type === 'PDF' || type === 'DOCX') return <FileText size={20} />;
  return <FileIcon size={20} />;
};

export function DocumentsPage() {
  const controller = useAppController();
  const documents = controller.documents;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [fileType, setFileType] = useState('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const allowedTypes = controller.workspaceSettings.allowedFileTypes;
  const maxSize = controller.workspaceSettings.maxUploadSizeMb;
  const policyRule = `${allowedTypes.join(', ')} up to ${maxSize} MB`;

  const filtered = useMemo(() => documents.filter((d) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || d.fileName.toLowerCase().includes(q) || (d.linkedTask ?? '').toLowerCase().includes(q) || d.uploadedBy.toLowerCase().includes(q);
    return matchesQuery && (fileType === 'all' || d.type === fileType);
  }), [documents, query, fileType]);

  const chooseFile = (file?: File) => {
    if (!file) return;
    setLocalError(null);
    const type = typeFromFile(file);
    if (!allowedTypes.includes(type)) { setSelectedFile(null); setLocalError(`${type || 'This file type'} is not allowed. Allowed types: ${allowedTypes.join(', ')}.`); return; }
    if (file.size <= 0) { setSelectedFile(null); setLocalError('The selected file is empty.'); return; }
    if (file.size > maxSize * 1024 * 1024) { setSelectedFile(null); setLocalError(`This file is larger than the ${maxSize} MB workspace limit.`); return; }
    setSelectedFile(file);
  };

  const submitUpload = async () => {
    if (!selectedFile) { setLocalError('Choose a file to upload.'); return; }
    const type = typeFromFile(selectedFile);
    // Check policy again immediately before creating the document record.
    if (!allowedTypes.includes(type) || selectedFile.size > maxSize * 1024 * 1024) { chooseFile(selectedFile); return; }
    setUploading(true); setProgress(12); setLocalError(null);
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + 15, 88)), 140);
    try {
      const doc = controller.uploadDocument({ fileName: selectedFile.name, type, size: `${(selectedFile.size / 1024 / 1024).toFixed(6)} MB` });
      if (!doc) throw new Error(controller.lastError ?? 'Upload failed.');
      await fileStorage.save(doc.id, selectedFile);
      doc.fileStorageKey = doc.id;
      doc.version = 1;
      controller.persist();
      setProgress(100);
      window.clearInterval(timer);
      window.setTimeout(() => {
        setSelectedFile(null); setShowUpload(false); setUploading(false); setProgress(0);
        controller.navigate('documents');
      }, 300);
    } catch (error) {
      window.clearInterval(timer); setUploading(false); setProgress(0);
      setLocalError(error instanceof Error ? error.message : 'Could not save this file in browser storage.');
    }
  };

  const openDocument = (doc: DocumentItem) => controller.openDocument(doc.id);

  return (
    <>
      <PageHeader
        title="Documents"
        description="Securely upload, link, preview, and audit document access."
        action={<PermissionButton className="primary-button" allowed={controller.accessService.canUploadDocument(controller.user)} reason="Your role does not allow document uploads." onClick={() => setShowUpload((value) => !value)}><Upload size={16}/> Upload Document</PermissionButton>}
      />

      {showUpload && <section className="card upload-card">
        <div className="card-header"><div><h2>Upload a document</h2><p className="muted-text">Files are checked against your workspace policy before upload.</p></div><button type="button" aria-label="Close upload" disabled={uploading} onClick={() => { setShowUpload(false); setLocalError(null); setSelectedFile(null); }}><X size={16}/></button></div>
        {localError && <div className="form-error" role="alert">{localError}</div>}
        <input ref={inputRef} className="visually-hidden" type="file" accept={allowedTypes.map((type) => `.${type.toLowerCase()}`).join(',')} onChange={(event) => chooseFile(event.target.files?.[0])} />
        <button type="button" className={`dropzone ${dragging ? 'dragging' : ''}`} disabled={uploading} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }}>
          <span className="dropzone-icon"><Upload size={22}/></span>
          <strong>{selectedFile ? selectedFile.name : 'Drop a file here or browse'}</strong>
          <span>{selectedFile ? `${typeFromFile(selectedFile)} · ${formatBytes(selectedFile.size)}` : policyRule}</span>
        </button>
        {uploading && <div className="upload-progress" aria-live="polite"><div className="progress-copy"><span>Uploading {selectedFile?.name}</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }}/></div></div>}
        <div className="upload-footer"><span className="policy-copy">Workspace rule: <strong>{policyRule}</strong></span><button className="primary-button" disabled={!selectedFile || uploading} onClick={submitUpload}><Upload size={15}/>{uploading ? 'Uploading…' : 'Upload file'}</button></div>
      </section>}

      <div className="task-toolbar document-toolbar">
        <div className="toolbar-row">
          <label className="search-box"><input aria-label="Search documents" placeholder="Search documents..." value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          <select aria-label="Filter documents by file type" value={fileType} onChange={(event) => setFileType(event.target.value)}><option value="all">All file types</option>{allowedTypes.map((allowedType) => <option key={allowedType}>{allowedType}</option>)}</select>
          <div className="view-toggle-group" role="group" aria-label="Document layout">
            <button className={`view-toggle ${view === 'grid' ? 'active' : ''}`} aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid2X2 size={16}/> Grid</button>
            <button className={`view-toggle ${view === 'table' ? 'active' : ''}`} aria-pressed={view === 'table'} onClick={() => setView('table')}><List size={16}/> Table</button>
          </div>
        </div>
      </div>

      {filtered.length === 0 && <EmptyState icon={<FileIcon size={23}/>} title={documents.length ? 'No documents match these filters' : 'Your document library is ready'} description={documents.length ? 'Clear the search and file type filter to return to your full library.' : 'Upload a workspace file to give your team one secure place to find it.'} action={documents.length ? <button type="button" onClick={() => { setQuery(''); setFileType('all'); }}>Clear filters</button> : <PermissionButton type="button" className="primary-button" allowed={controller.accessService.canUploadDocument(controller.user)} reason="Your role does not allow document uploads." onClick={() => setShowUpload(true)}><Upload size={15}/> Upload a document</PermissionButton>} />}

      {filtered.length > 0 && view === 'table' ? <section className="card table-card"><table><thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded By</th><th>Date</th><th /></tr></thead><tbody>
        {filtered.map((doc) => <tr key={doc.id}><td><span className="document-name-cell"><span className={`file-type-icon type-${doc.type.toLowerCase()}`}><TypeIcon type={doc.type}/></span><span><strong>{doc.fileName}</strong><small>{doc.linkedTask ?? 'No linked task'}</small></span></span></td><td>{doc.type}</td><td>{doc.size}</td><td>{doc.uploadedBy}</td><td>{doc.uploadedAt}</td><td><button onClick={() => openDocument(doc)}>Open</button></td></tr>)}
      </tbody></table></section> : filtered.length > 0 && <section className="document-grid">
        {filtered.map((doc) => <button className="document-card" key={doc.id} onClick={() => openDocument(doc)}>
          <span className={`file-type-icon type-${doc.type.toLowerCase()}`}><TypeIcon type={doc.type}/></span><span className="document-card-copy"><strong>{doc.fileName}</strong><small>{doc.linkedTask ?? 'No linked task'}</small></span><span className="document-card-meta"><span>{doc.size}</span><span>{doc.uploadedBy} · {doc.uploadedAt}</span></span>
        </button>)}
      </section>}
    </>
  );
}
