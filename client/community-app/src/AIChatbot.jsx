import React, { useState, useRef, useEffect } from 'react';
import { useLazyQuery, gql } from '@apollo/client';
import {
  Form,
  Button,
  Spinner,
  Card,
  Alert
} from 'react-bootstrap';

const COMMUNITY_AI_QUERY = gql`
  query CommunityAI($query: String!) {
    communityAIQuery(query: $query) {
      text
      suggestedQuestions
      retrievedPosts {
        id
        title
        content
        category
        updatedAt
      }
    }
  }
`;

function AIChatbot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '🤖 Hello! I am your Community AI Agent. Ask me anything about your neighborhood discussions. How can I help you today?',
      suggestedQuestions: ['What are people discussing about safety?', 'Are there any updates on neighborhood projects?', 'What are the main topics being discussed lately?']
    }
  ]);

  const [getAIResponse, { loading }] = useLazyQuery(COMMUNITY_AI_QUERY, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const aiResponse = data.communityAIQuery;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: aiResponse.text,
          suggestedQuestions: aiResponse.suggestedQuestions,
          retrievedPosts: aiResponse.retrievedPosts
        }
      ]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          isError: true
        }
      ]);
    }
  });

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');

    getAIResponse({ variables: { query: userMessage } });
  };

  const handleSuggestedQuestion = (question) => {
    if (loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    getAIResponse({ variables: { query: question } });
  };

  return (
    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 250px)' }} className="bg-light rounded-3 overflow-hidden border">
      <div className="flex-grow-1 p-4 d-flex flex-column gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
            <div className={`d-flex flex-column ${msg.role === 'user' ? 'align-items-end' : 'align-items-start'}`} style={{ maxWidth: '85%' }}>
              <div className={`p-3 rounded-4 shadow-sm ${msg.role === 'user'
                ? 'bg-primary text-white text-end'
                : msg.isError ? 'bg-danger-subtle text-danger border border-danger text-start' : 'bg-white text-dark text-start'
                }`}>
                <div style={{ whiteSpace: 'pre-wrap', textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.text}</div>
              </div>

              {msg.retrievedPosts && msg.retrievedPosts.length > 0 && (
                <div className="mt-2 w-100">
                  <small className="text-muted fw-bold text-uppercase mb-2 d-block" style={{ fontSize: '0.65rem' }}>
                    Relevant Discussions
                  </small>
                  <div className="d-flex flex-column gap-2">
                    {msg.retrievedPosts.map(post => (
                      <Card key={post.id} className="border-0 shadow-sm bg-info bg-opacity-10">
                        <Card.Body className="p-2">
                          <h6 className="mb-1 fw-bold small text-info text-truncate">{post.title}</h6>
                          <p className="mb-0 small text-dark opacity-75 text-truncate" style={{ fontSize: '0.75rem' }}>
                            {post.content}
                          </p>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                <div className="mt-3 d-flex flex-wrap gap-2">
                  {msg.suggestedQuestions.map((q, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant="outline-primary"
                      className="rounded-pill bg-white px-3 border-opacity-25 shadow-sm"
                      onClick={() => handleSuggestedQuestion(q)}
                      disabled={loading}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="d-flex justify-content-start">
            <div className="bg-white p-3 rounded-4 shadow-sm d-flex align-items-center gap-2">
              <Spinner size="sm" animation="grow" variant="primary" />
              <Spinner size="sm" animation="grow" variant="primary" />
              <Spinner size="sm" animation="grow" variant="primary" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-white p-3 border-top">
        <Form onSubmit={handleSubmit} className="d-flex gap-2">
          <Form.Control
            placeholder="Type your question..."
            className="rounded-pill border-light bg-light px-4 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="primary"
            className="rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: '45px', height: '45px' }}
            disabled={loading || !input.trim()}
          >
            <span className="fs-5">⬆️</span>
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default AIChatbot;
