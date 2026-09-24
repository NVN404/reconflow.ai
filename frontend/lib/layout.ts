import dagre from "dagre";
import { GraphNode, GraphEdge } from "./types";

const nodeWidth = 240;
const nodeHeight = 85;

export const getLayoutedElements = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: "TB" | "LR" = "TB"
): { nodes: GraphNode[]; edges: GraphEdge[] } => {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const isHorizontal = direction === "LR";

  // Partition into Section 1 (Info & Assets) and Section 2 (Active Vulnerabilities)
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
      nodesep: isHorizontal ? 50 : 55,
      ranksep: isHorizontal ? 150 : 85,
      marginx: 35,
      marginy: 35,
    });

    const nodeIdSet = new Set(subNodes.map((n) => n.id));
    subNodes.forEach((node) => {
      g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    subEdges.forEach((edge) => {
      if (nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)) {
        g.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(g);

    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    const layouted = subNodes.map((node) => {
      const pos = g.node(node.id);
      const x = pos.x - nodeWidth / 2;
      const y = pos.y - nodeHeight / 2;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + nodeWidth);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + nodeHeight);
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

    const width = maxX > minX ? maxX - minX : 300;
    const height = maxY > minY ? maxY - minY : 200;
    return { layouted, width, height };
  };

  const edgeSet = new Set(nodes.map((n) => n.id));
  const validEdges = edges.filter((e) => edgeSet.has(e.source) && edgeSet.has(e.target));

  // Layout Info Section (Zone 1)
  const infoResult = layoutSubGraph(infoNodes, validEdges, 40, 80);

  // Layout Vulnerability Section (Zone 2) with spatial offset
  const vulnOffsetX = isHorizontal ? 40 : Math.max(680, infoResult.width + 120);
  const vulnOffsetY = isHorizontal ? Math.max(480, infoResult.height + 120) : 80;
  const vulnResult = layoutSubGraph(vulnNodes, validEdges, vulnOffsetX, vulnOffsetY);

  const finalNodes = [...infoResult.layouted, ...vulnResult.layouted];

  return { nodes: finalNodes as unknown as GraphNode[], edges: validEdges };
};
