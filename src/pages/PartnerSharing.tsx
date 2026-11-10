import { useState } from 'react';
import { Lock, Share2, ShieldCheck } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import PageState from '@/components/PageState';
import { cn } from '@/lib/utils';

const dt = (v: any) => (v ? String(v).slice(0, 10) : '–');
const pct = (v: any) => (v == null ? '–' : `${Number(v).toFixed(2)}%`);
const VIEWS = ['PARTNER_BALANCE', 'JIB_STATEMENTS', 'JIB_LINES', 'CASH_CALLS', 'AFE_POSITIONS'];

/** Partner Sharing: the secure share that replaces PDF statements, and what each partner would see through it. */
export default function PartnerSharing() {
  const { dataVersion } = useFilters();
  const [partner, setPartner] = useState('');
  const { data, loading, error } = useQuery(() => fetchPage('sharing', [], [], partner ? { partner } : {}), [partner, dataVersion]);
  const map = data?.map ?? [];
  const p = data?.preview ?? {};
  const counts = data?.counts ?? [];
  const selected = p.partnerId ?? partner;
  const seen = (v: string) => (p.seen ?? []).find((r: any) => r.viewName === v);
  return (
    <PageState loading={loading && !data} error={error}>
      <div className="space-y-6">
        <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-sky-800"><Share2 className="h-4 w-4" /> Share {data?.share?.name ?? 'OGE_JV_PARTNER_SHARE'}</div>
          <p className="mt-1 text-sm text-gray-600">
            Instead of emailing JIB and cash-call PDFs, each partner reads its own live statements, cash calls, AFE positions and balance through Snowflake
            Secure Data Sharing. Secure views in <code>OGE_JV_EXCHANGE.SHARE</code> carry the row access policy <code>PARTNER_FILTER</code>: a consumer account
            sees only the partner mapped to it in <code>PARTNER_ACCOUNT_MAP</code>. {data?.share?.to ? `Shared with: ${data.share.to}.` : 'No consumer accounts are added yet; the locators below are placeholders.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {(data?.objects ?? []).map((o: any) => (
              <span key={o.name} className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-sky-900">{o.privilege} · {o.type} · {o.name}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard title="Partners and Consumer Accounts" subtitle="Pick a partner to preview its share">
            <ul className="divide-y divide-gray-100">
              {map.map((m: any) => (
                <li key={m.partnerId}>
                  <button onClick={() => setPartner(m.partnerId)}
                    className={cn('flex w-full items-center justify-between px-2 py-2 text-left text-sm hover:bg-sky-50', selected === m.partnerId && 'bg-sky-100 font-medium')}>
                    <span><span className="block text-gray-900">{m.partnerName}</span><span className="text-[11px] text-gray-500">{m.consumerAccount}</span></span>
                    <span className="text-right text-xs text-gray-600">{formatDollar(m.openBalance)}<br />owed</span>
                  </button>
                </li>
              ))}
            </ul>
          </ChartCard>
          <div className="space-y-6 lg:col-span-2">
            <ChartCard title="What This Partner Sees" subtitle={`Evaluated by the row access policy as consumer account ${p.account ?? '–'} (EXECUTE USING POLICY_CONTEXT)`}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {VIEWS.map((v) => {
                  const s = seen(v);
                  const all = counts.filter((c: any) => c.viewName === v).reduce((t: number, c: any) => t + c.n, 0);
                  return (
                    <div key={v} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500"><Lock className="h-3 w-3" />{v}</div>
                      <div className="mt-1 text-lg font-bold text-gray-900">{formatNumber(s?.n)}</div>
                      <div className="text-[11px] text-gray-500">of {formatNumber(all)} rows · {formatNumber(s?.partners)} partner</div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" />
                An account that is not in the map sees {formatNumber(data?.unmappedAccountRows)} rows.</p>
            </ChartCard>
            <ChartCard title="Balance by Venture (shared view PARTNER_BALANCE)">
              <DataTable data={p.balance ?? []} columns={[
                { key: 'ventureName', label: 'Venture' }, { key: 'billedTotal', label: 'Billed', format: formatDollar }, { key: 'paidTotal', label: 'Paid', format: formatDollar },
                { key: 'openBalance', label: 'Open', format: formatDollar }, { key: 'overdueBalance', label: 'Overdue', format: formatDollar }, { key: 'disputedOpen', label: 'Disputed', format: formatDollar },
              ]} />
            </ChartCard>
          </div>
          <ChartCard title="Latest JIB Statements (shared view JIB_STATEMENTS)" className="lg:col-span-2">
            <DataTable data={p.statements ?? []} columns={[
              { key: 'statementId', label: 'Statement' }, { key: 'ventureName', label: 'Venture' }, { key: 'period', label: 'Period' }, { key: 'dueDate', label: 'Due', format: dt },
              { key: 'billedAmount', label: 'Billed', format: formatDollar }, { key: 'openAmount', label: 'Open', format: formatDollar }, { key: 'status', label: 'Status' },
            ]} />
          </ChartCard>
          <ChartCard title="Cash Calls (shared view CASH_CALLS)">
            <DataTable data={p.cashCalls ?? []} columns={[
              { key: 'afeId', label: 'AFE' }, { key: 'dueDate', label: 'Due', format: dt }, { key: 'amount', label: 'Amount', format: formatDollar }, { key: 'status', label: 'Status' },
            ]} />
          </ChartCard>
          <ChartCard title="AFE Positions (shared view AFE_POSITIONS)" className="lg:col-span-3">
            <DataTable data={p.afes ?? []} columns={[
              { key: 'afeId', label: 'AFE' }, { key: 'description', label: 'Description' }, { key: 'election', label: 'Election' }, { key: 'wiPct', label: 'WI', format: pct },
              { key: 'shareOfBudget', label: 'Share of budget', format: formatDollar }, { key: 'shareOfActual', label: 'Share of actual', format: formatDollar },
              { key: 'cashCalled', label: 'Cash called', format: formatDollar }, { key: 'trueUp', label: 'True-up', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
