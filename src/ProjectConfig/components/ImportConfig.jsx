import React, { useState, useEffect } from "react";
import { Button, Modal, Select, message } from "antd";
import API from "../../hooks/api";
import axios from "axios";

const url = import.meta.env.VITE_API_BASE_URL;

const ImportConfig = ({ onImport, disabled }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [projectList, setProjectList] = useState([]);
  const [projectNames, setProjectNames] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProjectData = async () => {
    if (projectList.length && projectNames.length) return; // Don't refetch

    setLoading(true);
    try {
      const [listRes, namesRes] = await Promise.all([
        API.get("/Projects"),
        axios.get(`${url}/Project`),
      ]);

      setProjectList(listRes.data || []);
      setProjectNames(namesRes.data || []);
    } catch (err) {
      console.error("Failed to fetch project lists", err);
      message.error("Could not load project list for import.");
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    fetchProjectData();
    setIsModalVisible(true);
  };

  const handleOk = () => {
    if (!selectedProjectId) {
      message.warning("Please select a project to import from.");
      return;
    }
    onImport(selectedProjectId);
    setIsModalVisible(false);
    setSelectedProjectId(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedProjectId(null);
  };

  const getDisplayName = (projectId) => {
    const matchedProject = projectNames.find((p) => p.projectId === projectId);
    return matchedProject ? matchedProject.name : `Project ${projectId}`;
  };

  return (
    <>
      <Button type="primary" onClick={showModal} disabled={disabled}>
        Import Configuration
      </Button>

      <Modal
        title="Import Configuration from Project"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Import"
        confirmLoading={loading}
        okButtonProps={{ disabled: !selectedProjectId }}
      >
        <p>Select a project to import its configuration. This will overwrite any unsaved changes.</p>
        <Select
          style={{ width: "100%", marginTop: 16 }}
          placeholder="Select a project"
          showSearch
          optionFilterProp="children"
          onChange={(value) => setSelectedProjectId(value)}
          value={selectedProjectId}
          loading={loading}
          filterOption={(input, option) =>
            option?.children?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {projectList.map((project) => (
            <Select.Option
              key={project.projectId}
              value={project.projectId}
            >
              {getDisplayName(project.projectId)}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </>
  );
};

export default ImportConfig;