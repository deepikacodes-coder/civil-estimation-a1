/**
 * CIVIL ESTIMATION A1 - Civil Engineering Calculators Engine
 * Standard-compliant engineering equations (IS 456:2000, IS 1200, IS 2212, CPWD)
 * Centralized calculation utilities with rigorous input validation and documented assumptions.
 */

const CivilCalculators = {

  // Default parameters for Reset functionality
  defaults: {
    calc_cost: { areaSqFt: 1000, floors: 1, qualityType: 'standard', locationFactor: 1.0 },
    calc_brick: { wallLengthM: 10, wallHeightM: 3, wallThicknessMm: 230, mortarRatio: '1:6', brickType: 'modular' },
    calc_plaster: { plasterAreaSqM: 100, thicknessMm: 12, mixRatio: '1:4' },
    calc_concrete: { volumeM3: 5.0, grade: 'M20', dryFactor: 1.54 },
    calc_steel: { concreteVolumeM3: 5.0, memberType: 'slab', diameterMm: 12, lengthM: 12, barCount: 10 },
    calc_batch: { dryVolumeM3: 1.0, partCement: 1, partSand: 2, partAgg: 4 },
    calc_flooring: { floorAreaSqM: 50, tileWidthMm: 600, tileLengthMm: 600, wastagePct: 8 },
    calc_painting: { surfaceAreaSqM: 150, paintType: 'interior_emulsion', coats: 2 },
    calc_excavation: { lengthM: 10, widthM: 1.2, depthM: 1.5, soilBulkingPct: 25 },
    calc_openings: { doorsCount: 4, windowsCount: 4, ventCount: 2 },
    calc_roof: { planLengthM: 10, planWidthM: 8, roofType: 'pitched', pitchDegrees: 20, overhangM: 0.45 },
    calc_geometry: { shape: 'trapezoidal_footing', p1: 4.0, p2: 1.0, p3: 0.6 },
    calc_unit: { value: 100, type: 'area', fromUnit: 'sqft', toUnit: 'sqm' }
  },

  // 1. CONSTRUCTION COST CALCULATOR
  calculateConstructionCost: function(areaSqFt, floors = 1, qualityType = 'standard', locationFactor = 1.0) {
    areaSqFt = Math.max(0, parseFloat(areaSqFt) || 0);
    floors = Math.max(1, parseInt(floors) || 1);
    locationFactor = Math.max(0.1, parseFloat(locationFactor) || 1.0);

    const baseRates = {
      'basic': 1400,    // ₹1,400 per sq.ft (Basic finish, red brick, standard vitrified)
      'standard': 1850, // ₹1,850 per sq.ft (M20 concrete, 600x600 tiles, branded fittings)
      'premium': 2500,  // ₹2,500 per sq.ft (High-end finishes, teakwood, premium CP, Italian marble)
      'luxury': 3400    // ₹3,400 per sq.ft (Architect-designed, imported finishes, automation)
    };

    const ratePerSqFt = (baseRates[qualityType] || 1850) * locationFactor;
    const totalBuiltUpArea = areaSqFt * floors;
    const totalCost = totalBuiltUpArea * ratePerSqFt;

    // Standard Civil Cost Breakdown:
    // Structure: 52% (Civil, Foundation, RCC, Masonry)
    // Finishes: 22% (Flooring, Plaster, Paint, False Ceiling)
    // MEP (Mechanical, Electrical, Plumbing): 16%
    // Doors, Windows & Fixtures: 10%
    return {
      areaSqFt: areaSqFt,
      floors: floors,
      totalBuiltUpArea: totalBuiltUpArea,
      ratePerSqFt: ratePerSqFt,
      totalCost: totalCost,
      breakdown: {
        structure: totalCost * 0.52,
        finishes: totalCost * 0.22,
        mep: totalCost * 0.16,
        fixtures: totalCost * 0.10
      },
      assumptions: 'Based on CPWD Plinth Area Rates and prevailing residential construction indexes. Actual cost varies by site topography, soil conditions, and structural specifications.'
    };
  },

  // 2. BRICKWORK CALCULATOR (IS 2212)
  calculateBrickwork: function(wallLengthM, wallHeightM, wallThicknessMm = 230, mortarRatio = '1:6', brickType = 'modular') {
    wallLengthM = Math.max(0, parseFloat(wallLengthM) || 0);
    wallHeightM = Math.max(0, parseFloat(wallHeightM) || 0);
    const thicknessM = Math.max(0.05, (parseFloat(wallThicknessMm) || 230) / 1000);

    const wallVolumeM3 = wallLengthM * wallHeightM * thicknessM;

    // Modular brick: 190 x 90 x 90 mm; with mortar 200 x 100 x 100 mm -> 500 bricks / m³
    // Traditional brick: 229 x 114 x 76 mm -> 490 bricks / m³
    const bricksPerM3 = brickType === 'traditional' ? 490 : 500;
    const totalBricks = Math.ceil(wallVolumeM3 * bricksPerM3 * 1.05); // +5% wastage allowance

    // Mortar volume: ~30% of brickwork wet volume
    const wetMortarM3 = wallVolumeM3 * 0.30;
    const dryMortarM3 = wetMortarM3 * 1.33; // 33% increase for dry mix void filling

    // Mix ratios
    let cementPart = 1;
    let sandPart = 6;
    if (mortarRatio === '1:3') sandPart = 3;
    else if (mortarRatio === '1:4') sandPart = 4;
    else if (mortarRatio === '1:5') sandPart = 5;

    const totalParts = cementPart + sandPart;
    const cementM3 = (dryMortarM3 * cementPart) / totalParts;
    const sandM3 = (dryMortarM3 * sandPart) / totalParts;

    // Density of cement = 1440 kg/m³. 1 bag = 50 kg
    const cementBags = Math.ceil((cementM3 * 1440) / 50);
    const sandCft = sandM3 * 35.3147;

    return {
      wallVolumeM3: wallVolumeM3,
      totalBricks: totalBricks,
      wetMortarM3: wetMortarM3,
      dryMortarM3: dryMortarM3,
      cementBags: cementBags,
      sandM3: sandM3,
      sandCft: sandCft,
      assumptions: 'Modular brick dimensions: 190×90×90 mm (200×100×100 mm with mortar) per IS 2212. Includes 5% wastage and 33% dry mortar void factor.'
    };
  },

  // 3. PLASTER CALCULATOR (IS 1200 Part 12)
  calculatePlaster: function(plasterAreaSqM, thicknessMm = 12, mixRatio = '1:4') {
    plasterAreaSqM = Math.max(0, parseFloat(plasterAreaSqM) || 0);
    const thicknessM = Math.max(0.005, (parseFloat(thicknessMm) || 12) / 1000);

    const wetVolumeM3 = plasterAreaSqM * thicknessM;
    // Add 20% for masonry joints/grooves and 30% for dry bulk volume -> 1.20 × 1.30 ≈ 1.56 dry factor
    const dryVolumeM3 = wetVolumeM3 * 1.56;

    let cementPart = 1;
    let sandPart = 4;
    if (mixRatio === '1:3') sandPart = 3;
    else if (mixRatio === '1:5') sandPart = 5;
    else if (mixRatio === '1:6') sandPart = 6;

    const totalParts = cementPart + sandPart;
    const cementM3 = (dryVolumeM3 * cementPart) / totalParts;
    const sandM3 = (dryVolumeM3 * sandPart) / totalParts;

    const cementBags = Math.ceil((cementM3 * 1440) / 50);
    const sandCft = sandM3 * 35.3147;

    return {
      areaSqM: plasterAreaSqM,
      areaSqFt: plasterAreaSqM * 10.7639,
      wetVolumeM3: wetVolumeM3,
      dryVolumeM3: dryVolumeM3,
      cementBags: cementBags,
      sandM3: sandM3,
      sandCft: sandCft,
      assumptions: 'Dry volume coefficient 1.56 accounts for mortar filling masonry unevenness (20%) and dry aggregate void consolidation (30%) as per CPWD specifications.'
    };
  },

  // 4. CONCRETE CALCULATOR (IS 456:2000)
  calculateConcrete: function(volumeM3, grade = 'M20', dryFactor = 1.54) {
    volumeM3 = Math.max(0, parseFloat(volumeM3) || 0);
    dryFactor = Math.max(1.0, parseFloat(dryFactor) || 1.54);

    const dryVolumeM3 = volumeM3 * dryFactor;

    // Nominal Mix Proportions [Cement, Sand, Coarse Aggregate, W/C ratio]
    const gradeRatios = {
      'M7.5': { c: 1, s: 4, a: 8, wc: 0.55 },
      'M10':  { c: 1, s: 3, a: 6, wc: 0.55 },
      'M15':  { c: 1, s: 2, a: 4, wc: 0.50 },
      'M20':  { c: 1, s: 1.5, a: 3, wc: 0.45 },
      'M25':  { c: 1, s: 1, a: 2, wc: 0.40 }
    };

    const ratio = gradeRatios[grade] || gradeRatios['M20'];
    const totalParts = ratio.c + ratio.s + ratio.a;

    const cementVolM3 = (dryVolumeM3 * ratio.c) / totalParts;
    const sandVolM3 = (dryVolumeM3 * ratio.s) / totalParts;
    const aggVolM3 = (dryVolumeM3 * ratio.a) / totalParts;

    const cementBags = Math.ceil((cementVolM3 * 1440) / 50);
    const sandCft = sandVolM3 * 35.3147;
    const aggCft = aggVolM3 * 35.3147;
    const waterLiters = cementBags * 50 * ratio.wc;

    return {
      wetVolumeM3: volumeM3,
      dryVolumeM3: dryVolumeM3,
      grade: grade,
      cementBags: cementBags,
      sandM3: sandVolM3,
      sandCft: sandCft,
      aggM3: aggVolM3,
      aggCft: aggCft,
      waterLiters: Math.round(waterLiters),
      assumptions: 'IS 456 nominal mix proportions with 54% dry bulking allowance. Concrete for multi-storey frames must be verified with formal laboratory mix design (IS 10262).'
    };
  },

  // 5. STEEL QUANTITY & REBAR CALCULATOR (IS 456 & BBS)
  calculateSteelByVolume: function(concreteVolumeM3, memberType = 'slab') {
    concreteVolumeM3 = Math.max(0, parseFloat(concreteVolumeM3) || 0);

    // Standard structural percentages of concrete volume (density 7850 kg/m³)
    const percentages = {
      'slab': 1.0,     // 0.8% - 1.0% (~80 kg/m³)
      'beam': 1.8,     // 1.5% - 2.0% (~140 kg/m³)
      'column': 2.5,   // 2.0% - 3.0% (~200 kg/m³)
      'footing': 0.7,  // 0.6% - 0.8% (~55 kg/m³)
      'overall': 1.25  // Residential average (~100 kg/m³)
    };

    const p = percentages[memberType] || 1.0;
    const steelVolumeM3 = concreteVolumeM3 * (p / 100);
    const totalSteelKg = steelVolumeM3 * 7850;
    const totalSteelTon = totalSteelKg / 1000;

    return {
      concreteVolumeM3: concreteVolumeM3,
      memberType: memberType,
      percentage: p,
      totalSteelKg: totalSteelKg,
      totalSteelTon: totalSteelTon,
      assumptions: 'Standard IS 456 thumb rules. Steel density = 7,850 kg/m³. Actual rebar must follow structural engineering drawings and Bar Bending Schedule (BBS).'
    };
  },

  calculateRebarWeight: function(diameterMm, lengthM, barCount = 1) {
    diameterMm = Math.max(0, parseFloat(diameterMm) || 0);
    lengthM = Math.max(0, parseFloat(lengthM) || 0);
    barCount = Math.max(1, parseInt(barCount) || 1);

    // Unit weight = D² / 162.28 kg/m
    const unitWeightKgPerM = (diameterMm * diameterMm) / 162.28;
    const singleBarWeightKg = unitWeightKgPerM * lengthM;
    const totalWeightKg = singleBarWeightKg * barCount;

    return {
      diameterMm: diameterMm,
      lengthM: lengthM,
      barCount: barCount,
      unitWeightKgPerM: unitWeightKgPerM,
      totalWeightKg: totalWeightKg,
      assumptions: 'Standard formula W = D² / 162.28 kg per meter derived from steel density (7850 kg/m³).'
    };
  },

  // 6. CEMENT / SAND / AGGREGATE BATCH MIX
  calculateCustomBatch: function(dryVolumeM3, partCement = 1, partSand = 2, partAgg = 4) {
    dryVolumeM3 = Math.max(0, parseFloat(dryVolumeM3) || 0);
    partCement = Math.max(0.1, parseFloat(partCement) || 1);
    partSand = Math.max(0, parseFloat(partSand) || 2);
    partAgg = Math.max(0, parseFloat(partAgg) || 4);

    const totalParts = partCement + partSand + partAgg;
    const cementVol = (dryVolumeM3 * partCement) / totalParts;
    const sandVol = (dryVolumeM3 * partSand) / totalParts;
    const aggVol = (dryVolumeM3 * partAgg) / totalParts;

    const cementBags = Math.ceil((cementVol * 1440) / 50);
    return {
      dryVolumeM3: dryVolumeM3,
      cementBags: cementBags,
      sandM3: sandVol,
      sandCft: sandVol * 35.3147,
      aggM3: aggVol,
      aggCft: aggVol * 35.3147,
      assumptions: 'Volumetric batch proportioning. Cement density taken as 1440 kg/m³ (50 kg per bag).'
    };
  },

  // 7. FLOORING CALCULATOR
  calculateFlooring: function(floorAreaSqM, tileWidthMm = 600, tileLengthMm = 600, wastagePct = 8) {
    floorAreaSqM = Math.max(0, parseFloat(floorAreaSqM) || 0);
    tileWidthMm = Math.max(50, parseFloat(tileWidthMm) || 600);
    tileLengthMm = Math.max(50, parseFloat(tileLengthMm) || 600);
    wastagePct = Math.max(0, parseFloat(wastagePct) || 8);

    const tileAreaSqM = (tileWidthMm / 1000) * (tileLengthMm / 1000);
    const netTiles = tileAreaSqM > 0 ? (floorAreaSqM / tileAreaSqM) : 0;
    const grossTiles = Math.ceil(netTiles * (1 + wastagePct / 100));

    // Bedding mortar: 25mm thickness 1:4 mix
    const mortarWetVolM3 = floorAreaSqM * 0.025;
    const mortarDryVolM3 = mortarWetVolM3 * 1.33;
    const cementBags = Math.ceil((mortarDryVolM3 * 0.2 * 1440) / 50);
    const sandCft = (mortarDryVolM3 * 0.8) * 35.3147;

    return {
      floorAreaSqM: floorAreaSqM,
      floorAreaSqFt: floorAreaSqM * 10.7639,
      tileAreaSqM: tileAreaSqM,
      netTiles: Math.ceil(netTiles),
      grossTiles: grossTiles,
      wastagePct: wastagePct,
      cementBags: cementBags,
      sandCft: sandCft,
      assumptions: 'Includes 25mm bedding mortar in CM 1:4 and user-specified tile perimeter cutting wastage (default 8%).'
    };
  },

  // 8. PAINTING CALCULATOR
  calculatePainting: function(surfaceAreaSqM, paintType = 'interior_emulsion', coats = 2) {
    surfaceAreaSqM = Math.max(0, parseFloat(surfaceAreaSqM) || 0);
    coats = Math.max(1, parseInt(coats) || 2);

    const surfaceAreaSqFt = surfaceAreaSqM * 10.7639;

    // Standard practical coverage rates:
    // Primer: ~120 sq.ft / L
    // Interior Emulsion (2 coats): ~65 sq.ft / L
    // Exterior Emulsion (2 coats): ~55 sq.ft / L
    // Wall Putty (2 coats): ~12 sq.ft / kg
    const primerLiters = Math.ceil(surfaceAreaSqFt / 120);
    const paintCoverage = paintType === 'exterior_emulsion' ? 55 : 65;
    const paintLiters = Math.ceil((surfaceAreaSqFt / paintCoverage) * (coats / 2));
    const puttyKg = Math.ceil(surfaceAreaSqFt / 12);

    return {
      surfaceAreaSqM: surfaceAreaSqM,
      surfaceAreaSqFt: surfaceAreaSqFt,
      primerLiters: primerLiters,
      paintLiters: paintLiters,
      puttyKg: puttyKg,
      coats: coats,
      assumptions: 'Coverage estimates based on smooth plastered surface prepared with 2 coats of wall putty and 1 coat water-based primer.'
    };
  },

  // 9. EXCAVATION & EARTHWORK CALCULATOR
  calculateExcavation: function(lengthM, widthM, depthM, soilBulkingPct = 25) {
    lengthM = Math.max(0, parseFloat(lengthM) || 0);
    widthM = Math.max(0, parseFloat(widthM) || 0);
    depthM = Math.max(0, parseFloat(depthM) || 0);
    soilBulkingPct = Math.max(0, parseFloat(soilBulkingPct) || 25);

    const netVolumeM3 = lengthM * widthM * depthM;
    const bulkedVolumeM3 = netVolumeM3 * (1 + soilBulkingPct / 100);

    // 1 Brass = 100 cu.ft = 2.8317 m³
    const netVolumeCft = netVolumeM3 * 35.3147;
    const brass = netVolumeCft / 100;

    // Typical dump truck / tipper = 6 m³ capacity
    const truckLoads = Math.ceil(bulkedVolumeM3 / 6);

    return {
      netVolumeM3: netVolumeM3,
      bulkedVolumeM3: bulkedVolumeM3,
      netVolumeCft: netVolumeCft,
      brass: brass,
      truckLoads: truckLoads,
      assumptions: 'Earth excavation in ordinary soil as per IS 1200 Part 1. Soil expansion/bulking factor taken as 25% for truck haulage.'
    };
  },

  // 10. DOOR & WINDOW CALCULATOR
  calculateOpenings: function(doorsCount, windowsCount, ventCount = 0) {
    doorsCount = Math.max(0, parseInt(doorsCount) || 0);
    windowsCount = Math.max(0, parseInt(windowsCount) || 0);
    ventCount = Math.max(0, parseInt(ventCount) || 0);

    // Standard residential opening sizes:
    // Door D1: 2.1m × 0.9m = 1.89 m²
    // Window W1: 1.2m × 1.2m = 1.44 m²
    // Ventilator V: 0.6m × 0.6m = 0.36 m²
    const doorAreaM2 = doorsCount * 1.89;
    const windowAreaM2 = windowsCount * 1.44;
    const ventAreaM2 = ventCount * 0.36;
    const totalDeductionM2 = doorAreaM2 + windowAreaM2 + ventAreaM2;

    // Frame timber volume: Door frame ~0.065 m³, Window frame ~0.045 m³
    const frameWoodM3 = (doorsCount * 0.065) + (windowsCount * 0.045);
    const frameWoodCft = frameWoodM3 * 35.3147;

    return {
      doorsCount: doorsCount,
      windowsCount: windowsCount,
      ventCount: ventCount,
      totalOpenings: doorsCount + windowsCount + ventCount,
      totalDeductionM2: totalDeductionM2,
      frameWoodM3: frameWoodM3,
      frameWoodCft: frameWoodCft,
      assumptions: 'Deductions calculated in accordance with IS 1200 Part 3 (no deduction for openings < 0.5 m²; full deduction for doors and standard windows).'
    };
  },

  // 11. ROOF AREA & PITCH CALCULATOR
  calculateRoof: function(planLengthM, planWidthM, roofType = 'flat', pitchDegrees = 20, overhangM = 0.45) {
    planLengthM = Math.max(0, parseFloat(planLengthM) || 0);
    planWidthM = Math.max(0, parseFloat(planWidthM) || 0);
    overhangM = Math.max(0, parseFloat(overhangM) || 0.45);
    pitchDegrees = Math.max(0, Math.min(85, parseFloat(pitchDegrees) || 20));

    const extLength = planLengthM + (2 * overhangM);
    const extWidth = planWidthM + (2 * overhangM);
    const projectedPlanAreaM2 = extLength * extWidth;

    let trueRoofAreaM2 = projectedPlanAreaM2;
    let ridgeLengthM = 0;

    if (roofType === 'pitched') {
      const pitchRad = (pitchDegrees * Math.PI) / 180;
      trueRoofAreaM2 = projectedPlanAreaM2 / Math.cos(pitchRad);
      ridgeLengthM = extLength;
    }

    // Corrugated roofing sheet or clay tile allowance (Standard sheet ~ 3.0m × 1.0m with overlap = 2.4 m²)
    const sheetsCount = Math.ceil(trueRoofAreaM2 / 2.4);

    return {
      projectedPlanAreaM2: projectedPlanAreaM2,
      trueRoofAreaM2: trueRoofAreaM2,
      trueRoofAreaSqFt: trueRoofAreaM2 * 10.7639,
      ridgeLengthM: ridgeLengthM,
      sheetsCount: sheetsCount,
      roofType: roofType,
      assumptions: 'Geometric slope formula True Area = Projected Area / cos(pitch). Overhang added to both eaves.'
    };
  },

  // 12. AREA & VOLUME QUICK GEOMETRY
  calculateGeometry: function(shape, p1, p2, p3) {
    p1 = Math.max(0, parseFloat(p1) || 0);
    p2 = Math.max(0, parseFloat(p2) || 0);
    p3 = Math.max(0, parseFloat(p3) || 0);

    let area = 0;
    let volume = 0;

    switch (shape) {
      case 'rectangle':
        area = p1 * p2;
        volume = p1 * p2 * p3;
        break;
      case 'trapezoid': // p1 = a, p2 = b, p3 = h
        area = ((p1 + p2) / 2) * p3;
        volume = 0;
        break;
      case 'circle': // p1 = radius, p2 = height
        area = Math.PI * p1 * p1;
        volume = area * p2;
        break;
      case 'trapezoidal_footing': // Frustum: p1 = Bottom Area A1, p2 = Top Area A2, p3 = Height H
        // V = (H / 3) * (A1 + A2 + sqrt(A1 * A2))
        area = (p1 + p2) / 2;
        volume = (p3 / 3) * (p1 + p2 + Math.sqrt(p1 * p2));
        break;
    }

    return {
      area: area,
      volume: volume,
      assumptions: shape === 'trapezoidal_footing' 
        ? 'Prismoidal formula for truncated pyramid footing: V = (h/3) × (A₁ + A₂ + √(A₁ × A₂)).'
        : 'Standard Euclidean mensuration geometry.'
    };
  },

  // 13. CIVIL UNIT CONVERTER
  convertUnits: function(value, type, fromUnit, toUnit) {
    value = parseFloat(value) || 0;
    if (fromUnit === toUnit) return value;

    // Conversion factors to Base SI Unit
    const factors = {
      length: {
        'm': 1,
        'ft': 0.3048,
        'inch': 0.0254,
        'mm': 0.001,
        'cm': 0.01,
        'yd': 0.9144
      },
      area: {
        'sqm': 1,
        'sqft': 0.092903,
        'sqyd': 0.836127,
        'brass': 9.2903,   // 1 brass = 100 sq.ft
        'cent': 40.4686,   // 1 cent = 435.6 sq.ft
        'guntha': 101.17,  // 1 guntha = 1089 sq.ft
        'acre': 4046.86,
        'hectare': 10000
      },
      volume: {
        'cum': 1,
        'cuft': 0.0283168,
        'liter': 0.001,
        'brass': 2.83168,  // 1 brass = 100 cu.ft
        'gallon': 0.00378541
      },
      weight: {
        'kg': 1,
        'ton': 1000,
        'quintal': 100,
        'lb': 0.453592
      },
      pressure: {
        'mpa': 1,
        'nmm2': 1,
        'knm2': 0.001,
        'psi': 0.00689476,
        'bar': 0.1
      }
    };

    const group = factors[type];
    if (!group || !group[fromUnit] || !group[toUnit]) return value;

    const valueInBase = value * group[fromUnit];
    return valueInBase / group[toUnit];
  }
};

if (typeof window !== 'undefined') {
  window.CivilCalculators = CivilCalculators;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CivilCalculators;
}
