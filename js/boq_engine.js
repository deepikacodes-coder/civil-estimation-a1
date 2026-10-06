/**
 * CIVIL ESTIMATION A1 - BOQ Engine (Bill of Quantities)
 * Handles itemization, real-time rate modifications, subtotal calculations, and exports.
 */

const BOQEngine = {
  items: [],
  contingencyPct: 3.0,
  taxPct: 18.0,

  // Default Standard Rates (Indian Standard CPWD / Market Rates 2026)
  defaultRateCard: {
    'cement': 380,          // ₹ per Bag
    'sand': 1600,           // ₹ per m3 (~₹45/cft)
    'aggregate': 1400,      // ₹ per m3 (~₹40/cft)
    'bricks': 9.5,          // ₹ per Brick
    'steel': 72,            // ₹ per kg
    'concrete': 6500,       // ₹ per m3 (M20 with placing & shuttering)
    'brickwork': 4800,      // ₹ per m3 (1:6 mortar)
    'plaster': 220,         // ₹ per m2 (12-15mm)
    'flooring': 850,        // ₹ per m2 (600x600 Vitrified)
    'door': 6500,           // ₹ per No (Frame + Flush shutter)
    'window': 4200,         // ₹ per No (Glazed UPVC/Aluminium)
    'painting': 180,        // ₹ per m2 (Primer + 2 coats emulsion)
    'excavation': 280       // ₹ per m3
  },

  init: function() {
    this.loadDefaultBOQ();
    this.render();
  },

  loadDefaultBOQ: function() {
    this.items = [
      { id: 1, desc: 'Earthwork excavation in foundation trenches and footings', unit: 'm³', qty: 25.0, rate: 280, remarks: 'Includes disposal up to 50m' },
      { id: 2, desc: 'Supplying and placing M20 Reinforced Cement Concrete (RCC)', unit: 'm³', qty: 22.5, rate: 6500, remarks: 'IS 456 compliant with formwork' },
      { id: 3, desc: 'Fe-500D High Yield Strength Deformed (TMT) Rebar Steel', unit: 'kg', qty: 2150, rate: 72, remarks: 'Bending, placing & binding wire' },
      { id: 4, desc: 'Brickwork in cement mortar 1:6 with modular burnt clay bricks', unit: 'm³', qty: 32.0, rate: 4800, remarks: 'Superstructure walls' },
      { id: 5, desc: 'Ordinary Portland Cement (OPC / PPC 53 Grade)', unit: 'Bag', qty: 340, rate: 380, remarks: 'ISI marked 50kg bags' },
      { id: 6, desc: 'Zone-II Clean River Sand / Manufactured Sand (M-Sand)', unit: 'm³', qty: 28.5, rate: 1600, remarks: 'Fine aggregate' },
      { id: 7, desc: '20mm Graded Machine-Crushed Blue Metal Aggregate', unit: 'm³', qty: 31.0, rate: 1400, remarks: 'Coarse aggregate' },
      { id: 8, desc: 'Cement Plaster 12mm thick in CM 1:4 on walls and ceiling', unit: 'm²', qty: 280.0, rate: 220, remarks: 'Smooth sponge finish' },
      { id: 9, desc: 'Vitrified Floor Tiles (600mm x 600mm) laid on CM 1:4 bed', unit: 'm²', qty: 72.0, rate: 850, remarks: 'Anti-skid & glossy tiles' },
      { id: 10, desc: 'Factory-made laminated flush door shutters with hardwood frame', unit: 'Nos', qty: 7, rate: 6500, remarks: 'Includes lockset & hinges' },
      { id: 11, desc: 'UPVC Sliding 2-track glazed window units with mosquito mesh', unit: 'Nos', qty: 6, rate: 4200, remarks: '5mm clear float glass' },
      { id: 12, desc: 'Interior & Exterior Premium Acrylic Emulsion Painting', unit: 'm²', qty: 280.0, rate: 180, remarks: '2 coats over wall primer & putty' }
    ];
  },

  importFromPlanTakeoff: function(takeoff) {
    const q = takeoff.quantities;
    this.items = [
      { id: 1, desc: 'Earthwork excavation in foundation trenches and footings', unit: 'm³', qty: parseFloat(q.excavationM3) || 20, rate: 280, remarks: 'As per plan foundation footprint' },
      { id: 2, desc: 'Supplying and placing M20 Reinforced Cement Concrete (RCC)', unit: 'm³', qty: parseFloat(q.concreteM3) || 18, rate: 6500, remarks: 'Slabs, beams, columns and footings' },
      { id: 3, desc: 'Fe-500D High Yield Strength Deformed (TMT) Rebar Steel', unit: 'kg', qty: parseFloat(q.steelKg) || 1800, rate: 72, remarks: 'IS 456 residential reinforcement' },
      { id: 4, desc: 'Ordinary Portland Cement (OPC / PPC 53 Grade)', unit: 'Bag', qty: parseFloat(q.cementBags) || 280, rate: 380, remarks: 'For concrete, brickwork & plaster' },
      { id: 5, desc: 'Fine Sand (Zone-II River Sand / M-Sand)', unit: 'm³', qty: parseFloat(q.sandM3) || 22, rate: 1600, remarks: `Total fine aggregate (${q.sandCft} cft)` },
      { id: 6, desc: 'Coarse Aggregate (20mm Crushed Granite)', unit: 'm³', qty: parseFloat(q.aggM3) || 25, rate: 1400, remarks: `Total coarse aggregate (${q.aggCft} cft)` },
      { id: 7, desc: 'Standard Modular Burnt Clay Bricks', unit: 'Nos', qty: parseFloat(q.bricksNos) || 12000, rate: 9.5, remarks: 'Superstructure walls 230mm & 115mm' },
      { id: 8, desc: 'Cement Plastering (12mm/15mm thick CM 1:4/1:6)', unit: 'm²', qty: parseFloat(q.plasterM2) || 240, rate: 220, remarks: 'Interior & exterior walls + ceilings' },
      { id: 9, desc: 'Vitrified Tile Flooring with 20mm mortar bedding', unit: 'm²', qty: parseFloat(q.flooringM2) || 68, rate: 850, remarks: 'Living, bedrooms, kitchen flooring' },
      { id: 10, desc: 'Doors with frames and hardware fittings', unit: 'Nos', qty: parseInt(q.doorsNos) || 6, rate: 6500, remarks: 'Detected door openings' },
      { id: 11, desc: 'Windows glazed with UPVC / Aluminum sections', unit: 'Nos', qty: parseInt(q.windowsNos) || 6, rate: 4200, remarks: 'Detected window openings' },
      { id: 12, desc: 'Interior & Exterior Premium Painting (2 coats + primer)', unit: 'm²', qty: parseFloat(q.paintingM2) || 240, rate: 180, remarks: 'Over wall putty' }
    ];
    this.render();
  },

  addItem: function(desc, unit, qty, rate, remarks = '') {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(i => i.id)) + 1 : 1;
    this.items.push({
      id: nextId,
      desc: desc || 'Custom Civil Item',
      unit: unit || 'Nos',
      qty: parseFloat(qty) || 1,
      rate: parseFloat(rate) || 0,
      remarks: remarks || ''
    });
    this.render();
  },

  removeItem: function(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.render();
  },

  updateItemRate: function(id, newRate) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.rate = parseFloat(newRate) || 0;
      this.renderTotalsOnly();
    }
  },

  updateItemQty: function(id, newQty) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.qty = parseFloat(newQty) || 0;
      this.renderTotalsOnly();
    }
  },

  getTotals: function() {
    let subtotal = 0;
    this.items.forEach(item => {
      subtotal += (item.qty * item.rate);
    });

    const contingencyAmount = subtotal * (this.contingencyPct / 100);
    const taxableAmount = subtotal + contingencyAmount;
    const taxAmount = taxableAmount * (this.taxPct / 100);
    const grandTotal = taxableAmount + taxAmount;

    return {
      subtotal: subtotal,
      contingencyPct: this.contingencyPct,
      contingencyAmount: contingencyAmount,
      taxPct: this.taxPct,
      taxAmount: taxAmount,
      grandTotal: grandTotal
    };
  },

  render: function() {
    const tableBody = document.getElementById('boqTableBody');
    if (!tableBody) return;

    if (this.items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No BOQ items yet. Generate from plan or add custom items.</td></tr>`;
      this.renderTotalsOnly();
      return;
    }

    tableBody.innerHTML = this.items.map((item, idx) => {
      const amount = item.qty * item.rate;
      return `
        <tr data-id="${item.id}">
          <td class="text-center font-mono font-bold">${idx + 1}</td>
          <td>
            <div class="font-semibold text-slate-800">${item.desc}</div>
            ${item.remarks ? `<div class="text-xs text-slate-500">${item.remarks}</div>` : ''}
          </td>
          <td class="text-center"><span class="badge badge-unit">${item.unit}</span></td>
          <td class="text-right">
            <input type="number" step="any" class="boq-inline-input text-right" value="${item.qty}" 
                   onchange="BOQEngine.updateItemQty(${item.id}, this.value)">
          </td>
          <td class="text-right">
            <div class="inline-flex items-center gap-1">
              <span class="text-xs text-slate-400">₹</span>
              <input type="number" step="any" class="boq-inline-input text-right font-mono" value="${item.rate}" 
                     onchange="BOQEngine.updateItemRate(${item.id}, this.value)">
            </div>
          </td>
          <td class="text-right font-mono font-bold text-slate-900" id="itemAmount_${item.id}">
            ₹ ${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </td>
          <td class="text-center">
            <button class="btn-icon text-red-500 hover:bg-red-50" onclick="BOQEngine.removeItem(${item.id})" title="Delete item">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');

    this.renderTotalsOnly();
  },

  renderTotalsOnly: function() {
    // Update individual amounts
    this.items.forEach(item => {
      const el = document.getElementById(`itemAmount_${item.id}`);
      if (el) {
        const amt = item.qty * item.rate;
        el.textContent = `₹ ${amt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      }
    });

    const totals = this.getTotals();
    const subtotalEl = document.getElementById('boqSubtotal');
    const contingencyEl = document.getElementById('boqContingency');
    const taxEl = document.getElementById('boqTax');
    const grandTotalEl = document.getElementById('boqGrandTotal');
    const grandTotalBanner = document.getElementById('boqGrandTotalBanner');

    if (subtotalEl) subtotalEl.textContent = `₹ ${totals.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (contingencyEl) contingencyEl.textContent = `₹ ${totals.contingencyAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${totals.contingencyPct}%)`;
    if (taxEl) taxEl.textContent = `₹ ${totals.taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${totals.taxPct}% GST)`;
    if (grandTotalEl) grandTotalEl.textContent = `₹ ${totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (grandTotalBanner) grandTotalBanner.textContent = `₹ ${totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  },

  exportToCSV: function() {
    if (this.items.length === 0) {
      App.showToast('No BOQ items to export.', 'warning');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Sl.No,Item Description,Unit,Quantity,Rate (INR),Amount (INR),Remarks\r\n';

    this.items.forEach((item, index) => {
      const cleanDesc = `"${item.desc.replace(/"/g, '""')}"`;
      const cleanRemarks = `"${(item.remarks || '').replace(/"/g, '""')}"`;
      const amount = (item.qty * item.rate).toFixed(2);
      csvContent += `${index + 1},${cleanDesc},${item.unit},${item.qty},${item.rate},${amount},${cleanRemarks}\r\n`;
    });

    const totals = this.getTotals();
    csvContent += `\r\n,,,Subtotal,,${totals.subtotal.toFixed(2)},\r\n`;
    csvContent += `,,,Contingencies (${totals.contingencyPct}%),,${totals.contingencyAmount.toFixed(2)},\r\n`;
    csvContent += `,,,GST / Taxes (${totals.taxPct}%),,${totals.taxAmount.toFixed(2)},\r\n`;
    csvContent += `,,,Grand Total Estimate,,${totals.grandTotal.toFixed(2)},\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Civil_Estimation_A1_BOQ_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    App.showToast('BOQ exported to CSV successfully!', 'success');
  }
};

window.BOQEngine = BOQEngine;
