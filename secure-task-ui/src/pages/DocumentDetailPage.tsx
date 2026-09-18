import { Download, Eye, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useAppController } from '../core/AppContext';

export function DocumentDetailPage() {
  const controller = useAppController();
  const document = controller.selectedDocument;

  return (
    <>
      <PageHeader title={document.fileName} description="Document metadata, preview actions, permissions, and history." action={<button onClick={() => controller.navigate('documents')}>Back</button>} />
      <div className="detail-grid">
        <section className="card"><h2>File Details</h2><div className="document-preview">{document.type}</div><div className="detail-list"><div><span>Size</span><strong>{document.size}</strong></div><div><span>Uploaded By</span><strong>{document.uploadedBy}</strong></div><div><span>Uploaded At</span><strong>{document.uploadedAt}</strong></div><div><span>Linked Task</span><strong>{document.linkedTask}</strong></div></div></section>
        <section className="card"><h2>Actions</h2><button className="wide-button"><Eye size={16}/> Preview</button><button className="wide-button"><Download size={16}/> Download</button><button className="wide-button danger-text"><Trash2 size={16}/> Delete</button></section>
      </div>
      <section className="card"><h2>Document History</h2><div className="timeline"><div><span />Uploaded by {document.uploadedBy}</div><div><span />Viewed by Joshua</div><div><span />Linked to {document.linkedTask}</div></div></section>
    </>
  );
}
