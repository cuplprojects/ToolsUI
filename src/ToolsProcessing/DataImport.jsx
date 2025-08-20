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
  message,
  Table,
} from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import ProcessingPipeline from './ProcessingPipeline'; // Your pipeline component
import axios from 'axios';



const { Title, Text } = Typography;
const { Option } = Select;
const url = import.meta.env.VITE_API_BASE_URL;
const url1 = import.meta.env.VITE_API_URL;

const DataImport = () => {
  const [project, setProject] = useState(null);
  const [strategy, setStrategy] = useState('consolidate');
  const [enhance, setEnhance] = useState(false);
  const [roundUp, setRoundUp] = useState(true);
  const [percent, setPercent] = useState(2.5);
  const [processingStarted, setProcessingStarted] = useState(false);
  const [projects, setProjects] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [expectedFields, setExpectedFields] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [excelData, setExcelData] = useState([]);

  const [viewConflicts, setViewConflicts] = useState(false);
  const [conflicts, setConflicts] = useState(null);
const [conflictSelections, setConflictSelections] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${url}/Project`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setProjects(res.data))
      .catch(err => console.error("Failed to fetch projects", err));
  }, []);

  useEffect(() => {
    if (!project) return;

    axios.get(`${url1}/Fields`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setExpectedFields(res.data))
      .catch(err => console.error("Failed to fetch fields", err));
  }, [project]);

  const isAnyFieldMapped = () => {
    return expectedFields.some(field => fieldMappings[field.fieldId]);
  };

  const readExcel = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = jsonData[0];
      const rows = jsonData.slice(1);
      setFileHeaders(headers);
      setExcelData(rows);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleStartProcessing = () => {
    setProcessingStarted(true);
  };

  const resetForm = () => {
    setProject(null);
    setFileHeaders([]);
    setFieldMappings({});
    setExcelData([]);
    setProcessingStarted(false);
    setExpectedFields([]);
    setViewConflicts(false);
    setConflicts(null);
  };

  const handleUpload = () => {
    const mappedData = getMappedData();
    const payload = {
      projectId: project,
      data: mappedData
    };

    axios.post(`${url1}/NRDatas`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log('Validation result:', res.data);
        message.success("Validation successful");
        resetForm();
      })
      .catch(err => {
        console.error("Validation failed", err);
        message.error("Validation failed");
        resetForm();
      });
  };

  const getMappedData = () => {
    if (!excelData.length || !fileHeaders.length) return [];

    return excelData.map((row) => {
      const mappedRow = {};
      expectedFields.forEach((field) => {
        const column = fieldMappings[field.fieldId];
        if (column) {
          const colIndex = fileHeaders.indexOf(column);
          mappedRow[field.name] = row[colIndex] ?? null;
        }
      });
      return mappedRow;
    });
  };

  const fetchConflictReport = async () => {
    if (!project) {
      message.warning("Please select a project first.");
      return;
    }

    try {
      const res = await axios.get(`${url1}/NRDatas/ErrorReport?ProjectId=${project}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConflicts(res.data);
      setViewConflicts(true);
    } catch (err) {
      console.error("Failed to fetch conflict report", err);
      message.error("Failed to load conflicts");
    }
  };

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
              <Button onClick={resetForm}>Clear Data</Button>
              <Button type="primary" onClick={handleStartProcessing}>
                Start Processing
              </Button>
            </Space>
          </Col>
        </Row>
      )}
    </Card>
  );

const handleSelectionChange = (catchNo, value) => {
  setConflictSelections(prev => ({
    ...prev,
    [catchNo]: value
  }));
};

const renderConflicts = () => {
  if (!conflicts) return null;

  const columns = [
    {
      title: 'Catch No.',
      dataIndex: 'catchNo',
      key: 'catchNo',
    },
    {
      title: 'Conflicting Field',
      dataIndex: 'uniqueField',
      key: 'uniqueField',
    },
    {
      title: 'Value 1',
      dataIndex: 'value1',
      key: 'value1',
    },
    {
      title: 'Value 2',
      dataIndex: 'value2',
      key: 'value2',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select value to keep"
          value={conflictSelections[record.catchNo]}
          onChange={(value) => handleSelectionChange(record.catchNo, value)}
        >
          <Option value={record.value1}>{record.value1}</Option>
          <Option value={record.value2}>{record.value2}</Option>
        </Select>
      ),
    },
  ];

  const dataSource = conflicts.errors.map((error, index) => ({
    key: index,
    catchNo: error.catchNo,
    uniqueField: error.uniqueField,
    value1: error.conflictingValues[0],
    value2: error.conflictingValues[1],
  }));

  return (
    <Card title="Conflict Report" style={{ marginTop: 24 }}>
      {conflicts.duplicatesFound ? (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
        />
      ) : (
        <Text type="success">✅ No duplicates found</Text>
      )}
    </Card>
  );
};

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
                beforeUpload={(file) => {
                  readExcel(file);
                  return false;
                }}
                maxCount={1}
              >
                <p style={{ fontSize: 24 }}>📤</p>
                <p>Upload Excel or CSV file</p>
                <Button icon={<UploadOutlined />}>Choose File</Button>
                <p style={{ color: '#999' }}>
                  Supported formats: .xlsx, .xls, .csv (Max: 10MB)
                </p>
              </Upload.Dragger>

              {isAnyFieldMapped() && (
                <Button type="primary" block onClick={handleUpload}>
                  Upload and Validate
                </Button>
              )}
            </Space>
          </Card>

          {fileHeaders.length > 0 && expectedFields.length > 0 && (
            <Card title="Field Mapping" style={{ marginTop: 24 }}>
              {expectedFields.map((expectedField) => (
                <Row key={expectedField.fieldId} gutter={16} align="middle" style={{ marginBottom: 12 }}>
                  <Col span={8}><Text>{expectedField.name}</Text></Col>
                  <Col span={16}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Select matching column from file"
                      value={fieldMappings[expectedField.fieldId]}
                      onChange={(value) => {
                        setFieldMappings(prev => ({
                          ...prev,
                          [expectedField.fieldId]: value
                        }));
                      }}
                    >
                      {fileHeaders
                        .filter(header =>
                          !Object.values(fieldMappings).includes(header) || fieldMappings[expectedField.fieldId] === header
                        )
                        .map((header, index) => (
                          <Option key={`${header}-${index}`} value={header}>{header}</Option>
                        ))}
                    </Select>
                  </Col>
                </Row>
              ))}
            </Card>
          )}

          <div style={{ marginTop: 24 }}>
            {processingStarted ? (
              <ProcessingPipeline />
            ) : viewConflicts ? (
              renderConflicts()
            ) : (
              renderProcessingOptions()
            )}
          </div>
        </Col>

        {/* Right Section */}
        <Col xs={24} lg={6}>
          <Card title="Quick Actions" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block>🔁 Auto-fix duplicates</Button>
              <Button block>📥 Download error report</Button>
              <Button block onClick={fetchConflictReport}>👁️ View conflicts only</Button>
              {viewConflicts && (
                <Button block onClick={() => setViewConflicts(false)}>⬅️ Back to options</Button>
              )}
            </Space>
          </Card>

          {viewConflicts && renderProcessingOptions()}
        </Col>
      </Row>
    </div>
  );
};

export default DataImport;
