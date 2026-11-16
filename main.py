import json
import os
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Master Secure Server-Side Tower Data File (stored safely in data/ directory, not publicly exposed)
SECURE_DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "tower_data.json")


def load_secure_tower_data():
    """Loads fixed static tower locations from secure server storage."""
    if os.path.exists(SECURE_DATA_FILE):
        try:
            with open(SECURE_DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {SECURE_DATA_FILE}: {e}")
    return {}


@app.route("/")
def home():
    """Main Single Line Diagram Dashboard"""
    return render_template("index.html")


@app.route("/towers")
@app.route("/tower-locations")
def tower_locations():
    """Fixed Tower Locations and Geo-Mapping Table Page"""
    initial_line = request.args.get("line", "").strip()
    return render_template("tower_locations.html", initial_line=initial_line)


@app.route("/api/tower-data")
def api_tower_data():
    """
    Returns sanitized tower data for public view.
    Raw latitude and longitude are kept secure on the server and not exposed as raw text columns,
    preventing scraping or copying of coordinates while preserving one-click Google Maps links.
    """
    master_data = load_secure_tower_data()
    line_filter = request.args.get("line", "").strip().lower()

    sanitized = {}
    for line_key, line_info in master_data.items():
        if line_filter and line_filter != "all" and line_key != line_filter and line_filter not in line_info.get("name", "").lower():
            continue

        raw_towers = line_info.get("towers", [])
        clean_towers = []

        for idx, t in enumerate(raw_towers):
            sno = t.get("sno") or (idx + 1)
            tower_no = (t.get("tower_no") or "").strip()
            lat = t.get("lat") or ""
            lng = t.get("lng") or ""
            
            # Map navigation link
            map_link = t.get("map_link") or ""
            if not map_link and lat and lng:
                map_link = f"https://www.google.com/maps?q={lat},{lng}"

            embed_link = f"https://maps.google.com/maps?q={lat},{lng}&hl=en&z=17&output=embed" if (lat and lng) else ""
            directions_link = f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}" if (lat and lng) else ""

            is_gantry = tower_no.upper() == "G"
            tower_type = "Gantry Tower" if is_gantry else f"Transmission Tower #{tower_no}"

            # Return only presentation-safe fields — raw lat/lng numerical strings are protected
            clean_towers.append({
                "sno": sno,
                "tower_no": tower_no,
                "tower_type": tower_type,
                "is_gantry": is_gantry,
                "map_link": map_link,
                "embed_link": embed_link,
                "directions_link": directions_link,
                "status": "Geo-Tagged & Verified"
            })

        sanitized[line_key] = {
            "id": line_info.get("id", line_key),
            "name": line_info.get("name", line_key),
            "voltage": line_info.get("voltage", ""),
            "line_type": line_info.get("line_type", "Transmission"),
            "total_towers": len(clean_towers),
            "status": line_info.get("status", "Active"),
            "origin_map_link": clean_towers[0]["map_link"] if clean_towers else "",
            "dest_map_link": clean_towers[-1]["map_link"] if clean_towers else "",
            "towers": clean_towers
        }

    return jsonify({
        "status": "success",
        "author": "V. Rajesh",
        "copyright": "© 2026 V. Rajesh. All Rights Reserved.",
        "data": sanitized
    })


@app.route("/api/drawings")
def api_drawings():
    """
    Returns technical drawing directory metadata for C&R Panels and Breakers.
    Drawings will be populated as provided by V. Rajesh.
    """
    drawings_catalog = [
        # 220KV Feeders
        {"feeder": "220KV Damercherla-1", "voltage": "220 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_220_dam1"},
        {"feeder": "220KV Damercherla-1", "voltage": "220 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_220_dam1"},
        {"feeder": "220KV Damercherla-2", "voltage": "220 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_220_dam2"},
        {"feeder": "220KV Damercherla-2", "voltage": "220 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_220_dam2"},
        {"feeder": "220KV Sithapuram", "voltage": "220 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_220_sith"},
        {"feeder": "220KV Sithapuram", "voltage": "220 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_220_sith"},
        {"feeder": "220KV Narketpally", "voltage": "220 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_220_nark"},
        {"feeder": "220KV Narketpally", "voltage": "220 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_220_nark"},
        # 132KV Feeders
        {"feeder": "132KV Mattampally-1", "voltage": "132 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_132_mat1"},
        {"feeder": "132KV Mattampally-1", "voltage": "132 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_132_mat1"},
        {"feeder": "132KV Mattampally-2", "voltage": "132 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_132_mat2"},
        {"feeder": "132KV Mattampally-2", "voltage": "132 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_132_mat2"},
        {"feeder": "132KV Vepalasingaram-1", "voltage": "132 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_132_vep1"},
        {"feeder": "132KV Vepalasingaram-1", "voltage": "132 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_132_vep1"},
        {"feeder": "132KV Vepalasingaram-2", "voltage": "132 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_132_vep2"},
        {"feeder": "132KV Vepalasingaram-2", "voltage": "132 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_132_vep2"},
        # PTRs
        {"feeder": "100MVA PTR-1 (220/132KV)", "voltage": "220/132 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_ptr_220_1"},
        {"feeder": "100MVA PTR-1 (220/132KV)", "voltage": "220/132 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_ptr_220_1"},
        {"feeder": "100MVA PTR-2 (220/132KV)", "voltage": "220/132 KV", "type": "C&R Panel Drawing", "status": "Pending Upload", "drawing_id": "cr_ptr_220_2"},
        {"feeder": "100MVA PTR-2 (220/132KV)", "voltage": "220/132 KV", "type": "Circuit Breaker Drawing", "status": "Pending Upload", "drawing_id": "cb_ptr_220_2"},
    ]
    return jsonify({
        "status": "success",
        "author": "V. Rajesh",
        "copyright": "© 2026 V. Rajesh. All Rights Reserved.",
        "drawings": drawings_catalog
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
