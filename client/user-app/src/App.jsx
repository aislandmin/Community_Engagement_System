
// user-app/src/App.jsx
import './App.css';
import UserComponent from './UserComponent';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
} from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
    credentials: 'include',
  }),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <div className='App'>
      <ApolloProvider client={client}>
        <UserComponent />
      </ApolloProvider>
    </div>
  );
}

export default App;