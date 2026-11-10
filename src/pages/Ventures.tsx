import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatPct, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Building2, Users, PieChart } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const pct = (v: any) => (v == null ? '–' : formatPct(Number(v)));

export default function Ventures() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('ventures', apiCompanies, apiCategories), deps);
  const v = data?.ventures ?? [];
  const eq = data?.equity ?? [];
  const gross = v.reduce((s: number, r: any) => s + (r.grossCost ?? 0), 0);
  const share = v.reduce((s: number, r: any) => s + (r.partnerShare ?? 0), 0);
  const ventureNames = [...new Set(eq.map((r: any) => r.venture))] as string[];
  const partnerNames = [...new Set(eq.map((r: any) => r.partner))] as string[];
  const glOnly = v.some((r: any) => !r.inJvaMaster);
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        {glOnly && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          The selected SAP source has no Joint Venture Accounting (SAP BDC and BW): ventures come from the GL JointVenture field, without basin, working interest or cutback.</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Ventures" value={formatNumber(v.length)} icon={Building2} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(v.reduce((s: number, r: any) => s + (r.afes ?? 0), 0))} AFEs`} deltaType="neutral" />
          <MetricCard title="Gross JV Cost (24 months)" value={formatDollar(gross)} icon={CurrencyIcon} accent="border-slate-300/50 bg-gradient-to-br from-slate-50 to-gray-50" delta="At 100%, from the GL" deltaType="neutral" />
          <MetricCard title="Partner Share (Cutback)" value={formatDollar(share)} icon={PieChart} accent="border-indigo-300/50 bg-gradient-to-br from-indigo-50 to-violet-50" delta={`${formatPct(100 * share / (gross || 1))} of gross cost`} deltaType="neutral" />
          <MetricCard title="Partners Owe" value={formatDollar(v.reduce((s: number, r: any) => s + (r.openBalance ?? 0), 0))} icon={Users} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatDollar(v.reduce((s: number, r: any) => s + (r.overdue ?? 0), 0))} overdue`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Gross JV Cost by Category" subtitle="USD at 100%">
            <Bars rows={data?.costByCategory ?? []} label="name" value="value" color="#0ea5e9" height={280} />
          </ChartCard>
          <ChartCard title="Partner Share of Billable Cost" subtitle="Cutback by partner, USD (operator included)">
            <Bars rows={data?.cutbackByPartner ?? []} label="name" value="value" color="#6366f1" height={280} leftPad={210} />
          </ChartCard>
          <ChartCard title="Working Interest by Venture" subtitle="Equity group EG01, percent" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (x: number) => `${x?.toFixed?.(2)}%` }, legend: { top: 0, type: 'scroll' },
              grid: { left: 220, right: 20, bottom: 20, top: 40 }, xAxis: { type: 'value', max: 100 },
              yAxis: { type: 'category', inverse: true, data: ventureNames, axisLabel: { fontSize: 10 } },
              series: partnerNames.map((p) => ({ name: p, type: 'bar', stack: 'wi', barMaxWidth: 18,
                data: ventureNames.map((vn) => eq.find((r: any) => r.venture === vn && r.partner === p)?.wi ?? 0) })),
            }} style={{ height: 360 }} />
          </ChartCard>
          <ChartCard title="Ventures" className="lg:col-span-2">
            <DataTable data={v} columns={[
              { key: 'name', label: 'Venture' }, { key: 'basin', label: 'Basin' }, { key: 'area', label: 'Area' }, { key: 'opWi', label: 'Operator WI', format: pct },
              { key: 'partners', label: 'Partners' }, { key: 'grossCost', label: 'Gross cost', format: formatDollar }, { key: 'partnerShare', label: 'Partner share', format: formatDollar },
              { key: 'openBalance', label: 'Owed', format: formatDollar }, { key: 'overdue', label: 'Overdue', format: formatDollar }, { key: 'sourceSystem', label: 'Source' },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
