import React from "react";
import { Card, Select, Typography, Tag } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import AnimatedCard from "./AnimatedCard";
import { cardStyle, iconStyle, PRIMARY_COLOR } from "./constants";

const { Text } = Typography;
const { Option } = Select;

const EnvelopeSetupCard = ({
  isEnabled,
  innerEnvelopes,
  setInnerEnvelopes,
  outerEnvelopes,
  setOuterEnvelopes,
  envelopeOptions,
}) => {
  return (
    <AnimatedCard>
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
            <Tag icon={<LockOutlined style={{ color: PRIMARY_COLOR }} />}>
              Disabled
            </Tag>
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
    </AnimatedCard>
  );
};

export default EnvelopeSetupCard;