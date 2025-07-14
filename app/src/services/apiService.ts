import { env } from "../env";
import type { Message } from "../types/Message";

const apiUrl: string = `${env.VITE_BACKEND_API}/api`;

/**
 * getHeaders constructs the headers for API requests.
 * It includes the Content-Type and Authorization headers if a token is provided.
 *
 * @param token - Optional access token for authorization
 * @returns Headers object with the necessary headers
 */
const getHeaders = (token?: string | null): Headers => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/**
 * signInOrSignUpUser sends a request to the API to sign in or sign up the user.
 * It expects a token for authorization and returns nothing if successful.
 *
 * @param token - Access token for authorization
 * @throws Error if the request fails or returns an error message
 */
export const signInOrSignUpUser = async (token: string | null) => {
  const response = await fetch(`${apiUrl}/messages/user`, {
    method: 'POST',
    mode: 'cors',
    headers: getHeaders(token)
  });

  if (response.ok || response.status === 204) {
    return;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    throw new Error(data.message);
  }

  throw new Error('Something went wrong!');
};

/**
 * getMessages fetches all messages from the API.
 * It requires an access token for authorization and returns the messages if successful.
 *
 * @param token - Access token for authorization
 * @returns Array of messages
 * @throws Error if the request fails or returns an error message
 */
export const getMessages = async (token: string | null) => {
  const response = await fetch(`${apiUrl}/messages`, {
    method: 'GET',
    mode: 'cors',
    headers: getHeaders(token)
  });

  if (response.ok) {
    const json = await response.json();
    return json;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    throw new Error(data.message);
  }

  throw new Error('Something went wrong!');
};

/**
 * createMessage sends a request to the API to create a new message.
 * It requires an access token for authorization and the message details in the payload.
 *
 * @param token - Access token for authorization
 * @param payload - Message object containing the message details
 * @returns The created message object
 * @throws Error if the request fails or returns an error message
 */
export const createMessage = async (token: string | null, payload: Message) => {
  const response = await fetch(`${apiUrl}/messages`, {
    method: 'PUT',
    mode: 'cors',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    const json = await response.json();
    return json;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if ('errorMessage' in data && 'fields' in data) {
      const finalMessage: string[] = [];
      finalMessage.push(data.errorMessage);
      for (const field of data.fields) {
        finalMessage.push(` ${field.fieldName}: ${field.fieldMessage}`)
      }
      throw new Error(finalMessage.join(''));
    }
    throw new Error(data.message);
  }

  throw new Error('Something went wrong!');
}

/**
 * updateMessage sends a request to the API to update an existing message.
 * It requires an access token for authorization and the updated message details in the payload.
 *
 * @param token - Access token for authorization
 * @param payload - Message object containing the updated message details
 * @returns The updated message object or nothing if successful
 * @throws Error if the request fails or returns an error message
 */
export const updateMessage = async (token: string | null, payload: Message) => {
  const response = await fetch(`${apiUrl}/messages/${payload.id}`, {
    method: 'POST',
    mode: 'cors',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });

  if (response.ok && response.status === 200) {
    const json = await response.json();
    return json;
  }

  if (response.status === 204) {
    return;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    throw new Error(data.message);
  }

  throw new Error('Something went wrong!');
};

/**
 * deleteMessage sends a request to the API to delete a message by its ID.
 * It requires an access token for authorization.
 *
 * @param token - Access token for authorization
 * @param id - ID of the message to be deleted
 * @throws Error if the request fails or returns an error message
 */
export const deleteMessage = async (token: string | null, id: number) => {
  const response = await fetch(`${apiUrl}/messages/${id}`, {
    method: 'DELETE',
    mode: 'cors',
    headers: getHeaders(token)
  });

  if (response.status === 204) {
    return;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    throw new Error(data.message);
  }

  throw new Error('Something went wrong!');
}

/**
 * checkInConfirmation sends a request to the API to confirm a check-in using a confirmation string.
 * It expects a confirmation string in the payload and returns nothing if successful.
 *
 * @param payload - Object containing the confirmation string
 * @throws Error if the request fails or returns an error message
 */
export const checkInConfirmation = async (payload: { confirmation: string }) => {
  const response = await fetch(`${apiUrl}/confirmation/check-in/${payload.confirmation}`, {
    method: 'PUT',
    mode: 'cors',
    headers: getHeaders()
  });

  if (response.status === 204) {
    return;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    throw new Error(data.message);
  }
}
