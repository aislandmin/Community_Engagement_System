import React from 'react';
import { useQuery, useMutation, gql, useLazyQuery } from '@apollo/client';
import { Container, Spinner, Alert } from 'react-bootstrap';
import EventManager from './EventManager';

const GET_EVENTS_DATA = gql`
  query GetEventsData {
    currentUser { id username role interests location }
    events { id title description category date location organizer { id } rsvps { id } invitedVolunteers { id } volunteers { id } volunteersNeeded volunteerInterests timingInsight }
  }
`;

const CREATE_EVENT = gql` mutation CreateEvent($title: String!, $description: String!, $category: String!, $date: String!, $location: String!, $volunteersNeeded: Int) { createEvent(title: $title, description: $description, category: $category, date: $date, location: $location, volunteersNeeded: $volunteersNeeded) { id title } } `;
const RSVP_EVENT = gql` mutation RsvpEvent($eventId: ID!) { rsvpToEvent(eventId: $eventId) { id rsvps { id } } } `;
const VOLUNTEER_EVENT = gql` mutation VolunteerEvent($eventId: ID!) { volunteerForEvent(eventId: $eventId) { id volunteers { id } } } `;
const SUGGEST_VOLUNTEERS = gql` query SuggestVolunteers($eventId: ID) { suggestVolunteers(eventId: $eventId) { user { id username } matchScore reason } } `;
const INVITE_VOLUNTEER = gql` mutation InviteVolunteer($eventId: ID, $volunteerId: ID!) { inviteVolunteer(eventId: $eventId, volunteerId: $volunteerId) { id } } `;

function App() {
    const { loading, error, data, refetch } = useQuery(GET_EVENTS_DATA);
    const [getSuggestions, { loading: suggesting, data: suggestionData }] = useLazyQuery(SUGGEST_VOLUNTEERS, { fetchPolicy: 'network-only' });

    const [createEvent] = useMutation(CREATE_EVENT, { onCompleted: () => refetch() });
    const [rsvpEvent] = useMutation(RSVP_EVENT, { onCompleted: () => refetch() });
    const [volunteerEvent] = useMutation(VOLUNTEER_EVENT, { onCompleted: () => refetch() });
    const [inviteVolunteer] = useMutation(INVITE_VOLUNTEER, { onCompleted: () => refetch() });

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <Alert variant="danger">Error: {error.message}</Alert>;

    return (
        <Container fluid className="py-4">
            <EventManager 
                events={data.events} 
                currentUser={data.currentUser} 
                createEvent={createEvent} 
                rsvpEvent={rsvpEvent} 
                volunteerEvent={volunteerEvent} 
                getSuggestions={getSuggestions} 
                suggestionData={suggestionData} 
                suggesting={suggesting} 
                inviteVolunteer={inviteVolunteer} 
            />
        </Container>
    );
}

export default App;
