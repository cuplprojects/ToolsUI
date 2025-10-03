import React, { useState, useEffect } from "react";
import { Row, Col } from "antd";
import { useToast } from '../hooks/useToast';
import useStore from "../stores/ProjectData";
import { useProjectConfigData } from "./hooks/useProjectConfigData";  // Custom hook for fetching config data
import { useProjectConfigSave } from "./hooks/useProjectConfigSave";
import ModuleSelectionCard from "./components/ModuleSelectionCard";
import EnvelopeSetupCard from "./components/EnvelopeSetupCard";
import EnvelopeMakingCriteriaCard from "./components/EnvelopeMakingCriteriaCard";
import ExtraProcessingCard from "./components/ExtraProcessingCard";
import BoxBreakingCard from "./components/BoxBreakingCard";
import ConfigSummaryCard from "./components/ConfigSummaryCard";
import { EXTRA_ALIAS_NAME } from "./components/constants";
import axios from "axios";

const ProjectConfiguration = () => {
  const { showToast } = useToast();
  const projectId = useStore((state) => state.projectId);
  const token = localStorage.getItem("token");

  // State management
  const [enabledModules, setEnabledModules] = useState([]);
  const [boxBreakingCriteria, setBoxBreakingCriteria] = useState(["capacity"]);
  const [innerEnvelopes, setInnerEnvelopes] = useState([]);
  const [outerEnvelopes, setOuterEnvelopes] = useState([]);
  const [extraProcessingConfig, setExtraProcessingConfig] = useState({});
  const [selectedEnvelopeFields, setSelectedEnvelopeFields] = useState([]);
  const [selectedBoxFields, setSelectedBoxFields] = useState([]);

  // Fetch data using custom hook
  const {
    toolModules,
    envelopeOptions,
    extraTypes,
    fields,
    mergedModules,
    extraTypeSelection,
    setExtraTypeSelection,
  } = useProjectConfigData(token);

  // Reset form function
  const resetForm = () => {
    setEnabledModules([]);
    setInnerEnvelopes([]);
    setOuterEnvelopes([]);
    setSelectedBoxFields([]);
    setSelectedEnvelopeFields([]);
    setExtraTypeSelection({});
  };

  // Save logic using custom hook
  const { handleSave } = useProjectConfigSave(
    projectId,
    enabledModules,
    toolModules,
    innerEnvelopes,
    outerEnvelopes,
    selectedBoxFields,
    selectedEnvelopeFields,
    extraTypeSelection,
    extraTypes,
    extraProcessingConfig,
    showToast,
    resetForm
  );

  // Helper function
  const isEnabled = (toolName) => enabledModules.includes(toolName);

  // Configuration status
  const envelopeConfigured = isEnabled("Envelope Breaking");
  const boxConfigured = isEnabled("Box Breaking");
  const extraConfigured = isEnabled(EXTRA_ALIAS_NAME);



  // Fetch Project and Extra Config Data on Mount
  useEffect(() => {
    if (!projectId) return;

    const fetchProjectConfigData = async () => {
      try {
        // Fetch project and extra config using axios
        const [projectConfigRes, extrasConfigRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/ProjectConfigs/ByProject/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/ExtrasConfigurations/ByProject/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const projectConfig = projectConfigRes.data;
        const extrasConfig = extrasConfigRes.data;

        if (projectConfig.modules && toolModules.length > 0) {
          const enabledNames = new Set();
          const extraModuleNames = ["Nodal Extra Calculation", "University Extra Calculation"];

          projectConfig.modules.forEach(moduleId => {
            const module = toolModules.find(m => m.id === moduleId);
            if (module) {
              if (extraModuleNames.includes(module.name)) {
                enabledNames.add("Extra Configuration");
              } else {
                enabledNames.add(module.name);
              }
            }
          });
          setEnabledModules(Array.from(enabledNames));
        }

        // Parse Envelope Setup
        const envelopeParsed = JSON.parse(projectConfig.envelope);
        setInnerEnvelopes(envelopeParsed.Inner ? [envelopeParsed.Inner] : []);
        setOuterEnvelopes(envelopeParsed.Outer ? [envelopeParsed.Outer] : []);

        // Envelope Making Criteria
        setSelectedEnvelopeFields(projectConfig.envelopeMakingCriteria || []);

        // Box Breaking Criteria
        setSelectedBoxFields(fields.filter(f => projectConfig.boxBreakingCriteria?.includes(f.fieldId)).map(f => f.fieldId));
        setBoxBreakingCriteria(["capacity", ...(projectConfig.boxBreakingCriteria || [])]);

        // Extra Configurations
        const extraProcessingParsed = {};
        const extraSelections = {};

        extrasConfig.forEach(item => {
          const type = extraTypes.find(e => e.extraTypeId === item.extraType)?.type;
          if (!type) return;

          const env = item.envelopeType ? JSON.parse(item.envelopeType) : { Inner: "", Outer: "" };
          extraProcessingParsed[type] = {
            envelopeType: {
              inner: env.Inner ? [env.Inner] : [],
              outer: env.Outer ? [env.Outer] : [],
            },
            fixedQty: item.mode === "Fixed" ? parseFloat(item.value) : 0,
            range: item.mode === "Range" ? parseFloat(item.value) : 0,
            percentage: item.mode === "Percentage" ? parseFloat(item.value) : 0,
          };
          extraSelections[type] = item.mode;
        });

        setExtraProcessingConfig(extraProcessingParsed);
        setExtraTypeSelection(extraSelections);
      } catch (err) {
        console.error("Failed to load config data", err);
        showToast("error", "Failed to load project configuration");
      }
    };

    fetchProjectConfigData();
  }, [projectId, token, extraTypes, fields, showToast, toolModules]);

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16} align="top">
        {/* LEFT SIDE */}
        <Col xs={24} md={16}>
          <ModuleSelectionCard
            mergedModules={mergedModules}
            enabledModules={enabledModules}
            setEnabledModules={setEnabledModules}
          />

          <EnvelopeSetupCard
            isEnabled={isEnabled}
            innerEnvelopes={innerEnvelopes}
            setInnerEnvelopes={setInnerEnvelopes}
            outerEnvelopes={outerEnvelopes}
            setOuterEnvelopes={setOuterEnvelopes}
            envelopeOptions={envelopeOptions}
          />

          <EnvelopeMakingCriteriaCard
            isEnabled={isEnabled}
            fields={fields}
            selectedEnvelopeFields={selectedEnvelopeFields}
            setSelectedEnvelopeFields={setSelectedEnvelopeFields}
          />

          <ExtraProcessingCard
            isEnabled={isEnabled}
            extraTypes={extraTypes}
            extraTypeSelection={extraTypeSelection}
            setExtraTypeSelection={setExtraTypeSelection}
            extraProcessingConfig={extraProcessingConfig}
            setExtraProcessingConfig={setExtraProcessingConfig}
            envelopeOptions={envelopeOptions}
          />
        </Col>

        {/* RIGHT SIDE */}
        <Col xs={24} md={8}>
          <BoxBreakingCard
            isEnabled={isEnabled}
            boxBreakingCriteria={boxBreakingCriteria}
            setBoxBreakingCriteria={setBoxBreakingCriteria}
            fields={fields}
            selectedBoxFields={selectedBoxFields}
            setSelectedBoxFields={setSelectedBoxFields}
          />

          <ConfigSummaryCard
            enabledModules={enabledModules}
            envelopeConfigured={envelopeConfigured}
            boxConfigured={boxConfigured}
            extraConfigured={extraConfigured}
            handleSave={handleSave}
            projectId={projectId}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ProjectConfiguration; 
