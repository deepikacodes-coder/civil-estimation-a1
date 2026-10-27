/**
 * CIVIL ESTIMATION A1 - BOQ & Material Rate Engine
 * Unified estimate data store powering both the Material Rate + Total Cost Calculator
 * and the Bill of Quantities (BOQ) Generator with real-time bidirectional synchronization.
 */

const BOQEngine = {
  items: [],
  labourPct: 35.0,        // Standard civil labor cost is ~30-40% of material cost
  labourCost: 0,          // Calculated or manually entered
  isLabourManual: false,
  otherCost: 25000,       // Scaffolding, tools, site electricity, safety gear
  wastagePct: 3.0,        // Material transit & cutting wastage
  contingencyPct: 3.0,    // Unforeseen site contingencies
  taxPct: 18.0,           // Goods & Services Tax (GST)

  // Standard Baseline Material Rate Card (CPWD DSR / Indian Regional Standards 2026)
  defaultMaterials: [
    { key: 'cement', name: 'Cement (OPC / PPC 53 Grade)', desc: 'Ordinary Portland Cement / Pozzolana Cement in 50kg bags', unit: 'Bag', qty: 340, rate: 380, rateSource: 'CPWD DSR 2023-26', lastUpdated: '2026-10-15', remarks: 'Grade 53 ISI marked bags' },
    { key: 'sand', name: 'Fine Sand (River Sand / M-Sand)', desc: 'Clean Zone-II Fine Sand / Manufactured Sand (M-Sand)', unit: 'm³', qty: 28.5, rate: 1600, rateSource: 'Local Quarry Market', lastUpdated: '2026-10-18', remarks: 'Silt content < 3%' },
    { key: 'aggregate', name: 'Coarse Aggregate (20mm Metal)', desc: '20mm Graded Machine-Crushed Blue Granite Aggregate', unit: 'm³', qty: 31.0, rate: 1400, rateSource: 'Local Quarry Market', lastUpdated: '2026-10-18', remarks: 'Angular crushed granite' },
    { key: 'bricks', name: 'Bricks (Modular Clay / Fly Ash)', desc: 'Standard Modular Burnt Clay Bricks (Class 7.5)', unit: 'Nos', qty: 12500, rate: 10.0, rateSource: 'Brick Kiln Vendor Quote', lastUpdated: '2026-10-10', remarks: '190×90×90mm modular bricks' },
    { key: 'steel', name: 'Steel (Fe-500D TMT Rebar)', desc: 'High Yield Strength Deformed Thermo-Mechanically Treated Rebar', unit: 'kg', qty: 2150, rate: 72.0, rateSource: 'Steel Rolling Mill Wholesale', lastUpdated: '2026-10-20', remarks: 'Fe-500D primary producer' },
    { key: 'concrete', name: 'Concrete (Ready-Mix M20 / M25)', desc: 'Design Mix M20 Grade Concrete with placing & pump charge', unit: 'm³', qty: 22.5, rate: 6500, rateSource: 'CPWD DSR 2023-26', lastUpdated: '2026-10-12', remarks: 'Includes formwork & vibrator' },
    { key: 'flooring', name: 'Flooring (Vitrified Tiles 600×600)', desc: 'Premium Glazed Vitrified Tiles laid on 20mm CM 1:4 bed', unit: 'm²', qty: 72.0, rate: 850, rateSource: 'Ceramic Tiles Depot', lastUpdated: '2026-10-16', remarks: 'Anti-skid with epoxy grout' },
    { key: 'paint', name: 'Paint (Interior & Exterior Emulsion)', desc: 'Premium Acrylic Emulsion 2 coats over primer & wall putty', unit: 'm²', qty: 280.0, rate: 180, rateSource: 'Paint Supplier Retail', lastUpdated: '2026-10-14', remarks: 'Washable weather-proof' },
    { key: 'doors', name: 'Doors (Hardwood Frame + Flush Shutter)', desc: 'Factory-made 35mm laminated flush door shutters with frame', unit: 'Nos', qty: 7, rate: 6500, rateSource: 'Joinery Millwork Shop', lastUpdated: '2026-10-08', remarks: 'Includes brass mortise lock' },
    { key: 'windows', name: 'Windows (UPVC 2-Track Glazed Unit)', desc: '2-track sliding UPVC windows with 5mm toughened float glass', unit: 'Nos', qty: 6, rate: 4200, rateSource: 'Fenestration Vendor Quote', lastUpdated: '2026-10-08', remarks: 'Includes stainless mosquito mesh' },
    { key: 'excavation', name: 'Excavation & Foundation Earthwork', desc: 'Earthwork excavation in foundation trenches and footings', unit: 'm³', qty: 25.0, rate: 280, rateSource: 'CPWD Earthwork Norms', lastUpdated: '2026-10-15', remarks: 'Ordinary soil with 50m disposal' }
  ],

  init: function() {
    this.loadDefaultBOQ();
    this.render();
  },

  loadDefaultBOQ: function() {
    this.items = this.defaultMaterials.map((m, idx) => ({
      id: idx + 1,
      key: m.key,
      name: m.name,
      desc: m.desc,
      unit: m.unit,
      qty: m.qty,
      rate: m.rate,
      rateSource: m.rateSource,
      lastUpdated: m.lastUpdated,
      remarks: m.remarks,
      isCustom: false
    }));
  },

  importFromPlanTakeoff: function(takeoff) {
    if (!takeoff || !takeoff.quantities) return;
    const q = takeoff.quantities;

    // Map plan takeoff quantities while preserving current rates & custom items
    const customItems = this.items.filter(i => i.isCustom);

    const updatedStandard = [
      { key: 'cement', name: 'Cement (OPC / PPC 53 Grade)', desc: 'Ordinary Portland Cement (OPC / PPC 53 Grade)', unit: 'Bag', qty: parseFloat(q.cementBags) || 280, defaultRate: 380, remarks: 'For concrete, masonry & plaster' },
      { key: 'sand', name: 'Fine Sand (River Sand / M-Sand)', desc: 'Clean Zone-II Fine Sand / Manufactured Sand (M-Sand)', unit: 'm³', qty: parseFloat(q.sandM3) || 22.0, defaultRate: 1600, remarks: `Fine aggregate (${q.sandCft || ''} cft)` },
      { key: 'aggregate', name: 'Coarse Aggregate (20mm Metal)', desc: '20mm Graded Machine-Crushed Blue Granite Aggregate', unit: 'm³', qty: parseFloat(q.aggM3) || 25.0, defaultRate: 1400, remarks: `Coarse aggregate (${q.aggCft || ''} cft)` },
      { key: 'bricks', name: 'Bricks (Modular Clay / Fly Ash)', desc: 'Standard Modular Burnt Clay Bricks', unit: 'Nos', qty: parseFloat(q.bricksNos) || 12000, defaultRate: 10.0, remarks: 'Superstructure walls 230mm & 115mm' },
      { key: 'steel', name: 'Steel (Fe-500D TMT Rebar)', desc: 'Fe-500D High Yield Strength Deformed TMT Rebar', unit: 'kg', qty: parseFloat(q.steelKg) || 1800, defaultRate: 72.0, remarks: 'IS 456 residential reinforcement' },
      { key: 'concrete', name: 'Concrete (Ready-Mix M20 / M25)', desc: 'Supplying and placing M20 Reinforced Cement Concrete', unit: 'm³', qty: parseFloat(q.concreteM3) || 18.0, defaultRate: 6500, remarks: 'Slabs, beams, columns, and footings' },
      { key: 'flooring', name: 'Flooring (Vitrified Tiles 600×600)', desc: 'Vitrified Tile Flooring with 20mm mortar bedding', unit: 'm²', qty: parseFloat(q.flooringM2) || 68.0, defaultRate: 850, remarks: 'Living, bedrooms, and kitchen' },
      { key: 'paint', name: 'Paint (Interior & Exterior Emulsion)', desc: 'Interior & Exterior Premium Acrylic Emulsion (2 coats)', unit: 'm²', qty: parseFloat(q.paintingM2) || 240.0, defaultRate: 180, remarks: 'Over wall putty & primer' },
      { key: 'doors', name: 'Doors (Hardwood Frame + Flush Shutter)', desc: 'Doors with hardwood frames and hardware fittings', unit: 'Nos', qty: parseInt(q.doorsNos) || 6, defaultRate: 6500, remarks: 'Detected door openings' },
      { key: 'windows', name: 'Windows (UPVC 2-Track Glazed Unit)', desc: 'Windows glazed with UPVC / Aluminum sections', unit: 'Nos', qty: parseInt(q.windowsNos) || 6, defaultRate: 4200, remarks: 'Detected window openings' },
      { key: 'excavation', name: 'Excavation & Foundation Earthwork', desc: 'Earthwork excavation in foundation trenches and footings', unit: 'm³', qty: parseFloat(q.excavationM3) || 20.0, defaultRate: 280, remarks: 'As per plan foundation footprint' }
    ];

    let nextId = 1;
    this.items = updatedStandard.map(std => {
      const existing = this.items.find(i => i.key === std.key);
      return {
        id: nextId++,
        key: std.key,
        name: std.name,
        desc: std.desc,
        unit: std.unit,
        qty: std.qty,
        rate: existing && existing.rate !== undefined && existing.rate !== null ? existing.rate : std.defaultRate,
        rateSource: existing ? existing.rateSource : 'CPWD DSR 2023-26',
        lastUpdated: existing ? existing.lastUpdated : new Date().toISOString().split('T')[0],
        remarks: std.remarks,
        isCustom: false
      };
    });

    // Re-append custom items
    customItems.forEach(c => {
      c.id = nextId++;
      this.items.push(c);
    });

    this.render();
  },

  // ITEM VALIDATION & AMOUNT CALCULATION
  // Rule: If quantity or rate is missing/empty/NaN, show "Pending" instead of zero cost!
  // Rule: Do not treat blank rates as zero-cost materials.
  getItemStatus: function(item) {
    const rawQty = item.qty;
    const rawRate = item.rate;

    // Check if empty or null or undefined
    if (rawQty === '' || rawQty === null || rawQty === undefined || isNaN(Number(rawQty))) {
      return { status: 'pending', amount: null, reason: 'Quantity pending' };
    }
    if (rawRate === '' || rawRate === null || rawRate === undefined || isNaN(Number(rawRate))) {
      return { status: 'pending', amount: null, reason: 'Rate pending' };
    }

    const qty = parseFloat(rawQty);
    const rate = parseFloat(rawRate);

    if (qty < 0 || rate < 0) {
      return { status: 'invalid', amount: null, reason: 'Value cannot be negative' };
    }

    return {
      status: 'confirmed',
      amount: qty * rate,
      qty: qty,
      rate: rate
    };
  },

  addItem: function(desc, unit, qty, rate, remarks = '', rateSource = 'Local Vendor Quote') {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(i => i.id)) + 1 : 1;
    const parsedQty = qty === '' || qty === null || qty === undefined ? '' : parseFloat(qty);
    const parsedRate = rate === '' || rate === null || rate === undefined ? '' : parseFloat(rate);

    this.items.push({
      id: nextId,
      key: `custom_${nextId}`,
      name: desc || 'Custom Civil Item',
      desc: desc || 'Custom Civil Item',
      unit: unit || 'Nos',
      qty: parsedQty,
      rate: parsedRate,
      rateSource: rateSource || 'Manual Entry',
      lastUpdated: new Date().toISOString().split('T')[0],
      remarks: remarks || '',
      isCustom: true
    });

    this.render();
  },

  removeItem: function(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.render();
  },

  updateItemQty: function(id, newQty) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.qty = (newQty === '' || newQty === null || newQty === undefined) ? '' : parseFloat(newQty);
      this.render();
    }
  },

  updateItemRate: function(id, newRate) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.rate = (newRate === '' || newRate === null || newRate === undefined) ? '' : parseFloat(newRate);
      item.lastUpdated = new Date().toISOString().split('T')[0];
      this.render();
    }
  },

  updateItemDesc: function(id, newDesc) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.desc = newDesc;
      item.name = newDesc;
      this.render();
    }
  },

  updateItemUnit: function(id, newUnit) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.unit = newUnit;
      this.render();
    }
  },

  updateItemRemarks: function(id, newRemarks) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.remarks = newRemarks;
      this.render();
    }
  },

  updateItemRateSource: function(id, newSource) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.rateSource = newSource;
      this.render();
    }
  },

  // COST SUMMARY CALCULATIONS (Phase 10)
  getTotals: function() {
    let materialCost = 0;
    let pendingCount = 0;
    let invalidCount = 0;

    this.items.forEach(item => {
      const calc = this.getItemStatus(item);
      if (calc.status === 'confirmed') {
        materialCost += calc.amount;
      } else if (calc.status === 'pending') {
        pendingCount++;
      } else if (calc.status === 'invalid') {
        invalidCount++;
      }
    });

    // Labour cost calculation
    let labourAmount = 0;
    if (this.isLabourManual) {
      labourAmount = Math.max(0, parseFloat(this.labourCost) || 0);
    } else {
      labourAmount = materialCost * (this.labourPct / 100);
    }

    const otherAmount = Math.max(0, parseFloat(this.otherCost) || 0);
    const wastageAmount = materialCost * (Math.max(0, parseFloat(this.wastagePct) || 0) / 100);

    const baseCost = materialCost + labourAmount + otherAmount + wastageAmount;
    const contingencyAmount = baseCost * (Math.max(0, parseFloat(this.contingencyPct) || 0) / 100);
    const taxableCost = baseCost + contingencyAmount;
    const taxAmount = taxableCost * (Math.max(0, parseFloat(this.taxPct) || 0) / 100);
    const grandTotal = taxableCost + taxAmount;

    return {
      materialCost: materialCost,
      labourPct: this.labourPct,
      labourAmount: labourAmount,
      isLabourManual: this.isLabourManual,
      otherCost: otherAmount,
      wastagePct: this.wastagePct,
      wastageAmount: wastageAmount,
      baseCost: baseCost,
      contingencyPct: this.contingencyPct,
      contingencyAmount: contingencyAmount,
      taxPct: this.taxPct,
      taxAmount: taxAmount,
      grandTotal: grandTotal,
      pendingCount: pendingCount,
      invalidCount: invalidCount,
      isComplete: pendingCount === 0 && invalidCount === 0
    };
  },

  // RENDER BOTH VIEWS (BOQ & Material Rate Calculator)
  render: function() {
    this.renderBOQView();
    this.renderMaterialRateView();
    this.renderCostSummaryWidgets();
  },

  renderBOQView: function() {
    const tableBody = document.getElementById('boqTableBody');
    if (!tableBody) return;

    if (this.items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No BOQ items. Load a sample plan or add custom items.</td></tr>`;
      return;
    }

    tableBody.innerHTML = this.items.map((item, idx) => {
      const calc = this.getItemStatus(item);
      const isPending = calc.status === 'pending';
      const isInvalid = calc.status === 'invalid';

      let amountHtml = '';
      if (isPending) {
        amountHtml = `<span class="badge badge-pending" title="${calc.reason}">⏳ Pending</span>`;
      } else if (isInvalid) {
        amountHtml = `<span class="badge badge-danger" title="${calc.reason}">⚠️ Invalid</span>`;
      } else {
        amountHtml = `₹ ${calc.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      }

      const qtyDisplay = (item.qty === '' || item.qty === null || item.qty === undefined) ? '' : item.qty;
      const rateDisplay = (item.rate === '' || item.rate === null || item.rate === undefined) ? '' : item.rate;

      return `
        <tr data-id="${item.id}" class="${isPending ? 'row-pending' : ''} ${isInvalid ? 'row-invalid' : ''}">
          <td class="text-center font-mono font-bold">${idx + 1}</td>
          <td>
            <div class="font-semibold text-slate-800">${item.desc}</div>
            ${item.remarks ? `<div class="text-xs text-slate-500">${item.remarks}</div>` : ''}
          </td>
          <td class="text-center"><span class="badge badge-unit">${item.unit}</span></td>
          <td class="text-right">
            <input type="number" step="any" min="0" 
                   class="boq-inline-input text-right ${isInvalid && item.qty < 0 ? 'border-red-500' : ''}" 
                   placeholder="Qty"
                   value="${qtyDisplay}" 
                   oninput="BOQEngine.updateItemQty(${item.id}, this.value)"
                   onchange="BOQEngine.updateItemQty(${item.id}, this.value)">
          </td>
          <td class="text-right">
            <div class="inline-flex items-center gap-1">
              <span class="text-xs text-slate-400">₹</span>
              <input type="number" step="any" min="0" 
                     class="boq-inline-input text-right font-mono ${isInvalid && item.rate < 0 ? 'border-red-500' : ''}" 
                     placeholder="Rate"
                     value="${rateDisplay}" 
                     oninput="BOQEngine.updateItemRate(${item.id}, this.value)"
                     onchange="BOQEngine.updateItemRate(${item.id}, this.value)">
            </div>
          </td>
          <td class="text-right font-mono font-bold text-slate-900" id="boq_itemAmount_${item.id}">
            ${amountHtml}
          </td>
          <td class="text-center">
            <button class="btn-icon text-red-500 hover:bg-red-50" onclick="BOQEngine.removeItem(${item.id})" title="Delete item">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderMaterialRateView: function() {
    const tableBody = document.getElementById('materialRateTableBody');
    if (!tableBody) return;

    if (this.items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No material rate items configured.</td></tr>`;
      return;
    }

    tableBody.innerHTML = this.items.map((item, idx) => {
      const calc = this.getItemStatus(item);
      const isPending = calc.status === 'pending';
      const isInvalid = calc.status === 'invalid';

      let amountHtml = '';
      if (isPending) {
        amountHtml = `<span class="badge badge-pending">⏳ Pending</span>`;
      } else if (isInvalid) {
        amountHtml = `<span class="badge badge-danger">⚠️ Invalid</span>`;
      } else {
        amountHtml = `₹ ${calc.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      }

      const qtyDisplay = (item.qty === '' || item.qty === null || item.qty === undefined) ? '' : item.qty;
      const rateDisplay = (item.rate === '' || item.rate === null || item.rate === undefined) ? '' : item.rate;

      return `
        <tr data-id="${item.id}" class="${isPending ? 'row-pending' : ''} ${isInvalid ? 'row-invalid' : ''}">
          <td class="text-center font-mono font-bold">${idx + 1}</td>
          <td>
            <input type="text" class="rate-inline-text" value="${item.name}" 
                   onchange="BOQEngine.updateItemDesc(${item.id}, this.value)">
            <div class="text-xs text-slate-400 mt-0.5">Source: ${item.rateSource || 'Standard'} • Updated: ${item.lastUpdated || 'Recent'}</div>
          </td>
          <td class="text-center">
            <select class="rate-inline-select" onchange="BOQEngine.updateItemUnit(${item.id}, this.value)">
              <option value="Bags" ${item.unit === 'Bag' || item.unit === 'Bags' ? 'selected' : ''}>Bags</option>
              <option value="m³" ${item.unit === 'm³' ? 'selected' : ''}>m³</option>
              <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
              <option value="Nos" ${item.unit === 'Nos' ? 'selected' : ''}>Nos</option>
              <option value="m²" ${item.unit === 'm²' ? 'selected' : ''}>m²</option>
              <option value="sq.ft" ${item.unit === 'sq.ft' ? 'selected' : ''}>sq.ft</option>
            </select>
          </td>
          <td class="text-right">
            <input type="number" step="any" min="0" class="rate-inline-input text-right" 
                   placeholder="Qty" value="${qtyDisplay}"
                   oninput="BOQEngine.updateItemQty(${item.id}, this.value)">
          </td>
          <td class="text-right">
            <div class="inline-flex items-center gap-1">
              <span class="text-xs text-slate-400">₹</span>
              <input type="number" step="any" min="0" class="rate-inline-input text-right font-mono" 
                     placeholder="Rate" value="${rateDisplay}"
                     oninput="BOQEngine.updateItemRate(${item.id}, this.value)">
            </div>
          </td>
          <td class="text-right font-mono font-bold text-slate-900">
            ${amountHtml}
          </td>
          <td class="text-center">
            <button class="btn-icon text-red-500 hover:bg-red-50" onclick="BOQEngine.removeItem(${item.id})" title="Delete item">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderCostSummaryWidgets: function() {
    const totals = this.getTotals();

    // 1. BOQ Banner & Totals
    const boqGrandBanner = document.getElementById('boqGrandTotalBanner');
    const boqSubtotal = document.getElementById('boqSubtotal');
    const boqContingency = document.getElementById('boqContingency');
    const boqTax = document.getElementById('boqTax');
    const boqGrand = document.getElementById('boqGrandTotal');

    const totalText = totals.pendingCount > 0 
      ? `₹ ${totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (Pending ${totals.pendingCount} rates)` 
      : `₹ ${totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    if (boqGrandBanner) boqGrandBanner.textContent = totalText;
    if (boqSubtotal) boqSubtotal.textContent = `₹ ${totals.baseCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (boqContingency) boqContingency.textContent = `₹ ${totals.contingencyAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${totals.contingencyPct}%)`;
    if (boqTax) boqTax.textContent = `₹ ${totals.taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${totals.taxPct}% GST)`;
    if (boqGrand) boqGrand.textContent = totalText;

    // 2. Material Rate Tab Totals
    const matTotalEl = document.getElementById('rateGrandTotal');
    const matSubtotalEl = document.getElementById('rateMaterialSubtotal');
    const matLabourEl = document.getElementById('rateLabourAmount');
    const matOtherEl = document.getElementById('rateOtherAmount');
    const matPendingBadge = document.getElementById('ratePendingNotice');

    if (matTotalEl) matTotalEl.textContent = `₹ ${totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (matSubtotalEl) matSubtotalEl.textContent = `₹ ${totals.materialCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (matLabourEl) matLabourEl.textContent = `₹ ${totals.labourAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${totals.labourPct}%)`;
    if (matOtherEl) matOtherEl.textContent = `₹ ${totals.otherCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    if (matPendingBadge) {
      if (totals.pendingCount > 0) {
        matPendingBadge.innerHTML = `<span class="badge badge-warning">⚠️ ${totals.pendingCount} material item(s) have unconfirmed or blank rates</span>`;
        matPendingBadge.classList.remove('hidden');
      } else {
        matPendingBadge.classList.add('hidden');
      }
    }
  },

  exportToCSV: function() {
    if (this.items.length === 0) {
      if (typeof App !== 'undefined') App.showToast('No BOQ items to export.', 'warning');
      return;
    }

    let csvContent = 'Sl.No,Description,Unit,Quantity,Rate (INR),Amount (INR),Rate Source,Remarks\r\n';

    this.items.forEach((item, index) => {
      const calc = this.getItemStatus(item);
      const cleanDesc = `"${(item.desc || item.name || '').replace(/"/g, '""')}"`;
      const cleanRemarks = `"${(item.remarks || '').replace(/"/g, '""')}"`;
      const cleanSource = `"${(item.rateSource || '').replace(/"/g, '""')}"`;
      const qtyStr = item.qty !== '' ? item.qty : 'Pending';
      const rateStr = item.rate !== '' ? item.rate : 'Pending';
      const amountStr = calc.status === 'confirmed' ? calc.amount.toFixed(2) : 'Pending';

      csvContent += `${index + 1},${cleanDesc},${item.unit},${qtyStr},${rateStr},${amountStr},${cleanSource},${cleanRemarks}\r\n`;
    });

    const totals = this.getTotals();
    csvContent += `\r\n,,,Materials Subtotal,,${totals.materialCost.toFixed(2)},\r\n`;
    csvContent += `,,,Labour Cost (${totals.labourPct}%),,${totals.labourAmount.toFixed(2)},\r\n`;
    csvContent += `,,,Site & Equipment Costs,,${totals.otherCost.toFixed(2)},\r\n`;
    csvContent += `,,,Wastage Allowance (${totals.wastagePct}%),,${totals.wastageAmount.toFixed(2)},\r\n`;
    csvContent += `,,,Contingencies (${totals.contingencyPct}%),,${totals.contingencyAmount.toFixed(2)},\r\n`;
    csvContent += `,,,GST / Taxes (${totals.taxPct}%),,${totals.taxAmount.toFixed(2)},\r\n`;
    csvContent += `,,,Grand Total Estimate,,${totals.grandTotal.toFixed(2)},\r\n`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Civil_Estimation_A1_BOQ_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    if (typeof App !== 'undefined') App.showToast('BOQ exported to CSV successfully!', 'success');
  }
};

if (typeof window !== 'undefined') {
  window.BOQEngine = BOQEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BOQEngine;
}
