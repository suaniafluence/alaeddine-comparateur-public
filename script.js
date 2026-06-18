const themes = [
  "Deplacements",
  "Demarches consulaires",
  "Documents",
  "Familles",
  "Etudiants",
  "Investissement",
  "Numerique",
  "Competences",
  "Cooperations",
  "Defense citoyenne",
];

const candidates = [
  { name: "Alaeddine Dehimi", party: "Front El Moustakbal", scores: [92, 94, 90, 88, 86, 90, 91, 89, 86, 96], featured: true },
  { name: "Candidat 1", party: "Partie 1", scores: [75, 62, 78, 68, 74, 56, 71, 58, 70, 80] },
  { name: "Candidat 2", party: "Partie 2", scores: [54, 73, 57, 76, 62, 78, 55, 72, 61, 70] },
  { name: "Candidat 3", party: "Partie 3", scores: [30, 45, 28, 52, 58, 22, 43, 25, 49, 51] },
  { name: "Candidat 4", party: "Partie 4", scores: [82, 88, 80, 91, 65, 82, 72, 66, 79, 86] },
  { name: "Candidat 5", party: "Partie 5", scores: [49, 34, 72, 24, 69, 55, 58, 73, 50, 28] },
  { name: "Candidat 6", party: "Partie 6", scores: [34, 64, 42, 52, 45, 38, 27, 42, 37, 44] },
  { name: "Candidat 7", party: "Partie 7", scores: [64, 69, 71, 62, 76, 61, 68, 55, 59, 66] },
  { name: "Candidat 8", party: "Partie 8", scores: [58, 52, 66, 70, 63, 59, 75, 61, 72, 60] },
  { name: "Candidat 9", party: "Partie 9", scores: [40, 47, 36, 42, 51, 45, 48, 39, 44, 53] },
];

const average = (values) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
const candidateScore = (candidate) => average(candidate.scores);
const statusFor = (score) => {
  if (score >= 75) return { label: "Oui", symbol: "✓", className: "yes" };
  if (score >= 50) return { label: "Partiel", symbol: "•", className: "partial" };
  return { label: "Non", symbol: "×", className: "no" };
};

function renderMatrix() {
  const table = document.querySelector("#matrixTable");
  table.innerHTML = `
    <thead>
      <tr>
        <th>10 priorites diaspora</th>
        ${candidates.slice(0, 7).map((candidate) => `<th class="${candidate.featured ? "highlight" : ""}">${candidate.name}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${themes.map((theme, index) => `
        <tr>
          <td>${index + 1}. ${theme}</td>
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
  container.innerHTML = candidates.map((candidate, index) => `
    <article class="candidate-card ${candidate.featured ? "featured" : ""}">
      <div class="avatar">${candidate.featured ? "AD" : index}</div>
      <div>
        <strong>${candidate.name}</strong>
        <p>${candidate.party}</p>
      </div>
      <div class="scoreline"><span style="width:${candidateScore(candidate)}%"></span></div>
      <small>${candidateScore(candidate)}/100 - ${candidate.scores.filter((score) => score >= 75).length} priorites fortes</small>
    </article>
  `).join("");
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
  const competitorAverage = themes.map((_, index) => average(candidates.slice(1).map((candidate) => candidate.scores[index])));
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
      <text class="radar-label" x="${x}" y="${y}" text-anchor="${anchor}">${index + 1}. ${theme}</text>
    `;
  }).join("");
  svg.innerHTML = `
    ${rings}
    ${axes}
    <polygon class="radar-average" points="${polygonPoints(competitorAverage, radius, centerX, centerY)}" />
    <polygon class="radar-line" points="${polygonPoints(candidates[0].scores, radius, centerX, centerY)}" />
    <g transform="translate(24 394)">
      <line x1="0" y1="0" x2="28" y2="0" stroke="#08724d" stroke-width="4" />
      <text x="38" y="4" fill="#08724d" font-weight="800">Alaeddine Dehimi</text>
      <line x1="210" y1="0" x2="238" y2="0" stroke="#66736d" stroke-width="3" stroke-dasharray="6 6" />
      <text x="248" y="4" fill="#66736d">Moyenne des autres</text>
    </g>
  `;
}

function renderRanking() {
  const container = document.querySelector("#rankingBars");
  const sorted = [...candidates].sort((a, b) => candidateScore(b) - candidateScore(a));
  container.innerHTML = sorted.map((candidate) => `
    <div class="bar-row">
      <strong>${candidate.name.replace("Alaeddine Dehimi", "Alaeddine")}</strong>
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
  table.innerHTML = `
    <thead>
      <tr>
        <th>Priorite</th>
        ${candidates.slice(0, 8).map((candidate) => `<th class="${candidate.featured ? "highlight" : ""}">${candidate.name}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${themes.map((theme, index) => `
        <tr>
          <td>${theme}</td>
          ${candidates.slice(0, 8).map((candidate) => `<td class="heat ${candidate.featured ? "highlight" : ""}" style="background:${colorFor(candidate.scores[index])}">${candidate.scores[index]}</td>`).join("")}
        </tr>
      `).join("")}
    </tbody>
  `;
}

function renderGaps() {
  const container = document.querySelector("#gapRows");
  const competitorAverage = themes.map((_, index) => average(candidates.slice(1).map((candidate) => candidate.scores[index])));
  container.innerHTML = themes.map((theme, index) => {
    const gap = candidates[0].scores[index] - competitorAverage[index];
    const width = Math.min(Math.abs(gap), 50);
    const left = gap >= 0 ? 50 : 50 - width;
    return `
      <div class="gap-row">
        <strong>${theme}</strong>
        <div class="gap-track">
          <div class="gap-fill" style="left:${left}%; width:${width}%;"></div>
        </div>
        <span>+${gap} pts</span>
      </div>
    `;
  }).join("");
}

renderMatrix();
renderCards();
renderRadar();
renderRanking();
renderHeatmap();
renderGaps();
