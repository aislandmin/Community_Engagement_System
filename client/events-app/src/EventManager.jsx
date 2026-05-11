import React, { useEffect, useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { Row, Col, Card, Form, Button, Badge, Alert, ListGroup, Spinner, Modal } from 'react-bootstrap';

const PREDICT_EVENT_TIMING = gql`
    query PredictEventTiming($eventDescription: String!) {
        predictEventTiming(eventDescription: $eventDescription)
    }
`;

function EventManager({ events, currentUser, createEvent, rsvpEvent, volunteerEvent, getSuggestions, suggestionData, suggesting, inviteVolunteer }) {
    const isOrganizer = currentUser?.role === 'community_organizer';

    const [eventTitle, setEventTitle] = useState('');
    const [eventDesc, setEventDesc] = useState('');
    const [eventCat, setEventCat] = useState('Workshop');
    const [eventDate, setEventDate] = useState('');
    const [eventLoc, setEventLoc] = useState('');
    const [volunteersNeeded, setVolunteersNeeded] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [predictTiming, { data: timingData, loading: timingLoading, error: timingError }] = useLazyQuery(PREDICT_EVENT_TIMING, {
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        const description = eventDesc.trim();
        if (description.length <= 10) return;

        const timer = setTimeout(() => {
            predictTiming({ variables: { eventDescription: description } });
        }, 700);

        return () => clearTimeout(timer);
    }, [eventDesc, predictTiming]);

    const handleCreateEvent = (e) => {
        e.preventDefault();
        createEvent({
            variables: {
                title: eventTitle,
                description: eventDesc,
                category: eventCat,
                date: eventDate,
                location: eventLoc,
                volunteersNeeded: parseInt(volunteersNeeded) || 0
            }
        });
        setEventTitle('');
        setEventDesc('');
        setEventDate('');
        setEventLoc('');
        setVolunteersNeeded('');
    };

    return (
        <>
            <Row className="g-4">
                {isOrganizer && (
                    <Col lg={4}>
                        <div className="sticky-top" style={{ top: '100px' }}>
                            <Card className="border-0 shadow-sm bg-warning bg-opacity-5 rounded-4 p-4 mb-4">
                                <h5 className="fw-bold mb-3 text-warning">Organize Event</h5>
                                <Form onSubmit={handleCreateEvent}>
                                    <Form.Control className="border-0 mb-2 bg-white" placeholder="Event Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required />
                                    <Form.Select className="border-0 mb-2 bg-white" value={eventCat} onChange={e => setEventCat(e.target.value)}>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Meetup">Meetup</option>
                                        <option value="Clean-up Drive">Clean-up Drive</option>
                                        <option value="Social">Social</option>
                                    </Form.Select>
                                    <Form.Control as="textarea" rows={2} className="border-0 mb-2 bg-white" placeholder="Description" value={eventDesc} onChange={e => setEventDesc(e.target.value)} required />
                                    <Form.Control className="border-0 mb-2 bg-white" placeholder="Location" value={eventLoc} onChange={e => setEventLoc(e.target.value)} required />
                                    <Form.Control type="datetime-local" className="border-0 mb-2 bg-white" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                                    <Form.Control type="number" className="border-0 mb-3 bg-white" placeholder="Volunteers Needed" value={volunteersNeeded} onChange={e => setVolunteersNeeded(e.target.value)} />

                                    {eventDesc.length > 10 && (
                                        <Alert variant="info" className="p-2 border-0 bg-white shadow-sm small mb-3">
                                            <strong>AI TIMING PREDICTION:</strong><br />
                                            {timingLoading ? 'Analyzing event details...' : timingError ? 'Timing prediction is unavailable right now.' : timingData?.predictEventTiming || 'Add more event details for a better prediction.'}
                                        </Alert>
                                    )}

                                    <Button variant="warning" type="submit" className="w-100 text-dark fw-bold shadow-sm">Post Event</Button>
                                </Form>
                            </Card>
                        </div>
                    </Col>
                )}
                <Col lg={isOrganizer ? 8 : 12}>
                    <div className="d-flex flex-column gap-4">
                        {events.length === 0 ? (
                            <Card className="border-0 shadow-sm p-5 text-center rounded-4 text-muted border-start border-warning border-4">
                                <div className="display-1 mb-3">Peace</div>
                                <p className="mb-0 italic fs-5">No upcoming events at the moment.</p>
                            </Card>
                        ) : events.map(event => {
                            const isRSVPed = event.rsvps?.some(r => r.id === currentUser?.id);
                            const isOrganizerOfEvent = event.organizer?.id === currentUser?.id;
                            const isInvited = event.invitedVolunteers?.some(v => v.id === currentUser?.id);
                            const eventDate = new Date(parseInt(event.date) || event.date);

                            return (
                                <Card key={event.id} className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-warning border-4">
                                    <Card.Body className="p-4 text-start">
                                        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                                    <Badge bg="warning" text="dark" className="text-uppercase px-3 py-2 rounded-pill">{event.category}</Badge>
                                                    <span className="small text-muted">{eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <h3 className="fw-bold mb-3 lh-sm text-start">{event.title}</h3>
                                                <div className="d-flex gap-2 flex-wrap">
                                                    <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                                                        {eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                    <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                                                        {event.location}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-center bg-light border rounded-4 px-3 py-2" style={{ minWidth: '112px' }}>
                                                <div className="fw-bold text-dark">{event.rsvps?.length || 0}</div>
                                                <div className="small text-muted">Attending</div>
                                            </div>
                                        </div>
                                        <div className="bg-light rounded-4 px-3 py-3 mb-4">
                                            <p className="text-dark opacity-75 mb-0 text-start">{event.description}</p>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                                            <div className="d-flex gap-2">
                                                {isOrganizerOfEvent ? (
                                                    <Button variant="outline-info" size="sm" className="rounded-pill px-4 fw-bold" onClick={() => { setSelectedEventId(event.id); getSuggestions({ variables: { eventId: event.id } }); setShowSuggestions(true); }}>AI Match Volunteers</Button>
                                                ) : (
                                                    <>
                                                        {isRSVPed ? <Button variant="success" size="sm" className="rounded-pill px-4 fw-bold shadow-sm" disabled>Registered</Button> : <Button variant="primary" size="sm" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => rsvpEvent({ variables: { eventId: event.id } })}>RSVP Now</Button>}
                                                        {event.volunteers?.some(v => v.id === currentUser?.id) ? <Badge bg="info" className="p-2 px-3 rounded-pill ms-2">Event Volunteer</Badge> : event.volunteersNeeded > 0 && (
                                                            <Button variant={isInvited ? "outline-primary" : "outline-secondary"} size="sm" className="rounded-pill px-4 fw-bold ms-2" onClick={() => volunteerEvent({ variables: { eventId: event.id } })}>
                                                                {isInvited ? "Agree to Volunteer" : "Volunteer"}
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            {event.volunteersNeeded > 0 && <div className="small fw-bold text-primary">{event.volunteers?.length || 0} / {event.volunteersNeeded} volunteers joined</div>}
                                        </div>
                                    </Card.Body>
                                </Card>
                            );
                        })}
                    </div>
                </Col>
            </Row>

            <Modal show={showSuggestions} onHide={() => setShowSuggestions(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold text-primary">AI Volunteer Matches</Modal.Title></Modal.Header>
                <Modal.Body className="pt-3">
                    {suggesting ? <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-2 small text-muted fw-bold">Analyzing...</p></div> : (
                        <ListGroup variant="flush">
                            {suggestionData?.suggestVolunteers?.length > 0 ? (
                                suggestionData.suggestVolunteers.map((s, idx) => {
                                    const event = events.find(e => e.id === selectedEventId);
                                    const isInvited = event?.invitedVolunteers?.some(v => v.id === s.user?.id);

                                    return (
                                        <ListGroup.Item key={idx} className="border-0 px-0 mb-3 p-3 bg-light rounded-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div><span className="fw-bold fs-5 me-2">User: {s.user?.username}</span><Badge bg="success">{(s.matchScore * 100).toFixed(0)}% Match</Badge></div>

                                                <Button variant={isInvited ? "secondary" : "primary"} size="sm" className="rounded-pill fw-bold" disabled={isInvited} onClick={() => inviteVolunteer({ variables: { eventId: selectedEventId, volunteerId: s.user?.id } })}>
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

export default EventManager;
