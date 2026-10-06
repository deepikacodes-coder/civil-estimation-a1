/**
 * CIVIL ESTIMATION A1 - Sample Floor Plans
 * Provides pre-drawn architectural CAD plans for immediate prototype demonstration.
 */

const SamplePlans = {
  plans: [
    {
      id: 'plan_2bhk',
      name: 'Modern 2BHK Apartment (Standard)',
      builtUpAreaSqFt: 850,
      builtUpAreaSqM: 79.0,
      floors: 1,
      floorHeightM: 3.0,
      description: 'Living room, Master Bedroom, Bedroom 2, Kitchen, 2 Bathrooms, Balcony',
      scale: 35, // pixels per meter
      rooms: [
        { name: 'Living & Dining Room', length: 4.5, width: 3.6, area: 16.2, x: 50, y: 50, w: 158, h: 126, doors: 2, windows: 2 },
        { name: 'Master Bedroom', length: 3.6, width: 3.3, area: 11.88, x: 208, y: 50, w: 126, h: 116, doors: 1, windows: 1 },
        { name: 'Master Bath (Attached)', length: 2.1, width: 1.5, area: 3.15, x: 334, y: 50, w: 74, h: 53, doors: 1, windows: 1 },
        { name: 'Bedroom 2', length: 3.3, width: 3.0, area: 9.9, x: 208, y: 166, w: 116, h: 105, doors: 1, windows: 1 },
        { name: 'Kitchen & Utility', length: 3.0, width: 2.4, area: 7.2, x: 50, y: 176, w: 105, h: 84, doors: 1, windows: 1 },
        { name: 'Common Bath', length: 2.1, width: 1.5, area: 3.15, x: 155, y: 176, w: 53, h: 53, doors: 1, windows: 1 },
        { name: 'Front Balcony', length: 3.0, width: 1.2, area: 3.6, x: 50, y: 260, w: 105, h: 42, doors: 1, windows: 0 }
      ],
      detectedWalls: {
        outerWallLengthM: 42.5,
        innerWallLengthM: 31.8,
        outerThicknessM: 0.23,
        innerThicknessM: 0.115
      },
      doorsCount: 7,
      windowsCount: 6
    },
    {
      id: 'plan_villa',
      name: 'Contemporary Duplex Villa - Ground Floor',
      builtUpAreaSqFt: 1250,
      builtUpAreaSqM: 116.1,
      floors: 2,
      floorHeightM: 3.05,
      description: 'Drawing Foyer, Large Living, Master Suite, Modular Kitchen, Dining, Car Porch',
      scale: 28,
      rooms: [
        { name: 'Car Porch & Entry', length: 4.8, width: 3.2, area: 15.36, x: 40, y: 40, w: 134, h: 90, doors: 1, windows: 0 },
        { name: 'Formal Living Room', length: 5.2, width: 4.0, area: 20.8, x: 174, y: 40, w: 146, h: 112, doors: 2, windows: 3 },
        { name: 'Dining Hall', length: 4.2, width: 3.5, area: 14.7, x: 174, y: 152, w: 118, h: 98, doors: 2, windows: 1 },
        { name: 'Modular Kitchen', length: 3.6, width: 3.0, area: 10.8, x: 292, y: 152, w: 101, h: 84, doors: 1, windows: 2 },
        { name: 'Master Suite', length: 4.5, width: 4.0, area: 18.0, x: 40, y: 130, w: 126, h: 112, doors: 1, windows: 2 },
        { name: 'Dressing & Ensuite', length: 2.7, width: 2.1, area: 5.67, x: 40, y: 242, w: 76, h: 59, doors: 1, windows: 1 },
        { name: 'Staircase Hall', length: 3.5, width: 2.4, area: 8.4, x: 174, y: 250, w: 98, h: 67, doors: 1, windows: 1 }
      ],
      detectedWalls: {
        outerWallLengthM: 58.2,
        innerWallLengthM: 44.0,
        outerThicknessM: 0.23,
        innerThicknessM: 0.115
      },
      doorsCount: 9,
      windowsCount: 10
    },
    {
      id: 'plan_1bhk',
      name: 'Compact 1BHK Studio Plan',
      builtUpAreaSqFt: 480,
      builtUpAreaSqM: 44.6,
      floors: 1,
      floorHeightM: 2.9,
      description: 'Living / Studio Room, Open Kitchenette, Compact Bedroom, Toilet, Utility',
      scale: 42,
      rooms: [
        { name: 'Studio Living Area', length: 3.9, width: 3.3, area: 12.87, x: 50, y: 50, w: 164, h: 139, doors: 2, windows: 2 },
        { name: 'Open Kitchenette', length: 2.4, width: 2.1, area: 5.04, x: 214, y: 50, w: 101, h: 88, doors: 1, windows: 1 },
        { name: 'Bedroom', length: 3.3, width: 3.0, area: 9.9, x: 50, y: 189, w: 139, h: 126, doors: 1, windows: 1 },
        { name: 'Combined Bathroom', length: 2.1, width: 1.5, area: 3.15, x: 189, y: 189, w: 88, h: 63, doors: 1, windows: 1 }
      ],
      detectedWalls: {
        outerWallLengthM: 28.6,
        innerWallLengthM: 18.2,
        outerThicknessM: 0.23,
        innerThicknessM: 0.115
      },
      doorsCount: 4,
      windowsCount: 5
    }
  ],

  /**
   * Renders a sample CAD-style architectural plan onto an HTML5 Canvas.
   */
  drawPlanToCanvas: function(canvas, planId, filterMode = 'normal') {
    const plan = this.plans.find(p => p.id === planId) || this.plans[0];
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Canvas background
    if (filterMode === 'canny') {
      ctx.fillStyle = '#0f172a'; // Dark edge detection background
      ctx.fillRect(0, 0, width, height);
    } else if (filterMode === 'grayscale') {
      ctx.fillStyle = '#e2e8f0'; // Blueprint gray
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#f8fafc'; // Crisp paper white
      ctx.fillRect(0, 0, width, height);
    }

    // Grid lines for blueprint look
    ctx.strokeStyle = filterMode === 'canny' ? '#1e293b' : '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Scale & Offset to center plan
    const offsetX = 30;
    const offsetY = 30;

    // Draw Rooms
    plan.rooms.forEach((room, idx) => {
      const rx = room.x + offsetX;
      const ry = room.y + offsetY;
      const rw = room.w;
      const rh = room.h;

      // Room Fill
      if (filterMode === 'overlay') {
        const colors = [
          'rgba(59, 130, 246, 0.12)',
          'rgba(16, 185, 129, 0.12)',
          'rgba(245, 158, 11, 0.12)',
          'rgba(139, 92, 246, 0.12)',
          'rgba(236, 72, 153, 0.12)',
          'rgba(14, 165, 233, 0.12)',
          'rgba(168, 85, 247, 0.12)'
        ];
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fillRect(rx, ry, rw, rh);
      } else if (filterMode === 'canny') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(rx, ry, rw, rh);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx, ry, rw, rh);
      }

      // Walls
      if (filterMode === 'canny') {
        ctx.strokeStyle = '#22d3ee'; // Neon edge detection cyan
        ctx.lineWidth = 2.5;
      } else if (filterMode === 'grayscale') {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 5;
      } else {
        ctx.strokeStyle = '#0f172a'; // CAD deep slate
        ctx.lineWidth = 4;
      }
      ctx.strokeRect(rx, ry, rw, rh);

      // Inner wall double-line effect
      if (filterMode !== 'canny') {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx + 4, ry + 4, rw - 8, rh - 8);
      }

      // Doors (Arc notation)
      ctx.save();
      ctx.strokeStyle = filterMode === 'canny' ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Draw door swing
      ctx.arc(rx + 6, ry + rh - 6, 16, 1.5 * Math.PI, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();

      // Windows (Double line on perimeter)
      ctx.save();
      ctx.strokeStyle = filterMode === 'canny' ? '#fbbf24' : '#2563eb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rx + rw * 0.4, ry);
      ctx.lineTo(rx + rw * 0.7, ry);
      ctx.stroke();
      ctx.restore();

      // Room Labels & Dimensions
      if (filterMode !== 'canny') {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(room.name, rx + rw / 2, ry + rh / 2 - 10);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(`${room.length}m × ${room.width}m (${room.area.toFixed(1)} m²)`, rx + rw / 2, ry + rh / 2 + 8);
      } else {
        // Canny mode minimal tag
        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`[SEG_${idx+1}]`, rx + rw / 2, ry + rh / 2);
      }

      // AI Bounding Box & Confidence Badge in Overlay mode
      if (filterMode === 'overlay') {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(rx - 2, ry - 2, rw + 4, rh + 4);
        ctx.setLineDash([]);

        // Small AI Tag badge
        ctx.fillStyle = '#10b981';
        ctx.fillRect(rx + 2, ry + 2, 64, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`AI: ${(94 + (idx * 1.3) % 5).toFixed(1)}%`, rx + 6, ry + 13);
      }
    });

    // Outer plan dimensions
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    // Dimension line top
    ctx.beginPath();
    ctx.moveTo(offsetX + 40, offsetY - 12);
    ctx.lineTo(offsetX + 350, offsetY - 12);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Total Built-up: ${plan.builtUpAreaSqM} m² (${plan.builtUpAreaSqFt} sq.ft)`, offsetX + 195, offsetY - 16);

    // North arrow symbol
    this.drawNorthArrow(ctx, width - 40, 45);

    // Scale Bar
    this.drawScaleBar(ctx, 40, height - 25, plan.scale);
  },

  drawNorthArrow: function(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, 2 * Math.PI);
    ctx.stroke();

    // Arrow
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(5, 4);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-5, 4);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -16);
    ctx.restore();
  },

  drawScaleBar: function(ctx, x, y, scalePixelsPerMeter) {
    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.fillStyle = '#475569';
    ctx.lineWidth = 2;

    const twoMetersPx = (scalePixelsPerMeter || 35) * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + twoMetersPx, y);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.moveTo(x + twoMetersPx, y - 4);
    ctx.lineTo(x + twoMetersPx, y + 4);
    ctx.stroke();

    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0', x, y + 14);
    ctx.fillText('2.0m Scale', x + twoMetersPx / 2, y - 6);
    ctx.fillText('2.0m', x + twoMetersPx, y + 14);
    ctx.restore();
  }
};

window.SamplePlans = SamplePlans;
