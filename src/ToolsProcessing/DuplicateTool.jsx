import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Select, Button, Typography, Radio, Checkbox, InputNumber, Space, message } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const url = import.meta.env.VITE_API_BASE_URL;
const url1 = import.meta.env.VITE_API_URL;

const DuplicateTool = () => {
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);

  const [strategy, setStrategy] = useState('consolidate');
  const [enhance, setEnhance] = useState(false);
  const [roundUp, setRoundUp] = useState(true);
  const [percent, setPercent] = useState(2.5);

  const token = localStorage.getItem('token');

  useEffect(() => {
    axios
      .get(`${url}/Project`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setProjects(res.data))
      .catch((err) => console.error('Failed to fetch projects', err));
  }, []);

  useEffect(() => {
    if (!project) return;
    axios
      .get(`${url1}/Fields`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setFields(res.data || []))
      .catch((err) => console.error('Failed to fetch fields', err));
  }, [project]);

  const handleRun = async () => {
    if (!project) {
      message.warning('Please select a project');
      return;
    }
    if (selectedFieldIds.length === 0) {
      message.warning('Select at least one field');
      return;
    }

    const fieldIdToName = new Map(fields.map(f => [f.fieldId, f.name]));
    const mergefields = selectedFieldIds
      .map(id => fieldIdToName.get(id))
      .filter(Boolean)
      .join(',');

    if (!mergefields) {
      message.warning('Selected fields are invalid.');
      return;
    }

    try {
      // const res = await axios.get(`${url1}/Duplicate`, {
      //   params: {
      //     ProjectId: project,
      //     mergefields,
      //     consolidate: strategy === 'consolidate',
      //   },
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      const query = new URLSearchParams({
        ProjectId: project,
        consolidate: strategy === 'consolidate',
      }).toString();

      const encodedMergeFields = encodeURIComponent(mergefields);
      const res = await axios.post(`${url1}/Duplicate?${query}&mergefields=${encodedMergeFields}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      message.success('Duplicate processing completed');
      // You can handle `res.data` here if needed
    } catch (err) {
      console.error('Duplicate processing failed', err);
      message.error('Duplicate processing failed');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={18}>
          <Card title="Duplicate Tool" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>Select Project</Text>
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Choose a project..."
                  value={project}
                  onChange={setProject}
                >
                  <Option value="">Choose a Project...</Option>
                  {projects.map((p) => (
                    <Option key={p.projectId} value={p.projectId}>
                      {p.name}
                    </Option>
                  ))}
                </Select>
              </div>

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

              <Card title="Processing Options" bordered={false}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Title level={5}>Duplicate Handling Strategy</Title>
                    <Radio.Group
                      onChange={(e) => setStrategy(e.target.value)}
                      value={strategy}
                      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                    >
                      <Radio value="consolidate">Consolidate (Sum quantities)</Radio>
                      <Radio value="first">Keep first occurrence</Radio>
                      <Radio value="manual">Manual review required</Radio>
                    </Radio.Group>
                  </Col>

                  <Col xs={24} md={12}>
                    <Title level={5}>Enhancement Options</Title>
                    <Checkbox checked={enhance} onChange={(e) => setEnhance(e.target.checked)}>
                      Apply enhancement percentage
                    </Checkbox>

                    {enhance && (
                      <InputNumber
                        value={percent}
                        onChange={setPercent}
                        style={{ marginTop: 8, width: '100%' }}
                        addonAfter="%"
                      />
                    )}

                    <Checkbox
                      checked={roundUp}
                      onChange={(e) => setRoundUp(e.target.checked)}
                      style={{ marginTop: 12 }}
                    >
                      Round up to envelope size
                    </Checkbox>
                  </Col>
                </Row>
              </Card>

              <Space>
                <Button onClick={() => {
                  setSelectedFieldIds([]);
                  setStrategy('consolidate');
                  setEnhance(false);
                  setPercent(2.5);
                  setRoundUp(true);
                }}>
                  Reset
                </Button>
                <Button type="primary" onClick={handleRun}>Run Duplicate Processing</Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Tips" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Select fields in the order they should be concatenated.</Text>
              <Text type="secondary">Example: FieldA,FieldB,FieldC</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DuplicateTool;
