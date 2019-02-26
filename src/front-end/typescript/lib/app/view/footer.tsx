import { View } from 'front-end/lib/framework';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Container, Row } from 'reactstrap'

export interface State {
  title: string;
}

const Links: View<{}> = () => {
  return (
    <Row className='mb-3'>
      <Col xs='12' className='d-flex justify-content-center'>
        <Link href='/' text='Feedback' textColor='secondary' />
        <Link href='/about' text='About' textColor='secondary' />
        <Link href='/copyright' text='Copyright' textColor='secondary' />
        <Link href='/disclaimer' text='Disclaimer' textColor='secondary' />
        <Link href='/privacy' text='Privacy' textColor='secondary' />
        <Link href='/accessibility' text='Accessibility' textColor='secondary' />
      </Col>
    </Row>
  );
};

const SupportedBy: View<{}> = () => {
  return (
    <Row>
      <Col xs='12' className='text-center'>
        Supported by the Province of British Columbia
      </Col>
    </Row>
  );
};

const Footer: View<{}> = () => {
  return (
    <footer className='w-100 py-5 bg-dark text-secondary'>
      <Container>
        <Links />
        <SupportedBy />
      </Container>
    </footer>
  );
};

export default Footer;
