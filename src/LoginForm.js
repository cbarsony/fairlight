import React, { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { useMachine } from '@xstate/react';
import { Machine } from 'xstate';

// Define the state machine for the login form
const loginFormMachine = Machine({
  id: 'loginForm',
  initial: 'idle',
  states: {
    idle: {
      on: {
        SUBMIT: 'submitting',
      },
    },
    submitting: {
      on: {
        SUCCESS: 'success',
        ERROR: 'idle',
      },
    },
    success: {
      type: 'final',
    },
  },
});

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [current, send] = useMachine(loginFormMachine);

  const handleSubmit = async (e) => {
    e.preventDefault();
    send({ type: 'SUBMIT' });

    try {
      // Simulate an API request to authenticate the user
      const response = await fetch('http://localhost:3001/users');
      const users = await response.json();

      const user = users.find((u) => u.username === username && u.password === password);

      if (user) {
        send({ type: 'SUCCESS' });
      } else {
        send({ type: 'ERROR' });
      }
    } catch (error) {
      console.error(error);
      send({ type: 'ERROR' });
    }
  };

  return (
    <Card>
      <Card.Body>
        <h2>Login</h2>
        {current.matches('submitting') && <p>Logging in...</p>}
        {current.matches('success') && <p>Login successful!</p>}
        {current.matches('error') && <p>Invalid credentials. Please try again.</p>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Log In
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default LoginForm;
