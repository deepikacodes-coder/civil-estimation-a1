/**
 * CIVIL ESTIMATION A1 - Local Storage & Persistence Engine
 * Manages Saved Projects, Duplication, Favourites, Recent Tools, and Browser Storage Warnings.
 */

const StorageManager = {
  PROJECTS_KEY: 'civil_estimation_a1_projects',
  FAVOURITES_KEY: 'civil_estimation_a1_favourites',
  RECENT_KEY: 'civil_estimation_a1_recent',
  RECENT_TOOLS_KEY: 'civil_estimation_a1_recent_tools',

  init: function() {
    this.seedSampleProjectsIfEmpty();
    this.renderRecentProjectsHome();
  },

  // SEED SAMPLE PROJECTS
  seedSampleProjectsIfEmpty: function() {
    const existing = this.getProjects();
    if (existing.length === 0) {
      const samples = [
        {
          id: 'proj_sample_1',
          name: 'Green Villa 2BHK Residence',
          client: 'Mr. R. Rajesh',
          location: 'Coimbatore, Tamil Nadu',
          engineer: 'Er. S. Kumar & Team',
          status: 'Provisional',
          date: '2026-09-28',
          builtUpSqFt: 850,
          floors: 1,
          grandTotal: 1572500,
          planId: 'plan_2bhk'
        },
        {
          id: 'proj_sample_2',
          name: 'Royal Palms Duplex House',
          client: 'K. Mohanraj Builders',
          location: 'Salem Highway, TN',
          engineer: 'Civil Final Year Group A1',
          status: 'Draft',
          date: '2026-10-02',
          builtUpSqFt: 1250,
          floors: 2,
          grandTotal: 3450000,
          planId: 'plan_villa'
        }
      ];
      try {
        localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(samples));
      } catch (e) {
        console.warn('LocalStorage unavailable for seed data', e);
      }
    }
  },

  getProjects: function() {
    try {
      const data = localStorage.getItem(this.PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read projects from storage', e);
      return [];
    }
  },

  saveProject: function(name, client, location, engineer, status = 'Provisional') {
    const projects = this.getProjects();
    const boqTotals = (typeof BOQEngine !== 'undefined') ? BOQEngine.getTotals() : { grandTotal: 0 };
    const plan = (typeof PlanAnalyzer !== 'undefined' && PlanAnalyzer.activePlan) 
      ? PlanAnalyzer.activePlan 
      : ((typeof SamplePlans !== 'undefined' && SamplePlans.plans) ? SamplePlans.plans[0] : { id: 'plan_default', builtUpAreaSqFt: 1000 });
    const areaInput = document.getElementById('planAreaInput');
    const floorSelect = document.getElementById('planFloorsInput');

    const defaultName = (typeof ReportGenerator !== 'undefined' && ReportGenerator.projectDetails) ? ReportGenerator.projectDetails.projectName : 'New Construction Project';
    const defaultClient = (typeof ReportGenerator !== 'undefined' && ReportGenerator.projectDetails) ? ReportGenerator.projectDetails.clientName : 'Client';
    const defaultLoc = (typeof ReportGenerator !== 'undefined' && ReportGenerator.projectDetails) ? ReportGenerator.projectDetails.location : 'Project Site';
    const defaultEng = (typeof ReportGenerator !== 'undefined' && ReportGenerator.projectDetails) ? ReportGenerator.projectDetails.engineerName : 'Civil Estimator';

    const project = {
      id: 'proj_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      name: name || defaultName,
      client: client || defaultClient,
      location: location || defaultLoc,
      engineer: engineer || defaultEng,
      status: status,
      date: new Date().toISOString().split('T')[0],
      builtUpSqFt: parseFloat(areaInput ? areaInput.value : plan.builtUpAreaSqFt),
      floors: parseInt(floorSelect ? floorSelect.value : 1),
      grandTotal: boqTotals.grandTotal,
      planId: plan.id,
      boqItems: JSON.parse(JSON.stringify((typeof BOQEngine !== 'undefined' && BOQEngine.items) ? BOQEngine.items : [])),
      takeoff: JSON.parse(JSON.stringify((typeof PlanAnalyzer !== 'undefined' && PlanAnalyzer.currentTakeoff) ? PlanAnalyzer.currentTakeoff : {}))
    };

    projects.unshift(project);
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
      this.renderSavedProjectsList();
      this.renderRecentProjectsHome();
      if (typeof App !== 'undefined') App.showToast(`Project "${project.name}" saved successfully!`, 'success');
      return project;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        if (typeof App !== 'undefined') App.showToast('Browser storage limit exceeded! Please delete older projects.', 'danger');
      } else {
        if (typeof App !== 'undefined') App.showToast('Failed to save project to browser storage.', 'danger');
      }
      return null;
    }
  },

  duplicateProject: function(id) {
    const projects = this.getProjects();
    const original = projects.find(p => p.id === id);
    if (!original) return;

    const copy = JSON.parse(JSON.stringify(original));
    copy.id = 'proj_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    copy.name = `${original.name} (Copy)`;
    copy.date = new Date().toISOString().split('T')[0];
    copy.status = 'Draft';

    projects.unshift(copy);
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
      this.renderSavedProjectsList();
      this.renderRecentProjectsHome();
      if (typeof App !== 'undefined') App.showToast(`Duplicated project: "${copy.name}"`, 'success');
    } catch (e) {
      if (typeof App !== 'undefined') App.showToast('Failed to duplicate project: Storage full.', 'danger');
    }
  },

  loadProject: function(id) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return;

    // Restore details
    ReportGenerator.projectDetails.projectName = project.name;
    ReportGenerator.projectDetails.clientName = project.client;
    ReportGenerator.projectDetails.location = project.location;
    ReportGenerator.projectDetails.engineerName = project.engineer;

    if (project.planId) {
      PlanAnalyzer.loadSamplePlan(project.planId);
      const presetSelect = document.getElementById('presetPlanSelect');
      if (presetSelect) presetSelect.value = project.planId;
    }
    if (project.builtUpSqFt) {
      const areaEl = document.getElementById('planAreaInput');
      if (areaEl) areaEl.value = project.builtUpSqFt;
    }
    if (project.floors) {
      const flrEl = document.getElementById('planFloorsInput');
      if (flrEl) flrEl.value = project.floors;
    }

    if (project.takeoff && project.takeoff.quantities) {
      PlanAnalyzer.currentTakeoff = project.takeoff;
      PlanAnalyzer.renderTakeoffUI();
    } else {
      PlanAnalyzer.generateTakeoff();
    }

    if (project.boqItems && project.boqItems.length > 0) {
      BOQEngine.items = project.boqItems;
      BOQEngine.render();
    } else if (PlanAnalyzer.currentTakeoff) {
      BOQEngine.importFromPlanTakeoff(PlanAnalyzer.currentTakeoff);
    }

    ReportGenerator.render();
    if (typeof App !== 'undefined') {
      App.switchTab('plan');
      App.showToast(`Loaded project: ${project.name}`, 'info');
    }
  },

  deleteProject: function(id) {
    if (typeof confirm !== 'undefined' && !confirm('Are you sure you want to delete this saved project? This action cannot be undone.')) {
      return;
    }
    let projects = this.getProjects();
    projects = projects.filter(p => p.id !== id);
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
      this.renderSavedProjectsList();
      this.renderRecentProjectsHome();
      if (typeof App !== 'undefined') App.showToast('Project deleted successfully.', 'info');
    } catch (e) {
      console.error(e);
    }
  },

  renderRecentProjectsHome: function() {
    const container = document.getElementById('quickRecentProjects');
    if (!container) return;

    const projects = this.getProjects().slice(0, 2);
    if (projects.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-4 bg-white border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
          No recent projects found. Save an estimate to view it here.
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(p => `
      <div class="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-primary transition" onclick="StorageManager.loadProject('${p.id}')">
        <div>
          <div class="flex items-center gap-1.5">
            <h4 class="font-bold text-sm text-slate-800">${p.name}</h4>
            <span class="badge ${p.status === 'Verified' ? 'badge-success' : 'badge-unit'}">${p.status || 'Draft'}</span>
          </div>
          <p class="text-xs text-slate-500">${p.builtUpSqFt} sq.ft ${p.floors > 1 ? `(${p.floors} Flr)` : ''} • ${p.location}</p>
        </div>
        <span class="font-mono font-bold text-sm text-primary">₹ ${p.grandTotal ? p.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}</span>
      </div>
    `).join('');
  },

  renderSavedProjectsList: function(filterQuery = '') {
    const container = document.getElementById('savedProjectsGrid');
    if (!container) return;

    let projects = this.getProjects();
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.client && p.client.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q))
      );
    }

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
          <div class="text-4xl mb-2">📁</div>
          <div class="font-semibold text-slate-700">No Projects Found</div>
          <p class="text-xs text-slate-400 mt-1">Run an estimate and click "Save Project" to store your work locally.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(p => `
      <div class="project-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="badge badge-unit">${p.date}</span>
              <span class="badge ${p.status === 'Verified' ? 'badge-success' : 'badge-warning'}">${p.status || 'Draft'}</span>
            </div>
            <h3 class="font-bold text-slate-900 text-base mt-1">${p.name}</h3>
            <p class="text-xs text-slate-500">Client: ${p.client || 'Owner'} • ${p.location || 'Site'}</p>
          </div>
          <div class="flex items-center gap-1">
            <button class="btn-icon hover:bg-slate-100" onclick="StorageManager.duplicateProject('${p.id}')" title="Duplicate Project">📑</button>
            <button class="btn-icon text-red-500 hover:bg-red-50" onclick="StorageManager.deleteProject('${p.id}')" title="Delete Project">🗑️</button>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-400 block">Total Built-up</span>
            <span class="font-semibold text-sm text-slate-700">${p.builtUpSqFt} sq.ft (${p.floors} flr)</span>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-400 block">Estimate Total</span>
            <span class="font-mono font-bold text-base text-primary">₹ ${p.grandTotal ? p.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}</span>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="btn btn-sm btn-outline flex-1" onclick="StorageManager.loadProject('${p.id}')">📂 Reopen Project</button>
          <button class="btn btn-sm btn-primary flex-1" onclick="StorageManager.loadProject('${p.id}'); ReportGenerator.generateReport();">📄 Generate Report</button>
        </div>
      </div>
    `).join('');
  },

  // FAVOURITES MANAGEMENT
  getFavourites: function() {
    try {
      const data = localStorage.getItem(this.FAVOURITES_KEY);
      return data ? JSON.parse(data) : ['calc_cost', 'calc_concrete', 'calc_steel'];
    } catch (e) {
      return ['calc_cost', 'calc_concrete', 'calc_steel'];
    }
  },

  toggleFavourite: function(toolId) {
    let favs = this.getFavourites();
    if (favs.includes(toolId)) {
      favs = favs.filter(id => id !== toolId);
      if (typeof App !== 'undefined') App.showToast('Removed from favourites', 'info');
    } else {
      favs.push(toolId);
      if (typeof App !== 'undefined') App.showToast('Added to favourites ⭐', 'success');
    }
    try {
      localStorage.setItem(this.FAVOURITES_KEY, JSON.stringify(favs));
    } catch (e) {}
    if (typeof App !== 'undefined') App.updateFavouritesUI();
  },

  isFavourite: function(toolId) {
    return this.getFavourites().includes(toolId);
  },

  // RECENT TOOLS TRACKING
  addRecentTool: function(toolId) {
    try {
      let recents = this.getRecentTools();
      recents = recents.filter(id => id !== toolId);
      recents.unshift(toolId);
      if (recents.length > 5) recents.pop();
      localStorage.setItem(this.RECENT_TOOLS_KEY, JSON.stringify(recents));
    } catch (e) {}
  },

  getRecentTools: function() {
    try {
      const data = localStorage.getItem(this.RECENT_TOOLS_KEY);
      return data ? JSON.parse(data) : ['calc_cost', 'calc_concrete'];
    } catch (e) {
      return ['calc_cost', 'calc_concrete'];
    }
  }
};

if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
