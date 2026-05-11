import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Badge, ProgressBar, Modal } from 'react-bootstrap';

function BusinessDirectory({ businesses, currentUser, createBiz, createDeal, createReview, respondToReview, updateBusiness }) {
    const isBusinessOwner = currentUser?.role === 'business_owner';
    const myBusiness = businesses.find(b => b.owner?.id === currentUser?.id);
    const directoryBusinesses = myBusiness ? businesses.filter(b => b.id !== myBusiness.id) : businesses;

    // Form States
    const [bizName, setBizName] = useState('');
    const [bizDesc, setBizDesc] = useState('');
    const [bizCat, setBizCat] = useState('Food & Dining');
    const [bizLoc, setBizLoc] = useState('');
    const [bizImages, setBizImages] = useState([]);
    const [dealTitle, setDealTitle] = useState('');
    const [dealDisc, setDealDisc] = useState('');
    const [initDealTitle, setInitDealTitle] = useState('');
    const [initDealDisc, setInitDealDisc] = useState('');
    const [ownerResponse, setOwnerResponse] = useState({});

    // Modal States
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showEditBizModal, setShowEditBizModal] = useState(false);
    const [selectedBiz, setSelectedBiz] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [selectedDealId, setSelectedDealId] = useState('');

    useEffect(() => {
        if (myBusiness) {
            setBizName(myBusiness.name);
            setBizDesc(myBusiness.description);
            setBizCat(myBusiness.category);
            setBizLoc(myBusiness.location);
            setBizImages(myBusiness.images || []);
        }
    }, [myBusiness]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBizImages([reader.result]);
            };
            reader.readAsDataURL(file);
        }
    };

    const calculateSentiment = (reviews) => {
        if (!reviews?.length) return 0;
        const avg = reviews.reduce((acc, r) => acc + (r.sentimentScore || 0), 0) / reviews.length;
        return Math.round((avg + 1) * 50);
    };

    return (
        <>
            <Row className="g-4">
                {isBusinessOwner && (
                    <Col lg={4}>
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
                                        </Form.Group>
                                        <hr className="my-3" />
                                        <h6 className="small fw-bold text-primary mb-2">ADD YOUR FIRST PRODUCT/SERVICE *</h6>
                                        <Form.Group className="mb-2">
                                            <Form.Control size="sm" className="border-0 bg-white" placeholder="Product/Service Name" value={initDealTitle} onChange={e => setInitDealTitle(e.target.value)} required />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Control size="sm" className="border-0 bg-white" placeholder="Price or Discount" value={initDealDisc} onChange={e => setInitDealDisc(e.target.value)} required />
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
                                            <Card className="border-0 shadow-sm rounded-4 mb-3">
                                                <div className="d-flex gap-2 overflow-auto py-2 justify-content-center">
                                                    {myBusiness.images?.length > 0 ? myBusiness.images.map((img, idx) => (
                                                        <img key={idx} src={img} alt="Business" className="rounded-3 shadow-sm" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                                                    )) : <img src="/default-business.jpg" alt="Default" className="rounded-3 shadow-sm" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />}
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
                                        <Form onSubmit={e => { e.preventDefault(); createDeal({ variables: { businessId: myBusiness.id, title: dealTitle, discount: dealDisc, description: "New offering" } }); setDealTitle(''); setDealDisc(''); }}>
                                            <Form.Control size="sm" className="mb-2 bg-white border-0" placeholder="Product/Service Name" value={dealTitle} onChange={e => setDealTitle(e.target.value)} />
                                            <Form.Control size="sm" className="mb-2 bg-white border-0" placeholder="Price/Offer" value={dealDisc} onChange={e => setDealDisc(e.target.value)} />
                                            <Button variant="info" size="sm" type="submit" className="w-100 text-white fw-bold">Add New Offer</Button>
                                        </Form>
                                    </div>
                                )}
                            </Card>
                            {myBusiness && myBusiness.reviews.length > 0 && (
                                <Card className="border-0 shadow-sm bg-primary bg-opacity-5 rounded-4 p-4">
                                    <h6 className="fw-bold text-white mb-3">AI Business Insights</h6>
                                    <div className="small text-white opacity-95">
                                        {myBusiness.reviews[0].businessFeedback || "Analyze reviews to get feedback."}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </Col>
                )}
                <Col lg={isBusinessOwner ? 8 : 12}>
                    <div className="d-flex flex-column gap-5">
                        {isBusinessOwner && myBusiness && (
                            <>
                                <section>
                                    <h4 className="fw-bold mb-4">My Business Dashboard</h4>
                                    <Card className="border-0 shadow-sm rounded-4 p-4 border-start border-success border-4">
                                        <h5 className="fw-bold text-success mb-3">Active Services & Offers</h5>
                                        {myBusiness.deals?.length === 0 ? <p className="text-muted italic mb-0">No active offers. Use the sidebar to add one!</p> : (
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
                                </section>
                                <section>
                                    <h4 className="fw-bold mb-4">Customer Reviews</h4>
                                    {myBusiness.reviews.length === 0 ? <Card className="border-0 shadow-sm text-center rounded-4 text-muted italic p-4">No reviews yet.</Card> : myBusiness.reviews.map(rev => (
                                        <Card key={rev.id} className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-primary border-4 mb-4">
                                            <Card.Body className="p-4">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <div className="d-flex gap-2">
                                                        {[...Array(5)].map((_, i) => <span key={i} className={i < rev.rating ? "text-warning" : "text-light"}>*</span>)}
                                                        <strong className="ms-2">{rev.author?.username}</strong>
                                                    </div>
                                                    <small className="text-muted">{new Date(parseInt(rev.createdAt)).toLocaleDateString()}</small>
                                                </div>
                                                <p className="mb-3 fs-5">{rev.comment}</p>
                                                {rev.response ? (
                                                    <div className="bg-light p-3 rounded-4 mt-3 border-start border-primary border-3">
                                                        <small className="fw-bold text-primary d-block mb-1">YOUR RESPONSE</small>
                                                        <p className="mb-0 small">{rev.response}</p>
                                                    </div>
                                                ) : (
                                                    <Form onSubmit={e => { e.preventDefault(); respondToReview({ variables: { reviewId: rev.id, response: ownerResponse[rev.id] } }); setOwnerResponse({ ...ownerResponse, [rev.id]: '' }); }} className="d-flex gap-2 mt-3">
                                                        <Form.Control size="sm" className="border-0 bg-light" placeholder="Write a response..." value={ownerResponse[rev.id] || ''} onChange={e => setOwnerResponse({ ...ownerResponse, [rev.id]: e.target.value })} />
                                                        <Button variant="primary" size="sm" type="submit" className="fw-bold px-3">REPLY</Button>
                                                    </Form>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </section>
                            </>
                        )}
                        <section>
                            <div className="d-flex flex-column gap-4">
                                {directoryBusinesses.length === 0 ? (
                                    <Card className="border-0 shadow-sm p-5 text-center rounded-4 text-muted border-start border-info border-4">
                                        <div className="display-1 mb-3">Business</div>
                                        <h4 className="fw-bold">{myBusiness ? 'No Other Businesses Yet' : 'No Businesses Yet'}</h4>
                                    </Card>
                                ) : directoryBusinesses.map(biz => (
                                    <Card key={biz.id} className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-info border-4 mb-4">
                                        <Card.Body className="p-4">
                                            <div className="d-flex gap-3 align-items-start">
                                                <img src={biz.images?.length > 0 ? biz.images[0] : '/default-business.jpg'} alt={biz.name} className="rounded-3 shadow-sm" style={{ width: '90px', height: '90px', objectFit: 'cover' }} onError={(e) => (e.target.src = '/default-business.png')} />
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <h3 className="fw-bold mb-0">{biz.name}</h3>
                                                            <p className="text-dark opacity-75 mb-2">{biz.description}</p>
                                                        </div>
                                                        <div className="fw-bold text-warning">Rating: {biz.reviews.length > 0 ? (biz.reviews.reduce((a, b) => a + b.rating, 0) / biz.reviews.length).toFixed(1) : "New"}</div>
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
                                                            <label className="small fw-bold text-primary mb-2 uppercase">Recent Reviews</label>
                                                            <div className="d-flex flex-column gap-2">
                                                                {biz.reviews.slice(0, 3).map(rev => (
                                                                    <div key={rev.id} className="bg-light rounded-4 p-3 text-start">
                                                                        <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                                                                            <strong>{rev.author?.username || 'Resident'}</strong>
                                                                            <span className="small fw-bold text-warning">{rev.rating}/5</span>
                                                                        </div>
                                                                        <p className="small text-dark opacity-75 mb-0">{rev.comment}</p>
                                                                        {rev.response && (
                                                                            <div className="small text-primary mt-2">
                                                                                <strong>Owner response:</strong> {rev.response}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <Button variant="primary" size="sm" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => { setSelectedBiz(biz); setShowReviewModal(true); }}>Leave Review</Button>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    </div>
                </Col>
            </Row>

            {/* Modals */}
            <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Write a Review for {selectedBiz?.name}</Modal.Title></Modal.Header>
                <Modal.Body className="pt-3">
                    <Form onSubmit={e => { e.preventDefault(); createReview({ variables: { businessId: selectedBiz.id, dealId: selectedDealId || null, rating: reviewRating, comment: reviewComment } }); setShowReviewModal(false); setReviewComment(''); }}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">SELECT RELATED DEAL (OPTIONAL)</Form.Label>
                            <Form.Select className="bg-light border-0" value={selectedDealId} onChange={e => setSelectedDealId(e.target.value)}>
                                <option value="">General Review</option>
                                {selectedBiz?.deals?.map(d => <option key={d.id} value={d.id}>{d.discount} - {d.title}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Label className="small fw-bold text-muted">RATING</Form.Label>
                        <div className="d-flex gap-2 mb-3">
                            {[1, 2, 3, 4, 5].map(star => <Button key={star} variant={reviewRating >= star ? "warning" : "light"} size="sm" onClick={() => setReviewRating(star)}>*</Button>)}
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
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">UPLOAD NEW IMAGE</Form.Label>
                            <Form.Control type="file" size="sm" className="bg-light border-0" onChange={handleImageUpload} />
                        </Form.Group>
                        <Button variant="info" type="submit" className="w-100 fw-bold text-white rounded-3">Update Profile</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default BusinessDirectory;
