import React, { useEffect } from "react";
import { Form, Button, Card } from "react-bootstrap";
import { useMachine } from "@xstate/react";
import { Machine, assign } from "xstate";
import { api } from "./api";

const loginFormMachine = Machine({
  id: "loginForm",
  initial: "idle",
  context: {
    error: "",
    username: "user1",
    usernameError: "",
    password: "",
  },
  states: {
    idle: {
      on: {
        SUBMIT: "submitting",
        USERNAME_CHANGE: {
          target: "idle",
          actions: assign({
            username: (ctx, evt) => evt.username,
          }),
        },
        PASSWORD_CHANGE: {
          target: "idle",
          actions: assign({
            password: (ctx, evt) => evt.password,
          }),
        },
        USERNAME_INPUT_LEAVE: {
          target: "verifyingUsername",
          /* target: "idle",
          actions: assign({
            csati: async (ctx, evt) => {
              console.log("hello from action!");
              // Maybe this should go to services, instead of actions...???
              return "email is validated!";
            },
          }), */
        },
      },
      onExit: assign({
        error: () => "",
      }),
    },
    verifyingUsername: {
      invoke: {
        src: "verifyUsername",
        onDone: {
          target: "idle",
          actions: assign({
            usernameError: "",
          }),
        },
        onError: {
          actions: assign({
            usernameError: (ctx, evt) => {
              return evt.data.message;
            },
          }),
        },
      },
    },
    submitting: {
      on: {
        SUCCESS: "success",
        ERROR: {
          target: "idle",
          actions: assign({
            error: () => "error message",
          }),
        },
      },
    },
    success: {
      type: "final",
    },
  },
});

const verifyUsername = async (ctx, evt) => {
  const result = await api.validateUser(ctx.username);
  console.log("verifying username");
  console.log(result);

  if (!result) {
    throw new Error("Username must be at least 3 charasters long");
  }
  return result;
};

function LoginForm() {
  const [state, send, service] = useMachine(loginFormMachine, {
    services: {
      verifyUsername,
    },
  });

  //#region logging
  useEffect(() => {
    const subscription = service.subscribe((state) => {
      console.log(state);
    });

    return subscription.unsubscribe;
  }, [service]);
  //#endregion

  const handleSubmit = async (e) => {
    e.preventDefault();
    send({ type: "SUBMIT" });

    try {
      const response = await fetch("http://localhost:3001/users");
      const users = await response.json();

      const user = users.find(
        (u) =>
          u.username === state.context.username &&
          u.password === state.context.password
      );

      if (user) {
        send({ type: "SUCCESS" });
      } else {
        send({ type: "ERROR" });
      }
    } catch (error) {
      console.error(error);
      send({ type: "ERROR" });
    }
  };

  return (
    <Card id="LoginForm">
      <Card.Body>
        <h2>Login</h2>
        {state.matches("submitting") && <p>Logging in...</p>}
        {state.matches("success") && <p>Login successful!</p>}
        {state.matches("error") && (
          <p>Invalid credentials. Please try again.</p>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={state.context.username}
              /* onChange={(e) => setUsername(e.target.value)} */
              onChange={(e) =>
                send({
                  type: "USERNAME_CHANGE",
                  username: e.target.value,
                })
              }
              onBlur={() => send({ type: "USERNAME_INPUT_LEAVE" })}
            />
            <Form.Control.Feedback type={state.context.usernameError ? "invalid" : null}>{state.context.usernameError}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={state.context.password}
              onChange={(e) =>
                send({ type: "PASSWORD_CHANGE", password: e.target.value })
              }
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Log In
          </Button>
        </Form>
        {state.context.error && <div>ERROR!!! {state.context.error}</div>}
      </Card.Body>
    </Card>
  );
}

export default LoginForm;
