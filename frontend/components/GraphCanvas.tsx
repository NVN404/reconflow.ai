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
import { ArrowLeftRight, ArrowUpDown, Network } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

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
  const { fitView, setCenter, getZoom } = useReactFlow();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const nodeTypes = useMemo(
    () => ({
      rootNode: RootNode,
      assetNode: AssetNode,
      subdomainNode: AssetNode,
      findingNode: FindingNode,
      externalNode: ExternalNode,
      externalExposureNode: ExternalNode,
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

      let strokeColor = isDark ? "#383838" : "#94a3b8";
      let strokeWidth = 1.25;
      let labelTextColor = isDark ? "#A0A09C" : "#334155";
      let labelBorderColor = isDark ? "#292929" : "#cbd5e1";

      if (isCriticalEdge) {
        strokeColor = "#f43f5e";
        strokeWidth = 1.75;
        labelTextColor = isDark ? "#f43f5e" : "#be123c";
        labelBorderColor = "rgba(244, 63, 94, 0.4)";
      } else if (isSecureEdge) {
        strokeColor = isDark ? "#10b981" : "#059669";
        strokeWidth = 1.25;
        labelTextColor = isDark ? "#10b981" : "#047857";
        labelBorderColor = "rgba(16, 185, 129, 0.4)";
      } else if (isConnectedToSelected) {
        strokeColor = isDark ? "#F7F7F5" : "#0f172a";
        strokeWidth = 2;
        labelTextColor = isDark ? "#F7F7F5" : "#0f172a";
        labelBorderColor = isDark ? "#383838" : "#64748b";
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
          fill: isDark ? "#0B0B0B" : "#ffffff",
          fillOpacity: 0.95,
          stroke: labelBorderColor,
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 3] as [number, number],
      };
    });
  }, [edges, selectedNodeId, isDark]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    onNodeClick(node as unknown as GraphNode);

    // Zoom and pan the clicked box smoothly to the LEFT side of the canvas
    // so the box remains 100% visible while the pop-up drawer slides in on the right!
    if (node.position) {
      const targetZoom = Math.max(getZoom(), 1.05);
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      // 320px screen offset pushes the node into the clear left-hand viewport
      const screenOffset = isMobile ? 0 : 320;
      const canvasOffsetX = screenOffset / targetZoom;

      setCenter(node.position.x + 130 + canvasOffsetX, node.position.y + 75, {
        zoom: targetZoom,
        duration: 500,
      });
    }
  };

  return (
    <div className="w-full h-[640px] rounded-xl border border-border bg-slate-100/90 dark:bg-[#070707] shadow-xl relative overflow-hidden flex flex-col transition-colors duration-200">
      {/* Canvas Header Bar: Clean & Minimal (Unobtrusive Layout Switcher) */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-[11px] font-mono text-foreground-muted bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded border border-border shadow-sm">
            Topology DAG Canvas
          </span>
        </div>

        {/* Layout Switcher */}
        {onToggleLayout && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleLayout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border hover:border-border-strong text-xs font-mono font-medium text-foreground shadow-sm transition-all cursor-pointer"
              title={`Switch graph layout to ${
                layoutDirection === "TB" ? "Horizontal" : "Vertical"
              }`}
            >
              {layoutDirection === "TB" ? (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5 text-foreground-secondary" />
                  <span>Layout: Vertical</span>
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-3.5 h-3.5 text-foreground-secondary" />
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
          <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-foreground-muted mb-4 shadow-sm">
            <Network className="w-6 h-6 text-foreground-muted" />
          </div>
          <p className="text-sm font-bold font-mono text-foreground mb-1">
            Attack Surface Graph Empty
          </p>
          <p className="text-xs text-foreground-secondary max-w-sm">
            Enter a domain above and click Execute Recon to sweep engines and render the attack-surface DAG topology.
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
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color={isDark ? "#292929" : "#94a3b8"} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "rootNode") return isDark ? "#B7E36A" : "#4d7c0f";
            if (n.type === "assetNode") return isDark ? "#6F6F6B" : "#94a3b8";
            if ((n.data as any)?.category === "VULN_STATUS_CLEAN") return "#10b981";
            const severity = (n.data as any)?.severity;
            if (severity === "CRITICAL") return "#f43f5e";
            if (severity === "HIGH") return "#f97316";
            return isDark ? "#383838" : "#cbd5e1";
          }}
          maskColor={isDark ? "rgba(8, 8, 8, 0.8)" : "rgba(241, 245, 249, 0.7)"}
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
