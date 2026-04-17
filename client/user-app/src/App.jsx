
// // user-app/src/App.jsx
// import './App.css';
// import UserComponent from './UserComponent';
// //
// import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

// // Set up Apollo Client
// // const client = new ApolloClient({
// //   uri: 'http://localhost:4001/graphql', // Set this to your actual GraphQL endpoint
// //   cache: new InMemoryCache(),
// //   credentials: 'include'
// // });


// // Set up Apollo Client for the gateway
// const client = new ApolloClient({
//   uri: 'http://localhost:4000/graphql', // Set this to your actual GraphQL endpoint
//   cache: new InMemoryCache(),
//   credentials: 'include'
// });


// function App() {

//   return (
//     <div className='App'>
//       <ApolloProvider client={client}>
//         <UserComponent />
//       </ApolloProvider>
//     </div>
//   );
// }

// export default App;

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