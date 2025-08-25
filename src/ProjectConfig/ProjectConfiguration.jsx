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
  Tag,
  List,
} from "antd";
import {
  AppstoreOutlined,
  ToolOutlined,
  MailOutlined,
  InboxOutlined,
  LockOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { div, span } from "framer-motion/client";

const { Title, Text } = Typography;
const { Option } = Select;

const url = import.meta.env.VITE_API_BASE_URL;
const url1 = import.meta.env.VITE_API_URL;

const PRIMARY_COLOR = "#1677ff"; // Ant Design default primary color

const ProjectConfiguration = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);
  const [boxBreakingCriteria, setBoxBreakingCriteria] = useState(["capacity"]);
  const [projects, setProjects] = useState([]);
  const [toolModules, setToolModules] = useState([]);
  const [nodalExtraType, setNodalExtraType] = useState("Fixed");
  const [univExtraType, setUnivExtraType] = useState("Fixed");
  const [innerEnvelopes, setInnerEnvelopes] = useState([]);
  const [outerEnvelopes, setOuterEnvelopes] = useState([]);
  const [envelopeOptions, setEnvelopeOptions] = useState([]);

  const [extraProcessingConfig, setExtraProcessingConfig] = useState({
    nodal: { fixedQty: 10, range: 5, percentage: 2.5 },
    university: { fixedQty: 5, range: 3, percentage: 1.5 },
  });

  const token = localStorage.getItem("token");

  // Fetch Projects
  useEffect(() => {
    axios
      .get(`${url}/Project`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setProjects(res.data))
      .catch((err) => console.error("Failed to fetch projects", err));
  }, []);

  // Fetch Modules
  useEffect(() => {
    axios
      .get(`${url1}/Modules`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setToolModules(res.data))
      .catch((err) => console.error("Failed to fetch modules", err));
  }, []);

  // Fetch Envelope Types
  useEffect(() => {
    axios
      .get(`${url1}/EnvelopeTypes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setEnvelopeOptions(res.data))
      .catch((err) => console.error("Failed to fetch envelope types", err));
  }, []);

  const isEnabled = (toolName) => enabledModules.includes(toolName);

  const handleSave = async () => {
    // similar payload logic as your current code
    console.log("Saving configuration...");
  };

  const cardStyle = { marginBottom: 16 };
  const iconStyle = { color: PRIMARY_COLOR, marginRight: 6 };

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16} align="top">
        {/* LEFT SIDE */}
        <Col xs={24} md={16}>
          {/* Project Selection */}
          <Card
            style={cardStyle}
            title={
              <div>
                <span>
                  <AppstoreOutlined style={iconStyle} /> Project Selection
                </span>
                <br />
                <Text type="secondary">
                  Select a project to configure its modules and settings
                </Text>
              </div>
            }
          >
            <Form.Item style={{ marginTop: 16 }} required>
              <Select
                placeholder="Select Project"
                onChange={setSelectedProject}
                value={selectedProject}
              >
                {projects.map((p) => (
                  <Option key={p.projectId} value={p.projectId}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {!selectedProject && (
              <Text type="warning">
                Please select a project to enable configuration options below.
              </Text>
            )}
          </Card>

          {/* Module Selection */}
          <Card
            style={cardStyle}
            title={
              <div>
                <span>
                  <ToolOutlined style={iconStyle} /> Module Selection
                </span>
                <br />
                <Text type="secondary">
                  Enable or disable modules based on project requirements
                </Text>
              </div>

            }
          >

            <Checkbox.Group
              style={{ display: "block", marginTop: 12 }}
              value={enabledModules}
              onChange={setEnabledModules}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr", // two columns
                  columnGap: 12,
                  rowGap: 8,
                }}
              >
                {toolModules.map((tool) => (
                  <Checkbox key={tool.id} value={tool.name}>
                    <b>{tool.name}</b>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {tool.description}
                    </Text>
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </Card>

          {/* Envelope Setup */}
          <Card
            style={cardStyle}
            title={
              <div>
                <span>
                  <MailOutlined style={iconStyle} /> Envelope Setup
                </span>
                <br />
                <Text type="secondary">
                  Configure inner and outer envelope types and capacities
                </Text>
              </div>

            }
            extra={
              !isEnabled("Envelope Breaking") ? (
                <Tag icon={<LockOutlined style={{ color: PRIMARY_COLOR }} />}>Disabled</Tag>
              ) : null
            }
          >

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: 12,
                rowGap: 8,
                marginTop: 12,
              }}
            >
              <Text strong>Inner Envelopes</Text>
              <Text strong>Outer Envelopes</Text>

              <Select
                mode="multiple"
                disabled={!isEnabled("Envelope Breaking")}
                value={innerEnvelopes}
                onChange={setInnerEnvelopes}
              >
                {envelopeOptions.map((e) => (
                  <Option key={e.envelopeId} value={e.envelopeId}>
                    {e.envelopeName} (Cap: {e.capacity})
                  </Option>
                ))}
              </Select>

              <Select
                mode="multiple"
                disabled={!isEnabled("Envelope Breaking")}
                value={outerEnvelopes}
                onChange={setOuterEnvelopes}
              >
                {envelopeOptions.map((e) => (
                  <Option key={e.envelopeId} value={e.envelopeId}>
                    {e.envelopeName} (Cap: {e.capacity})
                  </Option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Box Breaking */}
          <Card
            style={cardStyle}
            title={
              <div>
                <span>
                  <InboxOutlined style={iconStyle} /> Box Breaking Criteria
                </span>
                <br />
                <Text type="secondary">
                  Define conditions that trigger creation of new boxes
                </Text>
              </div>

            }
            extra={
              !isEnabled("Box Breaking") ? (
                <Tag icon={<LockOutlined style={{ color: PRIMARY_COLOR }} />}>Disabled</Tag>
              ) : null
            }
          >

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: 12,
                rowGap: 8,
                marginTop: 12,
              }}
            >
              {[
                { key: "capacity", label: "Breaking by Capacity", always: true },
                { key: "route", label: "Route Change" },
                { key: "nodal", label: "Nodal Change" },
                { key: "date", label: "Date Change" },
                { key: "center", label: "Center Change" },
              ].map((item) => (
                <div key={item.key}>
                  <Checkbox
                    checked={item.always ? true : boxBreakingCriteria.includes(item.key)}
                    disabled={item.always || !isEnabled("Box Breaking")}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setBoxBreakingCriteria((prev) => {
                        if (checked) {
                          return Array.from(new Set([...(prev || []), item.key]));
                        }
                        return (prev || []).filter((k) => k !== item.key);
                      });
                    }}
                  >
                    {item.label} {item.always && (
                      <Text type="secondary">(Always enabled)</Text>
                    )}
                  </Checkbox>
                </div>
              ))}
            </div>
          </Card>

          {/* Duplicate Processing */}
          <Card
            style={cardStyle}
            title={
              <div>
                <span>
                  <NumberOutlined style={iconStyle} /> Duplicate Processing Configuration
                </span>
                <br />
                <Text type="secondary">
                  Define fields for duplicate record detection
                </Text>
              </div>

            }
            extra={
              !isEnabled("Duplicate Processing") ? (
                <Tag icon={<LockOutlined style={{ color: PRIMARY_COLOR }} />}>Disabled</Tag>
              ) : null
            }
          >
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                Roll Number, Student Name, Subject Code, Center Code, ...
              </Text>
            </div>
          </Card>
        </Col>

        {/* RIGHT SIDE */}
        <Col xs={24} md={8}>
          {/* Extra Processing */}
          <Card
            style={cardStyle}

            title={
              <div>
                <span>
                  <ToolOutlined style={iconStyle} /> Extra Processing Configuration
                </span>
                <br />
                <Text type="secondary">Configure extra packet calculations</Text>
              </div>
            }
            extra={
              !isEnabled("Nodal Extra Calculation") &&
                !isEnabled("University Extra Calculation") ? (
                <Tag icon={<LockOutlined style={{ color: PRIMARY_COLOR }} />}>Disabled</Tag>
              ) : null
            }
          >
            <Divider />
            <Title level={5}>Nodal Extra</Title>
            <Radio.Group
              value={nodalExtraType}
              onChange={(e) => setNodalExtraType(e.target.value)}
              disabled={!isEnabled("Nodal Extra Calculation")}
            >
              <Radio value="Fixed">Fixed Qty</Radio>
              <Radio value="Range">Range (%)</Radio>
              <Radio value="Percentage">Percentage</Radio>
            </Radio.Group>
            {/* Inputs for Nodal based on selection */}
            {nodalExtraType === "Fixed" && (
              <Form.Item style={{ marginTop: 12 }}>
                <InputNumber
                  placeholder="Enter fixed quantity"
                  min={0}
                  value={extraProcessingConfig.nodal.fixedQty}
                  onChange={(v) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      nodal: { ...prev.nodal, fixedQty: v ?? 0 },
                    }))
                  }
                  disabled={!isEnabled("Nodal Extra Calculation")}
                />
              </Form.Item>
            )}
            {nodalExtraType === "Range" && (
              <Form.Item style={{ marginTop: 12 }}>
                <InputNumber
                  placeholder="Enter range (%)"
                  min={0}
                  max={100}
                  step={0.1}
                  value={extraProcessingConfig.nodal.range}
                  onChange={(v) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      nodal: { ...prev.nodal, range: v ?? 0 },
                    }))
                  }
                  disabled={!isEnabled("Nodal Extra Calculation")}
                />
              </Form.Item>
            )}
            {nodalExtraType === "Percentage" && (
              <Form.Item style={{ marginTop: 12 }}>
                <InputNumber
                  placeholder="Enter percentage (%)"
                  min={0}
                  max={100}
                  step={0.1}
                  value={extraProcessingConfig.nodal.percentage}
                  onChange={(v) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      nodal: { ...prev.nodal, percentage: v ?? 0 },
                    }))
                  }
                  disabled={!isEnabled("Nodal Extra Calculation")}
                />
              </Form.Item>
            )}

            <Divider />
            <Title level={5}>University Extra</Title>
            <Radio.Group
              value={univExtraType}
              onChange={(e) => setUnivExtraType(e.target.value)}
              disabled={!isEnabled("University Extra Calculation")}
            >
              <Radio value="Fixed">Fixed Qty</Radio>
              <Radio value="Range">Range (%)</Radio>
              <Radio value="Percentage">Percentage</Radio>
            </Radio.Group>
            {/* Inputs for University based on selection */}
            {univExtraType === "Fixed" && (
              <Form.Item style={{ marginTop: 12 }}>
                <InputNumber
                  placeholder="Enter fixed quantity"
                  min={0}
                  value={extraProcessingConfig.university.fixedQty}
                  onChange={(v) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      university: { ...prev.university, fixedQty: v ?? 0 },
                    }))
                  }
                  disabled={!isEnabled("University Extra Calculation")}
                />
              </Form.Item>
            )}
            {univExtraType === "Range" && (
              <Form.Item style={{ marginTop: 12 }}>
                <InputNumber
                  placeholder="Enter range (%)"
                  min={0}
                  max={100}
                  step={0.1}
                  value={extraProcessingConfig.university.range}
                  onChange={(v) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      university: { ...prev.university, range: v ?? 0 },
                    }))
                  }
                  disabled={!isEnabled("University Extra Calculation")}
                />
              </Form.Item>
            )}
            {univExtraType === "Percentage" && (
              <Form.Item style={{ marginTop: 12 }}>
                <InputNumber
                  placeholder="Enter percentage (%)"
                  min={0}
                  max={100}
                  step={0.1}
                  value={extraProcessingConfig.university.percentage}
                  onChange={(v) =>
                    setExtraProcessingConfig((prev) => ({
                      ...prev,
                      university: { ...prev.university, percentage: v ?? 0 },
                    }))
                  }
                  disabled={!isEnabled("University Extra Calculation")}
                />
              </Form.Item>
            )}
          </Card>

          {/* Config Summary */}
          <Card
            style={cardStyle}
            title={
              <div>
                <span>
                  <ToolOutlined style={iconStyle} />Configuration Summary
                </span>
                <br />
                <Text type="secondary">Please review the summary before saving configurations</Text>
              </div>

            }>
            <List
              size="small"
              dataSource={[
                {
                  label: "Selected Project",
                  value: selectedProject ? selectedProject : "None",
                  strong: true,
                },
                {
                  label: "Enabled Modules",
                  value: enabledModules.length,
                  strong: true,
                },
                { label: "Envelope Setup", value: "Not Configured", danger: true },
                { label: "Box Breaking", value: "Not Configured", danger: true },
                { label: "Extra Processing", value: "Not Configured", danger: true },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Row style={{ width: "100%" }}>
                    <Col span={12}>
                      <Text>{item.label}</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      {item.danger ? (
                        <Text type="danger">{item.value}</Text>
                      ) : item.strong ? (
                        <Text strong>{item.value}</Text>
                      ) : (
                        <Text>{item.value}</Text>
                      )}
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>


          <Card>
            <Button
              type="primary"
              block
              onClick={handleSave}
              disabled={!selectedProject}
            >
              Save Configuration
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectConfiguration;