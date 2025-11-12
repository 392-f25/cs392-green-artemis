export type StatsTab = 'history' | 'aggregate'

interface StatsTabsProps {
  activeTab: StatsTab
  onTabChange: (tab: StatsTab) => void
}

export const StatsTabs = ({ activeTab, onTabChange }: StatsTabsProps) => (
  <div className="stats-tabs">
    <button
      className={`stats-tab ${activeTab === 'history' ? 'stats-tab--active' : ''}`}
      onClick={() => onTabChange('history')}
      type="button"
    >
      Practice History
    </button>
    <button
      className={`stats-tab ${activeTab === 'aggregate' ? 'stats-tab--active' : ''}`}
      onClick={() => onTabChange('aggregate')}
      type="button"
    >
      Aggregate Stats
    </button>
  </div>
)
