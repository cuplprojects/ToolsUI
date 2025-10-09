import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Progress,
  Badge,
  Button,
  Card,
  Table,
  Tag,
  Typography,
  message,
  Space,
} from "antd";
import { motion } from "framer-motion";
import API from "../hooks/api";
import useStore from "../stores/ProjectData";

const { Text } = Typography;

const url3 = import.meta.env.VITE_API_FILE_URL;

const ProcessingPipeline = () => {
  const [enabledModuleNames, setEnabledModuleNames] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState([]);

  const projectId = useStore((state) => state.projectId);

  const fileMap = useMemo(() => {
    if (!projectId) return {};
    return {
      duplicate: `${url3}/${projectId}/DuplicateTool.xlsx`,
      extra: `${url3}/${projectId}/ExtrasCalculation.xlsx`,
      envelope: `${url3}/${projectId}/BreakingReport.xlsx`,
      box: `${url3}/${projectId}/BoxBreaking.xlsx`,
    };
  }, [projectId]);

  const computeRunOrder = useCallback(() => {
    const names = (enabledModuleNames || []).map((n) => String(n).toLowerCase());
    const order = [];
    if (names.some((n) => n.includes("duplicate")))
      order.push({ key: "duplicate", title: "Duplicate Processing" });
    if (names.some((n) => n.includes("extra")))
      order.push({ key: "extra", title: "Extra Configuration" });
    if (names.some((n) => n.includes("envelope")))
      order.push({ key: "envelope", title: "Envelope Breaking" });
    if (names.some((n) => n.includes("box")))
      order.push({ key: "box", title: "Box Breaking" });
    return order;
  }, [enabledModuleNames]);

  const currentStep = useMemo(
    () =>
      steps.findIndex((s) => s.status === "in-progress") + 1 ||
      steps.filter((s) => s.status === "completed").length,
    [steps]
  );

  const percent = useMemo(
    () =>
      steps.length
        ? (steps.filter((s) => s.status === "completed").length /
          steps.length) *
        100
        : 0,
    [steps]
  );

  // Load enabled modules when project changes
  useEffect(() => {
    if (!projectId) {
      setEnabledModuleNames([]);
      setSteps([]);
      return;
    }
    const loadEnabled = async () => {
      try {
        setLoadingModules(true);
        const cfgRes = await API.get(`/ProjectConfigs?ProjectId=${projectId}`);
        const cfg = Array.isArray(cfgRes.data) ? cfgRes.data[0] : cfgRes.data;
        let moduleEntries = cfg?.modules || [];

        // If IDs, map to names
        if (moduleEntries.length && typeof moduleEntries[0] === "number") {
          const modsRes = await API.get(`/Modules`);
          const allMods = modsRes.data || [];
          const idToName = new Map(allMods.map((m) => [m.id, m.name]));
          moduleEntries = moduleEntries
            .sort((a, b) => a - b)                // Sort ascending
            .map((id) => idToName.get(id))       // Map ID to name
            .filter(Boolean);
        }
        setEnabledModuleNames(moduleEntries || []);
      } catch (err) {
        console.error("Failed to load enabled modules", err);
        setEnabledModuleNames([]);
        setSteps([]);
      } finally {
        setLoadingModules(false);
      }
    };

    loadEnabled();
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !enabledModuleNames.length) return;
    const order = computeRunOrder();
    if (!order.length) {
      setSteps([]);
      return;
    }

    const preloadedSteps = order.map((step) => ({
      key: step.key,
      title: step.title,
      status: "pending",
      duration: null,
      fileUrl: fileMap[step.key] || null,
    }));

    const hasFiles = preloadedSteps.some((s) => s.fileUrl);
    setSteps((prev) => {
      if (!prev.length || prev.some((p) => p.status === "in-progress")) {
        return preloadedSteps;
      }
      const merged = order.map((step) => {
        const existing = prev.find((p) => p.key === step.key);
        return existing
          ? { ...existing, fileUrl: fileMap[step.key] || existing.fileUrl }
          : preloadedSteps.find((p) => p.key === step.key);
      });
      return merged;
    });

    if (hasFiles) {
      setSteps((prev) => prev.map((s) => {
        if (!s.fileUrl) return s;
        return {
          ...s,
          status: s.status === "failed" ? "failed" : "completed",
          duration: s.duration || "--:--",
        };
      }));
    }
  }, [projectId, enabledModuleNames, fileMap, computeRunOrder]);

  // Run order helper

  const runDuplicate = async (projectId) => {
    const queryParams = {
      ProjectId: projectId,
    };
    const query = new URLSearchParams(queryParams).toString();
    const res = await API.post(`/Duplicate?${query}`);
    const data = res?.data || {};
    const duplicatesRemoved = data.mergedRows ?? data.mergedRows ?? 0;
    message.success(`Duplicate processing completed. Duplicates removed: ${duplicatesRemoved}`);
  };

  const runExtras = async (projectId) => {
    const res = await API.post(`/ExtraEnvelopes?ProjectId=${projectId}`);
    message.success(res?.data?.message || "Extras calculation completed");
  };

  const runEnvelope = async (projectId) => {
    const res = await API.post(`/EnvelopeBreakages/EnvelopeConfiguration?ProjectId=${projectId}`);
    message.success(res?.data?.message || "Envelope breaking completed");
  };

  const runBoxBreaking = async (projectId) => {
    const res = await API.get(`/EnvelopeBreakages/Replication?ProjectId=${projectId}`);
    message.success(res?.data?.message || "Box breaking completed");
  };

  const updateStepStatus = (key, patch) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const handleAudit = async () => {
    if (!projectId) {
      message.warning("Please select a project");
      return;
    }

    const order = computeRunOrder();
    if (!order.length) {
      message.info("No enabled modules to process for this project.");
      return;
    }

    const initialSteps = order.map((o) => ({
      key: o.key,
      title: o.title,
      status: "pending",
      duration: null,
      fileUrl: null,
    }));
    setSteps(initialSteps);
    setIsProcessing(true);
    const stepTimers = new Map();

    try {
      for (const step of order) {
        updateStepStatus(step.key, { status: "in-progress" });
        stepTimers.set(step.key, Date.now());

        if (step.key === "duplicate") await runDuplicate(projectId);
        else if (step.key === "extra") await runExtras(projectId);
        else if (step.key === "envelope") await runEnvelope(projectId);
        else if (step.key === "box") await runBoxBreaking(projectId);

        const durationMs = Date.now() - (stepTimers.get(step.key) || Date.now());
        const mm = String(Math.floor(durationMs / 60000)).padStart(2, "0");
        const ss = String(Math.floor((durationMs % 60000) / 1000)).padStart(2, "0");

        const fileMap = {
          duplicate: `${url3}/${projectId}/DuplicateTool.xlsx`,
          extra: `${url3}/${projectId}/ExtrasCalculation.xlsx`,
          envelope: `${url3}/${projectId}/BreakingReport.xlsx`,
          box: `${url3}/${projectId}/BoxBreaking.xlsx`,
        };

        updateStepStatus(step.key, {
          status: "completed",
          duration: `${mm}:${ss}`,
          fileUrl: fileMap[step.key],
        });
      }

      message.success("Audit processing completed");
    } catch (err) {
      console.error("Audit failed", err);
      const failing = steps.find((s) => s.status === "in-progress") || null;
      if (failing) updateStepStatus(failing.key, { status: "failed" });
      message.error(err?.response?.data?.message || err?.message || "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Build table data
  const data = (enabledModuleNames || []).map((name) => {
    const normalized = String(name).toLowerCase();
    const step = steps.find((s) => normalized.includes(s.key)) || {};
    return {
      key: name,
      moduleName: name,
      status: step.status || "pending",
      report: step.fileUrl,
    };
  });

  const columns = [
    {
      title: "Module Name",
      dataIndex: "moduleName",
      key: "moduleName",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colorMap = {
          completed: "green",
          "in-progress": "blue",
          failed: "red",
          pending: "orange",
        };
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Report",
      dataIndex: "report",
      key: "report",
      render: (url) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
            Download
          </a>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Processing Pipeline</h2>
        <div className="text-sm flex items-center gap-2">
          <span>Status:</span>
          {isProcessing ? (
            <Badge status="processing" text="Processing" />
          ) : (
            <Badge status="default" text="Idle" />
          )}
          <Button type="primary" onClick={handleAudit} disabled={!projectId || isProcessing}>
            Audit
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium mb-1">Overall Progress</p>
        <Progress percent={percent} showInfo={false} />
        <div className="text-right text-sm mt-1">
          Step {Math.max(currentStep, 0)} of {Math.max(steps.length, 0)}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          size="small"
          title="Enabled Modules Status & Reports"
          style={{
            marginBottom: 12,
            border: "1px solid #d9d9d9",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
            loading={loadingModules}
            rowKey="key"
          />
        </Card>
      </motion.div>
    </div>
  );
};

export default ProcessingPipeline;
