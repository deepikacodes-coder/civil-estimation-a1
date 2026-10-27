/**
 * CIVIL ESTIMATION A1 - Estimate Report / PDF Generator Engine
 * Generates an engineering-grade report and triggers formatted browser PDF printing.
 * Includes complete itemized rates, sources, room summary, cost breakdown, and mandatory disclaimer.
 */

const ReportGenerator = {
  projectDetails: {
    projectName: 'Residential G+1 Construction Project',
    clientName: 'Er. S. Kumar & Associates',
    location: 'Plot No. 42, Green Avenue, Phase-II',
    buildingType: 'Residential G+1 RCC Frame',
    engineerName: 'Final Year Civil Engineering Team',
    date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    refNumber: 'CE-A1-' + Math.floor(100000 + Math.random() * 900000)
  },

  updateProjectDetails: function(name, client, loc, engineer, bType) {
    if (name) this.projectDetails.projectName = name;
    if (client) this.projectDetails.clientName = client;
    if (loc) this.projectDetails.location = loc;
    if (engineer) this.projectDetails.engineerName = engineer;
    if (bType) this.projectDetails.buildingType = bType;
    this.render();
  },

  generateReport: function() {
    this.render();
    if (typeof App !== 'undefined') {
      App.switchTab('report');
      App.showToast('Estimate Report generated successfully!', 'success');
    }
  },

  render: function() {
    const reportContainer = document.getElementById('reportViewContent');
    if (!reportContainer) return;

    if (!PlanAnalyzer.currentTakeoff) {
      PlanAnalyzer.generateTakeoff();
    }

    const plan = PlanAnalyzer.activePlan || SamplePlans.plans[0];
    const takeoff = PlanAnalyzer.currentTakeoff;
    const totals = BOQEngine.getTotals();
    const boqItems = BOQEngine.items;
    const rooms = (plan.rooms && plan.rooms.length > 0) ? plan.rooms : [];

    reportContainer.innerHTML = `
      <div class="report-paper">
        <!-- Report Header -->
        <div class="report-header">
          <div class="report-brand">
            <div class="brand-badge">CIVIL ESTIMATION A1</div>
            <h1 class="report-title">PRELIMINARY CONSTRUCTION ESTIMATE & BOQ REPORT</h1>
            <p class="report-subtitle">Computer-Aided 2D Building Plan Takeoff & Bill of Quantities (IS 456 / IS 1200 / CPWD)</p>
          </div>
          <div class="report-meta text-right">
            <div><strong>Ref:</strong> <span class="font-mono">${this.projectDetails.refNumber}</span></div>
            <div><strong>Date:</strong> ${this.projectDetails.date}</div>
            <div><strong>Status:</strong> <span class="text-green-600 font-semibold">Provisional Estimate</span></div>
          </div>
        </div>

        <hr class="report-divider" />

        <!-- Project & Site Info Grid -->
        <div class="report-grid-2">
          <div class="report-info-box">
            <h4 class="info-title">📋 Project Specifications</h4>
            <table class="report-mini-table">
              <tr><td><strong>Project Title:</strong></td><td>${this.projectDetails.projectName}</td></tr>
              <tr><td><strong>Client / Owner:</strong></td><td>${this.projectDetails.clientName}</td></tr>
              <tr><td><strong>Site Location:</strong></td><td>${this.projectDetails.location}</td></tr>
              <tr><td><strong>Building Type:</strong></td><td>${this.projectDetails.buildingType}</td></tr>
              <tr><td><strong>Prepared By:</strong></td><td>${this.projectDetails.engineerName}</td></tr>
            </table>
          </div>
          <div class="report-info-box">
            <h4 class="info-title">📐 Drawing & Plan Parameters</h4>
            <table class="report-mini-table">
              <tr><td><strong>Plan Reference:</strong></td><td>${plan.name}</td></tr>
              <tr><td><strong>File Source:</strong></td><td>${PlanAnalyzer.uploadedFile ? PlanAnalyzer.uploadedFile.name : 'Architectural CAD Blueprint'}</td></tr>
              <tr><td><strong>Built-up Area:</strong></td><td><strong>${takeoff.builtUpSqFt} sq.ft</strong> (${takeoff.builtUpSqM} m²)</td></tr>
              <tr><td><strong>Number of Floors:</strong></td><td>${takeoff.floors} Floor(s)</td></tr>
              <tr><td><strong>Floor Height:</strong></td><td>${plan.floorHeightM || 3.0} m</td></tr>
            </table>
          </div>
        </div>

        <!-- Room Summary Table -->
        ${rooms.length > 0 ? `
          <div class="report-section-title">1. Room Dimensions & Architectural Layout</div>
          <table class="report-boq-table mb-3">
            <thead>
              <tr>
                <th style="width: 45px;">Sl.</th>
                <th>Room Designation</th>
                <th style="width: 90px;" class="text-right">Length (m)</th>
                <th style="width: 90px;" class="text-right">Width (m)</th>
                <th style="width: 100px;" class="text-right">Area (m²)</th>
                <th style="width: 75px;" class="text-center">Doors</th>
                <th style="width: 75px;" class="text-center">Windows</th>
              </tr>
            </thead>
            <tbody>
              ${rooms.map((r, i) => `
                <tr>
                  <td class="text-center font-mono">${i + 1}</td>
                  <td><strong>${r.name}</strong></td>
                  <td class="text-right font-mono">${r.length.toFixed(2)}</td>
                  <td class="text-right font-mono">${r.width.toFixed(2)}</td>
                  <td class="text-right font-mono font-bold">${(r.length * r.width).toFixed(2)}</td>
                  <td class="text-center">${r.doors || 1}</td>
                  <td class="text-center">${r.windows || 1}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- Material Takeoff Summary Cards -->
        <div class="report-section-title">2. Structural & Material Quantity Takeoff (IS 1200)</div>
        <div class="report-kpi-grid">
          <div class="kpi-card">
            <div class="kpi-val">${takeoff.quantities.cementBags}</div>
            <div class="kpi-lbl">Cement Bags (50kg)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${takeoff.quantities.sandM3} m³</div>
            <div class="kpi-lbl">Fine Sand (${takeoff.quantities.sandCft} cft)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${takeoff.quantities.aggM3} m³</div>
            <div class="kpi-lbl">Coarse Aggregate (${takeoff.quantities.aggCft} cft)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${takeoff.quantities.bricksNos.toLocaleString()}</div>
            <div class="kpi-lbl">Modular Bricks</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${takeoff.quantities.steelKg.toLocaleString()} kg</div>
            <div class="kpi-lbl">TMT Steel (${takeoff.quantities.steelMT} MT)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${takeoff.quantities.concreteM3} m³</div>
            <div class="kpi-lbl">M20 Concrete Volume</div>
          </div>
        </div>

        <!-- BOQ Table Section -->
        <div class="report-section-title">3. Itemized Bill of Quantities (BOQ) with Rates & Sources</div>
        <table class="report-boq-table">
          <thead>
            <tr>
              <th style="width: 45px;">Sl.</th>
              <th>Description of Item</th>
              <th style="width: 60px;" class="text-center">Unit</th>
              <th style="width: 75px;" class="text-right">Qty</th>
              <th style="width: 90px;" class="text-right">Rate (₹)</th>
              <th style="width: 120px;" class="text-right">Amount (₹)</th>
              <th style="width: 120px;">Rate Source</th>
            </tr>
          </thead>
          <tbody>
            ${boqItems.map((item, idx) => {
              const calc = BOQEngine.getItemStatus(item);
              const amtStr = calc.status === 'confirmed' 
                ? `₹ ${calc.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` 
                : '<span class="text-amber-600 font-semibold">Pending</span>';

              return `
                <tr>
                  <td class="text-center font-mono">${idx + 1}</td>
                  <td>
                    <div><strong>${item.name || item.desc}</strong></div>
                    ${item.remarks ? `<small class="text-slate-500">${item.remarks}</small>` : ''}
                  </td>
                  <td class="text-center">${item.unit}</td>
                  <td class="text-right font-mono">${item.qty !== '' ? item.qty : '—'}</td>
                  <td class="text-right font-mono">${item.rate !== '' ? `₹ ${item.rate}` : '—'}</td>
                  <td class="text-right font-mono font-semibold">${amtStr}</td>
                  <td><small class="text-slate-500">${item.rateSource || 'CPWD DSR'}</small></td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="table-total-row">
              <td colspan="5" class="text-right"><strong>Total Material Cost:</strong></td>
              <td colspan="2" class="text-right font-mono font-bold">₹ ${totals.materialCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td colspan="5" class="text-right">Labour & Execution Cost (${totals.labourPct}%):</td>
              <td colspan="2" class="text-right font-mono">₹ ${totals.labourAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td colspan="5" class="text-right">Site Facilities, Scaffolding & Tools:</td>
              <td colspan="2" class="text-right font-mono">₹ ${totals.otherCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td colspan="5" class="text-right">Material Wastage Allowance (${totals.wastagePct}%):</td>
              <td colspan="2" class="text-right font-mono">₹ ${totals.wastageAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td colspan="5" class="text-right">Contingencies & Unforeseen Overheads (${totals.contingencyPct}%):</td>
              <td colspan="2" class="text-right font-mono">₹ ${totals.contingencyAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td colspan="5" class="text-right">Goods & Services Tax / GST (${totals.taxPct}%):</td>
              <td colspan="2" class="text-right font-mono">₹ ${totals.taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr class="table-grand-row">
              <td colspan="5" class="text-right"><strong>PRELIMINARY ESTIMATED GRAND TOTAL:</strong></td>
              <td colspan="2" class="text-right font-mono font-bold text-lg text-primary">₹ ${totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Cost Breakdown Visual -->
        <div class="report-section-title">4. Cost Distribution</div>
        <div class="cost-breakdown-bar">
          <div class="cost-seg seg-structure" style="width: 52%;" title="Civil Structure: 52%">Civil Structure (52%)</div>
          <div class="cost-seg seg-finishes" style="width: 22%;" title="Finishes: 22%">Finishes (22%)</div>
          <div class="cost-seg seg-mep" style="width: 16%;" title="MEP: 16%">MEP (16%)</div>
          <div class="cost-seg seg-fixtures" style="width: 10%;" title="Openings: 10%">Openings (10%)</div>
        </div>

        <!-- Engineering Assumptions & Standards -->
        <div class="report-section-title">5. Engineering Standards & Notes</div>
        <ul class="report-notes-list">
          <li>Concrete quantities are derived as per <strong>IS 456:2000</strong> using nominal M20 mix proportion (1:1.5:3) with 54% dry volume expansion factor.</li>
          <li>Reinforcement steel is approximated at 95-100 kg/m³ of RCC member volume in accordance with standard residential structural thumb rules.</li>
          <li>Brickwork calculated using standard modular burnt-clay bricks with 1:6 cement mortar as per <strong>IS 2212</strong>.</li>
          <li>Plastering computed for internal (12mm) and external (15mm) surfaces with opening deductions as per <strong>IS 1200 (Part 12)</strong>.</li>
          <li>Rates are based on standard Schedule of Rates (SOR) and local market conditions. Actual market fluctuations apply by supplier, location, and procurement date.</li>
        </ul>

        <!-- Mandatory Engineering Verification Disclaimer (Phase 14 verbatim) -->
        <div class="report-disclaimer-box">
          <div class="disclaimer-title">⚠️ Mandatory Engineering Verification Disclaimer</div>
          <p>AI-assisted quantities and costs are preliminary estimates. All dimensions, material quantities, structural details, rates and totals must be verified against project-specific drawings, specifications, applicable standards and current local rates before actual construction or contractual use.</p>
        </div>

        <!-- Verification Sign-off -->
        <div class="report-sign-grid">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div>Prepared By: Student / Assistant Engineer</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div>Checked By: Quantity Surveyor</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div>Approved By: Chartered Civil Engineer</div>
          </div>
        </div>
      </div>
    `;
  },

  printPDF: function() {
    this.render();
    if (typeof App !== 'undefined') {
      App.showToast('Opening print dialog. Select "Save as PDF" to download.', 'info');
    }
    setTimeout(() => {
      window.print();
    }, 200);
  }
};

if (typeof window !== 'undefined') {
  window.ReportGenerator = ReportGenerator;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReportGenerator;
}
