"use client";

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
import { ArrowLeftRight, ArrowUpDown, ShieldCheck, ShieldAlert, Network } from "lucide-react";

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

  // Smooth fitView on initial load or layout switch
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.16, duration: 400 });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [nodes, layoutDirection, fitView]);

  // Pass selected state to nodes
  const processedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      selected: node.id === selectedNodeId,
    }));
  }, [nodes, selectedNodeId]);

  // Refined edge styling with active/selected connection highlighting
  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isConnectedToSelected =
        Boolean(selectedNodeId) &&
        (edge.source === selectedNodeId || edge.target === selectedNodeId);

      const isCriticalEdge =
        edge.style?.stroke === "#ef4444" ||
        edge.style?.stroke === "#dc2626" ||
        edge.style?.stroke === "#ff6b6a" ||
        edge.style?.stroke === "#f43f5e";
      const isSecureEdge = edge.label === "PERIMETER_SECURE" || edge.style?.stroke === "#10b981";
      const isAnimated = edge.animated ?? isCriticalEdge;

      let strokeColor = "#383838";
      let strokeWidth = 1.25;
      let labelTextColor = "#A0A09C";
      let labelBorderColor = "#292929";

      if (isCriticalEdge) {
        strokeColor = "#f43f5e";
        strokeWidth = 1.75;
        labelTextColor = "#f43f5e";
        labelBorderColor = "rgba(244, 63, 94, 0.4)";
      } else if (isSecureEdge) {
        strokeColor = "#10b981";
        strokeWidth = 1.25;
        labelTextColor = "#10b981";
        labelBorderColor = "rgba(16, 185, 129, 0.4)";
      } else if (isConnectedToSelected) {
        strokeColor = "#F7F7F5";
        strokeWidth = 1.75;
        labelTextColor = "#F7F7F5";
        labelBorderColor = "#383838";
      }

      return {
        ...edge,
        type: "smoothstep",
        animated: isAnimated,
        style: {
          stroke: strokeColor,
          strokeWidth,
          ...edge.style,
        },
        labelStyle: {
          fill: labelTextColor,
          fontSize: 9.5,
          fontWeight: 600,
          fontFamily: "var(--font-mono, monospace)",
        },
        labelBgStyle: {
          fill: "#0B0B0B",
          fillOpacity: 0.95,
          stroke: labelBorderColor,
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 3] as [number, number],
      };
    });
  }, [edges, selectedNodeId]);

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

  return (
    <div className="w-full h-[640px] rounded-xl border border-zinc-800 bg-[#050505] shadow-2xl relative overflow-hidden flex flex-col">
      {/* Canvas Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zone 1: Assets & Topology */}
          <div className="flex items-center gap-2 bg-[#0B0B0B]/95 backdrop-blur-md px-3 py-1.5 rounded-md border border-zinc-800 text-xs font-mono text-zinc-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span className="font-semibold text-xs tracking-tight">ZONE 1: ASSETS</span>
            <span className="px-1.5 py-0.2 rounded bg-[#111111] text-[10px] font-bold text-zinc-400 border border-zinc-800">
              {infoCount}
            </span>
          </div>

          {/* Zone 2: Vulnerability Perimeter */}
          <div
            className={`flex items-center gap-2 backdrop-blur-md px-3 py-1.5 rounded-md border text-xs font-mono shadow-sm ${
              activeVulnCount > 0
                ? "bg-rose-950/80 border-rose-800/80 text-rose-300"
                : "bg-emerald-950/80 border-emerald-800/80 text-emerald-300"
            }`}
          >
            {activeVulnCount > 0 ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold text-xs tracking-tight">ZONE 2: VULNERABILITIES</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-900/50 text-[10px] font-bold text-rose-200">
                  {activeVulnCount} Leaks
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-xs tracking-tight">ZONE 2: POSTURE</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-900/50 text-[10px] font-bold text-emerald-300">
                  0 Active Leaks
                </span>
              </>
            )}
          </div>
        </div>

        {/* Layout Switcher */}
        {onToggleLayout && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleLayout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0B0B0B] hover:bg-[#111111] border border-zinc-800 hover:border-zinc-700 text-xs font-mono font-medium text-zinc-100 shadow-sm transition-all cursor-pointer"
              title={`Switch graph layout to ${
                layoutDirection === "TB" ? "Horizontal" : "Vertical"
              }`}
            >
              {layoutDirection === "TB" ? (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Layout: Vertical</span>
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Layout: Horizontal</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Empty State when no nodes */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-6 z-0">
          <div className="w-12 h-12 rounded-xl bg-[#0B0B0B] border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
            <Network className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-sm font-bold font-mono text-zinc-100 mb-1">
            Attack Surface Graph Empty
          </p>
          <p className="text-xs text-zinc-400 max-w-sm">
            Enter a domain above or click a preset to execute multi-engine reconnaissance and render the attack-surface DAG topology.
          </p>
        </div>
      )}

      <ReactFlow
        nodes={processedNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={0.15}
        maxZoom={1.5}
        panOnScroll={false}
        zoomOnScroll={false}
        preventScrolling={false}
        zoomOnPinch={true}
        panOnDrag={true}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#292929" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "rootNode") return "#B7E36A";
            if (n.type === "assetNode") return "#6F6F6B";
            if ((n.data as any)?.category === "VULN_STATUS_CLEAN") return "#10b981";
            const severity = (n.data as any)?.severity;
            if (severity === "CRITICAL") return "#f43f5e";
            if (severity === "HIGH") return "#f97316";
            return "#383838";
          }}
          maskColor="rgba(8, 8, 8, 0.8)"
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
