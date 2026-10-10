/**
 * CIVIL ESTIMATION A1 - 2D Plan AI Analyzer Engine
 * Handles Canvas rendering, CV filters, simulated OCR & boundary detection, and takeoff estimation.
 */

const PlanAnalyzer = {
  activePlan: null,
  activeFilter: 'normal',
  uploadedImage: null,
  isAnalyzing: false,
  scalePxPerMeter: 35,
  isCalibrating: false,
  calibrationPoints: [],

  init: function() {
    this.canvas = document.getElementById('planCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.bindEvents();
    // Load default sample plan
    this.loadSamplePlan('plan_2bhk');
  },

  bindEvents: function() {
    const fileInput = document.getElementById('planFileInput');
    const uploadDropzone = document.getElementById('uploadDropzone');

    if (fileInput) {
      fileInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    if (uploadDropzone) {
      uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropzone.classList.add('border-primary');
      });
      uploadDropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadDropzone.classList.remove('border-primary');
      });
      uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropzone.classList.remove('border-primary');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    }

    // Canvas click for calibration with coordinate scaling
    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => {
        if (this.isCalibrating) {
          const rect = this.canvas.getBoundingClientRect();
          const scaleX = this.canvas.width / rect.width;
          const scaleY = this.canvas.height / rect.height;
          const x = (e.clientX - rect.left) * scaleX;
          const y = (e.clientY - rect.top) * scaleY;
          this.handleCalibrationClick(x, y);
        }
      });
    }

    // Dynamic dimension change listeners
    const liveInputs = ['planAreaInput', 'planFloorsInput', 'planFloorHeightInput', 'planWallThickInput'];
    liveInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const updateIfActive = () => {
          const results = document.getElementById('aiResultsSection');
          if (results && !results.classList.contains('hidden')) {
            this.generateTakeoff();
          }
        };
        el.addEventListener('input', updateIfActive);
        el.addEventListener('change', updateIfActive);
      }
    });
  },

  loadSamplePlan: function(planId) {
    const sample = SamplePlans.plans.find(p => p.id === planId) || SamplePlans.plans[0];
    this.uploadedImage = null;
    this.activePlan = JSON.parse(JSON.stringify(sample));
    this.scalePxPerMeter = sample.scale;

    // Update UI fields
    const areaInput = document.getElementById('planAreaInput');
    const floorSelect = document.getElementById('planFloorsInput');
    const floorHeightInput = document.getElementById('planFloorHeightInput');
    const presetSelect = document.getElementById('presetPlanSelect');
    const filenameLabel = document.getElementById('selectedFileName');
    const fileSizeLabel = document.getElementById('selectedFileSize');
    const fileStatus = document.getElementById('fileStatusBadge');

    if (areaInput) areaInput.value = sample.builtUpAreaSqFt;
    if (floorSelect) floorSelect.value = sample.floors;
    if (floorHeightInput) floorHeightInput.value = sample.floorHeightM || 3.0;
    if (presetSelect) presetSelect.value = sample.id;
    if (filenameLabel) filenameLabel.textContent = `${sample.name}.dwg / .png`;
    if (fileSizeLabel) fileSizeLabel.textContent = 'Sample Architectural Drawing';
    if (fileStatus) {
      fileStatus.textContent = 'Plan Ready';
      fileStatus.className = 'status-badge status-ready';
    }

    this.render();

    // If takeoff results are currently open, immediately re-compute for the new plan
    const resultsContainer = document.getElementById('aiResultsSection');
    if (resultsContainer && !resultsContainer.classList.contains('hidden')) {
      this.generateTakeoff();
    }
  },

  handleFileUpload: function(file) {
    const filenameLabel = document.getElementById('selectedFileName');
    const fileStatus = document.getElementById('fileStatusBadge');
    const fileSizeLabel = document.getElementById('selectedFileSize');

    if (filenameLabel) filenameLabel.textContent = file.name;
    if (fileSizeLabel) fileSizeLabel.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    if (fileStatus) {
      fileStatus.textContent = 'Uploaded & Ready';
      fileStatus.className = 'status-badge status-ready';
    }

    // Hide old results section if open
    const resultsContainer = document.getElementById('aiResultsSection');
    if (resultsContainer) resultsContainer.classList.add('hidden');
    this.currentTakeoff = null;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // PDF handling: For prototype simulation, render PDF blueprint banner + plan
      this.loadSamplePlan('plan_villa');
      if (filenameLabel) filenameLabel.textContent = `${file.name} (PDF Vector Drawing)`;
      if (fileSizeLabel) fileSizeLabel.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      App.showToast('PDF blueprint loaded successfully! Vector layers extracted.', 'success');
      return;
    }

    if (file.type.startsWith('image/') || /\.(jpe?g|png)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          this.uploadedImage = img;
          this.activePlan = {
            id: 'custom_upload_' + Date.now(),
            name: file.name,
            builtUpAreaSqFt: 1050,
            builtUpAreaSqM: 97.5,
            floors: 1,
            floorHeightM: 3.0,
            description: `User uploaded plan: ${file.name}`,
            scale: 35,
            rooms: [
              { name: 'Living Room', length: 4.8, width: 3.8, area: 18.24, x: 60, y: 60, w: 168, h: 133, doors: 2, windows: 2 },
              { name: 'Master Bed', length: 3.8, width: 3.5, area: 13.3, x: 238, y: 60, w: 133, h: 122, doors: 1, windows: 1 },
              { name: 'Kitchen', length: 3.2, width: 2.6, area: 8.32, x: 60, y: 203, w: 112, h: 91, doors: 1, windows: 1 },
              { name: 'Bedroom 2', length: 3.5, width: 3.2, area: 11.2, x: 238, y: 192, w: 122, h: 112, doors: 1, windows: 1 },
              { name: 'Toilet / Bath', length: 2.4, width: 1.5, area: 3.6, x: 182, y: 203, w: 56, h: 52, doors: 1, windows: 1 }
            ],
            detectedWalls: {
              outerWallLengthM: 48.0,
              innerWallLengthM: 34.5,
              outerThicknessM: 0.23,
              innerThicknessM: 0.115
            },
            doorsCount: 6,
            windowsCount: 6
          };

          const areaInput = document.getElementById('planAreaInput');
          if (areaInput) areaInput.value = this.activePlan.builtUpAreaSqFt;

          this.render();
          App.showToast('Custom plan uploaded successfully!', 'success');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  },

  setFilter: function(mode) {
    this.activeFilter = mode;
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === mode);
    });
    this.render();
  },

  render: function() {
    if (!this.canvas) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    if (this.uploadedImage) {
      // Draw uploaded image
      ctx.clearRect(0, 0, width, height);

      // Fit image into canvas preserving aspect ratio
      const img = this.uploadedImage;
      const hRatio = width / img.width;
      const vRatio = height / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShiftX = (width - img.width * ratio) / 2;
      const centerShiftY = (height - img.height * ratio) / 2;

      ctx.save();
      if (this.activeFilter === 'grayscale') {
        ctx.filter = 'grayscale(100%) contrast(160%)';
      } else if (this.activeFilter === 'canny') {
        ctx.filter = 'invert(100%) contrast(200%) brightness(120%)';
      }
      ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
      ctx.restore();

      // If overlay mode, draw detected bounding boxes & tags on top of user image
      if (this.activeFilter === 'overlay' && this.activePlan && this.activePlan.rooms) {
        this.drawOverlayBoxes(ctx);
      }
    } else if (this.activePlan) {
      SamplePlans.drawPlanToCanvas(this.canvas, this.activePlan.id, this.activeFilter);
    }

    // Draw calibration points if any
    if (this.calibrationPoints.length > 0) {
      ctx.fillStyle = '#ef4444';
      this.calibrationPoints.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`${i + 1}`, pt.x - 3, pt.y + 3);
      });

      if (this.calibrationPoints.length === 2) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.calibrationPoints[0].x, this.calibrationPoints[0].y);
        ctx.lineTo(this.calibrationPoints[1].x, this.calibrationPoints[1].y);
        ctx.stroke();
      }
    }
  },

  drawOverlayBoxes: function(ctx) {
    if (!this.activePlan.rooms) return;
    this.activePlan.rooms.forEach((room, idx) => {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(room.x, room.y, room.w, room.h);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.fillRect(room.x, room.y, room.w, room.h);

      // AI Badge
      ctx.fillStyle = '#10b981';
      ctx.fillRect(room.x + 2, room.y + 2, 72, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${room.name}`, room.x + 5, room.y + 14);
    });
  },

  startCalibration: function() {
    if (this.isCalibrating) {
      this.isCalibrating = false;
      this.calibrationPoints = [];
      const calibBtn = document.getElementById('btnCalibrateScale');
      if (calibBtn) calibBtn.textContent = '📏 Calibrate Scale';
      this.render();
      App.showToast('Scale calibration cancelled.', 'info');
      return;
    }
    this.isCalibrating = true;
    this.calibrationPoints = [];
    App.showToast('Scale Calibration: Click Point A on the plan with known length.', 'info');
    const calibBtn = document.getElementById('btnCalibrateScale');
    if (calibBtn) calibBtn.textContent = 'Click Point A on Plan...';
  },

  handleCalibrationClick: function(x, y) {
    this.calibrationPoints.push({ x, y });
    this.render();

    if (this.calibrationPoints.length === 1) {
      App.showToast('Point A set! Now click Point B at the other end of the wall.', 'info');
      const calibBtn = document.getElementById('btnCalibrateScale');
      if (calibBtn) calibBtn.textContent = 'Click Point B...';
    } else if (this.calibrationPoints.length === 2) {
      const p1 = this.calibrationPoints[0];
      const p2 = this.calibrationPoints[1];
      const distPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

      const knownLengthM = prompt('Enter real-world length between Point A and B in meters:', '3.0');
      if (knownLengthM && parseFloat(knownLengthM) > 0) {
        this.scalePxPerMeter = distPx / parseFloat(knownLengthM);
        App.showToast(`Calibrated scale: ${this.scalePxPerMeter.toFixed(1)} px/meter!`, 'success');
      }
      this.isCalibrating = false;
      this.calibrationPoints = [];
      const calibBtn = document.getElementById('btnCalibrateScale');
      if (calibBtn) calibBtn.textContent = '📏 Calibrate Scale';
      this.render();
    }
  },

  // 5-STAGE SIMULATED AI COMPUTER VISION PIPELINE
  analyzePlan: function() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    const pipelineSteps = [
      { id: 'cvStep1', text: 'Pre-processing: Denoising, Contrast Normalization & Binarization...', filter: 'grayscale' },
      { id: 'cvStep2', text: 'Contour Tracing: Wall vector lines & thickness classification...', filter: 'canny' },
      { id: 'cvStep3', text: 'Room Segmentation: Closed polygon boundary & OCR dimension extraction...', filter: 'overlay' },
      { id: 'cvStep4', text: 'Symbol Detection: Door swings (arcs) & window openings...', filter: 'overlay' },
      { id: 'cvStep5', text: 'Takeoff Synthesis: Engineering rule quantity computation (IS 1200 / IS 456)...', filter: 'overlay' }
    ];

    const progressModal = document.getElementById('aiProgressModal');
    const progressBar = document.getElementById('aiProgressBar');
    const stepLabel = document.getElementById('aiStepLabel');

    if (progressModal) progressModal.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (stepLabel) stepLabel.textContent = 'Stage 1/5: Initializing CAD Pre-processing...';

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < pipelineSteps.length) {
        const step = pipelineSteps[currentStep];
        if (progressBar) progressBar.style.width = `${((currentStep + 1) / pipelineSteps.length) * 100}%`;
        if (stepLabel) stepLabel.textContent = `Stage ${currentStep + 1}/5: ${step.text}`;
        this.setFilter(step.filter);
        currentStep++;
      } else {
        clearInterval(interval);
        this.isAnalyzing = false;
        if (progressModal) progressModal.classList.add('hidden');
        this.generateTakeoff();
        App.showToast('AI Plan Analysis Complete! Quantities generated.', 'success');
      }
    }, 600);
  },

  // CALCULATE DETAILED MATERIAL TAKEOFF FROM DETECTED PLAN
  generateTakeoff: function() {
    const areaInput = document.getElementById('planAreaInput');
    const floorSelect = document.getElementById('planFloorsInput');
    const heightInput = document.getElementById('planFloorHeightInput');
    const wallThickSelect = document.getElementById('planWallThickInput');

    const floors = parseInt(floorSelect ? floorSelect.value : 1) || 1;
    let manualArea = parseFloat(areaInput ? areaInput.value : 0);

    const plan = this.activePlan || SamplePlans.plans[0];
    const builtUpSqFt = manualArea > 0 ? manualArea : plan.builtUpAreaSqFt;
    const builtUpSqM = builtUpSqFt * 0.092903;
    const totalAreaSqM = builtUpSqM * floors;

    const floorHeightM = heightInput ? (parseFloat(heightInput.value) || 3.0) : (plan.floorHeightM || 3.0);
    const isAAC = wallThickSelect && wallThickSelect.value === '200';
    const outerThick = isAAC ? 0.20 : 0.23;
    const innerThick = isAAC ? 0.10 : 0.115;

    const detected = plan.detectedWalls || { outerWallLengthM: 45, innerWallLengthM: 30 };
    const outerWallLen = (detected.outerWallLengthM || 45) * floors;
    const innerWallLen = (detected.innerWallLengthM || 30) * floors;

    // 1. Brickwork Volume
    const outerWallVolM3 = outerWallLen * floorHeightM * outerThick;
    const innerWallVolM3 = innerWallLen * floorHeightM * innerThick;
    // Deduct openings: ~15% for doors & windows
    const grossWallVolM3 = outerWallVolM3 + innerWallVolM3;
    const netBrickworkVolM3 = grossWallVolM3 * 0.85;
    const totalBricks = Math.ceil(netBrickworkVolM3 * 500 * 1.05); // 500 bricks/m3 + 5% wastage

    // Brick mortar cement & sand (1:6 mortar)
    const dryMortarM3 = netBrickworkVolM3 * 0.30 * 1.33;
    const brickCementBags = Math.ceil((dryMortarM3 * (1 / 7) * 1440) / 50);
    const brickSandM3 = dryMortarM3 * (6 / 7);

    // 2. Concrete Volume (RCC Slab, Beams, Columns, Footings)
    // Slab: average 125mm (0.125m) thickness
    const slabVolM3 = totalAreaSqM * 0.125;
    // Beams: ~25% of slab volume
    const beamVolM3 = slabVolM3 * 0.25;
    // Columns: ~20% of slab volume
    const colVolM3 = slabVolM3 * 0.20;
    // Footings: ~35% of slab volume
    const footingVolM3 = slabVolM3 * 0.35;
    const totalConcreteM3 = slabVolM3 + beamVolM3 + colVolM3 + footingVolM3;

    // Concrete Mix (M20 grade 1:1.5:3, dry factor 1.54)
    const dryConcreteM3 = totalConcreteM3 * 1.54;
    const concCementBags = Math.ceil((dryConcreteM3 * (1 / 5.5) * 1440) / 50);
    const concSandM3 = dryConcreteM3 * (1.5 / 5.5);
    const concAggM3 = dryConcreteM3 * (3 / 5.5);

    // 3. Steel Reinforcement (IS 456 thumb rule: ~100 kg/m3 of concrete for residential)
    const totalSteelKg = Math.ceil(totalConcreteM3 * 95);
    const totalSteelMT = (totalSteelKg / 1000).toFixed(2);

    // 4. Plastering Area (Both sides of walls + ceiling)
    // Wall surface = 2 * (outer + inner length) * height
    const wallPlasterAreaM2 = 2 * (outerWallLen + innerWallLen) * floorHeightM * 0.85;
    const ceilingPlasterM2 = totalAreaSqM;
    const totalPlasterAreaM2 = Math.ceil(wallPlasterAreaM2 + ceilingPlasterM2);

    // Plastering cement & sand (12mm 1:4 mix, dry factor 1.56)
    const dryPlasterVolM3 = totalPlasterAreaM2 * 0.012 * 1.56;
    const plasterCementBags = Math.ceil((dryPlasterVolM3 * 0.2 * 1440) / 50);
    const plasterSandM3 = dryPlasterVolM3 * 0.8;

    // Total Cement & Sand
    const totalCementBags = concCementBags + brickCementBags + plasterCementBags;
    const totalSandM3 = (concSandM3 + brickSandM3 + plasterSandM3);
    const totalSandCft = (totalSandM3 * 35.3147).toFixed(1);
    const totalAggM3 = concAggM3;
    const totalAggCft = (totalAggM3 * 35.3147).toFixed(1);

    // 5. Flooring & Painting
    const totalFlooringM2 = Math.ceil(totalAreaSqM * 0.88); // deduct wall footprint ~12%
    const totalPaintingAreaM2 = Math.ceil(totalPlasterAreaM2);

    // 6. Openings
    const doorsTotal = (plan.doorsCount || 6) * floors;
    const windowsTotal = (plan.windowsCount || 5) * floors;

    // Excavation estimate: Foundation trenches
    const totalExcavationM3 = Math.ceil(footingVolM3 * 3.5);

    this.currentTakeoff = {
      builtUpSqFt: builtUpSqFt * floors,
      builtUpSqM: totalAreaSqM.toFixed(1),
      floors: floors,
      rooms: plan.rooms || [],
      quantities: {
        cementBags: totalCementBags,
        sandM3: totalSandM3.toFixed(2),
        sandCft: totalSandCft,
        aggM3: totalAggM3.toFixed(2),
        aggCft: totalAggCft,
        bricksNos: totalBricks,
        steelKg: totalSteelKg,
        steelMT: totalSteelMT,
        concreteM3: totalConcreteM3.toFixed(2),
        plasterM2: totalPlasterAreaM2,
        flooringM2: totalFlooringM2,
        doorsNos: doorsTotal,
        windowsNos: windowsTotal,
        paintingM2: totalPaintingAreaM2,
        excavationM3: totalExcavationM3
      }
    };

    this.renderTakeoffUI();
  },

  renderTakeoffUI: function() {
    const resultsContainer = document.getElementById('aiResultsSection');
    if (!resultsContainer) return;
    resultsContainer.classList.remove('hidden');

    const q = this.currentTakeoff.quantities;

    // Populate Material Table exactly matching Section 6
    const tableBody = document.getElementById('takeoffTableBody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td><span class="mat-icon">🪣</span> <strong>Cement</strong></td>
          <td><span class="badge badge-qty">${q.cementBags}</span></td>
          <td>Bags (50 kg each)</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🏖️</span> <strong>Fine Sand</strong></td>
          <td><span class="badge badge-qty">${q.sandM3} m³</span> <small class="text-muted">(${q.sandCft} cft)</small></td>
          <td>m³ / cft</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🪨</span> <strong>Coarse Aggregate</strong></td>
          <td><span class="badge badge-qty">${q.aggM3} m³</span> <small class="text-muted">(${q.aggCft} cft)</small></td>
          <td>m³ / cft</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🧱</span> <strong>Bricks</strong></td>
          <td><span class="badge badge-qty">${q.bricksNos.toLocaleString()}</span></td>
          <td>Nos (Standard Modular)</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🔩</span> <strong>Reinforcement Steel</strong></td>
          <td><span class="badge badge-qty">${q.steelKg.toLocaleString()} kg</span> <small class="text-muted">(${q.steelMT} MT)</small></td>
          <td>kg / Metric Ton</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🏗️</span> <strong>Concrete</strong></td>
          <td><span class="badge badge-qty">${q.concreteM3}</span></td>
          <td>m³ (M20 Grade)</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🧤</span> <strong>Plastering</strong></td>
          <td><span class="badge badge-qty">${q.plasterM2}</span></td>
          <td>m² (Wall & Ceiling)</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🪵</span> <strong>Flooring</strong></td>
          <td><span class="badge badge-qty">${q.flooringM2}</span></td>
          <td>m² (${(q.flooringM2 * 10.7639).toFixed(0)} sq.ft)</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🚪</span> <strong>Doors</strong></td>
          <td><span class="badge badge-qty">${q.doorsNos}</span></td>
          <td>Nos (Detected openings)</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🪟</span> <strong>Windows</strong></td>
          <td><span class="badge badge-qty">${q.windowsNos}</span></td>
          <td>Nos (Detected openings)</td>
        </tr>
        <tr>
          <td><span class="mat-icon">🎨</span> <strong>Painting</strong></td>
          <td><span class="badge badge-qty">${q.paintingM2}</span></td>
          <td>m² (2 Coats + Primer)</td>
        </tr>
      `;
    }

    // Populate Detected Rooms list
    const roomsContainer = document.getElementById('detectedRoomsList');
    if (roomsContainer && this.currentTakeoff.rooms) {
      roomsContainer.innerHTML = this.currentTakeoff.rooms.map((r, i) => `
        <div class="room-chip">
          <div class="room-chip-title">${r.name}</div>
          <div class="room-chip-details">${r.length}m × ${r.width}m = <strong>${r.area.toFixed(1)} m²</strong></div>
          <div class="room-chip-openings">🚪 ${r.doors} Door(s) • 🪟 ${r.windows} Window(s)</div>
        </div>
      `).join('');
    }

    // Scroll smoothly to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  },

  sendToBOQ: function() {
    if (!this.currentTakeoff) {
      App.showToast('Please analyze the plan first!', 'warning');
      return;
    }
    BOQEngine.importFromPlanTakeoff(this.currentTakeoff);
    App.switchTab('boq');
    App.showToast('Quantities successfully pushed to BOQ Generator!', 'success');
  }
};

window.PlanAnalyzer = PlanAnalyzer;
