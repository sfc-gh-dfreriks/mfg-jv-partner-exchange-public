import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Activity, Receipt, Users } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

/** Executive Dashboard: what partners owe us, what is overdue and what they are disputing. */
export default function Overview() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('overview', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const c = data?.cost ?? {};
  const owed = data?.owedByPartner ?? [];
  const trend = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Partners Owe Us" value={formatDollar(k.openBalance)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50"
            delta={`${formatNumber(k.partners)} partners · ${formatDollar(k.billed)} billed (JIB + cash calls)`} deltaType="neutral" />
          <MetricCard title="Overdue" value={formatDollar(k.overdue)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50"
            delta={`${formatPct(100 * (k.overdue ?? 0) / (k.openBalance || 1))} of the open balance`} deltaType="negative" />
          <MetricCard title="Under Open Dispute" value={formatDollar(k.disputed)} icon={Receipt} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50"
            delta={`${formatDollar(k.credited)} credited on resolved disputes`} deltaType="neutral" />
          <MetricCard title="Collected" value={formatPct(100 * ((k.paid ?? 0) + (k.credited ?? 0)) / (k.billed || 1))} icon={Users} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-teal-50"
            delta={`${formatDollar(k.paid)} received · ${formatDollar(c.grossCost)} gross JV cost, ${formatNumber(c.ventures)} ventures`} deltaType="positive" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="What Each Partner Owes" subtitle="Open balance split into overdue, disputed and not yet due, USD">
            <ReactECharts option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) }, legend: { top: 0 },
              grid: { left: 180, right: 20, bottom: 20, top: 30 },
              xAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              yAxis: { type: 'category', data: owed.map((r: any) => r.name), axisLabel: { fontSize: 10 } },
              series: [
                { name: 'Overdue', type: 'bar', stack: 'a', data: owed.map((r: any) => r.overdue), itemStyle: { color: '#ef4444' } },
                { name: 'Disputed', type: 'bar', stack: 'a', data: owed.map((r: any) => Math.min(r.disputed, Math.max(r.openBalance - r.overdue, 0))), itemStyle: { color: '#f59e0b' } },
                { name: 'Not yet due', type: 'bar', stack: 'a', data: owed.map((r: any) => Math.max(r.openBalance - r.overdue - r.disputed, 0)), itemStyle: { color: '#7dd3fc' } },
              ],
            }} style={{ height: 340 }} />
          </ChartCard>
          <ChartCard title="Open Balance by Basin" subtitle="USD">
            <Bars rows={data?.byBasin ?? []} label="name" value="openBalance" color="#0ea5e9" height={340} />
          </ChartCard>
          <ChartCard title="Gross JV Cost, Partner Billing and Cash Received by Month" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', valueFormatter: (v: number) => formatDollar(v) }, legend: { top: 0 }, grid: { left: 70, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [
                { name: 'Gross JV cost', type: 'line', smooth: true, data: trend.map((r: any) => r.grossCost), itemStyle: { color: '#64748b' } },
                { name: 'JIB billed', type: 'bar', stack: 'b', data: trend.map((r: any) => r.jibBilled), itemStyle: { color: '#38bdf8' } },
                { name: 'Cash called', type: 'bar', stack: 'b', data: trend.map((r: any) => r.cashCalled), itemStyle: { color: '#818cf8' } },
                { name: 'Cash received', type: 'line', smooth: true, data: trend.map((r: any) => r.cashReceived), itemStyle: { color: '#10b981' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="What Partners Dispute" subtitle="JIB disputes raised on the partner portal, USD" className="lg:col-span-2">
            <Bars rows={data?.disputeReasons ?? []} label="name" value="value" color="#f59e0b" height={240} leftPad={240} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
