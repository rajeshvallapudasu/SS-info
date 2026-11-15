import json
import os
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Master Static Tower Data File
DATA_FILE = os.path.join(os.path.dirname(__file__), "static", "tower_data.json")


def load_tower_data():
    """Loads fixed static tower locations from local storage (no external network calls)."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {DATA_FILE}: {e}")
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
    Returns fixed, static tower locations instantly from local dataset.
    Fast, reliable, zero external dependencies or delays.
    """
    data = load_tower_data()
    line_filter = request.args.get("line", "").strip().lower()

    if line_filter and line_filter != "all":
        filtered = {}
        for key, val in data.items():
            if key == line_filter or line_filter in val.get("name", "").lower():
                filtered[key] = val
        return jsonify({"status": "success", "data": filtered})

    return jsonify({"status": "success", "data": data})


if __name__ == "__main__":
    # Support PORT env var for cloud deployment (e.g. Render, Railway, Heroku)
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)