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
import { ShieldCheck, ShieldAlert, Layers } from "lucide-react";

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

  const infoCount = useMemo(() => {
    return nodes.filter((n) => (n.data as any)?.section !== "VULNERABILITY").length;
  }, [nodes]);

  const activeVulnCount = useMemo(() => {
    return nodes.filter(
      (n) => (n.data as any)?.section === "VULNERABILITY" && (n.data as any)?.category !== "VULN_STATUS_CLEAN"
    ).length;
  }, [nodes]);

  return (
    <div className="w-full h-[640px] rounded-2xl border border-slate-800/90 bg-slate-950/80 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col">
      {/* Canvas Top Bar: Dual-Zone Architecture Indicator */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2">
          {/* Zone 1: Info / Assets Section */}
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-sky-500/30 text-xs font-mono text-sky-300 shadow-lg pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-semibold">ZONE 1: PERIMETER ASSETS & INTEL</span>
            <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-[10px] font-bold text-sky-300">
              {infoCount} Assets
            </span>
          </div>

          {/* Zone 2: Vulnerability Section */}
          <div className={`flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-lg border text-xs font-mono shadow-lg pointer-events-auto ${
            activeVulnCount > 0
              ? "bg-red-950/80 border-red-500/60 text-red-300 animate-pulse-slow"
              : "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
          }`}>
            {activeVulnCount > 0 ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span className="font-semibold">ZONE 2: ACTIVE VULNERABILITIES</span>
                <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-[10px] font-bold text-red-300">
                  {activeVulnCount} Leaks
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">ZONE 2: VULNERABILITY PERIMETER</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                  0 Active Leaks
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Info Helper */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 pointer-events-none">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px]">Dual-Zone Graph: Click any node to inspect remediation</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
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
            if ((n.data as any)?.category === "VULN_STATUS_CLEAN") return "#10b981";
            if (n.type === "externalNode") {
              const cat = (n.data as any)?.category;
              if (cat === "MOBILE_APP") return "#10b981";
              if (cat === "YOUTUBE_POC") return "#818cf8";
              if (cat === "NEWS_BREACH") return "#38bdf8";
              return "#c084fc";
            }
            const severity = (n.data as any)?.severity;
            if (severity === "CRITICAL") return "#ef4444";
            if (severity === "HIGH") return "#f97316";
            return "#38bdf8";
          }}
          maskColor="rgba(8, 11, 17, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};
