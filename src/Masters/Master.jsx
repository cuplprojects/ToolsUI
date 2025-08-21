import React from 'react';
import BoxCapacity from './BoxCapacity'; // adjust the path if needed
import EnvelopeType from './EnvelopeType';
import Field from './Field';
import ToolsModule from './ToolsModule';
import { Tabs } from 'antd';

const Master = () => {
  const tabItems = [
    {
      key: '1',
      label: 'Box Capacity',
      children: <BoxCapacity />,
    },
    {
      key: '2',
      label: 'Envelope Type',
      children: <EnvelopeType />,
    },
    {
      key: '3',
      label: 'Field',
      children: <Field />,
    },
    {
      key: '4',
      label: 'Tools Module',
      children: <ToolsModule />,
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Masters</h1>
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
