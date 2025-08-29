import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Select, Button, Typography, Radio, Checkbox, InputNumber, Space, message, Statistic } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const url = import.meta.env.VITE_API_BASE_URL;
const url1 = import.meta.env.VITE_API_URL;

const DuplicateTool = ({ project }) => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState([]);

  const [strategy, setStrategy] = useState('consolidate');
  const [enhance, setEnhance] = useState(false);
  const [enhanceType, setEnhanceType] = useState('percent'); // 'percent' | 'round'
  const [percent, setPercent] = useState(2.5);

  // Summary stats and UI state
  const [stats, setStats] = useState({ filesCleaned: 0, errorsDetected: 0, duplicatesRemoved: 0 });
  const [lastRunProject, setLastRunProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!project) return;
    axios
      .get(`${url1}/Fields`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setFields(res.data || []))
      .catch((err) => console.error('Failed to fetch fields', err));
  }, [project]);

  // const handleRun = async () => {
  //   if (!project) {
  //     message.warning('Please select a project');
  //     return;
  //   }

  //   if (selectedFieldIds.length === 0) {
  //     message.warning('Select at least one field');
  //     return;
  //   }

  //   // Build merge fields list from selected ids
  //   const fieldIdToName = new Map(fields.map((f) => [f.fieldId, f.name]));
  //   const mergefields = selectedFieldIds
  //     .map((id) => fieldIdToName.get(id))
  //     .filter(Boolean)
  //     .join(',');

  //   if (!mergefields) {
  //     message.warning('Selected fields are invalid.');
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     const queryParams = {
  //       ProjectId: project,
  //       consolidate: strategy === 'consolidate',
  //       mergefields: mergefields,
  //     };

  //     // Enhancement options
  //     if (enhance) {
  //       if (enhanceType === 'percent') {
  //         queryParams.enhancement = true;
  //         queryParams.percent = percent;
  //       } else if (enhanceType === 'round') {
  //         queryParams.enhancement = false;
  //         queryParams.percent = 0;
  //       }
  //     }

  //     const query = new URLSearchParams(queryParams).toString();

  //     const res = await axios.post(`${url1}/Duplicate?${query}`, null, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     // Try to read counts from API response; fall back to 0 if not provided
  //     const data = res?.data || {};
  //     const filesCleaned = data.filesCleaned ?? data.cleanedFiles ?? data.totalFiles ?? 0;
  //     const errorsDetected = data.errorsDetected ?? data.errorCount ?? 0;
  //     const duplicatesRemoved = data.duplicatesRemoved ?? data.removedCount ?? data.duplicates ?? 0;

  //     setStats({ filesCleaned, errorsDetected, duplicatesRemoved });
  //     setLastRunProject(project);

  //     message.success(
  //       `Duplicate processing completed. Duplicates removed: ${duplicatesRemoved}`
  //     );

  //     // Navigate to Envelope Breaking with the same project preselected
  //     navigate('/envelopebreaking', { state: { projectId: project } });
  //   } catch (err) {
  //     console.error('Duplicate processing failed', err);
  //     const apiMsg = err?.response?.data?.message || err?.message || 'Duplicate processing failed';
  //     const errorsDetected = err?.response?.data?.errorsDetected ?? stats.errorsDetected;
  //     if (typeof errorsDetected === 'number') {
  //       setStats((prev) => ({ ...prev, errorsDetected }));
  //     }
  //     message.error(apiMsg);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const handleSave = () => {
    if (!project) {
      message.warning('Please select a project');
      return;
    }

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
      projectId: project,
      selectedFieldIds,
      strategy,
      enhance,
      enhanceType,
      percent,
      mergefields,
    };

    localStorage.setItem('duplicateToolSettings', JSON.stringify(settings));
    message.success('Settings saved successfully!');
    navigate('/processingpipeline', { state: { projectId: project } });
  };

  const handleRun = async () => {
    const savedSettings = JSON.parse(localStorage.getItem('duplicateToolSettings'));

    if (!savedSettings) {
      message.warning('No saved settings found. Please save your settings first.');
      return;
    }

    const { projectId, selectedFieldIds, strategy, enhance, enhanceType, percent, mergefields } = savedSettings;

    if (!projectId) {
      message.warning('Please select a project');
      return;
    }

    if (selectedFieldIds.length === 0) {
      message.warning('Select at least one field');
      return;
    }

    try {
      setLoading(true);

      const queryParams = {
        ProjectId: projectId,
        consolidate: strategy === 'consolidate',
        mergefields: mergefields,
      };

      // Enhancement options
      if (enhance) {
        if (enhanceType === 'percent') {
          queryParams.enhancement = true;
          queryParams.percent = percent;
        } else if (enhanceType === 'round') {
          queryParams.enhancement = false;
          queryParams.percent = 0;
        }
      }

      const query = new URLSearchParams(queryParams).toString();

      const res = await axios.post(`${url1}/Duplicate?${query}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res?.data || {};
      const filesCleaned = data.filesCleaned ?? data.cleanedFiles ?? data.totalFiles ?? 0;
      const errorsDetected = data.errorsDetected ?? data.errorCount ?? 0;
      const duplicatesRemoved = data.duplicatesRemoved ?? data.removedCount ?? data.duplicates ?? 0;

      setStats({ filesCleaned, errorsDetected, duplicatesRemoved });
      setLastRunProject(projectId);

      message.success(
        `Duplicate processing completed. Duplicates removed: ${duplicatesRemoved}`
      );

      navigate('/envelopebreaking', { state: { projectId } });
    } catch (err) {
      console.error('Duplicate processing failed', err);
      const apiMsg = err?.response?.data?.message || err?.message || 'Duplicate processing failed';
      const errorsDetected = err?.response?.data?.errorsDetected ?? stats.errorsDetected;
      if (typeof errorsDetected === 'number') {
        setStats((prev) => ({ ...prev, errorsDetected }));
      }
      message.error(apiMsg);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ padding: 24 }}>
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
                      Enable Enhancement
                    </Checkbox>

                    {enhance && (
                      <Radio.Group
                        value={enhanceType}
                        onChange={(e) => setEnhanceType(e.target.value)}
                        style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                      >
                        <Radio value="percent">Apply enhancement percentage</Radio>
                        <Radio value="round">Round up to envelope size</Radio>
                      </Radio.Group>
                    )}

                    {enhance && enhanceType === 'percent' && (
                      <InputNumber
                        value={percent}
                        onChange={setPercent}
                        style={{ marginTop: 8, width: '100%' }}
                        addonAfter="%"
                      />
                    )}
                  </Col>
                </Row>
              </Card>

              <Space>
                <Button
                  onClick={() => {
                    setSelectedFieldIds([]);
                    setStrategy('consolidate');
                    setEnhance(false);
                    setEnhanceType('percent');
                    setPercent(2.5);
                  }}
                >
                  Reset
                </Button>
                <Button type="primary" onClick={handleRun} loading={loading}>
                  Run Duplicate Processing
                </Button>
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
