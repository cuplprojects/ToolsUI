import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Select, Button, Typography, Radio, Checkbox, InputNumber, Space, message, Statistic } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../hooks/api';
import useStore from '../stores/ProjectData';
const { Title, Text } = Typography;
const { Option } = Select;

const DuplicateTool = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);
  const [strategy, setStrategy] = useState('consolidate');
  const [enhance, setEnhance] = useState(false);
  const [enhanceType, setEnhanceType] = useState('round'); // 'percent' | 'round'
  const [percent, setPercent] = useState(0);
  const projectId = useStore((state) => state.projectId);

  useEffect(() => {
    API
      .get(`/Fields`)
      .then((res) => setFields(res.data || []))
      .catch((err) => console.error('Failed to fetch fields', err));
  }, [projectId]);


  const handleSave = () => {
    if (selectedFieldIds.length === 0) {
      message.warning('Select at least one field');
      return;
    }

    const fieldIdToName = new Map(fields.map((f) => [f.fieldId, f.name]));
    const mergefields = selectedFieldIds
      .map((id) => fieldIdToName.get(id))
      .filter(Boolean)
      .join(',');

    if (!mergefields) {
      message.warning('Selected fields are invalid.');
      return;
    }

    // Save the selected settings in localStorage
    const settings = {
      projectId: projectId,
      selectedFieldIds,
      strategy,
      enhance,
      enhanceType,
      percent,
      mergefields,
    };

    localStorage.setItem('duplicateToolSettings', JSON.stringify(settings));
    message.success('Settings saved successfully!');
    navigate('/processingpipeline', { state: { projectId: projectId } });
  };


  return (
    <div >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={24}>

          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>Select fields to concatenate</Text>
              <Select
                mode="multiple"
                allowClear
                style={{ width: '100%', marginTop: 4 }}
                placeholder="Select one or more fields"
                value={selectedFieldIds}
                onChange={setSelectedFieldIds}
              >
                {fields.map((f) => (
                  <Option key={f.fieldId} value={f.fieldId}>
                    {f.name}
                  </Option>
                ))}
              </Select>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
              }}
              transition={{ duration: 0.3 }}
            >
              <Card title="Processing Options" bordered={true} style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <Row gutter={[16, 16]}>

                  <Title level={5}>Duplicate Handling Strategy</Title>
                  <Radio.Group
                    onChange={(e) => setStrategy(e.target.value)}
                    value={strategy}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    <Radio value="consolidate">Sum quantities</Radio>
                    <Radio value="first">Keep first occurrence</Radio>
                    <Radio value="manual">Manual review required</Radio>
                  </Radio.Group>

                </Row>
                <Row>

                  <div className='mt-2'><Title level={5}>Enhancement Options</Title>
                  </div>
                  <Checkbox checked={enhance} onChange={(e) => setEnhance(e.target.checked)}>
                    Enable Enhancement
                  </Checkbox>

                  {enhance && (
                    <Radio.Group
                      value={enhanceType}
                      onChange={(e) => setEnhanceType(e.target.value)}
                      style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
                    >
                      <Radio value="percent">Apply enhancement percentage</Radio>
                      {enhance && enhanceType === 'percent' && (
                        <InputNumber
                          value={percent}
                          onChange={setPercent}
                          style={{ marginTop: 8, width: '100%' }}
                          addonAfter="%"
                        />
                      )}
                      <Radio value="round">Round up to envelope size</Radio>
                    </Radio.Group>
                  )}
                </Row>
              </Card>
            </motion.div>
            <Space>
              <Button onClick={handleSave}>
                Save Settings
              </Button>
            </Space>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default DuplicateTool;
