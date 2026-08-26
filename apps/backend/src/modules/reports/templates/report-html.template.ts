import type { ReportModel } from '../report-model';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function formatDimensions(dims: Array<{ type: string; value: string }>): string {
  if (dims.length === 0) return '';
  return ` (${dims.map((d) => `${d.type}: ${d.value}`).join(', ')})`;
}

// Server-rendered HTML, converted to PDF by Puppeteer (plan §6) — a
// separate concern from the React apps' i18n (packages/i18n), since this
// output is a static document, not an interactive page. Full bilingual
// layout (English/Chinese side by side per line) is what the plan asks
// for; a from-scratch translation of every UI string into a second
// stylesheet layer is not attempted here — GRI/HKEX codes and category
// names already carry both languages from the catalog itself.
export function renderReportHtml(model: ReportModel): string {
  const title =
    model.audience === 'OFFICIAL'
      ? `${model.facilityNameEn} — ESG Report`
      : `${model.facilityNameEn} — ${model.clientNameEn ?? 'Client'} Environmental Impact Summary`;

  const sectionsHtml = model.sections
    .map((section) => {
      if (section.metrics.length === 0) return '';
      const metricsHtml = section.metrics
        .map((metric) => {
          const codeChips = [metric.griCode, metric.hkexCode]
            .filter(Boolean)
            .map((c) => `<span class="chip">${escapeHtml(c!)}</span>`)
            .join(' ');
          const rowsHtml = metric.rows
            .map((row) => {
              const value =
                row.numericTotal !== null
                  ? `${row.numericTotal.toLocaleString('en-HK')}${metric.unit ? ' ' + escapeHtml(metric.unit) : ''}`
                  : row.textValues.map(escapeHtml).join('; ');
              return `<tr><td>${escapeHtml(metric.nameEn)}${escapeHtml(formatDimensions(row.dimensions))}</td><td>${value}</td></tr>`;
            })
            .join('');
          return `<div class="metric"><div class="metric-header"><strong>${escapeHtml(metric.nameEn)} / ${escapeHtml(metric.nameZh)}</strong> ${codeChips}</div><table>${rowsHtml}</table></div>`;
        })
        .join('');
      return `<section><h2>${escapeHtml(section.nameEn)} / ${escapeHtml(section.nameZh)}</h2>${metricsHtml}</section>`;
    })
    .join('');

  const derivedHtml =
    model.audience === 'CLIENT_SELF_SERVICE'
      ? `<section class="impact"><h2>Your Environmental Impact</h2>
          <div class="impact-tiles">
            <div class="tile"><div class="tile-value">${model.derived.clientTreesSaved?.toLocaleString('en-HK') ?? '—'}</div><div class="tile-label">Trees Saved (est.)</div></div>
            <div class="tile"><div class="tile-value">${model.derived.clientCo2SavedKg?.toLocaleString('en-HK') ?? '—'} kg</div><div class="tile-label">CO2e Saved (est.)</div></div>
          </div>
        </section>`
      : model.derived.electricityGJ !== null || model.derived.refrigerantCO2eKg !== null
        ? `<section><h2>Derived Figures</h2><table>
            ${model.derived.electricityGJ !== null ? `<tr><td>Purchased electricity, GJ equivalent</td><td>${model.derived.electricityGJ.toLocaleString('en-HK')} GJ</td></tr>` : ''}
            ${model.derived.refrigerantCO2eKg !== null ? `<tr><td>GHG emissions from refrigerant loss (GWP-weighted)</td><td>${model.derived.refrigerantCO2eKg.toLocaleString('en-HK')} kgCO2e</td></tr>` : ''}
          </table></section>`
        : '';

  const citationsHtml = model.emissionFactorsUsed.length
    ? `<section class="citations"><h2>Emission Factors Used</h2><ul>${model.emissionFactorsUsed
        .map(
          (c) =>
            `<li><strong>${escapeHtml(c.code)}</strong>: ${escapeHtml(c.factorValue)} ${escapeHtml(c.factorUnit)} — ${escapeHtml(c.sourceReference ?? 'no source recorded')}</li>`,
        )
        .join('')}</ul></section>`
    : '';

  const watermark = model.audience === 'CLIENT_SELF_SERVICE' ? '<div class="watermark">PROVISIONAL / UNAUDITED</div>' : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: 'Noto Sans HK', 'Inter', system-ui, sans-serif; color: #1e293b; margin: 0; padding: 32px; position: relative; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .subtitle { color: #627288; font-size: 12px; margin-bottom: 24px; }
  h2 { font-size: 14px; border-bottom: 2px solid #d1d6e0; padding-bottom: 4px; margin-top: 24px; }
  .metric { margin: 8px 0; }
  .metric-header { font-size: 12px; margin-bottom: 4px; }
  .chip { display: inline-block; background: #e0f5ef; color: #007c59; border-radius: 4px; padding: 1px 6px; font-size: 10px; margin-left: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  td { padding: 4px 6px; border-bottom: 1px solid #f0f0f0; }
  .impact-tiles { display: flex; gap: 16px; }
  .tile { background: #f4f6f9; border-radius: 8px; padding: 16px; flex: 1; text-align: center; }
  .tile-value { font-size: 24px; font-weight: 700; }
  .tile-label { font-size: 11px; color: #627288; }
  .citations { font-size: 10px; color: #627288; }
  .watermark { position: fixed; top: 40%; left: 10%; font-size: 48px; color: rgba(197, 48, 48, 0.15); transform: rotate(-25deg); font-weight: 700; }
  footer { position: fixed; bottom: 16px; font-size: 9px; color: #627288; }
</style>
</head>
<body>
${watermark}
<h1>${escapeHtml(title)}</h1>
<div class="subtitle">Reporting period: ${escapeHtml(model.periodStart)} to ${escapeHtml(model.periodEnd)} · Template: ${escapeHtml(model.templateNameEn)} · Generated: ${escapeHtml(model.generatedAt)}</div>
${sectionsHtml}
${derivedHtml}
${citationsHtml}
<footer>Generated by the ESG Auditing Platform. ${model.audience === 'CLIENT_SELF_SERVICE' ? 'Provisional figures, not independently audited.' : ''}</footer>
</body>
</html>`;
}
