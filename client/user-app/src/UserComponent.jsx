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

    const [login] = useMutation(LOGIN_MUTATION, {
        onCompleted: () => {
            console.log("✅ Login successful, reloading page...");
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
            <div style={{ width: '100%', maxWidth: '450px' }}>
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary">Community Hub</h2>
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
                                Sign Up
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
                                <Form.Control
                                    type="password"
                                    placeholder="Enter your password"
                                    className="py-2 border-light bg-light bg-opacity-50"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} />
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
                                        <Form.Label className="small fw-semibold text-uppercase text-muted">Your Neighborhood</Form.Label>
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
