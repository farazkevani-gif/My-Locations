const STORAGE_KEY = "my_locations_data";

const DEFAULT_LOCATIONS = [
  {
    "id": "loc_1",
    "name": "Central Library Archive",
    "address": "120 Knowledge Way, Sector 4",
    "mapsUrl": "https://maps.google.com/?q=24.8607,67.0011",
    "latitude": 24.8607,
    "longitude": 67.0011,
    "notes": "Reference books on 2nd floor.",
    "favorite": true,
    "createdAt": "2026-01-10T08:00:00.000Z",
    "updatedAt": "2026-01-10T08:00:00.000Z"
  },
  {
    "id": "loc_2",
    "name": "Riverside Botanical Nursery",
    "address": "Plot 45, Green Riverbank Road",
    "mapsUrl": "https://maps.google.com/?q=25.3960,68.3578",
    "latitude": 25.3960,
    "longitude": 68.3578,
    "notes": "Good indigenous shade trees.",
    "favorite": false,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  },
  {
    "id": "loc_3",
    "name": "Highway Service Station East",
    "address": "National Highway KM 88",
    "mapsUrl": "https://maps.google.com/?q=26.2440,68.4100",
    "latitude": 26.2440,
    "longitude": 68.4100,
    "notes": "24/7 tire service and reliable fuel.",
    "favorite": false,
    "createdAt": "2026-02-01T14:15:00.000Z",
    "updatedAt": "2026-02-01T14:15:00.000Z"
  },
  {
    "id": "loc_4",
    "name": "Old City Spice Market",
    "address": "Bazaar Quarter, Lane 3",
    "mapsUrl": "https://maps.google.com/?q=27.5580,68.8570",
    "latitude": 27.5580,
    "longitude": 68.8570,
    "notes": "Wholesale spices. Park outside.",
    "favorite": true,
    "createdAt": "2026-02-12T11:00:00.000Z",
    "updatedAt": "2026-02-14T09:20:00.000Z"
  },
  {
    "id": "loc_5",
    "name": "Technical Equipment Depot",
    "address": "Industrial Estate, Warehouse 12B",
    "mapsUrl": "https://maps.google.com/?q=24.9050,67.1100",
    "latitude": 24.9050,
    "longitude": 67.1100,
    "notes": "PoE injectors, antennas, and network cables.",
    "favorite": false,
    "createdAt": "2026-03-01T16:45:00.000Z",
    "updatedAt": "2026-03-01T16:45:00.000Z"
  }
];

let locations = [];
let activeFilter = "all";
let activeSort = "name-asc";
let deleteTargetId = null;

function initApp() {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData && localData !== "[]") {
    try {
      locations = JSON.parse(localData);
    } catch (e) {
      locations = DEFAULT_LOCATIONS;
      saveData();
    }
  } else {
    locations = DEFAULT_LOCATIONS;
    saveData();
  }
  setupListeners();
  render();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}

function render() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const listEl = document.getElementById("locationsList");
  const countEl = document.getElementById("locationCount");

  let filtered = locations.filter(loc => {
    const matchFilter = activeFilter === "favorites" ? loc.favorite : true;
    const matchSearch = !query || 
      (loc.name && loc.name.toLowerCase().includes(query)) ||
      (loc.address && loc.address.toLowerCase().includes(query)) ||
      (loc.notes && loc.notes.toLowerCase().includes(query));
    return matchFilter && matchSearch;
  });

  filtered.sort((a, b) => {
    if (activeSort === "name-asc") return (a.name || "").localeCompare(b.name || "");
    if (activeSort === "name-desc") return (b.name || "").localeCompare(a.name || "");
    if (activeSort === "recent-added") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (activeSort === "recent-updated") return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    if (activeSort === "fav-first") return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
    return 0;
  });

  countEl.textContent = `${filtered.length} Location${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="empty-msg">No matching locations found.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(loc => {
    let mapUrl = loc.mapsUrl;
    if (!mapUrl) {
      if (loc.latitude && loc.longitude) {
        mapUrl = `https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;
      } else {
        mapUrl = `https://maps.google.com/?q=${encodeURIComponent((loc.name || "") + " " + (loc.address || ""))}`;
      }
    }

    return `
      <div class="location-card">
        <div class="card-top">
          <h3>📍 ${escapeHtml(loc.name || "Untitled")}</h3>
          <button class="fav-toggle ${loc.favorite ? "active" : ""}" onclick="toggleFav('${loc.id}')">★</button>
        </div>
        ${loc.address ? `<div class="card-address">${escapeHtml(loc.address)}</div>` : ""}
        ${loc.notes ? `<div class="card-notes">${escapeHtml(loc.notes)}</div>` : ""}
        <div class="card-actions">
          <a class="btn-open" href="${mapUrl}" target="_blank" rel="noopener">Open in Google Maps</a>
          <button class="btn-edit" onclick="openEditModal('${loc.id}')">Edit</button>
          <button class="btn-del" onclick="promptDelete('${loc.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
}

window.toggleFav = function(id) {
  const loc = locations.find(l => l.id === id);
  if (loc) {
    loc.favorite = !loc.favorite;
    loc.updatedAt = new Date().toISOString();
    saveData();
    render();
  }
};

window.openEditModal = function(id) {
  const loc = locations.find(l => l.id === id);
  if (!loc) return;
  document.getElementById("modalTitle").textContent = "Edit Location";
  document.getElementById("locId").value = loc.id;
  document.getElementById("locName").value = loc.name || "";
  document.getElementById("locAddress").value = loc.address || "";
  document.getElementById("locMapsUrl").value = loc.mapsUrl || "";
  document.getElementById("locLat").value = loc.latitude ?? "";
  document.getElementById("locLng").value = loc.longitude ?? "";
  document.getElementById("locNotes").value = loc.notes || "";
  document.getElementById("locFavorite").checked = !!loc.favorite;
  document.getElementById("formModal").classList.remove("hidden");
};

window.promptDelete = function(id) {
  deleteTargetId = id;
  document.getElementById("deleteModal").classList.remove("hidden");
};

function setupListeners() {
  document.getElementById("searchInput").addEventListener("input", render);
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    activeSort = e.target.value;
    render();
  });

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  document.getElementById("addLocationBtn").addEventListener("click", () => {
    document.getElementById("modalTitle").textContent = "Add Location";
    document.getElementById("locationForm").reset();
    document.getElementById("locId").value = "";
    document.getElementById("formModal").classList.remove("hidden");
  });

  document.getElementById("cancelFormBtn").addEventListener("click", () => {
    document.getElementById("formModal").classList.add("hidden");
  });

  document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
    deleteTargetId = null;
    document.getElementById("deleteModal").classList.add("hidden");
  });

  document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
    if (deleteTargetId) {
      locations = locations.filter(l => l.id !== deleteTargetId);
      saveData();
      render();
    }
    deleteTargetId = null;
    document.getElementById("deleteModal").classList.add("hidden");
  });

  document.getElementById("locationForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("locId").value;
    const now = new Date().toISOString();
    const locData = {
      name: document.getElementById("locName").value.trim(),
      address: document.getElementById("locAddress").value.trim(),
      mapsUrl: document.getElementById("locMapsUrl").value.trim(),
      latitude: document.getElementById("locLat").value ? parseFloat(document.getElementById("locLat").value) : null,
      longitude: document.getElementById("locLng").value ? parseFloat(document.getElementById("locLng").value) : null,
      notes: document.getElementById("locNotes").value.trim(),
      favorite: document.getElementById("locFavorite").checked,
      updatedAt: now
    };

    if (id) {
      const idx = locations.findIndex(l => l.id === id);
      if (idx !== -1) locations[idx] = { ...locations[idx], ...locData };
    } else {
      locations.unshift({ id: "loc_" + Date.now(), createdAt: now, ...locData });
    }

    saveData();
    render();
    document.getElementById("formModal").classList.add("hidden");
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(locations, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_locations_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) throw new Error("File must contain a JSON array.");
        const valid = parsed.map(item => ({
          id: item.id || "loc_" + Math.random().toString(36).substr(2, 9),
          name: item.name || "Untitled",
          address: item.address || "",
          mapsUrl: item.mapsUrl || "",
          latitude: typeof item.latitude === "number" ? item.latitude : null,
          longitude: typeof item.longitude === "number" ? item.longitude : null,
          notes: item.notes || "",
          favorite: !!item.favorite,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString()
        }));
        locations = valid;
        saveData();
        render();
        alert(`Successfully imported ${valid.length} locations.`);
      } catch (err) {
        alert("Import failed: " + err.message);
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });
}

initApp();
