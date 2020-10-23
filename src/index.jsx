import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import moment from 'moment-timezone';
import React from 'react';
import ReactDOM from 'react-dom';

import 'antd/dist/antd.css';

import { App } from './App';

window.moment = moment;

const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <ApolloProvider client={ client }>
    <App />
  </ApolloProvider>,
  document.getElementById('root'),
);
