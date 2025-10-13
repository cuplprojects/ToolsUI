import React from "react";
import { Card, Checkbox, Typography } from "antd";
import { SettingFilled  } from "@ant-design/icons";
import AnimatedCard from "./AnimatedCard";
import { cardStyle, iconStyle } from "./constants";

const { Text } = Typography;

const ModuleSelectionCard = ({ mergedModules, enabledModules, setEnabledModules }) => {
  console.log(mergedModules);
  console.log(enabledModules);
  console.log(setEnabledModules);
  return (
    <AnimatedCard>
      <Card
        style={cardStyle}
        title={
          <div>
            <span>
              <SettingFilled  style={iconStyle} /> Module Selection
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
              gridTemplateColumns: "1fr 1fr",
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
    </AnimatedCard>
  );
};

export default ModuleSelectionCard;