import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

function EmergencyAlerts({ alerts, currentUser, createAlert }) {
    const [alertTitle, setAlertTitle] = useState('');
    const [alertDesc, setAlertDesc] = useState('');
    const [alertCat, setAlertCat] = useState('safety');

    const handleCreateAlert = (e) => {
        e.preventDefault();
        createAlert({ variables: { title: alertTitle, description: alertDesc, category: alertCat } });
        setAlertTitle('');
        setAlertDesc('');
    };

    return (
        <Row className="g-4">
            <Col lg={4}>
                <Card className="border-0 shadow-sm sticky-top bg-danger bg-opacity-5 p-4 rounded-4" style={{ top: '100px' }}>
                    <h5 className="fw-bold mb-3 text-danger">Report Alert</h5>
                    <Form onSubmit={handleCreateAlert}>
                        <Form.Control className="bg-white border-0 mb-2" placeholder="Subject" value={alertTitle} onChange={e => setAlertTitle(e.target.value)} />
                        <Form.Select className="bg-white border-0 mb-2" value={alertCat} onChange={e => setAlertCat(e.target.value)}>
                            <option value="safety">Safety</option>
                            <option value="missing_pet">Missing Pet</option>
                        </Form.Select>
                        <Form.Control as="textarea" rows={3} className="bg-white border-0 mb-3" value={alertDesc} onChange={e => setAlertDesc(e.target.value)} />
                        <Button variant="danger" type="submit" className="w-100 fw-bold">Broadcast</Button>
                    </Form>
                </Card>
            </Col>
            <Col lg={8}>
                {alerts.length === 0 ? (
                    <Card className="border-0 shadow-sm p-5 text-center rounded-4 text-muted border-start border-success border-4 bg-success bg-opacity-5">
                        <div className="display-1 mb-3">Shield</div>
                        <p className="mb-0 italic fs-5">There are no active emergency alerts in your neighborhood at the moment. Stay safe!</p>
                    </Card>
                ) : (
                    alerts.map(alert => (
                        <Alert key={alert.id} variant={alert.category === 'safety' ? 'danger' : 'warning'} className="shadow-sm border-0 p-4 rounded-4 mb-4 border-start border-4">
                            <h4 className="fw-bold mb-1">{alert.title}</h4>
                            <p className="mb-0 fs-5">{alert.description}</p>
                        </Alert>
                    ))
                )}
            </Col>
        </Row>
    );
}

export default EmergencyAlerts;
