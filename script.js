let themes = [];
let candidates = [];
let content = {};

const average = (values) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
const candidateScore = (candidate) => average(candidate.scores);

const statusFor = (score) => {
  const labels = content.labels || {};
  if (score >= 75) return { label: labels.statusYes || "", symbol: labels.statusYesSymbol || "", className: "yes" };
  if (score >= 50) return { label: labels.statusPartial || "", symbol: labels.statusPartialSymbol || "", className: "partial" };
  return { label: labels.statusNo || "", symbol: labels.statusNoSymbol || "", className: "no" };
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function featuredCandidate() {
  return candidates.find((candidate) => candidate.featured) || candidates[0];
}

function competitorCandidates() {
  const featured = featuredCandidate();
  return candidates.filter((candidate) => candidate !== featured);
}

function renderStaticContent() {
  const site = content.site || {};
  const sidebar = content.sidebar || {};
  const intro = content.intro || {};
  const labels = content.labels || {};
  const sections = content.sections || {};
  const featured = featuredCandidate();
  const competitors = competitorCandidates();
  const competitorAverage = competitors.length ? average(competitors.map(candidateScore)) : 0;

  document.title = `${site.title || ""} - ${site.brandName || featured.name}`;
  document.querySelector(".brand-mark").innerHTML = `${escapeHtml(site.brandMarkTop || "")}<br /><span>${escapeHtml(site.brandMarkBottom || "")}</span>`;
  document.querySelector(".brand strong").textContent = site.brandName || featured.name;
  document.querySelector(".brand small").textContent = site.brandSubtitle || featured.party;
  document.querySelector("nav").innerHTML = (content.navigation || []).map((item, index) => (
    `<a href="${escapeHtml(item.target)}" class="${index === 0 ? "active" : ""}">${escapeHtml(item.label)}</a>`
  )).join("");
  document.querySelector(".side-panel span").textContent = sidebar.totalCandidatesLabel || "";
  document.querySelector(".side-panel strong").textContent = sidebar.shownCandidatesLabel || `${candidates.length} ${labels.displayedCandidatesFallback || ""}`;
  document.querySelector(".side-panel small").textContent = sidebar.note || "";
  document.querySelector(".topbar h1").textContent = site.title || "";
  document.querySelector(".topbar p").textContent = site.subtitle || "";
  document.querySelector(".actions .ghost").textContent = site.region || "";
  document.querySelector(".actions button:not(.ghost)").textContent = site.shareLabel || "";
  document.querySelector(".intro .label").textContent = intro.label || "";
  document.querySelector(".intro > div:first-child strong").textContent = intro.title || "";
  document.querySelector(".intro > div:first-child p").textContent = intro.text || "";
  document.querySelector(".intro .metric:nth-child(2) span").textContent = intro.featuredScoreLabel || "";
  document.querySelector(".intro .metric:nth-child(2) strong").textContent = `${candidateScore(featured)}/100`;
  document.querySelector(".intro .metric:nth-child(3) span").textContent = intro.competitorAverageLabel || "";
  document.querySelector(".intro .metric:nth-child(3) strong").textContent = `${competitorAverage}/100`;
  document.querySelector(".legend").innerHTML = `<b class="yes"></b>${escapeHtml(labels.legendYes || labels.statusYes || "")} <b class="partial"></b>${escapeHtml(labels.legendPartial || labels.statusPartial || "")} <b class="no"></b>${escapeHtml(labels.legendNo || labels.statusNo || "")}`;

  Object.entries(sections).forEach(([key, section]) => {
    const root = document.querySelector(`#${key}`);
    if (!root) return;

    const title = root.querySelector("h2");
    const description = root.querySelector(".section-head p");
    if (title) title.textContent = section.title || "";
    if (description) description.textContent = section.description || "";
  });
}

function renderMatrix() {
  const table = document.querySelector("#matrixTable");
  const labels = content.labels || {};
  table.innerHTML = `
    <thead>
      <tr>
        <th>${escapeHtml(labels.matrixFirstColumn || "10 priorites diaspora")}</th>
        ${candidates.slice(0, 7).map((candidate) => `<th class="${candidate.featured ? "highlight" : ""}">${escapeHtml(candidate.name)}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${themes.map((theme, index) => `
        <tr>
          <td>${index + 1}. ${escapeHtml(theme)}</td>
          ${candidates.slice(0, 7).map((candidate) => {
            const status = statusFor(candidate.scores[index]);
            return `<td class="${candidate.featured ? "highlight" : ""}"><span class="status ${status.className}" title="${status.label}">${status.symbol}</span></td>`;
          }).join("")}
        </tr>
      `).join("")}
    </tbody>
  `;
}

function renderCards() {
  const container = document.querySelector("#candidateCards");
  const labels = content.labels || {};
  container.innerHTML = candidates.map((candidate, index) => {
    const initials = candidate.initials || (candidate.featured ? candidate.name.split(" ").map((word) => word[0]).join("").slice(0, 2) : index);

    return `
      <article class="candidate-card ${candidate.featured ? "featured" : ""}">
        <div class="avatar">${escapeHtml(initials)}</div>
        <div>
          <strong>${escapeHtml(candidate.name)}</strong>
          <p>${escapeHtml(candidate.party)}</p>
        </div>
        <div class="scoreline"><span style="width:${candidateScore(candidate)}%"></span></div>
        <small>${candidateScore(candidate)}/100 - ${candidate.scores.filter((score) => score >= 75).length} ${escapeHtml(labels.strongPrioritiesSuffix || "")}</small>
      </article>
    `;
  }).join("");
}

function polygonPoints(values, radius, centerX, centerY) {
  return values.map((value, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / values.length;
    const distance = (value / 100) * radius;
    return `${centerX + Math.cos(angle) * distance},${centerY + Math.sin(angle) * distance}`;
  }).join(" ");
}

function renderRadar() {
  const svg = document.querySelector("#radarChart");
  const centerX = 260;
  const centerY = 212;
  const radius = 142;
  const featured = featuredCandidate();
  const labels = content.labels || {};
  const competitors = competitorCandidates();
  const competitorAverage = competitors.length ? themes.map((_, index) => average(competitors.map((candidate) => candidate.scores[index]))) : Array(themes.length).fill(0);
  const rings = [25, 50, 75, 100].map((level) => {
    const values = Array(themes.length).fill(level);
    return `<polygon class="radar-grid" points="${polygonPoints(values, radius, centerX, centerY)}" />`;
  }).join("");
  const axes = themes.map((theme, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / themes.length;
    const x = centerX + Math.cos(angle) * (radius + 52);
    const y = centerY + Math.sin(angle) * (radius + 52);
    const anchor = x < centerX - 12 ? "end" : x > centerX + 12 ? "start" : "middle";

    return `
      <line x1="${centerX}" y1="${centerY}" x2="${centerX + Math.cos(angle) * radius}" y2="${centerY + Math.sin(angle) * radius}" stroke="#d8e1dd" />
      <text class="radar-label" x="${x}" y="${y}" text-anchor="${anchor}">${index + 1}. ${escapeHtml(theme)}</text>
    `;
  }).join("");

  svg.innerHTML = `
    ${rings}
    ${axes}
    <polygon class="radar-average" points="${polygonPoints(competitorAverage, radius, centerX, centerY)}" />
    <polygon class="radar-line" points="${polygonPoints(featured.scores, radius, centerX, centerY)}" />
    <g transform="translate(24 394)">
      <line x1="0" y1="0" x2="28" y2="0" stroke="#08724d" stroke-width="4" />
      <text x="38" y="4" fill="#08724d" font-weight="800">${escapeHtml(featured.name)}</text>
      <line x1="210" y1="0" x2="238" y2="0" stroke="#66736d" stroke-width="3" stroke-dasharray="6 6" />
      <text x="248" y="4" fill="#66736d">${escapeHtml(labels.otherAverage || "")}</text>
    </g>
  `;
}

function renderRanking() {
  const container = document.querySelector("#rankingBars");
  const sorted = [...candidates].sort((a, b) => candidateScore(b) - candidateScore(a));

  container.innerHTML = sorted.map((candidate) => `
    <div class="bar-row">
      <strong>${escapeHtml(candidate.shortName || candidate.name)}</strong>
      <div class="bar-track"><div class="bar-fill" style="width:${candidateScore(candidate)}%"></div></div>
      <span>${candidateScore(candidate)}</span>
    </div>
  `).join("");
}

function colorFor(score) {
  const hue = Math.round((score / 100) * 120);
  return `hsl(${hue}, 62%, 78%)`;
}

function renderHeatmap() {
  const table = document.querySelector("#heatmapTable");
  const labels = content.labels || {};
  table.innerHTML = `
    <thead>
      <tr>
        <th>${escapeHtml(labels.heatmapFirstColumn || "Priorite")}</th>
        ${candidates.slice(0, 8).map((candidate) => `<th class="${candidate.featured ? "highlight" : ""}">${escapeHtml(candidate.name)}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${themes.map((theme, index) => `
        <tr>
          <td>${escapeHtml(theme)}</td>
          ${candidates.slice(0, 8).map((candidate) => `<td class="heat ${candidate.featured ? "highlight" : ""}" style="background:${colorFor(candidate.scores[index])}">${candidate.scores[index]}</td>`).join("")}
        </tr>
      `).join("")}
    </tbody>
  `;
}

function renderGaps() {
  const container = document.querySelector("#gapRows");
  const featured = featuredCandidate();
  const labels = content.labels || {};
  const competitors = competitorCandidates();
  const competitorAverage = competitors.length ? themes.map((_, index) => average(competitors.map((candidate) => candidate.scores[index]))) : Array(themes.length).fill(0);

  container.innerHTML = themes.map((theme, index) => {
    const gap = featured.scores[index] - competitorAverage[index];
    const width = Math.min(Math.abs(gap), 50);
    const left = gap >= 0 ? 50 : 50 - width;
    const label = gap > 0 ? `+${gap}` : `${gap}`;

    return `
      <div class="gap-row">
        <strong>${escapeHtml(theme)}</strong>
        <div class="gap-track">
          <div class="gap-fill" style="left:${left}%; width:${width}%;"></div>
        </div>
        <span>${label} ${escapeHtml(labels.pointsSuffix || "pts")}</span>
      </div>
    `;
  }).join("");
}

function validateContent(data) {
  const labels = data.labels || {};
  if (!Array.isArray(data.themes) || !Array.isArray(data.candidates)) {
    throw new Error(labels.missingDataError || "Le fichier data.json doit contenir themes et candidates.");
  }

  data.candidates.forEach((candidate) => {
    if (!Array.isArray(candidate.scores) || candidate.scores.length !== data.themes.length) {
      throw new Error(`${labels.candidateScoresErrorPrefix || "Le candidat"} ${candidate.name} ${labels.candidateScoresErrorSuffix || "doit avoir un score pour chaque theme."}`);
    }
  });
}

async function init() {
  const response = await fetch("data.json");
  if (!response.ok) throw new Error("Impossible de charger data.json.");

  content = await response.json();
  validateContent(content);
  themes = content.themes;
  candidates = content.candidates;

  renderStaticContent();
  renderMatrix();
  renderCards();
  renderRadar();
  renderRanking();
  renderHeatmap();
  renderGaps();
}

init().catch((error) => {
  const labels = content.labels || {};
  document.body.innerHTML = `<main class="load-error"><h1>${escapeHtml(labels.loadErrorTitle || "Erreur de chargement")}</h1><p>${escapeHtml(error.message)}</p></main>`;
});
