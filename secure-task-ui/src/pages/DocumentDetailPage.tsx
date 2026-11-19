import { Download, FileImage, FileText, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { DetailTabs, type DetailTab } from '../components/DetailTabs';
import { HistoryPanel } from '../components/HistoryPanel';
import { PermissionButton } from '../components/PermissionButton';
import { useAppController } from '../core/AppContext';
import { DocumentFileService } from '../services/DocumentFileService';

const fileStorage = new DocumentFileService();
const isImage = (type: string) => ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(type.toUpperCase());

export function DocumentDetailPage() {
  const controller = useAppController();
  const selectedDocument = controller.selectedDocument;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const canDelete = controller.accessService.canDeleteDocument(controller.user, selectedDocument);
  const documentHistory = controller.auditLogs.filter((log) => log.entity === selectedDocument.fileName);
  const accessHistory = useMemo(() => documentHistory.filter((log) => ['Previewed Document', 'Downloaded Document'].includes(log.action)), [documentHistory]);
  const version = selectedDocument.version ?? 1;

  useEffect(() => {
    let activeUrl: string | null = null;
    let cancelled = false;
    setPreviewUrl(null); setPreviewError(null);
    if (!selectedDocument.fileStorageKey) {
      setPreviewError('No uploaded file content is attached to this record.');
      return () => undefined;
    }
    fileStorage.get(selectedDocument.fileStorageKey).then((blob) => {
      if (cancelled) return;
      if (!blob) { setPreviewError('The original file is not available in this browser.'); return; }
      activeUrl = URL.createObjectURL(blob);
      setPreviewUrl(activeUrl);
      controller.recordDocumentAction(selectedDocument.id, 'Previewed Document');
    }).catch(() => { if (!cancelled) setPreviewError('Could not load this file from browser storage.'); });
    return () => { cancelled = true; if (activeUrl) URL.revokeObjectURL(activeUrl); };
  }, [controller, selectedDocument.id, selectedDocument.fileStorageKey]);

  const handleDownload = async () => {
    if (!controller.recordDocumentAction(selectedDocument.id, 'Downloaded Document')) return;
    if (selectedDocument.fileStorageKey) {
      try {
        const blob = await fileStorage.get(selectedDocument.fileStorageKey);
        if (blob) {
          const url = URL.createObjectURL(blob); const link = globalThis.document.createElement('a');
          link.href = url; link.download = selectedDocument.fileName; link.click(); URL.revokeObjectURL(url); return;
        }
      } catch { /* fall through to the metadata record download */ }
    }
    const exportContent = ['SecureFlow document record', '', `File: ${selectedDocument.fileName}`, `Type: ${selectedDocument.type}`, `Size: ${selectedDocument.size}`, `Uploaded by: ${selectedDocument.uploadedBy}`, `Uploaded at: ${selectedDocument.uploadedAt}`, `Linked task: ${selectedDocument.linkedTask ?? 'None'}`].join('\n');
    const fileBaseName = selectedDocument.fileName.replace(/\.[^.]+$/, '') || selectedDocument.fileName;
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob); const link = globalThis.document.createElement('a');
    link.href = downloadUrl; link.download = `${fileBaseName}-record.txt`; link.click();
    globalThis.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  };

  const handleDelete = async () => {
    if (selectedDocument.fileStorageKey) await fileStorage.delete(selectedDocument.fileStorageKey).catch(() => undefined);
    controller.deleteDocument(selectedDocument.id);
  };

  return (
    <>
      <PageHeader title={selectedDocument.fileName} description="Preview the file and review its details, access activity, and versions." action={<button onClick={() => controller.navigate('documents')}>Back to documents</button>} />
      <DetailTabs active={activeTab} onChange={setActiveTab}/>
      {activeTab === 'history' ? <section className="card"><div><h2>Document history</h2><p className="muted-text">Uploads, previews, downloads, and changes recorded for this document.</p></div><HistoryPanel logs={documentHistory} emptyMessage="Document access and changes will appear here." emptyAction={<button type="button" onClick={() => setActiveTab('overview')}>Return to document</button>}/></section> : <>
      <div className="document-detail-layout">
        <section className="card document-viewer-card">
          <div className="card-header"><div><h2>Preview</h2><p className="muted-text">{selectedDocument.type} · {selectedDocument.size}</p></div><button type="button" onClick={handleDownload}><Download size={16}/> Download</button></div>
          <div className="document-viewer">
            {previewUrl && selectedDocument.type === 'PDF' && <iframe title={`Preview of ${selectedDocument.fileName}`} src={previewUrl} />}
            {previewUrl && isImage(selectedDocument.type) && <img src={previewUrl} alt={`Preview of ${selectedDocument.fileName}`} />}
            {!previewUrl && !previewError && <div className="viewer-loading"><span className="spinner"/> Loading preview…</div>}
            {previewError && <div className="viewer-empty"><span className="viewer-empty-icon">{isImage(selectedDocument.type) ? <FileImage size={28}/> : <FileText size={28}/>}</span><strong>{previewError}</strong><p>This record has no uploaded file content attached.</p></div>}
            {previewUrl && !['PDF', 'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(selectedDocument.type.toUpperCase()) && <div className="viewer-empty"><span className="viewer-empty-icon"><FileText size={28}/></span><strong>Preview isn’t available for {selectedDocument.type}</strong><p>Download the original file to open it in a compatible app.</p></div>}
          </div>
        </section>
        <aside className="document-detail-side">
          <section className="card"><h2>File details</h2><div className="detail-list"><div><span>Type</span><strong>{selectedDocument.type}</strong></div><div><span>Size</span><strong>{selectedDocument.size}</strong></div><div><span>Uploaded by</span><strong>{selectedDocument.uploadedBy}</strong></div><div><span>Uploaded at</span><strong>{selectedDocument.uploadedAt}</strong></div><div><span>Linked task</span><strong>{selectedDocument.linkedTask ?? 'None'}</strong></div></div><PermissionButton type="button" className="wide-button danger-text" allowed={canDelete} reason="Only admins, managers, or the document owner can delete this file." onClick={() => setIsDeleteConfirmationOpen(true)}><Trash2 size={16}/> Delete document</PermissionButton></section>
          <section className="card"><div className="card-header"><div><h2>Who accessed this</h2><p className="muted-text">Preview and download activity</p></div><span className="count-pill">{accessHistory.length}</span></div>
            {accessHistory.length ? <div className="access-list">{accessHistory.map((log) => <div className="access-item" key={log.id}><span className="access-avatar">{log.user.slice(0, 1).toUpperCase()}</span><span className="access-copy"><strong>{log.user}</strong><small>{log.action.replace(' Document', '')} · {new Date(log.time).toLocaleString()}</small></span></div>)}</div> : <p className="muted-text">No preview or download activity recorded yet.</p>}
          </section>
          <section className="card"><div className="card-header"><div><h2>Version history</h2><p className="muted-text">Current version</p></div><span className="version-pill">v{version}</span></div><div className="version-entry"><span className="version-dot"/><span><strong>Version {version}</strong><small>Uploaded by {selectedDocument.uploadedBy} · {selectedDocument.uploadedAt}</small></span><span className="current-version">Current</span></div><p className="retention-note">Previous versions and retention dates appear here when versioning is provided by your workspace.</p></section>
        </aside>
      </div>
      </>}

      {isDeleteConfirmationOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={() => setIsDeleteConfirmationOpen(false)}><section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="delete-document-title" onMouseDown={(event) => event.stopPropagation()}><h2 id="delete-document-title">Delete {selectedDocument.fileName}?</h2><p>This removes the document record from this workspace. Its audit entry will remain.</p><div className="dialog-actions"><button type="button" onClick={() => setIsDeleteConfirmationOpen(false)}>Cancel</button><button type="button" className="danger-button" onClick={handleDelete}>Delete document</button></div></section></div>}
    </>
  );
}
