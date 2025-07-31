import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Input, Space, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const BoxCapacity = () => {
    const [boxCapacities, setBoxCapacities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [capacity, setCapacity] = useState('');

    const fetchBoxCapacities = async () => {
        setLoading(true);
        try {
            const res = await axios.get('https://localhost:7276/api/BoxCapacities');
            setBoxCapacities(res.data);
        } catch (err) {
            message.error('Failed to fetch box capacities');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoxCapacities();
    }, []);

    const handleAdd = () => {
        setEditingItem(null);
        setCapacity('');
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingItem(record);
        setCapacity(record.capacity);
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`https://localhost:7276/api/BoxCapacities/${boxCapacityId}`);
            message.success('Deleted successfully');
            fetchBoxCapacities();
        } catch {
            message.error('Delete failed');
        }
    };

    const handleSave = async () => {
        if (!capacity) {
            message.warning('Capacity is required');
            return;
        }

        try {
            if (editingItem) {
                await axios.put(`https://localhost:7276/api/BoxCapacities/${editingItem.boxCapacityId}`, {
                    boxCapacityId: editingItem.boxCapacityId,
                    capacity
                });
                message.success('Updated successfully');
            } else {
                await axios.post('https://localhost:7276/api/BoxCapacities', {
                    capacity
                });
                message.success('Added successfully');
            }

            setModalVisible(false);
            fetchBoxCapacities();
        } catch {
            message.error('Save failed');
        }
    };

    const columns = [
        {
            title: 'Capacity',
            dataIndex: 'capacity',
            key: 'capacity',
        },
        {
            title: 'Actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                </Space>
            ),
        },
    ];


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button type="primary" onClick={handleAdd}>
                    Add
                </Button>
            </div>
            <Table
                dataSource={boxCapacities}
                columns={columns}
                rowKey="boxCapacityId"
                loading={loading}
            />
            <Modal
                title={editingItem ? 'Edit Capacity' : 'Add Capacity'}
                open={modalVisible}
                onOk={handleSave}
                onCancel={() => setModalVisible(false)}
                okText="Save"
            >
                <Input
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Enter capacity"
                />
            </Modal>
        </div>
    );
};

export default BoxCapacity;
