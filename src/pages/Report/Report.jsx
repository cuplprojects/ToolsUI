import React, { useEffect, useState } from "react";
import { List, Typography, Select, Spin, message } from "antd";
import axios from "axios";
import API from "../../hooks/api";

const { Text, Title } = Typography;
const url3 = import.meta.env.VITE_API_FILE_URL;
const url = import.meta.env.VITE_API_BASE_URL;
 const token = localStorage.getItem("token");
const possibleReports = [
    { fileName: "DuplicateTool.xlsx", title: "Duplicate Processing Report" },
    { fileName: "EnvelopeBreaking.xlsx", title: "Envelope Breaking Report" },
    { fileName: "ExtrasCalculation.xlsx", title: "Extras Calculation Report" },
    { fileName: "BoxBreaking.xlsx", title: "Box Breaking Report" },
];

const Report = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedProjectName, setSelectedProjectName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getProjects();
    }, []);

    // Fetch projects from the server
    const getProjects = async () => {
        setLoading(true);
        try {
            const response = await API.get(`/Projects`);
            console.log(response)
            const projectIds = response.data.map((config) => config.projectId);

            const projectNameRequests = projectIds.map((projectId) =>
                axios.get(`${url}/Project/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            );

            const projectNameResponses = await Promise.all(projectNameRequests);

            const combinedProjects = projectIds.map((id, index) => ({
                id,
                name: projectNameResponses[index].data.name,
            }));

            setProjects(combinedProjects);
        } catch (err) {
            console.error("Failed to fetch projects", err);
            message.error("Failed to fetch projects. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle project selection
    const handleProjectChange = (projectId) => {
        setSelectedProjectId(projectId);
        const selectedProject = projects.find((project) => project.id === projectId);
        setSelectedProjectName(selectedProject ? selectedProject.name : "");
    };

    // Render reports after project selection
    const renderReports = () => {
        if (!selectedProjectId) {
            return <Text>Please select a project to view reports.</Text>;
        }

        return (
            <List
                dataSource={possibleReports}
                renderItem={(report) => {
                    const fileUrl = `${url3}/${selectedProjectId}/${report.fileName}`;
                    return (
                        <List.Item
                            actions={[
                                <a
                                    key="download"
                                    href={fileUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Download
                                </a>
                            ]}
                        >
                            <List.Item.Meta title={report.title} />
                        </List.Item>
                    );
                }}
            />
        );
    };

    if (loading) {
        return <Spin tip="Loading projects..." />;
    }

    return (
        <div style={{ padding: 20 }}>
            <Title level={3}>Select a Project</Title>

            <Select
                style={{ width: 200, marginBottom: 20 }}
                placeholder="Select a project"
                onChange={handleProjectChange}
                allowClear
            >
                {projects.map((project) => (
                    <Select.Option key={project.id} value={project.id}>
                        {project.name}
                    </Select.Option>
                ))}
            </Select>

            {selectedProjectId && (
                <>
                    <Title level={4}>Reports for Project: {selectedProjectName}</Title>
                    {renderReports()}
                </>
            )}
        </div>
    );
};

export default Report;
