import React from "react";
import { Card, Checkbox, Select, Typography, Tag } from "antd";
import { InboxOutlined, LockOutlined } from "@ant-design/icons";
import AnimatedCard from "./AnimatedCard";
import { cardStyle, iconStyle, PRIMARY_COLOR } from "./constants";

const { Text } = Typography;
const { Option } = Select;

const BoxBreakingCard = ({
  isEnabled,
  boxBreakingCriteria,
  setBoxBreakingCriteria,
  fields,
  selectedBoxFields,
  setSelectedBoxFields,
  selectedCapacity,
  setSelectedCapacity,
  boxCapacities,
}) => {
  return (
    <AnimatedCard>
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
            <Tag icon={<LockOutlined style={{ color: PRIMARY_COLOR }} />}>
              Disabled
            </Tag>
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
          {/* Breaking by Capacity checkbox and Select */}
          <div>
            <Checkbox
              checked={true} // Always enabled
              disabled
              style={{ marginBottom: 4 }}
            >
              Breaking by Capacity <Text type="secondary">(Always enabled)</Text>
            </Checkbox>
            <Select
              disabled={!isEnabled("Box Breaking")}
              value={selectedCapacity}
              onChange={setSelectedCapacity}
              style={{ width: "100%" }}
              placeholder="Select or enter capacity"
            >
              {boxCapacities.map((capacity) => (
                <Option key={capacity.boxCapacityId} value={capacity.boxCapacityId}>
                  {capacity.capacity}
                </Option>
              ))}
            </Select>
          </div>

          {/* Select fields to concatenate */}
          <div>
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
            <Checkbox
              checked={boxBreakingCriteria.includes("selectFields")}
              disabled={!isEnabled("Box Breaking")}
              onChange={(e) => {
                const checked = e.target.checked;
                setBoxBreakingCriteria((prev) => {
                  if (checked) {
                    return Array.from(new Set([...(prev || []), "selectFields"]));
                  }
                  return (prev || []).filter((k) => k !== "selectFields");
                });
              }}
              style={{ marginTop: 8 }}
            >
              Enable field concatenation criteria
            </Checkbox>
          </div>
        </div>
      </Card>
    </AnimatedCard>
  );
};

export default BoxBreakingCard;
