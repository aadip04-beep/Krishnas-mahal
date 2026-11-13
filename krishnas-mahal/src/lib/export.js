// Excel export via SheetJS (lazy-loaded) and PDF via the browser's print → "Save as PDF".
// Browser printing is used for PDF because it renders Hindi (Devanagari) text correctly without embedding fonts.

export async function downloadExcel({ fileName, sheets }) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([s.headers, ...s.rows])
    ws['!cols'] = s.headers.map((h, i) => ({ wch: Math.min(40, Math.max(String(h).length + 2, ...s.rows.map(r => String(r[i] ?? '').length + 2))) }))
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
  }
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

export function printReport({ title, subtitle, headers, rows, totals, footer }) {
  const esc = (s) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&family=Plus+Jakarta+Sans:wght@400;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: 'Plus Jakarta Sans','Noto Sans Devanagari',system-ui,sans-serif; color:#0B1F3A; font-size:11px; margin:0; }
    .head { display:flex; align-items:center; gap:12px; border-bottom:3px solid #F2B33D; padding-bottom:8px; margin-bottom:10px; }
    .head h1 { margin:0; font-size:18px; color:#0B1F3A; } .head p { margin:2px 0 0; color:#4B5563; font-size:11px; }
    .feather { width:34px; height:34px; }
    table { width:100%; border-collapse:collapse; } th, td { border:1px solid #D7DCE5; padding:5px 6px; text-align:left; vertical-align:top; }
    th { background:#0B1F3A; color:#fff; font-weight:700; } tr:nth-child(even) td { background:#F6F8FB; }
    td.num, th.num { text-align:right; white-space:nowrap; font-variant-numeric: tabular-nums; }
    tfoot td { font-weight:700; background:#FFF4D6; }
    .foot { margin-top:10px; color:#6B7280; font-size:10px; display:flex; justify-content:space-between; }
    thead { display: table-header-group; } tr { page-break-inside: avoid; }
  </style></head><body>
  <div class="head">
    <svg class="feather" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 60 C30 40 30 24 32 4" stroke="#0B1F3A" stroke-width="2" fill="none"/><ellipse cx="32" cy="22" rx="14" ry="19" fill="#0FA3A3"/><ellipse cx="32" cy="22" rx="9" ry="12" fill="#1E4E9E"/><ellipse cx="32" cy="24" rx="5" ry="7" fill="#F2B33D"/><ellipse cx="32" cy="25" rx="2.5" ry="3.5" fill="#0B1F3A"/></svg>
    <div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
  </div>
  <table><thead><tr>${headers.map(h => `<th class="${h.num ? 'num' : ''}">${esc(h.label)}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${headers[i].num ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
  ${totals ? `<tfoot><tr>${totals.map((c, i) => `<td class="${headers[i].num ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr></tfoot>` : ''}
  </table>
  <div class="foot"><span>${esc(footer)}</span><span>Krishna's Mahal</span></div>
  <script>window.onload=()=>{setTimeout(()=>{window.print();},400)}</script>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) { alert('Please allow pop-ups to download the PDF.'); return }
  w.document.open(); w.document.write(html); w.document.close()
}
