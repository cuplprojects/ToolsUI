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
import { div } from "framer-motion/client";
import axios from "axios";

const { Title, Text } = Typography;
const { Option } = Select;

const url = import.meta.env.VITE_API_BASE_URL ;

const ToolSetupForm = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);
  const [boxBreakingCriteria, setBoxBreakingCriteria] = useState([]);
  const [projects, setProjects] = useState([]);
  const [nodalExtraType, setNodalExtraType] = useState("Fixed");
  const [univExtraType, setUnivExtraType] = useState("Fixed");
const token = localStorage.getItem('token');
  const [extraProcessingConfig, setExtraProcessingConfig] = useState({
    nodal: { fixedQty: 10, range: 5, percentage: 2.5 },
    university: { fixedQty: 5, range: 3, percentage: 1.5 },
  });

  useEffect(()=> {
    axios.get(`${url}/Project`, {
      headers: { Authorization : `Bearer ${token}`,}
    }) 
    .then(res => setProjects(res.data))
    .catch(err => console.error("Failed to fetch projects",err));
      
  }, [])

  const handleSave = () => {
    const payload = {
      projectId: selectedProject,
      modules: enabledModules,
      boxBreakingCriteria,
      extraProcessingConfig,
    };
    console.log("Payload:", payload);
  };

  const isEnabled = (toolName) => enabledModules.includes(toolName);

  const toolLabels = {
    DUPLICATE: "Duplicate & Merge Consolidation",
    LOT: "Lot Creation",
    ENVELOPE: "Envelope Breaking",
    NODAL: "Nodal Extra Calculation",
    UNIVERSITY: "University Extra Calculation",
    BOX: "Box Breaking",
  };

  const renderDisabledMessage = (enabled) =>
    !enabled && (
      <Text type="primary" style={{ display: "block", marginTop: 16, fontWeight: "bold",color:"red" }}>
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
    <div style={{padding: 16, width: "100%",boxSizing: "border-box"}}>
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
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                <Option value="">Choose a Project...</Option>
                {projects.map(project => (
                  <Option key={project.projectId} value={project.projectId}>{project.name}</Option>
                ))}
              </Select>
            </Form.Item>

            {selectedProject && (
              <>
                <Divider />
                <Title level={5}>Enable Modules:</Title>
                <Checkbox.Group
                  options={Object.values(toolLabels)}
                  value={enabledModules}
                  onChange={setEnabledModules}
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                />
              </>
            )}
          </Card>
        </Col>

        {/* Envelope Setup */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card title="Envelope Setup" style={cardStyle}>
            <Form.Item label="Default Inner Envelope">
              <Select
                placeholder="Select inner envelope"
                disabled={!isEnabled(toolLabels.ENVELOPE)}
              >
                <Option value="A5">A5</Option>
                <Option value="A4">A4</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Default Outer Envelope">
              <Select
                placeholder="Select outer envelope"
                disabled={!isEnabled(toolLabels.ENVELOPE)}
              >
                <Option value="B5">B5</Option>
                <Option value="B4">B4</Option>
              </Select>
            </Form.Item>
            {renderDisabledMessage(isEnabled(toolLabels.ENVELOPE))}
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
              options={["Route Change", "Nodal Change", "Date Change", "Center Change"]}
              value={boxBreakingCriteria}
              onChange={setBoxBreakingCriteria}
              disabled={!isEnabled(toolLabels.BOX)}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            />
            {renderDisabledMessage(isEnabled(toolLabels.BOX))}
          </Card>
        </Col>

        {/* Extra Processing Config */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card title="Extra Processing Configuration" style={cardStyle}>
            <Title level={5}>Nodal Extra</Title>
            <Radio.Group
              value={nodalExtraType}
              onChange={(e) => setNodalExtraType(e.target.value)}
              disabled={!isEnabled(toolLabels.NODAL)}
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
                disabled={!isEnabled(toolLabels.NODAL)}
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
                disabled={!isEnabled(toolLabels.NODAL)}
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
                disabled={!isEnabled(toolLabels.NODAL)}
                addonBefore="Percentage"
              />
            )}

            <Divider />

            <Title level={5}>University Extra</Title>
            <Radio.Group
              value={univExtraType}
              onChange={(e) => setUnivExtraType(e.target.value)}
              disabled={!isEnabled(toolLabels.UNIVERSITY)}
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
                disabled={!isEnabled(toolLabels.UNIVERSITY)}
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
                disabled={!isEnabled(toolLabels.UNIVERSITY)}
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
                disabled={!isEnabled(toolLabels.UNIVERSITY)}
                addonBefore="Percentage"
              />
            )}

            {renderDisabledMessage(
              isEnabled(toolLabels.NODAL) || isEnabled(toolLabels.UNIVERSITY)
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

export default ToolSetupForm;
