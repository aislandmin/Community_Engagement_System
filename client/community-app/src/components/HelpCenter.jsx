import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Badge, ListGroup, Spinner, Modal } from 'react-bootstrap';

function HelpCenter({ helpRequests, currentUser, createHelp, volunteer, getSuggestions, suggestionData, suggesting, inviteVolunteer, resolveRequest }) {
    const [helpDesc, setHelpDesc] = useState('');
    const [helpLoc, setHelpLoc] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);

    const handleCreateHelp = (e) => {
        e.preventDefault();
        createHelp({ variables: { description: helpDesc, location: helpLoc } });
        setHelpDesc('');
        setHelpLoc('');
    };

    return (
        <>
            <Row className="g-4">
                <Col lg={4}>
                    <Card className="border-0 shadow-sm sticky-top bg-primary bg-opacity-5 p-4 rounded-4" style={{ top: '100px' }}>
                        <h5 className="fw-bold mb-3 text-primary text-center">Ask for Help</h5>
                        <Form onSubmit={handleCreateHelp}>
                            <Form.Control as="textarea" rows={3} className="bg-white border-0 mb-3" placeholder="Need help?" value={helpDesc} onChange={e => setHelpDesc(e.target.value)} />
                            <Form.Control className="bg-white border-0 mb-4" placeholder="Location" value={helpLoc} onChange={e => setHelpLoc(e.target.value)} />
                            <Button variant="primary" type="submit" className="w-100 fw-bold">Post</Button>
                        </Form>
                    </Card>
                </Col>
                <Col lg={8}>
                    {helpRequests.map(req => {
                        const isMatched = req.invitedVolunteers.some(v => v.id === currentUser?.id);
                        const isAuthor = req.author?.id === currentUser?.id;
                        return (
                            <Card key={req.id} className={`border-0 shadow-sm rounded-4 mb-4 overflow-hidden ${isMatched ? 'border border-primary border-2 shadow' : ''}`}>
                                {isMatched && <div className="bg-primary text-white text-center py-1 small fw-bold">GREAT MATCH!</div>}
                                <Card.Body className="p-4 text-start">
                                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                        <div>
                                            <span className="small text-muted fw-bold text-uppercase me-2">Requested by</span>
                                            <span className="fw-bold fs-5">{req.author?.username || 'Neighbor'}</span>
                                        </div>
                                        <Badge bg={req.isResolved ? "success" : "warning"} text={req.isResolved ? undefined : "dark"} className="rounded-pill px-3 py-2">{req.isResolved ? "Resolved" : "Open"}</Badge>
                                    </div>
                                    <div className="bg-light rounded-4 p-3 mb-3">
                                        <p className="fs-5 text-dark mb-0">{req.description}</p>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center gap-3 border-top pt-3 flex-wrap">
                                        <div className="d-flex align-items-center gap-2 text-dark">
                                            <svg aria-label="Location" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 10c0 4.5-8 11-8 11s-8-6.5-8-11a8 8 0 1 1 16 0Z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            <span className="fw-semibold">{req.location || 'Neighborhood Area'}</span>
                                        </div>
                                        <div className="d-flex gap-2">
                                            {isAuthor && !req.isResolved && (
                                                <>
                                                    <Button variant="outline-info" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => { setSelectedRequestId(req.id); getSuggestions({ variables: { helpRequestId: req.id } }); setShowSuggestions(true); }}>AI Match Volunteers</Button>
                                                    <Button variant="outline-success" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => resolveRequest({ variables: { id: req.id } })}>Resolve</Button>
                                                </>
                                            )}
                                            {!isAuthor && !req.isResolved && (
                                                <Button variant="primary" size="sm" className="rounded-pill px-3 fw-bold shadow-sm" onClick={() => volunteer({ variables: { id: req.id } })}>Lend a Hand</Button>
                                            )}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        );
                    })}
                </Col>
            </Row>

            <Modal show={showSuggestions} onHide={() => setShowSuggestions(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold text-primary">AI Volunteer Matches</Modal.Title></Modal.Header>
                <Modal.Body className="pt-3">
                    {suggesting ? <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-2 small text-muted fw-bold">Analyzing...</p></div> : (
                        <ListGroup variant="flush">
                            {suggestionData?.suggestVolunteers?.length > 0 ? (
                                suggestionData.suggestVolunteers.map((s, idx) => {
                                    const helpReq = helpRequests.find(r => r.id === selectedRequestId);
                                    const isInvited = helpReq?.invitedVolunteers.some(v => v.id === s.user?.id);

                                    return (
                                        <ListGroup.Item key={idx} className="border-0 px-0 mb-3 p-3 bg-light rounded-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div>
                                                    <span className="fw-bold fs-5 me-2">User: {s.user?.username}</span>
                                                    <Badge bg="success">{(s.matchScore * 100).toFixed(0)}% Match</Badge>
                                                </div>
                                                <Button
                                                    variant={isInvited ? "secondary" : "primary"}
                                                    size="sm"
                                                    className="rounded-pill fw-bold"
                                                    disabled={isInvited}
                                                    onClick={() => {
                                                        inviteVolunteer({
                                                            variables: {
                                                                helpRequestId: selectedRequestId,
                                                                volunteerId: s.user?.id
                                                            }
                                                        });
                                                    }}
                                                >
                                                    {isInvited ? "Invited" : "Invite"}
                                                </Button>
                                            </div>
                                            <p className="small text-dark opacity-75 mb-0">{s.reason}</p>
                                        </ListGroup.Item>
                                    );
                                })
                            ) : <div className="text-center py-4 text-muted">No highly relevant matches found.</div>}
                        </ListGroup>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default HelpCenter;
