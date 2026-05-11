import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Container, Badge, Alert, Button } from 'react-bootstrap';
import { io } from 'socket.io-client';
import './App.css';

const UserApp = lazy(() => import('userApp/App'));
const CommunityApp = lazy(() => import('communityApp/App'));
const EventsApp = lazy(() => import('eventsApp/App'));

const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    currentUser {
      id
      username
      role
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState('posts');
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [incomingInvite, setIncomingInvite] = useState(null);

  const activeSectionRef = useRef(activeSection);
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  const { loading, error, data, refetch } = useQuery(CURRENT_USER_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [logout] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      setIsLoggedIn(false);
      window.location.reload();
    },
  });

  useEffect(() => {
    const handleLoginSuccess = async (event) => {
      try {
        const result = await refetch();
        setIsLoggedIn(!!result?.data?.currentUser?.username);
      } catch (err) {
        console.error('Refetch after login failed:', err);
      }
    };

    window.addEventListener('loginSuccess', handleLoginSuccess);

    if (!loading && !error) {
      setIsLoggedIn(!!data?.currentUser?.username);
    }

    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, [loading, error, data, refetch]);

  useEffect(() => {
    if (!data?.currentUser?.role) return;

    if (data.currentUser.role === 'business_owner') {
      setActiveSection('businesses');
    } else if (data.currentUser.role === 'community_organizer') {
      setActiveSection('events');
    } else {
      setActiveSection('posts');
    }
  }, [data?.currentUser?.id, data?.currentUser?.role]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const communitySocket = io('http://localhost:4003');
    
    communitySocket.on('new-emergency-alert', (alert) => {
      if (activeSectionRef.current !== 'alerts') {
        setIncomingAlert(alert);
        setUnreadAlertCount(prev => prev + 1);
      }
    });

    communitySocket.on('new-volunteer-invitation', (invite) => {
      if (invite.volunteerId === data?.currentUser?.id) {
        setIncomingInvite(invite);
      }
    });

    return () => {
      communitySocket.disconnect();
    };
  }, [isLoggedIn, data?.currentUser?.id]);

  useEffect(() => {
    if (activeSection === 'alerts') {
      setUnreadAlertCount(0);
      setIncomingAlert(null);
    }
    if (activeSection === 'help' || activeSection === 'events') {
      setIncomingInvite(null);
    }
  }, [activeSection]);

  const navItems = (() => {
    const role = data?.currentUser?.role;

    if (role === 'resident') {
      return [
        { key: 'posts', label: 'Feeds' },
        { key: 'alerts', label: 'Alerts', badge: unreadAlertCount },
        { key: 'help', label: 'Helps' },
        { key: 'businesses', label: 'Businesses' },
        { key: 'events', label: 'Events' },
        { key: 'ai', label: 'Assistant' },
        { key: 'profile', label: 'Profile' },
      ];
    }

    if (role === 'business_owner') {
      return [
        { key: 'businesses', label: 'Businesses' },
        { key: 'profile', label: 'Profile' },
      ];
    }

    return [
      { key: 'events', label: 'Events' },
      { key: 'profile', label: 'Profile' },
    ];
  })();

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-white">
        <div className="spinner-grow text-primary mb-3" role="status"></div>
        <h5 className="fw-bold text-dark">Initializing Portal</h5>
      </div>
    );
  }

  return (
    <div className="App d-flex flex-column min-vh-100 bg-light-soft">
      <Suspense fallback={<div className="vh-100 d-flex align-items-center justify-content-center"><div className="spinner-border text-primary" /></div>}>
        {!isLoggedIn ? (
          <UserApp />
        ) : (
          <>
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm py-3">
              <Container fluid className="px-4">
                <span className="navbar-brand fw-bold fs-3 d-flex align-items-center mb-0">
                  Community Engagement System
                </span>

                <div className="d-flex align-items-center ms-auto gap-3 text-white">
                  <div className="text-end me-2">
                    <div className="fw-bold">{data?.currentUser?.username}</div>
                    {data?.currentUser?.role && (
                      <span className="badge bg-white text-primary text-uppercase px-2" style={{ fontSize: '0.65rem' }}>
                        {data.currentUser.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <button
                    className="btn btn-light btn-sm fw-bold px-4 rounded-pill text-primary"
                    onClick={() => logout()}
                  >
                    Logout
                  </button>
                </div>
              </Container>
            </nav>

            <div className="bg-white border-bottom shadow-sm">
              <Container fluid className="px-4">
                <ul className="nav nav-pills py-2 gap-2 justify-content-center flex-wrap">
                  {navItems.map(item => (
                    <li className="nav-item" key={item.key}>
                      <button
                        className={`nav-link fw-bold rounded-pill px-4 ${activeSection === item.key ? 'active' : 'text-primary'}`}
                        onClick={() => setActiveSection(item.key)}
                      >
                        {item.label}
                        {item.badge > 0 && <Badge bg="danger" pill className="ms-2">{item.badge}</Badge>}
                      </button>
                    </li>
                  ))}
                </ul>
              </Container>
            </div>

            {incomingAlert && (
              <div key={`alert-${incomingAlert.id}`} className="position-fixed top-0 end-0 p-4" style={{ zIndex: 2000, maxWidth: '400px' }}>
                <Alert show={incomingAlert !== null} variant="danger" className="shadow-lg border-0 rounded-4" onClose={() => setIncomingAlert(null)} dismissible>
                  <Alert.Heading className="h5 fw-bold">EMERGENCY ALERT</Alert.Heading><hr />
                  <p className="fw-bold mb-1">{incomingAlert.title}</p>
                  <p className="small mb-2">{incomingAlert.description}</p>
                  <Button variant="light" size="sm" className="w-100 mt-3 fw-bold text-danger" onClick={() => { setActiveSection('alerts'); setIncomingAlert(null); }}>View All Alerts</Button>
                </Alert>
              </div>
            )}
            {incomingInvite && (
              <div key={`invite-${incomingInvite.helpRequestId || incomingInvite.eventId}`} className="position-fixed top-0 end-0 p-4" style={{ zIndex: 2000, maxWidth: '400px', marginTop: '100px' }}>
                <Alert show={incomingInvite !== null} variant="primary" className="shadow-lg border-0 rounded-4" onClose={() => setIncomingInvite(null)} dismissible>
                  <Alert.Heading className="h5 fw-bold">YOU HAVE BEEN INVITED!</Alert.Heading><hr />
                  <p className="small mb-1"><strong>{incomingInvite.requesterName}</strong> matched you for a task.</p>
                  <Button variant="primary" size="sm" className="w-100 fw-bold" onClick={() => { setActiveSection(incomingInvite.eventId ? 'events' : 'help'); setIncomingInvite(null); }}>View Details</Button>
                </Alert>
              </div>
            )}

            <main className="flex-grow-1 py-4 w-100" >
              <Container fluid className="px-4">
                <div className="bg-white rounded-4 shadow-sm p-0 overflow-hidden">
                  {activeSection === 'events' ? (
                    <EventsApp />
                  ) : (
                    <CommunityApp activeTab={activeSection} onTabChange={setActiveSection} hideTabs />
                  )}
                </div>
              </Container>
            </main>
            <footer className="bg-white border-top py-3 px-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap small text-muted">
                <div><strong>Community Engagement System</strong> &copy; {new Date().getFullYear()}</div>
                <div className="d-flex gap-3">
                  <span>Status: Online</span>
                  <span>Region: Local</span>
                </div>
              </div>
            </footer>
          </>
        )}
      </Suspense>
    </div>
  );
}

export default App;
