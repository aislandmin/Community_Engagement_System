import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Badge, Alert } from 'react-bootstrap';

function NewsFeed({ posts, currentUser, createPost, addComment }) {
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState('discussion');
    const [commentContent, setCommentContent] = useState({});

    const handleCreatePost = (e) => {
        e.preventDefault();
        createPost({ variables: { title: postTitle, content: postContent, category: postCategory } });
        setPostTitle('');
        setPostContent('');
    };

    const handleAddComment = (e, postId) => {
        e.preventDefault();
        const content = commentContent[postId];
        if (!content) return;
        addComment({ variables: { postId, content } });
        setCommentContent({ ...commentContent, [postId]: '' });
    };

    return (
        <Row className="g-4">
            <Col lg={4}>
                <Card className="border-0 shadow-sm sticky-top p-4 rounded-4" style={{ top: '100px' }}>
                    <h5 className="fw-bold mb-3 text-primary">Share Something</h5>
                    <Form onSubmit={handleCreatePost}>
                        <Form.Group className="mb-2">
                            <Form.Control className="bg-light border-0" placeholder="Title" value={postTitle} onChange={e => setPostTitle(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Select className="bg-light border-0" value={postCategory} onChange={e => setPostCategory(e.target.value)}>
                                <option value="news">News</option>
                                <option value="discussion">Discussion</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Control as="textarea" rows={3} className="bg-light border-0" placeholder="What's happening?" value={postContent} onChange={e => setPostContent(e.target.value)} />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100 fw-bold">Post to Feed</Button>
                    </Form>
                </Card>
            </Col>
            <Col lg={8}>
                <div className="d-flex flex-column gap-4">
                    {posts.map(post => (
                        <Card key={post.id} className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-primary border-4">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="flex-grow-1">
                                        <h4 className="fw-bold mb-0">{post.title}</h4>
                                        <small className="text-muted">By {post.author?.username}</small>
                                    </div>
                                    <Badge bg={post.category === 'news' ? 'primary' : 'secondary'} className="px-3 py-2 rounded-pill small" style={{ height: 'fit-content' }}>
                                        {post.category.toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-dark mb-4">{post.content}</p>
                                {post.aiSummary && (
                                    <Alert variant="primary" className="py-3 px-4 border-0 bg-primary bg-opacity-75 text-white rounded-4 mb-4 shadow-sm">
                                        <span className="fw-bold small text-uppercase opacity-75">AI INSIGHT:</span>
                                        <span className="fw-medium small ms-2">{post.aiSummary}</span>
                                    </Alert>
                                )}
                                <div className="bg-light p-3 rounded-4">
                                    <h6 className="fw-bold small text-muted mb-3">COMMENTS ({post.comments?.length || 0})</h6>
                                    {(post.comments || []).map(comment => (
                                        <div key={comment.id} className="small mb-2">
                                            <strong className="text-primary">{comment.username}:</strong> {comment.content}
                                        </div>
                                    ))}
                                    <Form onSubmit={e => handleAddComment(e, post.id)} className="mt-3 d-flex gap-2">
                                        <Form.Control size="sm" className="border-0 shadow-sm" placeholder="Reply..." value={commentContent[post.id] || ''} onChange={e => setCommentContent({ ...commentContent, [post.id]: e.target.value })} />
                                        <Button variant="link" size="sm" className="p-0 fw-bold text-decoration-none" type="submit">SEND</Button>
                                    </Form>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            </Col>
        </Row>
    );
}

export default NewsFeed;
