/**
 * CIVIL ESTIMATION A1 - Civil Engineering Calculators Engine
 * Standard-compliant engineering equations (IS 456:2000, IS 1200, IS 2212, CPWD)
 */

const CivilCalculators = {

  // 1. CONSTRUCTION COST CALCULATOR
  calculateConstructionCost: function(areaSqFt, floors = 1, qualityType = 'standard', locationFactor = 1.0) {
    areaSqFt = parseFloat(areaSqFt) || 0;
    floors = parseInt(floors) || 1;
    locationFactor = parseFloat(locationFactor) || 1.0;

    const baseRates = {
      'basic': 1400,    // ₹1,400 per sq.ft (Basic finish, red brick, standard vitrified)
      'standard': 1850, // ₹1,850 per sq.ft (M20 concrete, 600x600 tiles, branded fittings)
      'premium': 2500,  // ₹2,500 per sq.ft (High-end finishes, teakwood, premium CP, Italian marble)
      'luxury': 3400    // ₹3,400 per sq.ft (Architect-designed, imported finishes, automation)
    };

    const ratePerSqFt = (baseRates[qualityType] || 1850) * locationFactor;
    const totalBuiltUpArea = areaSqFt * floors;
    const totalCost = totalBuiltUpArea * ratePerSqFt;

    // Standard Civil Breakdown:
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
      }
    };
  },

  // 2. BRICKWORK & PLASTER CALCULATOR
  calculateBrickwork: function(wallLengthM, wallHeightM, wallThicknessMm = 230, mortarRatio = '1:6', brickType = 'modular') {
    wallLengthM = parseFloat(wallLengthM) || 0;
    wallHeightM = parseFloat(wallHeightM) || 0;
    const thicknessM = (parseFloat(wallThicknessMm) || 230) / 1000;

    const wallVolumeM3 = wallLengthM * wallHeightM * thicknessM;

    // Modular brick: 190 x 90 x 90 mm; with mortar 200 x 100 x 100 mm -> 500 bricks / m3
    // Traditional brick: 229 x 114 x 76 mm -> 480-500 bricks / m3
    const bricksPerM3 = brickType === 'traditional' ? 490 : 500;
    const totalBricks = Math.ceil(wallVolumeM3 * bricksPerM3 * 1.05); // +5% wastage

    // Mortar volume: ~30% of brickwork wet volume
    const wetMortarM3 = wallVolumeM3 * 0.30;
    const dryMortarM3 = wetMortarM3 * 1.33; // 33% increase for dry mix & void filling

    // Mix ratios
    let cementPart = 1;
    let sandPart = 6;
    if (mortarRatio === '1:4') { sandPart = 4; }
    else if (mortarRatio === '1:5') { sandPart = 5; }
    else if (mortarRatio === '1:3') { sandPart = 3; }

    const totalParts = cementPart + sandPart;
    const cementM3 = (dryMortarM3 * cementPart) / totalParts;
    const sandM3 = (dryMortarM3 * sandPart) / totalParts;

    // Density of cement = 1440 kg/m3. 1 bag = 50 kg
    const cementBags = Math.ceil((cementM3 * 1440) / 50);
    const sandCft = sandM3 * 35.3147;

    return {
      wallVolumeM3: wallVolumeM3,
      totalBricks: totalBricks,
      wetMortarM3: wetMortarM3,
      dryMortarM3: dryMortarM3,
      cementBags: cementBags,
      sandM3: sandM3,
      sandCft: sandCft
    };
  },

  calculatePlaster: function(plasterAreaSqM, thicknessMm = 12, mixRatio = '1:4') {
    plasterAreaSqM = parseFloat(plasterAreaSqM) || 0;
    const thicknessM = (parseFloat(thicknessMm) || 12) / 1000;

    const wetVolumeM3 = plasterAreaSqM * thicknessM;
    // Add 20% for joints/filling and 30% for dry bulk volume -> factor approx 1.56
    const dryVolumeM3 = wetVolumeM3 * 1.56;

    let cementPart = 1;
    let sandPart = 4;
    if (mixRatio === '1:3') sandPart = 3;
    if (mixRatio === '1:5') sandPart = 5;
    if (mixRatio === '1:6') sandPart = 6;

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
      sandCft: sandCft
    };
  },

  // 3. CONCRETE CALCULATOR (IS 456:2000)
  calculateConcrete: function(volumeM3, grade = 'M20', dryFactor = 1.54) {
    volumeM3 = parseFloat(volumeM3) || 0;
    dryFactor = parseFloat(dryFactor) || 1.54;

    const dryVolumeM3 = volumeM3 * dryFactor;

    // Nominal Mix Proportions [Cement, Sand, Coarse Aggregate]
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
      waterLiters: Math.round(waterLiters)
    };
  },

  // 4. STEEL QUANTITY CALCULATOR (Thumb Rules + BBS)
  calculateSteelByVolume: function(concreteVolumeM3, memberType = 'slab') {
    concreteVolumeM3 = parseFloat(concreteVolumeM3) || 0;

    // IS code approximate steel percentage of concrete volume (density 7850 kg/m3)
    const percentages = {
      'slab': 1.0,     // 0.8% - 1.0% (~80 kg/m3)
      'beam': 1.8,     // 1.5% - 2.0% (~140 kg/m3)
      'column': 2.5,   // 2.0% - 3.0% (~200 kg/m3)
      'footing': 0.7,  // 0.6% - 0.8% (~55 kg/m3)
      'overall': 1.25  // Residential average (~100 kg/m3)
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
      totalSteelTon: totalSteelTon
    };
  },

  calculateRebarWeight: function(diameterMm, lengthM, barCount = 1) {
    diameterMm = parseFloat(diameterMm) || 0;
    lengthM = parseFloat(lengthM) || 0;
    barCount = parseInt(barCount) || 1;

    // Unit weight = D^2 / 162.28 kg/m
    const unitWeightKgPerM = (diameterMm * diameterMm) / 162.28;
    const singleBarWeightKg = unitWeightKgPerM * lengthM;
    const totalWeightKg = singleBarWeightKg * barCount;

    return {
      diameterMm: diameterMm,
      lengthM: lengthM,
      barCount: barCount,
      unitWeightKgPerM: unitWeightKgPerM,
      totalWeightKg: totalWeightKg
    };
  },

  // 5. CEMENT / SAND / AGGREGATE BATCH MIX
  calculateCustomBatch: function(dryVolumeM3, partCement = 1, partSand = 2, partAgg = 4) {
    dryVolumeM3 = parseFloat(dryVolumeM3) || 0;
    partCement = parseFloat(partCement) || 1;
    partSand = parseFloat(partSand) || 2;
    partAgg = parseFloat(partAgg) || 4;

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
      aggCft: aggVol * 35.3147
    };
  },

  // 6. FLOORING CALCULATOR
  calculateFlooring: function(floorAreaSqM, tileWidthMm = 600, tileLengthMm = 600, wastagePct = 8) {
    floorAreaSqM = parseFloat(floorAreaSqM) || 0;
    tileWidthMm = parseFloat(tileWidthMm) || 600;
    tileLengthMm = parseFloat(tileLengthMm) || 600;
    wastagePct = parseFloat(wastagePct) || 8;

    const tileAreaSqM = (tileWidthMm / 1000) * (tileLengthMm / 1000);
    const netTiles = floorAreaSqM / tileAreaSqM;
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
      grossTiles: grossTiles,
      wastagePct: wastagePct,
      cementBags: cementBags,
      sandCft: sandCft
    };
  },

  // 7. PAINTING CALCULATOR
  calculatePainting: function(surfaceAreaSqM, paintType = 'interior_emulsion', coats = 2) {
    surfaceAreaSqM = parseFloat(surfaceAreaSqM) || 0;
    coats = parseInt(coats) || 2;

    const surfaceAreaSqFt = surfaceAreaSqM * 10.7639;

    // Coverage rates (sq.ft / liter)
    // Primer: ~120 sq.ft/L
    // Interior Emulsion (2 coats): ~65 sq.ft/L
    // Exterior Emulsion (2 coats): ~55 sq.ft/L
    // Putty: ~12 sq.ft/kg (2 coats)
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
      coats: coats
    };
  },

  // 8. EXCAVATION CALCULATOR
  calculateExcavation: function(lengthM, widthM, depthM, soilBulkingPct = 25) {
    lengthM = parseFloat(lengthM) || 0;
    widthM = parseFloat(widthM) || 0;
    depthM = parseFloat(depthM) || 0;
    soilBulkingPct = parseFloat(soilBulkingPct) || 25;

    const netVolumeM3 = lengthM * widthM * depthM;
    const bulkedVolumeM3 = netVolumeM3 * (1 + soilBulkingPct / 100);

    // 1 Brass = 100 cu.ft = 2.8317 m3
    const netVolumeCft = netVolumeM3 * 35.3147;
    const brass = netVolumeCft / 100;

    // Typical dump truck / tipper = 6 m3 capacity
    const truckLoads = Math.ceil(bulkedVolumeM3 / 6);

    return {
      netVolumeM3: netVolumeM3,
      bulkedVolumeM3: bulkedVolumeM3,
      netVolumeCft: netVolumeCft,
      brass: brass,
      truckLoads: truckLoads
    };
  },

  // 9. DOOR & WINDOW CALCULATOR
  calculateOpenings: function(doorsCount, windowsCount, ventCount = 0) {
    doorsCount = parseInt(doorsCount) || 0;
    windowsCount = parseInt(windowsCount) || 0;
    ventCount = parseInt(ventCount) || 0;

    // Standard Sizes:
    // Door D1: 2.1m x 0.9m = 1.89 m2
    // Window W1: 1.2m x 1.2m = 1.44 m2
    // Ventilator V: 0.6m x 0.6m = 0.36 m2
    const doorAreaM2 = doorsCount * 1.89;
    const windowAreaM2 = windowsCount * 1.44;
    const ventAreaM2 = ventCount * 0.36;
    const totalDeductionM2 = doorAreaM2 + windowAreaM2 + ventAreaM2;

    // Frame wood volume estimate: Door frame ~0.065 m3, Window frame ~0.045 m3
    const frameWoodM3 = (doorsCount * 0.065) + (windowsCount * 0.045);
    const frameWoodCft = frameWoodM3 * 35.3147;

    return {
      doorsCount: doorsCount,
      windowsCount: windowsCount,
      ventCount: ventCount,
      totalOpenings: doorsCount + windowsCount + ventCount,
      totalDeductionM2: totalDeductionM2,
      frameWoodM3: frameWoodM3,
      frameWoodCft: frameWoodCft
    };
  },

  // 10. ROOF AREA & PITCH CALCULATOR
  calculateRoof: function(planLengthM, planWidthM, roofType = 'flat', pitchDegrees = 20, overhangM = 0.45) {
    planLengthM = parseFloat(planLengthM) || 0;
    planWidthM = parseFloat(planWidthM) || 0;
    overhangM = parseFloat(overhangM) || 0.45;
    pitchDegrees = parseFloat(pitchDegrees) || 20;

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

    // Corrugated sheets or clay tiles count (Standard sheet ~ 3.0m x 1.0m with overlap = 2.4 m2)
    const sheetsCount = Math.ceil(trueRoofAreaM2 / 2.4);

    return {
      projectedPlanAreaM2: projectedPlanAreaM2,
      trueRoofAreaM2: trueRoofAreaM2,
      trueRoofAreaSqFt: trueRoofAreaM2 * 10.7639,
      ridgeLengthM: ridgeLengthM,
      sheetsCount: sheetsCount,
      roofType: roofType
    };
  },

  // 11. AREA & VOLUME QUICK GEOMETRY
  calculateGeometry: function(shape, p1, p2, p3) {
    p1 = parseFloat(p1) || 0;
    p2 = parseFloat(p2) || 0;
    p3 = parseFloat(p3) || 0;

    let area = 0;
    let volume = 0;

    switch (shape) {
      case 'rectangle':
        area = p1 * p2;
        volume = p1 * p2 * p3;
        break;
      case 'trapezoid': // p1 = a, p2 = b, p3 = h
        area = ((p1 + p2) / 2) * p3;
        break;
      case 'circle': // p1 = radius, p2 = height
        area = Math.PI * p1 * p1;
        volume = area * p2;
        break;
      case 'trapezoidal_footing': // Frustum: p1 = Area1, p2 = Area2, p3 = Depth
        // V = h/3 * (A1 + A2 + sqrt(A1*A2))
        volume = (p3 / 3) * (p1 + p2 + Math.sqrt(p1 * p2));
        break;
    }

    return { area: area, volume: volume };
  },

  // 12. CIVIL UNIT CONVERTER
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
        'brass': 9.2903, // 1 brass = 100 sq.ft
        'cent': 40.4686, // 1 cent = 435.6 sq.ft
        'guntha': 101.17, // 1 guntha = 1089 sq.ft
        'acre': 4046.86,
        'hectare': 10000
      },
      volume: {
        'cum': 1,
        'cuft': 0.0283168,
        'liter': 0.001,
        'brass': 2.83168, // 1 brass = 100 cu.ft
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

window.CivilCalculators = CivilCalculators;
