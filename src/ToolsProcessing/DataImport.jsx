import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  Upload,
  Button,
  Typography,
  Radio,
  Checkbox,
  InputNumber,
  Space,
} from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import ProcessingPipeline from './ProcessingPipeline'; // Your pipeline component
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const url = import.meta.env.VITE_API_BASE_URL;


const DataImport = () => {
  const [project, setProject] = useState(null);
  const [strategy, setStrategy] = useState('consolidate');
  const [enhance, setEnhance] = useState(false);
  const [roundUp, setRoundUp] = useState(true);
  const [percent, setPercent] = useState(2.5);
  const [processingStarted, setProcessingStarted] = useState(false);
  const [projects, setProjects] = useState([]);
  const token = localStorage.getItem('token');
  const [fileHeaders, setFileHeaders] = useState([]);
  const [expectedFields, setExpectedFields] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});

  useEffect(() => {
    axios.get(`${url}/Project`, {
      headers: { Authorization: `Bearer ${token}`, }
    })
      .then(res => setProjects(res.data))
      .catch(err => console.error("Failed to fetch projects", err));

  }, [])

  useEffect(() => {
    if (!project) return;

    axios.get(`${url}/Project/${project}/fields`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setExpectedFields(res.data)) // e.g., ['center_code', 'catch_number', 'quantity']
      .catch(err => console.error("Failed to fetch fields", err));
  }, [project]);

  const readExcel = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get rows as arrays
      const headers = jsonData[0]; // First row = headers

      console.log("Excel Headers:", headers);
      setFileHeaders(headers);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleStartProcessing = () => {
    setProcessingStarted(true);
  };

  const handleUpload = () => {
    const payload = {
      projectId: project,
      mappings: fieldMappings,
      strategy,
      enhance,
      percent,
      roundUp
    };

    axios.post(`${url}/upload/validate`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log('Validation result:', res.data);
        message.success("Validation successful");
      })
      .catch(err => {
        console.error("Validation failed", err);
        message.error("Validation failed");
      });
  };


  // Extracted Processing Options as a function to render in 2 places
  const renderProcessingOptions = () => (
    <Card title="Processing Options" style={{ marginTop: 24 }} bordered={false}>
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
          <Checkbox
            checked={enhance}
            onChange={(e) => setEnhance(e.target.checked)}
          >
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

      {!processingStarted && (
        <Row justify="space-between" align="middle" style={{ marginTop: 24 }}>
          <Col>
            <Button icon={<DownloadOutlined />}>Download Template</Button>
          </Col>
          <Col>
            <Space>
              <Button>Clear Data</Button>
              <Button type="primary" onClick={handleStartProcessing}>
                Start Processing
              </Button>
            </Space>
          </Col>
        </Row>
      )}
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {/* Left Section */}
        <Col xs={24} lg={18}>
          {/* Data Import Card */}
          <Card title="Data Import" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>Select Project</Text>
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Choose a project..."
                  onChange={setProject}
                >
                  <Option value="">Choose a Project...</Option>
                  {projects.map(project => (
                    <Option key={project.projectId} value={project.projectId}>{project.name}</Option>
                  ))}
                </Select>
              </div>

              <Upload.Dragger
                name="file"
                accept=".xls,.xlsx,.csv"
                beforeUpload={() => false}
                maxCount={1}
              >
                <p style={{ fontSize: 24 }}>📤</p>
                <p>Upload Excel or CSV file</p>
                <Button icon={<UploadOutlined />}>Choose File</Button>
                <p style={{ color: '#999' }}>
                  Supported formats: .xlsx, .xls, .csv (Max: 10MB)
                </p>
              </Upload.Dragger>

              <Button type="primary" block>Upload and Validate</Button>
            </Space>
          </Card>
          {fileHeaders.length > 0 && expectedFields.length > 0 && (
            <Card title="Field Mapping" style={{ marginTop: 24 }}>
              {expectedFields.map((expectedField) => (
                <Row key={expectedField} gutter={16} align="middle" style={{ marginBottom: 12 }}>
                  <Col span={8}><Text>{expectedField}</Text></Col>
                  <Col span={16}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Select matching column from file"
                      value={fieldMappings[expectedField]}
                      onChange={(value) => {
                        setFieldMappings(prev => ({
                          ...prev,
                          [expectedField]: value
                        }));
                      }}
                    >
                      {fileHeaders.map(header => (
                        <Option key={header} value={header}>{header}</Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
              ))}
            </Card>
          )}


          {/* Replace Processing Options with Pipeline once processing starts */}
          <div style={{ marginTop: 24 }}>
            {processingStarted ? <ProcessingPipeline /> : renderProcessingOptions()}
          </div>
        </Col>

        {/* Right Section */}
        <Col xs={24} lg={6}>
          <Card title="Quick Actions" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block>🔁 Auto-fix duplicates</Button>
              <Button block>📥 Download error report</Button>
              <Button block>👁️ View conflicts only</Button>
            </Space>
          </Card>

          {/* Show Processing Options here once processing has started */}
          {processingStarted && renderProcessingOptions()}
        </Col>
      </Row>
    </div>
  );
};

export default DataImport;
