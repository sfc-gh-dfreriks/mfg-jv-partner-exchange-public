import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Calendar, Activity, Receipt } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const days = (v: any) => (v == null ? '–' : `${Number(v).toFixed(1)} d`);
const dt = (v: any) => (v ? String(v).slice(0, 10) : '–');
const BUCKET_COLORS = ['#10b981', '#facc15', '#f97316', '#dc2626'];

export default function JibBilling() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('jib', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const aging = data?.aging ?? [];
  const trend = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        {!k.statements && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          No JIB statements: joint interest billing comes from SAP JVA (ECC or S/4HANA). SAP BDC and BW have no JVA data.</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="JIB Billed" value={formatDollar(k.billed)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(k.statements)} statements`} deltaType="neutral" />
          <MetricCard title="Days to Pay" value={days(k.avgDaysToPay)} icon={Calendar} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50" delta={`${formatPct(k.onTimePct)} paid by due date (30 days)`} deltaType="neutral" />
          <MetricCard title="Open / Overdue" value={formatDollar(k.overdue)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`overdue of ${formatDollar(k.openAmount)} open`} deltaType="negative" />
          <MetricCard title="Statements Disputed" value={formatPct(k.disputedPct)} icon={Receipt} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`${formatDollar(k.paid)} received`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="JIB Aging" subtitle="Open statement amounts by due date, USD">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => formatDollar(v) },
              grid: { left: 70, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: aging.map((a: any) => a.name.slice(2)) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ type: 'bar', barMaxWidth: 50, data: aging.map((a: any, i: number) => ({ value: a.value, itemStyle: { color: BUCKET_COLORS[i] } })) }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Average Days to Pay by Partner" subtitle="Billing date to first receipt">
            <Bars rows={data?.daysByPartner ?? []} label="name" value="value" color="#f59e0b" height={300} leftPad={210} format={(v) => `${v.toFixed(1)} d`} />
          </ChartCard>
          <ChartCard title="JIB Billed by Accounting Month" subtitle="Overhead (COPAS) shown separately; line = days to pay" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 50, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, { type: 'value', name: 'days' }],
              series: [
                { name: 'Operating cost', type: 'bar', stack: 'j', data: trend.map((r: any) => r.billed - r.overhead), itemStyle: { color: '#7dd3fc' } },
                { name: 'Overhead', type: 'bar', stack: 'j', data: trend.map((r: any) => r.overhead), itemStyle: { color: '#a78bfa' } },
                { name: 'Days to pay', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.daysToPay?.toFixed?.(1)), itemStyle: { color: '#f59e0b' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Open Statements to Chase" subtitle="Largest overdue first" className="lg:col-span-2">
            <DataTable data={data?.overdue ?? []} columns={[
              { key: 'statementId', label: 'Statement' }, { key: 'partner', label: 'Partner' }, { key: 'venture', label: 'Venture' }, { key: 'period', label: 'Period' },
              { key: 'dueDate', label: 'Due', format: dt }, { key: 'billed', label: 'Billed', format: formatDollar }, { key: 'paid', label: 'Paid', format: formatDollar },
              { key: 'openAmount', label: 'Open', format: formatDollar }, { key: 'daysOverdue', label: 'Days overdue' }, { key: 'status', label: 'Status' },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
