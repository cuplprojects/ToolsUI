import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Input, Space, message } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const ToolModule = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [name, setName] = useState('');

    const fetchModules = async () => {
        setLoading(true);
        try {
            const res = await axios.get('https://localhost:7276/api/Modules');
            setModules(res.data);
        } catch (err) {
            message.error('Failed to fetch modules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModules();
    }, []);

    const handleAdd = () => {
        setEditingItem(null);
        setName('');
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingItem(record);
        setName(record.name);
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`https://localhost:7276/api/Modules/${id}`);
            message.success('Deleted successfully');
            fetchModules();
        } catch {
            message.error('Delete failed');
        }
    };

    const handleSave = async () => {
        if (!name) {
            message.warning('Name is required');
            return;
        }

        // Check for duplicates
        const isDuplicate = modules.some(item =>
            item.name.toLowerCase() === name.toLowerCase() &&
            (!editingItem || item.id !== editingItem.id)
        );

        if (isDuplicate) {
            message.warning('This module name already exists');
            return;
        }

        try {
            if (editingItem) {
                await axios.put(`https://localhost:7276/api/Modules/${editingItem.id}`, {
                    id: editingItem.id,
                    name,
                });
                message.success('Updated successfully');
            } else {
                await axios.post('https://localhost:7276/api/Modules', {
                    id: 0, // or omit if backend auto-generates it
                    name,
                });
                message.success('Added successfully');
            }

            setModalVisible(false);
            fetchModules();
        } catch {
            message.error('Save failed');
        }
    };

    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => confirm()}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => confirm()}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record) =>
            record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
    });

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            ...getColumnSearchProps('name'),
        },
        {
            title: 'Actions',
            key: 'actions',
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
                    Add Module
                </Button>
            </div>
            <Table
                dataSource={modules}
                columns={columns}
                rowKey="id"
                loading={loading}
            />
            <Modal
                title={editingItem ? 'Edit Module' : 'Add Module'}
                open={modalVisible}
                onOk={handleSave}
                onCancel={() => setModalVisible(false)}
                okText="Save"
            >
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter module name"
                />
            </Modal>
        </div>
    );
};

export default ToolModule;
