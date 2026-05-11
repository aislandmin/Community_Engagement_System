// user-app/src/UserComponent.jsx
import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Alert, Button, Form, Container, Nav, Spinner } from 'react-bootstrap';

// GraphQL stubs
const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($username: String!, $email: String!, $password: String!, $role: String!, $interests: [String], $location: String) {
    register(username: $username, email: $email, password: $password, role: $role, interests: $interests, location: $location)
  }
`;

function UserComponent() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('resident');
    const [location, setLocation] = useState('');
    const [interests, setInterests] = useState('');
    const [activeTab, setActiveTab] = useState('login');
    const [authError, setAuthError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [login] = useMutation(LOGIN_MUTATION, {
        onCompleted: () => {
            console.log("Login successful, reloading page...");
            window.dispatchEvent(new CustomEvent('loginSuccess', { detail: { isLoggedIn: true } }));
        },
        onError: (error) => setAuthError(error.message || 'Login failed'),
    });

    const [register] = useMutation(REGISTER_MUTATION, {
        onCompleted: () => {
            alert("Registration successful! Please log in.");
            setActiveTab('login');
        },
        onError: (error) => setAuthError(error.message || 'Registration failed'),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setAuthError('');

        if (!username || !password) {
            setAuthError('Username and password are required.');
            setIsSubmitting(false);
            return;
        }

        if (activeTab === 'login') {
            await login({ variables: { username, password } });
        } else {
            if (!email) {
                setAuthError('Email is required for registration.');
                setIsSubmitting(false);
                return;
            }
            const interestsArray = interests.split(',').map(i => i.trim()).filter(i => i !== '');
            await register({
                variables: {
                    username,
                    email,
                    password,
                    role,
                    interests: interestsArray,
                    location
                }
            });
        }
        setIsSubmitting(false);
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div style={{ width: '100%', maxWidth: '560px' }}>
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary text-nowrap fs-2">Community Engagement System</h2>
                    <p className="text-muted">Connect, Engage, and Grow together.</p>
                </div>

                <div className="card shadow border-0 overflow-hidden" style={{ borderRadius: '16px' }}>
                    <Nav variant="tabs" className="nav-justified bg-light" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item>
                            <Nav.Link eventKey="login" className={`border-0 py-3 ${activeTab === 'login' ? 'bg-white fw-bold border-bottom-0' : 'text-muted'}`}>
                                Login
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="signup" className={`border-0 py-3 ${activeTab === 'signup' ? 'bg-white fw-bold border-bottom-0' : 'text-muted'}`}>
                                Signup
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <div className="card-body p-4">
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-semibold text-uppercase text-muted">Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter your username"
                                    className="py-2 border-light bg-light bg-opacity-50"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)} />
                            </Form.Group>

                            {activeTab === 'signup' && (
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-semibold text-uppercase text-muted">Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter your email"
                                        className="py-2 border-light bg-light bg-opacity-50"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)} />
                                </Form.Group>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-semibold text-uppercase text-muted">Password</Form.Label>
                                <div className="position-relative">
                                    <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        className="py-2 pe-5 border-light bg-light bg-opacity-50"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)} />
                                    <button
                                        type="button"
                                        className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted px-3"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        onClick={() => setShowPassword(prev => !prev)}
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                                <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                                <line x1="2" y1="2" x2="22" y2="22" />
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </Form.Group>

                            {activeTab === 'signup' && (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold text-uppercase text-muted">User Role</Form.Label>
                                        <Form.Select className="py-2 border-light bg-light bg-opacity-50" value={role} onChange={(e) => setRole(e.target.value)}>
                                            <option value="resident">Resident</option>
                                            <option value="business_owner">Business Owner</option>
                                            <option value="community_organizer">Community Organizer</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold text-uppercase text-muted">Your Location</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="e.g. Oak Avenue"
                                            className="py-2 border-light bg-light bg-opacity-50"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)} />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="small fw-semibold text-uppercase text-muted">Interests (comma separated)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="e.g. gardening, pets, safety"
                                            className="py-2 border-light bg-light bg-opacity-50"
                                            value={interests}
                                            onChange={(e) => setInterests(e.target.value)} />
                                    </Form.Group>
                                </>
                            )}

                            {authError && (
                                <Alert variant="danger" className="py-2 small">
                                    {authError}
                                </Alert>
                            )}

                            <div className="d-grid gap-2 mt-4">
                                <Button variant="primary" type="submit" className="py-2 fw-bold rounded-3" disabled={isSubmitting}>
                                    {isSubmitting ? <Spinner size="sm" /> : (activeTab === 'login' ? 'Log In' : 'Create Account')}
                                </Button>
                            </div>
                        </Form>
                    </div>
                </div>

                <p className="text-center mt-4 text-muted small">
                    &copy; {new Date().getFullYear()} Community Engagement System.
                </p>
            </div>
        </Container>
    );
}

export default UserComponent;
