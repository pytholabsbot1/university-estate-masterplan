# 5BHK duplex villa: 3D elevation study

## Contents

- `villa-3d.html`: interactive 3D model.
- `source/5bhk_Duplex_villa_modified_submission_plan.dwg`: the original submission drawing, as received.
- `source/5bhk_Duplex_villa_modified_submission_plan.dxf`: the same sheet as DXF (R2013, metres). It was rebuilt from the DWG: lines, polylines, arcs, circles and texts, including dimension graphics, on the original layers. Hatches, leaders and the tree and door-swing blocks are not included. Walls sit on layer `WALL`, because their layer was unreadable in the DWG.
- `source/photos/`: site photos (front, staircase side) and the railing reference.
- `drawings/as-drawn/`: ground floor, first floor and terrace plans, and a full-sheet preview, extracted unchanged from the DWG. They do not show the changes listed below.
- `tools/`: scripts used for the extraction. `extract.py` reads LibreDWG's JSON (`dwgread -O JSON`), `render.py` draws a region to SVG and `todxf.py` writes the DXF (needs `ezdxf`).

## 3D model

`villa-3d.html` is an interactive 3D model of the G+1 duplex villa, for choosing the final elevation. Open it in a browser (it loads three.js r128 from a CDN).

Source: `5bhk_Duplex_villa_modified_submission_plan.dwg` (AutoCAD 2013 DWG format), converted with LibreDWG 0.13.3. Wall, opening and level coordinates were read from the converted file and typed into the page.

What comes from the drawing:
- Plot 10.67 × 16.00 m. Setbacks: front 3.00 m, right side 1.50 m, rear 1.73 m (only behind the kitchen). The building sits on the left boundary.
- Footprint 9.17 × 13.01 m. Outer walls are 230 mm. The open porch is 4.34 × 2.37 m. The front balcony is 4.80 × 1.51 m.
- Levels from section X-X: 3.66 m floor to floor, terrace at 7.32 m, parapet 1.14 m, stair headroom (mumty) roof at 10.16 m.
- Openings: D 1.5, D1 1.07, D2 0.9 and D3 0.76 m wide; W 1.8 × 1.22, W1 1.22 × 1.22 and V 0.61 × 0.61 m. Sills are at 0.99 m and lintels at 2.21 m. Chajjas are 0.45 m deep, as on the elevations.

Changed from the drawing to match site photos:
- A terrace-level slab extends over the front balcony at the same 4.80 × 1.51 m, giving a covered balcony. The balcony and the extension share one guard design (from the client's reference photo): a 2 ft (0.61 m) wall with a 40 mm stone coping, then an MS angle railing with posts at most 1.6 m apart and four equal horizontal bars. The top of the guard is level with the terrace parapet coping (1.19 m above floor) on both levels, so the railing is 0.54 m (1 ft 9 in) tall with the 2 ft wall. Wall options are 1 ft 6 in, 2 ft and 2 ft 6 in; the railing fills the remaining height.
- The first floor window onto the balcony is 1.83 m (6 ft) wide with 4 panes. The drawing shows W1 at 1.22 m.
- The staircase side wall (right side, y 4.08–6.48 m) has two tall glazed openings. Estimated size: 1.75 m wide, 2.4–4.8 m and 6.2–9.2 m above floor level. The upper one rises into the mumty. The stairwell is left open in the floor and terrace slabs.

Assumptions:
- The plinth is modelled at 0.45 m. Section X-X gives 0.76 m from road level to ground level.
- Interiors are not modelled.
- The "As built" scheme follows the site photos: red Mangalore tile strip and moulded window hoods.
