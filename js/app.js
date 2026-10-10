/**
 * CIVIL ESTIMATION A1 - Main Application Controller
 * Handles Navigation, Search, Filter Chips, Calculator Modals, and UI Interactivity.
 */

const App = {
  activeTab: 'home',
  activeCategory: 'all',
  searchQuery: '',

  toolsList: [
    { id: 'calc_cost', title: 'Construction Cost Calculator', icon: '🧮', category: 'utilities', desc: 'Total cost by built-up area, quality class and component breakdown' },
    { id: 'calc_brick', title: 'Brick Work & Plaster', icon: '🧱', category: 'masonry', desc: 'Modular/traditional bricks, mortar cement bags and plaster areas' },
    { id: 'calc_concrete', title: 'Concrete Calculator', icon: '🏗️', category: 'structure', desc: 'M7.5 to M25 grade mix design, cement bags, sand & aggregate volumes' },
    { id: 'calc_steel', title: 'Steel Quantity & Rebar', icon: '🔩', category: 'structure', desc: 'RCC structural percentage rules & D²/162 rebar weight schedules' },
    { id: 'calc_batch', title: 'Cement / Sand / Aggregate', icon: '🪣', category: 'materials', desc: 'Custom batch ratios and volumetric material breakdowns' },
    { id: 'calc_flooring', title: 'Flooring Calculator', icon: '🪵', category: 'masonry', desc: 'Vitrified/ceramic tile count, wastage factors and bedding mortar' },
    { id: 'calc_painting', title: 'Painting & Surface Finishes', icon: '🎨', category: 'masonry', desc: 'Primer, interior/exterior emulsions, wall putty and coat coverage' },
    { id: 'calc_excavation', title: 'Excavation & Earthwork', icon: '⛏️', category: 'structure', desc: 'Foundation pit volumes, soil bulking factors and truck tipper loads' },
    { id: 'calc_openings', title: 'Door & Window Openings', icon: '🪟', category: 'openings', desc: 'Opening deductions, frame timber volume, and shutter hardware' },
    { id: 'calc_roof', title: 'Roof Area & Pitch', icon: '🏠', category: 'openings', desc: 'Flat vs pitched roof true surface area, pitch slope, and sheet counts' },
    { id: 'calc_geometry', title: 'Area & Volume Geometry', icon: '📐', category: 'utilities', desc: 'Trapezoidal footings, circular columns, and complex geometric shapes' },
    { id: 'calc_unit', title: 'Civil Unit Converter', icon: '🔄', category: 'utilities', desc: 'Feet, meters, brass, cft, metric tons, cents, and gunthas' }
  ],

  init: function() {
    this.bindNavigation();
    this.bindSearchAndFilters();
    this.renderToolCards();
    this.updateFavouritesUI();

    // Initialize sub-modules
    PlanAnalyzer.init();
    BOQEngine.init();
    StorageManager.init();

    // Setup active tab
    this.switchTab('home');

    console.log('CIVIL ESTIMATION A1 Initialized successfully.');
  },

  bindNavigation: function() {
    // Bottom nav, Top nav and all data-nav-target items
    document.querySelectorAll('[data-nav-target]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.dataset.navTarget;
        if (target) {
          window.location.hash = target;
          this.switchTab(target);
        }
      });
    });

    // Brand logo navigation to Home
    const brand = document.querySelector('.brand-wrapper');
    if (brand) {
      brand.style.cursor = 'pointer';
      brand.addEventListener('click', () => {
        window.location.hash = 'home';
        this.switchTab('home');
      });
    }

    // Modal backdrop click handling
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
        }
      });
    });

    // Escape key closes open modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
          if (modal.id !== 'aiProgressModal') {
            modal.classList.add('hidden');
          }
        });
      }
    });

    // Hash change routing
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== this.activeTab && ['home', 'plan', 'calculators', 'boq', 'report', 'saved'].includes(hash)) {
        this.switchTab(hash);
      }
    });

    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && ['home', 'plan', 'calculators', 'boq', 'report', 'saved'].includes(initialHash)) {
      this.switchTab(initialHash);
    }
  },

  switchTab: function(tabName) {
    this.activeTab = tabName;

    // Toggle views
    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.toggle('active', view.id === `view_${tabName}`);
    });

    // Update bottom nav active state
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.navTarget === tabName);
    });

    // Update top nav active state
    document.querySelectorAll('.top-nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.navTarget === tabName);
    });

    // Special tab renders
    if (tabName === 'plan') {
      setTimeout(() => PlanAnalyzer.render(), 100);
    } else if (tabName === 'boq') {
      BOQEngine.render();
    } else if (tabName === 'report') {
      ReportGenerator.render();
    } else if (tabName === 'saved') {
      StorageManager.renderSavedProjectsList();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  bindSearchAndFilters: function() {
    const searchInput = document.getElementById('toolSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderToolCards();
      });
    }

    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeCategory = chip.dataset.category;
        this.renderToolCards();
      });
    });
  },

  renderToolCards: function() {
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;

    const filtered = this.toolsList.filter(tool => {
      const matchesSearch = tool.title.toLowerCase().includes(this.searchQuery) ||
                            tool.desc.toLowerCase().includes(this.searchQuery);

      if (!matchesSearch) return false;

      if (this.activeCategory === 'all') return true;
      if (this.activeCategory === 'favourites') return StorageManager.isFavourite(tool.id);
      return tool.category === this.activeCategory;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-8 text-slate-400">
          <p>No calculators match your search or filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(t => {
      const isFav = StorageManager.isFavourite(t.id);
      return `
        <div class="tool-card" onclick="App.openCalculator('${t.id}')">
          <div class="tool-card-header">
            <div class="tool-icon-box">${t.icon}</div>
            <button class="fav-star-btn ${isFav ? 'active' : ''}" 
                    onclick="event.stopPropagation(); StorageManager.toggleFavourite('${t.id}')" 
                    title="Toggle Favorite">
              ★
            </button>
          </div>
          <h3 class="tool-card-title">${t.title}</h3>
          <p class="tool-card-desc">${t.desc}</p>
          <div class="tool-card-footer">
            <span class="badge badge-category">${t.category.toUpperCase()}</span>
            <span class="tool-action-link">Open Tool →</span>
          </div>
        </div>
      `;
    }).join('');

    const allGrid = document.getElementById('allCalculatorsGrid');
    if (allGrid) {
      allGrid.innerHTML = this.toolsList.map(t => {
        const isFav = StorageManager.isFavourite(t.id);
        return `
          <div class="tool-card" onclick="App.openCalculator('${t.id}')">
            <div class="tool-card-header">
              <div class="tool-icon-box">${t.icon}</div>
              <button class="fav-star-btn ${isFav ? 'active' : ''}" 
                      onclick="event.stopPropagation(); StorageManager.toggleFavourite('${t.id}')" 
                      title="Toggle Favorite">
                ★
              </button>
            </div>
            <h3 class="tool-card-title">${t.title}</h3>
            <p class="tool-card-desc">${t.desc}</p>
            <div class="tool-card-footer">
              <span class="badge badge-category">${t.category.toUpperCase()}</span>
              <span class="tool-action-link">Open Tool →</span>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  updateFavouritesUI: function() {
    if (this.activeCategory === 'favourites') {
      this.renderToolCards();
    } else {
      document.querySelectorAll('.fav-star-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        const match = onclickAttr.match(/toggleFavourite\(['"]([^'"]+)['"]\)/);
        if (match) {
          const toolId = match[1];
          btn.classList.toggle('active', StorageManager.isFavourite(toolId));
        }
      });
    }
  },

  // CALCULATOR MODAL HANDLERS
  openCalculator: function(toolId) {
    const modal = document.getElementById('calculatorModal');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');

    const tool = this.toolsList.find(t => t.id === toolId);
    if (!tool || !modal) return;

    titleEl.textContent = `${tool.icon} ${tool.title}`;
    bodyEl.innerHTML = this.getCalculatorModalHTML(toolId);
    modal.classList.remove('hidden');

    this.attachCalculatorListeners(toolId);
  },

  closeModal: function() {
    const modal = document.getElementById('calculatorModal');
    if (modal) modal.classList.add('hidden');
  },

  getCalculatorModalHTML: function(toolId) {
    switch(toolId) {
      case 'calc_cost':
        return `
          <div class="calc-form">
            <div class="form-group">
              <label>Built-up Area (sq.ft):</label>
              <input type="number" id="inp_cost_area" class="form-input" value="1000" min="100">
            </div>
            <div class="form-group">
              <label>Number of Floors:</label>
              <input type="number" id="inp_cost_floors" class="form-input" value="1" min="1" max="10">
            </div>
            <div class="form-group">
              <label>Construction Quality / Specification:</label>
              <select id="inp_cost_quality" class="form-input">
                <option value="basic">Basic (₹1,400 / sq.ft)</option>
                <option value="standard" selected>Standard (₹1,850 / sq.ft)</option>
                <option value="premium">Premium (₹2,500 / sq.ft)</option>
                <option value="luxury">Luxury (₹3,400 / sq.ft)</option>
              </select>
            </div>
            <div class="result-box mt-4" id="cost_result_box"></div>
          </div>
        `;

      case 'calc_concrete':
        return `
          <div class="calc-form">
            <div class="form-group">
              <label>Concrete Volume (m³):</label>
              <input type="number" step="0.1" id="inp_conc_vol" class="form-input" value="5.0">
            </div>
            <div class="form-group">
              <label>Concrete Grade (IS 456):</label>
              <select id="inp_conc_grade" class="form-input">
                <option value="M7.5">M7.5 (1 : 4 : 8)</option>
                <option value="M10">M10 (1 : 3 : 6)</option>
                <option value="M15">M15 (1 : 2 : 4)</option>
                <option value="M20" selected>M20 (1 : 1.5 : 3) - Standard RCC</option>
                <option value="M25">M25 (1 : 1 : 2) - Heavy Structure</option>
              </select>
            </div>
            <div class="result-box mt-4" id="conc_result_box"></div>
          </div>
        `;

      case 'calc_brick':
        return `
          <div class="calc-form">
            <div class="form-group">
              <label>Wall Length (m):</label>
              <input type="number" step="0.1" id="inp_bw_len" class="form-input" value="10.0">
            </div>
            <div class="form-group">
              <label>Wall Height (m):</label>
              <input type="number" step="0.1" id="inp_bw_ht" class="form-input" value="3.0">
            </div>
            <div class="form-group">
              <label>Wall Thickness:</label>
              <select id="inp_bw_thick" class="form-input">
                <option value="230" selected>230 mm (9 inch Outer Main Wall)</option>
                <option value="115">115 mm (4.5 inch Inner Partition Wall)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Mortar Ratio:</label>
              <select id="inp_bw_mortar" class="form-input">
                <option value="1:4">1 : 4 Mortar</option>
                <option value="1:6" selected>1 : 6 Mortar (Standard)</option>
              </select>
            </div>
            <div class="result-box mt-4" id="brick_result_box"></div>
          </div>
        `;

      case 'calc_steel':
        return `
          <div class="calc-form">
            <div class="form-group">
              <label>Estimation Method:</label>
              <select id="inp_steel_method" class="form-input">
                <option value="thumb" selected>RCC Volume Thumb Rule (%)</option>
                <option value="rebar">Direct Bar Schedule (D²/162 formula)</option>
              </select>
            </div>
            <div id="steel_thumb_group">
              <div class="form-group">
                <label>Concrete Volume (m³):</label>
                <input type="number" step="0.1" id="inp_steel_vol" class="form-input" value="10.0">
              </div>
              <div class="form-group">
                <label>Structural Member:</label>
                <select id="inp_steel_member" class="form-input">
                  <option value="slab">RCC Slab (~1.0% / 80 kg/m³)</option>
                  <option value="beam">RCC Beam (~1.8% / 140 kg/m³)</option>
                  <option value="column">RCC Column (~2.5% / 200 kg/m³)</option>
                  <option value="footing">Footing Foundation (~0.7% / 55 kg/m³)</option>
                  <option value="overall" selected>Complete Residential Average (~100 kg/m³)</option>
                </select>
              </div>
            </div>
            <div id="steel_rebar_group" class="hidden">
              <div class="form-group">
                <label>Bar Diameter (mm):</label>
                <select id="inp_bar_dia" class="form-input">
                  <option value="8">8 mm</option>
                  <option value="10">10 mm</option>
                  <option value="12" selected>12 mm</option>
                  <option value="16">16 mm</option>
                  <option value="20">20 mm</option>
                  <option value="25">25 mm</option>
                </select>
              </div>
              <div class="form-group">
                <label>Length of Single Bar (m):</label>
                <input type="number" step="0.1" id="inp_bar_len" class="form-input" value="12.0">
              </div>
              <div class="form-group">
                <label>Number of Bars:</label>
                <input type="number" id="inp_bar_count" class="form-input" value="10">
              </div>
            </div>
            <div class="result-box mt-4" id="steel_result_box"></div>
          </div>
        `;

      case 'calc_flooring':
        return `
          <div class="calc-form">
            <div class="form-group">
              <label>Floor Area (m²):</label>
              <input type="number" step="0.1" id="inp_flr_area" class="form-input" value="50.0">
            </div>
            <div class="form-group">
              <label>Tile Dimensions:</label>
              <select id="inp_flr_tilesize" class="form-input">
                <option value="600x600" selected>600 mm × 600 mm (2ft × 2ft)</option>
                <option value="800x800">800 mm × 800 mm (Large vitrified)</option>
                <option value="1200x600">1200 mm × 600 mm (GVT Slab)</option>
                <option value="300x300">300 mm × 300 mm (Bathroom / Ceramic)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Cutting Wastage Allowance (%):</label>
              <input type="number" id="inp_flr_waste" class="form-input" value="8">
            </div>
            <div class="result-box mt-4" id="flr_result_box"></div>
          </div>
        `;

      case 'calc_painting':
        return `
          <div class="calc-form">
            <div class="form-group">
              <label>Wall & Ceiling Surface Area (m²):</label>
              <input type="number" step="0.1" id="inp_paint_area" class="form-input" value="150.0">
            </div>
            <div class="form-group">
              <label>Paint Type:</label>
              <select id="inp_paint_type" class="form-input">
                <option value="interior_emulsion" selected>Interior Acrylic Emulsion (65 sq.ft/L)</option>
                <option value="exterior_emulsion">Exterior Weatherproof Emulsion (55 sq.ft/L)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Number of Coats:</label>
              <input type="number" id="inp_paint_coats" class="form-input" value="2" min="1" max="4">
            </div>
            <div class="result-box mt-4" id="paint_result_box"></div>
          </div>
        `;

      case 'calc_excavation':
        return `
          <div class="calc-form">
            <div class="form-group"><label>Length (m):</label><input type="number" step="0.1" id="inp_exc_l" class="form-input" value="12.0"></div>
            <div class="form-group"><label>Width (m):</label><input type="number" step="0.1" id="inp_exc_w" class="form-input" value="1.2"></div>
            <div class="form-group"><label>Depth (m):</label><input type="number" step="0.1" id="inp_exc_d" class="form-input" value="1.5"></div>
            <div class="form-group"><label>Soil Bulking / Swell (%):</label><input type="number" id="inp_exc_bulk" class="form-input" value="25"></div>
            <div class="result-box mt-4" id="exc_result_box"></div>
          </div>
        `;

      case 'calc_batch':
        return `
          <div class="calc-form">
            <div class="form-group">
              <label>Dry Mix Volume (m³):</label>
              <input type="number" step="0.1" id="inp_batch_vol" class="form-input" value="1.0">
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="form-group">
                <label>Cement Part:</label>
                <input type="number" step="0.5" id="inp_batch_c" class="form-input" value="1">
              </div>
              <div class="form-group">
                <label>Sand Part:</label>
                <input type="number" step="0.5" id="inp_batch_s" class="form-input" value="2">
              </div>
              <div class="form-group">
                <label>Agg Part:</label>
                <input type="number" step="0.5" id="inp_batch_a" class="form-input" value="4">
              </div>
            </div>
            <div class="result-box mt-4" id="batch_result_box"></div>
          </div>
        `;

      case 'calc_openings':
        return `
          <div class="calc-form">
            <div class="grid grid-cols-3 gap-2">
              <div class="form-group">
                <label>Doors (D1):</label>
                <input type="number" id="inp_op_doors" class="form-input" value="6">
              </div>
              <div class="form-group">
                <label>Windows (W1):</label>
                <input type="number" id="inp_op_windows" class="form-input" value="6">
              </div>
              <div class="form-group">
                <label>Ventilators (V):</label>
                <input type="number" id="inp_op_vents" class="form-input" value="2">
              </div>
            </div>
            <div class="result-box mt-4" id="openings_result_box"></div>
          </div>
        `;

      case 'calc_roof':
        return `
          <div class="calc-form">
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>Length (m):</label>
                <input type="number" step="0.1" id="inp_roof_l" class="form-input" value="12.0">
              </div>
              <div class="form-group">
                <label>Width (m):</label>
                <input type="number" step="0.1" id="inp_roof_w" class="form-input" value="8.0">
              </div>
            </div>
            <div class="form-group">
              <label>Roof Style:</label>
              <select id="inp_roof_type" class="form-input">
                <option value="flat">Flat RCC Roof</option>
                <option value="pitched" selected>Sloped / Pitched Roof (Tiles/Sheets)</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>Pitch Slope (degrees):</label>
                <input type="number" id="inp_roof_pitch" class="form-input" value="22">
              </div>
              <div class="form-group">
                <label>Eaves Overhang (m):</label>
                <input type="number" step="0.05" id="inp_roof_overhang" class="form-input" value="0.45">
              </div>
            </div>
            <div class="result-box mt-4" id="roof_result_box"></div>
          </div>
        `;

      case 'calc_geometry':
        return `
          <div class="calc-form">
            <div class="form-group">
              <label>Structural Shape:</label>
              <select id="inp_geom_shape" class="form-input">
                <option value="rectangle" selected>Rectangular Prism (L × W × H)</option>
                <option value="circle">Circular Column / Tank (Radius × Height)</option>
                <option value="trapezoidal_footing">Trapezoidal Footing (Frustum)</option>
              </select>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="form-group">
                <label id="lbl_p1">Param 1 (L / R):</label>
                <input type="number" step="0.1" id="inp_geom_p1" class="form-input" value="4.0">
              </div>
              <div class="form-group">
                <label id="lbl_p2">Param 2 (W / H):</label>
                <input type="number" step="0.1" id="inp_geom_p2" class="form-input" value="3.0">
              </div>
              <div class="form-group">
                <label id="lbl_p3">Param 3 (H / D):</label>
                <input type="number" step="0.1" id="inp_geom_p3" class="form-input" value="0.15">
              </div>
            </div>
            <div class="result-box mt-4" id="geom_result_box"></div>
          </div>
        `;

      case 'calc_unit':
        return `
          <div class="calc-form">
            <div class="form-group">
              <label>Conversion Category:</label>
              <select id="inp_unit_cat" class="form-input">
                <option value="area" selected>Area (sq.m, sq.ft, brass, cent, guntha, acre)</option>
                <option value="volume">Volume (cum, cuft, brass, liter)</option>
                <option value="length">Length (m, ft, inch, mm, yd)</option>
                <option value="weight">Weight (kg, ton, quintal, lb)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Input Value:</label>
              <input type="number" step="any" id="inp_unit_val" class="form-input" value="100">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label>From:</label>
                <select id="inp_unit_from" class="form-input"></select>
              </div>
              <div class="form-group">
                <label>To:</label>
                <select id="inp_unit_to" class="form-input"></select>
              </div>
            </div>
            <div class="result-box mt-4" id="unit_result_box"></div>
          </div>
        `;

      default:
        return `
          <div class="text-center py-6 text-slate-500">
            <p>Calculator is active and ready for input.</p>
            <div class="mt-4"><button class="btn btn-primary" onclick="App.closeModal()">Close</button></div>
          </div>
        `;
    }
  },

  attachCalculatorListeners: function(toolId) {
    if (toolId === 'calc_cost') {
      const update = () => {
        const area = document.getElementById('inp_cost_area').value;
        const floors = document.getElementById('inp_cost_floors').value;
        const qual = document.getElementById('inp_cost_quality').value;
        const res = CivilCalculators.calculateConstructionCost(area, floors, qual);
        const box = document.getElementById('cost_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">Cost Summary</div>
            <div class="result-big-value">₹ ${res.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div class="result-subtitle">Rate: ₹${res.ratePerSqFt}/sq.ft • Total Built-up: ${res.totalBuiltUpArea} sq.ft</div>
            <div class="result-breakdown-list mt-3">
              <div><span>Civil & RCC Structure (52%):</span> <strong>₹ ${res.breakdown.structure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></div>
              <div><span>Finishes & Flooring (22%):</span> <strong>₹ ${res.breakdown.finishes.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></div>
              <div><span>MEP Services (16%):</span> <strong>₹ ${res.breakdown.mep.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></div>
              <div><span>Openings & Fixtures (10%):</span> <strong>₹ ${res.breakdown.fixtures.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></div>
            </div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Complete Construction (${qual.toUpperCase()} Grade)', 'sq.ft', ${res.totalBuiltUpArea}, ${res.ratePerSqFt}, 'Estimated at standard rate'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      ['inp_cost_area', 'inp_cost_floors', 'inp_cost_quality'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', update);
          el.addEventListener('change', update);
        }
      });
      update();
    }

    if (toolId === 'calc_concrete') {
      const update = () => {
        const vol = document.getElementById('inp_conc_vol').value;
        const grade = document.getElementById('inp_conc_grade').value;
        const res = CivilCalculators.calculateConcrete(vol, grade);
        const box = document.getElementById('conc_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">${res.grade} Concrete Takeoff (${res.wetVolumeM3} m³ wet / ${res.dryVolumeM3.toFixed(2)} m³ dry)</div>
            <div class="result-grid-kpi mt-2">
              <div class="kpi-mini"><div>${res.cementBags}</div><span>Cement Bags</span></div>
              <div class="kpi-mini"><div>${res.sandCft.toFixed(1)}</div><span>Sand (cft)</span></div>
              <div class="kpi-mini"><div>${res.aggCft.toFixed(1)}</div><span>Aggregate (cft)</span></div>
              <div class="kpi-mini"><div>${res.waterLiters} L</div><span>Water Required</span></div>
            </div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Supplying & Placing Concrete Grade ${res.grade}', 'm³', ${res.wetVolumeM3}, 6500, 'IS 456 mix design'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      ['inp_conc_vol', 'inp_conc_grade'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', update);
          el.addEventListener('change', update);
        }
      });
      update();
    }

    if (toolId === 'calc_brick') {
      const update = () => {
        const l = document.getElementById('inp_bw_len').value;
        const h = document.getElementById('inp_bw_ht').value;
        const thick = document.getElementById('inp_bw_thick').value;
        const mort = document.getElementById('inp_bw_mortar').value;
        const res = CivilCalculators.calculateBrickwork(l, h, thick, mort);
        const box = document.getElementById('brick_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">Brickwork Volume: ${res.wallVolumeM3.toFixed(2)} m³</div>
            <div class="result-big-value">${res.totalBricks.toLocaleString()} Bricks</div>
            <div class="result-subtitle">Mortar: ${res.cementBags} Cement Bags • ${res.sandCft.toFixed(1)} cft Sand</div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Brickwork ${thick}mm wall in CM ${mort}', 'm³', ${res.wallVolumeM3.toFixed(2)}, 4800, 'Including scaffolding'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      ['inp_bw_len', 'inp_bw_ht', 'inp_bw_thick', 'inp_bw_mortar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', update);
          el.addEventListener('change', update);
        }
      });
      update();
    }

    if (toolId === 'calc_steel') {
      const methodSelect = document.getElementById('inp_steel_method');
      const thumbGroup = document.getElementById('steel_thumb_group');
      const rebarGroup = document.getElementById('steel_rebar_group');

      const update = () => {
        const method = methodSelect.value;
        const box = document.getElementById('steel_result_box');
        if (method === 'thumb') {
          thumbGroup.classList.remove('hidden');
          rebarGroup.classList.add('hidden');
          const vol = document.getElementById('inp_steel_vol').value;
          const mem = document.getElementById('inp_steel_member').value;
          const res = CivilCalculators.calculateSteelByVolume(vol, mem);
          if (box) {
            box.innerHTML = `
              <div class="result-title">Reinforcement Steel Estimate</div>
              <div class="result-big-value">${res.totalSteelKg.toFixed(0)} kg <small class="text-xs">(${res.totalSteelTon.toFixed(2)} MT)</small></div>
              <div class="result-subtitle">Percentage: ${res.percentage}% of concrete volume (${res.concreteVolumeM3} m³)</div>
              <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Fe-500D TMT Reinforcement Steel', 'kg', ${res.totalSteelKg.toFixed(0)}, 72, 'Including cutting, bending & binding'); App.closeModal(); App.switchTab('boq');">
                ➕ Add to Project BOQ
              </button>
            `;
          }
        } else {
          thumbGroup.classList.add('hidden');
          rebarGroup.classList.remove('hidden');
          const dia = document.getElementById('inp_bar_dia').value;
          const len = document.getElementById('inp_bar_len').value;
          const cnt = document.getElementById('inp_bar_count').value;
          const res = CivilCalculators.calculateRebarWeight(dia, len, cnt);
          if (box) {
            box.innerHTML = `
              <div class="result-title">${dia}mm Rebar Weight (D²/162)</div>
              <div class="result-big-value">${res.totalWeightKg.toFixed(1)} kg</div>
              <div class="result-subtitle">Unit weight: ${res.unitWeightKgPerM.toFixed(3)} kg/m • Total length: ${(res.lengthM * res.barCount).toFixed(1)} m</div>
              <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('${dia}mm Rebar Steel Bars', 'kg', ${res.totalWeightKg.toFixed(1)}, 72, '${cnt} nos bars'); App.closeModal(); App.switchTab('boq');">
                ➕ Add to Project BOQ
              </button>
            `;
          }
        }
      };

      methodSelect.addEventListener('change', update);
      ['inp_steel_vol', 'inp_steel_member', 'inp_bar_dia', 'inp_bar_len', 'inp_bar_count'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', update);
          el.addEventListener('change', update);
        }
      });
      update();
    }

    if (toolId === 'calc_flooring') {
      const update = () => {
        const area = document.getElementById('inp_flr_area').value;
        const tileSizeVal = document.getElementById('inp_flr_tilesize').value || '600x600';
        const [tileW, tileL] = tileSizeVal.split('x').map(Number);
        const waste = document.getElementById('inp_flr_waste').value;
        const res = CivilCalculators.calculateFlooring(area, tileW || 600, tileL || 600, waste);
        const box = document.getElementById('flr_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">Tiles Required (${res.floorAreaSqFt.toFixed(0)} sq.ft - ${tileW || 600}×${tileL || 600}mm)</div>
            <div class="result-big-value">${res.grossTiles} Tiles</div>
            <div class="result-subtitle">Mortar: ${res.cementBags} Cement Bags • ${res.sandCft.toFixed(1)} cft Sand</div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Vitrified Tile Flooring ${tileW || 600}x${tileL || 600}mm', 'm²', ${res.floorAreaSqM}, 850, 'Including 20mm bedding mortar'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      ['inp_flr_area', 'inp_flr_tilesize', 'inp_flr_waste'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', update);
          el.addEventListener('change', update);
        }
      });
      update();
    }

    if (toolId === 'calc_painting') {
      const update = () => {
        const area = document.getElementById('inp_paint_area').value;
        const type = document.getElementById('inp_paint_type').value;
        const coats = document.getElementById('inp_paint_coats').value;
        const res = CivilCalculators.calculatePainting(area, type, coats);
        const box = document.getElementById('paint_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">Painting Materials (${res.surfaceAreaSqFt.toFixed(0)} sq.ft)</div>
            <div class="result-grid-kpi mt-2">
              <div class="kpi-mini"><div>${res.paintLiters} L</div><span>Emulsion Paint</span></div>
              <div class="kpi-mini"><div>${res.primerLiters} L</div><span>Primer</span></div>
              <div class="kpi-mini"><div>${res.puttyKg} kg</div><span>Wall Putty</span></div>
            </div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Premium Painting (${coats} Coats)', 'm²', ${res.surfaceAreaSqM}, 180, 'With primer and putty base'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      ['inp_paint_area', 'inp_paint_type', 'inp_paint_coats'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', update);
          el.addEventListener('change', update);
        }
      });
      update();
    }

    if (toolId === 'calc_excavation') {
      const update = () => {
        const l = document.getElementById('inp_exc_l').value;
        const w = document.getElementById('inp_exc_w').value;
        const d = document.getElementById('inp_exc_d').value;
        const bulk = document.getElementById('inp_exc_bulk').value;
        const res = CivilCalculators.calculateExcavation(l, w, d, bulk);
        const box = document.getElementById('exc_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">Excavation Volume</div>
            <div class="result-big-value">${res.netVolumeM3.toFixed(2)} m³ <small class="text-xs">(${res.brass.toFixed(2)} Brass)</small></div>
            <div class="result-subtitle">Bulked: ${res.bulkedVolumeM3.toFixed(2)} m³ • Approx ${res.truckLoads} Tipper Loads (6m³)</div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Earthwork Excavation in Trenches', 'm³', ${res.netVolumeM3.toFixed(2)}, 280, 'Foundation pit excavation'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      ['inp_exc_l', 'inp_exc_w', 'inp_exc_d', 'inp_exc_bulk'].forEach(id => {
        document.getElementById(id).addEventListener('input', update);
      });
      update();
    }

    if (toolId === 'calc_unit') {
      const unitsByCategory = {
        area: [
          { val: 'sqm', label: 'Square Meter (m²)' },
          { val: 'sqft', label: 'Square Feet (sq.ft)' },
          { val: 'brass', label: 'Brass (100 sq.ft)' },
          { val: 'cent', label: 'Cent (435.6 sq.ft)' },
          { val: 'guntha', label: 'Guntha (1089 sq.ft)' },
          { val: 'acre', label: 'Acre' }
        ],
        volume: [
          { val: 'cum', label: 'Cubic Meter (m³)' },
          { val: 'cuft', label: 'Cubic Feet (cft)' },
          { val: 'brass', label: 'Brass (100 cft)' },
          { val: 'liter', label: 'Liters' }
        ],
        length: [
          { val: 'm', label: 'Meter (m)' },
          { val: 'ft', label: 'Feet (ft)' },
          { val: 'inch', label: 'Inch (in)' },
          { val: 'mm', label: 'Millimeter (mm)' }
        ],
        weight: [
          { val: 'kg', label: 'Kilogram (kg)' },
          { val: 'ton', label: 'Metric Ton (MT)' },
          { val: 'quintal', label: 'Quintal (100 kg)' }
        ]
      };

      const catSelect = document.getElementById('inp_unit_cat');
      const fromSelect = document.getElementById('inp_unit_from');
      const toSelect = document.getElementById('inp_unit_to');
      const valInput = document.getElementById('inp_unit_val');
      const box = document.getElementById('unit_result_box');

      const populateUnits = () => {
        const cat = catSelect.value;
        const options = unitsByCategory[cat] || [];
        fromSelect.innerHTML = options.map(o => `<option value="${o.val}">${o.label}</option>`).join('');
        toSelect.innerHTML = options.map((o, idx) => `<option value="${o.val}" ${idx === 1 ? 'selected' : ''}>${o.label}</option>`).join('');
        runConvert();
      };

      const runConvert = () => {
        const cat = catSelect.value;
        const val = valInput.value;
        const from = fromSelect.value;
        const to = toSelect.value;
        const res = CivilCalculators.convertUnits(val, cat, from, to);
        if (box) {
          box.innerHTML = `
            <div class="result-title">Conversion Result</div>
            <div class="result-big-value">${res.toLocaleString(undefined, { maximumFractionDigits: 4 })} <small class="text-xs">${to.toUpperCase()}</small></div>
            <div class="result-subtitle">${val} ${from.toUpperCase()} = ${res.toFixed(4)} ${to.toUpperCase()}</div>
          `;
        }
      };

      catSelect.addEventListener('change', populateUnits);
      fromSelect.addEventListener('change', runConvert);
      toSelect.addEventListener('change', runConvert);
      valInput.addEventListener('input', runConvert);
      populateUnits();
    }

    if (toolId === 'calc_batch') {
      const update = () => {
        const v = document.getElementById('inp_batch_vol').value;
        const c = document.getElementById('inp_batch_c').value;
        const s = document.getElementById('inp_batch_s').value;
        const a = document.getElementById('inp_batch_a').value;
        const res = CivilCalculators.calculateCustomBatch(v, c, s, a);
        const box = document.getElementById('batch_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">Batch Breakdown (${c}:${s}:${a} Mix)</div>
            <div class="result-grid-kpi mt-2">
              <div class="kpi-mini"><div>${res.cementBags}</div><span>Cement Bags</span></div>
              <div class="kpi-mini"><div>${res.sandCft.toFixed(1)}</div><span>Sand (cft)</span></div>
              <div class="kpi-mini"><div>${res.aggCft.toFixed(1)}</div><span>Aggregate (cft)</span></div>
              <div class="kpi-mini"><div>${res.dryVolumeM3} m³</div><span>Dry Volume</span></div>
            </div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Custom Mix Mortar/Concrete (${c}:${s}:${a})', 'm³', ${res.dryVolumeM3}, 5500, 'Batch proportioning'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      ['inp_batch_vol', 'inp_batch_c', 'inp_batch_s', 'inp_batch_a'].forEach(id => {
        document.getElementById(id).addEventListener('input', update);
      });
      update();
    }

    if (toolId === 'calc_openings') {
      const update = () => {
        const d = document.getElementById('inp_op_doors').value;
        const w = document.getElementById('inp_op_windows').value;
        const v = document.getElementById('inp_op_vents').value;
        const res = CivilCalculators.calculateOpenings(d, w, v);
        const box = document.getElementById('openings_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">Opening Deductions & Joinery Timber</div>
            <div class="result-big-value">${res.totalDeductionM2.toFixed(1)} m² <small class="text-xs">Deduction Area</small></div>
            <div class="result-subtitle">Total Openings: ${res.totalOpenings} • Timber Frame: ${res.frameWoodM3.toFixed(3)} m³ (${res.frameWoodCft.toFixed(1)} cft)</div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Timber Frame & Joinery for Openings', 'cft', ${res.frameWoodCft.toFixed(1)}, 2800, '${d} doors, ${w} windows'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      ['inp_op_doors', 'inp_op_windows', 'inp_op_vents'].forEach(id => {
        document.getElementById(id).addEventListener('input', update);
      });
      update();
    }

    if (toolId === 'calc_roof') {
      const update = () => {
        const l = document.getElementById('inp_roof_l').value;
        const w = document.getElementById('inp_roof_w').value;
        const t = document.getElementById('inp_roof_type').value;
        const p = document.getElementById('inp_roof_pitch').value;
        const o = document.getElementById('inp_roof_overhang').value;
        const res = CivilCalculators.calculateRoof(l, w, t, p, o);
        const box = document.getElementById('roof_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">Roof Surface Area (${res.roofType.toUpperCase()})</div>
            <div class="result-big-value">${res.trueRoofAreaM2.toFixed(1)} m² <small class="text-xs">(${res.trueRoofAreaSqFt.toFixed(0)} sq.ft)</small></div>
            <div class="result-subtitle">Projected: ${res.projectedPlanAreaM2.toFixed(1)} m² • Approx ${res.sheetsCount} Sheets / Panels</div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Roof Covering & Waterproofing (${res.roofType})', 'm²', ${res.trueRoofAreaM2.toFixed(1)}, 650, 'With pitch slope ${p}°'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      ['inp_roof_l', 'inp_roof_w', 'inp_roof_type', 'inp_roof_pitch', 'inp_roof_overhang'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', update);
          el.addEventListener('change', update);
        }
      });
      update();
    }

    if (toolId === 'calc_geometry') {
      const shapeSelect = document.getElementById('inp_geom_shape');
      const update = () => {
        const shape = shapeSelect.value;
        const l1 = document.getElementById('lbl_p1');
        const l2 = document.getElementById('lbl_p2');
        const l3 = document.getElementById('lbl_p3');

        if (shape === 'rectangle') {
          if (l1) l1.textContent = 'Length L (m):';
          if (l2) l2.textContent = 'Width W (m):';
          if (l3) l3.textContent = 'Height H (m):';
        } else if (shape === 'circle') {
          if (l1) l1.textContent = 'Radius R (m):';
          if (l2) l2.textContent = 'Height H (m):';
          if (l3) l3.textContent = 'Depth (m):';
        } else if (shape === 'trapezoidal_footing') {
          if (l1) l1.textContent = 'Base Area A1 (m²):';
          if (l2) l2.textContent = 'Top Area A2 (m²):';
          if (l3) l3.textContent = 'Depth H (m):';
        }

        const p1 = document.getElementById('inp_geom_p1').value;
        const p2 = document.getElementById('inp_geom_p2').value;
        const p3 = document.getElementById('inp_geom_p3').value;
        const res = CivilCalculators.calculateGeometry(shape, p1, p2, p3);
        const box = document.getElementById('geom_result_box');
        if (box) {
          box.innerHTML = `
            <div class="result-title">Geometric Quantity</div>
            <div class="result-big-value">${res.volume > 0 ? res.volume.toFixed(3) + ' m³ Volume' : res.area.toFixed(2) + ' m² Area'}</div>
            <div class="result-subtitle">Cross-Sectional Area: ${res.area.toFixed(2)} m²</div>
            <button class="btn btn-sm btn-primary w-full mt-3" onclick="BOQEngine.addItem('Geometric Element (${shape})', 'm³', ${res.volume > 0 ? res.volume.toFixed(2) : 1}, 4500, 'Calculated geometry'); App.closeModal(); App.switchTab('boq');">
              ➕ Add to Project BOQ
            </button>
          `;
        }
      };
      shapeSelect.addEventListener('change', update);
      ['inp_geom_p1', 'inp_geom_p2', 'inp_geom_p3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', update);
          el.addEventListener('change', update);
        }
      });
      update();
    }
  },

  // TOAST NOTIFICATION SYSTEM
  showToast: function(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  // SAVE PROJECT PROMPT
  promptSaveProject: function() {
    const name = prompt('Enter Project Name:', ReportGenerator.projectDetails.projectName);
    if (!name) return;
    const client = prompt('Enter Client Name:', ReportGenerator.projectDetails.clientName);
    const loc = prompt('Enter Location:', ReportGenerator.projectDetails.location);
    StorageManager.saveProject(name, client, loc);
  }
};

window.App = App;

// Bootstrap on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
