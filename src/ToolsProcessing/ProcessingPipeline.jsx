import React, { useEffect, useMemo, useState } from "react";
import { Progress, Badge, Button, Select, Card, Space, Typography, List, message, Tag } from "antd";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

const { Option } = Select;
const url = import.meta.env.VITE_API_BASE_URL;
const url1 = import.meta.env.VITE_API_URL;
const url3 = import.meta.env.VITE_API_FILE_URL;

const ProcessingPipeline = () => {
  const location = useLocation();
  const initialProjectId = location?.state?.projectId ?? null;

  const token = localStorage.getItem("token");

  // Project + configuration state
  const [project, setProject] = useState(initialProjectId);
  const [projects, setProjects] = useState([]);
  const [enabledModuleNames, setEnabledModuleNames] = useState([]); // names like "Duplicate Tool", "Envelope Breaking"
  const [loadingModules, setLoadingModules] = useState(false);

  // Audit/processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState([]); // [{key,title,status:(pending|in-progress|completed|failed),duration}]

  // Overall progress
  const currentStep = useMemo(() => steps.findIndex(s => s.status === "in-progress") + 1 || steps.filter(s => s.status === "completed").length, [steps]);
  const percent = useMemo(() => (steps.length ? (steps.filter(s => s.status === "completed").length / steps.length) * 100 : 0), [steps]);


  // Fetch projects on mount
  useEffect(() => {
    axios
      .get(`${url}/Project`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setProjects(res.data || []))
      .catch(err => console.error("Failed to fetch projects", err));
  }, []);

  // Load enabled modules whenever project changes
  useEffect(() => {
    if (!project) {
      setEnabledModuleNames([]);
      return;
    }
    const loadEnabled = async () => {
      try {
        setLoadingModules(true);
        // 1) Try to get project configuration (enabled modules as IDs or names)
        const cfgRes = await axios.get(`${url1}/ProjectConfigs?ProjectId=${project}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const cfg = Array.isArray(cfgRes.data) ? cfgRes.data[0] : cfgRes.data;
        let moduleEntries = cfg?.modules || [];

        // 2) Map IDs to names if needed
        if (moduleEntries.length && typeof moduleEntries[0] === "number") {
          const modsRes = await axios.get(`${url1}/Modules`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const allMods = modsRes.data || [];
          const idToName = new Map(allMods.map(m => [m.id, m.name]));
          moduleEntries = moduleEntries.map(id => idToName.get(id)).filter(Boolean);
        }

        setEnabledModuleNames(moduleEntries || []);
      } catch (err) {
        console.error("Failed to load enabled modules", err);
        setEnabledModuleNames([]);
      } finally {
        setLoadingModules(false);
      }
    };

    loadEnabled();
  }, [project]);

  // Helpers to detect which steps to run in what order
  const computeRunOrder = () => {
    const names = (enabledModuleNames || []).map(n => String(n).toLowerCase());
    const order = [];
    if (names.some(n => n.includes("duplicate"))) order.push({ key: "duplicate", title: "Duplicate Processing" });
   if (names.some(n => n.includes("envelope"))) order.push({ key: "envelope", title: "Envelope Breaking" });
   if (names.some(n => n.includes("extras"))) order.push({ key: "extras", title: "Extras" });
   if (names.some(n => n.includes("boxbreaking"))) order.push({ key: "boxbreaking", title: "Box Breaking" });
    return order;
  };

  // Duplicate run using saved settings from localStorage
  const runDuplicate = async (projectId) => {
    const savedSettingsRaw = localStorage.getItem("duplicateToolSettings");
    if (!savedSettingsRaw) {
      message.warning("Duplicate settings not found. Please save settings in Duplicate Tool.");
      throw new Error("Missing duplicate settings");
    }

    const savedSettings = JSON.parse(savedSettingsRaw);
    const { selectedFieldIds, strategy, enhance, enhanceType, percent, mergefields } = savedSettings || {};

    if (!mergefields || !Array.isArray(selectedFieldIds) || selectedFieldIds.length === 0) {
      message.warning("Invalid duplicate settings. Please re-save in Duplicate Tool.");
      throw new Error("Invalid duplicate settings");
    }

    const queryParams = {
      ProjectId: projectId,
      consolidate: strategy === "consolidate",
      mergefields,
    };

    if (enhance) {
      if (enhanceType === "percent") {
        queryParams.enhancement = true;
        queryParams.percent = percent;
      } else if (enhanceType === "round") {
        queryParams.enhancement = false;
        queryParams.percent = 0;
      }
    }

    const query = new URLSearchParams(queryParams).toString();

    const res = await axios.post(`${url1}/Duplicate?${query}`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = res?.data || {};
    const duplicatesRemoved = data.duplicatesRemoved ?? data.removedCount ?? data.duplicates ?? 0;
    message.success(`Duplicate processing completed. Duplicates removed: ${duplicatesRemoved}`);
  };

  
  // Envelope Breaking
  const runEnvelope = async (project) => {
    console.log("Audit clicked - calling envelope API");
    const res = await axios.post(
      `${url1}/EnvelopeBreakages/EnvelopeConfiguration?ProjectId=${project}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const msg = res?.data?.message || "Envelope breaking completed";
    message.success(msg);
  };

  const runExtras = async(projectId) =>{
    const res = await axios.post(
      `${url1}/ExtraEnvelopes?ProjectId=${projectId}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
     const msg = res?.data?.message || "Extras calculation completed";
    message.success(msg);
  }

  const BoxBreaking = async(projectId) =>{
    const res = await axios.post(
      `${url1}/EnvelopeBreakages/Replication?ProjectId=${projectId}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } } 
    )
       const msg = res?.data?.message || "Box breaking has been completed";
    message.success(msg);
  }

  const updateStepStatus = (key, patch) => {
    setSteps(prev => prev.map(s => (s.key === key ? { ...s, ...patch } : s)));
  };

  const handleAudit = async () => {
    if (!project) {
      message.warning("Please select a project");
      return;
    }

    const order = computeRunOrder();
    if (!order.length) {
      message.info("No enabled modules to process for this project.");
      return;
    }

    // Initialize steps view
    const initialSteps = order.map(o => ({ key: o.key, title: o.title, status: "pending", duration: null, fileUrl: null, }));
    setSteps(initialSteps);
    setIsProcessing(true);

    const stepTimers = new Map();

    try {
      for (const step of order) {
        // Mark in-progress
        updateStepStatus(step.key, { status: "in-progress" });
        stepTimers.set(step.key, Date.now());

        if (step.key === "duplicate") {
          await runDuplicate(project);
        } else if (step.key === "envelope") {
          await runEnvelope(project);
        }
        else if(step.key ==="extras"){
          await runExtras(project)
        }
        else if(step.key === "boxbreaking"){
          await BoxBreaking(project);
        }

        const durationMs = Date.now() - (stepTimers.get(step.key) || Date.now());
        const mm = String(Math.floor(durationMs / 60000)).padStart(2, "0");
        const ss = String(Math.floor((durationMs % 60000) / 1000)).padStart(2, "0");
        updateStepStatus(step.key, {
        status: "completed",
       duration: `${mm}:${ss}`,
         fileUrl: step.key === "duplicate" 
      ? `${url3}/DuplicateTool_${project}.xlsx`
      : step.key === "envelope"
      ? `${url3}/EnvelopeBreaking_${project}.xlsx`
      : step.key === "extras"
      ? `${url3}/Extras_${project}.xlsx`
      : `${url3}/BoxBreaking_${project}.xlsx`,
  });
      }

      message.success("Audit processing completed");
    } catch (err) {
      console.error("Audit failed", err);
      // Mark current step failed
      const failing = steps.find(s => s.status === "in-progress") || null;
      if (failing) updateStepStatus(failing.key, { status: "failed" });
      message.error(err?.response?.data?.message || err?.message || "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProjectChange = (value) => {
    setProject(value);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Processing Pipeline</h2>
        <div className="text-sm flex items-center gap-2">
          <span>Project:</span>
          <Select
            size="small"
            style={{ minWidth: 220 }}
            placeholder="Select Project"
            value={project}
            onChange={handleProjectChange}
          >
            <Option value="">Choose a Project...</Option>
            {projects.map((p) => (
              <Option key={p.projectId} value={p.projectId}>
                {p.name} (ID: {p.projectId})
              </Option>
            ))}
          </Select>

          <span>Status:</span>
          {isProcessing ? (
            <Badge status="processing" text="Processing" />
          ) : (
            <Badge status="default" text="Idle" />
          )}

          <Button type="primary" onClick={handleAudit} disabled={!project || isProcessing}>
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
        whileHover={{
          scale: 1.05,
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
        }}
        transition={{ duration: 0.3 }}
      >
        <Card size="small" title="Enabled Modules for Selected Project" style={{ marginBottom: 12, border: '1px solid #d9d9d9', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          {loadingModules ? (
            <Text type="secondary">Loading modules…</Text>
          ) : enabledModuleNames?.length ? (
            <Space direction="vertical">
              {enabledModuleNames.map((name) => (
                <Tag key={name}>{name}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">No modules enabled or not loaded.</Text>
          )}
        </Card>
      </motion.div>

      <ul className="space-y-4">
        {steps.map((step, index) => (
          <li key={step.key} className="flex items-start space-x-2">
            <div className="w-5 flex justify-center">
              {step.status === "completed" ? (
                <span className="text-green-500">✔</span>
              ) : step.status === "in-progress" ? (
                <span className="text-blue-500">⏳</span>
              ) : step.status === "failed" ? (
                <span className="text-red-500">✖</span>
              ) : (
                <span className="text-gray-400">{index + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{step.title}</p>
              <p className="text-xs text-gray-500">
                {step.status === "pending" && "Waiting to start"}
                {step.status === "in-progress" && "Running…"}
                {step.status === "completed" && `Completed in ${step.duration || "--:--"}`}
                {step.status === "failed" && "Failed"}
              </p>
              {step.fileUrl && (
                <a
                  href={step.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-xs underline"
                >
                  Download Result
                </a>
              )}
            </div>
            {step.duration && (
              <div className="text-xs text-gray-400">{step.duration}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProcessingPipeline;