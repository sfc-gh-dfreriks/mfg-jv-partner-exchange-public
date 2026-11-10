import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Gauge, Activity, CreditCard } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const dt = (v: any) => (v ? String(v).slice(0, 10) : '–');

export default function CashCalls() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('cash-calls', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  const byP = data?.byPartner ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        {!k.calls && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          No cash calls: they are issued from SAP JVA (ECC or S/4HANA); SAP BDC and BW have no JVA data.</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Cash Called" value={formatDollar(k.called)} icon={CurrencyIcon} accent="border-indigo-300/50 bg-gradient-to-br from-indigo-50 to-violet-50" delta={`${formatNumber(k.calls)} cash calls`} deltaType="neutral" />
          <MetricCard title="Received" value={formatDollar(k.paid)} icon={CreditCard} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-teal-50" delta={`${formatPct(100 * (k.paid ?? 0) / (k.called || 1))} of called`} deltaType="positive" />
          <MetricCard title="Paid on Time" value={formatPct(k.onTimePct)} icon={Gauge} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta="Received by the due date" deltaType="neutral" />
          <MetricCard title="Overdue" value={formatDollar(k.overdue)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatDollar(k.openAmount)} open`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Cash Called and Received by Due Month" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', valueFormatter: (v: number) => formatDollar(v) }, legend: { top: 0 }, grid: { left: 70, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ name: 'Called', type: 'bar', data: trend.map((r: any) => r.called), itemStyle: { color: '#a5b4fc' } },
                       { name: 'Received', type: 'bar', data: trend.map((r: any) => r.paid), itemStyle: { color: '#34d399' } }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Cash Called by Partner" subtitle="Overdue in red, USD">
            <ReactECharts option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) }, legend: { top: 0 },
              grid: { left: 200, right: 20, bottom: 20, top: 30 }, xAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              yAxis: { type: 'category', data: byP.map((r: any) => r.name), axisLabel: { fontSize: 10 } },
              series: [{ name: 'Paid or not due', type: 'bar', stack: 'c', data: byP.map((r: any) => r.called - r.overdue), itemStyle: { color: '#a5b4fc' } },
                       { name: 'Overdue', type: 'bar', stack: 'c', data: byP.map((r: any) => r.overdue), itemStyle: { color: '#ef4444' } }],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Cash Calls by Status" subtitle="USD">
            <Bars rows={data?.status ?? []} label="name" value="value" color="#6366f1" height={320} leftPad={130} />
          </ChartCard>
          <ChartCard title="Open Cash Calls" subtitle="Largest overdue first" className="lg:col-span-2">
            <DataTable data={data?.open ?? []} columns={[
              { key: 'cashCallId', label: 'Cash call' }, { key: 'partner', label: 'Partner' }, { key: 'venture', label: 'Venture' }, { key: 'afeId', label: 'AFE' },
              { key: 'dueDate', label: 'Due', format: dt }, { key: 'amount', label: 'Amount', format: formatDollar }, { key: 'paid', label: 'Paid', format: formatDollar },
              { key: 'openAmount', label: 'Open', format: formatDollar }, { key: 'status', label: 'Status' },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
