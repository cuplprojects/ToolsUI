import React, { useState } from 'react';
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

const { Title, Text } = Typography;
const { Option } = Select;

const DataImport = () => {
  const [project, setProject] = useState(null);
  const [strategy, setStrategy] = useState('consolidate');
  const [enhance, setEnhance] = useState(false);
  const [roundUp, setRoundUp] = useState(true);
  const [percent, setPercent] = useState(2.5);
  const [processingStarted, setProcessingStarted] = useState(false);

  const handleStartProcessing = () => {
    setProcessingStarted(true);
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
                  <Option value="p1">Project 1</Option>
                  <Option value="p2">Project 2</Option>
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
