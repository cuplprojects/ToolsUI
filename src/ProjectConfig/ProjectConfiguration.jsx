import React, { useState, useEffect, useMemo } from "react";
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
import { motion } from "framer-motion";
import { useToast } from '../hooks/useToast';
import API from "../hooks/api";
import useStore from "../stores/ProjectData";
const { Title, Text } = Typography;
const { Option } = Select;
const PRIMARY_COLOR = "#1677ff"; // Ant Design default primary color
const EXTRA_ALIAS_NAME = "Extra Configuration";
const NODAL_MODULE = "Nodal Extra Calculation";
const UNIVERSITY_MODULE = "University Extra Calculation";

const ProjectConfiguration = () => {
  const { showToast } = useToast();
  const [enabledModules, setEnabledModules] = useState([]);
  const [boxBreakingCriteria, setBoxBreakingCriteria] = useState(["capacity"]);
  const [toolModules, setToolModules] = useState([]);
  const [innerEnvelopes, setInnerEnvelopes] = useState([]);
  const [outerEnvelopes, setOuterEnvelopes] = useState([]);
  const [envelopeOptions, setEnvelopeOptions] = useState([]);
  const [extraTypes, setExtraTypes] = useState([]);
  const [extraTypeSelection, setExtraTypeSelection] = useState({});
  const [extraProcessingConfig, setExtraProcessingConfig] = useState({});
  const [fields, setFields] = useState([]);
  const [selectedEnvelopeFields, setSelectedEnvelopeFields] = useState([]);
  const [selectedBoxFields, setSelectedBoxFields] = useState([]);
  const token = localStorage.getItem("token");
  const projectId = useStore((state) => state.projectId);
  // Fetch ExtraTypes
  useEffect(() => {
    API
      .get(`/ExtraTypes`)
      .then((res) => {
        setExtraTypes(res.data);

        // Pre-fill selection with "Fixed"
        const defaults = {};
        res.data.forEach((et) => {
          defaults[et.type] = "Fixed";
        });
        setExtraTypeSelection(defaults);
      })
      .catch((err) => console.error("Failed to fetch extra types", err));
  }, []);
  // Fetch Modules
  useEffect(() => {
    API
      .get(`/Modules`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setToolModules(res.data))
      .catch((err) => console.error("Failed to fetch modules", err));
  }, []);

  // Build a merged module list with a single Extra Configuration entry
  const mergedModules = useMemo(() => {
    const list = toolModules || [];
    const others = list.filter(
      (m) => m.name !== NODAL_MODULE && m.name !== UNIVERSITY_MODULE
    );

    // Determine description from any one of the original extra modules, if present
    const extraDesc = list.find(
      (m) => m.name === NODAL_MODULE || m.name === UNIVERSITY_MODULE
    )?.description;

    // Insert single alias if at least one extra module exists
    const hasAnyExtra = list.some(
      (m) => m.name === NODAL_MODULE || m.name === UNIVERSITY_MODULE
    );

    return hasAnyExtra
      ? [
        ...others,
        { id: "extra-alias", name: EXTRA_ALIAS_NAME, description: extraDesc },
      ]
      : others;
  }, [toolModules]);

  // Fetch Envelope Types
  useEffect(() => {
    API
      .get(`/EnvelopeTypes`)
      .then((res) => setEnvelopeOptions(res.data))
      .catch((err) => console.error("Failed to fetch envelope types", err));
  }, []);

  // Fetch Fields
  useEffect(() => {
    API
      .get(`/Fields`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setFields(res.data))
      .catch((err) => console.error("Failed to fetch fields", err));
  }, []);

  const isEnabled = (toolName) => enabledModules.includes(toolName);

  const handleSave = async () => {

    try {
      // 1️⃣ Save ProjectConfigs
      const projectConfigPayload = {
        projectId: projectId,
        modules: enabledModules.map(
          (m) => toolModules.find((tm) => tm.name === m)?.id
        ),
        envelope: JSON.stringify({
          Inner: innerEnvelopes.join(","),
          Outer: outerEnvelopes.join(","),
        }),
        BoxBreakingCriteria: selectedBoxFields,
        EnvelopeMakingCriteria: selectedEnvelopeFields,
      };

      await API.post(`/ProjectConfigs`, projectConfigPayload);

      // 2️⃣ Save ExtrasConfigurations
      const extrasPayloads = Object.entries(extraTypeSelection)
        .map(([typeName, mode]) => {
          const et = extraTypes.find((t) => t.type === typeName);
          if (!et) return null;

          const config = extraProcessingConfig[typeName] || {};

          // normalize envelope
          const normalizedEnvelope = {
            Inner: String(config.envelopeType?.inner || ""),
            Outer: String(config.envelopeType?.outer || ""),
          };
          return {
            id: 0,
            projectId: projectId,
            extraType: et.extraTypeId,
            mode,
            value:
              mode === "Fixed"
                ? String(config.fixedQty || 0)
                : mode === "Range"
                  ? String(config.range || 0)
                  : String(config.percentage || 0),
            envelopeType: JSON.stringify(normalizedEnvelope),
          };
        })
        .filter(Boolean);

      if (extrasPayloads.length > 0) {
        await Promise.all(
          extrasPayloads.map((payload) =>
            API.post(`/ExtrasConfigurations`, payload)
          )
        );
      }

      showToast("Configuration saved successfully!", "success");
      resetForm();
      console.log("Saved:", { projectConfigPayload, extrasPayloads });
    } catch (err) {
      console.error("Failed to save configuration", err);
      showToast("Failed to save configuration", err);
      resetForm();
    }
  };

  const resetForm = () => {
    setEnabledModules([]);  // Reset modules to empty array
    setInnerEnvelopes([]);   // Reset inner envelopes
    setOuterEnvelopes([]);   // Reset outer envelopes
    setSelectedBoxFields([]); // Reset box fields
    setSelectedEnvelopeFields([]); // Reset envelope fields
    setExtraTypeSelection({}); // Reset extra type selection

    // Add any other state variables you might have
  };


  const cardStyle = { marginBottom: 16, border: '1px solid #d9d9d9', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' };
  const iconStyle = { color: PRIMARY_COLOR, marginRight: 6 };
  const envelopeConfigured = isEnabled("Envelope Breaking");
  const boxConfigured = isEnabled("Box Breaking");
  const extraConfigured = isEnabled(EXTRA_ALIAS_NAME);

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16} align="top">
        {/* LEFT SIDE */}
        <Col xs={24} md={16}>
          {/* Project Selection */}
          {/* Module Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
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
                  {mergedModules.map((tool) => (
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
          </motion.div>

          {/* Envelope Setup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
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
                    <Option key={e.envelopeId} value={e.envelopeName}>
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
                    <Option key={e.envelopeId} value={e.envelopeName}>
                      {e.envelopeName} (Cap: {e.capacity})
                    </Option>
                  ))}
                </Select>
              </div>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
            <Card
              style={cardStyle}
              title={
                <div>
                  <span>
                    <InboxOutlined style={iconStyle} /> Envelope Making Criteria
                  </span>
                  <br />
                  <Text type="secondary">
                    Define conditions that numbers Envelope
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
                <div>
                  <Text strong>Select fields to concatenate</Text>
                  <Select
                    mode="multiple"
                    disabled={!isEnabled("Envelope Breaking")}
                    allowClear
                    style={{ width: '100%', marginTop: 4 }}
                    placeholder="Select one or more fields"
                    value={selectedEnvelopeFields}
                    onChange={setSelectedEnvelopeFields}
                  >
                    {fields.map((f) => (
                      <Option key={f.fieldId} value={f.fieldId}>
                        {f.name}
                      </Option>
                    ))}
                    extra={
                      !isEnabled("Envelope Breaking") ? (
                        <Tag icon={<LockOutlined style={{ color: PRIMARY_COLOR }} />}>Disabled</Tag>
                      ) : null
                    }
                  </Select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Extra Processing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
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
                !isEnabled(EXTRA_ALIAS_NAME) ? (
                  <Tag icon={<LockOutlined style={{ color: PRIMARY_COLOR }} />}>
                    Disabled
                  </Tag>
                ) : null
              }
            >
              {extraTypes.map((et, index) => (
                <div key={et.extraTypeId}>
                  {index > 0 && <Divider />}
                  <Title level={5}>{et.type} Extra</Title>

                  {/* 🔼 Envelope Dropdowns above */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <Row>
                        
                         <Col className="mr-2">
<Select
                      placeholder="Select Inner Envelopes"
                      value={extraProcessingConfig[et.type]?.envelopeType?.inner || []}
                      onChange={(vals) =>
                        setExtraProcessingConfig((prev) => ({
                          ...prev,
                          [et.type]: {
                            ...prev[et.type],
                            envelopeType: {
                              ...prev[et.type]?.envelopeType,
                              inner: vals,
                            },
                          },
                        }))
                      }
                    >
                      {envelopeOptions.map((e) => (
                        <Option key={e.envelopeId} value={e.envelopeName}>
                          {e.envelopeName} (Capacity: {e.capacity})
                        </Option>
                      ))}
                    </Select>
                    </Col> 
                       
                         
                          <Col className="ml-2">
                       <Select
                      placeholder="Select Outer Envelopes"
                      value={extraProcessingConfig[et.type]?.envelopeType?.outer || []}
                      onChange={(vals) =>
                        setExtraProcessingConfig((prev) => ({
                          ...prev,
                          [et.type]: {
                            ...prev[et.type],
                            envelopeType: {
                              ...prev[et.type]?.envelopeType,
                              outer: vals,
                            },
                          },
                        }))
                      }
                    >
                      {envelopeOptions.map((e) => (
                        <Option key={e.envelopeId} value={e.envelopeName}>
                          {e.envelopeName} (Capacity: {e.capacity})
                        </Option>
                      ))}
                    </Select>
                      </Col>
                    </Row>
                    
                   
                  </div>

                  {/* Radio group for mode */}
                  <Radio.Group
                    value={extraTypeSelection[et.type] || "Fixed"}
                    onChange={(e) =>
                      setExtraTypeSelection((prev) => ({
                        ...prev,
                        [et.type]: e.target.value,
                      }))
                    }
                    disabled={!isEnabled(EXTRA_ALIAS_NAME)}
                    style={{ marginTop: 16 }}
                  >
                    <Radio value="Fixed">Fixed Qty</Radio>
                    <Radio value="Range">Range (%)</Radio>
                    <Radio value="Percentage">Percentage</Radio>
                  </Radio.Group>

                  {/* Inputs depending on type selection */}
                  {extraTypeSelection[et.type] === "Fixed" && (
                    <Form.Item style={{ marginTop: 12 }}>
                      <InputNumber
                        placeholder="Enter fixed quantity"
                        min={0}
                        value={extraProcessingConfig[et.type]?.fixedQty || 0}
                        onChange={(v) =>
                          setExtraProcessingConfig((prev) => ({
                            ...prev,
                            [et.type]: { ...prev[et.type], fixedQty: v ?? 0 },
                          }))
                        }
                        disabled={!isEnabled(EXTRA_ALIAS_NAME)}
                      />
                    </Form.Item>
                  )}

                  {extraTypeSelection[et.type] === "Range" && (
                    <Form.Item style={{ marginTop: 12 }}>
                      <InputNumber
                        placeholder="Enter range (%)"
                        min={0}
                        max={100}
                        step={0.1}
                        value={extraProcessingConfig[et.type]?.range || 0}
                        onChange={(v) =>
                          setExtraProcessingConfig((prev) => ({
                            ...prev,
                            [et.type]: { ...prev[et.type], range: v ?? 0 },
                          }))
                        }
                        disabled={!isEnabled(EXTRA_ALIAS_NAME)}
                      />
                    </Form.Item>
                  )}

                  {extraTypeSelection[et.type] === "Percentage" && (
                    <Form.Item style={{ marginTop: 12 }}>
                      <InputNumber
                        placeholder="Enter percentage (%)"
                        min={0}
                        max={100}
                        step={0.1}
                        value={extraProcessingConfig[et.type]?.percentage || 0}
                        onChange={(v) =>
                          setExtraProcessingConfig((prev) => ({
                            ...prev,
                            [et.type]: { ...prev[et.type], percentage: v ?? 0 },
                          }))
                        }
                        disabled={!isEnabled(EXTRA_ALIAS_NAME)}
                      />
                    </Form.Item>
                  )}
                </div>
              ))}
            </Card>
          </motion.div>


        </Col>

        {/* RIGHT SIDE */}
        <Col xs={24} md={8}>



          {/* Box Breaking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
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
                  gridTemplateColumns: "1fr",
                  columnGap: 12,
                  rowGap: 8,
                  marginTop: 12,
                }}
              >
                {[
                  {
                    key: "capacity",
                    label: "Breaking by Capacity",
                    always: true
                  },
                  {
                    key: "selectFields",
                    label: (
                      <>
                        <Text strong>Select fields to concatenate</Text>
                        <Select
                          mode="multiple"
                          disabled={!isEnabled("Box Breaking")}
                          allowClear
                          style={{ width: "100%", marginTop: 4 }}
                          placeholder="Select one or more fields"
                          value={selectedBoxFields}
                          onChange={setSelectedBoxFields}
                        >
                          {fields.map((f) => (
                            <Option key={f.fieldId} value={f.fieldId}>
                              {f.name}
                            </Option>
                          ))}
                        </Select>
                      </>
                    ),
                    always: false,
                  },
                ].map((item) => (
                  <div key={item.key}>
                    {item.key !== "selectFields" && (
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
                        {item.label} {item.always && <Text type="secondary">(Always enabled)</Text>}
                      </Checkbox>
                    )}
                    {item.key === "selectFields" && item.label}
                  </div>
                ))}
              </div>
            </Card>

          </motion.div>

          {/* Config Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
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
                    label: "Enabled Modules",
                    value: enabledModules.length,
                    strong: true,
                  },
                  {
                    label: "Envelope Setup",
                    value: envelopeConfigured ? "Configured" : "Not Configured",
                    danger: !envelopeConfigured,
                  },
                  {
                    label: "Box Breaking",
                    value: boxConfigured ? "Configured" : "Not Configured",
                    danger: !boxConfigured,
                  },
                  {
                    label: "Extra Processing",
                    value: extraConfigured ? "Configured" : "Not Configured",
                    danger: !extraConfigured,
                  },
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
<Button
                type="primary"
                block
                onClick={handleSave}
                disabled={!projectId}
                className="mt-4"
              >
                Save Configuration
              </Button>

            </Card>
          </motion.div>
          
              
        
        </Col>
      </Row>
    </div>
  );
};

export default ProjectConfiguration;