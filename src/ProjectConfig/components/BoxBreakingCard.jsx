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
          {[
            {
              key: "capacity",
              label: "Breaking by Capacity",
              always: true,
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
                  {item.label}{" "}
                  {item.always && <Text type="secondary">(Always enabled)</Text>}
                </Checkbox>
              )}
              {item.key === "selectFields" && item.label}
            </div>
          ))}
        </div>
      </Card>
    </AnimatedCard>
  );
};

export default BoxBreakingCard;