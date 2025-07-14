import swal from 'sweetalert';

const showError = (message: string) => {
  swal('Oh no!', message, 'error');
}

/**
 * handleAndDisplayError is a utility function that handles errors by displaying them in a user-friendly way.
 * It checks if the error is an instance of Error and displays its message, otherwise it converts the error to a string.
 *
 * @param e - The error to handle and display
 */
export const handleAndDisplayError = (e: unknown) => {
  if (e instanceof Error) {
    showError(e.message);
  }
  else {
    showError(JSON.stringify(e));
  }
}
