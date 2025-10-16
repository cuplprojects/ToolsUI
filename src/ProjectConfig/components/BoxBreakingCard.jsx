import React from "react";
import { Card, Select, Typography, Tag, Checkbox, InputNumber } from "antd";
import { DatabaseFilled, LockFilled } from "@ant-design/icons";
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
  startBoxNumber,
  setStartBoxNumber
}) => {
  // Helper function to manage field concatenation criteria
  const handleFieldConcatenation = (selectedFields) => {
    if (selectedFields.length > 0) {
      // Ensure the concatenation criteria is enabled
      setBoxBreakingCriteria((prev) => {
        if (!prev.includes("selectFields")) {
          return [...prev, "selectFields"];
        }
        return prev;
      });
    } else {
      // Disable field concatenation if no fields are selected
      setBoxBreakingCriteria((prev) => prev.filter((item) => item !== "selectFields"));
    }
  };
  { console.log(startBoxNumber) }

  return (
    <AnimatedCard>
      <Card
        style={cardStyle}
        title={
          <div>
            <span>
              <DatabaseFilled style={iconStyle} /> Box Breaking Criteria
            </span>
            <br />
            <Text type="secondary">
              Define conditions that trigger creation of new boxes
            </Text>
          </div>
        }
        extra={
          !isEnabled("Box Breaking") ? (
            <Tag icon={<LockFilled style={{ color: PRIMARY_COLOR }} />}>
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
          <div className="flex gap-2">
            <div>
              <Checkbox
                checked={true} // Always enabled
                disabled
              >
                Breaking by Capacity <Text type="secondary"></Text>
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
            <div>
              <Text type="secondary">Starting Box Number</Text>
              <InputNumber
                disabled={!isEnabled("Box Breaking")}
                min={1}
                value={startBoxNumber}
                onChange={(value) => setStartBoxNumber(value)}
                placeholder="Enter Start Box Number"
                style={{ width: "100%" }}
              />
            </div>

          </div>
          {/* Select fields to concatenate */}
          <div>
            <Text strong>Select fields to concatenate</Text>
            <Select
              mode="multiple"
              disabled={!isEnabled("Box Breaking")}
              allowClear
              showSearch
              style={{ width: "100%", marginTop: 4 }}
              placeholder="Select one or more fields"
              value={selectedBoxFields}
              onChange={(selectedFields) => {
                setSelectedBoxFields(selectedFields);
                handleFieldConcatenation(selectedFields);
              }}
              optionFilterProp="children"
            >
              {fields.map((f) => (
                <Option key={f.fieldId} value={f.fieldId}>
                  {f.name}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>
    </AnimatedCard>
  );
};

export default BoxBreakingCard;
