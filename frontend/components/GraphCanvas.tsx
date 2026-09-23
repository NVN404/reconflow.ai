import React, { useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { RootNode } from "./nodes/RootNode";
import { AssetNode } from "./nodes/AssetNode";
import { FindingNode } from "./nodes/FindingNode";
import { ExternalNode } from "./nodes/ExternalNode";
import { GraphNode } from "@/lib/types";

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (node: GraphNode) => void;
  selectedNodeId?: string;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}) => {
  const nodeTypes = useMemo(
    () => ({
      rootNode: RootNode,
      assetNode: AssetNode,
      findingNode: FindingNode,
      externalNode: ExternalNode,
    }),
    []
  );

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    onNodeClick(node as unknown as GraphNode);
  };

  return (
    <div className="w-full h-[620px] rounded-2xl border border-slate-800/90 bg-slate-950/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Canvas Top Bar Indicator */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Interactive Attack Surface Graph</span>
        <span className="text-slate-600">|</span>
        <span className="text-[10px] text-slate-400">Click any node to inspect remediation</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#334155", strokeWidth: 1.5 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "rootNode") return "#0284c7";
            if (n.type === "assetNode") return "#3b82f6";
            if (n.type === "externalNode") return "#a855f7";
            const severity = (n.data as any)?.severity;
            if (severity === "CRITICAL") return "#ef4444";
            if (severity === "HIGH") return "#f97316";
            return "#f59e0b";
          }}
          maskColor="rgba(8, 11, 17, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};
