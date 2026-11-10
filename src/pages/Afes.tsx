import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, TrendingUp, Users, Calculator } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import PageState from '@/components/PageState';

const pct = (v: any) => (v == null ? '–' : formatPct(Number(v)));

export default function Afes() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('afes', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const variance = [...(data?.variance ?? [])].sort((a: any, b: any) => b.value - a.value);
  const byType = data?.byType ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        {k.afes > 0 && k.budget == null && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          AFE budgets are not available from the selected source (the SAP BDC project data product has no BPGE budget); actuals come from the GL.</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="AFE Budget" value={formatDollar(k.budget)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(k.afes)} AFEs (drill, complete, facility)`} deltaType="neutral" />
          <MetricCard title="Actual at 100%" value={formatDollar(k.actual)} icon={Calculator} accent="border-slate-300/50 bg-gradient-to-br from-slate-50 to-gray-50" delta={`${formatPct(100 * (k.actual ?? 0) / (k.budget || 1))} of budget`} deltaType="neutral" />
          <MetricCard title="Overruns" value={formatDollar(k.overrun)} icon={TrendingUp} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatNumber(k.over10)} AFEs more than 10% over`} deltaType="negative" />
          <MetricCard title="Partner Elections" value={`${formatNumber(k.nonConsents)} non-consent`} icon={Users} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`${formatNumber(k.pending)} ballots pending · true-up ${formatDollar(k.trueUp)}`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Largest AFE Variances" subtitle="Actual minus budget, USD (overruns red)">
            <ReactECharts option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) },
              grid: { left: 130, right: 20, bottom: 20, top: 10 }, xAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              yAxis: { type: 'category', inverse: true, data: variance.map((r: any) => r.name), axisLabel: { fontSize: 10 } },
              series: [{ type: 'bar', barMaxWidth: 16, data: variance.map((r: any) => ({ value: r.value, itemStyle: { color: r.value > 0 ? '#ef4444' : '#10b981' } })) }],
            }} style={{ height: 360 }} keepOrder />
          </ChartCard>
          <ChartCard title="Budget vs Actual by AFE Type" subtitle="USD at 100%">
            <ReactECharts option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) }, legend: { top: 0 },
              grid: { left: 70, right: 20, bottom: 30, top: 40 }, xAxis: { type: 'category', data: byType.map((r: any) => r.name) },
              yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ name: 'Budget', type: 'bar', data: byType.map((r: any) => r.budget), itemStyle: { color: '#93c5fd' } },
                       { name: 'Actual', type: 'bar', data: byType.map((r: any) => r.actual), itemStyle: { color: '#1d4ed8' } }],
            }} style={{ height: 360 }} />
          </ChartCard>
          <ChartCard title="AFEs" subtitle="Largest actual spend first; ballots from the partner portal" className="lg:col-span-2">
            <DataTable data={data?.afes ?? []} columns={[
              { key: 'afeId', label: 'AFE' }, { key: 'venture', label: 'Venture' }, { key: 'description', label: 'Description' }, { key: 'status', label: 'Status' },
              { key: 'budget', label: 'Budget', format: formatDollar }, { key: 'actual', label: 'Actual', format: formatDollar }, { key: 'variancePct', label: 'Var %', format: pct },
              { key: 'consents', label: 'Consent' }, { key: 'nonConsents', label: 'Non-consent' }, { key: 'pending', label: 'Pending' },
              { key: 'cashCalled', label: 'Cash called', format: formatDollar }, { key: 'trueUp', label: 'Partner true-up', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
