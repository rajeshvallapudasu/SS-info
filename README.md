# ⚡ Substation Information & Transmission Tower Locations Dashboard

An interactive dashboard for **TGTRANSCO** (220/132/33 KV Huzurnagar Substation), featuring a dynamic Single Line Diagram (SLD) and a dedicated **Tower Locations & Geo-Mapping Table** with Google Maps integration.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/rajeshvallapudasu/SS-info)

---

## 🚀 Features

### 1. 🗼 Tower Locations & Geo-Mapping Table (`/towers`)
- **100% Fixed Static Data**: High-speed, zero-latency loading with no external network dependencies.
- **Active Transmission Lines**:
  - **132KV Mattampally Feeder**: 62 fixed tower locations with exact GPS coordinates.
  - **132KV Vepalasingaram Feeder**: 43 fixed tower locations with exact GPS coordinates.
- **220KV Feeders Ready**: Structure pre-configured for future additions (`Damercherla-1`, `Damercherla-2`, `Sithapuram`, `Narketpally`).
- **Google Maps Integration**:
  - Direct `📍 Open Maps ↗` button for each tower.
  - Interactive popup modal (`🗺️ Preview Map`) with embedded map view.
  - 1-click turn-by-turn navigation (`🚗 Get Directions`).
  - 1-click coordinate clipboard copy (`📋`).
- **Productivity Controls**:
  - Real-time search across tower numbers, line names, and coordinates.
  - Quick filters for Gantry (`G`) vs Intermediate towers.
  - CSV Export (`📥 Export CSV`) and Print/PDF report generation (`🖨️ Print Report`).

### 2. ⚡ Dynamic Single Line Diagram (`/`)
- Interactive SVG-based Single Line Diagram for 220KV, 132KV, and 33KV buses, breakers, isolators, and PTRs.
- Clickable feeder inspection panel with direct access to tower tables (`📍 View Table ↗`).
- Staff details and DC battery system inspection.

---

## 🛠️ Tech Stack
- **Backend**: Python 3, Flask
- **Frontend**: HTML5, Modern CSS (Cyberpunk theme with Inter typography), JavaScript
- **Deployment**: Production-ready with Gunicorn, Docker, Render, and Vercel support

---

## 💻 Local Setup & Execution

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rajeshvallapudasu/SS-info.git
   cd SS-info
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the application:**
   ```bash
   python main.py
   ```

4. **Open in your browser:**
   - Single Line Diagram: `http://localhost:5000/`
   - Tower Locations: `http://localhost:5000/towers`

---

## ☁️ Cloud Deployment

The repository includes ready-to-use production deployment configuration files:
- **Render.com**: Connect the GitHub repository and deploy using [`render.yaml`](render.yaml) or with start command `gunicorn main:app`.
- **Vercel**: Deploy using [`vercel.json`](vercel.json).
- **Docker**: Build and run with [`Dockerfile`](Dockerfile):
  ```bash
  docker build -t ss-info .
  docker run -p 5000:5000 ss-info
  ```

---

## 📝 Adding Future 220KV Tower Locations

To add coordinates for 220KV feeders (such as `Damercherla-1`, `Damercherla-2`, `Sithapuram`, or `Narketpally`):
1. Open [`static/tower_data.json`](static/tower_data.json).
2. Locate the corresponding feeder entry.
3. Paste the tower coordinates array in this format:
   ```json
   {
     "sno": "1",
     "tower_no": "G",
     "lat": "16.XXXXXX",
     "lng": "79.XXXXXX",
     "map_link": "https://www.google.com/maps?q=16.XXXXXX,79.XXXXXX"
   }
   ```
4. Save the file. The dashboard will automatically reflect the new tower locations.
