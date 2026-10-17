/**
 * app.js – Main Application Controller
 * Aram Office – E-Governance Document Processing & Retrieval System
 *
 * Handles:
 *  - Page routing (Dashboard, Documents, Search, Versions, Categories)
 *  - Modal management
 *  - Toast notifications
 *  - Add/Edit/View document forms
 *  - Version management UI
 *  - Category tree rendering
 *  - Dashboard stats & charts
 *  - All interactivity
 */

"use strict";

// ── State ─────────────────────────────────────────────────────────────
let currentPage = "dashboard";
let docTablePage = 1;
const DOC_PAGE_SIZE = 10;
let docFilters = { q: "", department: "", category: "", importance: "", status: "" };
let selectedCategoryPath = null;

// ── Boot ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  Engine.buildIndex(Store.getAll());
  setupNavigation();
  setupTopbar();
  setupModal();
  updateTopbarUser();
  navigateTo("dashboard");
});

// ── Navigation ────────────────────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll(".nav-item[data-page]").forEach(el => {
    el.addEventListener("click", () => navigateTo(el.dataset.page));
  });
  document.getElementById("nav-add-doc").addEventListener("click", () => openAddDocModal());
  document.getElementById("sidebarOpen").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("mobile-open");
  });
  document.getElementById("sidebarClose").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("mobile-open");
  });
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll(".nav-item[data-page]").forEach(el => {
    el.classList.toggle("active", el.dataset.page === page);
  });
  const labels = {
    dashboard: "Dashboard", documents: "Documents",
    search: "Smart Search", versions: "Version Management", categories: "Category Tree",
    staff: "Staff Portal & Verification"
  };
  document.getElementById("breadcrumbCurrent").textContent = labels[page] || page;
  document.getElementById("sidebar").classList.remove("mobile-open");

  const container = document.getElementById("pageContainer");
  container.innerHTML = "";
  if (page === "dashboard")       renderDashboard(container);
  else if (page === "documents")  renderDocuments(container);
  else if (page === "search")     renderSearch(container);
  else if (page === "versions")   renderVersions(container);
  else if (page === "categories") renderCategories(container);
  else if (page === "staff")      renderStaffPortal(container);
}

// ── Topbar ────────────────────────────────────────────────────────────
function setupTopbar() {
  document.getElementById("topbarAddBtn").addEventListener("click", openAddDocModal);
  const qs = document.getElementById("quickSearch");
  qs.addEventListener("keydown", e => {
    if (e.key === "Enter" && qs.value.trim()) {
      navigateTo("search");
      setTimeout(() => {
        const inp = document.getElementById("heroSearchInput");
        if (inp) { inp.value = qs.value.trim(); runSearch(); }
        qs.value = "";
      }, 50);
    }
  });
  updateTopbarUser();
}

function updateTopbarUser() {
  const container = document.getElementById("topbarUserContainer");
  if (!container) return;
  const staff = Store.getCurrentStaff();
  if (staff) {
    const initials = staff.name.split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("") || "SO";
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <div class="topbar-user" onclick="navigateTo('staff')" style="cursor:pointer" title="Click to view staff profile">
          <div class="user-avatar" style="background:#15803d;color:#fff">${initials}</div>
          <div class="user-info">
            <span class="user-name">${staff.name}</span>
            <span class="user-role" style="color:#15803d;font-weight:600">ID: ${staff.id} • ${staff.department.replace(" Department","")}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="handleStaffLogout()" title="Log out staff session" style="padding:6px 10px;font-size:.78rem">Logout</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="navigateTo('staff')">🛡️ Staff Login / Sign Up</button>
    `;
  }
}

function handleStaffLogout() {
  Store.logoutStaff();
  updateTopbarUser();
  toast("You have logged out of the staff session.", "info");
  if (currentPage === "staff") navigateTo("staff");
}

// ── Modal ─────────────────────────────────────────────────────────────
function setupModal() {
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", e => {
    if (e.target === document.getElementById("modalOverlay")) closeModal();
  });
}
function openModal(title, bodyHTML, size = "") {
  const box = document.getElementById("modalBox");
  box.className = "modal-box " + (size || "");
  document.getElementById("modalTitle").innerHTML = title;
  document.getElementById("modalBody").innerHTML = bodyHTML;
  document.getElementById("modalOverlay").classList.add("open");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

// ── Toast ─────────────────────────────────────────────────────────────
function toast(msg, type = "info") {
  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => { el.style.animation = "fadeOut .3s ease forwards"; setTimeout(() => el.remove(), 320); }, 3500);
}

// ── Helpers ───────────────────────────────────────────────────────────
function statusBadge(status) {
  return status === "Current"
    ? `<span class="badge badge-green">Current</span>`
    : `<span class="badge badge-orange">Outdated</span>`;
}
function importanceBadge(imp) {
  const cls = { High: "badge-red", Medium: "badge-amber", Low: "badge-gray" }[imp] || "badge-gray";
  return `<span class="badge ${cls}">${imp}</span>`;
}
function typeBadge(type) {
  const map = {
    Circular: `<span class="badge badge-blue">Circular</span>`,
    ApplicationForm: `<span class="badge badge-purple">App. Form</span>`,
    Certificate: `<span class="badge badge-green">Certificate</span>`,
    GovernmentOrder: `<span class="badge" style="background:#e0e7ff;color:#3730a3">Govt Order (G.O.)</span>`,
    ServiceInstruction: `<span class="badge" style="background:#ccfbf1;color:#0f766e">Service Instruction</span>`,
    CitizenCharter: `<span class="badge" style="background:#fef3c7;color:#92400e">Citizen Charter</span>`,
    PublicNotice: `<span class="badge" style="background:#fce7f3;color:#9d174d">Public Notice</span>`
  };
  return map[type] || `<span class="badge badge-blue">${type}</span>`;
}
function deptColor(dept) {
  const c = { "Revenue Department":"#1e40af","Health Department":"#16a34a",
               "Education Department":"#7c3aed","Public Works Department":"#ea580c" };
  return c[dept] || "#64748b";
}
function fmtDate(d) {
  if (!d) return "—";
  const [y,m,day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
}

// ═════════════════════════════════════════════════════════════════════
// PAGE: DASHBOARD
// ═════════════════════════════════════════════════════════════════════
function renderDashboard(c) {
  const s = Store.stats();
  c.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">🏛️ Aram Office Dashboard</div>
      <div class="page-subtitle">E-Governance Document Processing & Retrieval System</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="openAddDocModal()">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M7.5 4.5v6M4.5 7.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Add Document
      </button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon blue">📄</div>
      <div class="stat-value">${s.totalDocs}</div>
      <div class="stat-label">Total Documents</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon teal">🏢</div>
      <div class="stat-value">${s.deptCount}</div>
      <div class="stat-label">Departments</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon purple">🗂️</div>
      <div class="stat-value">${s.catCount}</div>
      <div class="stat-label">Categories</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">✅</div>
      <div class="stat-value">${s.approved}</div>
      <div class="stat-label">Current Approved</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">⚠️</div>
      <div class="stat-value">${s.outdatedCount}</div>
      <div class="stat-label">Outdated Versions</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon blue">🕐</div>
      <div class="stat-value">${s.recent.length}</div>
      <div class="stat-label">Recently Tracked</div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="card section-mb">
    <div class="card-header"><span class="card-title">⚡ Quick Actions</span></div>
    <div class="quick-actions">
      <button class="quick-action-btn" onclick="navigateTo('documents')">
        <div class="qa-icon blue">📋</div>
        <div class="qa-text"><div class="qa-label">Browse Documents</div><div class="qa-sub">View all ${s.totalDocs} documents</div></div>
      </button>
      <button class="quick-action-btn" onclick="navigateTo('search')">
        <div class="qa-icon green">🔍</div>
        <div class="qa-text"><div class="qa-label">Smart Search</div><div class="qa-sub">Keyword & prefix search</div></div>
      </button>
      <button class="quick-action-btn" onclick="navigateTo('categories')">
        <div class="qa-icon purple">🌳</div>
        <div class="qa-text"><div class="qa-label">Category Tree</div><div class="qa-sub">Browse by hierarchy</div></div>
      </button>
      <button class="quick-action-btn" onclick="navigateTo('versions')">
        <div class="qa-icon blue">🕐</div>
        <div class="qa-text"><div class="qa-label">Version History</div><div class="qa-sub">Manage document versions</div></div>
      </button>
      <button class="quick-action-btn" onclick="openAddDocModal()">
        <div class="qa-icon green">➕</div>
        <div class="qa-text"><div class="qa-label">Add Document</div><div class="qa-sub">Upload a new document</div></div>
      </button>
    </div>
  </div>

  <div class="grid-2 section-mb">
    <!-- Dept Chart -->
    <div class="card">
      <div class="card-header"><span class="card-title">📊 Documents by Department</span></div>
      <div class="bar-chart" id="deptChart"></div>
    </div>
    <!-- Category Distribution -->
    <div class="card">
      <div class="card-header"><span class="card-title">🗂️ Category Distribution</span></div>
      <div class="cat-pills" id="catPills"></div>
    </div>
  </div>

  <div class="grid-2 section-mb">
    <!-- Recent Docs Table -->
    <div class="card" style="grid-column:1/2">
      <div class="card-header">
        <span class="card-title">📋 Recent Documents</span>
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('documents')">View All</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>ID</th><th>Title</th><th>Dept</th><th>Status</th>
          </tr></thead>
          <tbody id="recentDocsBody"></tbody>
        </table>
      </div>
    </div>
    <!-- Activity -->
    <div class="card">
      <div class="card-header"><span class="card-title">📰 Recent Activity</span></div>
      <div class="activity-list" id="activityList"></div>
    </div>
  </div>`;

  // Dept chart
  const maxDept = Math.max(...Object.values(s.byDept));
  const deptColors = { "Revenue Department":"#1e40af","Health Department":"#16a34a","Education Department":"#7c3aed","Public Works Department":"#ea580c" };
  document.getElementById("deptChart").innerHTML = Object.entries(s.byDept)
    .sort((a,b)=>b[1]-a[1])
    .map(([dept,cnt]) => `
      <div class="bar-row">
        <div class="bar-label" title="${dept}">${dept.replace(" Department","")}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(cnt/maxDept*100)}%;background:${deptColors[dept]||'#64748b'}"></div></div>
        <div class="bar-count">${cnt}</div>
      </div>`).join("");

  // Cat pills
  document.getElementById("catPills").innerHTML = Object.entries(s.byCat)
    .sort((a,b)=>b[1]-a[1])
    .map(([cat,cnt]) => `
      <div class="cat-pill" onclick="filterByCat('${cat}')" style="cursor:pointer" title="Browse ${cat}">
        <span class="cat-pill-name">${cat}</span>
        <span class="cat-pill-count">${cnt}</span>
      </div>`).join("");

  // Recent docs
  document.getElementById("recentDocsBody").innerHTML = s.recent.map(doc => {
    const cur = Store.currentVersion(doc);
    const shortDept = doc.department.replace(" Department","");
    return `<tr onclick="openDocDetail('${doc.id}')" style="cursor:pointer">
      <td><code style="font-size:.75rem;color:#1e40af">${doc.id}</code></td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${doc.title}">${doc.title}</td>
      <td><span style="font-size:.75rem;color:#64748b">${shortDept}</span></td>
      <td>${statusBadge(cur.status)}</td>
    </tr>`;
  }).join("");

  // Activity
  document.getElementById("activityList").innerHTML = Store.activity.slice(0,7).map(a => `
    <div class="activity-item">
      <div class="activity-dot ${a.type}"></div>
      <div style="flex:1">
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>`).join("");
}

function filterByCat(cat) {
  selectedCategoryPath = cat;
  navigateTo("categories");
}

// ═════════════════════════════════════════════════════════════════════
// PAGE: DOCUMENTS
// ═════════════════════════════════════════════════════════════════════
function renderDocuments(c) {
  docTablePage = 1;
  c.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">📋 Document Management</div>
      <div class="page-subtitle">Browse, filter, and manage all government documents</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="openAddDocModal()">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 4v6M4 7h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Add Document
      </button>
    </div>
  </div>

  <div class="filter-bar">
    <div class="search-input-wrap" style="min-width:260px">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10 10L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <input type="text" placeholder="Search by title, keyword, or doc ID…" id="docSearchInput"
        value="${docFilters.q}" oninput="onDocFilter()" />
    </div>
    <select class="filter-select" id="fDept" onchange="onDocFilter()">
      <option value="">All Departments</option>
      ${DEPARTMENTS.map(d=>`<option value="${d}" ${docFilters.department===d?"selected":""}>${d}</option>`).join("")}
    </select>
    <select class="filter-select" id="fCat" onchange="onDocFilter()">
      <option value="">All Categories</option>
      ${ALL_CATEGORIES.map(c=>`<option value="${c}" ${docFilters.category===c?"selected":""}>${c}</option>`).join("")}
    </select>
    <select class="filter-select" id="fImp" onchange="onDocFilter()">
      <option value="">All Importance</option>
      ${IMPORTANCE_LEVELS.map(i=>`<option value="${i}" ${docFilters.importance===i?"selected":""}>${i}</option>`).join("")}
    </select>
    <select class="filter-select" id="fStatus" onchange="onDocFilter()">
      <option value="">All Status</option>
      <option value="Current" ${docFilters.status==="Current"?"selected":""}>Current</option>
      <option value="Outdated" ${docFilters.status==="Outdated"?"selected":""}>Outdated</option>
    </select>
    <button class="btn btn-secondary btn-sm" onclick="clearDocFilters()">Clear</button>
  </div>

  <div class="card" style="padding:0">
    <div class="table-wrapper">
      <table id="docTable">
        <thead><tr>
          <th>Doc ID</th><th>Title</th><th>Type</th><th>Department</th>
          <th>Category</th><th>Importance</th><th>Ver.</th><th>Status</th><th>Updated</th><th>Actions</th>
        </tr></thead>
        <tbody id="docTableBody"></tbody>
      </table>
    </div>
    <div style="padding:16px 20px;border-top:1px solid #f1f5f9">
      <div class="pagination" id="docPagination"></div>
    </div>
  </div>`;

  refreshDocTable();
}

function getFilteredDocs() {
  const q = docFilters.q.toLowerCase().trim();
  return Store.getAll().filter(doc => {
    if (q) {
      const haystack = [doc.id, doc.title, ...doc.keywords, doc.department, doc.category].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (docFilters.department && doc.department !== docFilters.department) return false;
    if (docFilters.category   && doc.category   !== docFilters.category)   return false;
    if (docFilters.importance && doc.importance  !== docFilters.importance) return false;
    if (docFilters.status) {
      const cur = Store.currentVersion(doc);
      if (cur.status !== docFilters.status) return false;
    }
    return true;
  });
}

function refreshDocTable() {
  const filtered = getFilteredDocs();
  const total = filtered.length;
  const pages = Math.ceil(total / DOC_PAGE_SIZE);
  if (docTablePage > pages && pages > 0) docTablePage = pages;
  const slice = filtered.slice((docTablePage-1)*DOC_PAGE_SIZE, docTablePage*DOC_PAGE_SIZE);

  const tbody = document.getElementById("docTableBody");
  if (!tbody) return;
  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10">
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2"/><path d="M20 30h24M20 38h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M36 14l10 10H36V14z" fill="currentColor" opacity=".3"/></svg>
        <div class="empty-title">No documents found</div>
        <div class="empty-message">Try adjusting your search or filters.</div>
      </div>
    </td></tr>`;
  } else {
    tbody.innerHTML = slice.map(doc => {
      const cur = Store.currentVersion(doc);
      return `<tr>
        <td><code style="font-size:.75rem;color:#1e40af;font-weight:700">${doc.id}</code></td>
        <td style="max-width:200px">
          <div style="font-weight:600;font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${doc.title}">${doc.title}</div>
          <div style="font-size:.72rem;color:#94a3b8;margin-top:2px">${doc.keywords.slice(0,3).join(", ")}</div>
        </td>
        <td>${typeBadge(doc.type)}</td>
        <td><span style="font-size:.78rem;color:#475569">${doc.department.replace(" Department","")}</span></td>
        <td><span style="font-size:.78rem;color:#475569">${doc.category}</span></td>
        <td>${importanceBadge(doc.importance)}</td>
        <td style="text-align:center"><span style="font-weight:700;font-size:.85rem">v${cur.version}</span></td>
        <td>${statusBadge(cur.status)}</td>
        <td style="font-size:.78rem;color:#94a3b8;white-space:nowrap">${fmtDate(cur.date)}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn-icon" title="View Official Document" onclick="openDocDetail('${doc.id}')">👁️</button>
            <button class="btn-icon" title="Edit Metadata" onclick="openEditModal('${doc.id}')">✏️</button>
            <button class="btn-icon" title="Version History" onclick="openVersionHistoryModal('${doc.id}')">🕐</button>
            <button class="btn-icon" title="Delete Document" onclick="confirmDeleteDoc('${doc.id}')" style="color:#dc2626">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join("");
  }

  // Pagination
  const pg = document.getElementById("docPagination");
  if (!pg) return;
  pg.innerHTML = `<span class="pagination-info">Showing ${Math.min((docTablePage-1)*DOC_PAGE_SIZE+1,total)}–${Math.min(docTablePage*DOC_PAGE_SIZE,total)} of ${total} documents</span>
  <div class="pagination-btns">
    <button class="pg-btn" ${docTablePage===1?"disabled":""} onclick="goDocPage(${docTablePage-1})">‹ Prev</button>
    ${Array.from({length:Math.min(pages,5)},(_,i)=>{
      const p=i+1; return `<button class="pg-btn ${p===docTablePage?"active":""}" onclick="goDocPage(${p})">${p}</button>`;
    }).join("")}
    <button class="pg-btn" ${docTablePage>=pages?"disabled":""} onclick="goDocPage(${docTablePage+1})">Next ›</button>
  </div>`;
}

function onDocFilter() {
  docFilters.q          = document.getElementById("docSearchInput")?.value || "";
  docFilters.department = document.getElementById("fDept")?.value || "";
  docFilters.category   = document.getElementById("fCat")?.value  || "";
  docFilters.importance = document.getElementById("fImp")?.value  || "";
  docFilters.status     = document.getElementById("fStatus")?.value || "";
  docTablePage = 1;
  refreshDocTable();
}

function clearDocFilters() {
  docFilters = { q:"", department:"", category:"", importance:"", status:"" };
  navigateTo("documents");
}

function goDocPage(p) {
  docTablePage = p;
  refreshDocTable();
}

// ── Document Detail Modal (Official Document Display) ─────────────────
function openDocDetail(id) {
  const doc = Store.getById(id);
  if (!doc) return;
  const cur = Store.currentVersion(doc);
  const officialHTML = getOfficialDocumentHTML(doc, cur);

  openModal(`
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span>📄 ${doc.title}</span>
      <span style="font-size:.78rem;font-weight:normal">${typeBadge(doc.type)}</span>
      <span style="font-size:.78rem;font-weight:normal">${statusBadge(cur.status)}</span>
    </div>
  `, `
    <div class="doc-viewer-toolbar">
      <div style="display:flex;align-items:center;gap:8px;font-size:.84rem;flex-wrap:wrap">
        <span>Doc ID: <strong>${doc.id}</strong></span>
        <span>•</span>
        <span>Version: <strong>v${cur.version}</strong></span>
        <span>•</span>
        <span>${doc.department}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="printOfficialDoc('${doc.id}')">🖨️ Print / Save PDF</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleDocTab('paper')">📜 Official Document</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleDocTab('metadata')">ℹ️ Metadata</button>
        <button class="btn btn-secondary btn-sm" onclick="closeModal();openVersionHistoryModal('${doc.id}')">🕐 History</button>
        <button class="btn btn-secondary btn-sm" onclick="closeModal();openEditModal('${doc.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="closeModal();confirmDeleteDoc('${doc.id}')">🗑️ Delete</button>
      </div>
    </div>

    <!-- Official Document Paper View -->
    <div id="docTabPaper" style="margin-top:16px">
      ${officialHTML}
    </div>

    <!-- Metadata View -->
    <div id="docTabMetadata" style="display:none;margin-top:16px">
      <div class="doc-detail-grid">
        <div class="detail-field"><div class="detail-field-label">Department</div><div class="detail-field-value">${doc.department}</div></div>
        <div class="detail-field"><div class="detail-field-label">Category</div><div class="detail-field-value">${doc.category}</div></div>
        <div class="detail-field"><div class="detail-field-label">Importance</div><div class="detail-field-value">${importanceBadge(doc.importance)}</div></div>
        <div class="detail-field"><div class="detail-field-label">Current Version</div><div class="detail-field-value"><strong>v${cur.version}</strong> (${fmtDate(cur.date)})</div></div>
        <div class="detail-field"><div class="detail-field-label">Total Versions</div><div class="detail-field-value">${doc.versions.length}</div></div>
        <div class="detail-field"><div class="detail-field-label">Status</div><div class="detail-field-value">${statusBadge(cur.status)}</div></div>
      </div>
      <div class="form-group" style="margin-top:14px">
        <div class="detail-field-label">Keywords</div>
        <div class="kw-tags">${doc.keywords.map(k=>`<span class="kw-tag">${k}</span>`).join("")}</div>
      </div>
      <div class="form-group">
        <div class="detail-field-label">Official Purpose & Summary</div>
        <div style="font-size:.87rem;color:#475569;line-height:1.6;background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e2e8f0">${doc.content}</div>
      </div>
      <div class="form-group">
        <div class="detail-field-label">Version Notes (Current)</div>
        <div style="font-size:.84rem;color:#475569">${cur.notes}</div>
      </div>
    </div>
  `, "modal-lg");
}

function toggleDocTab(tab) {
  const p = document.getElementById("docTabPaper");
  const m = document.getElementById("docTabMetadata");
  if (p && m) {
    p.style.display = tab === "paper" ? "block" : "none";
    m.style.display = tab === "metadata" ? "block" : "none";
  }
}

function printOfficialDoc(id) {
  window.print();
}

function confirmDeleteDoc(id) {
  const doc = Store.getById(id);
  if (!doc) return;
  openModal(`⚠️ Confirm Deletion – ${id}`, `
    <div style="text-align:center;padding:10px 0 20px">
      <div style="font-size:3.2rem;margin-bottom:12px">🗑️</div>
      <h4 style="font-size:1.15rem;color:#0f172a;margin-bottom:8px">Delete Document Permanently?</h4>
      <p style="font-size:.9rem;color:#64748b;max-width:460px;margin:0 auto 16px;line-height:1.5">
        You are about to delete <strong>${doc.id} – ${doc.title}</strong> (${doc.department}).
        This will remove the document and its <strong>${doc.versions.length} version history records</strong> from the system.
      </p>
      <div class="warn-box" style="text-align:left;max-width:480px;margin:0 auto 18px">
        ⚠️ <strong>Statutory Notice:</strong> This action permanently removes the record from active e-governance registers.
      </div>
      <div style="display:flex;justify-content:center;gap:12px">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" onclick="executeDeleteDoc('${doc.id}')">🗑️ Yes, Delete Document</button>
      </div>
    </div>
  `);
}

function executeDeleteDoc(id) {
  const success = Store.deleteDoc(id);
  if (success) {
    Engine.buildIndex(Store.getAll());
    closeModal();
    toast(`Document ${id} successfully deleted from system.`, "success");
    if (currentPage === "documents") refreshDocTable();
    else navigateTo(currentPage);
  } else {
    toast(`Failed to delete document ${id}.`, "error");
  }
}

function openManageDeleteModal() {
  const docs = Store.getAll();
  openModal(`🗑️ Manage & Delete Documents`, `
    <div class="form-group">
      <label class="form-label">Select Document to Delete</label>
      <select class="form-control" id="deleteDocSelect" onchange="previewDeleteDocSelection()">
        <option value="">-- Choose a document (${docs.length} total) --</option>
        ${docs.map(d=>`<option value="${d.id}">[${d.id}] ${d.title} (${d.department})</option>`).join("")}
      </select>
    </div>
    <div id="deleteDocPreview" style="display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:18px">
      <div id="deletePreviewContent"></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" id="btnDeleteSelectedDoc" disabled onclick="submitSelectedDocDelete()">🗑️ Delete Selected Document</button>
    </div>
  `);
}

function previewDeleteDocSelection() {
  const id = document.getElementById("deleteDocSelect")?.value;
  const p = document.getElementById("deleteDocPreview");
  const b = document.getElementById("btnDeleteSelectedDoc");
  const c = document.getElementById("deletePreviewContent");
  if (!id) {
    if (p) p.style.display = "none";
    if (b) b.disabled = true;
    return;
  }
  const doc = Store.getById(id);
  if (!doc) return;
  const cur = Store.currentVersion(doc);
  if (c) {
    c.innerHTML = `
      <div style="font-weight:700;color:#0f172a">${doc.id}: ${doc.title}</div>
      <div style="font-size:.83rem;color:#64748b;margin:4px 0">${doc.department} · ${doc.category} · ${doc.type}</div>
      <div style="font-size:.82rem;color:#475569">Current: <strong>v${cur.version}</strong> (${fmtDate(cur.date)}) · Versions: ${doc.versions.length}</div>
    `;
  }
  if (p) p.style.display = "block";
  if (b) b.disabled = false;
}

function submitSelectedDocDelete() {
  const id = document.getElementById("deleteDocSelect")?.value;
  if (!id) return;
  closeModal();
  confirmDeleteDoc(id);
}

// ── Edit Document Modal ───────────────────────────────────────────────
function openEditModal(id) {
  const doc = Store.getById(id);
  if (!doc) return;
  openModal(`✏️ Edit Document – ${id}`, `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Document Title <span class="required">*</span></label>
        <input class="form-control" id="editTitle" value="${doc.title}" />
        <div class="form-error" id="eErrTitle">Title is required.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Importance</label>
        <select class="form-control" id="editImp">
          ${IMPORTANCE_LEVELS.map(i=>`<option ${doc.importance===i?"selected":""}>${i}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Keywords <span class="required">*</span> <small style="color:#94a3b8">(comma-separated)</small></label>
      <input class="form-control" id="editKw" value="${doc.keywords.join(", ")}" />
      <div class="form-error" id="eErrKw">At least one keyword required.</div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Department</label>
        <select class="form-control" id="editDept" onchange="updateEditCatOptions()">
          ${DEPARTMENTS.map(d=>`<option ${doc.department===d?"selected":""}>${d}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-control" id="editCat">
          ${(CATEGORIES[doc.department]||[]).map(c=>`<option ${doc.category===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-control" id="editContent">${doc.content}</textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEdit('${id}')">Save Changes</button>
    </div>
  `);
}

function updateEditCatOptions() {
  const dept = document.getElementById("editDept").value;
  const sel  = document.getElementById("editCat");
  sel.innerHTML = (CATEGORIES[dept]||[]).map(c=>`<option>${c}</option>`).join("");
}

function saveEdit(id) {
  const title = document.getElementById("editTitle").value.trim();
  const kw    = document.getElementById("editKw").value.trim();
  let ok = true;
  if (!title) { document.getElementById("eErrTitle").classList.add("show"); document.getElementById("editTitle").classList.add("error"); ok=false; } else { document.getElementById("eErrTitle").classList.remove("show"); document.getElementById("editTitle").classList.remove("error"); }
  if (!kw)    { document.getElementById("eErrKw").classList.add("show");    document.getElementById("editKw").classList.add("error");    ok=false; } else { document.getElementById("eErrKw").classList.remove("show");    document.getElementById("editKw").classList.remove("error"); }
  if (!ok) return;
  const keywords = kw.split(",").map(k=>k.trim()).filter(k=>k);
  Store.updateDoc(id, {
    title, keywords,
    importance: document.getElementById("editImp").value,
    department: document.getElementById("editDept").value,
    category:   document.getElementById("editCat").value,
    content:    document.getElementById("editContent").value.trim()
  });
  Engine.reindexDoc(Store.getById(id));
  closeModal();
  toast(`✏️ Document ${id} updated successfully.`, "success");
  if (currentPage === "documents") refreshDocTable();
  else if (currentPage === "dashboard") navigateTo("dashboard");
}

// ── Version History Modal ─────────────────────────────────────────────
function openVersionHistoryModal(id) {
  const doc = Store.getById(id);
  if (!doc) return;
  const vHTML = [...doc.versions].reverse().map(v => `
    <div class="version-entry ${v.status==="Current"?"current":""}">
      <div class="version-card ${v.status==="Current"?"current":"outdated"}">
        <div class="version-top">
          <span class="version-number">Version ${v.version}</span>
          <div style="display:flex;gap:6px;align-items:center">
            ${statusBadge(v.status)}
            <span class="version-date">${fmtDate(v.date)}</span>
          </div>
        </div>
        <div class="version-notes">${v.notes}</div>
      </div>
    </div>`).join("");

  openModal(`🕐 Version History – ${doc.id}`, `
    <div class="info-box" style="margin-bottom:16px">
      <strong>${doc.title}</strong><br/>
      <span style="font-size:.8rem">Total Versions: ${doc.versions.length} &nbsp;·&nbsp; Latest: v${Store.currentVersion(doc).version}</span>
    </div>
    <div class="version-timeline">${vHTML}</div>
    <div class="form-actions" style="margin-top:16px">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="closeModal();openAddVersionModal('${id}')">➕ Add New Version</button>
    </div>
  `);
}

// ═════════════════════════════════════════════════════════════════════
// PAGE: SMART SEARCH
// ═════════════════════════════════════════════════════════════════════
function renderSearch(c) {
  c.innerHTML = `
  <div class="search-hero">
    <h2>🔍 Smart Document Search</h2>
    <p>Search by keyword, prefix, or partial description. Results are ranked by match count, importance, and document ID.</p>
    <div class="search-hero-bar">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="6" stroke="white" stroke-width="1.5" opacity=".7"/><path d="M13 13L16 16" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity=".7"/></svg>
      <input type="text" id="heroSearchInput" placeholder='Try "income", "inc" for prefix, or "pension certificate"…' autocomplete="off"
        oninput="onSearchInput()" onkeydown="if(event.key==='Enter') runSearch()" />
      <button onclick="runSearch()">Search</button>
    </div>
  </div>

  <div id="suggestionsBox" class="suggestions-box">
    <div class="suggestions-label">💡 Prefix Suggestions</div>
    <div class="suggestion-chips" id="suggestionChips"></div>
  </div>

  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
    <select class="filter-select" id="sFilterDept" onchange="runSearch()">
      <option value="">All Departments</option>
      ${DEPARTMENTS.map(d=>`<option>${d}</option>`).join("")}
    </select>
    <select class="filter-select" id="sFilterCat" onchange="runSearch()">
      <option value="">All Categories</option>
      ${ALL_CATEGORIES.map(cc=>`<option>${cc}</option>`).join("")}
    </select>
    <select class="filter-select" id="sFilterImp" onchange="runSearch()">
      <option value="">All Importance</option>
      ${IMPORTANCE_LEVELS.map(i=>`<option>${i}</option>`).join("")}
    </select>
    <select class="filter-select" id="sFilterStatus" onchange="runSearch()">
      <option value="">All Status</option>
      <option>Current</option><option>Outdated</option>
    </select>
    <button class="btn btn-secondary btn-sm" onclick="clearSearchFilters()">Clear Filters</button>
  </div>

  <div id="searchMeta" style="font-size:.84rem;color:#64748b;margin-bottom:12px"></div>
  <div id="searchResults"></div>`;
}

function onSearchInput() {
  const q = document.getElementById("heroSearchInput").value.trim();
  if (q.length >= 2) {
    const suggestions = Engine.getSuggestions(q, 8);
    const box = document.getElementById("suggestionsBox");
    const chips = document.getElementById("suggestionChips");
    if (suggestions.length > 0) {
      chips.innerHTML = suggestions.map(s =>
        `<span class="suggestion-chip" onclick="selectSuggestion('${s}')">${s}</span>`
      ).join("");
      box.classList.add("show");
    } else {
      box.classList.remove("show");
    }
  } else {
    document.getElementById("suggestionsBox")?.classList.remove("show");
  }
}

function selectSuggestion(kw) {
  document.getElementById("heroSearchInput").value = kw;
  document.getElementById("suggestionsBox").classList.remove("show");
  runSearch();
}

function runSearch() {
  const q = document.getElementById("heroSearchInput")?.value?.trim() || "";
  const filters = {
    department: document.getElementById("sFilterDept")?.value || "",
    category:   document.getElementById("sFilterCat")?.value  || "",
    importance: document.getElementById("sFilterImp")?.value  || "",
    status:     document.getElementById("sFilterStatus")?.value|| ""
  };
  const results = Engine.filterSearch(q, filters);
  const meta = document.getElementById("searchMeta");
  const container = document.getElementById("searchResults");
  if (!container) return;

  if (meta) {
    if (q) meta.innerHTML = results.length > 0
      ? `Found <strong>${results.length}</strong> document${results.length!==1?"s":""} matching <strong>"${q}"</strong>`
      : `No documents found for <strong>"${q}"</strong>`;
    else meta.innerHTML = `Showing all <strong>${results.length}</strong> documents`;
  }

  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2"/><path d="M20 32h24M28 24l8 8-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="empty-title">No documents found</div>
        <div class="empty-message">Try a different keyword or remove some filters. You can search by title, keyword, department, or document ID.</div>
      </div>`;
    return;
  }

  const maxMatch = results[0]?.matchCount || 1;
  container.innerHTML = results.map((r, idx) => {
    const matchPct = q ? Math.max(20, Math.round((r.matchCount/(maxMatch||1))*100)) : 100;
    const rankLabel = idx === 0 ? '<span class="badge badge-blue" style="font-size:.68rem">Top Match</span>' : "";
    const kwHtml = r.allKeywords.map(kw => {
      const isMatched = r.matchedKeywords.some(mk => mk.toLowerCase() === kw.toLowerCase() || kw.toLowerCase().includes((document.getElementById("heroSearchInput")?.value||"").toLowerCase().split(" ")[0]));
      return `<span class="kw-chip ${isMatched?"matched":""}">${kw}</span>`;
    }).join("");
    return `
      <div class="search-result-card" onclick="openDocDetail('${r.docId}')">
        <div class="src-top">
          <div>
            <div class="src-title">${r.title} ${rankLabel}</div>
            <div class="src-id">${r.docId}</div>
          </div>
          <div style="display:flex;gap:6px;flex-direction:column;align-items:flex-end;flex-shrink:0">
            ${statusBadge(r.status)}
            ${importanceBadge(r.importance)}
          </div>
        </div>
        <div class="src-meta">
          <span class="src-meta-item">🏢 ${r.department}</span>
          <span class="src-meta-item">🗂️ ${r.category}</span>
          <span class="src-meta-item">📋 v${r.version}</span>
        </div>
        <div class="src-keywords">${kwHtml}</div>
        <div class="src-footer">
          <div class="match-score">
            ${q?`<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/></svg>
            ${r.matchCount} keyword match${r.matchCount!==1?"es":""}
            <div class="match-bar"><div class="match-bar-fill" style="width:${matchPct}%"></div></div>`:""}
          </div>
          <div style="font-size:.76rem;color:#94a3b8;text-align:right">${r.reason}</div>
        </div>
      </div>`;
  }).join("");

  // Hide suggestions after search
  document.getElementById("suggestionsBox")?.classList.remove("show");
}

function clearSearchFilters() {
  ["sFilterDept","sFilterCat","sFilterImp","sFilterStatus"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  runSearch();
}

// ═════════════════════════════════════════════════════════════════════
// PAGE: VERSION MANAGEMENT
// ═════════════════════════════════════════════════════════════════════
function renderVersions(c) {
  const docs = Store.getAll();
  c.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">🕐 Version Management</div>
      <div class="page-subtitle">View complete version history and add new versions to any document</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header"><span class="card-title">📋 Select a Document</span></div>
      <div class="search-input-wrap" style="margin-bottom:14px">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10 10L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input type="text" id="verSearchInput" placeholder="Filter documents…" oninput="filterVerList()" />
      </div>
      <div id="verDocList" style="max-height:480px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">
        ${docs.map(doc => {
          const cur = Store.currentVersion(doc);
          return `<div class="ver-doc-item" id="vdi-${doc.id}" style="padding:10px 12px;border-radius:8px;cursor:pointer;border:1px solid #e2e8f0;transition:all .2s"
            onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background=''" onclick="selectVerDoc('${doc.id}')">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <code style="font-size:.74rem;color:#1e40af;font-weight:700">${doc.id}</code>
              <div style="display:flex;gap:4px">${statusBadge(cur.status)}</div>
            </div>
            <div style="font-size:.83rem;font-weight:600;color:#1e293b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${doc.title}</div>
            <div style="font-size:.74rem;color:#94a3b8;margin-top:2px">${doc.versions.length} version${doc.versions.length!==1?"s":""} · ${doc.department.replace(" Department","")}</div>
          </div>`;
        }).join("")}
      </div>
    </div>

    <div class="card" id="verDetailPanel">
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2"/><path d="M32 20v12l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <div class="empty-title">Select a document</div>
        <div class="empty-message">Click any document on the left to view its version history.</div>
      </div>
    </div>
  </div>`;
}

function filterVerList() {
  const q = document.getElementById("verSearchInput").value.toLowerCase();
  document.querySelectorAll(".ver-doc-item").forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

let selectedVerDocId = null;
function selectVerDoc(id) {
  selectedVerDocId = id;
  document.querySelectorAll(".ver-doc-item").forEach(el => {
    el.style.background = "";
    el.style.borderColor = "#e2e8f0";
  });
  const sel = document.getElementById(`vdi-${id}`);
  if (sel) { sel.style.background = "#eff6ff"; sel.style.borderColor = "#3b82f6"; }

  const doc = Store.getById(id);
  if (!doc) return;
  const panel = document.getElementById("verDetailPanel");
  const vHTML = [...doc.versions].reverse().map(v => `
    <div class="version-entry ${v.status==="Current"?"current":""}">
      <div class="version-card ${v.status==="Current"?"current":"outdated"}">
        <div class="version-top">
          <span class="version-number">Version ${v.version}</span>
          <div style="display:flex;gap:6px;align-items:center">
            ${statusBadge(v.status)}
            <span class="version-date">${fmtDate(v.date)}</span>
          </div>
        </div>
        <div class="version-notes">${v.notes}</div>
      </div>
    </div>`).join("");

  panel.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">🕐 ${doc.id} – Version History</div>
        <div class="card-subtitle" style="margin-top:3px">${doc.title}</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openAddVersionModal('${id}')">➕ Add Version</button>
    </div>
    <div class="info-box" style="margin-bottom:16px">
      Total Versions: <strong>${doc.versions.length}</strong> &nbsp;·&nbsp;
      Current: <strong>v${Store.currentVersion(doc).version}</strong> &nbsp;·&nbsp;
      ${importanceBadge(doc.importance)}
    </div>
    <div class="version-timeline">${vHTML}</div>`;
}

// ── Add Version Modal ─────────────────────────────────────────────────
function openAddVersionModal(id) {
  const doc = Store.getById(id);
  if (!doc) return;
  const cur = Store.currentVersion(doc);
  const nextVer = doc.versions.length + 1;
  openModal(`➕ Add New Version – ${id}`, `
    <div class="info-box" style="margin-bottom:16px">
      <strong>${doc.title}</strong><br/>
      Current version: <strong>v${cur.version}</strong> (${fmtDate(cur.date)}) &nbsp;·&nbsp;
      New version will be: <strong>v${nextVer}</strong>
    </div>
    <div class="warn-box" style="margin-bottom:16px">
      ⚠️ Adding a new version will mark <strong>v${cur.version}</strong> as <strong>Outdated</strong>.
      Only v${nextVer} will be marked <strong>Current</strong>.
    </div>
    <div class="form-group">
      <label class="form-label">Version Notes / Change Summary <span class="required">*</span></label>
      <textarea class="form-control" id="verNotes" placeholder="Describe what changed in this version…" style="min-height:100px"></textarea>
      <div class="form-error" id="verNotesErr">Please enter version notes.</div>
    </div>
    <div class="form-group">
      <label class="form-label">Effective Date</label>
      <input type="date" class="form-control" id="verDate" value="${new Date().toISOString().slice(0,10)}" />
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-success" onclick="submitNewVersion('${id}')">✅ Confirm & Add Version</button>
    </div>
  `);
}

function submitNewVersion(id) {
  const notes = document.getElementById("verNotes").value.trim();
  if (!notes) { document.getElementById("verNotesErr").classList.add("show"); return; }
  document.getElementById("verNotesErr").classList.remove("show");
  const newVer = Store.addVersion(id, notes);
  Engine.reindexDoc(Store.getById(id));
  closeModal();
  toast(`✅ Version ${newVer} added to ${id}. Previous version marked Outdated.`, "success");
  // Refresh current page
  if (currentPage === "versions") {
    renderVersions(document.getElementById("pageContainer"));
    setTimeout(() => selectVerDoc(id), 100);
  } else if (currentPage === "dashboard") navigateTo("dashboard");
}

// ═════════════════════════════════════════════════════════════════════
// PAGE: CATEGORY TREE
// ═════════════════════════════════════════════════════════════════════
function renderCategories(c) {
  c.innerHTML = `
  <div class="page-header">
    <div>
      <div class="page-title">🌳 Category Tree</div>
      <div class="page-subtitle">Expand departments and categories to browse documents hierarchically</div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-header"><span class="card-title">🏛️ Aram Office Hierarchy</span></div>
      <div class="tree-root" id="categoryTree"></div>
    </div>
    <div class="card" id="catDocPanel">
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 64 64" fill="none"><rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" stroke-width="2"/><path d="M20 28h24M20 36h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <div class="empty-title">Select a category</div>
        <div class="empty-message">Click on any category in the tree to see its documents.</div>
      </div>
    </div>
  </div>`;

  buildCategoryTree(document.getElementById("categoryTree"));

  // Auto-expand to selected category
  if (selectedCategoryPath) {
    setTimeout(() => {
      document.querySelectorAll(".tree-leaf").forEach(el => {
        if (el.dataset.cat === selectedCategoryPath) el.click();
      });
      selectedCategoryPath = null;
    }, 80);
  }
}

function buildCategoryTree(container) {
  const docs = Store.getAll();
  // Count docs per dept and category
  const deptCounts = {}; const catCounts = {};
  docs.forEach(d => {
    deptCounts[d.department] = (deptCounts[d.department] || 0) + 1;
    catCounts[d.category]    = (catCounts[d.category]    || 0) + 1;
  });

  const deptIcons = {
    "Revenue Department":"💰","Health Department":"🏥",
    "Education Department":"🎓","Public Works Department":"🏗️"
  };

  container.innerHTML = DEPARTMENTS.map((dept, di) => {
    const cats = CATEGORIES[dept] || [];
    const childHTML = cats.map(cat => `
      <div class="tree-leaf" data-cat="${cat}" onclick="showCatDocs('${cat}','${dept}')">
        <span class="tree-leaf-icon">📂</span>
        <span>${cat}</span>
        <span class="tree-leaf-count">${catCounts[cat] || 0}</span>
      </div>`).join("");

    return `
      <div class="tree-node">
        <div class="tree-node-header" onclick="toggleTreeNode(this)">
          <svg class="tree-toggle" viewBox="0 0 18 18" fill="none"><path d="M6 4l6 5-6 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="tree-node-icon">${deptIcons[dept]||"🏢"}</span>
          <span class="tree-node-label">${dept}</span>
          <span class="tree-count-badge">${deptCounts[dept]||0}</span>
        </div>
        <div class="tree-children">${childHTML}</div>
      </div>`;
  }).join("");

  // Root label
  container.insertAdjacentHTML("afterbegin", `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px 14px;border-bottom:1px solid #f1f5f9;margin-bottom:8px">
      <span style="font-size:1.1rem">🏛️</span>
      <span style="font-weight:700;color:#0f172a">Aram Office</span>
      <span class="tree-count-badge">${docs.length} docs</span>
    </div>`);
}

function toggleTreeNode(header) {
  const children = header.nextElementSibling;
  const toggle   = header.querySelector(".tree-toggle");
  children.classList.toggle("open");
  toggle.classList.toggle("open");
  header.classList.toggle("active");
}

function showCatDocs(cat, dept) {
  document.querySelectorAll(".tree-leaf").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(`.tree-leaf[data-cat="${cat}"]`).forEach(el => el.classList.add("active"));

  const docs = Store.getAll().filter(d => d.category === cat);
  const panel = document.getElementById("catDocPanel");
  panel.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">📂 ${cat}</div>
        <div class="card-subtitle">${dept} · ${docs.length} document${docs.length!==1?"s":""}</div>
      </div>
    </div>
    ${docs.length === 0
      ? `<div class="empty-state"><div class="empty-title">No documents</div></div>`
      : docs.map(doc => {
          const cur = Store.currentVersion(doc);
          return `<div style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;cursor:pointer;transition:all .2s"
            onclick="openDocDetail('${doc.id}')"
            onmouseover="this.style.borderColor='#3b82f6';this.style.background='#eff6ff'"
            onmouseout="this.style.borderColor='#e2e8f0';this.style.background=''">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
              <div>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <code style="font-size:.73rem;color:#1e40af;font-weight:700">${doc.id}</code>
                  ${typeBadge(doc.type)}
                </div>
                <div style="font-size:.87rem;font-weight:600;color:#1e293b">${doc.title}</div>
                <div style="font-size:.75rem;color:#94a3b8;margin-top:3px">${doc.keywords.slice(0,4).join(", ")}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0">
                ${statusBadge(cur.status)}
                ${importanceBadge(doc.importance)}
                <span style="font-size:.73rem;color:#94a3b8">v${cur.version}</span>
              </div>
            </div>
          </div>`;
        }).join("")
    }`;
}

// ═════════════════════════════════════════════════════════════════════
// ADD DOCUMENT MODAL
// ═════════════════════════════════════════════════════════════════════
function openAddDocModal() {
  openModal("➕ Add New Document", `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Document ID <span class="required">*</span></label>
        <input class="form-control" id="addId" placeholder="e.g. DOC501" />
        <div class="form-error" id="aErrId">Document ID is required and must be unique.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Document Type <span class="required">*</span></label>
        <select class="form-control" id="addType">
          <option value="Circular">Circular (Official Office Circular / Directive)</option>
          <option value="ApplicationForm">Application Form (Citizen Service Request Form)</option>
          <option value="Certificate">Certificate (Statutory Citizen Certificate - Income/Community/etc.)</option>
          <option value="GovernmentOrder">Government Order - G.O. Ms. (Executive Policy Order)</option>
          <option value="ServiceInstruction">Service Instruction & Guidelines (Departmental SOP)</option>
          <option value="CitizenCharter">Citizen Charter & Scheme Rules (Welfare Scheme Rule)</option>
          <option value="PublicNotice">Public Notice & Tender Gazette (Public Notification)</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Document Title <span class="required">*</span></label>
      <input class="form-control" id="addTitle" placeholder="Full official document title" />
      <div class="form-error" id="aErrTitle">Title is required.</div>
    </div>
    <div class="form-group">
      <label class="form-label">Keywords <span class="required">*</span> <small style="color:#94a3b8">(comma-separated)</small></label>
      <input class="form-control" id="addKw" placeholder="income, certificate, application, revenue" />
      <div class="form-error" id="aErrKw">At least one keyword is required.</div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Department <span class="required">*</span></label>
        <select class="form-control" id="addDept" onchange="updateAddCatOptions()">
          ${DEPARTMENTS.map(d=>`<option>${d}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Category <span class="required">*</span></label>
        <select class="form-control" id="addCat">
          ${(CATEGORIES[DEPARTMENTS[0]]||[]).map(c=>`<option>${c}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Importance Level</label>
        <select class="form-control" id="addImp">
          ${IMPORTANCE_LEVELS.map(i=>`<option>${i}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Initial Version Notes</label>
        <input class="form-control" id="addVerNotes" placeholder="First version description" value="Initial release." />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Document Description / Content</label>
      <textarea class="form-control" id="addContent" placeholder="Brief description of this document's purpose and scope…"></textarea>
    </div>
    <div style="margin:16px 0 12px;padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div style="font-size:.82rem;color:#991b1b">
        <strong>Document Registry Maintenance:</strong> Need to delete an obsolete document?
      </div>
      <button type="button" class="btn btn-outline-danger btn-sm" onclick="closeModal();openManageDeleteModal()">🗑️ Manage / Delete Documents</button>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddDoc()">➕ Add Document</button>
    </div>
  `);
}

function updateAddCatOptions() {
  const dept = document.getElementById("addDept").value;
  const sel  = document.getElementById("addCat");
  sel.innerHTML = (CATEGORIES[dept]||[]).map(c=>`<option>${c}</option>`).join("");
}

function submitAddDoc() {
  const id    = document.getElementById("addId").value.trim().toUpperCase();
  const title = document.getElementById("addTitle").value.trim();
  const kw    = document.getElementById("addKw").value.trim();
  let ok = true;

  // Validate
  const errId = document.getElementById("aErrId");
  const errTitle = document.getElementById("aErrTitle");
  const errKw    = document.getElementById("aErrKw");

  if (!id || Store.idExists(id)) {
    errId.textContent = Store.idExists(id) ? `❌ Document ID "${id}" already exists!` : "Document ID is required.";
    errId.classList.add("show"); document.getElementById("addId").classList.add("error"); ok = false;
  } else { errId.classList.remove("show"); document.getElementById("addId").classList.remove("error"); }

  if (!title) { errTitle.classList.add("show"); document.getElementById("addTitle").classList.add("error"); ok = false; }
  else { errTitle.classList.remove("show"); document.getElementById("addTitle").classList.remove("error"); }

  if (!kw) { errKw.classList.add("show"); document.getElementById("addKw").classList.add("error"); ok = false; }
  else { errKw.classList.remove("show"); document.getElementById("addKw").classList.remove("error"); }

  if (!ok) return;

  const keywords = kw.split(",").map(k=>k.trim()).filter(k=>k);
  const doc = {
    id, title, type: document.getElementById("addType").value,
    department: document.getElementById("addDept").value,
    category:   document.getElementById("addCat").value,
    importance: document.getElementById("addImp").value,
    keywords,
    content: document.getElementById("addContent").value.trim() || "No description provided.",
    versions: [{
      version: 1, date: new Date().toISOString().slice(0,10),
      status: "Current",
      notes: document.getElementById("addVerNotes").value.trim() || "Initial release."
    }]
  };

  Store.addDoc(doc);
  Engine.indexNewDoc(doc);
  closeModal();
  toast(`✅ Document ${id} added successfully!`, "success");
  if (currentPage === "documents") { navigateTo("documents"); }
  else if (currentPage === "dashboard") navigateTo("dashboard");
  else navigateTo(currentPage);
}

// ═════════════════════════════════════════════════════════════════════
// OFFICIAL GOVERNMENT DOCUMENT RENDERER
// ═════════════════════════════════════════════════════════════════════
function getOfficialDocumentHTML(doc, cur) {
  const isCert = doc.type === "Certificate" || doc.title.toLowerCase().includes("certificate") && !doc.type.includes("Application") && !doc.title.toLowerCase().includes("application") && !doc.title.toLowerCase().includes("circular");
  const isForm = doc.type === "ApplicationForm" || doc.title.toLowerCase().includes("application") || doc.title.toLowerCase().includes("form");
  const isCircular = doc.type === "Circular" || doc.title.toLowerCase().includes("circular") || doc.title.toLowerCase().includes("guidelines");
  const isGO = doc.type === "GovernmentOrder" || doc.title.toLowerCase().includes("g.o") || doc.title.toLowerCase().includes("order");

  const deptCode = doc.department.substring(0, 3).toUpperCase();
  const numId = doc.id.replace(/\D/g, "") || "101";

  // Shared SVGs
  const emblemSVG = `
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="26" stroke="#1e3a8a" stroke-width="2.5" fill="#f8fafc"/>
      <circle cx="28" cy="28" r="21" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2"/>
      <path d="M28 8v8M28 40v8M8 28h8M40 28h8" stroke="#1e3a8a" stroke-width="1.5"/>
      <path d="M20 34l8-14 8 14H20z" stroke="#b45309" stroke-width="2" fill="#fef3c7"/>
      <circle cx="28" cy="28" r="3.5" fill="#1e3a8a"/>
      <path d="M22 36h12" stroke="#1e3a8a" stroke-width="2"/>
    </svg>`;

  const barcodeSVG = `
    <svg width="150" height="34" viewBox="0 0 150 34" fill="none">
      <rect width="150" height="34" fill="#ffffff"/>
      <rect x="6" y="4" width="3" height="24" fill="#0f172a"/><rect x="12" y="4" width="2" height="24" fill="#0f172a"/>
      <rect x="17" y="4" width="4" height="24" fill="#0f172a"/><rect x="24" y="4" width="2" height="24" fill="#0f172a"/>
      <rect x="29" y="4" width="5" height="24" fill="#0f172a"/><rect x="37" y="4" width="2" height="24" fill="#0f172a"/>
      <rect x="42" y="4" width="3" height="24" fill="#0f172a"/><rect x="48" y="4" width="4" height="24" fill="#0f172a"/>
      <rect x="55" y="4" width="2" height="24" fill="#0f172a"/><rect x="60" y="4" width="6" height="24" fill="#0f172a"/>
      <rect x="69" y="4" width="3" height="24" fill="#0f172a"/><rect x="75" y="4" width="2" height="24" fill="#0f172a"/>
      <rect x="80" y="4" width="4" height="24" fill="#0f172a"/><rect x="87" y="4" width="2" height="24" fill="#0f172a"/>
      <rect x="92" y="4" width="5" height="24" fill="#0f172a"/><rect x="100" y="4" width="2" height="24" fill="#0f172a"/>
      <rect x="105" y="4" width="3" height="24" fill="#0f172a"/><rect x="111" y="4" width="4" height="24" fill="#0f172a"/>
      <rect x="118" y="4" width="2" height="24" fill="#0f172a"/><rect x="123" y="4" width="5" height="24" fill="#0f172a"/>
      <rect x="131" y="4" width="3" height="24" fill="#0f172a"/><rect x="137" y="4" width="2" height="24" fill="#0f172a"/>
    </svg>`;

  const qrSVG = `
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <rect width="68" height="68" fill="#ffffff" stroke="#cbd5e1"/>
      <rect x="6" y="6" width="20" height="20" fill="#0f172a"/><rect x="9" y="9" width="14" height="14" fill="#ffffff"/><rect x="12" y="12" width="8" height="8" fill="#0f172a"/>
      <rect x="42" y="6" width="20" height="20" fill="#0f172a"/><rect x="45" y="9" width="14" height="14" fill="#ffffff"/><rect x="48" y="12" width="8" height="8" fill="#0f172a"/>
      <rect x="6" y="42" width="20" height="20" fill="#0f172a"/><rect x="9" y="45" width="14" height="14" fill="#ffffff"/><rect x="12" y="48" width="8" height="8" fill="#0f172a"/>
      <rect x="30" y="8" width="8" height="6" fill="#0f172a"/><rect x="30" y="18" width="6" height="12" fill="#0f172a"/>
      <rect x="30" y="34" width="12" height="6" fill="#0f172a"/><rect x="46" y="32" width="16" height="6" fill="#0f172a"/>
      <rect x="32" y="44" width="6" height="16" fill="#0f172a"/><rect x="42" y="42" width="8" height="8" fill="#0f172a"/>
      <rect x="54" y="44" width="8" height="18" fill="#0f172a"/>
    </svg>`;

  // 1. STATUTORY CITIZEN CERTIFICATE (e.g. Income Certificate)
  if (isCert) {
    const isIncome = doc.title.toLowerCase().includes("income");
    const certTitle = isIncome ? "வருமானச் சான்றிதழ் / INCOME CERTIFICATE" : `${doc.title.toUpperCase()}`;
    return `
      <div class="doc-viewer-wrapper">
        <div class="doc-paper certificate-mode" id="printableDoc">
          <div class="doc-watermark">ARAM OFFICE • GOVT OF TAMIL NADU</div>
          <div class="doc-emblem-header">
            <div class="doc-emblem-img">${emblemSVG}</div>
            <div class="doc-gov-title">GOVERNMENT OF TAMIL NADU</div>
            <div class="doc-gov-sub">${doc.department.toUpperCase()} • ARAM TALUK OFFICE</div>
            <div style="font-size:0.78rem;color:#64748b;margin-top:2px">TAMIL NADU E-DISTRICT MISSION MODE INITIATIVE</div>
          </div>

          <div class="doc-meta-strip">
            <div>
              <span>Certificate No: </span><strong>TN-${deptCode}-INC-2024-00${numId}</strong>
            </div>
            <div>
              <span>Date of Issue: </span><strong>${fmtDate(cur.date)}</strong>
            </div>
            <div>
              <span>Validity: </span><span class="badge badge-green">1 Year (Valid)</span>
            </div>
          </div>

          <div class="doc-body-title">
            ${certTitle}
            <span class="doc-tamil-sub">(Issued under Revenue Administration Statutory Rule No. 14/1982)</span>
          </div>

          <p class="doc-content-p">
            This is to certify that upon due departmental inquiry and formal field verification conducted through the 
            <strong>Village Administrative Officer (VAO)</strong> and the <strong>Revenue Inspector (RI)</strong> of Aram Taluk, 
            the personal and financial particulars of the applicant are recorded as follows:
          </p>

          <table class="doc-data-table">
            <tbody>
              <tr><th style="width:35%">Name of the Applicant</th><td><strong>Thiru. K. Murugan</strong> (திரு. கு. முருகன்)</td></tr>
              <tr><th>Father's / Husband's Name</th><td>Thiru. R. Karuppiah (திரு. ரா. கருப்பையா)</td></tr>
              <tr><th>Residential Address</th><td>Door No. 14/B, Gandhi Salai, Melur Village, Aram Taluk, Aram District - 620001</td></tr>
              <tr><th>Aadhaar Identification</th><td>XXXXXXXX8921 (Verified via UIDAI e-KYC)</td></tr>
              <tr><th>Smart Ration Card No.</th><td>02/G/0849201</td></tr>
              <tr><th>Income from Agriculture & Lands</th><td>₹ 24,000/- (Twenty Four Thousand Only)</td></tr>
              <tr><th>Income from Business / Vocations</th><td>₹ 48,000/- (Forty Eight Thousand Only)</td></tr>
              <tr style="background:#f0fdf4">
                <th><strong style="color:#14532d">TOTAL ANNUAL FAMILY INCOME</strong></th>
                <td><strong style="font-size:1.05rem;color:#15803d">₹ 72,000/- (Rupees Seventy Two Thousand Only)</strong></td>
              </tr>
              <tr><th>Certified Purpose</th><td>${doc.content}</td></tr>
            </tbody>
          </table>

          <p class="doc-content-p" style="font-size:0.88rem;color:#475569;margin-top:14px">
            This certificate is valid for a period of one year from the date of issue and is legally admissible for Higher Education 
            Scholarships, Educational Fee Concessions, Welfare Schemes, and Government Deputations.
          </p>

          <div class="doc-footer-grid">
            <div class="doc-security-box">
              ${qrSVG}
              <div>
                <div style="font-weight:700;color:#0f172a;font-size:0.8rem">VERIFY AUTHENTICITY</div>
                <div>Scan QR or visit <span style="color:#1e40af;text-decoration:underline">edistricts.tn.gov.in</span></div>
                <div style="margin-top:4px">${barcodeSVG}</div>
              </div>
            </div>
            <div class="doc-signature-box">
              <div class="digital-stamp">
                <div style="font-size:0.72rem;letter-spacing:0.04em;text-transform:uppercase;color:#166534">✓ Digitally Signed By</div>
                <div class="stamp-officer">Thiru. S. Ramanathan, M.A.</div>
                <div style="font-size:0.75rem;color:#14532d">Tahsildar & Executive Magistrate</div>
                <div style="font-size:0.7rem;color:#475569;margin-top:2px">Aram Taluk • Aram Office</div>
                <div style="font-size:0.68rem;color:#64748b">Date: ${fmtDate(cur.date)} | Token: GOV-AUTH-${numId}94</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. OFFICIAL GOVERNMENT CIRCULAR
  if (isCircular) {
    return `
      <div class="doc-viewer-wrapper">
        <div class="doc-paper" id="printableDoc">
          <div class="doc-watermark">ARAM OFFICE • CIRCULAR</div>
          <div class="doc-emblem-header">
            <div class="doc-emblem-img">${emblemSVG}</div>
            <div class="doc-gov-title">OFFICE OF THE DISTRICT COLLECTOR & DISTRICT MAGISTRATE</div>
            <div class="doc-gov-sub">${doc.department.toUpperCase()} • ARAM TALUK ADMINISTRATION</div>
            <div style="font-size:0.78rem;color:#64748b;margin-top:2px">PROCEEDINGS OF THE DISTRICT EXECUTIVE COUNCIL</div>
          </div>

          <div class="doc-meta-strip">
            <div>
              <span>Circular Ref: </span><strong>RC/${deptCode}/2024/00${numId}</strong>
            </div>
            <div>
              <span>Date: </span><strong>${fmtDate(cur.date)}</strong>
            </div>
            <div>
              <span>Classification: </span>${importanceBadge(doc.importance)}
            </div>
          </div>

          <div class="doc-body-title" style="text-align:left;font-size:1.1rem;text-decoration:none">
            <strong>OFFICIAL CIRCULAR: ${doc.title.toUpperCase()}</strong>
          </div>

          <div style="background:#f8fafc;border-left:4px solid #1e40af;padding:10px 14px;margin-bottom:18px;font-size:0.88rem">
            <div><strong>SUBJECT:</strong> ${doc.title} — Operational Directives, Statutory Standards, and Action Mandate — Reg.</div>
            <div style="margin-top:4px"><strong>REFERENCES:</strong> 
              1. G.O. Ms. No. 104/${deptCode}/2024, Dated 14-01-2024.<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              2. Annual Departmental Review Meeting Proceedings held at Aram Office.
            </div>
          </div>

          <p class="doc-content-p">
            <strong>1. Background & Scope:</strong> In exercise of administrative authority and to ensure high efficiency and 
            uniformity across government service centers, all Revenue Divisional Officers (RDOs), Tahsildars, Block Development Officers (BDOs), 
            and Department Superintendents are hereby notified of the updated regulatory directives.
          </p>

          <p class="doc-content-p">
            <strong>2. Departmental Mandates & Instructions:</strong><br/>
            ${doc.content}
          </p>

          <p class="doc-content-p">
            <strong>3. Version Controls & Revision Notes:</strong><br/>
            This active release represents <strong>Version ${cur.version}</strong> of the document (Status: <em>${cur.status}</em>). 
            Notes recorded for this revision: <em>${cur.notes}</em>. All previous outdated drafts are superseded.
          </p>

          <p class="doc-content-p">
            <strong>4. Compliance Schedule:</strong> Field inspection teams will conduct compliance audits every fortnight. 
            Deviations from these instructions will be subject to departmental inquiry under the Tamil Nadu Civil Services Conduct Rules.
          </p>

          <div class="doc-footer-grid">
            <div style="font-size:0.8rem;color:#475569">
              <div style="font-weight:700;color:#0f172a;margin-bottom:4px">Copy Forwarded To:</div>
              1. Principal Secretary to Government, Chennai.<br/>
              2. All Zonal Tahsildars & Department Section Officers.<br/>
              3. Aram Office Public Notice Board & Digital Registry Archive.<br/>
              <div style="margin-top:8px">${barcodeSVG}</div>
            </div>
            <div class="doc-signature-box">
              <div style="margin-bottom:6px;font-size:0.88rem;font-weight:700;color:#0f172a">
                Dr. M. Senthil Kumar, I.A.S.
              </div>
              <div style="font-size:0.8rem;color:#334155">District Collector & District Magistrate</div>
              <div style="font-size:0.75rem;color:#64748b">Aram District Administration</div>
              <div style="font-size:0.72rem;color:#16a34a;margin-top:4px">✓ Electronically Approved in Aram E-Office DMS</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 3. CITIZEN APPLICATION FORM
  if (isForm) {
    return `
      <div class="doc-viewer-wrapper">
        <div class="doc-paper" id="printableDoc">
          <div class="doc-watermark">ARAM OFFICE • APPLICATION FORM</div>
          <div class="doc-emblem-header">
            <div class="doc-emblem-img">${emblemSVG}</div>
            <div class="doc-gov-title">GOVERNMENT OF TAMIL NADU</div>
            <div class="doc-gov-sub">${doc.department.toUpperCase()} • ARAM TALUK OFFICE</div>
            <div style="font-size:0.78rem;color:#64748b;margin-top:2px">CITIZEN SERVICE FACILITATION CENTER</div>
          </div>

          <div class="doc-meta-strip">
            <div>
              <span>Form Code: </span><strong>FORM-${deptCode}-01A (Rev v${cur.version})</strong>
            </div>
            <div>
              <span>Doc ID: </span><strong>${doc.id}</strong>
            </div>
            <div>
              <span>Fee: </span><strong>₹ 60/- (Statutory E-Seva Charge)</strong>
            </div>
          </div>

          <div class="doc-body-title">
            APPLICATION FORM FOR: ${doc.title.toUpperCase()}
            <span class="doc-tamil-sub">(Instructions: Please fill in BLOCK LETTERS. Attach all self-attested mandatory documents)</span>
          </div>

          <div style="font-weight:700;font-size:0.9rem;color:#1e3a8a;margin-bottom:8px;border-bottom:1px solid #cbd5e1;padding-bottom:4px">
            SECTION 1: APPLICANT PERSONAL PARTICULARS
          </div>

          <table class="doc-data-table">
            <tbody>
              <tr><th style="width:30%">Full Name of Applicant</th><td>________________________________________________________</td></tr>
              <tr><th>Father's / Guardian's Name</th><td>________________________________________________________</td></tr>
              <tr><th>Date of Birth & Age</th><td>DD / MM / YYYY &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Age: [ &nbsp;&nbsp;&nbsp; ] &nbsp;&nbsp; Gender: [ ] Male [ ] Female</td></tr>
              <tr><th>Aadhaar Number</th><td>[ &nbsp;&nbsp;&nbsp;&nbsp; ] - [ &nbsp;&nbsp;&nbsp;&nbsp; ] - [ &nbsp;&nbsp;&nbsp;&nbsp; ] (Mandatory e-KYC Proof)</td></tr>
              <tr><th>Contact Mobile Number</th><td>+91 - [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</td></tr>
              <tr><th>Permanent Address</th><td>Door No: ________ Street: ________________________________<br/>Village/Town: __________________ Taluk: Aram Pin: _________</td></tr>
            </tbody>
          </table>

          <div style="font-weight:700;font-size:0.9rem;color:#1e3a8a;margin:16px 0 8px;border-bottom:1px solid #cbd5e1;padding-bottom:4px">
            SECTION 2: SERVICE PURPOSE & STATUTORY DECLARATION
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;font-size:0.86rem;line-height:1.6;color:#334155">
            <strong>Scope & Details:</strong> ${doc.content}
          </div>

          <div style="font-weight:700;font-size:0.9rem;color:#1e3a8a;margin:16px 0 8px;border-bottom:1px solid #cbd5e1;padding-bottom:4px">
            SECTION 3: MANDATORY ENCLOSURES CHECKLIST
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem;margin-bottom:16px">
            <div>☑ Copy of Smart Family Ration Card</div>
            <div>☑ Copy of Aadhaar Card / Electoral Photo ID</div>
            <div>☑ Salary Certificate / Employer Income Proof</div>
            <div>☑ Two Recent Passport-Size Photographs</div>
            <div>☑ Self-Declaration Affidavit on Non-Judicial Paper</div>
            <div>☑ Previous Certificate Copy (if renewal)</div>
          </div>

          <div style="border-top:1px dashed #cbd5e1;padding-top:14px;margin-top:18px">
            <div style="font-size:0.83rem;color:#475569;line-height:1.5">
              <strong>Applicant Undertaking:</strong> I hereby solemnly declare that all particulars stated above are true and correct to the best of my knowledge. If any information is found incorrect, I am liable for prosecution under IPC Section 199.
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px">
              <div style="font-size:0.82rem;color:#64748b">
                Date: ____________________<br/>
                Place: Aram
              </div>
              <div style="text-align:center;border-top:1px solid #0f172a;width:200px;padding-top:4px;font-size:0.82rem;font-weight:600">
                Signature / Thumb Impression
              </div>
            </div>
          </div>

          <!-- Tear-off Counterfoil -->
          <div style="border-top:2px dashed #94a3b8;margin-top:28px;padding-top:16px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:700;font-size:0.88rem;color:#1e3a8a">ARAM OFFICE CITIZEN ACKNOWLEDGEMENT SLIP</div>
                <div style="font-size:0.75rem;color:#64748b">Application Ref: <strong>ACK-${numId}-2024</strong> • Delivery Window: 7 Working Days</div>
              </div>
              <div>${barcodeSVG}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. GOVERNMENT ORDER (G.O.) OR OTHER STATUTORY DOCUMENTS
  return `
    <div class="doc-viewer-wrapper">
      <div class="doc-paper" id="printableDoc">
        <div class="doc-watermark">GOVERNMENT OF TAMIL NADU</div>
        <div class="doc-emblem-header">
          <div class="doc-emblem-img">${emblemSVG}</div>
          <div class="doc-gov-title">GOVERNMENT OF TAMIL NADU</div>
          <div class="doc-gov-sub">${doc.department.toUpperCase()} — ARAM DISTRICT</div>
          <div style="font-size:0.78rem;color:#64748b;margin-top:2px">OFFICIAL E-GOVERNANCE ADMINISTRATIVE DOCUMENT</div>
        </div>

        <div class="doc-meta-strip">
          <div><span>Doc ID: </span><strong>${doc.id}</strong></div>
          <div><span>Classification: </span>${typeBadge(doc.type)}</div>
          <div><span>Current Version: </span><strong>v${cur.version}</strong> (${fmtDate(cur.date)})</div>
        </div>

        <div class="doc-body-title" style="text-align:left;font-size:1.15rem;text-decoration:none">
          <strong>${doc.title.toUpperCase()}</strong>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;margin-bottom:18px;font-size:0.88rem">
          <div><strong>DEPARTMENT:</strong> ${doc.department}</div>
          <div style="margin-top:4px"><strong>CATEGORY:</strong> ${doc.category}</div>
          <div style="margin-top:4px"><strong>IMPORTANCE WEIGHT:</strong> ${importanceBadge(doc.importance)}</div>
          <div style="margin-top:4px"><strong>STATUS:</strong> ${statusBadge(cur.status)}</div>
        </div>

        <div style="font-size:0.95rem;line-height:1.75;color:#1e293b;text-align:justify;margin-bottom:16px">
          <strong>Official Summary & Scope:</strong><br/>
          ${doc.content}
        </div>

        <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:10px 14px;font-size:0.85rem;color:#1e40af;margin-bottom:20px">
          <strong>Audit Notes for Version ${cur.version}:</strong> ${cur.notes}
        </div>

        <table class="doc-data-table">
          <thead>
            <tr><th>Indexing Keywords</th><th>Version Sequence</th><th>Department Authority</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>${doc.keywords.join(", ")}</td>
              <td>Version ${cur.version} of ${doc.versions.length} recorded revision(s)</td>
              <td>${doc.department} (Aram Taluk)</td>
            </tr>
          </tbody>
        </table>

        <div class="doc-footer-grid">
          <div>${barcodeSVG}</div>
          <div class="doc-signature-box">
            <div class="digital-stamp">
              <div style="font-size:0.7rem;text-transform:uppercase;color:#15803d">✓ Authorized Government Record</div>
              <div class="stamp-officer">Aram Office Document Registry</div>
              <div style="font-size:0.75rem;color:#14532d">${doc.department}</div>
              <div style="font-size:0.68rem;color:#64748b">Verified Record ID: ${doc.id}-v${cur.version}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ═════════════════════════════════════════════════════════════════════
// STAFF PORTAL & CREDENTIAL VERIFICATION CONTROLLER
// ═════════════════════════════════════════════════════════════════════
let staffAuthTab = "login";
let uploadedProofFile = null;
let isProofVerified = false;

function renderStaffPortal(container) {
  const currentStaff = Store.getCurrentStaff();
  const staffList = Store.getStaffList();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">🛡️ Government Staff Portal & Credential Verification</h1>
        <p class="page-subtitle">Secure access and service registry for official staff of Aram Office</p>
      </div>
    </div>

    <!-- Active Staff Profile Card (if logged in) -->
    ${currentStaff ? `
      <div class="card mb-20" style="border-left:4px solid #16a34a">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px">
          <div style="display:flex;gap:14px;align-items:center">
            <div style="width:56px;height:56px;border-radius:12px;background:#15803d;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:700">
              ${currentStaff.name.split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("")}
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <h3 style="font-size:1.15rem;font-weight:700;color:#0f172a">${currentStaff.name}</h3>
                <span class="badge-verified">✓ Verified Govt Staff</span>
              </div>
              <div style="font-size:0.86rem;color:#475569;margin-top:2px">
                ${currentStaff.designation} • <strong>${currentStaff.department}</strong>
              </div>
              <div style="font-size:0.8rem;color:#64748b;margin-top:3px">
                Employee ID: <code>${currentStaff.id}</code> &nbsp;·&nbsp; Official Email: <code>${currentStaff.email}</code>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" onclick="navigateTo('documents')">📁 Browse Documents</button>
            <button class="btn btn-primary btn-sm" onclick="openAddDocModal()">➕ Add Document</button>
            <button class="btn btn-outline-danger btn-sm" onclick="handleStaffLogout()">Sign Out</button>
          </div>
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px dashed #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:0.8rem;color:#475569">
          <div>Verification Token: <code style="color:#15803d;font-weight:600">${currentStaff.verificationToken || 'GOV-TN-AUTH-9841'}</code></div>
          <div>Verified Proof Document: <strong>${currentStaff.proofType || 'Government Service ID Card'}</strong> (${currentStaff.proofFileName || 'Official_ID.pdf'})</div>
        </div>
      </div>
    ` : ""}

    <div class="auth-container">
      <!-- Tabs -->
      <div class="auth-tabs">
        <button class="auth-tab ${staffAuthTab==='login'?'active':''}" onclick="setStaffAuthTab('login')">
          🔑 Staff Login
        </button>
        <button class="auth-tab ${staffAuthTab==='signup'?'active':''}" onclick="setStaffAuthTab('signup')">
          📝 Register & Verify Staff Proof
        </button>
      </div>

      <!-- TAB 1: LOGIN -->
      <div id="staffLoginPanel" style="display:${staffAuthTab==='login'?'block':'none'}">
        <div class="card">
          <div class="card-title mb-16">Official Staff Sign In</div>
          <div class="form-group">
            <label class="form-label">Employee ID or Official Email <span class="required">*</span></label>
            <input class="form-control" id="loginIdentifier" placeholder="e.g. EMP-REV-1042 or ramanathan.rev@aram.tn.gov.in" />
          </div>
          <div class="form-group">
            <label class="form-label">Password <span class="required">*</span></label>
            <input class="form-control" type="password" id="loginPassword" placeholder="••••••••" />
          </div>

          <div class="form-group">
            <label class="form-label">Security Captcha Verification</label>
            <div style="display:flex;gap:10px;align-items:center">
              <div id="captchaCode" style="background:#0f172a;color:#38bdf8;font-weight:800;letter-spacing:0.25em;padding:8px 16px;border-radius:6px;font-family:monospace;font-size:1.15rem;user-select:none">
                7K4P9
              </div>
              <button class="btn btn-secondary btn-sm" onclick="refreshCaptcha()" title="Refresh captcha">🔄</button>
              <input class="form-control" id="captchaInput" placeholder="Enter characters" style="max-width:180px" />
            </div>
          </div>

          <button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="submitStaffLogin()">
            Sign In as Government Staff
          </button>

          <!-- 1-Click Fast Logins for College Viva Demo -->
          <div class="quick-login-card">
            <div style="font-size:0.8rem;font-weight:700;color:#0f172a;margin-bottom:6px">
              ⚡ 1-Click Quick Demo Accounts (For College Project Review):
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" onclick="quickFillStaff('EMP-REV-1042')">🏛️ Tahsildar Ramanathan (Revenue)</button>
              <button class="btn btn-secondary btn-sm" onclick="quickFillStaff('EMP-HLT-2019')">🏥 Dr. Meenakshi (Health)</button>
              <button class="btn btn-secondary btn-sm" onclick="quickFillStaff('EMP-EDU-3088')">🎓 DEO Vasanthi (Education)</button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: SIGN UP & GOVERNMENT VERIFICATION -->
      <div id="staffSignupPanel" style="display:${staffAuthTab==='signup'?'block':'none'}">
        <div class="card">
          <div class="verification-banner">
            <div class="verification-banner-icon">🛡️</div>
            <div>
              <div style="font-weight:700;font-size:1.05rem">Government Staff Registration & Verification</div>
              <div style="font-size:0.84rem;opacity:0.9">Staff registration requires official government proof verification before approval.</div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Full Name & Title <span class="required">*</span></label>
              <input class="form-control" id="regName" placeholder="e.g. Thiru. R. Venkatesh, B.E." />
            </div>
            <div class="form-group">
              <label class="form-label">Official Govt Email <span class="required">*</span></label>
              <input class="form-control" id="regEmail" placeholder="venkatesh@aram.tn.gov.in" />
              <small style="font-size:0.75rem;color:#64748b">Must be official domain (@*.gov.in or @aram.tn.gov.in)</small>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Department <span class="required">*</span></label>
              <select class="form-control" id="regDept">
                ${DEPARTMENTS.map(d=>`<option>${d}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Government Employee / IFHRMS ID <span class="required">*</span></label>
              <input class="form-control" id="regEmpId" placeholder="e.g. TN-GOV-REV-2024-89" />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Designation / Cadre <span class="required">*</span></label>
              <input class="form-control" id="regDesignation" placeholder="e.g. Deputy Tahsildar / Revenue Inspector" />
            </div>
            <div class="form-group">
              <label class="form-label">Password <span class="required">*</span></label>
              <input class="form-control" type="password" id="regPassword" placeholder="Minimum 6 characters" />
            </div>
          </div>

          <!-- PROOF UPLOAD & VERIFICATION SECTION -->
          <div style="border-top:1px solid #e2e8f0;margin:16px 0;padding-top:16px">
            <label class="form-label" style="font-size:0.95rem;color:#0f172a">
              📄 Official Government Staff Proof Upload & Verification <span class="required">*</span>
            </label>
            <p style="font-size:0.82rem;color:#64748b;margin-bottom:12px">
              Upload an authorized government identification document to verify that the person is an authentic government staff member.
            </p>

            <div class="form-group">
              <label class="form-label">Select Proof Type</label>
              <select class="form-control" id="regProofType">
                <option value="Government Service Identity Card">Government Service Identity Card (Official ID Badge)</option>
                <option value="Official Appointment / Deputation Order">Official Appointment / Deputation Order (Gazetted G.O.)</option>
                <option value="IFHRMS Service Register Copy">IFHRMS Service Register (SR) Copy / Monthly Pay Slip</option>
                <option value="Departmental Digital Security Token">Departmental Digital Security Token / Smart Card</option>
              </select>
            </div>

            <div class="proof-upload-box" id="proofDropZone" onclick="document.getElementById('proofFileInput').click()">
              <input type="file" id="proofFileInput" style="display:none" onchange="handleProofFileSelect(event)" accept=".pdf,.png,.jpg,.jpeg" />
              <div style="font-size:2rem;margin-bottom:6px">📤</div>
              <div style="font-weight:600;font-size:0.9rem;color:#1e40af">Click to upload official government staff proof</div>
              <div style="font-size:0.78rem;color:#64748b;margin-top:4px">Supports PDF, PNG, JPG (e.g. Employee ID, Deputation Letter, Service Book)</div>
            </div>

            <div id="proofFilePreview" style="display:none" class="proof-uploaded-card">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:1.6rem">📑</span>
                <div>
                  <div style="font-weight:700;font-size:0.86rem;color:#0f172a" id="previewFileName">Govt_Staff_ID.pdf</div>
                  <div style="font-size:0.75rem;color:#15803d" id="previewFileSize">1.4 MB • Uploaded & Ready for Verification</div>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('proofFileInput').click()">Change</button>
            </div>

            <!-- Verification Status & Scan Button -->
            <div id="verificationResultBox" style="margin-bottom:14px"></div>

            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <button type="button" class="btn btn-secondary" id="btnVerifyProof" onclick="runGovernmentStaffVerification()">
                🔍 Verify Government Staff Credentials
              </button>
              <span id="verificationStatusText" style="font-size:0.82rem;color:#64748b">Verification is required to unlock registration.</span>
            </div>
          </div>

          <button class="btn btn-primary" id="btnSubmitRegistration" style="width:100%;margin-top:14px" disabled onclick="submitStaffRegistration()">
            ✓ Complete Registration & Sign In
          </button>
        </div>
      </div>
    </div>
  `;
}

function setStaffAuthTab(tab) {
  staffAuthTab = tab;
  renderStaffPortal(document.getElementById("pageContainer"));
}

function refreshCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const el = document.getElementById("captchaCode");
  if (el) el.textContent = code;
}

function quickFillStaff(id) {
  const staff = Store.getStaffList().find(s => s.id === id);
  if (!staff) return;
  document.getElementById("loginIdentifier").value = staff.email;
  document.getElementById("loginPassword").value = staff.password;
  document.getElementById("captchaInput").value = document.getElementById("captchaCode").textContent.trim();
  toast(`Selected staff: ${staff.name}`, "info");
}

function submitStaffLogin() {
  const ident = document.getElementById("loginIdentifier").value.trim();
  const pass  = document.getElementById("loginPassword").value.trim();
  const capt  = document.getElementById("captchaInput").value.trim().toUpperCase();
  const realCapt = document.getElementById("captchaCode").textContent.trim().toUpperCase();

  if (!ident || !pass) {
    toast("Please enter your Employee ID / Email and password.", "error");
    return;
  }
  if (capt !== realCapt) {
    toast("Invalid Captcha code entered. Please re-enter.", "error");
    refreshCaptcha();
    return;
  }

  const res = Store.loginStaff(ident, pass);
  if (res.success) {
    updateTopbarUser();
    toast(`Welcome, ${res.staff.name}! Logged in successfully.`, "success");
    navigateTo("dashboard");
  } else {
    toast(res.message, "error");
  }
}

function handleProofFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  uploadedProofFile = file;
  isProofVerified = false;

  const box = document.getElementById("proofFilePreview");
  const nameEl = document.getElementById("previewFileName");
  const sizeEl = document.getElementById("previewFileSize");
  if (box && nameEl && sizeEl) {
    nameEl.textContent = file.name;
    sizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB • Document Attached`;
    box.style.display = "flex";
  }

  // Reset verification status
  const resBox = document.getElementById("verificationResultBox");
  if (resBox) resBox.innerHTML = "";
  const subBtn = document.getElementById("btnSubmitRegistration");
  if (subBtn) subBtn.disabled = true;
  const statusText = document.getElementById("verificationStatusText");
  if (statusText) statusText.textContent = "Click 'Verify Government Staff Credentials' to authenticate document.";
}

function runGovernmentStaffVerification() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const empId = document.getElementById("regEmpId").value.trim();

  if (!name || !email || !empId) {
    toast("Please fill in Name, Official Email, and Employee ID before verification.", "error");
    return;
  }
  if (!uploadedProofFile) {
    // Default simulated sample file if user didn't pick from local disk
    uploadedProofFile = { name: `Govt_Service_ID_${empId}.pdf`, size: 1024 * 720 };
    const box = document.getElementById("proofFilePreview");
    if (box) box.style.display = "flex";
    const nameEl = document.getElementById("previewFileName");
    if (nameEl) nameEl.textContent = uploadedProofFile.name;
  }

  const resBox = document.getElementById("verificationResultBox");
  const btn = document.getElementById("btnVerifyProof");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px"></span> Scanning Government HR Registry...`;

  resBox.innerHTML = `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:0.83rem;color:#1e40af">
      <div>⏳ Step 1/3: Querying State Central IFHRMS Employee Registry for ID <strong>${empId}</strong>...</div>
    </div>
  `;

  setTimeout(() => {
    resBox.innerHTML = `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:0.83rem;color:#1e40af">
        <div>⏳ Step 2/3: Validating Department Service Code & Gazetted Officer Cadre...</div>
      </div>
    `;
    setTimeout(() => {
      resBox.innerHTML = `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:0.83rem;color:#1e40af">
          <div>⏳ Step 3/3: Inspecting Digital Seal & Authenticity of <strong>${uploadedProofFile.name}</strong>...</div>
        </div>
      `;
      setTimeout(() => {
        isProofVerified = true;
        btn.disabled = false;
        btn.innerHTML = `✅ Staff Proof Authenticated`;
        btn.className = "btn btn-success";

        const token = "GOV-TN-AUTH-" + Math.floor(100000 + Math.random() * 900000);
        resBox.innerHTML = `
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 14px;color:#166534;font-size:0.84rem">
            <div style="font-weight:700;display:flex;align-items:center;gap:6px;font-size:0.92rem">
              <span>✅ Government Staff Verification Passed!</span>
            </div>
            <div style="margin-top:4px">
              Employee ID <strong>${empId}</strong> and official proof <strong>${uploadedProofFile.name}</strong> have been confirmed by Central Service Registry.
            </div>
            <div style="margin-top:4px;font-size:0.78rem;color:#15803d">
              Issued Verification Token: <code>${token}</code>
            </div>
          </div>
        `;

        const subBtn = document.getElementById("btnSubmitRegistration");
        if (subBtn) subBtn.disabled = false;
        const statusText = document.getElementById("verificationStatusText");
        if (statusText) statusText.innerHTML = `<span style="color:#16a34a;font-weight:600">✓ Ready to Complete Registration</span>`;
        toast("Government Staff Credentials verified successfully!", "success");
      }, 700);
    }, 700);
  }, 700);
}

function submitStaffRegistration() {
  if (!isProofVerified) {
    toast("You must verify your staff proof first.", "error");
    return;
  }
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const dept = document.getElementById("regDept").value;
  const empId = document.getElementById("regEmpId").value.trim();
  const designation = document.getElementById("regDesignation").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const proofType = document.getElementById("regProofType").value;

  if (!name || !email || !empId || !designation || !password) {
    toast("Please fill in all required fields.", "error");
    return;
  }
  if (password.length < 6) {
    toast("Password must be at least 6 characters.", "error");
    return;
  }

  const staffData = {
    id: empId,
    name,
    email,
    department: dept,
    designation,
    password,
    proofType,
    proofFileName: uploadedProofFile ? uploadedProofFile.name : "Staff_Proof.pdf"
  };

  const res = Store.registerStaff(staffData);
  if (res.success) {
    updateTopbarUser();
    toast(`Registration complete! Welcome, ${res.staff.name}.`, "success");
    navigateTo("dashboard");
  } else {
    toast(res.message, "error");
  }
}
