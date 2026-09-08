import { Upload } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { documents } from '../data/mockData';

export function DocumentsPage({ onOpenDocument }: { onOpenDocument: (id: string) => void }) {
  return (
    <>
      <PageHeader title="Documents" description="Securely upload, link, preview, and audit document access." action={<button className="primary-button"><Upload size={16}/> Upload Document</button>} />
      <div className="toolbar"><input placeholder="Search documents..." /><select><option>All file types</option><option>PDF</option><option>DOCX</option><option>XLSX</option></select></div>
      <section className="card table-card"><table><thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded By</th><th>Date</th><th /></tr></thead><tbody>
        {documents.map((doc) => <tr key={doc.id}><td><strong>{doc.fileName}</strong><span>{doc.linkedTask}</span></td><td>{doc.type}</td><td>{doc.size}</td><td>{doc.uploadedBy}</td><td>{doc.uploadedAt}</td><td><button onClick={() => onOpenDocument(doc.id)}>Open</button></td></tr>)}
      </tbody></table></section>
    </>
  );
}
