import dagre from "dagre";
import { GraphNode, GraphEdge } from "./types";

// ---------------------------------------------------------------------------
// Node dimension constants
//
// These MUST accurately reflect the actual rendered sizes of each custom node
// so Dagre reserves the correct bounding box and avoids overlaps.
//
// All nodes share the same 260 px width (w-[260px] in Tailwind).
//
// Heights are measured from the JSX structure:
//   p-4 (16px top + 16px bottom) = 32px padding
//   Top row (icon 24px):                          24px
//   mt-2.5 gap:                                   10px
//   Title line (~18px) + url line (~16px):        34px
//   mt-3 + pt-2.5 + border-t gap:                22px
//   Bottom row (~16px):                           16px
//   ------------------------------------------------
//   Total rendered ≈                             138px
//
// We use 150px to add a small buffer for font-rendering differences across
// browsers/OS while still being an honest measurement (not an inflated hack).
// ---------------------------------------------------------------------------
const NODE_WIDTH = 260;

/** Height Dagre reserves for each node type (px). */
const NODE_HEIGHTS: Record<string, number> = {
  rootNode:     150, // same structure as asset — three content rows
  assetNode:    150,
  findingNode:  150, // three rows: header, title+url, CVSS bottom
  externalNode: 150, // same three-row structure
};

/** Fallback when the type is unknown. */
const DEFAULT_NODE_HEIGHT = 150;

export const getLayoutedElements = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: "TB" | "LR" = "TB"
): { nodes: GraphNode[]; edges: GraphEdge[] } => {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const isHorizontal = direction === "LR";

  // Partition into Zone 1 (Info & Host Assets) and Zone 2 (Active Vulnerabilities & External Intel)
  const infoNodes = nodes.filter((n) => (n.data as any)?.section !== "VULNERABILITY");
  const vulnNodes = nodes.filter((n) => (n.data as any)?.section === "VULNERABILITY");

  // Helper to layout a sub-graph with Dagre
  const layoutSubGraph = (
    subNodes: GraphNode[],
    subEdges: GraphEdge[],
    offsetX = 0,
    offsetY = 60
  ) => {
    if (subNodes.length === 0) return { layouted: [], width: 0, height: 0 };

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: direction,
      // nodesep = gap between sibling nodes on the same rank.
      // Increase from 55/75 → 80/100 to ensure visible breathing room
      // even when node heights are correctly measured at 150px.
      nodesep: isHorizontal ? 80 : 100,
      // ranksep = gap between ranks (layers).
      // Increase to accommodate correct node heights and edge routing.
      ranksep: isHorizontal ? 200 : 220,
      marginx: 50,
      marginy: 50,
    });

    const nodeIdSet = new Set(subNodes.map((n) => n.id));

    subNodes.forEach((node) => {
      // Look up the per-type height so Dagre reserves an accurate bounding box.
      const h = NODE_HEIGHTS[(node.type as string) ?? ""] ?? DEFAULT_NODE_HEIGHT;
      g.setNode(node.id, { width: NODE_WIDTH, height: h });
    });

    subEdges.forEach((edge) => {
      if (nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)) {
        g.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(g);

    let minX = Infinity,  maxX = -Infinity;
    let minY = Infinity,  maxY = -Infinity;

    const layouted = subNodes.map((node) => {
      const h = NODE_HEIGHTS[(node.type as string) ?? ""] ?? DEFAULT_NODE_HEIGHT;
      const pos = g.node(node.id);
      // Dagre returns the CENTER of the node; convert to top-left corner.
      const x = pos.x - NODE_WIDTH / 2;
      const y = pos.y - h / 2;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + NODE_WIDTH);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + h);
      return {
        ...node,
        targetPosition: isHorizontal ? ("left" as const) : ("top" as const),
        sourcePosition: isHorizontal ? ("right" as const) : ("bottom" as const),
        data: {
          ...node.data,
          layoutDirection: direction,
        },
        position: {
          x: x + offsetX,
          y: y + offsetY,
        },
      };
    });

    const width  = maxX > minX ? maxX - minX : 320;
    const height = maxY > minY ? maxY - minY : 220;
    return { layouted, width, height };
  };

  const edgeSet = new Set(nodes.map((n) => n.id));
  const validEdges = edges.filter((e) => edgeSet.has(e.source) && edgeSet.has(e.target));

  // Layout Info Section (Zone 1)
  const infoResult = layoutSubGraph(infoNodes, validEdges, 40, 80);

  // Layout Vulnerability Section (Zone 2) with spatial offset.
  // The extra 160px buffer (was 120px) accounts for the increased node height
  // so the two zones never bleed into each other.
  const vulnOffsetX = isHorizontal ? 40 : Math.max(720, infoResult.width + 160);
  const vulnOffsetY = isHorizontal ? Math.max(560, infoResult.height + 160) : 80;
  const vulnResult = layoutSubGraph(vulnNodes, validEdges, vulnOffsetX, vulnOffsetY);

  const finalNodes = [...infoResult.layouted, ...vulnResult.layouted];

  return { nodes: finalNodes as unknown as GraphNode[], edges: validEdges };
};
