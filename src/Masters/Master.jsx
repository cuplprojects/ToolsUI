import React from 'react';
import BoxCapacity from './BoxCapacity'; // adjust the path if needed
import EnvelopeType from './EnvelopeType';
import Field from './Field';
import ToolsModule from './ToolsModule';
import { Tabs, Typography } from 'antd';
import NodalUnivExtra from './NodalUnivExtra';
import Project from './Project';

const Master = () => {
  const tabItems = [
    {
      key: '1',
      label: 'Project',
      children: <Project />,
    },
    {
      key: '2',
      label: 'Box Capacity',
      children: <BoxCapacity />,
    },
    {
      key: '3',
      label: 'Envelope Type',
      children: <EnvelopeType />,
    },
    {
      key: '4',
      label: 'Field',
      children: <Field />,
    },
    {
      key: '5',
      label: 'Tools Module',
      children: <ToolsModule />,
    },
    {
      key: '6',
      label: 'Nodal Univ Extra',
      children: <NodalUnivExtra/>
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ marginBottom: 24}}>
        Masters
      </Typography.Title>
      <Tabs 
        defaultActiveKey="1" 
        items={tabItems}
        size="large"
        type="card"
      />
    </div>
  );
};

export default Master;
