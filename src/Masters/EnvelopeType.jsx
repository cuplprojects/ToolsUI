import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Input, InputNumber, Space, message } from 'antd';
import {  EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const EnvelopeType = () => {
  const [envelopes, setEnvelopes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [envelopeName, setEnvelopeName] = useState('');
  const [capacity, setCapacity] = useState('');

  const fetchEnvelopes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://localhost:7276/api/EnvelopeTypes');
      setEnvelopes(res.data);
    } catch {
      message.error('Failed to fetch envelope types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvelopes();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setEnvelopeName('');
    setCapacity('');
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    setEnvelopeName(record.envelopeName);
    setCapacity(record.capacity);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://localhost:7276/api/EnvelopeTypes/${id}`);
      message.success('Deleted successfully');
      fetchEnvelopes();
    } catch {
      message.error('Failed to delete');
    }
  };

  const handleSave = async () => {
    if (!envelopeName || capacity === '') {
      message.warning('Please fill all fields');
      return;
    }

    const payload = {
      envelopeId: editingItem ? editingItem.envelopeId : 0,
      envelopeName,
      capacity: parseInt(capacity)
    };

    try {
      if (editingItem) {
        await axios.put(
          `https://localhost:7276/api/EnvelopeTypes/${editingItem.envelopeId}`,
          payload
        );
        message.success('Updated successfully');
      } else {
        await axios.post('https://localhost:7276/api/EnvelopeTypes', payload);
        message.success('Added successfully');
      }

      setModalVisible(false);
      fetchEnvelopes();
    } catch {
      message.error('Save failed');
    }
  };

  const columns = [
    {
      title: 'Envelope Name',
      dataIndex: 'envelopeName',
      key: 'envelopeName'
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}/>
          <Button type="link" danger icon = {<DeleteOutlined />} onClick={() => handleDelete(record.envelopeId)}/>
        </Space>
      )
    }
  ];

  return (
    <div>
        <div  style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>
        Add
      </Button>  
        </div>
      
      <Table
        dataSource={envelopes}
        columns={columns}
        rowKey="envelopeId"
        loading={loading}
      />
      <Modal
        title={editingItem ? 'Edit Envelope Type' : 'Add Envelope Type'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        okText="Save"
      >
        
          <Input
            placeholder="Envelope name"
            value={envelopeName}
            onChange={(e) => setEnvelopeName(e.target.value)}
          />
          <InputNumber
            placeholder="Capacity"
            value={capacity}
            onChange={(value) => setCapacity(value)}
            style={{ width: '100%' }}
          />
        
      </Modal>
    </div>
  );
};

export default EnvelopeType;
