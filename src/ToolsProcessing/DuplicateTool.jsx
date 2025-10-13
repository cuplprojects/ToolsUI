import React, { useEffect, useState } from "react";
import { Card, Select, Checkbox, InputNumber, Typography, Space, Tag } from "antd";
import API from "./../hooks/api";
import useStore from "./../stores/ProjectData";
import { CopyFilled, LockFilled} from "@ant-design/icons";
import { iconStyle, PRIMARY_COLOR } from "../ProjectConfig/components/constants";

const { Text } = Typography;
const { Option } = Select;

const DuplicateTool = ({ isEnabled, duplicateConfig = {}, setDuplicateConfig }) => {
  const projectId = useStore((state) => state.projectId);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    API.get(`/Fields`)
      .then((res) => setFields(res.data || []))
      .catch((err) => console.error("Failed to fetch fields", err));
  }, [projectId]);

  const enabled = isEnabled("Duplicate Tool");

  const handleFieldChange = (value) => {
    setDuplicateConfig((prev) => ({ ...prev, duplicateCriteria: value }));
  };

  const handleEnhancementChange = (checked) => {
    setDuplicateConfig((prev) => ({
      ...prev,
      enhancementEnabled: checked,
    }));
  };

  const handlePercentChange = (val) => {
    setDuplicateConfig((prev) => ({ ...prev, enhancement: val }));
  };

  return (
    <Card
      title={
        <div>
          <span>
            <CopyFilled style={iconStyle} /> Duplicate Tool
          </span>
          <br />
          <Text type="secondary">
            Define conditions that trigger creation of new boxes
          </Text>
        </div>
      }
      extra={
        !enabled ? (
          <Tag icon={<LockFilled style={{ color: PRIMARY_COLOR }} />}>Disabled</Tag>
        ) : null
      }
      bordered
      style={{ marginTop: 16, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          <Text strong>Select fields to concatenate</Text>
          <Select
            mode="multiple"
            allowClear
            disabled={!enabled}
            style={{ width: "100%", marginTop: 4 }}
            placeholder="Select one or more fields"
            value={duplicateConfig?.duplicateCriteria || []}
            onChange={handleFieldChange}
          >
            {fields.map((f) => (
              <Option key={f.fieldId} value={f.fieldId}>
                {f.name}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong>Enhancement Options</Text>
          <Checkbox
            checked={duplicateConfig?.enhancementEnabled}
            disabled={!enabled}
            onChange={(e) => handleEnhancementChange(e.target.checked)}
            style={{ marginTop: 8 }}
          >
            Enable Enhancement
          </Checkbox>

          {duplicateConfig?.enhancementEnabled && (
            <InputNumber
              value={duplicateConfig?.enhancement || 0}
              disabled={!enabled}
              onChange={handlePercentChange}
              style={{ marginTop: 8, width: "100%" }}
              addonAfter="%"
              min={0}
              max={100}
            />
          )}
        </div>
      </Space>
    </Card>
  );
};

export default DuplicateTool;
