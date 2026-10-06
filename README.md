# CIVIL ESTIMATION A1
## 2D Building Plan Upload & AI-Based Estimation
### Final-Year Academic Project Prototype

---

## 🌟 Overview
**CIVIL ESTIMATION A1** is a Civil Engineering digital estimation application featuring:
1. **2D Building Plan Upload & AI Takeoff Engine** (supporting JPG, JPEG, PNG, and PDF).
2. **Interactive Computer Vision (CV) Pipeline** (Image cleanup, binarization, Canny edge detection, room polygon segmentation, and scale calibration).
3. **12+ Civil Engineering Quantity & Cost Calculators** (Concrete IS 456, Brickwork IS 2212, Plaster IS 1200, Steel Rebar BBS, Flooring, Paint, Excavation, Openings, Roof, Geometry, and Unit Converter).
4. **Dynamic Bill of Quantities (BOQ)** with real-time rate customization, GST, contingencies, and CSV/Excel export.
5. **A4-Formatted Estimate Report & PDF Generator** with engineering stamps, cost breakdown charts, and assumptions.
6. **Project Persistence** using browser LocalStorage (Save, Reopen, Delete, Seeded sample projects).
7. **Mobile-App-Style Responsive Web UI** (2-column mobile grid, desktop grid, fixed header, category pills, search bar, and bottom navigation).

---

## 🚀 How to Run the Application

### Option 1: One-Click Browser Launch via Python
Open a terminal in this directory and execute:
```bash
python run_server.py
```
This automatically launches a local web server at `http://localhost:8080/index.html` and opens your default web browser.

### Option 2: Direct File Open
You can also directly double-click or open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Firefox):
```text
file:///C:/Users/Deepika/Desktop/nutilens/civil_estimation_a1/index.html
```

---

## 🏗️ Technical Architecture & Modules

```
civil_estimation_a1/
├── index.html                 # Mobile-app-style responsive interface & modals
├── run_server.py              # Lightweight local server runner
├── README.md                  # Project documentation & formula reference
├── css/
│   └── styles.css             # Theme stylesheet, mobile grids, print styles for A4 PDF
└── js/
    ├── app.js                 # App controller, search, categories, modals, notifications
    ├── calculators.js         # 12 Civil engineering calculators (IS 456, IS 1200, CPWD)
    ├── sample_plans.js        # Architectural CAD floor plans (2BHK, Duplex Villa, Studio)
    ├── plan_analyzer.js       # 2D Plan upload, canvas rendering, CV filters, scale tool
    ├── boq_engine.js          # Bill of Quantities generator, rates, totals, CSV export
    ├── report_generator.js    # A4 printable estimate report & PDF export
    └── storage.js             # LocalStorage manager for saved projects and favourites
```

---

## 📐 Civil Engineering Formulas Implemented

### 1. Concrete Mix Design (IS 456:2000)
- **Wet Volume:** $V_{\text{wet}} = L \times W \times D$
- **Dry Volume:** $V_{\text{dry}} = V_{\text{wet}} \times 1.54$ (Standard 54% allowance for dry ingredients)
- **Nominal Mix Proportions:**
  - **M7.5:** 1 : 4 : 8
  - **M10:** 1 : 3 : 6
  - **M15:** 1 : 2 : 4
  - **M20:** 1 : 1.5 : 3 (Total Parts = 5.5)
  - **M25:** 1 : 1 : 2 (Total Parts = 4.0)
- **Cement Bags (50kg):** $\lceil (V_{\text{dry}} \times (\text{Cement Part} / \text{Total Parts}) \times 1440) / 50 \rceil$
- **Fine Sand:** $V_{\text{dry}} \times (\text{Sand Part} / \text{Total Parts}) \text{ m}^3$ (or $\times 35.3147 \text{ cu.ft}$)
- **Coarse Aggregate:** $V_{\text{dry}} \times (\text{Agg Part} / \text{Total Parts}) \text{ m}^3$ (or $\times 35.3147 \text{ cu.ft}$)

### 2. Brickwork & Mortar (IS 2212 / IS 1200)
- **Standard Modular Brick:** $190 \times 90 \times 90 \text{ mm}$ (Nominal with mortar: $200 \times 100 \times 100 \text{ mm}$)
- **Bricks per $\text{m}^3$:** $\approx 500 \text{ bricks} + 5\% \text{ wastage} = 525 \text{ bricks}$
- **Wet Mortar Volume:** $30\%$ of wall volume
- **Dry Mortar Volume:** $\text{Wet Mortar} \times 1.33$
- **Mortar Mix:** 1:6 or 1:4 cement mortar calculations.

### 3. Plastering (IS 1661 / IS 1200 Part 12)
- **Dry Volume:** $\text{Wet Volume} \times 1.56$ (adds 20% for joint filling + 30% for dry bulk volume)
- **Mix Ratio:** 1:4 (Internal 12mm) and 1:6 (External 15-20mm).

### 4. Reinforcement Steel
- **Thumb Rule Percentage:**
  - Slab: $1.0\%$ of concrete volume ($\approx 80 \text{ kg/m}^3$)
  - Beam: $1.8\%$ of concrete volume ($\approx 140 \text{ kg/m}^3$)
  - Column: $2.5\%$ of concrete volume ($\approx 200 \text{ kg/m}^3$)
  - Footing: $0.7\%$ of concrete volume ($\approx 55 \text{ kg/m}^3$)
- **Bar Bending Schedule Formula:** Unit weight = $D^2 / 162.28 \text{ kg/m}$ (where $D$ is rebar diameter in mm).

### 5. Cost Distribution Norms
- **Civil & Structural:** $52\%$
- **Finishes & Flooring:** $22\%$
- **MEP Services (Electrical, Plumbing):** $16\%$
- **Openings & Fixtures:** $10\%$

---

## ⚠️ Academic Disclaimer (Section 17)
This application is an **academic software prototype**. Quantities, rates, and cost outputs must be verified against project-specific drawings, structural designs, soil conditions, and the latest local Schedule of Rates (SOR) before being used for actual construction or contractual tendering.
