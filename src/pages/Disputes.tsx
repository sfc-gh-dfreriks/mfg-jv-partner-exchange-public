import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { Receipt, CurrencyIcon, FileText, Calendar } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

export default function Disputes() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('disputes', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="JIB Disputes" value={formatNumber(k.disputes)} icon={Receipt} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`${formatNumber(k.openDisputes)} still open`} deltaType="neutral" />
          <MetricCard title="Disputed Amount" value={formatDollar(k.disputed)} icon={CurrencyIcon} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatDollar(k.credited)} credited to partners`} deltaType="negative" />
          <MetricCard title="Audit Exceptions" value={formatNumber(k.auditItems)} icon={FileText} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`${formatDollar(k.auditClaimed)} claimed · ${formatDollar(k.auditOpen)} open`} deltaType="neutral" />
          <MetricCard title="Days to Resolve" value={k.avgDays == null ? '–' : `${Number(k.avgDays).toFixed(1)} d`} icon={Calendar} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="Raised to resolved (open: to today)" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Why Partners Dispute JIB" subtitle="Disputed amount by reason, USD">
            <Bars rows={data?.reasons ?? []} label="name" value="value" color="#f59e0b" height={280} leftPad={240} />
          </ChartCard>
          <ChartCard title="Disputes and Audit Claims by Partner" subtitle="USD">
            <Bars rows={data?.byPartner ?? []} label="name" value="value" color="#ef4444" height={280} leftPad={210} />
          </ChartCard>
          <ChartCard title="Audit Exceptions by Category" subtitle="Claimed by partner auditors, USD" className="lg:col-span-2">
            <Bars rows={data?.auditCats ?? []} label="name" value="value" color="#8b5cf6" height={240} leftPad={220} />
          </ChartCard>
          <ChartCard title="Open Disputes and Audit Exceptions" subtitle="From the partner portal, largest first" className="lg:col-span-2">
            <DataTable data={data?.open ?? []} columns={[
              { key: 'itemType', label: 'Type' }, { key: 'itemId', label: 'Item' }, { key: 'reference', label: 'Statement / audit' }, { key: 'partner', label: 'Partner' },
              { key: 'venture', label: 'Venture' }, { key: 'category', label: 'Category' }, { key: 'reason', label: 'Reason' },
              { key: 'claimed', label: 'Claimed', format: formatDollar }, { key: 'daysOpen', label: 'Days open' },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
