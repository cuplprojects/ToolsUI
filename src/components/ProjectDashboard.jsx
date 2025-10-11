import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Progress, Button, Card, Table, Tag, Typography, message, Badge } from 'antd';
import { motion } from 'framer-motion';
import API from '../hooks/api';
import useStore from '../stores/ProjectData';

const { Text, Title } = Typography;
const url3 = import.meta.env.VITE_API_FILE_URL;

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const projectId = useStore((state) => state.projectId);
  const projectName = useStore((state) => state.projectName);

  // State from DataImport.jsx
  const [existingData, setExistingData] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // State from ProcessingPipeline.jsx
  const [enabledModuleNames, setEnabledModuleNames] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState([]);

  // --- Logic from DataImport.jsx --- 
  const fetchExistingData = async () => {
    if (!projectId) return;
    setLoadingData(true);
    try {
      const res = await API.get(`/NRDatas/GetByProjectId/${projectId}`);
      setExistingData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch existing data", err);
      setExistingData([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchConflictReport = async () => {
    if (!projectId) return;
    setLoadingData(true);
    try {
      const res = await API.get(`/NRDatas/ErrorReport?ProjectId=${projectId}`);
      if (res.data?.duplicatesFound) {
        setConflicts(res.data);
      } else {
        setConflicts({ errors: [] });
      }
    } catch (err) {
      console.error("Failed to fetch conflict report", err);
    } finally {
      setLoadingData(false);
    }
  };

  // --- Logic from ProcessingPipeline.jsx ---
  const computeRunOrder = (names = []) => {
    const lowerNames = names.map((n) => String(n).toLowerCase());
    const order = [];
    if (lowerNames.some((n) => n.includes("duplicate"))) order.push({ key: "duplicate", title: "Duplicate Processing" });
    if (lowerNames.some((n) => n.includes("extra"))) order.push({ key: "extra", title: "Extra Configuration" });
    if (lowerNames.some((n) => n.includes("envelope"))) order.push({ key: "envelope", title: "Envelope Breaking" });
    if (lowerNames.some((n) => n.includes("box"))) order.push({ key: "box", title: "Box Breaking" });
    return order;
  };

  const updateStepStatus = (key, patch) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const checkReportExistence = async (projectId) => {
    const fileNames = {
      duplicate: "DuplicateTool.xlsx",
      extra: "ExtrasCalculation.xlsx",
      envelope: "BreakingReport.xlsx",
      box: "BoxBreaking.xlsx",
    };

    await Promise.all(
      Object.entries(fileNames).map(async ([key, fileName]) => {
        try {
          const res = await API.get(`/EnvelopeBreakages/Reports/Exists?projectId=${projectId}&fileName=${fileName}`);
          if (res.data.exists) {
            const fileUrl = `${url3}/${projectId}/${fileName}`;
            updateStepStatus(key, { status: "completed", fileUrl, duration: "--:--" });
          }
        } catch (err) {
          console.error(`Failed to check file: ${fileName}`, err);
        }
      })
    );
  };

  const loadEnabledModules = async () => {
    if (!projectId) return;
    try {
      setLoadingModules(true);
      const cfgRes = await API.get(`/ProjectConfigs?ProjectId=${projectId}`);
      const cfg = Array.isArray(cfgRes.data) ? cfgRes.data[0] : cfgRes.data;
      let moduleEntries = cfg?.modules || [];

      if (moduleEntries.length && typeof moduleEntries[0] === "number") {
        const modsRes = await API.get(`/Modules`);
        const allMods = modsRes.data || [];
        const idToName = new Map(allMods.map((m) => [m.id, m.name]));
        moduleEntries = moduleEntries.sort((a, b) => a - b).map((id) => idToName.get(id)).filter(Boolean);
      }
      setEnabledModuleNames(moduleEntries || []);
      const order = computeRunOrder(moduleEntries);
      const initialSteps = order.map((o) => ({ key: o.key, title: o.title, status: "pending", duration: null, fileUrl: null }));
      setSteps(initialSteps);
      await checkReportExistence(projectId);
    } catch (err) {
      console.error("Failed to load enabled modules", err);
    } finally {
      setLoadingModules(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchExistingData();
      fetchConflictReport();
      loadEnabledModules();
    }
  }, [projectId]);

  const handleRunPipeline = async () => {
    if (!projectId) return message.warning("Please select a project");
    const order = computeRunOrder(enabledModuleNames);
    if (!order.length) return message.info("No enabled modules to process.");

    setIsProcessing(true);
    const stepTimers = new Map();

    try {
      for (const step of order) {
        updateStepStatus(step.key, { status: "in-progress" });
        stepTimers.set(step.key, Date.now());

        if (step.key === "duplicate") await API.post(`/Duplicate?ProjectId=${projectId}`);
        else if (step.key === "extra") await API.post(`/ExtraEnvelopes?ProjectId=${projectId}`);
        else if (step.key === "envelope") await API.post(`/EnvelopeBreakages/EnvelopeConfiguration?ProjectId=${projectId}`);
        else if (step.key === "box") await API.get(`/EnvelopeBreakages/Replication?ProjectId=${projectId}`);

        const durationMs = Date.now() - (stepTimers.get(step.key) || Date.now());
        const mm = String(Math.floor(durationMs / 60000)).padStart(2, "0");
        const ss = String(Math.floor((durationMs % 60000) / 1000)).padStart(2, "0");

        const fileMap = {
          duplicate: `${url3}/${projectId}/DuplicateTool.xlsx`,
          extra: `${url3}/${projectId}/ExtrasCalculation.xlsx`,
          envelope: `${url3}/${projectId}/BreakingReport.xlsx`,
          box: `${url3}/${projectId}/BoxBreaking.xlsx`,
        };

        updateStepStatus(step.key, { status: "completed", duration: `${mm}:${ss}`, fileUrl: fileMap[step.key] });
      }
      message.success("Processing pipeline completed!");
    } catch (err) {
      const failing = steps.find((s) => s.status === "in-progress") || null;
      if (failing) updateStepStatus(failing.key, { status: "failed" });
      message.error(err?.response?.data?.message || "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const percent = useMemo(() =>
    steps.length ? (steps.filter((s) => s.status === "completed").length / steps.length) * 100 : 0,
    [steps]
  );

  const currentStep = useMemo(() =>
    steps.findIndex((s) => s.status === "in-progress") + 1 || steps.filter((s) => s.status === "completed").length,
    [steps]
  );

  const columns = [
    { title: "Module Name", dataIndex: "title", key: "title" },
    {
      title: "Status", dataIndex: "status", key: "status",
      render: (status) => {
        const colorMap = { completed: "green", "in-progress": "blue", failed: "red", pending: "orange" };
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Report", dataIndex: "fileUrl", key: "report",
      render: (url) => url ? <a href={url} target="_blank" rel="noopener noreferrer">Download</a> : <Text type="secondary">—</Text>,
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Title level={2} className="mb-4">Project: {projectName}</Title>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card title="Processing Pipeline" bordered={false} className="shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex-grow">
                  <p className="text-sm font-medium mb-1">Overall Progress ({Math.round(percent)}%)</p>
                  <Progress percent={percent} showInfo={false} />
                  <div className="text-right text-sm mt-1">Step {currentStep} of {steps.length}</div>
                </div>
                <Button type="primary" onClick={handleRunPipeline} loading={isProcessing} disabled={!projectId || steps.every(s => s.status === 'completed')} className="ml-6">
                  {isProcessing ? 'Running...' : 'Run Pipeline'}
                </Button>
              </div>
              <Table columns={columns} dataSource={steps} pagination={false} loading={loadingModules} rowKey="key" size="small" />
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card title="Data Health" bordered={false} className="shadow-lg">
              {loadingData ? <p>Loading data...</p> : 
                <div className="space-y-4">
                  <div>
                    <Text strong>Records Imported</Text>
                    <p className="text-3xl font-bold">{existingData.length}</p>
                    {existingData.length === 0 && <Button onClick={() => navigate('/data-import')} className="mt-2">Import Data</Button>}
                  </div>
                  <div>
                    <Text strong>Data Conflicts</Text>
                    <p className={`text-3xl font-bold ${conflicts?.errors?.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {conflicts ? conflicts.errors.length : '...'}
                    </p>
                    {conflicts?.errors?.length > 0 && <Button danger onClick={() => navigate('/data-import', { state: { activeTab: '2' } })} className="mt-2">View/Resolve Conflicts</Button>}
                  </div>
                </div>
              }
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card title="Quick Actions" bordered={false} className="shadow-lg">
              <div className="flex flex-col space-y-2">
                <Button onClick={() => navigate('/project-config')}>Project Configuration</Button>
                <Button onClick={() => navigate('/reports')}>View Reports</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;