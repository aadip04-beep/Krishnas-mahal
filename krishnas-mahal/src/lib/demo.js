// Demo data used only when VITE_SUPABASE_URL is not set (lets you try the app before backend setup).
const cats = [
  ['Plot Purchase', 'प्लॉट खरीद', 'map', '#F2B33D'], ['Cement', 'सीमेंट', 'package', '#8D99AE'], ['Steel', 'सरिया / स्टील', 'anchor', '#5C7CFA'],
  ['Sand', 'रेत', 'mountain', '#D4A373'], ['Bricks', 'ईंट', 'brick-wall', '#C1572A'], ['Aggregate', 'गिट्टी', 'layers', '#7D8597'],
  ['Other Material', 'अन्य सामग्री', 'boxes', '#9C6644'], ['Labour', 'मज़दूरी', 'hard-hat', '#0FA3A3'], ['Electrical', 'बिजली', 'zap', '#FFD166'],
  ['Plumbing', 'प्लंबिंग', 'droplets', '#4CC9F0'], ['Tiles & Flooring', 'टाइल्स / फर्श', 'grid-3x3', '#B5838D'], ['Doors & Windows', 'दरवाज़े / खिड़की', 'door-open', '#A3B18A'],
  ['Paint', 'पेंट', 'paintbrush', '#EF476F'], ['Architect / Engineer', 'आर्किटेक्ट / इंजीनियर', 'ruler', '#06D6A0'], ['Govt. Fees & Approvals', 'सरकारी शुल्क', 'file-badge', '#8338EC'],
  ['Miscellaneous', 'विविध खर्च', 'more-horizontal', '#ADB5BD']
]
const ms = [
  ['Plot registry & mutation', 'प्लॉट रजिस्ट्री व नामांतरण', 'plot', 'done'], ['Boundary & site clearing', 'सीमा व साइट सफाई', 'plot', 'done'], ['Bhoomi Pujan', 'भूमि पूजन', 'plot', 'done'],
  ['Approved plan / sanction', 'नक्शा स्वीकृति', 'common', 'done'], ['Excavation & foundation', 'खुदाई व नींव', 'ground', 'done'], ['Plinth beam & DPC', 'प्लिंथ बीम व DPC', 'ground', 'in_progress'],
  ['Ground floor columns & walls', 'भूतल कॉलम व दीवारें', 'ground', 'pending'], ['Ground floor slab', 'भूतल छत (स्लैब)', 'ground', 'pending'], ['First floor columns & walls', 'प्रथम तल कॉलम व दीवारें', 'first', 'pending'],
  ['First floor slab', 'प्रथम तल छत (स्लैब)', 'first', 'pending'], ['Electrical conduit & plumbing', 'बिजली पाइप व प्लंबिंग', 'common', 'pending'], ['Plastering', 'प्लास्टर', 'common', 'pending'],
  ['Flooring & tiles', 'फर्श व टाइल्स', 'common', 'pending'], ['Doors, windows & grills', 'दरवाज़े, खिड़कियाँ व ग्रिल', 'common', 'pending'], ['Painting', 'पेंटिंग', 'common', 'pending'],
  ['Water tank, borewell & sump', 'पानी की टंकी, बोरवेल व संप', 'common', 'pending'], ['Griha Pravesh', 'गृह प्रवेश', 'common', 'pending']
]
export const DEMO_USERS = [
  { id: 'demo-admin', username: 'admin', display_name: 'Aditya', role: 'admin', is_active: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 'demo-u2', username: 'papa', display_name: 'Papa ji', role: 'member', is_active: true, created_at: '2026-06-02T00:00:00Z' },
  { id: 'demo-u3', username: 'aditi', display_name: 'Aditi', role: 'member', is_active: true, created_at: '2026-06-02T00:00:00Z' }
]
export function demoSeed() {
  const categories = cats.map(([en, hi, icon, color], i) => ({ id: 'c' + i, name_en: en, name_hi: hi, icon, color, sort: i + 1, is_default: true, created_at: '2026-06-01T00:00:00Z' }))
  const milestones = ms.map(([en, hi, floor, status], i) => ({ id: 'm' + i, title_en: en, title_hi: hi, floor, status, sort: i + 1, target_date: null, completed_on: status === 'done' ? '2026-08-10' : null, note: null, created_at: '2026-06-01T00:00:00Z' }))
  const sample = [
    ['2026-06-05', 0, 1850000, 'plot', 'Plot registry – 1200 sq ft', 'Sub-registrar office', 'bank', true, 'demo-admin'],
    ['2026-06-20', 14, 42000, 'common', 'Plan sanction fees', 'Nagar Palika', 'cheque', true, 'demo-admin'],
    ['2026-07-02', 13, 35000, 'common', 'Architect – plan & elevation', 'Mehta Architects', 'upi', true, 'demo-admin'],
    ['2026-07-15', 7, 18000, 'ground', 'Excavation – JCB 2 days', 'Rathore JCB', 'cash', true, 'demo-u2'],
    ['2026-07-18', 1, 38500, 'ground', '110 bags OPC 53', 'Sharma Traders', 'upi', true, 'demo-u2', 110, 'bags'],
    ['2026-07-19', 2, 96000, 'ground', '1.6 ton TMT 12mm', 'Jain Steel', 'bank', true, 'demo-admin', 1600, 'kg'],
    ['2026-07-22', 3, 22000, 'ground', '2 trolleys river sand', 'Yadav Transport', 'cash', true, 'demo-u2'],
    ['2026-07-25', 5, 16500, 'ground', '20mm gitti – 1 dumper', 'Yadav Transport', 'cash', true, 'demo-u2'],
    ['2026-08-01', 7, 32000, 'ground', 'Foundation masonry – 8 days', 'Ramesh mistri', 'cash', true, 'demo-u3'],
    ['2026-08-12', 4, 27000, 'ground', '5000 bricks', 'Patel Bhatta', 'credit', false, 'demo-admin', 5000, 'nos'],
    ['2026-08-28', 1, 21000, 'ground', '60 bags PPC', 'Sharma Traders', 'upi', true, 'demo-u3', 60, 'bags'],
    ['2026-09-05', 7, 26000, 'ground', 'Plinth beam shuttering', 'Ramesh mistri', 'cash', true, 'demo-u2'],
    ['2026-09-18', 9, 8500, 'ground', 'Sleeves & sump pipes', 'Gupta Sanitary', 'upi', true, 'demo-u3'],
    ['2026-10-03', 2, 54000, 'ground', '0.9 ton TMT 10mm', 'Jain Steel', 'bank', false, 'demo-admin', 900, 'kg'],
    ['2026-10-14', 15, 3200, 'common', 'Tea, water & misc for site', '', 'cash', true, 'demo-u3'],
    ['2026-11-02', 7, 29000, 'ground', 'Column work – week 1', 'Ramesh mistri', 'cash', true, 'demo-u2'],
    ['2026-11-10', 1, 17500, 'ground', '50 bags OPC', 'Sharma Traders', 'upi', true, 'demo-admin', 50, 'bags']
  ]
  const expenses = sample.map(([d, ci, amt, floor, desc, vendor, pm, paid, by, qty, unit], i) => ({
    id: 'e' + i, category_id: 'c' + ci, amount: amt, expense_date: d, floor, description: desc, vendor: vendor || null, payment_mode: pm, is_paid: paid,
    due_date: paid ? null : '2026-11-30', quantity: qty ?? null, unit: unit ?? null, bill_url: null, created_by: by, created_at: d + 'T10:00:00Z', updated_at: d + 'T10:00:00Z'
  })).sort((a, b) => b.expense_date.localeCompare(a.expense_date))
  return { expenses, categories, budgets: [{ category_id: 'c1', amount: 250000 }, { category_id: 'c2', amount: 400000 }, { category_id: 'c7', amount: 600000 }], milestones,
    settings: { project_name: "Krishna's Mahal", total_budget: '4500000', start_date: '2026-06-05', plot_area: '1200' }, profiles: DEMO_USERS }
}
