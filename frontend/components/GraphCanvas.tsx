import React, { useMemo, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  NodeMouseHandler,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeftRight, ArrowUpDown } from "lucide-react";

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
  layoutDirection: "TB" | "LR";
  onToggleLayout: () => void;
}

const CanvasInner: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
  layoutDirection,
  onToggleLayout,
}) => {
  const { fitView } = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      rootNode: RootNode,
      assetNode: AssetNode,
      findingNode: FindingNode,
      externalNode: ExternalNode,
    }),
    []
  );

  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodes, layoutDirection, fitView]);

  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isCriticalEdge = edge.style?.stroke === "#ef4444" || edge.style?.stroke === "#dc2626";
      const isAnimated = edge.animated ?? isCriticalEdge;
      return {
        ...edge,
        type: "smoothstep",
        animated: isAnimated,
        style: {
          stroke: isCriticalEdge ? "#E24B4A" : "#475569",
          strokeWidth: isCriticalEdge ? 2 : 1.5,
        },
        labelStyle: {
          fill: isCriticalEdge ? "#F87171" : "#94a3b8",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "#0f172a",
          fillOpacity: 0.95,
          stroke: isCriticalEdge ? "rgba(226, 75, 74, 0.4)" : "#334155",
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 4] as [number, number],
      };
    });
  }, [edges]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    onNodeClick(node as unknown as GraphNode);
  };

  return (
    <div className="w-full h-[640px] rounded-2xl border border-slate-800/90 bg-[#0d1117] backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Canvas Top Bar Indicator */}
      <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2 bg-[#0f172a]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 pointer-events-none shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Interactive Attack Surface Graph</span>
        <span className="text-slate-600">|</span>
        <span className="text-[10px] text-slate-400">Click node for remediation</span>
      </div>

      {/* Top Right Layout Toggle Button */}
      <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-2">
        <button
          onClick={onToggleLayout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f172a]/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-xs font-mono font-medium text-slate-200 shadow-md transition-all active:scale-95 cursor-pointer"
          title={`Switch graph layout to ${layoutDirection === "TB" ? "Horizontal (Left-to-Right)" : "Vertical (Top-to-Bottom)"}`}
        >
          {layoutDirection === "TB" ? (
            <>
              <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
              <span>Layout: Vertical</span>
            </>
          ) : (
            <>
              <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Layout: Horizontal</span>
            </>
          )}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "rootNode") return "#378ADD";
            if (n.type === "assetNode") return "#1D9E75";
            if (n.type === "externalNode") return "#a855f7";
            const severity = (n.data as any)?.severity;
            if (severity === "CRITICAL") return "#E24B4A";
            if (severity === "HIGH") return "#D85A30";
            return "#EF9F27";
          }}
          maskColor="rgba(13, 17, 23, 0.75)"
        />
      </ReactFlow>
    </div>
  );
};

export const GraphCanvas: React.FC<GraphCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
};

