import { View } from 'front-end/lib/framework';
import { default as React, ReactElement } from 'react';
import { Col, Container, Row } from 'reactstrap';

export interface Props {
  location: 'top' | 'bottom';
  children: Array<ReactElement<any>> | ReactElement<any>
}

const FixedBar: View<Props> = ({ location, children }) => {
  return (
    <div className={`view-fixed-bar fixed-${location} bg-light border-top`}>
      <Container>
        <Row>
          <Col xs='12' className='d-flex flex-md-row-reverse justify-content-xs-center justify-content-md-start align-items-center py-2' style={{ minHeight: '80px' }}>
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default FixedBar;