import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Select,
  Checkbox,
  Divider,
  InputNumber,
  Typography,
  Button,
  Card,
  Form,
  Radio,
} from "antd";
import axios from "axios";

const { Title, Text } = Typography;
const { Option } = Select;

const url = import.meta.env.VITE_API_BASE_URL;
const url1 = import.meta.env.VITE_API_URL;

const ProjectConfiguration = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);
  const [boxBreakingCriteria, setBoxBreakingCriteria] = useState([]);
  const [projects, setProjects] = useState([]);
  const [toolModules, setToolModules] = useState([]);
  const [nodalExtraType, setNodalExtraType] = useState("Fixed");
  const [univExtraType, setUnivExtraType] = useState("Fixed");
  const [envelope, setEnvelope] = useState(""); // Added envelope state
  const token = localStorage.getItem("token");
    // New: envelope types and selections
  const [envelopeOptions, setEnvelopeOptions] = useState([]);
  const [innerEnvelopes, setInnerEnvelopes] = useState([]);
  const [outerEnvelopes, setOuterEnvelopes] = useState([]);

  const [extraProcessingConfig, setExtraProcessingConfig] = useState({
    nodal: { fixedQty: 10, range: 5, percentage: 2.5 },
    university: { fixedQty: 5, range: 3, percentage: 1.5 },
  });

  // Fetch Projects
  useEffect(() => {
    axios
      .get(`${url}/Project`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProjects(res.data))
      .catch((err) => console.error("Failed to fetch projects", err));
  }, []);

  // Fetch Tools from Modules
  useEffect(() => {
    axios
      .get(`${url1}/Modules`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setToolModules(res.data))
      .catch((err) => console.error("Failed to fetch modules", err));
  }, []);

   useEffect(() => {
    axios
      .get(`${url1}/EnvelopeTypes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setEnvelopeOptions(res.data))
      .catch((err) => console.error("Failed to fetch envelope types", err));
  }, []);

  const handleSave = async () => {
    const moduleIds = toolModules
      .filter((mod) => enabledModules.includes(mod.name))
      .map((mod) => mod.id);

    const boxBreakingMap = {
      "Route Change": 0,
      "Nodal Change": 1,
      "Date Change": 2,
      "Center Change": 3,
    };

    const boxBreakingIds = boxBreakingCriteria.map(
      (crit) => boxBreakingMap[crit]
    );

    const extrasPayload = {
      nodalExtraType,
      universityExtraType: univExtraType,
      config: extraProcessingConfig,
    };

      const getEnvelopeNames = (ids) =>
    envelopeOptions
      .filter((e) => ids.includes(e.envelopeId))
      .map((e) => e.envelopeName)
      .join(",");

  const envelopePayload = {
    Inner: getEnvelopeNames(innerEnvelopes),
    Outer: getEnvelopeNames(outerEnvelopes),
  };


    const payload = {
      id: 0,
      projectId: selectedProject,
      modules: moduleIds,
      envelope:JSON.stringify(envelopePayload),
      boxBreaking: boxBreakingIds,
      extras: JSON.stringify(extrasPayload),
    };

    console.log("Submitting Payload:", payload);

    try {
      const response = await axios.post(`${url1}/ProjectConfigs`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Configuration saved successfully:", response.data);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const isEnabled = (toolName) => enabledModules.includes(toolName);

  const renderDisabledMessage = (enabled) =>
    !enabled && (
      <Text
        type="primary"
        style={{
          display: "block",
          marginTop: 16,
          fontWeight: "bold",
          color: "red",
        }}
      >
        ⚠️ Enable the respective option to configure this section.
      </Text>
    );

  const cardStyle = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  return (
    <div style={{ padding: 16, width: "100%", boxSizing: "border-box" }}>
      <Form layout="vertical">
        <Row gutter={[16, 16]} justify="start">
          {/* Tool Selection */}
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card title="Tool Selection" style={cardStyle}>
              <Form.Item label="Select Project">
                <Select
                  showSearch
                  placeholder="Choose a project..."
                  onChange={setSelectedProject}
                  filterOption={(input, option) =>
                    option.children
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  <Option value="">Choose a Project...</Option>
                  {projects.map((project) => (
                    <Option key={project.projectId} value={project.projectId}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedProject && (
                <>
                  <Divider />
                  <Title level={5}>Enable Modules:</Title>
                  <Checkbox.Group
                    options={toolModules.map((tool) => ({
                      label: tool.name,
                      value: tool.name,
                    }))}
                    value={enabledModules}
                    onChange={setEnabledModules}
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  />
                </>
              )}
            </Card>
          </Col>

                    {/* Envelope Setup */}
          <Col xs={24} sm={24} md={12}>
            <Card title="Envelope Setup" style={cardStyle}>
              <Form.Item label="Inner Envelope(s)">
                <Select
                  mode="multiple"
                  placeholder="Select inner envelope(s)"
                  disabled={!isEnabled("Envelope Breaking")}
                  value={innerEnvelopes}
                  onChange={setInnerEnvelopes}
                >
                  {envelopeOptions.map((e) => (
                    <Option key={e.envelopeId} value={e.envelopeId}>
                      {e.envelopeName} (Capacity: {e.capacity})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Outer Envelope(s)">
                <Select
                  mode="multiple"
                  placeholder="Select outer envelope(s)"
                  disabled={!isEnabled("Envelope Breaking")}
                  value={outerEnvelopes}
                  onChange={setOuterEnvelopes}
                >
                  {envelopeOptions.map((e) => (
                    <Option key={e.envelopeId} value={e.envelopeId}>
                      {e.envelopeName} (Capacity: {e.capacity})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {renderDisabledMessage(isEnabled("Envelope Breaking"))}
            </Card>
          </Col>

          {/* Box Breaking Criteria */}
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card title="Box Breaking Criteria" style={cardStyle}>
              <p>
                <b>Capacity</b> (Always On)
              </p>
              <p>Boxes break automatically when capacity is reached</p>
              <Checkbox.Group
                options={[
                  "Route Change",
                  "Nodal Change",
                  "Date Change",
                  "Center Change",
                ]}
                value={boxBreakingCriteria}
                onChange={setBoxBreakingCriteria}
                disabled={!isEnabled("Box Breaking")}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              />
              {renderDisabledMessage(isEnabled("Box Breaking"))}
            </Card>
          </Col>

          {/* Extra Processing Config */}
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card title="Extra Processing Configuration" style={cardStyle}>
              <Title level={5}>Nodal Extra</Title>
              <Radio.Group
                value={nodalExtraType}
                onChange={(e) => setNodalExtraType(e.target.value)}
                disabled={!isEnabled("Nodal Extra Calculation")}
                style={{ marginBottom: 10 }}
              >
                <Radio value="Fixed">Fixed Qty</Radio>
                <Radio value="Range">Range (%)</Radio>
                <Radio value="Percentage">Percentage</Radio>
              </Radio.Group>

              {nodalExtraType === "Fixed" && (
                <InputNumber
                  value={extraProcessingConfig.nodal.fixedQty}
                  onChange={(val) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      nodal: { ...prev.nodal, fixedQty: val },
                    }))
                  }
                  disabled={!isEnabled("Nodal Extra Calculation")}
                  addonBefore="Fixed Qty"
                />
              )}
              {nodalExtraType === "Range" && (
                <InputNumber
                  value={extraProcessingConfig.nodal.range}
                  onChange={(val) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      nodal: { ...prev.nodal, range: val },
                    }))
                  }
                  disabled={!isEnabled("Nodal Extra Calculation")}
                  addonBefore="Range (%)"
                />
              )}
              {nodalExtraType === "Percentage" && (
                <InputNumber
                  value={extraProcessingConfig.nodal.percentage}
                  onChange={(val) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      nodal: { ...prev.nodal, percentage: val },
                    }))
                  }
                  disabled={!isEnabled("Nodal Extra Calculation")}
                  addonBefore="Percentage"
                />
              )}

              <Divider />

              <Title level={5}>University Extra</Title>
              <Radio.Group
                value={univExtraType}
                onChange={(e) => setUnivExtraType(e.target.value)}
                disabled={!isEnabled("University Extra Calculation")}
                style={{ marginBottom: 10 }}
              >
                <Radio value="Fixed">Fixed Qty</Radio>
                <Radio value="Range">Range (%)</Radio>
                <Radio value="Percentage">Percentage</Radio>
              </Radio.Group>

              {univExtraType === "Fixed" && (
                <InputNumber
                  value={extraProcessingConfig.university.fixedQty}
                  onChange={(val) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      university: { ...prev.university, fixedQty: val },
                    }))
                  }
                  disabled={!isEnabled("University Extra Calculation")}
                  addonBefore="Fixed Qty"
                />
              )}
              {univExtraType === "Range" && (
                <InputNumber
                  value={extraProcessingConfig.university.range}
                  onChange={(val) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      university: { ...prev.university, range: val },
                    }))
                  }
                  disabled={!isEnabled("University Extra Calculation")}
                  addonBefore="Range (%)"
                />
              )}
              {univExtraType === "Percentage" && (
                <InputNumber
                  value={extraProcessingConfig.university.percentage}
                  onChange={(val) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      university: { ...prev.university, percentage: val },
                    }))
                  }
                  disabled={!isEnabled("University Extra Calculation")}
                  addonBefore="Percentage"
                />
              )}

              {renderDisabledMessage(
                isEnabled("Nodal Extra Calculation") ||
                  isEnabled("University Extra Calculation")
              )}
            </Card>
          </Col>

          {/* Save Button */}
          <Col span={24} style={{ textAlign: "center", marginTop: 1 }}>
            <Button type="primary" onClick={handleSave}>
              Save Configuration
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ProjectConfiguration;
