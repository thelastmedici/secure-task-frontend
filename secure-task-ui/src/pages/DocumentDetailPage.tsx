import { Download, Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';

export function DocumentDetailPage() {
  const controller = useAppController();
  const selectedDocument = controller.selectedDocument;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const canDelete = controller.accessService.canDeleteDocument(controller.user, selectedDocument);
  const documentHistory = controller.auditLogs.filter((log) => log.entity === selectedDocument.fileName);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPreviewOpen(false);
    };
    globalThis.document.addEventListener('keydown', closeOnEscape);
    return () => globalThis.document.removeEventListener('keydown', closeOnEscape);
  }, [isPreviewOpen]);

  const handlePreview = () => {
    if (controller.recordDocumentAction(selectedDocument.id, 'Previewed Document')) {
      setIsPreviewOpen(true);
    }
  };

  const handleDownload = () => {
    if (!controller.recordDocumentAction(selectedDocument.id, 'Downloaded Document')) return;

    const exportContent = [
      'SecureFlow document record',
      '',
      `File: ${selectedDocument.fileName}`,
      `Type: ${selectedDocument.type}`,
      `Size: ${selectedDocument.size}`,
      `Uploaded by: ${selectedDocument.uploadedBy}`,
      `Uploaded at: ${selectedDocument.uploadedAt}`,
      `Linked task: ${selectedDocument.linkedTask ?? 'None'}`,
    ].join('\n');
    const fileBaseName = selectedDocument.fileName.replace(/\.[^.]+$/, '') || selectedDocument.fileName;
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = globalThis.document.createElement('a');
    link.href = downloadUrl;
    link.download = `${fileBaseName}-record.txt`;
    globalThis.document.body.append(link);
    link.click();
    link.remove();
    globalThis.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  };

  const handleDelete = () => {
    controller.deleteDocument(selectedDocument.id);
  };

  return (
    <>
      <PageHeader title={selectedDocument.fileName} description="Document metadata, preview actions, permissions, and history." action={<button onClick={() => controller.navigate('documents')}>Back</button>} />
      <div className="detail-grid">
        <section className="card"><h2>File Details</h2><div className="document-preview">{selectedDocument.type}</div><div className="detail-list"><div><span>Size</span><strong>{selectedDocument.size}</strong></div><div><span>Uploaded By</span><strong>{selectedDocument.uploadedBy}</strong></div><div><span>Uploaded At</span><strong>{selectedDocument.uploadedAt}</strong></div><div><span>Linked Task</span><strong>{selectedDocument.linkedTask ?? 'None'}</strong></div></div></section>
        <section className="card"><h2>Actions</h2><button type="button" className="wide-button" onClick={handlePreview}><Eye size={16}/> Preview</button><button type="button" className="wide-button" onClick={handleDownload}><Download size={16}/> Download record</button><button type="button" className="wide-button danger-text" disabled={!canDelete} title={!canDelete ? 'You do not have permission to delete this document.' : undefined} onClick={() => setIsDeleteConfirmationOpen(true)}><Trash2 size={16}/> Delete</button></section>
      </div>
      <section className="card"><h2>Document History</h2><div className="timeline">{documentHistory.map((log) => <div key={log.id}><span />{log.action} by {log.user}</div>)}{documentHistory.length === 0 && <p className="muted-text">No recorded activity yet.</p>}</div></section>

      {isPreviewOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setIsPreviewOpen(false)}>
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="document-preview-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="card-header"><div><h2 id="document-preview-title">{selectedDocument.fileName}</h2><p className="muted-text">Metadata preview</p></div><button type="button" onClick={() => setIsPreviewOpen(false)}>Close</button></div>
            <div className="preview-content"><strong>{selectedDocument.type} document</strong><p>This local demo stores document metadata rather than the original file content.</p><dl><div><dt>Size</dt><dd>{selectedDocument.size}</dd></div><div><dt>Uploaded by</dt><dd>{selectedDocument.uploadedBy}</dd></div><div><dt>Linked task</dt><dd>{selectedDocument.linkedTask ?? 'None'}</dd></div></dl></div>
          </section>
        </div>
      )}

      {isDeleteConfirmationOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setIsDeleteConfirmationOpen(false)}>
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="delete-document-title" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="delete-document-title">Delete {selectedDocument.fileName}?</h2>
            <p>This removes the document record from this workspace. Its audit entry will remain.</p>
            <div className="dialog-actions"><button type="button" onClick={() => setIsDeleteConfirmationOpen(false)}>Cancel</button><button type="button" className="danger-button" onClick={handleDelete}>Delete document</button></div>
          </section>
        </div>
      )}
    </>
  );
}
