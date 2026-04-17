import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Container, Card } from 'react-bootstrap';
import './App.css';

const UserApp = lazy(() => import('userApp/App'));
const CommunityApp = lazy(() => import('communityApp/App'));

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
              <Container className="px-4">
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

            <main className="flex-grow-1 py-5 w-100" >
              {/* <Container> */}
              <Container fluid className="px-4">
                <div className="bg-white rounded-4 shadow-sm p-0 overflow-hidden">
                  <CommunityApp />
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
