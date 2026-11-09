import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const SNAP_PX    = 8;
const DOT_PX     = 16;
const TRAY_H     = 26;
const TOOLBAR_H  = 52;          // doubled — keep in sync with .mmp-tb height in the CSS
const MIN_W_NODE = 560;         // toolbar now holds 9 buttons at 44px each
                                 // (396px) + 2 separators + padding ≈ 464px of
                                 // non-shrinkable content, before the "mega
                                 // panel" tag text even gets counted — 560
                                 // leaves comfortable room so the toolbar
                                 // never overflows/squeezes at the node floor
const MIN_H_NODE = 226;         // 200 + 26 — TOOLBAR_H grew by 26px (doubled
                                 // from 26 to 52), so raise the node floor by
                                 // the same amount to keep the same minimum
                                 // canvas content space as before
const DEFAULT_W_NODE = 700;     // no longer derived as MIN_W_NODE * 2 — that
                                 // formula would now yield 1040px, far bigger
                                 // than a sensible default just because the
                                 // floor had to grow for the toolbar's sake
const DEFAULT_H_NODE = MIN_H_NODE * 2;
const MIN_W_WGT  = 72;
const MIN_H_WGT  = 74;          // 52 + 22 — preserves the same minimum body
                                 // space after doubling BAR_H below (74-44=30,
                                 // same as the old 52-22=30)
const BAR_H      = 44;          // doubled — keep in sync with .mmp-wbar height in the CSS

const ACCENT_DEFAULTS = {
    padded_index:      "#7F77DD",
    knob_int:          "#1D9E75",
    index_state:       "#D85A30",
    set_next:          "#D4537E",
    freeze:            "#0F6E56",
    padding_control:   "#8B7FD4",
    queue_controller:  "#1E6FA8",
};

const WIDGET_DEFS = ["padded_index", "knob_int", "index_state", "set_next", "freeze", "padding_control", "queue_controller"];

// ─── Knob themes ─────────────────────────────────────────────────────────────

const THEMES = [
    "dark","cyberpunk","steampunk","minimal","glass","retro",
    "futuristic","gaming","nature","cartoon","vaporwave","brutalist",
    "material","neumorphism","skeuomorphic",
];

const THEME_DEFAULTS = {
    dark:         { color: "#00ffff" },
    cyberpunk:    { color: "#ff00ff" },
    steampunk:    { color: "#b57c48" },
    minimal:      { color: "#888888" },
    glass:        { color: "#ffffff" },
    retro:        { color: "#c9a87c" },
    futuristic:   { color: "#00aaff" },
    gaming:       { color: "#ff0066" },
    nature:       { color: "#6b8e4c" },
    cartoon:      { color: "#ffcc00" },
    vaporwave:    { color: "#ff7eb3" },
    brutalist:    { color: "#e0e0e0" },
    material:     { color: "#6200ee" },
    neumorphism:  { color: "#b0b0b0" },
    skeuomorphic: { color: "#ee5555" },
};

// ─── CSS loader ─────────────────────────────────────────────────────────────

function loadCSS() {
    if (document.getElementById("mmp-css")) return;
    const link = document.createElement("link");
    link.id = "mmp-css";
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = new URL("magik_mega_panel.css", import.meta.url).href;
    document.head.appendChild(link);
}

// ─── SVG icon micro-helper ────────────────────────────────────────────────────

function ico(d, sz=13) {
    return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;display:block">${d}</svg>`;
}

const I = {
    reset:    ico('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    lock:     ico('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    unlock:   ico('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.93-.6"/>'),
    snap:     ico('<circle cx="5" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="19" r="1.5" fill="currentColor" stroke="none"/>'),
    tb:       ico('<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M3 13h18M3 18h18"/>'),
    cog:      ico('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    copy:     ico('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    front:    ico('<rect x="8" y="8" width="13" height="13" rx="1"/><rect x="3" y="3" width="13" height="13" rx="1" fill="currentColor" opacity=".3"/>'),
    back:     ico('<rect x="3" y="3" width="13" height="13" rx="1"/><rect x="8" y="8" width="13" height="13" rx="1" fill="currentColor" opacity=".3"/>'),
    minimize: ico('<line x1="5" y1="12" x2="19" y2="12"/>'),
    edit:     ico('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
    save:     ico('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'),
    folder:   ico('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
    trash:    ico('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'),
    undo:     ico('<path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 7"/>'),
};

// ─── Toolbar button factory ───────────────────────────────────────────────────

function tbb(icon, tip) {
    const b = document.createElement("button");
    b.className = "mmp-tbb";
    b.innerHTML = icon + `<span class="mmp-tip">${tip}</span>`;
    b.setAttribute("aria-label", tip);
    return b;
}

// Icon-only buttons rely on a screen reader announcing *something* useful —
// without an explicit aria-label that falls back to reading the raw emoji's
// unicode name (e.g. "heavy minus sign button" instead of "decrease target"),
// which is more confusing than helpful. title is kept too, for the visual
// hover tooltip on buttons that don't already render their own .mmp-tip span.
function a11y(btn, label) {
    btn.title = label;
    btn.setAttribute("aria-label", label);
    return btn;
}

// ─── Snap helper ──────────────────────────────────────────────────────────────

function snapV(v) { return Math.round(v / SNAP_PX) * SNAP_PX; }
function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// One stable counter identity per saved node. Never key server state by graph IDs.
function ensureStateId(node) {
    const widget = node.widgets?.find(w => w.name === "state_id");
    if (!widget) return null;
    const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const duplicate = node.graph?._nodes?.some(n => n !== node && n.type === "MagikMegaPanel"
        && n.widgets?.find(w => w.name === "state_id")?.value === widget.value);
    if (!valid.test(widget.value) || duplicate) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 15) | 64;
        bytes[8] = (bytes[8] & 63) | 128;
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
        widget.value = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
        node.graph?.change?.();
    }
    return widget.value;
}

// total is the inclusive final index; next is the next index to produce.
function remainingPrompts(next, total, pending = 0) {
    if (!Number.isFinite(next) || !Number.isFinite(total) || total < 1) return 0;
    return Math.max(0, total - Math.max(0, Math.trunc(next)) + 1 - pending);
}

const PROMPTER_TYPES = new Set([
    "MagikPrompterA2S", "MagikMetaPrompter", "MagikAnimaXMetaPrompter",
    "MagikAnimaMetaPrompter", "MagikNLMetaPrompterJSON", "MagikNLMetaPrompter",
]);
function isNLMetaPrompter(node) {
    return String(node?.type || "").replace(/[^a-z0-9]/gi, "").toLowerCase()
        .startsWith("magiknlmetaprompter");
}
function isSupportedPrompter(node) {
    return isNLMetaPrompter(node) || PROMPTER_TYPES.has(node?.type);
}
function prompterSetting(node, name) {
    // Current NL nodes expose virtual controls through their settings store.
    // Read it first: its values can precede the serialized widget by a microtask.
    const proxy = node?._magikSettings?.proxies?.get?.(name);
    if (proxy) return proxy.value;
    const normalized = value => String(value).replace(/[^a-z0-9]/gi, "").toLowerCase();
    const native = node?.widgets?.find(w => normalized(w.name) === normalized(name));
    if (native) return native.value;
    const settings = node?.widgets?.find(w => w.name === "settings");
    try {
        const values = typeof settings?.value === "string" ? JSON.parse(settings.value) : settings?.value;
        if (values && typeof values === "object" && !Array.isArray(values)) {
            const key = Object.keys(values).find(k => normalized(k) === normalized(name));
            if (key != null) return values[key];
        }
    } catch (_) {}
    return undefined;
}
function prompterTotal(node) {
    const facial = isNLMetaPrompter(node) ? prompterSetting(node, "Facial") : undefined;
    const value = Number(facial ?? prompterSetting(node, "max_index"));
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
}
function resolvePrompter(graph, counter, manualId) {
    const candidates = (graph?._nodes || []).filter(isSupportedPrompter);
    if (manualId != null && manualId !== "") {
        const node = candidates.find(n => String(n.id) === String(manualId));
        return { node: node || null, reason: node ? "manual" : "missing", candidates };
    }
    // Prefer NL variants anywhere in the workflow. Connections disambiguate
    // multiple candidates, but are not required for a single present variant.
    const nlCandidates = candidates.filter(isNLMetaPrompter);
    const automaticCandidates = nlCandidates.length ? nlCandidates : candidates;
    const eligible = new Set(automaticCandidates.map(n => String(n.id)));
    // Breadth-first search chooses the nearest downstream eligible prompter.
    // Equal-distance candidates are ambiguous; never choose by graph order.
    const seen = new Set([String(counter.id)]);
    let layer = [counter];
    while (layer.length) {
        const next = [];
        for (const node of layer) for (const output of node.outputs || []) {
            for (const linkId of output.links || []) {
                const link = graph.links instanceof Map ? graph.links.get(linkId) : graph.links?.[linkId];
                const target = graph.getNodeById(link?.target_id);
                if (!target || seen.has(String(target.id))) continue;
                seen.add(String(target.id));
                next.push(target);
            }
        }
        const found = next.filter(n => eligible.has(String(n.id)));
        if (found.length === 1) return { node: found[0], reason: "connected", candidates };
        if (found.length > 1) return { node: null, reason: "ambiguous", candidates };
        layer = next;
    }
    if (nlCandidates.length === 1) return { node: nlCandidates[0], reason: "present", candidates };
    if (nlCandidates.length > 1) return { node: null, reason: "ambiguous", candidates };
    return { node: null, reason: candidates.length ? "disconnected" : "none", candidates };
}

const KNOB_MIN = 1;
const KNOB_MAX = 999999;
function knobBounds(min, max, step = 1) {
    const integer = (v, fallback) => Number.isFinite(Number(v)) ? Math.round(Number(v)) : fallback;
    let lo = Math.max(KNOB_MIN, Math.min(KNOB_MAX, integer(min, KNOB_MIN)));
    let hi = Math.max(KNOB_MIN, Math.min(KNOB_MAX, integer(max, KNOB_MAX)));
    if (hi < lo) [lo, hi] = [hi, lo];
    return { min: lo, max: hi, step: Math.max(1, Math.min(KNOB_MAX, integer(step, 1))) };
}
function knobValue(value, bounds, fallback = bounds.min) {
    const v = Number.isFinite(Number(value)) ? Number(value) : fallback;
    const snapped = bounds.min + Math.round((v - bounds.min) / bounds.step) * bounds.step;
    return Math.max(bounds.min, Math.min(bounds.max, Math.round(snapped)));
}
function knobGeometry(width, height) {
    const reserve = Math.max(140, Math.min(height * 0.90, 300));
    const buttonHeight = Math.max(120, reserve - 4);
    const available = Math.max(0, height - reserve - 4);
    return { buttonHeight, buttonWidth: Math.max(32, (width - 8) / 2),
        shapeHeight: Math.max(0, height - reserve), available,
        diameter: Math.max(0, Math.min(width - 8, available)) };
}

// ─── Default layout ───────────────────────────────────────────────────────────

function defaultLayout(cw, ch) {
    const g = 8;

    // ── Queue controller (left column, full height) ───────────────────────
    const qW = Math.max(120, Math.round((cw - 3 * g) * 0.40));
    const qX = g, qY = g, qH = ch - 2 * g;

    // ── Right panel (remaining width) ───────────────────────────────────────
    const rightX = qX + qW + g;
    const rightW = cw - rightX - g;
    const rightH = ch - 2 * g;

    // 2 rows — floor division, remainder to bottom row
    const baseRowH = Math.floor((rightH - g) / 2);
    const remH     = (rightH - g) - baseRowH * 2;
    const cH = [baseRowH, baseRowH + remH];
    const cY = [g, g + cH[0] + g];

    // 3 columns with content-weighted widths (2 : 3 : 4)
    // Col 0 = narrow  (set_next, freeze — just buttons)
    // Col 1 = medium  (padded_index, knob_int — displays)
    // Col 2 = wide    (index_state, padding_control — needs width)
    //
    // Each column's MIN_W_WGT (the same floor _applyLayout() enforces on
    // every widget) is reserved FIRST; only the leftover surplus beyond
    // that is distributed by weight. Previously the weighting was applied
    // to the full available width with no floor, so at small-to-default
    // node sizes the narrow column could compute below MIN_W_WGT —
    // _applyLayout() would then silently clamp it wider, but the *next*
    // column's x was already computed assuming the narrower, pre-clamp
    // width, so the clamp pushed it straight into the next column's space.
    // Reserving the floor up front keeps the math and the render in
    // agreement, so neighboring columns can never overlap.
    const totalParts = 9; // 2 + 3 + 4
    const weights    = [2, 3, 4];
    const availW     = rightW - 2 * g;
    const reserve    = MIN_W_WGT * 3;

    let cW;
    if (availW >= reserve) {
        const surplus  = availW - reserve;
        const basePart = Math.floor(surplus / totalParts);
        const remW     = surplus - basePart * totalParts;
        cW = [
            MIN_W_WGT + basePart * weights[0],
            MIN_W_WGT + basePart * weights[1],
            MIN_W_WGT + basePart * weights[2] + remW, // rounding remainder → widest column
        ];
    } else {
        // Canvas too narrow to give all three columns MIN_W_WGT even with
        // no weighting at all (only possible near MIN_W_NODE) — fall back
        // to splitting whatever space exists by the same weights. Narrower
        // than ideal, but x-positions below are still computed from these
        // exact widths, so columns stay self-consistent and never overlap.
        const basePart = Math.floor(availW / totalParts);
        const remW     = availW - basePart * totalParts;
        cW = [basePart * weights[0], basePart * weights[1], basePart * weights[2] + remW];
    }

    const cX = [
        rightX,
        rightX + cW[0] + g,
        rightX + cW[0] + g + cW[1] + g,
    ];

    const slot = (x, y, w, h, z, id) => ({
        x, y, w, h,
        z,
        minimized: false,
        accent: ACCENT_DEFAULTS[id],
        label: id.replace(/_/g, " "),
        fontSize: 14,
    });

    return {
        queue_controller:  slot(qX, qY, qW, qH, 1, "queue_controller"),
        set_next:          slot(cX[0], cY[0], cW[0], cH[0], 2, "set_next"),
        padded_index:      slot(cX[1], cY[0], cW[1], cH[0], 3, "padded_index"),
        index_state:       slot(cX[2], cY[0], cW[2], cH[0], 4, "index_state"),
        freeze:            slot(cX[0], cY[1], cW[0], cH[1], 5, "freeze"),
        knob_int:          slot(cX[1], cY[1], cW[1], cH[1], 6, "knob_int"),
        padding_control:   slot(cX[2], cY[1], cW[2], cH[1], 7, "padding_control"),
    };
}

// ─── MegaPanelUI ─────────────────────────────────────────────────────────────

class MegaPanelUI {
    constructor(node, container) {
        this.node      = node;
        this.container = container;
        this.layout    = null;
        this.locked    = false;
        this.snapOn    = true;
        this.autoHide  = false;
        this._drag     = null;
        this._resize   = null;
        this._W        = {};
        this._zTop     = 20;
        this._undoSnapshot = null;    // single-level undo target (see _captureUndo/_doUndo)
        this._state = { current: null, next: 1, padded: "—", freeze: false, padding: 3, lastReset: null };
        this._cleanups = [];
        this._disposed = false;

        this._build();
        // _restoreLayout() is NOT called here. The constructor runs before
        // LiteGraph has sized the DOM widget, so the canvas has zero
        // dimensions at this point — calling _restoreLayout() here always
        // produces 0×0 or 300×200 fallback coordinates regardless of the
        // actual node size.
        //
        // For LOADED nodes: onConfigure fires after the node's saved size
        // is applied, and syncFromNode() calls _restoreLayout() there.
        //
        // For BRAND-NEW nodes: onNodeCreated sets this._isNewNode = true,
        // and the first onDrawBackground call (LiteGraph's per-frame hook,
        // guaranteed to fire only once layout is complete) triggers the
        // restore exactly once.
        this._bindServer();
        this._bindDocMouse();
        
    }

    _build() {
        const c = this.container;
        c.style.width  = "100%";
        c.style.height = "100%";
        c.style.position = "relative";
        c.style.overflow = "hidden";

        this.panel = el("div", "mmp-panel");
        c.appendChild(this.panel);

        this.panel.addEventListener("mousedown", e => e.stopPropagation());
        this.panel.addEventListener("wheel", e => this._forwardWheelToLiteGraph(e), { passive: false });
        this.panel.addEventListener("pointerdown", e => this._maybeStartCanvasPan(e));

        this.snapOverlay = el("div", "mmp-snap-overlay");
        this.panel.appendChild(this.snapOverlay);

        this._buildToolbar();

        this.canvas = el("div", "mmp-canvas");
        this.panel.appendChild(this.canvas);

        this._buildTray();

        this.canvas.addEventListener("contextmenu", e => {
            if (e.target === this.canvas || e.target === this.snapOverlay) {
                e.preventDefault(); e.stopPropagation();
                this._showCanvasCtx(e);
            }
        });

        WIDGET_DEFS.forEach(id => this._buildWidget(id));
        this._positionChrome();
    }

    _positionChrome() {
        const top = TOOLBAR_H, bot = TRAY_H;
        this.snapOverlay.style.cssText = `position:absolute;top:${top}px;left:0;right:0;bottom:${bot}px;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(127,119,221,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(127,119,221,0.04) 1px,transparent 1px);background-size:${SNAP_PX}px ${SNAP_PX}px;`;
        this.canvas.style.cssText = `position:absolute;top:${top}px;left:0;right:0;bottom:${bot}px;overflow:hidden;`;
        if (this._lockBadge) this._lockBadge.style.top = (top + 4) + "px";
    }

    _forwardWheelToLiteGraph(e) {
        const canvas = app.canvas;
        if (!canvas) return;
        e.preventDefault();
        e.stopPropagation();
        if (typeof canvas.processMouseWheel === "function") {
            canvas.processMouseWheel(e);
            return;
        }
        const canvasEl = canvas.canvas;
        if (!canvasEl) return;
        canvasEl.dispatchEvent(new WheelEvent("wheel", {
            deltaX: e.deltaX, deltaY: e.deltaY, deltaZ: e.deltaZ,
            deltaMode: e.deltaMode,
            clientX: e.clientX, clientY: e.clientY,
            screenX: e.screenX, screenY: e.screenY,
            ctrlKey: e.ctrlKey, shiftKey: e.shiftKey,
            altKey: e.altKey, metaKey: e.metaKey,
            bubbles: true, cancelable: true, composed: true,
        }));
    }

    _maybeStartCanvasPan(e) {
        if (e.button !== 1) return;
        const canvas = app.canvas;
        if (!canvas || typeof canvas.processMouseDown !== "function") return;
        e.preventDefault();
        e.stopPropagation();
        canvas.processMouseDown(e);
    }

    _buildToolbar() {
        this.tb = el("div", "mmp-tb");

        this.bReset    = tbb(I.reset,  "Reset layout");
        this.bUndo     = tbb(I.undo,   "Undo last layout change");
        this.bSave     = tbb(I.save,   "Save layout...");
        this.bLoad     = tbb(I.folder, "Load layout...");
        this.bLock     = tbb(I.unlock, "Lock widgets");
        const s1       = el("div", "mmp-tb-sep");
        this.bSnap     = tbb(I.snap,   "Snap 8px: on");
        this.bAutoHide = tbb(I.tb,     "Toolbar auto-hide");
        const s2       = el("div", "mmp-tb-sep");
        this.bCopy     = tbb(I.copy,   "Copy layout to all Mega Panels");
        this.bCog      = tbb(I.cog,    "Widget colours");
        const lbl      = el("span", "mmp-tb-tag"); lbl.textContent = "mega panel";

        this.bSnap.classList.add("on");
        this._updateUndoBtn(); // starts disabled — nothing to undo yet

        this.bReset   .addEventListener("click", () => this._doReset());
        this.bUndo    .addEventListener("click", () => this._doUndo());
        this.bSave    .addEventListener("click", () => this._promptSaveLayout());
        this.bLoad    .addEventListener("click", () => this._toggleLoadLayout());
        this.bLock    .addEventListener("click", () => this._doLock());
        this.bSnap    .addEventListener("click", () => this._doSnap());
        this.bAutoHide.addEventListener("click", () => this._doAutoHide());
        this.bCopy    .addEventListener("click", () => this._doCopyLayout());
        this.bCog     .addEventListener("click", () => this._toggleSettings());

        [this.bReset, this.bUndo, this.bSave, this.bLoad, this.bLock, s1, this.bSnap, this.bAutoHide, s2, this.bCopy, this.bCog, lbl]
            .forEach(n => this.tb.appendChild(n));

        this.panel.appendChild(this.tb);

        this.tbReveal = el("div", "mmp-tb-reveal");
        this.tbReveal.addEventListener("mouseenter", () => { if (this.autoHide) this._showTb(); });
        this.panel.appendChild(this.tbReveal);
    }

    _showTb() { this.tb.classList.remove("hidden"); }
    _hideTb() { this.tb.classList.add("hidden"); }

    _buildTray() {
        this.tray = el("div", "mmp-tray");
        this.trayLbl   = el("span", "mmp-tray-lbl"); this.trayLbl.textContent = "minimized";
        this.trayPills = el("div",  "mmp-tray-pills");
        this.tray.appendChild(this.trayLbl);
        this.tray.appendChild(this.trayPills);
        this.panel.appendChild(this.tray);
    }

    _syncTray() {
        this.trayPills.innerHTML = "";
        let any = false;
        WIDGET_DEFS.forEach(id => {
            const spec = this.layout[id];
            if (!spec?.minimized) return;
            any = true;
            const acc  = spec.accent || ACCENT_DEFAULTS[id];
            const pill = el("div", "mmp-pill");
            pill.style.borderColor = acc + "44";
            const dot = el("span", "mmp-pill-dot"); dot.style.background = acc;
            const lbl = el("span"); lbl.textContent = spec.label || id.replace(/_/g," ");
            const arr = el("span", "mmp-pill-arr"); arr.textContent = "▸";
            pill.appendChild(dot); pill.appendChild(lbl); pill.appendChild(arr);
            pill.addEventListener("click", () => this._restore(id));
            this.trayPills.appendChild(pill);
        });
        this.trayLbl.style.opacity = any ? "1" : "0.3";
    }

    _buildWidget(id) {
        const wr    = el("div", "mmp-w");    wr.dataset.wid = id;
        const inner = el("div", "mmp-wi");
        const bar   = el("div", "mmp-wbar");
        const acc   = el("div", "mmp-wacc");
        const title = el("span","mmp-wtitle"); title.textContent = id.replace(/_/g," ");
        const btns  = el("div", "mmp-wbar-btns");

        const bFront = wbBtn(I.front, "Bring to front");
        const bBack  = wbBtn(I.back,  "Send to back");
        const bEdit  = wbBtn(I.edit,  "Rename");
        const bMin   = wbBtn(I.minimize, "Minimize");

        bFront.addEventListener("click", e => { e.stopPropagation(); this._bringFront(id); });
        bBack .addEventListener("click", e => { e.stopPropagation(); this._sendBack(id); });
        bEdit .addEventListener("click", e => { e.stopPropagation(); this._startRename(id, title); });
        bMin  .addEventListener("click", e => { e.stopPropagation(); this._minimize(id); });

        title.addEventListener("dblclick", e => { e.stopPropagation(); this._startRename(id, title); });

        btns.appendChild(bFront); btns.appendChild(bBack);
        btns.appendChild(bEdit);
        if (id === "knob_int") {
            const bGear = wbBtn(I.cog, "Knob settings");
            bGear.addEventListener("click", e => { e.stopPropagation(); this._openKnobSettings(); });
            btns.appendChild(bGear);
        }
        btns.appendChild(bMin);
        bar.appendChild(acc); bar.appendChild(title); bar.appendChild(btns);

        const body = el("div", "mmp-wbody");
        this._buildContent(id, body);

        const rh = el("div", "mmp-rh");

        inner.appendChild(bar); inner.appendChild(body);
        wr.appendChild(inner);  wr.appendChild(rh);

        bar.addEventListener("mousedown", e => {
            if (this.locked || e.target.closest(".mmp-wbar-btn")) return;
            e.preventDefault(); e.stopPropagation();
            this._startDrag(e, id);
        });

        rh.addEventListener("mousedown", e => {
            if (this.locked) return;
            e.preventDefault(); e.stopPropagation();
            this._startResize(e, id);
        });

        wr.addEventListener("mousedown", () => this._focus(id));

        wr.addEventListener("contextmenu", e => {
            e.preventDefault(); e.stopPropagation();
            this._showWidgetCtx(e, id);
        });

        this.canvas.appendChild(wr);
        this._W[id] = { el: wr, inner, bar, acc, title, body, rh };

        if (id !== "knob_int") this._attachFluidScaling(id, body);
    }

    _buildContent(id, body) {
        if (id === "padded_index") {
            const big = el("div", "mmp-idx-big"); big.textContent = "000";
            const sub = el("div", "mmp-idx-sub"); sub.textContent = "current";

            // "→ knob" button: copies current displayed index into the knob
            const toKnobBtn = el("button", "mmp-idx-to-knob");
            toKnobBtn.textContent = "→ knob";
            toKnobBtn.title = "Set knob to current index";
            toKnobBtn.addEventListener("click", e => {
                e.stopPropagation();
                const kw = this._pw("knobValue");
                if (!kw) return;
                const val = this._state.current ?? 0;
                const clamped = Math.max(kw.options?.min ?? 1, Math.min(kw.options?.max ?? 999999, Math.round(val)));
                kw.value = clamped;
                kw.callback?.(clamped);
                this._updateKnob();
            });

            body.appendChild(big);
            body.appendChild(sub);
            body.appendChild(toKnobBtn);
            this._W._piBig = big;

        } else if (id === "knob_int") {
            this._buildKnobContent(body);

        } else if (id === "index_state") {
            const pair  = el("div", "mmp-pair");
            const lcell = el("div", "mmp-pair-cell");
            const lnum  = el("div", "mmp-pair-num");  lnum.textContent = "0";
            const llbl  = el("div", "mmp-pair-lbl");  llbl.textContent = "last";
            lcell.appendChild(lnum); lcell.appendChild(llbl);
            const arrow = el("div", "mmp-pair-arrow"); arrow.textContent = "→";
            const rcell = el("div", "mmp-pair-cell");
            const rnum  = el("div", "mmp-pair-num next-c"); rnum.textContent = "1";
            const rlbl  = el("div", "mmp-pair-lbl");  rlbl.textContent = "next";
            rcell.appendChild(rnum); rcell.appendChild(rlbl);
            pair.appendChild(lcell); pair.appendChild(arrow); pair.appendChild(rcell);
            body.appendChild(pair);
            this._W._stL = lnum; this._W._stR = rnum;

        } else if (id === "set_next") {
            body.classList.add("single-btn-body");
            const sBtn = el("button", "mmp-btn acc-btn");
            sBtn.textContent = "set next";
            sBtn.addEventListener("click", () => this._doSetNext());
            body.appendChild(sBtn);
            this._W._sBtn = sBtn;

        } else if (id === "freeze") {
            body.classList.add("single-btn-body");
            const fBtn = el("button", "mmp-btn");
            fBtn.textContent = "freeze";
            fBtn.addEventListener("click", () => this._doFreeze(fBtn));
            body.appendChild(fBtn);
            this._W._fBtn = fBtn;

        } else if (id === "padding_control") {
            body.classList.add("padding-body");
            const plbl = el("div", "mmp-pad-label"); plbl.textContent = "padding";
            const prow = el("div", "mmp-pad-row");
            const sdec = el("span", "mmp-spin-btn"); sdec.textContent = "−";
            const sval = el("span", "mmp-spin-val"); sval.textContent = "3";
            const sinc = el("span", "mmp-spin-btn"); sinc.textContent = "+";
            // These are <span>s styled as buttons, which by default are not
            // focusable or keyboard-operable at all (no tab stop, no Enter/
            // Space activation). Give them real button semantics rather than
            // just a label, so keyboard/screen-reader users can actually use
            // them, not just have them announced.
            [[sdec, "Decrease padding", -1], [sinc, "Increase padding", +1]].forEach(([btn, label, dir]) => {
                a11y(btn, label);
                btn.setAttribute("role", "button");
                btn.tabIndex = 0;
                btn.addEventListener("keydown", e => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._changePad(dir, sval); }
                });
            });
            sdec.addEventListener("click", () => this._changePad(-1, sval));
            sinc.addEventListener("click", () => this._changePad(+1, sval));
            prow.appendChild(sdec); prow.appendChild(sval); prow.appendChild(sinc);
            body.appendChild(plbl); body.appendChild(prow);
            this._W._sval = sval;

        } else if (id === "queue_controller") {
            this._buildQueueControllerContent(body);
        }
    }

    // Applies one widget's full visual state (position, size, z-index,
    // accent/bg/font colors, title, and minimized visibility) from its
    // layout spec. This is the SINGLE place that knows how to paint a
    // widget — both _applyLayout()'s normal per-frame pass and
    // _restoreLayout()'s last-resort "canvas never sized" fallback route
    // through here now. They used to be two independently hand-maintained
    // copies, and the fallback copy quietly fell out of sync (it never
    // learned about `display`), which is exactly what let minimized
    // widgets reappear at full size when that fallback fired: on a normal
    // path _applyLayout() would immediately overwrite it to `none` again,
    // but the fallback ran instead of it and just never set `display` at
    // all, leaving the browser's default `block`.
    _styleWidget(id, cw, ch, { clamp = true } = {}) {
        const s  = this.layout[id];
        const Wm = this._W[id]; if (!Wm || !s) return;

        let px = Math.round(s.x);
        let py = Math.round(s.y);
        let pw = Math.round(s.w);
        let ph = Math.round(s.h);

        // Guard against degenerate/corrupted data only (zero, negative,
        // NaN) — this is NOT a UX comfort floor. defaultLayout() already
        // guarantees MIN_W_WGT/MIN_H_WGT whenever the canvas has room for
        // it, and falls back to narrower-but-self-consistent values when
        // it truly doesn't (near MIN_W_NODE). Re-clamping every widget up
        // to the full MIN_W_WGT here regardless of available room is what
        // caused real overlap: this clamp has no idea where sibling
        // widgets are, so forcing one wider pushes it straight into the
        // next column's already-claimed space. The interactive resize
        // handle (_onDocMouseMove) still enforces the full MIN_W_WGT/
        // MIN_H_WGT floor for live drags — that's the actual UX case the
        // floor is meant to protect (stopping a user from resizing a
        // widget into uselessness), not rendering already-computed data.
        if (!Number.isFinite(pw) || pw <= 0) pw = MIN_W_WGT;
        if (!Number.isFinite(ph) || ph <= 0) ph = MIN_H_WGT;
        if (!Number.isFinite(px)) px = 0;
        if (!Number.isFinite(py)) py = 0;

        // Keep the widget on-canvas without inflating its stored size.
        // Skipped when `clamp` is false (the RAF-timeout fallback in
        // _restoreLayout): that caller doesn't know the real canvas size —
        // its cw/ch are a placeholder, not a measurement — so clamping
        // against them would crush every widget bigger than the
        // placeholder down to it and pin it to (0,0). Painting the raw
        // saved coordinates instead (possibly off-canvas until the next
        // real _applyLayout() call corrects it) is the lesser problem.
        if (clamp) {
            pw = Math.min(pw, cw);
            ph = Math.min(ph, ch);
            px = Math.max(0, Math.min(cw - pw, px));
            py = Math.max(0, Math.min(ch - ph, py));
        }

        Wm.el.style.left   = px + "px";
        Wm.el.style.top    = py + "px";
        Wm.el.style.width  = pw + "px";
        Wm.el.style.height = ph + "px";
        Wm.el.style.zIndex = s.z || 10;
        Wm.el.style.setProperty("--acc", s.accent || ACCENT_DEFAULTS[id]);
        Wm.acc.style.background = s.accent || ACCENT_DEFAULTS[id];
        // Background/font color are optional per-widget overrides (set
        // via the Accent colours panel) — unset by default, in which
        // case the CSS var(--wbg/--wfg, <original>) fallbacks apply and
        // nothing visually changes. removeProperty matters here: once a
        // widget has an override and the user resets it back to
        // "default", the property must actually be cleared, not just
        // left at its last value, or the fallback would never kick in
        // again.
        if (s.bgColor) Wm.el.style.setProperty("--wbg", s.bgColor); else Wm.el.style.removeProperty("--wbg");
        if (s.fontColor) Wm.el.style.setProperty("--wfg", s.fontColor); else Wm.el.style.removeProperty("--wfg");
        Wm.title.textContent    = s.label  || id.replace(/_/g," ");
        Wm.el.style.display     = s.minimized ? "none" : "block";
    }

    _applyLayout() {
        const cw = this.canvas.offsetWidth;
        const ch = this.canvas.offsetHeight;
        // If the canvas hasn't been laid out yet, applying coordinates
        // against cw=0/ch=0 would clip everything to a tiny box. The RAF
        // polling loop in _restoreLayout will call _applyLayout again once
        // the canvas has real dimensions — bail here and wait for that.
        if (!cw || !ch) return;

        WIDGET_DEFS.forEach(id => this._styleWidget(id, cw, ch));

        this._scaleContent();
        this._syncTray();
    }

    _buildKnobContent(body) {
        const wrap = el("div", "mmp-knob-widget-wrap");
        body.style.padding = "0";
        body.appendChild(wrap);

        const shapes = el("div", "mmp-knob-shapes shape-knob");
        wrap.appendChild(shapes);

        const kKnobCont  = el("div", "knob-container");
        const kBody      = el("div", "knob-body"); kBody.tabIndex = 0;
        const kIndicator = el("div", "knob-indicator");
        const kCenter    = el("div", "knob-center-display");
        const kValLabel  = el("div", "knob-value");
        kCenter.appendChild(kValLabel); kBody.appendChild(kIndicator); kBody.appendChild(kCenter);
        kKnobCont.appendChild(kBody);

        const kVCont  = el("div", "vertical-slider-container");
        const kVTrack = el("div", "slider-vertical-track");
        const kVThumb = el("div", "slider-vertical-thumb"); kVThumb.tabIndex = 0;
        const kVSpan  = el("span"); kVThumb.appendChild(kVSpan); kVTrack.appendChild(kVThumb); kVCont.appendChild(kVTrack);

        const kHCont  = el("div", "horizontal-slider-container");
        const kHTrack = el("div", "slider-horizontal-track");
        const kHThumb = el("div", "slider-horizontal-thumb"); kHThumb.tabIndex = 0;
        const kHSpan  = el("span"); kHThumb.appendChild(kHSpan); kHTrack.appendChild(kHThumb); kHCont.appendChild(kHTrack);

        shapes.appendChild(kKnobCont); shapes.appendChild(kVCont); shapes.appendChild(kHCont);

        const kMinus = el("button", "mmp-knob-corner-btn"); kMinus.textContent = "-1";
        const kPlus  = el("button", "mmp-knob-corner-btn"); kPlus.textContent = "+1";
        wrap.appendChild(kMinus); wrap.appendChild(kPlus);

        this._W._knobShapes = shapes;
        this._W._knobBody   = kBody;
        this._W._knobInd    = kIndicator;
        this._W._knobVal    = kValLabel;
        this._W._knobMinus  = kMinus;
        this._W._knobPlus   = kPlus;
        this._W._knobVTrack = kVTrack; this._W._knobVThumb = kVThumb; this._W._knobVSpan = kVSpan;
        this._W._knobHTrack = kHTrack; this._W._knobHThumb = kHThumb; this._W._knobHSpan = kHSpan;

        const props = () => {
            const np = this.node.properties = this.node.properties || {};
            np.knobColor   = np.knobColor   || "#1D9E75";
            np.knobTheme   = np.knobTheme   || "dark";
            np.knobShape   = np.knobShape   || "knob";
            np.knobTitle   = np.knobTitle   || "";
            np.knobStepper = np.knobStepper ?? 1;
            return np;
        };

        const applyShape = (shape) => {
            props().knobShape = shape;
            shapes.classList.remove("shape-knob", "shape-vertical_slider", "shape-horizontal_slider");
            shapes.classList.add(`shape-${shape}`);
        };

        const applyTheme = (theme, persist = true) => {
            if (persist) props().knobTheme = theme;
            shapes.classList.forEach(c => { if (c.startsWith("theme-")) shapes.classList.remove(c); });
            if (theme !== "dark") shapes.classList.add(`theme-${theme}`);
            const tc = THEME_DEFAULTS[theme]?.color;
            if (tc) applyColor(tc, persist);
        };

        const applyColor = (color, persist = true) => {
            if (persist) props().knobColor = color;
            wrap.style.setProperty("--knob-color", color);
            shapes.style.setProperty("--knob-color", color);
        };

        const applyValue = (v) => {
            const w   = this._pw("knobValue"); if (!w) return;
            const p   = props();
            const bounds = knobBounds(w.options?.min, w.options?.max, p.knobStepper);
            const nv = knobValue(v, bounds, Number(w.value));
            w.value = nv; w.callback?.(nv);
            this._notifyGraphChanged();
            this._updateKnob();
        };

        const layout = () => {
            const ww = wrap.clientWidth, wh = wrap.clientHeight;
            if (!ww || !wh) return;

            wrap.style.position = "relative";

            const geometry = knobGeometry(ww, wh);
            const btnH = geometry.buttonHeight, btnW = geometry.buttonWidth;

            shapes.style.width = "100%";
            shapes.style.height = geometry.shapeHeight + "px";
            shapes.style.display = "flex";
            shapes.style.alignItems = "center";
            shapes.style.justifyContent = "center";
            shapes.style.overflow = "hidden";

            const availH = geometry.available;
            const ksz = geometry.diameter;
            const indH = ksz * 0.25, indTop = ksz * 0.107;

            kBody.style.width = kBody.style.height = ksz + "px";
            kIndicator.style.height = indH + "px";
            kIndicator.style.width  = (ksz * 0.044) + "px";
            kIndicator.style.top    = indTop + "px";
            kIndicator.style.left   = `calc(50% - ${ksz * 0.022}px)`;
            kIndicator.style.transformOrigin = `center ${(ksz / 2) - indTop}px`;
            const csz = ksz * 0.7;
            kCenter.style.width = kCenter.style.height = csz + "px";
            kValLabel.style.fontSize = (ksz * 0.12) + "px";

            const btnFont = Math.max(12, btnH * 0.75);
            kMinus.style.cssText = `position:absolute;left:2px;bottom:2px;width:${btnW}px;height:${btnH}px;border-radius:4px;font-size:${btnFont}px;`;
            kPlus.style.cssText  = `position:absolute;right:2px;bottom:2px;width:${btnW}px;height:${btnH}px;border-radius:4px;font-size:${btnFont}px;`;

            const vH = Math.max(0, availH * 0.85);
            const vTh = Math.min(vH, Math.max(8, vH * 0.18));
            kVTrack.style.height = vH + "px";
            kVTrack.style.width = "28px";
            kVThumb.style.height = vTh + "px";
            kVThumb.style.width = "38px";
            kVThumb.style.left = "-5px";
            kVSpan.style.fontSize = (vTh * 0.5) + "px";

            const hW = ww * 0.8;
            const hTw = Math.min(hW, Math.max(18, hW * 0.15));
            kHTrack.style.width = hW + "px";
            kHTrack.style.height = Math.min(28, availH) + "px";
            kHThumb.style.width = hTw + "px";
            kHThumb.style.height = Math.min(38, availH) + "px";
            kHThumb.style.top = "0px";
            kHSpan.style.fontSize = (hTw * 0.5) + "px";

            this._updateKnob();
        };
        this._observeSize(wrap, layout);

        setTimeout(() => { if (!this._disposed) this._syncKnobFromProperties(); }, 60);

        let kd = null;
        kBody.addEventListener("mousedown", e => {
            if (e.button !== 0) return;
            e.preventDefault(); e.stopPropagation();
            const w = this._pw("knobValue"); if (!w) return;
            kd = { y: e.clientY, v0: w.value }; kBody.classList.add("dragging");
            document.addEventListener("mousemove", onKM); document.addEventListener("mouseup", onKU);
        });
        const onKM = e => {
            if (!kd) return;
            const w = this._pw("knobValue"); if (!w) return;
            const range = (w.options?.max ?? 999999) - (w.options?.min ?? 1);
            applyValue(kd.v0 + (kd.y - e.clientY) * range / 280);
        };
        const onKU = () => { kd = null; kBody.classList.remove("dragging"); document.removeEventListener("mousemove", onKM); document.removeEventListener("mouseup", onKU); };

        wrap.addEventListener("wheel", e => {
            e.preventDefault(); e.stopPropagation();
            const w = this._pw("knobValue"); if (!w) return;
            applyValue(w.value + (e.deltaY < 0 ? 1 : -1) * (props().knobStepper || 1));
        }, { passive: false });

        let vd = false;
        kVThumb.addEventListener("mousedown", e => { if (e.button!==0) return; vd=true; kVThumb.classList.add("dragging"); e.preventDefault(); e.stopPropagation(); document.addEventListener("mousemove", onVM); document.addEventListener("mouseup", onVU); });
        const onVM = e => { if (!vd) return; const r = kVTrack.getBoundingClientRect(); const w = this._pw("knobValue"); if (!w) return; applyValue(w.options.min + (1 - Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))) * (w.options.max - w.options.min)); };
        const onVU = () => { vd=false; kVThumb.classList.remove("dragging"); document.removeEventListener("mousemove",onVM); document.removeEventListener("mouseup",onVU); };
        kVTrack.addEventListener("click", e => { const r=kVTrack.getBoundingClientRect(); const w=this._pw("knobValue"); if (!w) return; applyValue(w.options.min+(1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)))*(w.options.max-w.options.min)); });

        let hd = false;
        kHThumb.addEventListener("mousedown", e => { if (e.button!==0) return; hd=true; kHThumb.classList.add("dragging"); e.preventDefault(); e.stopPropagation(); document.addEventListener("mousemove", onHM); document.addEventListener("mouseup", onHU); });
        const onHM = e => { if (!hd) return; const r=kHTrack.getBoundingClientRect(); const w=this._pw("knobValue"); if (!w) return; applyValue(w.options.min+Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*(w.options.max-w.options.min)); };
        const onHU = () => { hd=false; kHThumb.classList.remove("dragging"); document.removeEventListener("mousemove",onHM); document.removeEventListener("mouseup",onHU); };
        kHTrack.addEventListener("click", e => { const r=kHTrack.getBoundingClientRect(); const w=this._pw("knobValue"); if (!w) return; applyValue(w.options.min+Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*(w.options.max-w.options.min)); });

        kMinus.addEventListener("click", e => { e.stopPropagation(); const w=this._pw("knobValue"); if (w) applyValue(w.value - (props().knobStepper||1)); });
        kPlus .addEventListener("click", e => { e.stopPropagation(); const w=this._pw("knobValue"); if (w) applyValue(w.value + (props().knobStepper||1)); });

        wrap.tabIndex = 0;
        wrap.addEventListener("keydown", e => {
            const w = this._pw("knobValue"); if (!w) return;
            if (e.key==="ArrowUp"||e.key==="ArrowRight")   { applyValue(w.value + (props().knobStepper||1)); e.preventDefault(); }
            if (e.key==="ArrowDown"||e.key==="ArrowLeft")  { applyValue(w.value - (props().knobStepper||1)); e.preventDefault(); }
        });

        kBody.addEventListener("dblclick", e => {
            e.preventDefault(); e.stopPropagation();
            const w = this._pw("knobValue"); if (!w) return;
            const inp = document.createElement("input"); inp.type="number"; inp.value=Math.round(w.value);
            inp.min=w.options?.min??1; inp.max=w.options?.max??999999;
            inp.style.cssText = "position:absolute;inset:0;width:100%;height:100%;text-align:center;background:#1a1a1e;border:1px solid #534AB7;color:#a89de8;font-size:18px;font-family:monospace;z-index:50;border-radius:0;";
            wrap.style.position="relative"; wrap.appendChild(inp); inp.focus(); inp.select();
            const commit = () => { applyValue(inp.value === "" ? w.value : Number(inp.value)); inp.remove(); };
            inp.addEventListener("keydown", ev => { if(ev.key==="Enter") commit(); if(ev.key==="Escape") inp.remove(); });
            inp.addEventListener("blur", () => setTimeout(()=>{ if(inp.isConnected) commit(); }, 100));
        });

        this._cleanups?.push(() => { onKU(); onVU(); onHU(); });
        this._W._knobApply = { applyValue, applyTheme, applyShape, applyColor, props, layout };
    }

    _updateKnob() {
        const w = this._pw("knobValue"); if (!w) return;
        const Km = this._W;
        if (!Km._knobVal) return;
        const np  = this.node.properties || {};
        const min = w.options?.min ?? 1, max = w.options?.max ?? 999999;
        const pct = Math.max(0, Math.min(1, (w.value - min) / Math.max(1, max - min)));

        Km._knobVal.textContent = Math.round(w.value);
        const diameter = parseFloat(Km._knobBody?.style.width) || 40;
        Km._knobVal.style.fontSize = Math.max(1, Math.min(diameter * 0.18,
            diameter * 0.62 / (String(Math.round(w.value)).length * 0.65))) + "px";
        if (Km._knobInd) Km._knobInd.style.transform = `rotate(${-135 + pct * 270}deg)`;
        if (Km._knobBody) Km._knobBody.style.setProperty("--knob-progress", pct * 100);

        if (Km._knobVTrack && Km._knobVThumb) {
            const vH = parseFloat(Km._knobVTrack.style.height) || 100;
            const vTh = parseFloat(Km._knobVThumb.style.height) || 20;
            Km._knobVThumb.style.top = ((1 - pct) * (vH - vTh)) + "px";
            if (Km._knobVSpan) Km._knobVSpan.textContent = Math.round(w.value);
        }
        if (Km._knobHTrack && Km._knobHThumb) {
            const hW = parseFloat(Km._knobHTrack.style.width) || 100;
            const hTw = parseFloat(Km._knobHThumb.style.width) || 20;
            Km._knobHThumb.style.left = (pct * (hW - hTw)) + "px";
            if (Km._knobHSpan) Km._knobHSpan.textContent = Math.round(w.value);
        }
    }

    _attachFluidScaling(id, body) {
        const REF = {
            padded_index:     { w: 100, h: 90  },
            index_state:      { w: 100, h: 70  },
            set_next:         { w: 100, h: 60  },
            freeze:           { w: 100, h: 60  },
            padding_control:  { w: 100, h: 60  },
            knob_int:         { w: 100, h: 110 },
            queue_controller: { w: 180, h: 250 },
        };
        const ref = REF[id] || { w: 100, h: 100 };

        const compute = () => {
            const w = body.clientWidth, h = body.clientHeight;
            if (!w || !h) return;
            const wf = w / ref.w;
            const hf = h / ref.h;
            let scale = Math.max(0.01, Math.min(wf, hf));
            if (id === "queue_controller" && body._queueDash) {
                const dash = body._queueDash;
                const fire = body._queueFire;
                // Measure intrinsic row heights, rather than the dashboard's
                // stretched height. All rows (including wrapped status text)
                // participate in the fit; the Fire row takes any spare space.
                dash.style.height = "auto";
                dash.style.flex = "0 0 auto";
                fire.style.flex = "0 0 auto";
                const fits = value => {
                    body.style.setProperty("--wscale", value.toFixed(4));
                    return dash.scrollHeight <= h - 12 && dash.scrollWidth <= w - 10;
                };
                if (!fits(scale)) {
                    let low = 0, high = scale;
                    for (let i = 0; i < 12; i++) {
                        const mid = (low + high) / 2;
                        if (fits(mid)) low = mid; else high = mid;
                    }
                    scale = low || 0.001;
                }
                dash.style.height = "100%";
                dash.style.flex = "1 1 0";
                fire.style.flex = "1 0 auto";
            }
            body.style.setProperty("--wscale", scale.toFixed(4));
        };

        this._observeSize(body, compute);
        requestAnimationFrame(compute);
        this._W[id]._fluidRecompute = compute;
    }

    _scaleContent() {
        WIDGET_DEFS.forEach(id => this._W[id]?._fluidRecompute?.());
    }

    _buildQueueControllerContent(body) {
        body.classList.add("qc-body");
        body.innerHTML = "";
        body.style.cssText = "";
        body.style.display = "flex";
        body.style.flexDirection = "column";
        body.style.padding = "0";
        body.style.gap = "0";
        body.style.justifyContent = "flex-start";
        body.style.background = "transparent";

        const Q = {};

        const dash = el("div", "mmp-qc-dashboard");
        body.appendChild(dash);
        body._queueDash = dash;

        const statusBar = el("div", "mmp-qc-status-bar");
        dash.appendChild(statusBar);

        const metrics = el("div", "mmp-qc-metrics");
        const mkMetric = (label, initial) => {
            const card = el("div", "mmp-qc-metric-card");
            const lbl  = el("div", "mmp-qc-metric-label"); lbl.textContent = label;
            const val  = el("div", "mmp-qc-metric-value"); val.textContent = initial;
            card.appendChild(lbl); card.appendChild(val);
            return { card, val };
        };
        const idxMetric = { card: el("div"), val: el("div") }; // kept for compat, not shown
        const totMetric = mkMetric("TOTAL", "—");
        metrics.appendChild(totMetric.card);
        dash.appendChild(metrics);
        const selection = el("div", "mmp-qc-selection");
        const selectLabel = el("label", "mmp-qc-selection-label");
        selectLabel.textContent = "Prompter";
        const prompterSelect = el("select", "mmp-qc-prompter-select");
        a11y(prompterSelect, "Prompter used by Aim and Auto");
        selectLabel.appendChild(prompterSelect);
        const selectionStatus = el("div", "mmp-qc-selection-status");
        selectionStatus.setAttribute("role", "status");
        selection.appendChild(selectLabel);
        selection.appendChild(selectionStatus);
        const autoStatus = el("div", "mmp-qc-selection-status");
        autoStatus.setAttribute("role", "status");
        autoStatus.textContent = "Auto: idle";
        selection.appendChild(autoStatus);
        const endRow = el("div", "mmp-qc-end-row");
        const endLabel = el("label"); endLabel.textContent = "End index";
        const endInput = el("input", "mmp-qc-prompter-select");
        endInput.type = "number"; endInput.min = "1"; endInput.step = "1";
        endInput.max = String(Number.MAX_SAFE_INTEGER);
        a11y(endInput, "Inclusive end index for Aim and Auto");
        endLabel.appendChild(endInput);
        const totalLabel = el("label", "mmp-qc-end-follow");
        const followTotal = el("input"); followTotal.type = "checkbox";
        totalLabel.appendChild(followTotal);
        const totalText = el("span"); totalText.textContent = "Use Total";
        totalLabel.appendChild(totalText);
        endRow.appendChild(endLabel); endRow.appendChild(totalLabel);
        selection.appendChild(endRow);
        this._qcEndInput = endInput;
        this._qcFollowTotal = followTotal;
        this._qcAutoStatus = autoStatus;
        metrics.appendChild(selection);
        this._observeSize(selection, () => this._W.queue_controller?._fluidRecompute?.());
        this._qcPrompterSelect = prompterSelect;
        this._qcSelectionStatus = selectionStatus;

        const actionRow = el("div", "mmp-qc-section mmp-qc-actions");
        actionRow.style.marginTop    = "calc(4px * var(--wscale))";
        actionRow.style.marginBottom = "calc(2px * var(--wscale))";

        const resetBtn   = a11y(el("button", "mmp-qc-btn"), "Reset target to 1");
        resetBtn.textContent = "🔄 Reset";
        const aimBtn     = a11y(el("button", "mmp-qc-btn mmp-qc-btn-accent"), "Aim: fill remaining queue");
        aimBtn.textContent = "🚀 Aim";
        const autoBtn    = a11y(el("button", "mmp-qc-btn mmp-qc-btn-toggle"), "Auto-fire: off");
        autoBtn.textContent = "▶ Start Auto";
        const restartBtn = a11y(el("button", "mmp-qc-btn mmp-qc-btn-danger"), "Restart ComfyUI");
        restartBtn.textContent = "⚠️";

        actionRow.appendChild(resetBtn); actionRow.appendChild(aimBtn);
        actionRow.appendChild(autoBtn);  actionRow.appendChild(restartBtn);
        dash.appendChild(actionRow);

        const fireRow = el("div", "mmp-qc-section mmp-qc-fire-row");
        body._queueFire = fireRow;
        fireRow.style.flex = "1 0 auto";
        fireRow.style.minHeight = "calc(32px * var(--wscale))";
        fireRow.style.alignItems = "stretch";
        fireRow.style.marginTop = "calc(2px * var(--wscale))";

        const decBtn = a11y(el("button", "mmp-qc-btn mmp-qc-stepper"), "Decrease queue target"); decBtn.textContent = "−";
        const hitBtn = el("button", "mmp-qc-btn mmp-qc-btn-hero"); hitBtn.textContent = "🔥 ×1";
        const incBtn = a11y(el("button", "mmp-qc-btn mmp-qc-stepper"), "Increase queue target"); incBtn.textContent = "+";

        fireRow.appendChild(decBtn); fireRow.appendChild(hitBtn); fireRow.appendChild(incBtn);
        dash.appendChild(fireRow);

        const opsRow = el("div", "mmp-qc-section");
        opsRow.style.marginTop    = "calc(2px * var(--wscale))";
        opsRow.style.marginBottom = "calc(4px * var(--wscale))";

        const stopBtn = a11y(el("button", "mmp-qc-btn mmp-qc-btn-op"), "Stop / interrupt current run");
        stopBtn.textContent = "⏹ stop";
        const clrBtn  = a11y(el("button", "mmp-qc-btn mmp-qc-btn-op clear"), "Clear the prompt queue");
        clrBtn.textContent  = "🗑 clear";

        opsRow.appendChild(stopBtn); opsRow.appendChild(clrBtn);
        dash.appendChild(opsRow);

        Q.targetVal   = 1;
        Q.autoFire    = false;
        Q.sb2Id       = null;
        Q.prompterId  = null;
        Q.sb2Idx      = 0;
        // True once Q.sb2Idx has been populated from a real source (persisted
        // server state, a live execution event, or an explicit Set Next) —
        // as opposed to still sitting at its unset default of 0. recalcAim
        // uses this to decide whether Q.sb2Idx is trustworthy or whether it
        // must fall back to reading the raw current_index widget instead.
        Q._sb2IdxKnown = false;
        Q.total       = 0;
        Q.endIndex = 0;
        Q._sb2SeedFor = null;
        Q._sb2Live    = false;
        Q.aimLive     = false;   // when true, Aim keeps recalculating "remaining" instead of a one-shot snapshot
        Q.activePromptId = null;
        Q.completedCounter = new Map();
        Q.disposed = false;
        Q.autoEpoch = 0;
        Q.queueBusy = false;
        Q.selectionEpoch = 0;

        const updateHitLabel = () => {
            hitBtn.textContent = `🔥 ×${Q.targetVal}`;
            a11y(hitBtn, `Queue ${Q.targetVal} prompt${Q.targetVal === 1 ? "" : "s"}`);
        };
        updateHitLabel();

        const setTarget = (v) => {
            Q.targetVal = Math.max(0, Math.min(1000, Math.round(v)));
            updateHitLabel();
        };

        const seedSb2Idx = async (id) => {
            if (Q._sb2SeedFor === id) return;
            Q._sb2SeedFor = id;
            const identity = this._pw("state_id")?.value;
            try {
                const res  = await api.fetchApi(`/magik_mega_panel/state/${encodeURIComponent(this._pw("state_id")?.value || "")}`);
                const data = await res.json();
                if (Q.disposed || Q.sb2Id !== id || Q._sb2Live
                    || identity !== this._pw("state_id")?.value) return;
                if (data?.found && data.index != null) {
                    Q.sb2Idx = data.last_reset !== Number(this._pw("reset_trigger")?.value ?? 0)
                        ? Number(this._pw("current_index")?.value ?? 1) : data.index;
                    Q._sb2IdxKnown = true;
                    refreshDisplay();
                }
            } catch(_) {}
        };

        const refreshDisplay = () => {
            const graph = this.node.graph || app.canvas?.graph;
            Q.total = 0;
            if (Q.prompterId != null) {
                const n = graph?.getNodeById(Q.prompterId);
                if (n) {
                    Q.total = prompterTotal(n);
                }
            }
            const override = this.node.properties?.mmpEndIndex;
            const hasOverride = Number.isSafeInteger(override) && override >= 1;
            Q.endIndex = hasOverride ? override : Q.total;
            followTotal.checked = !hasOverride;
            endInput.disabled = !hasOverride;
            // Do not overwrite an in-progress manual edit on every discovery poll.
            if (document.activeElement !== endInput) endInput.value = Q.endIndex > 0 ? String(Q.endIndex) : "";
            endInput.placeholder = "Waiting for Total";
            const idxText = Q.sb2Id ? Q.sb2Idx : "—";
            const totText = Q.prompterId != null ? Q.total : "—";
            const valid = Q.prompterId != null && Q.total > 0;
            aimBtn.disabled = !valid;
            autoBtn.disabled = !valid;
            if (Q.prompterId != null) {
                const selected = graph?.getNodeById(Q.prompterId);
                selectionStatus.textContent = valid
                    ? `${Q.selectionReason === "manual" ? "Manual" : Q.selectionReason === "present" ? "Detected" : "Connected"}: ${selected?.title || selected?.type} (#${Q.prompterId})`
                    : `Node #${Q.prompterId} has no positive total`;
            }
            selectionStatus.classList.toggle("invalid", !valid);
            if (!valid && Q.autoFire) {
                stopAuto("Stopped: no valid prompter total");
            }

            const prevIdx = idxMetric.val.textContent;
            idxMetric.val.textContent = idxText;
            if (prevIdx !== String(idxText)) {
                idxMetric.val.classList.remove("idx-highlight");
                void idxMetric.val.offsetWidth;
                idxMetric.val.classList.add("idx-highlight");
            }

            totMetric.val.textContent = totText;

            const done = Q.total > 0 && Q.sb2Idx > Q.endIndex;
            idxMetric.val.classList.toggle("done", done);
            totMetric.val.classList.toggle("done", done);
            idxMetric.card.classList.toggle("active", done);
            totMetric.card.classList.toggle("active", done);

            const isActive = Q.sb2Id && Q.total > 0 && Q.sb2Idx <= Q.endIndex;
            statusBar.classList.toggle("active", isActive);
        };

        const findNodes = () => {
            const graph = this.node.graph || app.canvas?.graph; if (!graph) return;
            if (Q.sb2Id      && !graph.getNodeById(Q.sb2Id))      Q.sb2Id = null;
            if (Q.prompterId && !graph.getNodeById(Q.prompterId)) Q.prompterId = null;

            if (!Q.sb2Id) {
                const isCounter = this.node.type === "SuperBatcheur2" || this.node.type === "MagikMegaPanel";
                const n = isCounter ? this.node
                    : graph._nodes?.find(n => n.type === "SuperBatcheur2" || n.type === "MagikMegaPanel");
                if (n) {
                    Q.sb2Id    = n.id;
                    Q.sb2Node  = n;
                    Q._sb2Live = false;
                    Q._sb2IdxKnown = false;
                    seedSb2Idx(n.id);
                }
            }

            const manualId = this.node.properties?.mmpPrompterId;
            const resolved = resolvePrompter(graph, this.node, manualId);
            const selectedId = resolved.node?.id ?? null;
            if (selectedId !== Q.prompterId || resolved.reason !== Q.selectionReason) {
                Q.selectionEpoch++;
                Q.autoEpoch++;
                if (Q.autoFire) stopAuto("Stopped: prompter selection changed");
                if (Q.aimLive) {
                    Q.aimLive = false; aimBtn.classList.remove("on");
                    a11y(aimBtn, "Aim: fill remaining queue"); setTarget(0);
                }
            }
            Q.prompterId = selectedId;
            Q.selectionReason = resolved.reason;
            const options = [{ value: "", label: "Automatic — detect NL Meta Prompter" },
                ...resolved.candidates.map(n => ({ value: String(n.id), label: `${n.title || n.type} (#${n.id})` }))];
            if (resolved.reason === "missing") options.push({ value: String(manualId), label: `Missing node (#${manualId})` });
            const signature = JSON.stringify(options);
            if (signature !== Q.selectSignature) {
                prompterSelect.innerHTML = "";
                options.forEach(item => {
                    const option = el("option"); option.value = item.value; option.textContent = item.label;
                    prompterSelect.appendChild(option);
                });
                Q.selectSignature = signature;
            }
            prompterSelect.value = manualId == null ? "" : String(manualId);
            if (!resolved.node) selectionStatus.textContent = {
                missing: `Selected node #${manualId} is missing or unsupported`,
                ambiguous: "Multiple matching prompters — choose one",
                disconnected: "No connected prompter — choose one",
                none: "No supported prompter in this graph",
            }[resolved.reason];
            refreshDisplay();
        };
        prompterSelect.addEventListener("change", () => {
            this.node.properties = this.node.properties || {};
            if (prompterSelect.value === "") delete this.node.properties.mmpPrompterId;
            else this.node.properties.mmpPrompterId = prompterSelect.value;
            this._notifyGraphChanged();
            findNodes();
        });
        const changeEnd = value => {
            this.node.properties = this.node.properties || {};
            if (value == null) delete this.node.properties.mmpEndIndex;
            else this.node.properties.mmpEndIndex = value;
            Q.selectionEpoch++;
            if (Q.autoFire) stopAuto("Paused: end index changed");
            this._notifyGraphChanged();
            findNodes();
            if (Q.aimLive) recalcAim();
        };
        followTotal.addEventListener("change", () => {
            changeEnd(followTotal.checked ? null : Math.max(1, Q.total || 1));
        });
        endInput.addEventListener("change", () => {
            const value = Number(endInput.value);
            if (Number.isSafeInteger(value) && value >= 1) changeEnd(value);
            else endInput.value = String(Q.endIndex || 1);
        });
        findNodes();

        const poll = setInterval(findNodes, 500);
        body._qcCleanup = () => clearInterval(poll);

        const onSb2Exec = ({ detail }) => {
            if (!Q.sb2Id || detail.state_id !== this._pw("state_id")?.value) return;
            if (detail.next != null) {
                Q.sb2Idx = detail.reset_trigger != null && detail.reset_trigger !== Number(this._pw("reset_trigger")?.value ?? 0)
                    ? Number(this._pw("current_index")?.value ?? 1) : detail.next;
                Q._sb2IdxKnown = true;
            }
            Q._sb2Live = true;
            if (Q.activePromptId) Q.completedCounter.set(Q.activePromptId, { next: detail.next, frozen: !!detail.freeze });
            refreshDisplay();
            if (Q.autoFire) setAutoStatus("Waiting for workflow completion");
        };
        api.addEventListener("magik_mega_panel_executed", onSb2Exec);
        body._qcCleanup2 = () => api.removeEventListener("magik_mega_panel_executed", onSb2Exec);

        decBtn.addEventListener("click", e => { e.stopPropagation(); setAimLive(false); setTarget(Q.targetVal - 1); });
        incBtn.addEventListener("click", e => { e.stopPropagation(); setAimLive(false); setTarget(Q.targetVal + 1); });

        // Hit button: click to fire, drag horizontally to adjust target
        let hitDrag = null;
        hitBtn.addEventListener("mousedown", e => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            hitDrag = { startX: e.clientX, startVal: Q.targetVal, dragged: false };
            document.addEventListener("mousemove", onHitDrag);
            document.addEventListener("mouseup", onHitRelease);
        });

        const onHitDrag = e => {
            if (!hitDrag) return;
            const dx = e.clientX - hitDrag.startX;
            if (Math.abs(dx) > 3) hitDrag.dragged = true;
            const delta = Math.round(dx / 10);
            const newVal = Math.max(1, Math.min(1000, hitDrag.startVal + delta));
            if (newVal !== Q.targetVal) { setAimLive(false); setTarget(newVal); }
        };

        this._cleanups?.push(() => {
            hitDrag = null;
            document.removeEventListener("mousemove", onHitDrag);
            document.removeEventListener("mouseup", onHitRelease);
        });

        const onHitRelease = () => {
            if (!hitDrag) return;
            if (!hitDrag.dragged) {
                // Click (no drag) → fire
                hitBtn.classList.remove("firing");
                void hitBtn.offsetWidth;
                hitBtn.classList.add("firing");
                setTimeout(() => hitBtn.classList.remove("firing"), 600);
                if (Q.targetVal > 0) app.queuePrompt(0, Q.targetVal);
            }
            hitDrag = null;
            document.removeEventListener("mousemove", onHitDrag);
            document.removeEventListener("mouseup", onHitRelease);
        };

        stopBtn.addEventListener("click", async e => {
            e.stopPropagation();
            stopAuto();
            try {
                await api.interrupt();
                const t = stopBtn.textContent; stopBtn.textContent = "⏸️ ok";
                setTimeout(() => { stopBtn.textContent = t; }, 1200);
            } catch(err) { console.error("QC stop:", err); }
        });

        clrBtn.addEventListener("click", async e => {
            e.stopPropagation();
            stopAuto();
            try {
                await api.clearItems("queue");
                const t = clrBtn.textContent; clrBtn.textContent = "✓";
                setTimeout(() => { clrBtn.textContent = t; }, 1200);
            } catch(err) { console.error("QC clear:", err); }
        });

        resetBtn.addEventListener("click", e => { e.stopPropagation(); setAimLive(false); setTarget(1); });

        autoBtn.addEventListener("click", async e => {
            e.stopPropagation();
            if (Q.autoFire) { stopAuto("Paused by user"); return; }
            if (Q.queueBusy || Q.disposed) return;
            findNodes();
            if (Q.prompterId == null || Q.total <= 0) { stopAuto("Stopped: no valid total"); return; }
            if (this._pw("freeze")?.value) { stopAuto("Stopped: counter is frozen"); return; }
            Q.autoFire = true; Q.autoEpoch++;
            const epoch = Q.autoEpoch;
            Q.queueBusy = true;
            autoBtn.textContent = "⏸ Pause Auto"; autoBtn.classList.add("on");
            a11y(autoBtn, "Pause automatic queuing");
            setAutoStatus("Starting");
            try {
                if (!Q._sb2IdxKnown) {
                    const response = await api.fetchApi(`/magik_mega_panel/state/${encodeURIComponent(this._pw("state_id")?.value || "")}`);
                    const state = await response.json();
                    if (state.error) throw new Error(state.error);
                    if (state.found && !Q._sb2Live) {
                        Q.sb2Idx = state.last_reset === Number(this._pw("reset_trigger")?.value ?? 0)
                            ? state.index : Number(this._pw("current_index")?.value ?? 1);
                        Q._sb2IdxKnown = true;
                    }
                }
                const response = await api.fetchApi("/queue");
                const data = await response.json();
                if (!Q.autoFire || Q.disposed || epoch !== Q.autoEpoch || this.node.graph !== app.canvas?.graph) return;
                if ([...(data.queue_pending || []), ...(data.queue_running || [])].some(ownsPrompt)) {
                    setAutoStatus("Waiting for existing work"); return;
                }
                if (remainingPrompts(nextIndex(), Q.endIndex) === 0) { stopAuto("Finished"); return; }
                await app.queuePrompt(0, 1);
                if (Q.autoFire && epoch === Q.autoEpoch && !Q.activePromptId) setAutoStatus("Queued — waiting for execution");
            } catch (err) {
                stopAuto(`Stopped: ${err.message || "could not queue prompt"}`);
                console.error("QC start auto:", err);
            } finally {
                Q.queueBusy = false;
                if (Q.pendingSuccess) {
                    const pending = Q.pendingSuccess; Q.pendingSuccess = null;
                    Promise.resolve().then(() => onSuccess({ detail: pending }));
                }
            }
        });

        const ownsPrompt = item => Object.values(item?.[2] || {}).some(n =>
            n.class_type === "MagikMegaPanel" && n.inputs?.state_id === this._pw("state_id")?.value);

        const nextIndex = () => Q._sb2IdxKnown ? Q.sb2Idx
            : Number(this._pw("current_index")?.value ?? 1);

        const recalcAim = async () => {
            findNodes();
            if (Q.prompterId == null || Q.total <= 0) { setTarget(0); return; }
            const identity = this._pw("state_id")?.value;
            const selectionEpoch = Q.selectionEpoch;
            try {
                const res = await api.fetchApi("/queue");
                const data = await res.json();
                if (Q.disposed || selectionEpoch !== Q.selectionEpoch || identity !== this._pw("state_id")?.value) return;
                const pending = (data.queue_pending || []).filter(ownsPrompt).length;
                // Running prompts whose counter event we observed are already
                // represented in nextIndex. Do not subtract them again.
                const beforeCounter = (data.queue_running || []).filter(item =>
                    ownsPrompt(item) && item[1] === Q.activePromptId
                    && !Q.completedCounter.has(item[1])).length;
                setTarget(remainingPrompts(nextIndex(), Q.endIndex, pending + beforeCounter));
            } catch(err) { console.error("QC aim:", err); }
        };

        const setAimLive = (on) => {
            Q.aimLive = on;
            aimBtn.classList.toggle("on", on);
            a11y(aimBtn, on ? "Aim: live — tracking remaining queue" : "Aim: fill remaining queue");
        };

        aimBtn.addEventListener("click", async e => {
            e.stopPropagation();
            if (Q.aimLive) { setAimLive(false); return; } // click again to stop tracking
            setAimLive(true);
            await recalcAim();
        });

        // Separate, slower cadence than the 500ms node-discovery poll — no
        // need to hit /queue twice a second just to keep this fresh.
        const aimPoll = setInterval(() => { if (Q.aimLive) recalcAim(); }, 2000);
        body._qcCleanup4 = () => clearInterval(aimPoll);

        function setAutoStatus(message) { autoStatus.textContent = `Auto: ${message}`; }
        function stopAuto(reason = "Stopped by user") {
            Q.autoFire = false;
            Q.autoEpoch++;
            autoBtn.classList.remove("on");
            autoBtn.textContent = "▶ Start Auto";
            a11y(autoBtn, "Start automatic queuing");
            setAutoStatus(reason);
        }
        const onStart = ({ detail }) => { Q.activePromptId = detail.prompt_id; if (Q.autoFire) setAutoStatus("Generating"); };
        const onSuccess = async ({ detail }) => {
            if (Q.queueBusy && Q.completedCounter.has(detail.prompt_id)) { Q.pendingSuccess = detail; return; }
            const result = Q.completedCounter.get(detail.prompt_id);
            Q.completedCounter.delete(detail.prompt_id);
            if (Q.activePromptId === detail.prompt_id) Q.activePromptId = null;
            if (!result || !Q.autoFire || Q.disposed || Q.queueBusy) return;
            if (result.frozen || this.node.graph !== app.canvas?.graph) { stopAuto(result.frozen ? "Stopped: counter is frozen" : "Stopped: workflow changed"); return; }
            const epoch = Q.autoEpoch;
            const identity = this._pw("state_id")?.value;
            Q.queueBusy = true;
            try {
                findNodes();
                if (Q.total <= 0 || remainingPrompts(nextIndex(), Q.endIndex) === 0) {
                    stopAuto(Q.total <= 0 ? "Stopped: no valid total" : "Finished");
                    return;
                }
                const res = await api.fetchApi("/queue");
                const data = await res.json();
                if (!Q.autoFire || Q.disposed || this.node.graph !== app.canvas?.graph || epoch !== Q.autoEpoch
                    || identity !== this._pw("state_id")?.value) return;
                // Existing work will produce the next completion event.
                if ([...(data.queue_pending || []), ...(data.queue_running || [])]
                    .some(item => item[1] !== detail.prompt_id && ownsPrompt(item))) { setAutoStatus("Waiting for existing work"); return; }
                if (remainingPrompts(nextIndex(), Q.endIndex) > 0) {
                    setAutoStatus("Queuing next prompt");
                    await app.queuePrompt(0, 1);
                }
            } catch(err) {
                stopAuto();
                console.error("QC auto-fire:", err);
            } finally {
                Q.queueBusy = false;
                if (Q.pendingSuccess) {
                    const pending = Q.pendingSuccess; Q.pendingSuccess = null;
                    Promise.resolve().then(() => onSuccess({ detail: pending }));
                }
            }
        };
        const onFailure = ({ detail }) => {
            const tracked = Q.completedCounter.has(detail.prompt_id);
            Q.completedCounter.delete(detail.prompt_id);
            if (Q.activePromptId === detail.prompt_id) Q.activePromptId = null;
            if (tracked) stopAuto(detail.exception_message ? `Stopped: ${detail.exception_message}` : "Stopped: execution failed or interrupted"); // Never retry a failed or interrupted prompt.
        };
        api.addEventListener("execution_start", onStart);
        api.addEventListener("execution_success", onSuccess);
        api.addEventListener("execution_error", onFailure);
        api.addEventListener("execution_interrupted", onFailure);
        body._qcCleanup5 = () => {
            Q.disposed = true;
            stopAuto();
            Q.completedCounter.clear();
            api.removeEventListener("execution_start", onStart);
            api.removeEventListener("execution_success", onSuccess);
            api.removeEventListener("execution_error", onFailure);
            api.removeEventListener("execution_interrupted", onFailure);
        };

        restartBtn.addEventListener("click", async e => {
            e.stopPropagation();
            const orig = restartBtn.textContent;
            const origTitle = restartBtn.title;
            restartBtn.textContent = "⏳"; restartBtn.disabled = true;

            let triggered = false;
            for (const ep of ["/manager/reboot", "/customnode/reboot"]) {
                try {
                    const r = await fetch(ep, { method: "POST" });
                    if (r.ok) { triggered = true; break; }
                } catch(_) {}
            }

            if (!triggered) {
                restartBtn.textContent = "❌";
                a11y(restartBtn, "Restart failed — no reboot endpoint responded (is ComfyUI-Manager installed?)");
                setTimeout(() => {
                    restartBtn.textContent = orig; a11y(restartBtn, origTitle); restartBtn.disabled = false;
                }, 3000);
                return;
            }

            restartBtn.textContent = "🔄";

            let sawDown = false, attempts = 0;
            const maxAttempts = 120;
            const poll2 = setInterval(async () => {
                attempts++;
                try {
                    const r = await fetch("/system_stats");
                    if (r.ok) {
                        if (sawDown) { clearInterval(poll2); window.location.reload(); }
                    } else {
                        sawDown = true;
                    }
                } catch(_) {
                    sawDown = true;
                }
                if (attempts >= maxAttempts) {
                    clearInterval(poll2);
                    restartBtn.textContent = "❌";
                    a11y(restartBtn, "Restart did not complete — check the server manually");
                    restartBtn.disabled = false;
                }
            }, 1000);
            body._qcCleanup3 = () => clearInterval(poll2);
        });

        body.addEventListener("mousedown", e => e.stopPropagation());
        body.addEventListener("contextmenu", e => e.stopPropagation());

        // Expose queue state & refresh so _doSetNext can sync immediately
        this._qcState = Q;
        this._qcRefresh = refreshDisplay;
    }

    _toLocal(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const localW = this.canvas.clientWidth  || rect.width  || 1;
        const localH = this.canvas.clientHeight || rect.height || 1;
        const sx = rect.width  / localW;
        const sy = rect.height / localH;
        return {
            x: (clientX - rect.left) / sx,
            y: (clientY - rect.top)  / sy,
        };
    }

    _startDrag(e, id) {
        this._captureUndo();
        const Wm = this._W[id];
        const p  = this._toLocal(e.clientX, e.clientY);
        const wx = Wm.el.offsetLeft, wy = Wm.el.offsetTop;
        const ew = Wm.el.offsetWidth || 1, eh = Wm.el.offsetHeight || 1;
        this._drag = {
            id,
            fracX: (p.x - wx) / ew,
            fracY: (p.y - wy) / eh,
        };
        this._focus(id);
    }

    _startResize(e, id) {
        this._captureUndo();
        const Wm = this._W[id];
        const p = this._toLocal(e.clientX, e.clientY);
        this._resize = { id, startLocalX: p.x, startLocalY: p.y, sw: Wm.el.offsetWidth, sh: Wm.el.offsetHeight };
        this._focus(id);
    }

    _onDocMouseMove(e) {
        const cw = this.canvas.offsetWidth  || 1;
        const ch = this.canvas.offsetHeight || 1;
        const p  = this._toLocal(e.clientX, e.clientY);

        if (this._drag) {
            const { id, fracX, fracY } = this._drag;
            const Wm = this._W[id];
            const ew = Wm.el.offsetWidth, eh = Wm.el.offsetHeight;
            let nx = p.x - fracX * ew;
            let ny = p.y - fracY * eh;
            if (this.snapOn) { nx = snapV(nx); ny = snapV(ny); }
            nx = Math.max(0, Math.min(cw - ew, nx));
            ny = Math.max(0, Math.min(ch - eh, ny));
            Wm.el.style.left = nx + "px"; Wm.el.style.top = ny + "px";
            this.layout[id].x = nx;   this.layout[id].y = ny;
        }

        if (this._resize) {
            const { id, startLocalX, startLocalY, sw, sh } = this._resize;
            const Wm = this._W[id];
            const ox = Wm.el.offsetLeft, oy = Wm.el.offsetTop;
            let nw = sw + (p.x - startLocalX);
            let nh = sh + (p.y - startLocalY);
            if (this.snapOn) { nw = snapV(nw); nh = snapV(nh); }
            nw = Math.max(MIN_W_WGT, Math.min(cw - ox, nw));
            nh = Math.max(MIN_H_WGT, Math.min(ch - oy, nh));
            Wm.el.style.width = nw + "px"; Wm.el.style.height = nh + "px";
            this.layout[id].w = nw;   this.layout[id].h = nh;
            this._scaleContent();
        }
    }

    _onDocMouseUp() {
        if (this._drag || this._resize) { this._drag = null; this._resize = null; this._saveLayout(); }
    }

    _bindDocMouse() {
        this._docMouseMove = e => this._onDocMouseMove(e);
        this._docMouseUp   = () => this._onDocMouseUp();
        document.addEventListener("mousemove", this._docMouseMove);
        document.addEventListener("mouseup",   this._docMouseUp);
    }

    _unbindDocMouse() {
        if (this._docMouseMove) document.removeEventListener("mousemove", this._docMouseMove);
        if (this._docMouseUp)   document.removeEventListener("mouseup",   this._docMouseUp);
        this._docMouseMove = this._docMouseUp = null;
    }

    _focus(id) {
        WIDGET_DEFS.forEach(i => this._W[i]?.el.classList.remove("focused"));
        this._W[id]?.el.classList.add("focused");
    }

    _bringFront(id) {
        this._zTop++;
        this.layout[id].z = this._zTop;
        this._W[id].el.style.zIndex = this._zTop;
        this._saveLayout();
    }

    _sendBack(id) {
        const minZ = Math.min(...WIDGET_DEFS.map(i => this.layout[i]?.z || 10));
        const newZ = Math.max(1, minZ - 1);
        this.layout[id].z = newZ;
        this._W[id].el.style.zIndex = newZ;
        this._saveLayout();
    }

    _startRename(id, titleEl) {
        const cur = this.layout[id]?.label || id.replace(/_/g," ");
        const inp = el("input", "mmp-wtitle-input");
        inp.value = cur; inp.maxLength = 28;
        titleEl.replaceWith(inp);
        inp.focus(); inp.select();

        const commit = () => {
            const v = inp.value.trim() || cur;
            if (this.layout[id]) this.layout[id].label = v;
            inp.replaceWith(titleEl);
            titleEl.textContent = v;
            this._syncTray();
            this._saveLayout();
        };
        inp.addEventListener("keydown", e => { if (e.key==="Enter") { e.preventDefault(); commit(); } if (e.key==="Escape") { inp.replaceWith(titleEl); } });
        inp.addEventListener("blur", () => setTimeout(()=>{ if(inp.isConnected) commit(); }, 100));
    }

    _minimize(id) { if (this.layout[id]) { this._captureUndo(); this.layout[id].minimized = true;  this._applyLayout(); this._saveLayout(); } }
    _restore(id)  { if (this.layout[id]) { this._captureUndo(); this.layout[id].minimized = false; this._applyLayout(); this._saveLayout(); } }

    _showCanvasCtx(e) {
        this._closeCtx();
        const menu = el("div", "mmp-ctx");
        const cr   = this.canvas.getBoundingClientRect();
        menu.style.left = (e.clientX - cr.left) + "px";
        menu.style.top  = (e.clientY - cr.top)  + "px";

        const items = [
            { icon: I.reset,  label: "Reset layout",        fn: () => this._doReset() },
            { icon: I.undo,   label: "Undo last layout change", fn: () => this._doUndo(), disabled: !this._undoSnapshot },
            { icon: I.copy,   label: "Copy to all panels",  fn: () => this._doCopyLayout() },
            null,
            { icon: I.save,   label: "Save layout...",      fn: () => this._promptSaveLayout() },
            { icon: I.folder, label: "Load layout...",      fn: () => this._toggleLoadLayout() },
            null,
            { icon: this.locked ? I.unlock : I.lock, label: this.locked ? "Unlock widgets" : "Lock widgets", fn: () => this._doLock() },
            { icon: I.snap,   label: `Snap: ${this.snapOn ? "on" : "off"}`, fn: () => this._doSnap() },
            { icon: I.tb,     label: `Auto-hide toolbar: ${this.autoHide ? "on" : "off"}`, fn: () => this._doAutoHide() },
            null,
            { icon: I.cog,    label: "Widget colours",      fn: () => this._toggleSettings() },
        ];
        this._populateCtx(menu, items);
        this.canvas.appendChild(menu);
        this._activeCtx = menu;
        setTimeout(() => document.addEventListener("mousedown", this._ctxClose, { once: true }), 0);
    }

    _showWidgetCtx(e, id) {
        this._closeCtx();
        const menu = el("div", "mmp-ctx");
        const cr   = this.canvas.getBoundingClientRect();
        menu.style.left = (e.clientX - cr.left) + "px";
        menu.style.top  = (e.clientY - cr.top)  + "px";

        const lbl = el("div", "mmp-ctx-label"); lbl.textContent = this.layout[id]?.label || id.replace(/_/g," ");
        menu.appendChild(lbl);

        const items = [
            { icon: I.front,    label: "Bring to front",   fn: () => this._bringFront(id) },
            { icon: I.back,     label: "Send to back",     fn: () => this._sendBack(id) },
            null,
            { icon: I.edit,     label: "Rename",           fn: () => this._startRename(id, this._W[id].title) },
            { icon: I.minimize, label: "Minimize",         fn: () => this._minimize(id) },
        ];
        this._populateCtx(menu, items);
        this.canvas.appendChild(menu);
        this._activeCtx = menu;
        setTimeout(() => document.addEventListener("mousedown", this._ctxClose, { once: true }), 0);
    }

    _populateCtx(menu, items) {
        items.forEach(item => {
            if (!item) { menu.appendChild(el("div","mmp-ctx-sep")); return; }
            const row = el("div","mmp-ctx-item");
            if (item.disabled) row.classList.add("disabled");
            const iconWrap = el("span"); iconWrap.innerHTML = item.icon; iconWrap.style.cssText = "display:flex;align-items:center;flex-shrink:0;";
            const txt = el("span"); txt.textContent = item.label;
            row.appendChild(iconWrap); row.appendChild(txt);
            if (!item.disabled) row.addEventListener("click", () => { this._closeCtx(); item.fn(); });
            menu.appendChild(row);
        });
    }

    _closeCtx() {
        this._activeCtx?.remove(); this._activeCtx = null;
        document.removeEventListener("mousedown", this._ctxClose);
    }

    // Default colors shown in the bg/font swatches when no override is set.
    // These are just sensible starting points for the picker — the actual
    // rendered default varies slightly per element (see the CSS var()
    // fallbacks), since e.g. the bar and body normally differ slightly and
    // different text elements have different original colors. Resetting
    // always correctly clears the override regardless of what the swatch
    // was last showing.
    static DEFAULT_BG = "#222226";
    static DEFAULT_FG = "#c4c4c4";

    _mkSwatch(cap, value, onInput, onReset) {
        const wrap = el("div", "mmp-swatch-item");
        const inp = document.createElement("input");
        inp.type = "color"; inp.className = "mmp-swatch"; inp.value = value;
        a11y(inp, `${cap} color`);
        inp.addEventListener("input", () => onInput(inp.value));
        const capEl = el("span", "mmp-swatch-cap"); capEl.textContent = cap;
        wrap.appendChild(inp); wrap.appendChild(capEl);
        if (onReset) {
            const rst = a11y(el("button", "mmp-swatch-reset"), `Reset ${cap} to default`);
            rst.textContent = "×";
            rst.addEventListener("click", () => onReset(inp));
            wrap.appendChild(rst);
        }
        return wrap;
    }

    _toggleSettings() {
        if (this._settingsEl) { this._settingsEl.remove(); this._settingsEl = null; return; }
        const s = el("div", "mmp-settings");
        const t = el("div", "mmp-settings-title"); t.textContent = "Widget colours"; s.appendChild(t);

        WIDGET_DEFS.forEach(id => {
            const grp = el("div", "mmp-srow-group");
            const lbl = el("div", "mmp-srow-lbl"); lbl.textContent = this.layout[id]?.label || id.replace(/_/g," ");
            const row = el("div", "mmp-srow-swatches");

            row.appendChild(this._mkSwatch(
                "accent",
                this.layout[id]?.accent || ACCENT_DEFAULTS[id],
                v => {
                    if (this.layout[id]) this.layout[id].accent = v;
                    const Wm = this._W[id]; if (Wm) { Wm.el.style.setProperty("--acc", v); Wm.acc.style.background = v; }
                    this._syncTray(); this._saveLayout();
                },
                inp => {
                    if (this.layout[id]) delete this.layout[id].accent;
                    inp.value = ACCENT_DEFAULTS[id];
                    const Wm = this._W[id]; if (Wm) { Wm.el.style.setProperty("--acc", ACCENT_DEFAULTS[id]); Wm.acc.style.background = ACCENT_DEFAULTS[id]; }
                    this._syncTray(); this._saveLayout();
                }
            ));

            row.appendChild(this._mkSwatch(
                "bg",
                this.layout[id]?.bgColor || MegaPanelUI.DEFAULT_BG,
                v => {
                    if (this.layout[id]) this.layout[id].bgColor = v;
                    const Wm = this._W[id]; if (Wm) Wm.el.style.setProperty("--wbg", v);
                    this._saveLayout();
                },
                inp => {
                    if (this.layout[id]) delete this.layout[id].bgColor;
                    inp.value = MegaPanelUI.DEFAULT_BG;
                    const Wm = this._W[id]; if (Wm) Wm.el.style.removeProperty("--wbg");
                    this._saveLayout();
                }
            ));

            row.appendChild(this._mkSwatch(
                "font",
                this.layout[id]?.fontColor || MegaPanelUI.DEFAULT_FG,
                v => {
                    if (this.layout[id]) this.layout[id].fontColor = v;
                    const Wm = this._W[id]; if (Wm) Wm.el.style.setProperty("--wfg", v);
                    this._saveLayout();
                },
                inp => {
                    if (this.layout[id]) delete this.layout[id].fontColor;
                    inp.value = MegaPanelUI.DEFAULT_FG;
                    const Wm = this._W[id]; if (Wm) Wm.el.style.removeProperty("--wfg");
                    this._saveLayout();
                }
            ));

            grp.appendChild(lbl); grp.appendChild(row); s.appendChild(grp);
        });

        const close = el("div","mmp-settings-close"); close.textContent = "close";
        close.addEventListener("click", () => { s.remove(); this._settingsEl = null; });
        s.appendChild(close);
        this.panel.appendChild(s);
        this._settingsEl = s;
    }

    _openKnobSettings() {
        if (this._knobSettingsEl) { this._knobClose?.(); return; }
        const ka = this._W._knobApply; if (!ka) return;
        const { applyTheme, applyShape, applyColor, applyValue, props } = ka;
        const p = props();
        const w = this._pw("knobValue");
        const original = { theme: p.knobTheme, color: p.knobColor };

        const modal = el("div");
        modal.style.cssText = "position:absolute;top:30px;right:5px;background:#111114;border:1px solid #252529;border-radius:6px;padding:14px 16px;z-index:400;min-width:240px;max-width:290px;font-family:monospace;";

        const title = el("div"); title.style.cssText = "font-size:9px;color:#333;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;"; title.textContent = "Knob Settings";
        modal.appendChild(title);

        const row = (lbl, inp) => {
            const r = el("div"); r.className = "mmp-modal-row";
            const l = el("label"); l.textContent = lbl;
            r.appendChild(l); r.appendChild(inp); return r;
        };

        const titleIn = Object.assign(document.createElement("input"), { type:"text",   value: p.knobTitle  || "" });
        const minIn   = Object.assign(document.createElement("input"), { type:"number", value: p.knobMin ?? (w?.options?.min ?? 1) });
        const maxIn   = Object.assign(document.createElement("input"), { type:"number", value: p.knobMax ?? (w?.options?.max ?? 999999) });
        const stepIn  = Object.assign(document.createElement("input"), { type:"number", value: p.knobStepper || 1, min:"1" });
        const colorIn = Object.assign(document.createElement("input"), { type:"color",  value: p.knobColor  || "#1D9E75" });
        const shapeIn = document.createElement("select");
        ["knob","vertical_slider","horizontal_slider"].forEach(s => {
            const o = document.createElement("option"); o.value=s; o.textContent=s.replace(/_/g," "); shapeIn.appendChild(o);
        });
        shapeIn.value = p.knobShape || "knob";

        const themeRow = el("div"); themeRow.className = "mmp-modal-row";
        const tLbl = el("label"); tLbl.textContent = "Theme:"; themeRow.appendChild(tLbl);
        const grid  = el("div"); grid.className = "mmp-theme-grid";
        let tempTheme = p.knobTheme || "dark";
        const icons = THEMES.map(t => {
            const ic = el("div", "mmp-theme-icon"); ic.dataset.theme=t; ic.title=t;
            ic.style.background = `radial-gradient(circle at 30% 30%,${THEME_DEFAULTS[t]?.color||"#888"},#333)`;
            grid.appendChild(ic); return ic;
        });
        themeRow.appendChild(grid); modal.appendChild(themeRow);
        const markTheme = (t) => icons.forEach(i => i.classList.toggle("selected", i.dataset.theme===t));
        markTheme(tempTheme);
        const preview = (theme, color) => { applyTheme(theme, false); applyColor(color, false); };
        icons.forEach(ic => {
            ic.addEventListener("click",      () => { tempTheme=ic.dataset.theme; colorIn.value=THEME_DEFAULTS[tempTheme].color; preview(tempTheme, colorIn.value); markTheme(tempTheme); });
            ic.addEventListener("mouseenter", () => preview(ic.dataset.theme, THEME_DEFAULTS[ic.dataset.theme].color));
            ic.addEventListener("mouseleave", () => preview(tempTheme, colorIn.value));
        });

        [row("Title:", titleIn), row("Min:", minIn), row("Max:", maxIn), row("Step:", stepIn), row("Color:", colorIn), row("Shape:", shapeIn)]
            .forEach(r => modal.appendChild(r));

        colorIn.addEventListener("input", () => applyColor(colorIn.value, false));

        const btns = el("div"); btns.className = "mmp-modal-buttons";
        const cancel = Object.assign(el("button","mmp-modal-btn"), { textContent: "Cancel" });
        const save   = Object.assign(el("button","mmp-modal-btn save"), { textContent: "Save" });
        const close = (commit = false) => {
            document.removeEventListener("mousedown", outside);
            if (!commit) preview(original.theme, original.color);
            modal.remove();
            this._knobSettingsEl = null;
            this._knobClose = null;
        };
        const outside = e => { if (!modal.contains(e.target)) close(); };
        this._knobClose = close;
        cancel.addEventListener("click", () => close());
        modal.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); close(); } });
        save.addEventListener("click", () => {
            const bounds = knobBounds(minIn.value, maxIn.value, stepIn.value);
            const { min: newMin, max: newMax, step } = bounds;

            p.knobTitle   = titleIn.value;
            p.knobStepper = step;
            p.knobShape   = shapeIn.value;
            p.knobTheme   = tempTheme;
            p.knobColor   = colorIn.value;
            p.knobMin     = newMin;
            p.knobMax     = newMax;

            if (w) {
                w.options = w.options || {};
                w.options.min = newMin;
                w.options.max = newMax;
                const clamped = knobValue(w.value, bounds);
                if (clamped !== w.value) { w.value = clamped; w.callback?.(clamped); }
            }

            if (this._W._knobMinus) this._W._knobMinus.textContent = `-${step}`;
            if (this._W._knobPlus)  this._W._knobPlus.textContent  = `+${step}`;
            applyShape(shapeIn.value); applyTheme(tempTheme, false); applyColor(colorIn.value);
            this._updateKnob();
            ka.layout?.();
            this._notifyGraphChanged();
            close(true);
        });
        btns.appendChild(cancel); btns.appendChild(save); modal.appendChild(btns);

        this.panel.appendChild(modal);
        this._knobSettingsEl = modal;
        setTimeout(() => {
            if (this._knobSettingsEl === modal && !this._disposed) document.addEventListener("mousedown", outside);
        }, 0);
    }

    _doReset() {
        this._captureUndo();
        const cw = this.canvas.offsetWidth || 300, ch = this.canvas.offsetHeight || 200;
        const prev = {}; WIDGET_DEFS.forEach(id => { prev[id] = { accent: this.layout[id]?.accent, label: this.layout[id]?.label }; });
        this.layout = defaultLayout(cw, ch);
        WIDGET_DEFS.forEach(id => { if (prev[id].accent) this.layout[id].accent = prev[id].accent; if (prev[id].label) this.layout[id].label = prev[id].label; });
        this._applyLayout(); this._saveLayout();
    }

    // ── Undo ──────────────────────────────────────────────────────────────────
    //
    // Single-level: each capture overwrites the previous one, and undoing
    // consumes it (no redo stack). Scoped to the layout-mutating actions most
    // likely to be regretted — drag, resize, minimize/restore, and Reset
    // layout — not every minor action (rename, z-order, applying a saved
    // preset) for simplicity.

    _captureUndo() {
        try { this._undoSnapshot = JSON.parse(JSON.stringify(this.layout)); }
        catch(_) { this._undoSnapshot = null; }
        this._updateUndoBtn();
    }

    _doUndo() {
        if (!this._undoSnapshot) return;
        this.layout = this._undoSnapshot;
        this._undoSnapshot = null; // consumed — single level
        this._applyLayout();
        this._saveLayout();
        this._updateUndoBtn();
    }

    _updateUndoBtn() {
        if (!this.bUndo) return;
        const has = !!this._undoSnapshot;
        this.bUndo.disabled = !has;
        this.bUndo.classList.toggle("disabled", !has);
    }

    _doLock() {
        this.locked = !this.locked;
        this.bLock.innerHTML = (this.locked ? I.lock : I.unlock) + `<span class="mmp-tip">${this.locked ? "Unlock widgets" : "Lock widgets"}</span>`;
        this.bLock.classList.toggle("on", this.locked);
        if (this.locked) {
            if (!this._lockBadge) {
                this._lockBadge = el("div","mmp-lock-badge"); this._lockBadge.textContent="locked";
                this._lockBadge.style.top = (TOOLBAR_H + 4) + "px";
                this.panel.appendChild(this._lockBadge);
            }
        } else { this._lockBadge?.remove(); this._lockBadge = null; }
    }

    _doSnap() {
        this.snapOn = !this.snapOn;
        this.bSnap.classList.toggle("on", this.snapOn);
        this.snapOverlay.style.opacity = this.snapOn ? "1" : "0";
        const tip = this.bSnap.querySelector(".mmp-tip");
        if (tip) tip.textContent = `Snap 8px: ${this.snapOn ? "on" : "off"}`;
    }

    _doAutoHide() {
        this.autoHide = !this.autoHide;
        this.bAutoHide.classList.toggle("on", this.autoHide);
        if (!this.autoHide) this._showTb(); else this._hideTb();
    }

    _doCopyLayout() {
        app.graph._nodes.forEach(n => {
            if (n.id !== this.node.id && n.type === "MagikMegaPanel" && n._mmpUI) {
                const copy = JSON.parse(JSON.stringify(this.layout));
                n._mmpUI.layout = copy;
                n._mmpUI._applyLayout();
                n._mmpUI._saveLayout();
            }
        });
        this.bCopy.classList.add("on");
        setTimeout(() => this.bCopy.classList.remove("on"), 800);
    }

    _doSetNext() {
        this._stateRevision = (this._stateRevision || 0) + 1;
        const kw = this._pw("knobValue"), rw = this._pw("reset_trigger"), iw = this._pw("current_index");
        if (!kw) return;
        const v = Math.max(0, Math.min(999999, Math.round(kw.value) || 0));
        if (iw) iw.value = v;
        if (rw) rw.value = (rw.value || 0) + 1;
        // current_index and reset_trigger are hidden widgets — their callbacks
        // are stripped, so mark the graph dirty explicitly so ComfyUI picks
        // up the new values on the next queue prompt.
        this.node.graph?.change?.();

        // Restore the original immediate current/next preview.
        this._pendingReset = rw?.value;
        const frozen = !!this._pw("freeze")?.value;
        const padding = Number(this._pw("padding")?.value ?? 3);
        this._state = { ...this._state, current: v, next: frozen ? v : v + 1,
            padded: String(v).padStart(padding, "0"), padding, freeze: frozen };
        this._updateDisplays();

        // Sync queue controller if it tracks this node. Q.sb2Idx means "the
        // next not-yet-produced index" everywhere else it's used (backend
        // state, onSb2Exec, the done-check in refreshDisplay) — nothing has
        // executed yet at this point, so that value is v.
        // The display is a preview; queue progress still starts at v.
        if (this._qcState) {
            this._qcState.sb2Idx = v;
            this._qcState._sb2IdxKnown = true;
            this._qcState._sb2Live = true;
            this._qcRefresh?.();
        }
    }

    _doFreeze(btn) {
        const fw = this._pw("freeze"); if (!fw) return;
        fw.value = !fw.value;
        // fw.callback is undefined for hidden widgets (we set type="hidden"
        // on all native widgets in onNodeCreated to suppress their canvas
        // rendering). Calling it does nothing. Instead, mark the graph dirty
        // so ComfyUI re-reads all widget values on the next queue prompt —
        // this is the correct mechanism for programmatic widget changes on
        // hidden/suppressed widgets.
        fw.callback?.(fw.value);
        this.node.graph?.change?.();
        // Keep _state.freeze in sync immediately so any _updateDisplays call
        // that fires before the server event arrives (e.g. from a resize
        // reflow or a late _fetchInitialState response) reads the correct
        // value and doesn't revert the button label to the pre-click state.
        this._state = { ...this._state, freeze: fw.value };
        btn.textContent = fw.value ? "frozen" : "freeze";
        btn.classList.toggle("frz", fw.value);
        this._syncControlState();
        this._updateDisplays();
    }

    _changePad(d, sval) {
        const pw = this._pw("padding"); if (!pw) return;
        const nv = Math.max(1, Math.min(12, (pw.value || 3) + d));
        pw.value = nv; pw.callback?.(nv);
        this.node.graph?.change?.();
        this._syncControlState();
        this._updateDisplays();
    }

    _syncControlState() {
        const padding = Math.max(1, Math.min(12, Number(this._pw("padding")?.value ?? 3)));
        const freeze = !!this._pw("freeze")?.value;
        const reset = Number(this._pw("reset_trigger")?.value ?? 0);
        const target = Number(this._pw("current_index")?.value ?? 1);
        const pending = this._pendingReset === reset || (this._state.lastReset != null && this._state.lastReset !== reset);
        const current = pending ? target : this._state.current;
        const next = pending ? (freeze ? target : target + 1)
            : this._state.lastReset == null ? target : this._state.next;
        this._state = { ...this._state, current, next, padding, freeze,
            padded: current == null ? "—" : String(current).padStart(padding, "0") };
    }

    _pw(name) { return this.node.widgets?.find(w => w.name === name); }

    _bindServer() {
        this._onExecuted = ({ detail }) => {
            if (detail.state_id !== this._pw("state_id")?.value) return;
            this._stateRevision = (this._stateRevision || 0) + 1;
            if (detail.reset_trigger === Number(this._pw("reset_trigger")?.value ?? 0)) this._pendingReset = undefined;
            this._state = { ...this._state, current: detail.current, next: detail.next, lastReset: detail.reset_trigger };
            this._syncControlState();
            this._updateDisplays();
        };
        api.addEventListener("magik_mega_panel_executed", this._onExecuted);
    }

    _unbindServer() {
        if (this._onExecuted) api.removeEventListener("magik_mega_panel_executed", this._onExecuted);
        this._onExecuted = null;
    }

    async _fetchInitialState() {
        const requestId = this._stateRequest = (this._stateRequest || 0) + 1;
        try {
            const identity = this._pw("state_id")?.value;
            const revision = this._stateRevision || 0;
            const res = await api.fetchApi(`/magik_mega_panel/state/${encodeURIComponent(identity || "")}`);
            const data = await res.json();
            if (this._disposed || requestId !== this._stateRequest
                || identity !== this._pw("state_id")?.value || revision !== (this._stateRevision || 0)) return;
            if (!data?.found) { this._syncControlState(); this._updateDisplays(); return; }
            const next    = data.index;
            const current = data.last_output;
            if (next == null && current == null) return;
            if (data.last_reset === Number(this._pw("reset_trigger")?.value ?? 0)) this._pendingReset = undefined;
            this._state = { ...this._state, current: current ?? this._state.current,
                next: next ?? this._state.next, lastReset: data.last_reset };
            this._syncControlState();
            this._updateDisplays();
        } catch(_) {}
    }

    _updateDisplays() {
        const { current, next, padded, freeze, padding } = this._state;
        if (this._W._piBig) {
            const prev = this._W._piBig.textContent;
            this._W._piBig.textContent = padded;
            if (prev !== padded) {
                this._W._piBig.classList.remove("current-highlight");
                void this._W._piBig.offsetWidth;
                this._W._piBig.classList.add("current-highlight");
            }
            this._scaleContent();
        }
        if (this._W._stL)   this._W._stL.textContent = current ?? "—";
        if (this._W._stR)   this._W._stR.textContent = next;
        if (this._W._fBtn)  { this._W._fBtn.textContent = freeze ? "frozen" : "freeze"; this._W._fBtn.classList.toggle("frz", freeze); }
        if (this._W._sval && padding != null) this._W._sval.textContent = padding;
        this._updateKnob();
    }

    _saveLayout() {
        // Refuse to save if the canvas has not been laid out yet.
        // If we serialised during a zero-canvas moment, every coordinate
        // would be clipped to the 300×200 fallback in _applyLayout, and
        // that corrupted layout would then be faithfully restored on every
        // future load — the exact "shrunk to top-left corner" symptom.
        // The next real user interaction (drag, resize, minimize…) will
        // save correctly once the canvas has real dimensions.
        const cw = this.canvas?.offsetWidth;
        const ch = this.canvas?.offsetHeight;
        if (!cw || !ch) return;
        try {
            if (!this.node.properties) this.node.properties = {};
            this.node.properties.mmpLayout = JSON.parse(JSON.stringify(this.layout));
        } catch(_) {}
        this._notifyGraphChanged();
    }

    _notifyGraphChanged() {
        try {
            app.canvas?.setDirty(true, true);
            app.graph?.change?.();
            app.extensionManager?.workflow?.activeWorkflow?.changeTracker?.captureCanvasState?.();
        } catch(_) {}
    }

    _loadLayout() {
        try {
            const p = this.node.properties?.mmpLayout;
            if (p && typeof p === "object" && Object.keys(p).length) return p;
        } catch(_) {}
        try {
            const r = localStorage.getItem(`mmp_layout_${this.node.id}`);
            return r ? JSON.parse(r) : null;
        } catch(_) { return null; }
    }

    // ── Named layout presets ─────────────────────────────────────────────────
    //
    // Stored on graph.extra (not node.properties) so every MagikMegaPanel node
    // in the workflow shares the same set of saved layouts — saving one from
    // any node's panel makes it available to load from any other. graph.extra
    // is serialised into the workflow JSON the same way node.properties is
    // (confirmed via ChangeTracker.graphEqual, which diffs it explicitly), so
    // this is still fully workflow-portable, just shared instead of per-node.
    //
    // Each preset also records the canvas size (w/h) it was captured at, so
    // _applyPreset() can scale it correctly onto whatever size the node
    // actually is at load time, and the thumbnail can be sketched at the
    // right proportions — without that, a preset saved on a wide node and
    // applied to a narrow one would just render using the wrong coordinate
    // space entirely.

    _graph() {
        return this.node.graph || app.graph || null;
    }

    _getPresets() {
        try {
            this._migrateNodePresets();
            return this._graph()?.extra?.mmpLayoutPresets || {};
        } catch(_) { return {}; }
    }

    // One-time upgrade for presets saved before presets moved from per-node
    // storage to graph-level storage. Merges anything found on this node into
    // the shared graph store (without clobbering a same-named shared preset
    // that already exists) and clears the old per-node copy.
    _migrateNodePresets() {
        try {
            const old = this.node.properties?.mmpLayoutPresets;
            if (!old || !Object.keys(old).length) return;
            const graph = this._graph();
            if (!graph) return;
            if (!graph.extra) graph.extra = {};
            if (!graph.extra.mmpLayoutPresets) graph.extra.mmpLayoutPresets = {};
            const shared = graph.extra.mmpLayoutPresets;
            Object.entries(old).forEach(([name, preset]) => {
                if (!(name in shared)) shared[name] = preset;
            });
            delete this.node.properties.mmpLayoutPresets;
            this._notifyGraphChanged();
        } catch(_) {}
    }

    _savePreset(name) {
        try {
            const graph = this._graph();
            if (!graph) return;
            if (!graph.extra) graph.extra = {};
            if (!graph.extra.mmpLayoutPresets) graph.extra.mmpLayoutPresets = {};
            const cw = this.canvas.offsetWidth || 300, ch = this.canvas.offsetHeight || 200;
            graph.extra.mmpLayoutPresets[name] = {
                layout:  JSON.parse(JSON.stringify(this.layout)),
                w:       cw,
                h:       ch,
                savedAt: Date.now(),
            };
        } catch(_) {}
        this._notifyGraphChanged();
    }

    _deletePreset(name) {
        try { delete this._graph()?.extra?.mmpLayoutPresets?.[name]; } catch(_) {}
        this._notifyGraphChanged();
    }

    _applyPreset(name) {
        const preset = this._getPresets()[name];
        if (!preset || !preset.layout) return;
        const cw = this.canvas.offsetWidth || 300, ch = this.canvas.offsetHeight || 200;
        const sw = preset.w || cw, sh = preset.h || ch;
        const scaleX = cw / sw, scaleY = ch / sh;
        const scaled = {};
        Object.entries(preset.layout).forEach(([id, s]) => {
            scaled[id] = { ...s, x: s.x * scaleX, y: s.y * scaleY, w: s.w * scaleX, h: s.h * scaleY };
        });
        WIDGET_DEFS.forEach(id => { if (!scaled[id]) scaled[id] = defaultLayout(cw, ch)[id]; });
        this.layout = scaled;
        this._applyLayout();
        this._saveLayout();
    }

    // Small proportional sketch of a preset's widget rectangles, colored by
    // each widget's saved accent — lets you tell saved layouts apart at a
    // glance in the load gallery without having to read every name.
    _renderThumbnailSVG(preset) {
        const sw = preset.w || 300, sh = preset.h || 200;
        const VB_W = 140, VB_H = Math.max(40, Math.round(VB_W * sh / sw));
        const rects = WIDGET_DEFS.map(id => {
            const s = preset.layout?.[id];
            if (!s) return "";
            const x = (s.x / sw) * VB_W, y = (s.y / sh) * VB_H;
            const w = Math.max(1.5, (s.w / sw) * VB_W), h = Math.max(1.5, (s.h / sh) * VB_H);
            const fill = s.accent || ACCENT_DEFAULTS[id] || "#666";
            const op = s.minimized ? 0.22 : 0.6;
            return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${fill}" opacity="${op}" stroke="${fill}" stroke-width="0.75"/>`;
        }).join("");
        return `<svg viewBox="0 0 ${VB_W} ${VB_H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`
             + `<rect x="0" y="0" width="${VB_W}" height="${VB_H}" fill="#1a1a1e"/>${rects}</svg>`;
    }

    _promptSaveLayout() {
        this._closeModals();
        const overlay = el("div", "mmp-modal-overlay");
        overlay.style.display = "flex";
        const modal = el("div", "mmp-modal");

        const title = el("div", "mmp-modal-title"); title.textContent = "Save layout"; modal.appendChild(title);

        const row = el("div", "mmp-modal-row");
        const lbl = el("label"); lbl.textContent = "name";
        const inp = Object.assign(document.createElement("input"), {
            type: "text", placeholder: "e.g. Compact, Wide Knob...", maxLength: 32,
        });
        const existing = this._getPresets();
        let n = 1; while (existing[`Layout ${n}`]) n++;
        inp.value = `Layout ${n}`;
        row.appendChild(lbl); row.appendChild(inp); modal.appendChild(row);

        const hint = el("div");
        hint.style.cssText = "font-size:10px;color:#444;margin:-3px 0 4px;";
        modal.appendChild(hint);
        const refreshHint = () => {
            const v = inp.value.trim();
            hint.textContent = v && existing[v] ? "A layout with this name already exists — saving will overwrite it." : "";
            hint.style.color = v && existing[v] ? "#a06a30" : "#444";
        };
        inp.addEventListener("input", refreshHint);
        refreshHint();

        const btns = el("div"); btns.className = "mmp-modal-buttons";
        const cancel = Object.assign(el("button", "mmp-modal-btn"),      { textContent: "Cancel" });
        const save   = Object.assign(el("button", "mmp-modal-btn save"), { textContent: "Save" });
        btns.appendChild(cancel); btns.appendChild(save); modal.appendChild(btns);

        const commit = () => {
            const name = inp.value.trim();
            if (!name) { inp.focus(); return; }
            this._savePreset(name);
            this._closeModals();
        };
        save.addEventListener("click", commit);
        cancel.addEventListener("click", () => this._closeModals());
        inp.addEventListener("keydown", e => {
            if (e.key === "Enter")  { e.preventDefault(); commit(); }
            if (e.key === "Escape") { this._closeModals(); }
        });
        overlay.addEventListener("mousedown", e => { if (e.target === overlay) this._closeModals(); });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this._activeModal = overlay;
        setTimeout(() => { inp.focus(); inp.select(); }, 0);
    }

    _toggleLoadLayout() {
        if (this._activeModal) { this._closeModals(); return; }

        const overlay = el("div", "mmp-modal-overlay");
        overlay.style.display = "flex";
        const modal = el("div", "mmp-modal");
        modal.style.cssText += "max-width:440px;width:90vw;";

        const title = el("div", "mmp-modal-title"); title.textContent = "Load layout"; modal.appendChild(title);

        const presets = this._getPresets();
        const names = Object.keys(presets);

        if (!names.length) {
            const empty = el("div");
            empty.style.cssText = "font-size:11px;color:#555;padding:6px 0 18px;line-height:1.5;";
            empty.textContent = "No saved layouts yet. Right-click the canvas and choose \"Save layout...\" to create one.";
            modal.appendChild(empty);
        } else {
            const grid = el("div", "mmp-preset-grid");
            names
                .sort((a, b) => (presets[b].savedAt || 0) - (presets[a].savedAt || 0))
                .forEach(name => {
                    const preset = presets[name];
                    const card  = el("div", "mmp-preset-card");
                    const thumb = el("div", "mmp-preset-thumb");
                    thumb.innerHTML = this._renderThumbnailSVG(preset);
                    const lbl = el("div", "mmp-preset-name"); lbl.textContent = name;
                    const del = el("button", "mmp-preset-del"); del.innerHTML = I.trash; a11y(del, `Delete "${name}" layout`);

                    card.appendChild(thumb); card.appendChild(lbl); card.appendChild(del);
                    card.addEventListener("click", () => { this._applyPreset(name); this._closeModals(); });
                    del.addEventListener("click", e => {
                        e.stopPropagation();
                        this._deletePreset(name);
                        this._closeModals();
                        this._toggleLoadLayout(); // rebuild fresh with the entry gone
                    });
                    grid.appendChild(card);
                });
            modal.appendChild(grid);
        }

        const btns = el("div"); btns.className = "mmp-modal-buttons";
        const close = Object.assign(el("button", "mmp-modal-btn"), { textContent: "Close" });
        btns.appendChild(close); modal.appendChild(btns);
        close.addEventListener("click", () => this._closeModals());
        overlay.addEventListener("mousedown", e => { if (e.target === overlay) this._closeModals(); });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this._activeModal = overlay;
    }

    _closeModals() {
        this._activeModal?.remove();
        this._activeModal = null;
    }

    _isLegacyFractionalLayout(layout) {
        if (!layout) return false;
        return WIDGET_DEFS.some(id => {
            const s = layout[id];
            return s && (s.w <= 1.0 || s.h <= 1.0);
        });
    }

    _convertLegacyLayout(layout, cw, ch) {
        const out = {};
        WIDGET_DEFS.forEach(id => {
            const s = layout[id];
            if (!s) { out[id] = defaultLayout(cw, ch)[id]; return; }
            out[id] = {
                ...s,
                x: Math.round(s.x * cw),
                y: Math.round(s.y * ch),
                w: Math.round(s.w * cw),
                h: Math.round(s.h * ch),
            };
        });
        return out;
    }

    _restoreLayout() {
        // The canvas has zero dimensions at construction time — LiteGraph
        // hasn't finished sizing the DOM widget host yet. We poll with
        // requestAnimationFrame until the canvas reports real dimensions,
        // then do the actual layout work. This is specifically what prevents
        // the "shrunk to 300×200 corner" bug on load/refresh: a single RAF
        // fires before LiteGraph's onConfigure cycle completes, so the
        // canvas is still zero-sized, and defaultLayout(300,200) generates
        // tiny pixel coordinates that then get persisted as the saved state.
        let attempts = 0;
        const tryRestore = () => {
            if (this._disposed) return;
            const cw = this.canvas.offsetWidth;
            const ch = this.canvas.offsetHeight;
            // If canvas is still zero-sized and we haven't waited too long,
            // defer one more frame and try again.
            if ((!cw || !ch) && attempts++ < 120) {
                requestAnimationFrame(tryRestore);
                return;
            }
            // Proceed with whatever dimensions we have (real or fallback).
            const canvasW = cw || 300, canvasH = ch || 200;
            let saved = this._loadLayout();

            let migrated = false;
            if (saved && this._isLegacyFractionalLayout(saved)) {
                saved = this._convertLegacyLayout(saved, canvasW, canvasH);
                migrated = true;
            }

            this.layout = saved || defaultLayout(canvasW, canvasH);
            WIDGET_DEFS.forEach(id => {
                if (!this.layout[id]) this.layout[id] = defaultLayout(canvasW, canvasH)[id];
            });
            this._zTop = Math.max(...WIDGET_DEFS.map(i => this.layout[i]?.z || 1), this._zTop);
            // Apply the layout — PATCH 2 means _applyLayout() is a no-op
            // if the canvas is still zero-sized. Re-check dimensions after
            // the call: if canvas is still zero, we didn't actually apply
            // anything yet, so re-queue and try again next frame rather
            // than declaring success.
            this._applyLayout();
            const cwAfter = this.canvas.offsetWidth;
            const chAfter = this.canvas.offsetHeight;
            if (!cwAfter || !chAfter) {
                if (attempts++ < 120) { requestAnimationFrame(tryRestore); return; }
                // Gave up — canvas never got real dimensions. Last resort:
                // force-apply the widgets' raw saved coordinates so SOMETHING
                // shows. Routed through the same _styleWidget() helper
                // _applyLayout() uses (rather than a hand-rolled subset of
                // it) so this path can never again silently omit a property
                // — display was the one missing before, which let minimized
                // widgets render at full size ("block", the browser default)
                // whenever this fallback fired instead of the normal path.
                // clamp:false because fallbackCW/CH below are a placeholder,
                // not a measurement — clamping against them would crush
                // every widget bigger than 300×200 down to it and pin it to
                // the top-left corner.
                const fallbackCW = 300, fallbackCH = 200;
                WIDGET_DEFS.forEach(id => this._styleWidget(id, fallbackCW, fallbackCH, { clamp: false }));
                this._scaleContent();
                this._syncTray();
            }
            this._updateKnob();
            const pw = this._pw("padding");
            if (pw && this._W._sval) this._W._sval.textContent = pw.value || 3;

            // Persist the migrated (now pixel-based) layout immediately —
            // otherwise node.properties.mmpLayout still holds the old
            // fractional data, and _isLegacyFractionalLayout()/
            // _convertLegacyLayout() would detect and re-run the same
            // conversion on every future load/tab-switch until some
            // unrelated user action (drag, resize, minimize...) happened to
            // trigger a save first.
            if (migrated) this._saveLayout();
        };
        requestAnimationFrame(tryRestore);
    }

    syncFromNode() {
        // onConfigure fires after LiteGraph has applied the node's saved
        // size from the workflow JSON. The DOM widget host will be correctly
        // sized within the next RAF or two after this point.
        // Always run a full _restoreLayout() — it polls until canvas
        // dimensions are non-zero, so it self-corrects even if called
        // slightly early.
        ensureStateId(this.node);
        this._pendingReset = undefined;
        this._stateRevision = (this._stateRevision || 0) + 1;
        this._state = { current: null, next: 1, padded: "—", freeze: false, padding: 3, lastReset: null };
        this._syncControlState();
        this._updateDisplays();
        if (this._qcState) {
            this._qcState.sb2Id = null;
            this._qcState._sb2SeedFor = null;
            this._qcState.autoFire = false;
            this._qcState.autoEpoch++;
            this._qcState.completedCounter.clear();
        }
        this._restoreLayout();
        this._syncKnobFromProperties();
        this._fetchInitialState();
    }

    _syncKnobFromProperties() {
        const ka = this._W._knobApply; if (!ka) return;
        const { applyTheme, applyShape, applyColor, props, layout } = ka;
        const p = props();
        const color = p.knobColor || "#1D9E75";
        applyShape(p.knobShape || "knob");
        applyTheme(p.knobTheme || "dark", false);
        applyColor(color, false);
        const w = this._pw("knobValue");
        if (w) {
            const bounds = knobBounds(p.knobMin ?? w.options?.min, p.knobMax ?? w.options?.max, p.knobStepper);
            p.knobMin = bounds.min; p.knobMax = bounds.max; p.knobStepper = bounds.step;
            w.options = { ...w.options, min: bounds.min, max: bounds.max };
            w.value = knobValue(w.value, bounds);
            if (this._W._knobMinus) this._W._knobMinus.textContent = `-${bounds.step}`;
            if (this._W._knobPlus) this._W._knobPlus.textContent = `+${bounds.step}`;
        }
        this._updateKnob();
        layout?.();
    }

    _observeSize(target, callback) {
        const observer = new ResizeObserver(() => { if (!this._disposed) callback(); });
        observer.observe(target);
        this._cleanups?.push(() => observer.disconnect());
    }

    dispose() {
        this._disposed = true;
        this._knobClose?.();
        this._closeCtx();
        this._cleanups?.splice(0).forEach(fn => fn());
    }

    onCanvasResize() {
        requestAnimationFrame(() => { if (!this._disposed) this._scaleContent(); });
    }
}

function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
}

function mkCirc(ns, fill, stroke, sw) {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("fill", fill); c.setAttribute("stroke", stroke); c.setAttribute("stroke-width", sw);
    return c;
}

function wbBtn(icon, tip) {
    const b = el("button", "mmp-wbar-btn");
    b.innerHTML = icon; b.title = tip;
    b.setAttribute("aria-label", tip);
    return b;
}

loadCSS();

app.registerExtension({
    name: "magik.MegaPanel",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "MagikMegaPanel") return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            origCreated?.apply(this, arguments);

            // Mark as a brand-new node so onDrawBackground triggers the
            // initial layout restore exactly once (see below). For nodes
            // loaded from a saved workflow, onConfigure fires instead and
            // syncFromNode() handles it — _isNewNode stays false there.
            this._mmpIsNewNode = true;

            if (this.widgets) {
                this.widgets.forEach(w => {
                    w._mmpOrigType = w.type;
                    w.type = "hidden";
                    w.computeSize = () => [0, -4];
                    if (w.element) w.element.style.display = "none";
                });
            }

            this.size[0] = Math.max(this.size[0], DEFAULT_W_NODE);
            this.size[1] = Math.max(this.size[1], DEFAULT_H_NODE);

            const node = this;
            const container = el("div");
            container.style.cssText = "width:100%;height:100%;position:relative;overflow:hidden;";

            const domWidget = this.addDOMWidget("mmp_canvas", "custom", container, {
                serialize:   false,
                computeSize: (w) => {
                    const nodeH = node.size?.[1] ?? MIN_H_NODE;
                    return [w, Math.max(MIN_H_NODE - 38, nodeH - 38)];
                },
            });

            ensureStateId(this);
            this._mmpUI = new MegaPanelUI(this, container);
            this._mmpUI._ctxClose = () => this._mmpUI._closeCtx();
        };

        const origAdded = nodeType.prototype.onAdded;
        nodeType.prototype.onAdded = function() {
            origAdded?.apply(this, arguments);
            ensureStateId(this); // Duplicated nodes get independent counters.
        };

        const origResize = nodeType.prototype.onResize;
        nodeType.prototype.onResize = function(size) {
            size[0] = Math.max(MIN_W_NODE, size[0]);
            size[1] = Math.max(MIN_H_NODE, size[1]);
            origResize?.apply(this, arguments);
            this._mmpUI?.onCanvasResize();
        };

        const origConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function(data) {
            // onConfigure means this is a loaded node — clear the new-node
            // flag so onDrawBackground doesn't also trigger a restore.
            this._mmpIsNewNode = false;
            origConfigure?.apply(this, arguments);
            this._mmpUI?.syncFromNode();
        };

        // onDrawBackground is LiteGraph's per-frame draw callback on the
        // node. By the time it fires for the first time, the node is fully
        // positioned, sized, and the DOM widget host has its final
        // dimensions. We use it as a guaranteed-one-shot trigger for
        // brand-new nodes that never receive onConfigure.
        const origDrawBg = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function(ctx) {
            origDrawBg?.apply(this, arguments);
            if (this._mmpIsNewNode && this._mmpUI) {
                this._mmpIsNewNode = false;   // fire exactly once
                ensureStateId(this);
                this._mmpUI._fetchInitialState();
                this._mmpUI._restoreLayout();
                this._mmpUI._syncKnobFromProperties();
            }
        };

        const origRemoved = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function() {
            origRemoved?.apply(this, arguments);
            this._mmpUI?.dispose?.();
            this._mmpUI?._unbindDocMouse?.();
            this._mmpUI?._unbindServer?.();
            this._mmpUI?._closeModals?.();
            const qcBody = this._mmpUI?._W?.["queue_controller"]?.body;
            if (qcBody) { qcBody._qcCleanup?.(); qcBody._qcCleanup2?.(); qcBody._qcCleanup3?.(); qcBody._qcCleanup4?.(); qcBody._qcCleanup5?.(); }
        };
    },
});
