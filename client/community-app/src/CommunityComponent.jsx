import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql, useLazyQuery } from '@apollo/client';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    Nav,
    Badge,
    Alert,
    Spinner,
    ListGroup,
    Modal,
    ProgressBar
} from 'react-bootstrap';
import { io } from 'socket.io-client';

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
const UPDATE_BUSINESS = gql` mutation UpdateBusiness($id: ID!, $name: String, $description: String, $category: String, $images: [String], $location: String) { updateBusiness(id: $id, name: $name, description: $description, category: $category, images: $images, location: $location) { id name } } `;

const CREATE_POST = gql` mutation CreatePost($title: String!, $content: String!, $category: PostCategory!) { createPost(title: $title, content: $content, category: $category) { id title } } `;
const ADD_COMMENT = gql` mutation AddComment($postId: ID!, $content: String!) { addComment(postId: $postId, content: $content) { id comments { id content } } } `;
const CREATE_ALERT = gql` mutation CreateAlert($title: String!, $description: String!, $category: String!, $location: String) { createAlert(title: $title, description: $description, category: $category, location: $location) { id title } } `;
const CREATE_HELP_REQUEST = gql` mutation CreateHelpRequest($description: String!, $location: String) { createHelpRequest(description: $description, location: $location) { id description } } `;
const VOLUNTEER = gql` mutation Volunteer($id: ID!) { volunteerForHelpRequest(id: $id) { id volunteers { id username } } } `;
const CREATE_EVENT = gql` mutation CreateEvent($title: String!, $description: String!, $category: String!, $date: String!, $location: String!, $volunteersNeeded: Int) { createEvent(title: $title, description: $description, category: $category, date: $date, location: $location, volunteersNeeded: $volunteersNeeded) { id title } } `;
const RSVP_EVENT = gql` mutation RsvpEvent($eventId: ID!) { rsvpToEvent(eventId: $eventId) { id rsvps { id } } } `;
const VOLUNTEER_EVENT = gql` mutation VolunteerEvent($eventId: ID!) { volunteerForEvent(eventId: $eventId) { id volunteers { id } } } `;
const CREATE_BUSINESS = gql` mutation CreateBusiness($name: String!, $description: String!, $category: String!, $images: [String], $location: String, $initialDeal: InitialDealInput) { createBusiness(name: $name, description: $description, category: $category, images: $images, location: $location, initialDeal: $initialDeal) { id name } } `;

const CREATE_DEAL = gql` mutation CreateDeal($businessId: ID!, $title: String!, $description: String!, $discount: String) { createDeal(businessId: $businessId, title: $title, description: $description, discount: $discount) { id title } } `;
const CREATE_REVIEW = gql` mutation CreateReview($businessId: ID!, $dealId: ID, $rating: Int!, $comment: String!) { createReview(businessId: $businessId, dealId: $dealId, rating: $rating, comment: $comment) { id rating comment } } `;
const RESPOND_TO_REVIEW = gql` mutation RespondToReview($reviewId: ID!, $response: String!) { respondToReview(reviewId: $reviewId, response: $response) { id response } } `;
const UPDATE_PROFILE = gql` mutation UpdateUserProfile($interests: [String], $location: String) { updateUserProfile(interests: $interests, location: $location) { id interests location } } `;
const SUGGEST_VOLUNTEERS = gql` query SuggestVolunteers($helpRequestId: ID, $eventId: ID) { suggestVolunteers(helpRequestId: $helpRequestId, eventId: $eventId) { user { id username } matchScore reason } } `;
const INVITE_VOLUNTEER = gql` mutation InviteVolunteer($helpRequestId: ID, $eventId: ID, $volunteerId: ID!) { inviteVolunteer(helpRequestId: $helpRequestId, eventId: $eventId, volunteerId: $volunteerId) { id } } `;
const RESOLVE_HELP_REQUEST = gql` mutation ResolveHelpRequest($id: ID!) { resolveHelpRequest(id: $id) { id isResolved } } `;

function CommunityComponent() {
    const { loading, error, data, refetch } = useQuery(GET_COMMUNITY_DATA);
    const currentUser = data?.currentUser;

    const [activeTab, setActiveTab] = useState('posts');
    const [incomingAlert, setIncomingAlert] = useState(null);
    const [incomingInvite, setIncomingInvite] = useState(null);
    const [unreadAlertCount, setUnreadAlertCount] = useState(0);
    
    // Set initial tab based on role once data is loaded
    useEffect(() => {
        if (currentUser) {
            if (currentUser.role === 'business_owner') setActiveTab('businesses');
            else if (currentUser.role === 'community_organizer') setActiveTab('events');
            else setActiveTab('posts');
        }
    }, [currentUser?.id]);

    const [successMessage, setSuccessMessage] = useState('');
    const [getSuggestions, { loading: suggesting, data: suggestionData }] = useLazyQuery(SUGGEST_VOLUNTEERS, { fetchPolicy: 'network-only' });

    const [createPost] = useMutation(CREATE_POST, { onCompleted: () => { refetch(); setSuccessMessage('Post created!'); setPostTitle(''); setPostContent(''); }, onError: (e) => alert('Post error: ' + e.message) });
    const [addComment] = useMutation(ADD_COMMENT, { onCompleted: () => { refetch(); setSuccessMessage('Comment added!'); }, onError: (e) => alert('Comment error: ' + e.message) });
    const [createAlert] = useMutation(CREATE_ALERT, { onCompleted: () => { refetch(); setSuccessMessage('Alert broadcasted!'); setAlertTitle(''); setAlertDesc(''); }, onError: (e) => alert('Alert error: ' + e.message) });
    const [createHelp] = useMutation(CREATE_HELP_REQUEST, { onCompleted: () => { refetch(); setSuccessMessage('Help request posted!'); setHelpDesc(''); setHelpLoc(''); }, onError: (e) => alert('Help error: ' + e.message) });
    const [volunteer] = useMutation(VOLUNTEER, { onCompleted: () => { refetch(); setSuccessMessage('You are now a volunteer!'); }, onError: (e) => alert('Volunteer error: ' + e.message) });
    const [createEvent] = useMutation(CREATE_EVENT, { onCompleted: () => { refetch(); setSuccessMessage('Event scheduled!'); setEventTitle(''); setEventDate(''); setEventLoc(''); }, onError: (e) => alert('Event error: ' + e.message) });
    const [rsvpEvent] = useMutation(RSVP_EVENT, { onCompleted: () => { refetch(); setSuccessMessage('RSVP confirmed!'); }, onError: (e) => alert('RSVP error: ' + e.message) });
    const [createBiz] = useMutation(CREATE_BUSINESS, { onCompleted: () => { refetch(); setSuccessMessage('Business profile launched!'); setInitDealTitle(''); setInitDealDisc(''); }, onError: (e) => alert('Launch error: ' + e.message) });
    const [createDeal] = useMutation(CREATE_DEAL, { onCompleted: () => { refetch(); setSuccessMessage('New deal broadcasted!'); }, onError: (e) => alert('Deal error: ' + e.message) });
    const [createReview] = useMutation(CREATE_REVIEW, { onCompleted: () => { refetch(); setSuccessMessage('Review submitted!'); }, onError: (e) => alert('Review error: ' + e.message) });
    const [respondToReview] = useMutation(RESPOND_TO_REVIEW, { onCompleted: () => { refetch(); setSuccessMessage('Response sent!'); }, onError: (e) => alert('Response error: ' + e.message) });
    const [updateProfile] = useMutation(UPDATE_PROFILE, { onCompleted: () => { refetch(); setSuccessMessage('Profile updated!'); }, onError: (e) => alert('Profile error: ' + e.message) });
    const [updateBusiness] = useMutation(UPDATE_BUSINESS, { onCompleted: () => { refetch(); setSuccessMessage('Business profile updated!'); }, onError: (e) => alert('Update error: ' + e.message) });
    const [inviteVolunteer] = useMutation(INVITE_VOLUNTEER, { onCompleted: () => { refetch(); setSuccessMessage('Invitation sent!'); setShowSuggestions(false); }, onError: (e) => alert('Invite error: ' + e.message) });
    const [resolveRequest] = useMutation(RESOLVE_HELP_REQUEST, { onCompleted: () => { refetch(); setSuccessMessage('Request resolved!'); }, onError: (e) => alert('Resolve error: ' + e.message) });
    const [volunteerEvent] = useMutation(VOLUNTEER_EVENT, { onCompleted: () => { refetch(); setSuccessMessage('You are now a volunteer for this event!'); }, onError: (e) => alert('Volunteer error: ' + e.message) });

    // UI States
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showEditBizModal, setShowEditBizModal] = useState(false);
    const [selectedBiz, setSelectedBiz] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [selectedDealId, setSelectedDealId] = useState('');
    const [ownerResponse, setOwnerResponse] = useState({});
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);

    // Form States
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState('discussion');
    const [alertTitle, setAlertTitle] = useState('');
    const [alertDesc, setAlertDesc] = useState('');
    const [alertCat, setAlertCat] = useState('safety');
    const [helpDesc, setHelpDesc] = useState('');
    const [helpLoc, setHelpLoc] = useState('');
    const [eventTitle, setEventTitle] = useState('');
    const [eventDesc, setEventDesc] = useState('');
    const [eventCat, setEventCat] = useState('Workshop');
    const [eventDate, setEventDate] = useState('');
    const [eventLoc, setEventLoc] = useState('');
    const [volunteersNeeded, setVolunteersNeeded] = useState('');
    const [bizName, setBizName] = useState('');
    const [bizDesc, setBizDesc] = useState('');
    const [bizCat, setBizCat] = useState('Food & Dining');
    const [bizLoc, setBizLoc] = useState('');
    const [bizImages, setBizImages] = useState([]);
    const [dealTitle, setDealTitle] = useState('');
    const [dealDisc, setDealDisc] = useState('');
    const [dealDesc, setDealDesc] = useState('');
    const [profileLocation, setProfileLocation] = useState('');
    const [profileInterests, setProfileInterests] = useState('');
    const [commentContent, setCommentContent] = useState({});

    // New Offer State for creation
    const [initDealTitle, setInitDealTitle] = useState('');
    const [initDealDisc, setInitDealDisc] = useState('');

    useEffect(() => {
        if (activeTab === 'alerts') {
            setUnreadAlertCount(0);
        }
    }, [activeTab]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBizImages([reader.result]); // Use Base64 string as "URL"
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (data?.currentUser) {
            setProfileLocation(data.currentUser.location || '');
            setProfileInterests(data.currentUser.interests?.join(', ') || '');
        }
        const myBiz = data?.businesses.find(b => b.owner?.id === data?.currentUser?.id);
        if (myBiz) {
            setBizName(myBiz.name);
            setBizDesc(myBiz.description);
            setBizCat(myBiz.category);
            setBizLoc(myBiz.location);
            setBizImages(myBiz.images || []);
        }
    }, [data]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        const communitySocket = io('http://localhost:4003');
        const businessSocket = io('http://localhost:4004');

        communitySocket.on('new-emergency-alert', (alert) => {
            if (activeTab !== 'alerts') {
                setIncomingAlert(alert);
                setUnreadAlertCount(prev => prev + 1);
            }
            refetch();
        });

        communitySocket.on('new-volunteer-invitation', (invite) => {
            if (invite.volunteerId === data?.currentUser?.id) setIncomingInvite(invite);
        });

        businessSocket.on('new-review', (review) => {
            console.log('✨ Real-time review received:', review);
            // If the current user is the owner of this business, or we're on the businesses tab, refresh
            const myBiz = data?.businesses.find(b => b.owner?.id === data?.currentUser?.id);
            if (myBiz?.id === review.businessId || activeTab === 'businesses') {
                refetch();
                if (myBiz?.id === review.businessId) {
                    setSuccessMessage(`New review from ${review.reviewerName}!`);
                }
            }
        });

        return () => {
            communitySocket.disconnect();
            businessSocket.disconnect();
        };
    }, [activeTab, refetch, data?.currentUser?.id, data?.businesses]);

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <Alert variant="danger" className="m-4">Error: {error.message}</Alert>;

    const isBusinessOwner = currentUser?.role === 'business_owner';
    const isOrganizer = currentUser?.role === 'community_organizer';
    const isResident = currentUser?.role === 'resident';

    const myBusiness = data.businesses.find(b => b.owner?.id === currentUser?.id);

    const calculateSentiment = (reviews) => {
        if (!reviews?.length) return 0;
        const avg = reviews.reduce((acc, r) => acc + (r.sentimentScore || 0), 0) / reviews.length;
        return Math.round((avg + 1) * 50);
    };

    const handleAddComment = (postId) => {
        const content = commentContent[postId];
        if (!content) return;
        addComment({ variables: { postId, content } });
        setCommentContent({ ...commentContent, [postId]: '' });
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        const interestsArray = profileInterests.split(',').map(i => i.trim()).filter(i => i !== '');
        updateProfile({ variables: { location: profileLocation, interests: interestsArray } });
    };

    const handleRespondToReview = (reviewId) => {
        const response = ownerResponse[reviewId];
        if (!response) return;
        respondToReview({ variables: { reviewId, response } });
        setOwnerResponse({ ...ownerResponse, [reviewId]: '' });
    };

    return (
        <div className="bg-white min-vh-100 position-relative">
            {/* Notifications */}
            {incomingAlert && (<div className="position-fixed top-0 end-0 p-4" style={{ zIndex: 2000, maxWidth: '400px' }}><Alert variant="danger" className="shadow-lg border-0 rounded-4" onClose={() => setIncomingAlert(null)} dismissible><Alert.Heading className="h5 fw-black">🚨 EMERGENCY ALERT</Alert.Heading><hr /><p className="fw-bold mb-1">{incomingAlert.title}</p><p className="small mb-2">{incomingAlert.description}</p><Button variant="light" size="sm" className="w-100 mt-3 fw-bold text-danger" onClick={() => { setActiveTab('alerts'); setIncomingAlert(null); }}>View All Alerts</Button></Alert></div>)}
            {incomingInvite && (
                <div className="position-fixed top-0 end-0 p-4" style={{ zIndex: 2000, maxWidth: '400px', marginTop: incomingAlert ? '200px' : '0' }}>
                    <Alert variant="primary" className="shadow-lg border-0 rounded-4" onClose={() => setIncomingInvite(null)} dismissible>
                        <Alert.Heading className="h5 fw-bold">✨ YOU'VE BEEN INVITED!</Alert.Heading>
                        <hr />
                        <p className="small mb-1"><strong>{incomingInvite.requesterName}</strong> thinks you'd be a great match.</p>
                        <Button
                            variant="primary"
                            size="sm"
                            className="w-100 fw-bold"
                            onClick={() => {
                                setActiveTab(incomingInvite.eventId ? 'events' : 'help');
                                setIncomingInvite(null);
                            }}
                        >
                            View {incomingInvite.eventId ? 'Event' : 'Request'}
                        </Button>
                    </Alert>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="border-bottom bg-light bg-opacity-50" style={{ top: 0, zIndex: 1020 }}>
                <Nav variant="tabs" activeKey={activeTab} onSelect={k => setActiveTab(k)} className="justify-content-center pt-3 border-0">
                    {isResident && (
                        <>
                            <Nav.Item><Nav.Link eventKey="posts" className="px-4 fw-bold">Feed</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="alerts" className="px-4 fw-bold">Alerts {unreadAlertCount > 0 && <Badge bg="danger" pill className="ms-1">{unreadAlertCount}</Badge>}</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="help" className="px-4 fw-bold">Help</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="events" className="px-4 fw-bold">Events</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="businesses" className="px-4 fw-bold">Businesses</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="ai" className="px-4 fw-bold">Assistant</Nav.Link></Nav.Item>
                        </>
                    )}
                    {isOrganizer && <Nav.Item><Nav.Link eventKey="events" className="px-4 fw-bold">Events</Nav.Link></Nav.Item>}
                    {isBusinessOwner && <Nav.Item><Nav.Link eventKey="businesses" className="px-4 fw-bold">Businesses</Nav.Link></Nav.Item>}
                    <Nav.Item><Nav.Link eventKey="profile" className="px-4 fw-bold">Profile</Nav.Link></Nav.Item>
                </Nav>
            </div>

            <Container fluid="lg" className="py-5">
                {successMessage && <Alert variant="success" className="text-center shadow-sm mb-4 fw-bold fixed-top mx-auto" style={{ maxWidth: '400px', top: '80px', zIndex: 1100 }}>{successMessage}</Alert>}

                {/* 1. Feed Section */}
                <div className={activeTab === 'posts' ? 'd-block' : 'd-none'}>
                    <Row className="g-4">
                        <Col lg={4}><Card className="border-0 shadow-sm sticky-top p-4 rounded-4" style={{ top: '100px' }}><h5 className="fw-bold mb-3 text-primary">Share Something</h5><Form onSubmit={e => { e.preventDefault(); createPost({ variables: { title: postTitle, content: postContent, category: postCategory } }); }}><Form.Group className="mb-2"><Form.Control className="bg-light border-0" placeholder="Title" value={postTitle} onChange={e => setPostTitle(e.target.value)} /></Form.Group><Form.Group className="mb-2"><Form.Select className="bg-light border-0" value={postCategory} onChange={e => setPostCategory(e.target.value)}><option value="news">News</option><option value="discussion">Discussion</option></Form.Select></Form.Group><Form.Group className="mb-3"><Form.Control as="textarea" rows={3} className="bg-light border-0" placeholder="What's happening?" value={postContent} onChange={e => setPostContent(e.target.value)} /></Form.Group><Button variant="primary" type="submit" className="w-100 fw-bold">Post to Feed</Button></Form></Card></Col>
                        <Col lg={8}><div className="d-flex flex-column gap-4">{data.posts.map(post => (<Card key={post.id} className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-primary border-4"><Card.Body className="p-4"><div className="d-flex justify-content-between align-items-start mb-3"><div className="flex-grow-1"><h4 className="fw-bold mb-0">{post.title}</h4><small className="text-muted">By {post.author?.username}</small></div><Badge bg={post.category === 'news' ? 'primary' : 'secondary'} className="px-3 py-2 rounded-pill small" style={{ height: 'fit-content' }}>{post.category.toUpperCase()}</Badge></div><p className="text-dark mb-4">{post.content}</p>{post.aiSummary && (<Alert variant="primary" className="py-3 px-4 border-0 bg-primary bg-opacity-75 text-white rounded-4 d-flex gap-3 mb-4 shadow-sm"><span className="fs-4">✨</span><div><div className="fw-bold small text-uppercase mb-1 opacity-75">AI INSIGHT</div><div className="fw-medium small">{post.aiSummary}</div></div></Alert>)}<div className="bg-light p-3 rounded-4"><h6 className="fw-bold small text-muted mb-3">COMMENTS ({post.comments?.length || 0})</h6>{(post.comments || []).map(comment => (<div key={comment.id} className="small mb-2"><strong className="text-primary">{comment.username}:</strong> {comment.content}</div>))}<Form onSubmit={e => { e.preventDefault(); handleAddComment(post.id); }} className="mt-3 d-flex gap-2"><Form.Control size="sm" className="border-0 shadow-sm" placeholder="Reply..." value={commentContent[post.id] || ''} onChange={e => setCommentContent({ ...commentContent, [post.id]: e.target.value })} /><Button variant="link" size="sm" className="p-0 fw-bold text-decoration-none" type="submit">SEND</Button></Form></div></Card.Body></Card>))}</div></Col>
                    </Row>
                </div>

                {/* 2. Business Section */}
                <div className={activeTab === 'businesses' ? 'd-block' : 'd-none'}>
                    <Row className="g-4">
                        <Col lg={4}>
                            {isBusinessOwner ? (
                                <div className="sticky-top" style={{ top: '100px' }}>
                                    <Card className="border-0 shadow-sm bg-info bg-opacity-5 rounded-4 p-4 mb-4">
                                        {!myBusiness ? (
                                            <Form onSubmit={e => {
                                                e.preventDefault();
                                                createBiz({
                                                    variables: {
                                                        name: bizName,
                                                        description: bizDesc,
                                                        category: bizCat,
                                                        images: bizImages,
                                                        initialDeal: initDealTitle ? {
                                                            title: initDealTitle,
                                                            discount: initDealDisc,
                                                            description: "Product/Service offered by " + bizName
                                                        } : null
                                                    }
                                                });
                                            }}>
                                                <h5 className="fw-bold mb-3 text-info">Launch Your Business</h5>

                                                <Form.Group className="mb-2">
                                                    <Form.Label className="small fw-bold text-muted">BUSINESS NAME *</Form.Label>
                                                    <Form.Control className="border-0 bg-white" placeholder="e.g. Sunny Cafe" value={bizName} onChange={e => setBizName(e.target.value)} required />
                                                </Form.Group>

                                                <Form.Group className="mb-2">
                                                    <Form.Label className="small fw-bold text-muted">DESCRIPTION *</Form.Label>
                                                    <Form.Control as="textarea" rows={2} className="border-0 bg-white" placeholder="What makes your products or services special?" value={bizDesc} onChange={e => setBizDesc(e.target.value)} required />
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label className="small fw-bold text-muted">UPLOAD PROFILE IMAGE *</Form.Label>
                                                    <Form.Control type="file" size="sm" className="border-0 bg-white" onChange={handleImageUpload} required />
                                                    {bizImages.length > 0 && <div className="mt-2 small text-success fw-bold">✓ Image selected</div>}
                                                </Form.Group>

                                                <hr className="my-3" />
                                                <h6 className="small fw-bold text-primary mb-2">ADD YOUR FIRST PRODUCT/SERVICE *</h6>

                                                <Form.Group className="mb-2">
                                                    <Form.Control size="sm" className="border-0 bg-white" placeholder="Product/Service Name (e.g. Organic Coffee)" value={initDealTitle} onChange={e => setInitDealTitle(e.target.value)} required />
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Control size="sm" className="border-0 bg-white" placeholder="Price or Discount (e.g. $5.00 or 20% OFF)" value={initDealDisc} onChange={e => setInitDealDisc(e.target.value)} required />
                                                </Form.Group>

                                                <Button variant="info" type="submit" className="w-100 text-white fw-bold shadow-sm">Launch Business & Offer</Button>
                                            </Form>
                                        ) : (
                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h5 className="fw-bold text-white mb-0">{myBusiness.name}</h5>
                                                    <Button variant="link" size="sm" className="p-0 text-white fw-bold text-decoration-none" onClick={() => setShowEditBizModal(true)}>EDIT PROFILE</Button>
                                                </div>
                                                <div className="mb-3">
                                                    {/* Gallery Preview */}
                                                    <Card className="border-0 shadow-sm rounded-4">
                                                        <div className="d-flex gap-2 overflow-auto py-2 justify-content-center">
                                                            {myBusiness.images?.length > 0 ? (
                                                                myBusiness.images.map((img, idx) => (
                                                                    <img
                                                                        key={idx}
                                                                        src={img}
                                                                        alt="Business"
                                                                        className="rounded-3 shadow-sm"
                                                                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                                                        onError={(e) => (e.target.src = '/default-business.jpg')}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <img
                                                                    src="/default-business.jpg"
                                                                    alt="Default Business"
                                                                    className="rounded-3 shadow-sm"
                                                                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                                                />
                                                            )}
                                                        </div>
                                                    </Card>
                                                    <label className="small fw-bold text-muted mb-1">CUSTOMER SENTIMENT</label>
                                                    <ProgressBar now={calculateSentiment(myBusiness.reviews)} variant={calculateSentiment(myBusiness.reviews) > 70 ? "success" : calculateSentiment(myBusiness.reviews) > 40 ? "warning" : "danger"} className="rounded-pill" style={{ height: '10px' }} />
                                                    <div className="d-flex justify-content-between small mt-1">
                                                        <span className="text-muted">{calculateSentiment(myBusiness.reviews)}% Positive</span>
                                                        <span className="text-muted">{myBusiness.reviews.length} Reviews</span>
                                                    </div>
                                                </div>
                                                <hr />
                                                <h6 className="small fw-bold mb-3">Add New Service/Offer</h6>
                                                <Form onSubmit={e => { e.preventDefault(); createDeal({ variables: { businessId: myBusiness.id, title: dealTitle, discount: dealDisc, description: "New offering" } }); setDealTitle(''); setDealDisc(''); setDealDesc(''); }}>
                                                    <Form.Control size="sm" className="mb-2 bg-white border-0" placeholder="Product/Service Name" value={dealTitle} onChange={e => setDealTitle(e.target.value)} />
                                                    <Form.Control size="sm" className="mb-2 bg-white border-0" placeholder="Price/Offer (e.g. $10 or 10% OFF)" value={dealDisc} onChange={e => setDealDisc(e.target.value)} />
                                                    <Button variant="info" size="sm" type="submit" className="w-100 text-white fw-bold">Add New Offer</Button>
                                                </Form>
                                            </div>
                                        )}
                                    </Card>
                                    {myBusiness && myBusiness.reviews.length > 0 && (
                                        <Card className="border-0 shadow-sm bg-primary bg-opacity-5 rounded-4 p-4">
                                            <h6 className="fw-bold text-white mb-3">✨ AI Business Insights</h6>
                                            <div className="small text-white opacity-95">
                                                {myBusiness.reviews[0].businessFeedback || "Analyze reviews to get feedback."}
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            ) : (
                                <Card className="border-0 shadow-sm p-4 text-center rounded-4 sticky-top" style={{ top: '100px' }}>
                                    <div className="display-4 mb-2">🏬</div>
                                    <h5 className="fw-bold">Business Directory</h5>
                                    <p className="small text-muted">Support local businesses and find the best deals in your neighborhood.</p>
                                </Card>
                            )}
                        </Col>
                        <Col lg={8}>
                            {isBusinessOwner && myBusiness ? (
                                <div className="d-flex flex-column gap-5">
                                    <section>
                                        <h4 className="fw-bold mb-4">My Business Dashboard</h4>
                                        <div className="d-flex flex-column gap-4">
                                            {/* My Active Offers */}
                                            <Card className="border-0 shadow-sm rounded-4 p-4 border-start border-success border-4">
                                                <h5 className="fw-bold text-success mb-3">Active Services & Offers</h5>
                                                {myBusiness.deals?.length === 0 ? (
                                                    <p className="text-muted italic mb-0">No active offers. Use the sidebar to add one!</p>
                                                ) : (
                                                    <Row className="g-3">
                                                        {myBusiness.deals.map(d => (
                                                            <Col md={6} key={d.id}>
                                                                <div className="p-3 bg-success bg-opacity-10 rounded-4 border border-success border-opacity-25">
                                                                    <div className="fw-bold text-success h5 mb-1">{d.discount}</div>
                                                                    <div className="fw-bold">{d.title}</div>
                                                                </div>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                )}
                                            </Card>
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="fw-bold mb-4">Customer Reviews</h4>
                                        <div className="d-flex flex-column gap-4">
                                            {myBusiness.reviews.length === 0 ? (
                                                <Card className="border-0 shadow-sm text-center rounded-4 text-muted italic">No reviews yet. Encourage your customers to leave feedback!</Card>
                                            ) : myBusiness.reviews.map(rev => (
                                                <Card key={rev.id} className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-primary border-4">
                                                    <Card.Body className="p-4">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <div className="d-flex gap-2">
                                                                {[...Array(5)].map((_, i) => <span key={i} className={i < rev.rating ? "text-warning" : "text-light"}>★</span>)}
                                                                <strong className="ms-2">{rev.author?.username}</strong>
                                                            </div>
                                                            <small className="text-muted">{new Date(parseInt(rev.createdAt)).toLocaleDateString()}</small>
                                                        </div>
                                                        <p className="mb-3 fs-5">{rev.comment}</p>
                                                        {rev.deal && (
                                                            <div className="mb-3">
                                                                <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-2 fw-bold small">
                                                                    🏷️ Related Offer: {rev.deal.title}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {rev.response ? (
                                                            <div className="bg-light p-3 rounded-4 mt-3 border-start border-primary border-3">
                                                                <small className="fw-bold text-primary d-block mb-1">YOUR RESPONSE</small>
                                                                <p className="mb-0 small">{rev.response}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-3">
                                                                <Form onSubmit={e => { e.preventDefault(); handleRespondToReview(rev.id); }} className="d-flex gap-2">
                                                                    <Form.Control size="sm" className="border-0 bg-light" placeholder="Write a response..." value={ownerResponse[rev.id] || ''} onChange={e => setOwnerResponse({ ...ownerResponse, [rev.id]: e.target.value })} />
                                                                    <Button variant="primary" size="sm" type="submit" className="fw-bold px-3">REPLY</Button>
                                                                </Form>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-4">
                                    {data.businesses.length === 0 ? (
                                        <Card className="border-0 shadow-sm p-5 text-center rounded-4 text-muted border-start border-info border-4">
                                            <div className="display-1 mb-3">🏢</div>
                                            <h4 className="fw-bold">No Businesses Yet</h4>
                                            <p className="mb-0 italic fs-5">There are no businesses promoting special deals to our local community at the moment. Check back later!</p>
                                        </Card>
                                    ) : data.businesses.map(biz => (
                                        // <Card key={biz.id} className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-info border-4">
                                        //     {biz.images?.length > 0 ? (
                                        //         <div className="d-flex overflow-hidden" style={{ height: '200px' }}>
                                        //             {biz.images.map((img, i) => (
                                        //                 <img
                                        //                     key={i}
                                        //                     src={img}
                                        //                     alt={biz.name}
                                        //                     className="w-100 h-100 shadow-sm"
                                        //                     style={{ objectFit: 'cover', minWidth: '33.33%' }}
                                        //                     onError={(e) => (e.target.src = '/default-business.png')}
                                        //                 />
                                        //             ))}
                                        //         </div>
                                        //     ) : (
                                        //         <div className="d-flex overflow-hidden" style={{ height: '200px' }}>
                                        //             <img
                                        //                 src="/default-business.png"
                                        //                 alt="Default Business"
                                        //                 className="w-100 h-100 shadow-sm"
                                        //                 style={{ objectFit: 'cover' }}
                                        //             />
                                        //         </div>
                                        //     )}
                                        //     <Card.Body className="p-4">
                                        //         <div className="d-flex justify-content-between align-items-start mb-2">
                                        //             <div>
                                        //                 <h3 className="fw-bold mb-0">{biz.name}</h3>
                                        //                 {/* <Badge bg="info" className="mt-1">{biz.category}</Badge> */}
                                        //                 <p className="text-dark opacity-75">{biz.description}</p>
                                        //             </div>
                                        //             <div className="text-end">
                                        //                 <div className="fw-bold text-warning">★ {biz.reviews.length > 0 ? (biz.reviews.reduce((a, b) => a + b.rating, 0) / biz.reviews.length).toFixed(1) : "New"}</div>
                                        //             </div>
                                        //         </div>

                                        //         {biz.deals?.length > 0 && (
                                        //             <div className="mb-4">
                                        //                 <label className="small fw-bold text-success mb-2 uppercase">Our Services & Offers</label>
                                        //                 <Row className="g-2">
                                        //                     {biz.deals.map(d => (
                                        //                         <Col md={6} key={d.id}>
                                        //                             <div className="p-3 bg-success bg-opacity-10 rounded-4 border border-success border-opacity-25 h-100">
                                        //                                 <div className="fw-bold text-success h5 mb-1">{d.discount}</div>
                                        //                                 <div className="small fw-bold">{d.title}</div>
                                        //                             </div>
                                        //                         </Col>
                                        //                     ))}
                                        //                 </Row>
                                        //             </div>
                                        //         )}

                                        //         {biz.reviews?.length > 0 && (
                                        //             <div className="mb-4">
                                        //                 <label className="small fw-bold text-muted mb-2 uppercase">Featured Review</label>
                                        //                 <div className="p-3 bg-light rounded-4">
                                        //                     <div className="d-flex justify-content-between mb-1">
                                        //                         <span className="fw-bold small">{biz.reviews[0].author?.username}</span>
                                        //                         <span className="text-warning small">{'★'.repeat(biz.reviews[0].rating)}</span>
                                        //                     </div>
                                        //                     <p className="small mb-0 text-dark opacity-75">"{biz.reviews[0].comment}"</p>
                                        //                     {biz.reviews[0].response && (
                                        //                         <div className="mt-2 ps-3 border-start border-primary small">
                                        //                             <span className="fw-bold text-primary">Owner:</span> {biz.reviews[0].response}
                                        //                         </div>
                                        //                     )}
                                        //                 </div>
                                        //             </div>
                                        //         )}

                                        //         <div className="d-flex gap-2">
                                        //             <Button variant="primary" size="sm" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => { setSelectedBiz(biz); setShowReviewModal(true); }}>Leave Review</Button>
                                        //         </div>
                                        //     </Card.Body>
                                        // </Card>
                                        <Card key={biz.id} className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-info border-4">
                                            <Card.Body className="p-4">
                                                <div className="d-flex gap-3 align-items-start">
                                                    <div className="flex-shrink-0">
                                                        <img
                                                            src={biz.images?.length > 0 ? biz.images[0] : '/default-business.jpg'}
                                                            alt={biz.name}
                                                            className="rounded-3 shadow-sm"
                                                            style={{ width: '90px', height: '90px', objectFit: 'cover' }}
                                                            onError={(e) => (e.target.src = '/default-business.png')}
                                                        />
                                                    </div>

                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <h3 className="fw-bold mb-0">{biz.name}</h3>
                                                                <p className="text-dark opacity-75 mb-2">{biz.description}</p>
                                                            </div>
                                                            <div className="text-end">
                                                                <div className="fw-bold text-warning">
                                                                    ★ {biz.reviews.length > 0
                                                                        ? (biz.reviews.reduce((a, b) => a + b.rating, 0) / biz.reviews.length).toFixed(1)
                                                                        : "New"}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {biz.deals?.length > 0 && (
                                                            <div className="mb-4">
                                                                <label className="small fw-bold text-success mb-2 uppercase">Our Services & Offers</label>
                                                                <Row className="g-2">
                                                                    {biz.deals.map(d => (
                                                                        <Col md={6} key={d.id}>
                                                                            <div className="p-3 bg-success bg-opacity-10 rounded-4 border border-success border-opacity-25 h-100">
                                                                                <div className="fw-bold text-success h5 mb-1">{d.discount}</div>
                                                                                <div className="small fw-bold">{d.title}</div>
                                                                            </div>
                                                                        </Col>
                                                                    ))}
                                                                </Row>
                                                            </div>
                                                        )}

                                                        {biz.reviews?.length > 0 && (
                                                            <div className="mb-4">
                                                                <label className="small fw-bold text-muted mb-2 uppercase">Featured Review</label>
                                                                <div className="p-3 bg-light rounded-4">
                                                                    <div className="d-flex justify-content-between mb-1">
                                                                        <span className="fw-bold small">{biz.reviews[0].author?.username}</span>
                                                                        <span className="text-warning small">{'★'.repeat(biz.reviews[0].rating)}</span>
                                                                    </div>
                                                                    <p className="small mb-0 text-dark opacity-75">"{biz.reviews[0].comment}"</p>
                                                                    {biz.reviews[0].response && (
                                                                        <div className="mt-2 ps-3 border-start border-primary small">
                                                                            <span className="fw-bold text-primary">Owner:</span> {biz.reviews[0].response}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                className="rounded-pill px-4 fw-bold shadow-sm"
                                                                onClick={() => {
                                                                    setSelectedBiz(biz);
                                                                    setShowReviewModal(true);
                                                                }}
                                                            >
                                                                Leave Review
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Col>
                    </Row>
                </div>

                {/* 3. Help Section */}
                <div className={activeTab === 'help' ? 'd-block' : 'd-none'}>
                    <Row className="g-4">
                        <Col lg={4}><Card className="border-0 shadow-sm sticky-top bg-primary bg-opacity-5 p-4 rounded-4" style={{ top: '100px' }}><h5 className="fw-bold mb-3 text-primary text-center">Ask for Help</h5><Form onSubmit={e => { e.preventDefault(); createHelp({ variables: { description: helpDesc, location: helpLoc } }); }}><Form.Control as="textarea" rows={3} className="bg-white border-0 mb-3" placeholder="Need help?" value={helpDesc} onChange={e => setHelpDesc(e.target.value)} /><Form.Control className="bg-white border-0 mb-4" placeholder="Location" value={helpLoc} onChange={e => setHelpLoc(e.target.value)} /><Button variant="primary" type="submit" className="w-100 fw-bold">Post</Button></Form></Card></Col>
                        <Col lg={8}>{data.helpRequests.map(req => { const isMatched = req.invitedVolunteers.some(v => v.id === currentUser?.id); const isAuthor = req.author?.id === currentUser?.id; return (<Card key={req.id} className={`border-0 shadow-sm rounded-4 mb-4 overflow-hidden ${isMatched ? 'border border-primary border-2 shadow' : ''}`}>{isMatched && <div className="bg-primary text-white text-center py-1 small fw-bold">✨ GREAT MATCH!</div>}<Card.Body className="p-4"><div className="d-flex justify-content-between align-items-center mb-3"><strong>{req.author?.username}</strong><Badge bg={req.isResolved ? "success" : "warning"}>{req.isResolved ? "RESOLVED" : "OPEN"}</Badge></div><p className="fs-5 text-dark mb-4">{req.description}</p><div className="d-flex justify-content-between align-items-center border-top pt-3"><div className="small text-muted">{req.location || 'Neighborhood Area'}</div><div className="d-flex gap-2">{isAuthor && !req.isResolved && (<><Button variant="outline-info" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => { setSelectedRequestId(req.id); getSuggestions({ variables: { helpRequestId: req.id } }); setShowSuggestions(true); }}>AI Match Volunteers</Button><Button variant="outline-success" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => resolveRequest({ variables: { id: req.id } })}>Resolve</Button></>)}{!isAuthor && !req.isResolved && <Button variant="primary" size="sm" className="rounded-pill px-3 fw-bold shadow-sm" onClick={() => volunteer({ variables: { id: req.id } })}>Lend a Hand</Button>}</div></div></Card.Body></Card>); })}</Col>
                    </Row>
                </div>

                {/* 4. Events Section */}
                <div className={activeTab === 'events' ? 'd-block' : 'd-none'}>
                    <Row className="g-4">
                        <Col lg={4}>
                            {isOrganizer ? (
                                <div className="sticky-top" style={{ top: '100px' }}>
                                    <Card className="border-0 shadow-sm bg-warning bg-opacity-5 rounded-4 p-4 mb-4">
                                        <h5 className="fw-bold mb-3 text-warning">Organize Event</h5>
                                        <Form onSubmit={e => {
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
                                        }}>
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
                                                    <strong>✨ AI TIMING PREDICTION:</strong><br />
                                                    {eventDesc.toLowerCase().includes('clean') ? "Saturday 9:00 AM is optimal for drives." : "Friday 6:00 PM is best for social engagement."}
                                                </Alert>
                                            )}

                                            <Button variant="warning" type="submit" className="w-100 text-dark fw-bold shadow-sm">Post Event</Button>
                                        </Form>
                                    </Card>
                                    <Card className="border-0 shadow-sm p-4 rounded-4 bg-primary bg-opacity-5 text-white">
                                        <h6 className="fw-bold text-white mb-2">Organizer Tip</h6>
                                        <p className="small mb-0 opacity-75">Events with clear volunteer requirements tend to get 40% more engagement.</p>
                                    </Card>
                                </div>
                            ) : (
                                <Card className="border-0 shadow-sm p-4 text-center rounded-4 sticky-top" style={{ top: '100px' }}>
                                    <div className="display-4 mb-2">🗓️</div>
                                    <h5 className="fw-bold">Community Calendar</h5>
                                    <p className="small text-muted">Join activities and meet your neighbors at local workshops and drives.</p>
                                </Card>
                            )}
                        </Col>
                        <Col lg={8}>
                            <div className="d-flex flex-column gap-4">
                                {data.events.length === 0 ? (
                                    <Card className="border-0 shadow-sm p-5 text-center rounded-4 text-muted border-start border-warning border-4">
                                        <div className="display-1 mb-3">🕊️</div>
                                        <p className="mb-0 italic fs-5">No upcoming events at the moment. Check back later!</p>
                                    </Card>
                                ) : data.events.map(event => {
                                    const isRSVPed = event.rsvps?.some(r => r.id === currentUser?.id);
                                    const isOrganizerOfEvent = event.organizer?.id === currentUser?.id;

                                    return (
                                        <Card key={event.id} className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-warning border-4">
                                            <Card.Body className="p-4">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div className="text-start">
                                                        <Badge bg="warning" text="dark" className="mb-2 text-uppercase">{event.category}</Badge>
                                                        <h3 className="fw-bold mb-1">{event.title}</h3>
                                                        <div className="text-muted small">
                                                            📅 {new Date(parseInt(event.date) || event.date).toLocaleString()} | 📍 {event.location}
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">
                                                            {event.rsvps?.length || 0} Attending
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <p className="text-dark opacity-75 mb-4 text-start">{event.description}</p>

                                                {/* {event.timingInsight && isOrganizerOfEvent && (
                                                    <Alert variant="warning" className="bg-warning bg-opacity-10 border-0 rounded-4 p-3 mb-4">
                                                        <div className="fw-bold small text-uppercase mb-1">✨ AI Engagement Insight</div>
                                                        <div className="small">{event.timingInsight}</div>
                                                    </Alert>
                                                )} */}

                                                <div className="d-flex justify-content-between align-items-center border-top pt-3">
                                                    <div className="d-flex gap-2">
                                                        {isOrganizerOfEvent ? (
                                                            <Button variant="outline-info" size="sm" className="rounded-pill px-4 fw-bold" onClick={() => {
                                                                setSelectedEventId(event.id);
                                                                setSelectedRequestId(null);
                                                                getSuggestions({ variables: { eventId: event.id } });
                                                                setShowSuggestions(true);
                                                            }}>
                                                                ✨ AI Match Volunteers
                                                            </Button>
                                                        ) : (
                                                            <>
                                                                {isRSVPed ? (
                                                                    <Button variant="success" size="sm" className="rounded-pill px-4 fw-bold shadow-sm" disabled>✓ Registered</Button>
                                                                ) : (
                                                                    <Button variant="primary" size="sm" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => rsvpEvent({ variables: { eventId: event.id } })}>RSVP Now</Button>
                                                                )}

                                                                {/* Volunteering Logic for Residents */}
                                                                {event.volunteers?.some(v => v.id === currentUser?.id) ? (
                                                                    <Badge bg="info" className="p-2 px-3 rounded-pill ms-2">Event Volunteer ✓</Badge>
                                                                ) : (
                                                                    event.volunteersNeeded > 0 && (
                                                                        <Button
                                                                            variant={event.invitedVolunteers?.some(v => v.id === currentUser?.id) ? "outline-primary" : "outline-secondary"}
                                                                            size="sm"
                                                                            className={`rounded-pill px-4 fw-bold ms-2 ${event.invitedVolunteers?.some(v => v.id === currentUser?.id) ? "animate-pulse" : ""}`}
                                                                            onClick={() => volunteerEvent({ variables: { eventId: event.id } })}
                                                                        >
                                                                            {event.invitedVolunteers?.some(v => v.id === currentUser?.id) ? "🤝 Agree to Volunteer" : "🙋 Volunteer"}
                                                                        </Button>
                                                                    )
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    {event.volunteersNeeded > 0 && (
                                                        <div className="small fw-bold text-primary">
                                                            {event.volunteers?.length || 0} / {event.volunteersNeeded} volunteers joined
                                                        </div>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    );
                                })}
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* 4. Alerts Section */}
                <div className={activeTab === 'alerts' ? 'd-block' : 'd-none'}>
                    <Row className="g-4">
                        <Col lg={4}><Card className="border-0 shadow-sm sticky-top bg-danger bg-opacity-5 p-4 rounded-4" style={{ top: '100px' }}><h5 className="fw-bold mb-3 text-danger">Report Alert</h5><Form onSubmit={e => { e.preventDefault(); createAlert({ variables: { title: alertTitle, description: alertDesc, category: alertCat } }); }}><Form.Control className="bg-white border-0 mb-2" placeholder="Subject" value={alertTitle} onChange={e => setAlertTitle(e.target.value)} /><Form.Select className="bg-white border-0 mb-2" value={alertCat} onChange={e => setAlertCat(e.target.value)}><option value="safety">🚨 Safety</option><option value="missing_pet">🐾 Missing Pet</option></Form.Select><Form.Control as="textarea" rows={3} className="bg-white border-0 mb-3" value={alertDesc} onChange={e => setAlertDesc(e.target.value)} /><Button variant="danger" type="submit" className="w-100 fw-bold">Broadcast</Button></Form></Card></Col>
                        <Col lg={8}>
                            {data.alerts.length === 0 ? (
                                <Card className="border-0 shadow-sm p-5 text-center rounded-4 text-muted border-start border-success border-4 bg-success bg-opacity-5">
                                    <div className="display-1 mb-3">🛡️</div>
                                    <p className="mb-0 italic fs-5 text-white">There are no active emergency alerts in your neighborhood at the moment. Stay safe!</p>
                                </Card>
                            ) : (
                                data.alerts.map(alert => (
                                    <Alert key={alert.id} variant={alert.category === 'safety' ? 'danger' : 'warning'} className="shadow-sm border-0 p-4 rounded-4 mb-4 border-start border-4">
                                        <h4 className="fw-bold mb-1">{alert.title}</h4>
                                        <p className="mb-0 fs-5">{alert.description}</p>
                                    </Alert>
                                ))
                            )}
                        </Col>
                    </Row>
                </div>

                {/* 5. Profile Section */}
                <div className={activeTab === 'profile' ? 'd-block' : 'd-none'}>
                    <Row className="justify-content-center"><Col lg={6}><Card className="border-0 shadow-sm rounded-4 overflow-hidden"><div className="bg-primary p-4 text-center text-white"><h3 className="fw-bold mb-0">{currentUser?.username}</h3><Badge bg="white" text="primary" className="mt-2 text-uppercase">{currentUser?.role?.replace('_', ' ')}</Badge></div><Card.Body className="p-4"><h5 className="fw-bold mb-4">Profile Settings</h5><Form onSubmit={handleUpdateProfile}><Form.Group className="mb-3"><Form.Label className="small fw-bold text-muted uppercase">Location</Form.Label><Form.Control className="bg-light border-0 py-2" value={profileLocation} onChange={e => setProfileLocation(e.target.value)} /></Form.Group><Form.Group className="mb-4"><Form.Label className="small fw-bold text-muted uppercase">Interests</Form.Label><Form.Control as="textarea" rows={3} className="bg-light border-0 py-2" value={profileInterests} onChange={e => setProfileInterests(e.target.value)} /></Form.Group><Button variant="primary" type="submit" className="w-100 fw-bold py-2 rounded-3">Save Profile</Button></Form></Card.Body></Card></Col></Row>
                </div>

                <div className={activeTab === 'ai' ? 'd-block' : 'd-none'} style={{ minHeight: '600px' }}><AIChatbot /></div>
            </Container>

            {/* Modals */}
            <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Write a Review for {selectedBiz?.name}</Modal.Title></Modal.Header>
                <Modal.Body className="pt-3">
                    <Form onSubmit={e => { e.preventDefault(); createReview({ variables: { businessId: selectedBiz.id, dealId: selectedDealId || null, rating: reviewRating, comment: reviewComment } }); setShowReviewModal(false); setReviewComment(''); setSelectedDealId(''); }}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">SELECT RELATED DEAL (OPTIONAL)</Form.Label>
                            <Form.Select className="bg-light border-0" value={selectedDealId} onChange={e => setSelectedDealId(e.target.value)}>
                                <option value="">General Review (No specific deal)</option>
                                {selectedBiz?.deals?.map(d => (
                                    <option key={d.id} value={d.id}>{d.discount} - {d.title}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Label className="small fw-bold text-muted">RATING</Form.Label>
                        <div className="d-flex gap-2 mb-3">
                            {[1, 2, 3, 4, 5].map(star => (<Button key={star} variant={reviewRating >= star ? "warning" : "light"} size="sm" onClick={() => setReviewRating(star)}>★</Button>))}
                        </div>
                        <Form.Control as="textarea" rows={3} className="bg-light border-0 mb-4" value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Tell us about your experience..." />
                        <Button variant="primary" type="submit" className="w-100 fw-bold rounded-3">Post Review</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showEditBizModal} onHide={() => setShowEditBizModal(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Edit Business Profile</Modal.Title></Modal.Header>
                <Modal.Body className="pt-3">
                    <Form onSubmit={e => { e.preventDefault(); updateBusiness({ variables: { id: myBusiness.id, name: bizName, description: bizDesc, category: bizCat, images: bizImages } }); setShowEditBizModal(false); }}>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold text-muted">BUSINESS NAME</Form.Label>
                            <Form.Control className="bg-light border-0" value={bizName} onChange={e => setBizName(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold text-muted">CATEGORY</Form.Label>
                            <Form.Select className="bg-light border-0" value={bizCat} onChange={e => setBizCat(e.target.value)}>
                                <option>Food & Dining</option>
                                <option>Retail & Shopping</option>
                                <option>Home Services</option>
                                <option>Health & Wellness</option>
                                <option>Professional Services</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold text-muted">DESCRIPTION</Form.Label>
                            <Form.Control as="textarea" rows={3} className="bg-light border-0" value={bizDesc} onChange={e => setBizDesc(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">UPLOAD NEW IMAGE</Form.Label>
                            <Form.Control type="file" size="sm" className="bg-light border-0" onChange={handleImageUpload} />
                        </Form.Group>
                        <Button variant="info" type="submit" className="w-100 fw-bold text-white rounded-3">Update Profile</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showSuggestions} onHide={() => setShowSuggestions(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold text-primary">✨ AI Volunteer Matches</Modal.Title></Modal.Header>
                <Modal.Body className="pt-3">
                    {suggesting ? <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-2 small text-muted fw-bold">Analyzing...</p></div> : (
                        <ListGroup variant="flush">
                            {suggestionData?.suggestVolunteers?.length > 0 ? (
                                suggestionData.suggestVolunteers.map((s, idx) => {
                                    const helpReq = data.helpRequests.find(r => r.id === selectedRequestId);
                                    const event = data.events.find(e => e.id === selectedEventId);
                                    const isInvited = helpReq
                                        ? helpReq.invitedVolunteers.some(v => v.id === s.user?.id)
                                        : event?.invitedVolunteers?.some(v => v.id === s.user?.id);

                                    return (
                                        <ListGroup.Item key={idx} className="border-0 px-0 mb-3 p-3 bg-light rounded-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div>
                                                    <span className="fw-bold fs-5 me-2">👤 {s.user?.username}</span>
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
                                                                eventId: selectedEventId,
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
        </div>
    );
}

export default CommunityComponent;
