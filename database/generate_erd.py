import math

# Define entities
entities = {
    "roles": {"name": "roles", "vn_name": "Vai trò", "x": 1200, "y": 120},
    "users": {"name": "users", "vn_name": "Người dùng", "x": 1200, "y": 400},
    "residents": {"name": "residents", "vn_name": "Cư dân", "x": 500, "y": 650},
    "notifications": {"name": "notifications", "vn_name": "Thông báo", "x": 1200, "y": 680},
    "security": {"name": "security", "vn_name": "Bảo vệ", "x": 1900, "y": 650},
    "vehicles": {"name": "vehicles", "vn_name": "Phương tiện", "x": 500, "y": 950},
    "vehicle_types": {"name": "vehicle_types", "vn_name": "Loại xe", "x": 1200, "y": 950},
    "monthly_parking": {"name": "monthly_parking", "vn_name": "Vé tháng", "x": 150, "y": 1250},
    "parking_area": {"name": "parking_area", "vn_name": "Khu vực đỗ", "x": 750, "y": 1350},
    "parking_fee": {"name": "parking_fee", "vn_name": "Cấu hình phí", "x": 1200, "y": 1350},
    "parking_session": {"name": "parking_session", "vn_name": "Lượt gửi xe", "x": 1900, "y": 1250}
}

# Define attributes
attributes = {
    "roles": [
        {"name": "role_id", "pk": True, "dx": -120, "dy": -60},
        {"name": "role_name", "pk": False, "dx": 120, "dy": -60}
    ],
    "users": [
        {"name": "user_id", "pk": True, "dx": -160, "dy": -80},
        {"name": "username", "pk": False, "dx": -160, "dy": 0},
        {"name": "password", "pk": False, "dx": -160, "dy": 80},
        {"name": "status", "pk": False, "dx": 160, "dy": -80},
        {"name": "created_at", "pk": False, "dx": 160, "dy": 0}
    ],
    "residents": [
        {"name": "resident_id", "pk": True, "dx": -160, "dy": -80},
        {"name": "name", "pk": False, "dx": -160, "dy": 0},
        {"name": "apartment_number", "pk": False, "dx": -160, "dy": 80},
        {"name": "phone", "pk": False, "dx": -80, "dy": 140},
        {"name": "email", "pk": False, "dx": 80, "dy": 140}
    ],
    "security": [
        {"name": "staff_id", "pk": True, "dx": 160, "dy": -80},
        {"name": "name", "pk": False, "dx": 160, "dy": 0},
        {"name": "phone", "pk": False, "dx": 160, "dy": 80}
    ],
    "notifications": [
        {"name": "notification_id", "pk": True, "dx": -160, "dy": 0},
        {"name": "title", "pk": False, "dx": -120, "dy": 80},
        {"name": "content", "pk": False, "dx": -120, "dy": -80},
        {"name": "type", "pk": False, "dx": 120, "dy": -80},
        {"name": "is_read", "pk": False, "dx": 160, "dy": 0},
        {"name": "created_at", "pk": False, "dx": 120, "dy": 80}
    ],
    "vehicles": [
        {"name": "plate_number", "pk": True, "dx": -160, "dy": -60},
        {"name": "color", "pk": False, "dx": -160, "dy": 40},
        {"name": "status", "pk": False, "dx": -80, "dy": 120}
    ],
    "vehicle_types": [
        {"name": "type_id", "pk": True, "dx": -120, "dy": -70},
        {"name": "type_name", "pk": False, "dx": 120, "dy": -70}
    ],
    "parking_area": [
        {"name": "area_id", "pk": True, "dx": -120, "dy": 80},
        {"name": "area_name", "pk": False, "dx": -160, "dy": 0},
        {"name": "capacity", "pk": False, "dx": -120, "dy": -80},
        {"name": "available_slots", "pk": False, "dx": 0, "dy": -140}
    ],
    "parking_fee": [
        {"name": "monthly_fee", "pk": False, "dx": -160, "dy": 80},
        {"name": "block_hours", "pk": False, "dx": -160, "dy": 0},
        {"name": "day_block_price", "pk": False, "dx": 160, "dy": 0},
        {"name": "night_block_price", "pk": False, "dx": 160, "dy": 80}
    ],
    "monthly_parking": [
        {"name": "monthly_id", "pk": True, "dx": -140, "dy": -80},
        {"name": "start_date", "pk": False, "dx": -160, "dy": 0},
        {"name": "end_date", "pk": False, "dx": -140, "dy": 80},
        {"name": "status", "pk": False, "dx": 0, "dy": 120}
    ],
    "parking_session": [
        {"name": "session_id", "pk": True, "dx": 160, "dy": -80},
        {"name": "plate_number", "pk": False, "dx": 160, "dy": 0},
        {"name": "time_in", "pk": False, "dx": 160, "dy": 80},
        {"name": "time_out", "pk": False, "dx": 100, "dy": 140},
        {"name": "status", "pk": False, "dx": -100, "dy": 140},
        {"name": "fee_amount", "pk": False, "dx": -160, "dy": 80}
    ]
}

# Define relationships (diamonds)
relationships = {
    "assigned": {"name": "assigned", "x": 1200, "y": 260},
    "isa_res": {"name": "is-a", "x": 850, "y": 525},
    "isa_sec": {"name": "is-a", "x": 1550, "y": 525},
    "receives": {"name": "receives", "x": 1200, "y": 540},
    "owns": {"name": "owns", "x": 500, "y": 800},
    "belongs": {"name": "belongs", "x": 850, "y": 950},
    "registers": {"name": "registers", "x": 325, "y": 1100},
    "binds": {"name": "binds", "x": 450, "y": 1300},
    "hosts": {"name": "hosts", "x": 975, "y": 1150},
    "defines": {"name": "defines", "x": 1200, "y": 1150},
    "applies_in": {"name": "applies_in", "x": 1550, "y": 1100},
    "handles": {"name": "handles", "x": 1900, "y": 950}
}

# Define connections: (from_node, to_node, cardinality, participation_type)
# participation_type: 'partial' (single line) or 'total' (double line)
connections = [
    ("roles", "assigned", "1", "partial"),
    ("assigned", "users", "N", "total"),
    
    ("users", "isa_res", "(0,1)", "partial"),
    ("isa_res", "residents", "(1,1)", "total"),
    
    ("users", "isa_sec", "(0,1)", "partial"),
    ("isa_sec", "security", "(1,1)", "total"),
    
    ("users", "receives", "1", "partial"),
    ("receives", "notifications", "N", "total"),
    
    ("residents", "owns", "1", "partial"),
    ("owns", "vehicles", "N", "total"),
    
    ("vehicles", "belongs", "N", "total"),
    ("belongs", "vehicle_types", "1", "partial"),
    
    ("vehicles", "registers", "1", "partial"),
    ("registers", "monthly_parking", "N", "total"),
    
    ("monthly_parking", "binds", "N", "total"),
    ("binds", "parking_area", "1", "partial"),
    
    ("vehicle_types", "hosts", "1", "partial"),
    ("hosts", "parking_area", "N", "total"),
    
    ("vehicle_types", "defines", "1", "partial"),
    ("defines", "parking_fee", "1", "total"),
    
    ("vehicle_types", "applies_in", "1", "partial"),
    ("applies_in", "parking_session", "N", "total"),
    
    ("security", "handles", "1", "partial"),
    ("handles", "parking_session", "N", "total")
]

# SVG configuration
width = 2400
height = 1600

# SVG Template Start
svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&amp;display=swap');
      text {{
        font-family: 'Outfit', -apple-system, sans-serif;
      }}
      .entity-rect {{
        fill: #FFFFFF;
        stroke: #2D3327;
        stroke-width: 2.5;
        filter: drop-shadow(0px 4px 6px rgba(45, 51, 39, 0.08));
      }}
      .entity-text {{
        font-size: 14px;
        font-weight: 700;
        fill: #2D3327;
        text-anchor: middle;
        dominant-baseline: middle;
      }}
      .entity-subtext {{
        font-size: 11px;
        font-weight: 500;
        fill: #64748B;
        text-anchor: middle;
        dominant-baseline: middle;
      }}
      .relationship-diamond {{
        fill: #FFFBF5;
        stroke: #CD5C5C;
        stroke-width: 2;
        filter: drop-shadow(0px 4px 6px rgba(205, 92, 92, 0.08));
      }}
      .relationship-text {{
        font-size: 12px;
        font-weight: 600;
        fill: #CD5C5C;
        text-anchor: middle;
        dominant-baseline: middle;
      }}
      .attribute-ellipse {{
        fill: #FDFBF7;
        stroke: #64748B;
        stroke-width: 1.5;
      }}
      .attribute-ellipse-pk {{
        fill: #FFFBF5;
        stroke: #B45309;
        stroke-width: 2;
      }}
      .attribute-text {{
        font-size: 11px;
        font-weight: 500;
        fill: #334155;
        text-anchor: middle;
        dominant-baseline: middle;
      }}
      .attribute-text-pk {{
        font-size: 11px;
        font-weight: 700;
        fill: #B45309;
        text-anchor: middle;
        dominant-baseline: middle;
        text-decoration: underline;
      }}
      .conn-line {{
        stroke: #94A3B8;
        stroke-width: 1.5;
      }}
      .conn-line-double {{
        stroke: #94A3B8;
        stroke-width: 1.5;
      }}
      .attribute-line {{
        stroke: #CBD5E1;
        stroke-width: 1.2;
        stroke-dasharray: 2 2;
      }}
      .cardinality-text {{
        font-size: 12px;
        font-weight: 700;
        fill: #475569;
      }}
    </style>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="#FFFBF5" />
  
  <!-- Grid pattern for aesthetics -->
  <g opacity="0.15">
    {"".join(f'<line x1="{x}" y1="0" x2="{x}" y2="{height}" stroke="#2D3327" stroke-width="0.5" />' for x in range(0, width, 40))}
    {"".join(f'<line x1="0" y1="{y}" x2="{width}" y2="{y}" stroke="#2D3327" stroke-width="0.5" />' for y in range(0, height, 40))}
  </g>
"""

# Helper function to get coordinates
def get_node_coords(node_id):
    if node_id in entities:
        return entities[node_id]["x"], entities[node_id]["y"]
    elif node_id in relationships:
        return relationships[node_id]["x"], relationships[node_id]["y"]
    return 0, 0

# Draw attribute connection lines first
for ent_id, attr_list in attributes.items():
    ent = entities[ent_id]
    for attr in attr_list:
        ax = ent["x"] + attr["dx"]
        ay = ent["y"] + attr["dy"]
        svg += f'  <line x1="{ent["x"]}" y1="{ent["y"]}" x2="{ax}" y2="{ay}" class="attribute-line" />\n'

# Draw relationship connection lines
for from_id, to_id, card, part in connections:
    x1, y1 = get_node_coords(from_id)
    x2, y2 = get_node_coords(to_id)
    
    if part == "total":
        # Compute normal vector for double line offset
        dx = x2 - x1
        dy = y2 - y1
        length = math.sqrt(dx*dx + dy*dy)
        if length > 0:
            nx = -dy / length
            ny = dx / length
            # Draw parallel lines
            ox1 = nx * 2.5
            oy1 = ny * 2.5
            svg += f'  <line x1="{x1 + ox1:.1f}" y1="{y1 + oy1:.1f}" x2="{x2 + ox1:.1f}" y2="{y2 + oy1:.1f}" class="conn-line-double" />\n'
            svg += f'  <line x1="{x1 - ox1:.1f}" y1="{y1 - oy1:.1f}" x2="{x2 - ox1:.1f}" y2="{y2 - oy1:.1f}" class="conn-line-double" />\n'
    else:
        svg += f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="conn-line" />\n'

# Draw cardinality labels
for from_id, to_id, card, part in connections:
    x1, y1 = get_node_coords(from_id)
    x2, y2 = get_node_coords(to_id)
    
    # Place cardinality label closer to the entity
    # If from_id is the entity, place it near x1, y1. If to_id is the entity, place it near x2, y2.
    is_from_entity = from_id in entities
    ent_x, ent_y = (x1, y1) if is_from_entity else (x2, y2)
    rel_x, rel_y = (x2, y2) if is_from_entity else (x1, y1)
    
    # Interpolate point at 35% distance from entity to relationship
    tx = ent_x + 0.35 * (rel_x - ent_x)
    ty = ent_y + 0.35 * (rel_y - ent_y)
    
    # Add small background rect to make cardinality readable
    svg += f'  <rect x="{tx - 18:.1f}" y="{ty - 10:.1f}" width="36" height="20" fill="#FFFBF5" rx="3" opacity="0.9" />\n'
    svg += f'  <text x="{tx:.1f}" y="{ty + 4:.1f}" class="cardinality-text" text-anchor="middle">{card}</text>\n'

# Draw Entity Rectangles
for ent_id, ent in entities.items():
    w, h = 170, 56
    rx, ry = ent["x"] - w/2, ent["y"] - h/2
    svg += f"""  <g id="entity-{ent_id}">
    <rect x="{rx}" y="{ry}" width="{w}" height="{h}" rx="8" class="entity-rect" />
    <text x="{ent["x"]}" y="{ent["y"] - 6}" class="entity-text">{ent["name"]}</text>
    <text x="{ent["x"]}" y="{ent["y"] + 12}" class="entity-subtext">({ent["vn_name"]})</text>
  </g>\n"""

# Draw Relationship Diamonds
for rel_id, rel in relationships.items():
    cx, cy = rel["x"], rel["y"]
    w, h = 130, 70
    points = f"{cx},{cy - h/2} {cx + w/2},{cy} {cx},{cy + h/2} {cx - w/2},{cy}"
    svg += f"""  <g id="relationship-{rel_id}">
    <polygon points="{points}" class="relationship-diamond" />
    <text x="{cx}" y="{cy + 4}" class="relationship-text">{rel["name"]}</text>
  </g>\n"""

# Draw Attribute Ellipses
for ent_id, attr_list in attributes.items():
    ent = entities[ent_id]
    for attr in attr_list:
        ax = ent["x"] + attr["dx"]
        ay = ent["y"] + attr["dy"]
        rx, ry = 66, 23
        
        if attr["pk"]:
            svg += f"""  <g id="attr-{ent_id}-{attr["name"]}">
    <ellipse cx="{ax}" cy="{ay}" rx="{rx}" ry="{ry}" class="attribute-ellipse-pk" />
    <text x="{ax}" y="{ay + 4}" class="attribute-text-pk">{attr["name"]}</text>
  </g>\n"""
        else:
            svg += f"""  <g id="attr-{ent_id}-{attr["name"]}">
    <ellipse cx="{ax}" cy="{ay}" rx="{rx}" ry="{ry}" class="attribute-ellipse" />
    <text x="{ax}" y="{ay + 4}" class="attribute-text">{attr["name"]}</text>
  </g>\n"""

# Close SVG
svg += "</svg>"

# Write to file
with open("database/erd_diagram.svg", "w", encoding="utf-8") as f:
    f.write(svg)

print("SVG ERD generated successfully at database/erd_diagram.svg")
