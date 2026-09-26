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
import { ArrowLeftRight, ArrowUpDown, ShieldCheck, ShieldAlert, Layers } from "lucide-react";

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
  layoutDirection?: "TB" | "LR";
  onToggleLayout?: () => void;
}

const CanvasInner: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
  layoutDirection = "TB",
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
        fitView({ padding: 0.18, duration: 300 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodes, layoutDirection, fitView]);

  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isCriticalEdge =
        edge.style?.stroke === "#ef4444" ||
        edge.style?.stroke === "#dc2626" ||
        edge.style?.stroke === "#ff6b6a";
      const isSecureEdge = edge.label === "PERIMETER_SECURE" || edge.style?.stroke === "#10b981";
      const isAnimated = edge.animated ?? isCriticalEdge;

      let strokeColor = "#475569";
      let labelTextColor = "#94a3b8";
      let labelBorderColor = "#334155";

      if (isCriticalEdge) {
        strokeColor = "#ff6b6a";
        labelTextColor = "#ff6b6a";
        labelBorderColor = "rgba(255, 107, 106, 0.4)";
      } else if (isSecureEdge) {
        strokeColor = "#10b981";
        labelTextColor = "#4ade9b";
        labelBorderColor = "rgba(16, 185, 129, 0.4)";
      }

      return {
        ...edge,
        type: "smoothstep",
        animated: isAnimated,
        style: {
          stroke: strokeColor,
          strokeWidth: isCriticalEdge ? 2.5 : 1.5,
          ...edge.style,
        },
        labelStyle: {
          fill: labelTextColor,
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "#0f172a",
          fillOpacity: 0.95,
          stroke: labelBorderColor,
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

  const infoCount = useMemo(() => {
    return nodes.filter((n) => (n.data as any)?.section !== "VULNERABILITY").length;
  }, [nodes]);

  const activeVulnCount = useMemo(() => {
    return nodes.filter(
      (n) =>
        (n.data as any)?.section === "VULNERABILITY" &&
        (n.data as any)?.category !== "VULN_STATUS_CLEAN"
    ).length;
  }, [nodes]);

  const externalCount = useMemo(() => {
    return nodes.filter(
      (n) =>
        (n.data as any)?.origin === "EXTERNAL" ||
        n.type === "externalExposureNode" ||
        ["CUSTOM_DORK", "S3_LEAK", "GITHUB_LEAK", "GITHUB_REPO", "YOUTUBE_POC", "MOBILE_APP", "NEWS_BREACH", "BRAND_PRESENCE"].includes((n.data as any)?.category)
    ).length;
  }, [nodes]);

  return (
    <div className="w-full h-[640px] rounded-2xl border border-slate-800/90 bg-[#0d1117] backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col">
      {/* Canvas Top Bar: Dual-Zone Architecture Indicator + Controls */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex flex-wrap items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Zone 1: Info / Assets Section */}
          <div className="flex items-center gap-2 bg-[#0f172a]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-sky-500/30 text-xs font-mono text-sky-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-semibold">ZONE 1: ASSETS & INTEL</span>
            <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-[10px] font-bold text-sky-300">
              {infoCount}
            </span>
          </div>

          {/* Zone 2: Vulnerability Section */}
          <div
            className={`flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-xl border text-xs font-mono shadow-md ${
              activeVulnCount > 0
                ? "bg-[#3a1418]/90 border-red-500/60 text-red-300 animate-pulse-slow"
                : "bg-[#0f2e22]/90 border-emerald-500/40 text-emerald-300"
            }`}
          >
            {activeVulnCount > 0 ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-[#ff6b6a]" />
                <span className="font-semibold">ZONE 2: VULNERABILITIES</span>
                <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-[10px] font-bold text-red-300">
                  {activeVulnCount} Leaks
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ade9b]" />
                <span className="font-semibold">ZONE 2: VULN PERIMETER</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[10px] font-bold text-[#4ade9b]">
                  0 Active
                </span>
              </>
            )}
          </div>

          {/* Phase 2: Threat Radar Badge */}
          {externalCount > 0 && (
            <div className="flex items-center gap-2 bg-[#1e1435]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-purple-500/40 text-xs font-mono text-purple-300 shadow-md">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="font-semibold">PHASE 2: THREAT RADAR</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-[10px] font-bold text-purple-300">
                {externalCount}
              </span>
            </div>
          )}
        </div>

        {/* Top Right Layout Toggle Button */}
        {onToggleLayout && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleLayout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f172a]/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-xs font-mono font-medium text-slate-200 shadow-md transition-all active:scale-95 cursor-pointer"
              title={`Switch graph layout to ${
                layoutDirection === "TB"
                  ? "Horizontal (Left-to-Right)"
                  : "Vertical (Top-to-Bottom)"
              }`}
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
        )}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.18 }}
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
            if (n.type === "rootNode") return "#0284c7";
            if (n.type === "assetNode") return "#3b82f6";
            if ((n.data as any)?.category === "VULN_STATUS_CLEAN") return "#10b981";
            if (n.type === "externalNode") {
              const cat = (n.data as any)?.category;
              if (cat === "MOBILE_APP") return "#10b981";
              if (cat === "YOUTUBE_POC") return "#818cf8";
              if (cat === "NEWS_BREACH") return "#38bdf8";
              return "#c084fc";
            }
            const severity = (n.data as any)?.severity;
            if (severity === "CRITICAL") return "#ff6b6a";
            if (severity === "HIGH") return "#ff9d6b";
            return "#38bdf8";
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
