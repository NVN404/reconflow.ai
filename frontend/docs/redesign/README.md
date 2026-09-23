# ReconFlow AI — Frontend Presentation & Graph UX Redesign

## Overview & Executive Summary

This document details the frontend visual design, interaction polish, and graph layout enhancements completed for **ReconFlow AI** ahead of the SerpApi India Hackathon submission.

The primary objective was to elevate the user experience from a raw prototype to a **clean, structured, and confident product** (inspired by modern developer platforms like Linear and Vercel) while maintaining 100% feature parity and strict data contract compliance with the Python backend.

---

## 1. What Existed Before

Prior to this update, the application was fully functional but suffered from visual and interaction pain points:
- **Fixed Layout**: The graph canvas only rendered in top-to-bottom orientation with no option to view horizontally.
- **Manual Framing**: Users had to manually drag and zoom the graph canvas on initial load to fit all nodes in view.
- **Overlapping Edge Labels**: Relationship tags between nodes (such as `EXPOSES_API` and `CRITICAL_LEAK`) collided with node boundaries and text lines.
- **Inconsistent Node Cards**: The 4 node types (Apex Domain, Host Asset, Internal Finding, External Exposure) used mismatched border radii, padding, color treatments, and badge structures.
- **Visual Contrast**: The background used stark pitch-black (`#080b11`) with high-saturation badges, causing visual noise.
- **Thought Stream Readability**: Agent log messages used very small text (`text-[10px]`) and could push page layout as logs accumulated.

---

## 2. Key Improvements & Deliverables

### A. Graph Layout Toggle (Horizontal vs. Vertical)
- **What Changed**: Added a toggle button in the top-right of the graph canvas (using `ArrowLeftRight` / `ArrowUpDown` icons).
- **Why It's Better**: Users can switch between **Vertical** (top-to-bottom) and **Horizontal** (left-to-right) rank layouts dynamically. Dagre auto-layout re-calculates spatial coordinates in real time, and node connection handles smoothly re-orient to match the layout direction.

### B. Automatic Canvas Framing (`fitView`)
- **What Changed**: Wrapped the graph canvas in a `ReactFlowProvider` and integrated an automated `fitView` trigger on layout change, filter change, or scan completion.
- **Why It's Better**: The graph is perfectly framed and centered on screen when a scan loads—no manual pan or zoom required. Full interactive pan and zoom remain available for detailed exploration.

### C. Edge Label Backdrops & Wire Overlap Fix
- **What Changed**: Edge labels now render with custom dark slate backdrop pills (`fill: #0f172a` with subtle border), increased rank separation in Dagre layout, and smoothstep curve routing.
- **Why It's Better**: Relationship text is readable over edge lines and node cards without visual clutter or overlapping text boxes.

### D. Unified Design System & Visual Polish
- **Unified Node Architecture**: All 4 node card types now share identical dimensions (`240px` width), border radius (`rounded-xl`), internal spacing, and structural layout:
  1. **Top Row**: Circle icon tint + uppercase type label.
  2. **Main Line**: Domain or finding title.
  3. **Bottom Row**: Muted surface/CWE subtitle + sentence-case severity badge.
- **Color Palette Integration**: Implemented exact severity colors:
  - **Info**: Blue (`#378ADD` tint)
  - **Low**: Teal (`#1D9E75` tint)
  - **Medium**: Amber (`#EF9F27` tint)
  - **High**: Coral (`#D85A30` tint)
  - **Critical**: Red (`#E24B4A` tint with soft ambient pulse)
- **Refined Casing**: Updated severity badge text to clear sentence case (`Critical`, `High`, `Medium`, `Low`, `Info`).
- **Comfortable Dark Theme**: Softened the background to `#0d1117` for reduced eye strain and higher legibility.

### E. Micro-Animations & Interaction States
- **Animated Edge Flow**: Added a subtle keyframe animation (`dashdraw`) to active edge paths suggesting data movement.
- **Critical Node Soft Pulse**: Critical severity nodes feature a gentle 2.5s glowing pulse (`animate-pulse-subtle`).
- **Button Polish**: All interactive elements (Execute Recon, Benchmark Demo, Export Dossier, Layout Toggle, Filter Badges) now feature smooth hover and active scale transitions (`active:scale-95`).

### F. Thought Stream & Drawer Refinements
- **Thought Stream Log Panel**: Text size increased from `text-[10px]` to readable `text-xs` (12px), with a fixed height container (`h-48`) and internal scrolling so the page height remains stable.
- **Finding Detail Drawer**: Fixed right-edge slide-over panel overlay with exact severity color badges and one-click remediation directive copy buttons.

---

## 3. What Was Left Intentionally Untouched

To preserve team velocity and prevent breaking changes:
- **Backend API & Logic**: Zero changes were made to Python FastAPI routes (`/api/scan`, `/api/cache`, `/api/remediation`), SerpApi harvesting logic, caching mechanisms, or scoring algorithms.
- **Data Contracts & Types**: All TypeScript interfaces in `frontend/lib/types.ts` (`ScanRequest`, `ScanResult`, `NodeData`, `GraphNode`, `GraphEdge`, `ScanSummary`, `AgentThought`) remain unchanged.
- **Core Application Features**: Live scan fetching, 0-credit benchmark demo mode (`demo-sandbox.corp`), Phase 2 Shadow IT toggle, severity filter buttons, and Markdown executive dossier export functions remain fully intact.
- **Zero Heavy Dependencies**: Implemented using existing packages (`@xyflow/react`, `dagre`, `tailwindcss`, `lucide-react`) with zero bloat added.

---

## 4. Summary of Files Changed

| File | Primary Changes |
| :--- | :--- |
| `frontend/app/globals.css` | Softened dark background (`#0d1117`), added ReactFlow controls styles, edge flow keyframes, and subtle critical node pulse. |
| `frontend/lib/layout.ts` | Added `TB` and `LR` layout direction support with custom Dagre spacing and node handle orientation. |
| `frontend/components/nodes/RootNode.tsx` | Redesigned to unified node specification with sentence-case Info badge and dynamic handles. |
| `frontend/components/nodes/AssetNode.tsx` | Redesigned to unified node specification with sentence-case Low badge and dynamic handles. |
| `frontend/components/nodes/FindingNode.tsx` | Redesigned to unified node specification with sentence-case severity badges, exact colors, subtle critical pulse, and dynamic handles. |
| `frontend/components/nodes/ExternalNode.tsx` | Redesigned to unified node specification with sentence-case severity badges, exact colors, and dynamic handles. |
| `frontend/components/GraphCanvas.tsx` | Integrated `ReactFlowProvider`, automated `fitView`, Graph Layout Toggle button (`TB` vs `LR`), and styled edge label backdrop pills. |
| `frontend/components/FindingDrawer.tsx` | Updated drawer overlay styling, sentence-case severity badges with exact visual palette, and close/copy hover states. |
| `frontend/components/ThoughtStream.tsx` | Increased log font size to `text-xs`, improved spacing, and enforced a fixed height (`h-48`) scrolling panel. |
| `frontend/components/SummaryCards.tsx` | Updated metric cards with exact color tints, sentence-case labels, and button interaction states. |
| `frontend/components/SearchBar.tsx` | Refined input border styling and polished button hover/active interaction states. |
| `frontend/app/page.tsx` | Added layout direction state (`layoutDirection`), layout toggle handler, and polished top navigation bar styling. |
