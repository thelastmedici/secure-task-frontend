export type DetailTab = 'overview' | 'history';

export function DetailTabs({ active, onChange, overviewLabel = 'Overview', historyLabel = 'History' }: { active: DetailTab; onChange: (tab: DetailTab) => void; overviewLabel?: string; historyLabel?: string }) {
  return <div className="detail-tabs" role="tablist" aria-label="Record sections">
    <button type="button" role="tab" aria-selected={active === 'overview'} className={active === 'overview' ? 'active' : ''} onClick={() => onChange('overview')}>{overviewLabel}</button>
    <button type="button" role="tab" aria-selected={active === 'history'} className={active === 'history' ? 'active' : ''} onClick={() => onChange('history')}>{historyLabel}</button>
  </div>;
}
