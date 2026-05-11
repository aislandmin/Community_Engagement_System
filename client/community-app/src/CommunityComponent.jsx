import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql, useLazyQuery } from '@apollo/client';
import { Container, Nav, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import { io } from 'socket.io-client';

import NewsFeed from './components/NewsFeed';
import HelpCenter from './components/HelpCenter';
import BusinessDirectory from './components/BusinessDirectory';
import EmergencyAlerts from './components/EmergencyAlerts';
import UserProfile from './components/UserProfile';
import AIChatbot from './AIChatbot';

const GET_COMMUNITY_DATA = gql`
  query GetCommunityData {
    currentUser { id username role interests location }
    posts { id title content category author { id username } aiSummary comments { id username content createdAt } updatedAt }
    helpRequests { id description location isResolved author { id username } volunteers { id username } invitedVolunteers { id } createdAt }
    alerts { id title description category location isActive author { id username } createdAt }
    businesses { id name description category location images owner { id username } deals { id title description discount } reviews { id rating comment response sentimentScore businessFeedback deal { id title } author { id username } createdAt } }
    events { id title description category date location organizer { id } rsvps { id } invitedVolunteers { id } volunteers { id } volunteersNeeded volunteerInterests timingInsight }
  }
`;

const CREATE_POST = gql` mutation CreatePost($title: String!, $content: String!, $category: PostCategory!) { createPost(title: $title, content: $content, category: $category) { id title } } `;
const ADD_COMMENT = gql` mutation AddComment($postId: ID!, $content: String!) { addComment(postId: $postId, content: $content) { id comments { id content } } } `;
const CREATE_ALERT = gql` mutation CreateAlert($title: String!, $description: String!, $category: String!, $location: String) { createAlert(title: $title, description: $description, category: $category, location: $location) { id title } } `;
const CREATE_HELP_REQUEST = gql` mutation CreateHelpRequest($description: String!, $location: String) { createHelpRequest(description: $description, location: $location) { id description } } `;
const VOLUNTEER = gql` mutation Volunteer($id: ID!) { volunteerForHelpRequest(id: $id) { id volunteers { id username } } } `;
const CREATE_BUSINESS = gql` mutation CreateBusiness($name: String!, $description: String!, $category: String!, $images: [String], $location: String, $initialDeal: InitialDealInput) { createBusiness(name: $name, description: $description, category: $category, images: $images, location: $location, initialDeal: $initialDeal) { id name } } `;
const CREATE_DEAL = gql` mutation CreateDeal($businessId: ID!, $title: String!, $description: String!, $discount: String) { createDeal(businessId: $businessId, title: $title, description: $description, discount: $discount) { id title } } `;
const CREATE_REVIEW = gql` mutation CreateReview($businessId: ID!, $dealId: ID, $rating: Int!, $comment: String!) { createReview(businessId: $businessId, dealId: $dealId, rating: $rating, comment: $comment) { id rating comment } } `;
const RESPOND_TO_REVIEW = gql` mutation RespondToReview($reviewId: ID!, $response: String!) { respondToReview(reviewId: $reviewId, response: $response) { id response } } `;
const UPDATE_PROFILE = gql` mutation UpdateUserProfile($interests: [String], $location: String) { updateUserProfile(interests: $interests, location: $location) { id interests location } } `;
const UPDATE_BUSINESS = gql` mutation UpdateBusiness($id: ID!, $name: String, $description: String, $category: String, $images: [String], $location: String) { updateBusiness(id: $id, name: $name, description: $description, category: $category, images: $images, location: $location) { id name } } `;
const SUGGEST_VOLUNTEERS = gql` query SuggestVolunteers($helpRequestId: ID, $eventId: ID) { suggestVolunteers(helpRequestId: $helpRequestId, eventId: $eventId) { user { id username } matchScore reason } } `;
const INVITE_VOLUNTEER = gql` mutation InviteVolunteer($helpRequestId: ID, $eventId: ID, $volunteerId: ID!) { inviteVolunteer(helpRequestId: $helpRequestId, eventId: $eventId, volunteerId: $volunteerId) { id } } `;
const RESOLVE_HELP_REQUEST = gql` mutation ResolveHelpRequest($id: ID!) { resolveHelpRequest(id: $id) { id isResolved } } `;

function CommunityComponent({ activeTab: controlledActiveTab, onTabChange, hideTabs = false }) {
    const { loading, error, data, refetch } = useQuery(GET_COMMUNITY_DATA);
    const [internalActiveTab, setInternalActiveTab] = useState('posts');
    const [successMessage, setSuccessMessage] = useState('');
    const activeTab = controlledActiveTab || internalActiveTab;
    const setActiveTab = (tab) => {
        setInternalActiveTab(tab);
        onTabChange?.(tab);
    };

    const [getSuggestions, { loading: suggesting, data: suggestionData }] = useLazyQuery(SUGGEST_VOLUNTEERS, { fetchPolicy: 'network-only' });

    const [createPost] = useMutation(CREATE_POST, { onCompleted: () => { refetch(); setSuccessMessage('Post created!'); } });
    const [addComment] = useMutation(ADD_COMMENT, { onCompleted: () => { refetch(); setSuccessMessage('Comment added!'); } });
    const [createAlert] = useMutation(CREATE_ALERT, { onCompleted: () => { refetch(); setSuccessMessage('Alert broadcasted!'); } });
    const [createHelp] = useMutation(CREATE_HELP_REQUEST, { onCompleted: () => { refetch(); setSuccessMessage('Help request posted!'); } });
    const [volunteer] = useMutation(VOLUNTEER, { onCompleted: () => { refetch(); setSuccessMessage('You are now a volunteer!'); } });
    const [createBiz] = useMutation(CREATE_BUSINESS, { onCompleted: () => { refetch(); setSuccessMessage('Business profile launched!'); } });
    const [createDeal] = useMutation(CREATE_DEAL, { onCompleted: () => { refetch(); setSuccessMessage('New deal broadcasted!'); } });
    const [createReview] = useMutation(CREATE_REVIEW, { onCompleted: () => { refetch(); setSuccessMessage('Review submitted!'); } });
    const [respondToReview] = useMutation(RESPOND_TO_REVIEW, { onCompleted: () => { refetch(); setSuccessMessage('Response sent!'); } });
    const [updateProfile] = useMutation(UPDATE_PROFILE, { onCompleted: () => { refetch(); setSuccessMessage('Profile updated!'); } });
    const [updateBusiness] = useMutation(UPDATE_BUSINESS, { onCompleted: () => { refetch(); setSuccessMessage('Business profile updated!'); } });
    const [inviteVolunteer] = useMutation(INVITE_VOLUNTEER, { onCompleted: () => { refetch(); setSuccessMessage('Invitation sent!'); } });
    const [resolveRequest] = useMutation(RESOLVE_HELP_REQUEST, { onCompleted: () => { refetch(); setSuccessMessage('Request resolved!'); } });

    useEffect(() => {
        if (data?.currentUser) {
            if (!controlledActiveTab && data.currentUser.role === 'business_owner') setActiveTab('businesses');
        }
    }, [data?.currentUser?.id, controlledActiveTab]);

    useEffect(() => {
        const communitySocket = io('http://localhost:4003');
        const businessSocket = io('http://localhost:4004');
        communitySocket.on('new-emergency-alert', (alert) => {
            refetch();
        });
        businessSocket.on('new-review', (review) => {
            const myBiz = data?.businesses.find(b => b.owner?.id === data?.currentUser?.id);
            if (myBiz?.id === review.businessId || activeTab === 'businesses') {
                refetch();
                if (myBiz?.id === review.businessId) setSuccessMessage(`New review from ${review.reviewerName}!`);
            }
        });
        return () => { communitySocket.disconnect(); businessSocket.disconnect(); };
    }, [activeTab, refetch, data?.currentUser?.id]);

    useEffect(() => {
        if (!successMessage) return;

        const timer = setTimeout(() => {
            setSuccessMessage('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [successMessage]);

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <Alert variant="danger" className="m-4">Error: {error.message}</Alert>;

    const isResident = data.currentUser.role === 'resident';
    const isOwner = data.currentUser.role === 'business_owner';

    return (
        <div className="bg-white min-vh-100 position-relative">
            {!hideTabs && <div className="border-bottom bg-light bg-opacity-50" style={{ top: 0, zIndex: 1020 }}>
                <Nav variant="tabs" activeKey={activeTab} onSelect={k => setActiveTab(k)} className="justify-content-center pt-3 border-0">
                    {isResident && (
                        <>
                            <Nav.Item><Nav.Link eventKey="posts" className="px-4 fw-bold">Feeds</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="alerts" className="px-4 fw-bold">Alerts</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="help" className="px-4 fw-bold">Helps</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="businesses" className="px-4 fw-bold">Businesses</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="ai" className="px-4 fw-bold">Assistant</Nav.Link></Nav.Item>
                        </>
                    )}
                    {isOwner && <Nav.Item><Nav.Link eventKey="businesses" className="px-4 fw-bold">Businesses</Nav.Link></Nav.Item>}
                    <Nav.Item><Nav.Link eventKey="profile" className="px-4 fw-bold">Profile</Nav.Link></Nav.Item>
                </Nav>
            </div>}

            <Container fluid className="py-5">
                {successMessage && <Alert variant="success" className="text-center shadow-sm mb-4 fw-bold fixed-top mx-auto" style={{ maxWidth: '400px', top: '80px', zIndex: 1100 }} onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}

                <div className={activeTab === 'posts' ? 'd-block' : 'd-none'}>
                    <NewsFeed posts={data.posts} currentUser={data.currentUser} createPost={createPost} addComment={addComment} />
                </div>
                <div className={activeTab === 'alerts' ? 'd-block' : 'd-none'}>
                    <EmergencyAlerts alerts={data.alerts} currentUser={data.currentUser} createAlert={createAlert} />
                </div>
                <div className={activeTab === 'help' ? 'd-block' : 'd-none'}>
                    <HelpCenter helpRequests={data.helpRequests} currentUser={data.currentUser} createHelp={createHelp} volunteer={volunteer} getSuggestions={getSuggestions} suggestionData={suggestionData} suggesting={suggesting} inviteVolunteer={inviteVolunteer} resolveRequest={resolveRequest} />
                </div>
                <div className={activeTab === 'businesses' ? 'd-block' : 'd-none'}>
                    <BusinessDirectory businesses={data.businesses} currentUser={data.currentUser} createBiz={createBiz} createDeal={createDeal} createReview={createReview} respondToReview={respondToReview} updateBusiness={updateBusiness} />
                </div>
                <div className={activeTab === 'ai' ? 'd-block' : 'd-none'} style={{ minHeight: '600px' }}>
                    <AIChatbot />
                </div>
                <div className={activeTab === 'profile' ? 'd-block' : 'd-none'}>
                    <UserProfile currentUser={data.currentUser} updateProfile={updateProfile} />
                </div>
            </Container>
        </div>
    );
}

export default CommunityComponent;
