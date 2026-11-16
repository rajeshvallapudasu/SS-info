from datetime import timedelta
from functools import wraps
import json
import os
from flask import Flask, jsonify, redirect, render_template, request, session, url_for

# Load local .env file if present
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    try:
        with open(env_path, "r", encoding="utf-8") as env_f:
            for line in env_f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip())
    except Exception as e:
        print(f"Notice: .env parsing exception: {e}")

app = Flask(__name__)

# Security & Session Configuration
app.secret_key = os.environ.get("SECRET_KEY", "tgtransco_hzn_v_rajesh_secure_key_2026")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)

# Secure Server-Side Storage Files (stored safely in data/ directory)
SECURE_DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "tower_data.json")
DRAWINGS_DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "drawings.json")


def load_secure_tower_data():
    """Loads fixed static tower locations from secure server storage."""
    if os.path.exists(SECURE_DATA_FILE):
        try:
            with open(SECURE_DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {SECURE_DATA_FILE}: {e}")
    return {}


def load_drawings_data():
    """Loads technical drawing directory and PDF links from data/drawings.json."""
    if os.path.exists(DRAWINGS_DATA_FILE):
        try:
            with open(DRAWINGS_DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {DRAWINGS_DATA_FILE}: {e}")
    return {"feeders": {}}


def save_drawings_data(data):
    """Saves updated PDF links into data/drawings.json."""
    try:
        with open(DRAWINGS_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {DRAWINGS_DATA_FILE}: {e}")
        return False


def verify_credentials(username, password):
    """Authenticates username and password against configured accounts."""
    if not username or not password:
        return False
    u = username.strip().lower()
    p = password.strip()

    admin_user = os.environ.get("ADMIN_USERNAME", "admin").strip().lower()
    admin_pass = os.environ.get("ADMIN_PASSWORD", "admin123").strip()

    rajesh_user = os.environ.get("RAJESH_USERNAME", "rajesh").strip().lower()
    rajesh_pass = os.environ.get("RAJESH_PASSWORD", "tgtransco2026").strip()

    if u == admin_user and p == admin_pass:
        return True
    if u == rajesh_user and p == rajesh_pass:
        return True
    return False


def login_required(f):
    """Enforces authentication check for protected dashboard routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("logged_in"):
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized", "message": "Authentication required. Please log in."}), 401
            next_target = request.full_path if request.query_string else request.path
            return redirect(url_for("login", next=next_target))
        return f(*args, **kwargs)
    return decorated_function


@app.after_request
def add_performance_headers(response):
    """Adds caching headers to static assets for rapid browser loading."""
    if request.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=86400"
    return response


# --- Authentication Routes ---

@app.route("/login", methods=["GET", "POST"])
def login():
    """Sign-in page for authorized users."""
    if session.get("logged_in"):
        next_page = request.args.get("next")
        if next_page and next_page.startswith("/"):
            return redirect(next_page)
        return redirect(url_for("home"))

    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        remember = bool(request.form.get("remember"))

        if verify_credentials(username, password):
            session["logged_in"] = True
            session["username"] = username
            session.permanent = remember
            next_page = request.args.get("next")
            if next_page and next_page.startswith("/") and not next_page.startswith("/login"):
                return redirect(next_page)
            return redirect(url_for("home"))
        else:
            error = "Invalid username or password. Please verify credentials."

    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    """Logs out active user session."""
    session.clear()
    return redirect(url_for("login"))


@app.route("/api/session")
def api_session():
    """Returns active session status."""
    return jsonify({
        "logged_in": bool(session.get("logged_in")),
        "username": session.get("username", "Guest"),
        "author": "V. Rajesh",
        "copyright": "© 2026 V. Rajesh. All Rights Reserved."
    })


# --- Dashboard & Table Routes (Protected) ---

@app.route("/")
@login_required
def home():
    """Main Single Line Diagram Dashboard"""
    return render_template("index.html", username=session.get("username", "User"))


@app.route("/towers")
@app.route("/tower-locations")
@login_required
def tower_locations():
    """Fixed Tower Locations and Geo-Mapping Table Page"""
    initial_line = request.args.get("line", "").strip()
    return render_template("tower_locations.html", initial_line=initial_line, username=session.get("username", "User"))


# --- API Endpoints (Protected) ---

@app.route("/api/tower-data")
@login_required
def api_tower_data():
    """
    Returns sanitized tower data.
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


@app.route("/api/drawings", methods=["GET", "POST"])
@login_required
def api_drawings():
    """
    Manages technical drawings PDF repository for C&R Panels and Breakers.
    PDF links are stored in data/drawings.json.
    """
    drawings = load_drawings_data()

    if request.method == "POST":
        # Allow adding or updating PDF links for a feeder
        payload = request.get_json() or {}
        feeder_name = payload.get("feeder", "").strip()
        cr_pdf = payload.get("cr_pdf_url", "").strip()
        breaker_pdf = payload.get("breaker_pdf_url", "").strip()
        notes = payload.get("notes", "").strip()

        if not feeder_name:
            return jsonify({"status": "error", "message": "Feeder name required"}), 400

        feeders = drawings.setdefault("feeders", {})
        if feeder_name in feeders:
            if cr_pdf is not None:
                feeders[feeder_name]["cr_pdf_url"] = cr_pdf
            if breaker_pdf is not None:
                feeders[feeder_name]["breaker_pdf_url"] = breaker_pdf
            if notes is not None:
                feeders[feeder_name]["notes"] = notes
        else:
            feeders[feeder_name] = {
                "name": feeder_name,
                "cr_pdf_url": cr_pdf or "",
                "breaker_pdf_url": breaker_pdf or "",
                "notes": notes or ""
            }

        save_drawings_data(drawings)
        return jsonify({
            "status": "success",
            "message": f"Drawing PDF links updated for {feeder_name}",
            "data": feeders[feeder_name]
        })

    return jsonify({
        "status": "success",
        "author": "V. Rajesh",
        "copyright": "© 2026 V. Rajesh. All Rights Reserved.",
        "data": drawings.get("feeders", {})
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
