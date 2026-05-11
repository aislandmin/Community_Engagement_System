import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';

function UserProfile({ currentUser, updateProfile }) {
    const [profileLocation, setProfileLocation] = useState('');
    const [profileInterests, setProfileInterests] = useState('');

    useEffect(() => {
        if (currentUser) {
            setProfileLocation(currentUser.location || '');
            setProfileInterests(currentUser.interests?.join(', ') || '');
        }
    }, [currentUser]);

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        const interestsArray = profileInterests.split(',').map(i => i.trim()).filter(i => i !== '');
        updateProfile({ variables: { location: profileLocation, interests: interestsArray } });
    };

    return (
        <Row className="justify-content-center">
            <Col lg={6}>
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="bg-primary p-4 text-center text-white">
                        <h3 className="fw-bold mb-0">{currentUser?.username}</h3>
                        <Badge bg="white" text="primary" className="mt-2 text-uppercase">
                            {currentUser?.role?.replace('_', ' ')}
                        </Badge>
                    </div>
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-4">Profile Settings</h5>
                        <Form onSubmit={handleUpdateProfile}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted uppercase">Location</Form.Label>
                                <Form.Control className="bg-light border-0 py-2" value={profileLocation} onChange={e => setProfileLocation(e.target.value)} />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-bold text-muted uppercase">Interests</Form.Label>
                                <Form.Control as="textarea" rows={3} className="bg-light border-0 py-2" value={profileInterests} onChange={e => setProfileInterests(e.target.value)} />
                            </Form.Group>
                            <Button variant="primary" type="submit" className="w-100 fw-bold py-2 rounded-3">Save Profile</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}

export default UserProfile;
