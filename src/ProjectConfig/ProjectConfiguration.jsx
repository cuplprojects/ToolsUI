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
import API from "../hooks/api";

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
  const [boxCapacities, setBoxCapacities] = useState([]);
  const [selectedCapacity, setSelectedCapacity] = useState(null);
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

  const fetchProjectConfigData = async () => {
    console.log("Fetching config data for project:", projectId);

    let projectConfig = null;
    let extrasConfig = [];

    try {
      // Fetch project config data
      const projectConfigRes = await API.get(`/ProjectConfigs/ByProject/${projectId}`);
      projectConfig = projectConfigRes.data;
      console.log("Parsed Project Config:", projectConfig);
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn(`No existing configuration for ProjectId: ${projectId}`);
        // No config yet → proceed with empty defaults
      } else {
        console.error("Failed to load project config", err.response?.data || err.message);
        return;
      }
    }

    try {
      // Fetch extra config data
      const extrasConfigRes = await API.get(`/ExtrasConfigurations/ByProject/${projectId}`);
      extrasConfig = extrasConfigRes.data;
      console.log("Extras Config:", extrasConfig);
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn(`No extra configuration for ProjectId: ${projectId}`);
        // No extras yet → proceed with empty defaults
      } else {
        console.error("Failed to load extras config", err.response?.data || err.message);
      }
    }

    try {
      // Fetch box capacities
      const boxConfigRes = await API.get(`/BoxCapacities`);
      const boxConfig = boxConfigRes.data;
      console.log("Box Capacities:", boxConfig);
      setBoxCapacities(boxConfig);
      const selectedBoxCapacity = projectConfig.boxCapacity; // Assuming 'selectedCapacity' is in projectConfig
      if (selectedBoxCapacity) {
        setSelectedCapacity(selectedBoxCapacity);  // Set the selected capacity based on projectConfig
      } else if (boxConfig.length > 0) {
        // If no selectedCapacity, set the first box capacity as default (if available)
        setSelectedCapacity(boxConfig[0].id);  // Set the first capacity as the default
      }
    } catch (err) {
      console.error("Failed to load box capacities", err.response?.data || err.message);
    }

    // If project config exists, initialize states
    if (projectConfig && toolModules.length > 0) {
      const enabledNames = new Set();
      const extraModuleNames = ["Nodal Extra Calculation", "University Extra Calculation"];

      projectConfig.modules?.forEach(moduleId => {
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

      // Envelope Setup
      const envelopeParsed = JSON.parse(projectConfig.envelope || '{}');
      setInnerEnvelopes(envelopeParsed.Inner ? [envelopeParsed.Inner] : []);
      setOuterEnvelopes(envelopeParsed.Outer ? [envelopeParsed.Outer] : []);

      // Envelope Making Criteria
      setSelectedEnvelopeFields(projectConfig.envelopeMakingCriteria || []);

      // Box Breaking Criteria
      setSelectedBoxFields(fields.filter(f => projectConfig.boxBreakingCriteria?.includes(f.fieldId)).map(f => f.fieldId));
      setBoxBreakingCriteria(["capacity", ...(projectConfig.boxBreakingCriteria || [])]);
    } else {
      // No project config → initialize empty/defaults
      setEnabledModules([]);
      setInnerEnvelopes([]);
      setOuterEnvelopes([]);
      setSelectedEnvelopeFields([]);
      setSelectedBoxFields([]);
      setBoxBreakingCriteria(["capacity"]);
    }

    // Process Extra Configurations
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
  };
  // Reset form function
  const resetForm = () => {
    setEnabledModules([]);
    setInnerEnvelopes([]);
    setOuterEnvelopes([]);
    setSelectedBoxFields([]);
    setSelectedEnvelopeFields([]);
    setExtraTypeSelection({});
    setBoxCapacities([]);
    setSelectedCapacity();
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
    selectedCapacity,
    extraProcessingConfig,
    fetchProjectConfigData,
    showToast,
    resetForm
  );
  console.log(selectedCapacity)
  console.log("Type of selectedCapacity:", typeof selectedCapacity);

  // Helper function
  const isEnabled = (toolName) => enabledModules.includes(toolName);

  // Configuration status
  const envelopeConfigured = isEnabled("Envelope Breaking");
  const boxConfigured = isEnabled("Box Breaking");
  const extraConfigured = isEnabled(EXTRA_ALIAS_NAME);



  useEffect(() => {
    if (!projectId) return;
    fetchProjectConfigData();
  }, [projectId, token, extraTypes, fields, showToast, toolModules]);

  useEffect(() => {
    console.log("Box Capacities Updated:", boxCapacities);
  }, [boxCapacities]);

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
            boxCapacities={boxCapacities}
            selectedCapacity={selectedCapacity}
            setSelectedCapacity={setSelectedCapacity}
            setBoxCapacity={setBoxCapacities}
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
