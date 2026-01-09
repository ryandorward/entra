/* ---------- basic setup ---------- */

let width = window.innerWidth;
let height = window.innerHeight;
const start_time = performance.now();

const svg = d3.select("#stage")
  .attr("width", width)
  .attr("height", height);

const g = svg.append("g")
  .attr("transform", `translate(${width/2}, ${height/2})`);

const line_layer = g.append("g");
const circle_layer = g.append("g");
const label_layer = g.append("g");

/* ---------- geometry core ---------- */

function points_on_circle(n, r) {
  return Array.from({ length: n }, (_, i) => {
    const a = i / n * Math.PI * 2 - Math.PI / 2;
    return {
      i,
      x: Math.cos(a) * r,
      y: Math.sin(a) * r
    };
  });
}

function modular_links(n, mul, offset) {
  return Array.from({ length: n }, (_, i) => [
    i,
    ((i * mul) + offset) % n
  ]);
}

function evenly_spaced_offsets(n, copies) {
  return Array.from({ length: copies }, (_, i) => Math.floor((i * n) / copies));
}

/* ---------- draw ---------- */

function draw(now = performance.now()) {
  const n = +n_slider.value;
  const m = +m_slider.value;
  const d_pct = +r_slider.value;
  const r = (width * (d_pct / 100)) / 2;
  const sat = +sat_slider.value;
  const hue = +hue_slider.value;
  const bright = +bright_slider.value;
  const thick = +thick_slider.value;
  const opacity = +opacity_slider.value / 100;
  const c_anim = +c_anim_slider.value;
  const hue_anim = +hue_anim_slider.value;
  const light_base = 65 + (100 - sat) * 0.15;
  const light = Math.max(0, Math.min(100, Math.min(80, light_base) + bright));

  const c_max = Math.max(0, n - 1);
  c_slider.max = c_max;
  if (+c_slider.value > c_max) {
    c_slider.value = c_max;
  }
  const c = +c_slider.value;

  const k_max = Math.min(24, Math.max(1, n));
  k_slider.max = k_max;
  if (+k_slider.value > k_max) {
    k_slider.value = k_max;
  }
  const k = +k_slider.value;

  n_label.textContent = n;
  m_label.textContent = m;
  sat_label.textContent = `${sat}%`;
  hue_label.textContent = `${hue}°`;
  bright_label.textContent = `${bright}`;
  thick_label.textContent = `${thick.toFixed(1)}`;
  opacity_label.textContent = `${Math.round(opacity * 100)}%`;
  c_label.textContent = c;
  c_anim_label.textContent = `${c_anim}`;
  hue_anim_label.textContent = `${hue_anim}`;
  k_label.textContent = k;
  r_label.textContent = `${d_pct}%`;

  const anim_t = (now - start_time) / 1000;
  const c_speed = (c_anim / 100) * n;
  const hue_speed = (hue_anim / 100) * 360;
  const c_now = ((c + anim_t * c_speed) % n + n) % n;
  const c_base = Math.floor(c_now) % n;
  const c_next = (c_base + 1) % n;
  const c_blend = c_now - c_base;
  const hue_now = ((hue + anim_t * hue_speed) % 360 + 360) % 360;

  const pts = points_on_circle(n, r);
  const offsets_prev = evenly_spaced_offsets(n, k).map(offset => (offset + c_base) % n);
  const offsets_next = evenly_spaced_offsets(n, k).map(offset => (offset + c_next) % n);
  const links = [
    ...offsets_prev.flatMap((offset, k_index) =>
      modular_links(n, m, offset).map(pair => ({
        i: pair[0],
        j: pair[1],
        offset,
        alpha: 1 - c_blend,
        key: `p-${k_index}-${pair[0]}`
      }))
    ),
    ...offsets_next.flatMap((offset, k_index) =>
      modular_links(n, m, offset).map(pair => ({
        i: pair[0],
        j: pair[1],
        offset,
        alpha: c_blend,
        key: `n-${k_index}-${pair[0]}`
      }))
    )
  ];
  const swap_y = swap_toggle.checked;
  const hide_outline = hide_outline_toggle.checked;
  const show_labels = !show_labels_toggle.checked;
  const align_hue = align_hue_toggle.checked;
  const label_step = Math.max(1, Math.floor((n - 1) / 30));
  const label_pts = points_on_circle(n, r + 14);
  const label_target = i => ((i * m) + c_base) % n;

  const lines = line_layer
    .selectAll("line")
    .data(links, d => d.key);

  lines.join("line")
    .attr("x1", d => pts[d.i].x)
    .attr("y1", d => swap_y ? pts[d.j].y : pts[d.i].y)
    .attr("x2", d => pts[d.j].x)
    .attr("y2", d => swap_y ? pts[d.i].y : pts[d.j].y)
    .attr("stroke", d => {
      const hue_index = align_hue ? d.i : (d.i + d.offset) % n;
      const alpha = opacity * d.alpha;
      return `hsla(${((hue_index / n) * 360 + hue_now) % 360}, ${sat}%, ${light}%, ${alpha})`;
    })
    .attr("stroke-width", thick);

  if (hide_outline) {
    circle_layer.selectAll("circle").remove();
  } else {
    const outline = circle_layer
      .selectAll("circle")
      .data([r]);

    outline.join("circle")
      .attr("r", d => d)
      .attr("fill", "none")
      // .attr("stroke", "white")
      .attr("stroke", `hsla(0, 0%, ${light}%, ${opacity})`)
      .attr("stroke-width", thick);
  }

  if (show_labels) {
    const label_indices = Array.from({ length: n }, (_, i) => i)
      .filter(i => i % label_step === 0);

    const labels = label_layer
      .selectAll("text")
      .data(label_indices, d => d);

    labels.join("text")
      .attr("x", d => label_pts[d].x)
      .attr("y", d => swap_y ? label_pts[label_target(d)].y : label_pts[d].y)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", 10)
      .attr("fill", d => `hsla(${((d / n) * 360 + hue_now) % 360}, ${sat}%, ${light}%, ${opacity})`)
      .text(d => d);
  } else {
    label_layer.selectAll("text").remove();
  }
}

/* ---------- UI ---------- */

const n_slider = document.getElementById("n");
const m_slider = document.getElementById("m");
const sat_slider = document.getElementById("sat");
const hue_slider = document.getElementById("hue");
const bright_slider = document.getElementById("bright");
const thick_slider = document.getElementById("thick");
const opacity_slider = document.getElementById("opacity");
const c_slider = document.getElementById("c");
const c_anim_slider = document.getElementById("cAnim");
const hue_anim_slider = document.getElementById("hueAnim");
const k_slider = document.getElementById("k");
const r_slider = document.getElementById("r");
const align_hue_toggle = document.getElementById("alignHue");
const controls = document.getElementById("controls");
const controls_toggle = document.getElementById("toggleControls");

const n_label = document.getElementById("nLabel");
const m_label = document.getElementById("mLabel");
const sat_label = document.getElementById("satLabel");
const hue_label = document.getElementById("hueLabel");
const bright_label = document.getElementById("brightLabel");
const thick_label = document.getElementById("thickLabel");
const opacity_label = document.getElementById("opacityLabel");
const c_label = document.getElementById("cLabel");
const c_anim_label = document.getElementById("cAnimLabel");
const hue_anim_label = document.getElementById("hueAnimLabel");
const k_label = document.getElementById("kLabel");
const r_label = document.getElementById("rLabel");
const swap_toggle = document.getElementById("swapY");
const hide_outline_toggle = document.getElementById("hideOutline");
const show_labels_toggle = document.getElementById("showLabels");

function apply_url_params() {
  const params = new URLSearchParams(window.location.search);

  if (params.has("n")) {
    const v = Number(params.get("n"));
    if (Number.isFinite(v)) n_slider.value = v;
  }
  if (params.has("m")) {
    const v = Number(params.get("m"));
    if (Number.isFinite(v)) m_slider.value = v;
  }
  if (params.has("c")) {
    const v = Number(params.get("c"));
    if (Number.isFinite(v)) c_slider.value = v;
  }
  if (params.has("ca")) {
    const v = Number(params.get("ca"));
    if (Number.isFinite(v)) c_anim_slider.value = v;
  }
  if (params.has("k")) {
    const v = Number(params.get("k"));
    if (Number.isFinite(v)) k_slider.value = v;
  }
  if (params.has("s")) {
    const v = Number(params.get("s"));
    if (Number.isFinite(v)) sat_slider.value = v;
  }
  if (params.has("h")) {
    const v = Number(params.get("h"));
    if (Number.isFinite(v)) hue_slider.value = v;
  }
  if (params.has("ha")) {
    const v = Number(params.get("ha"));
    if (Number.isFinite(v)) hue_anim_slider.value = v;
  }
  if (params.has("b")) {
    const v = Number(params.get("b"));
    if (Number.isFinite(v)) bright_slider.value = v;
  }
  if (params.has("t")) {
    const v = Number(params.get("t"));
    if (Number.isFinite(v)) thick_slider.value = v;
  }
  if (params.has("o")) {
    const v = Number(params.get("o"));
    if (Number.isFinite(v)) opacity_slider.value = v;
  }
  if (params.has("z")) {
    const v = Number(params.get("z"));
    if (Number.isFinite(v)) r_slider.value = v;
  }
  if (params.has("ah")) align_hue_toggle.checked = params.get("ah") === "1";

  if (params.has("sy")) swap_toggle.checked = params.get("sy") === "1";
  if (params.has("ho")) hide_outline_toggle.checked = params.get("ho") === "1";
  if (params.has("hl")) show_labels_toggle.checked = params.get("hl") === "1";
}

function update_url_params() {
  const params = new URLSearchParams();
  params.set("n", n_slider.value);
  params.set("m", m_slider.value);
  params.set("c", c_slider.value);
  params.set("ca", c_anim_slider.value);
  params.set("k", k_slider.value);
  params.set("s", sat_slider.value);
  params.set("h", hue_slider.value);
  params.set("ha", hue_anim_slider.value);
  params.set("b", bright_slider.value);
  params.set("t", thick_slider.value);
  params.set("o", opacity_slider.value);
  params.set("z", r_slider.value);
  params.set("ah", align_hue_toggle.checked ? "1" : "0");
  params.set("sy", swap_toggle.checked ? "1" : "0");
  params.set("ho", hide_outline_toggle.checked ? "1" : "0");
  params.set("hl", show_labels_toggle.checked ? "1" : "0");

  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", next);
}

function on_control_input() {
  draw();
  update_url_params();
}

function update_controls_visibility() {
  const is_hidden = controls.classList.toggle("is-collapsed");
  controls_toggle.textContent = is_hidden ? "Show Controls" : "Hide Controls";
  controls_toggle.setAttribute("aria-expanded", is_hidden ? "false" : "true");
}

[n_slider, m_slider, sat_slider, hue_slider, bright_slider, thick_slider, opacity_slider, c_slider, c_anim_slider, hue_anim_slider, k_slider, r_slider, align_hue_toggle, swap_toggle, hide_outline_toggle, show_labels_toggle].forEach(el =>
  el.addEventListener("input", on_control_input)
);

controls_toggle.addEventListener("click", update_controls_visibility);

/* ---------- init ---------- */

apply_url_params();
window.requestAnimationFrame(tick);
window.addEventListener("resize", resize);
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  svg.attr("width", width).attr("height", height);
  g.attr("transform", `translate(${width/2}, ${height/2})`);
  draw();
}

function tick(now) {
  draw(now);
  window.requestAnimationFrame(tick);
}
