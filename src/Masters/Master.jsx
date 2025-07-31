import React from 'react';
import BoxCapacity from './BoxCapacity'; // adjust the path if needed
import EnvelopeType from './EnvelopeType';
import { Card, Col, Row } from 'antd';

const Master = () => {
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Masters</h1>
      <Row gutter={24}>
        <Col span={12}>
          <Card title="Box Capacity" style={cardStyle} bordered={false}>
            <BoxCapacity />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Envelope Type" style={cardStyle} bordered={false}>
            <EnvelopeType />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Master;
