# JV Partner Data Exchange — public demo

A static, no-login build of the **JV Partner Data Exchange** app (Oil, Gas & Energy use case 15 in
[`mfg-use-cases`](https://github.com/sfc-gh-dfreriks/mfg-use-cases)), deployed to GitHub Pages:

**https://sfc-gh-dfreriks.github.io/mfg-jv-partner-exchange-public/**

The app answers one question for an upstream operator: *what does each joint-venture partner owe us, what are they disputing,
and can we share it with them securely instead of by PDF?* The (fictional) operator, Lone Star Basin Energy, runs nine joint
ventures in the Permian (Delaware, Midland), Eagle Ford and Gulf of Mexico deepwater on two SAP instances, each readable as SAP ECC,
S/4HANA, BW/4HANA or SAP BDC, plus a JV partner portal where non-operators vote on AFEs, dispute JIB statements and log audit
exceptions. The data flows through dbt staging adapters, a canonical silver layer and gold marts on Snowflake (JV ledger, cutback,
JIB statements, cash calls, partner receipts, AFE variance), then to a semantic view, a Cortex Agent and this React app.

**Pages:** Ask Cortex · Executive Dashboard · Ventures · JIB Billing · Cash Calls · AFEs · Partner Disputes & Audit ·
Partner Sharing · Data Sources · Field Mapping · SAP Metadata · Sources & Lineage (dbt) · Pipeline in 3D

## Read this first

- **All data is synthetic** (24 months, November 2024 to October 2026). Company, partner and venture names are fictional.
- **The SAP JVA tables are simulated.** SAP BDC has no data products for IS-Oil Joint Venture Accounting, and the SAP system used to
  build this demo has no IS-Oil either. The JVA tables (ventures, equity groups, JV ledger, cutback, JIB, cash calls) are generated in
  a native-looking shape with illustrative IS-Oil-style names and fields; they are not a copy of the SAP dictionary. Their metadata is
  marked `SYNTHETIC` on the SAP Metadata page. Under BW or BDC those objects are a recorded gap.
- **Partner sharing:** the full deployment creates a Snowflake share with secure views and a per-partner row access policy, but
  **no consumer accounts are attached**; the partner account mapping holds placeholders. The Partner Sharing page shows what each
  partner would see (simulated per partner), not a live external exchange.

## How the public build works

- **Snapshot:** built with `VITE_STATIC=1`, the client reads pre-baked JSON in `public/data/` instead of a live `/api`.
  There is no Snowflake connection and no credentials are required. Source selection in the snapshot: SAP A = ECC,
  SAP B = S/4HANA, partner portal on.
- **Filters:** every basin subset with all partners is baked, and so are all basins or one basin with each single partner
  (70 views per page). Other combinations fall back to the nearest baked view.
- **Ask Cortex:** answers are pre-generated for each page's default analysis and every suggested question. Free-text
  questions need the full deployment.
- **Data Sources:** browse each source type and preview its native tables. Apply (which runs dbt in Snowflake) is disabled.

## Full deployment

For live queries, source switching and free-text Ask Cortex, deploy from the source repo:
```bash
git clone https://github.com/sfc-gh-dfreriks/mfg-use-cases
cd mfg-use-cases/use_cases/15_jv_partner_exchange
tools/build_local.sh
cd app && npm install && npm run dev  # http://localhost:5198 (API on 3023)
```
See [use_cases/15_jv_partner_exchange/README.md](https://github.com/sfc-gh-dfreriks/mfg-use-cases/blob/main/use_cases/15_jv_partner_exchange/README.md) for full setup instructions.
