import { Edit, LogOut, Plus, Save, Shield, Trash2, User, X } from 'lucide-react';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import type { Message } from '../types/Message';
import { useAuth0 } from '@auth0/auth0-react';
import AccountModal from '../components/AccountModal';
import { createMessage, deleteMessage, getMessages, signInOrSignUpUser, updateMessage } from '../services/apiService';
import { useToken } from '../context/TokenContext';
import { handleAndDisplayError } from '../utils/Utils';
import swal from 'sweetalert';
import Footer from "../components/Footer.tsx";
import RichTextEditor from "../components/RichTextEditor.tsx";

type Props = {
  setPageChanged: () => void;
};

const emptyMessage: Message = { id: 0, subject: '', content: '', daysToTrigger: 30, recipients: [], active: true };

/**
 * DashboardPage component displays the user's dashboard with options to manage messages.
 * It includes functionality to create, edit, delete, and toggle the status of messages.
 * The user must be authenticated to access this page.
 *
 * @param props - The props for the DashboardPage component
 * @returns The rendered DashboardPage component
 */
const DashboardPage: React.FC<Props> = (props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState<Message>(emptyMessage);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [userValidated, setUserValidated] = useState<boolean>(false);
  const { user, isAuthenticated, logout } = useAuth0();
  const { accessToken } = useToken();

  /**
   * Handles the saving of a message, either creating a new one or updating an existing one.
   */
  const handleSaveMessage = async () => {
    if (editingMessage) {
      try {
        const cleanEmails = editingMessage.recipients.map(email => email.trim());
        await updateMessage(accessToken, { ...editingMessage, recipients: cleanEmails });
        setEditingMessage(null);
        await fetchAllMessages();
      }
      catch (e: unknown) {
        handleAndDisplayError(e);
      }
    } else {
      try {
        const cleanEmails = newMessage.recipients.map(email => email.trim());
        await createMessage(accessToken, { ...newMessage, recipients: cleanEmails });
        setNewMessage(emptyMessage);
        await fetchAllMessages();
      }
      catch (e: unknown) {
        handleAndDisplayError(e);
      }
    }
  };

  /**
   * Handles the deletion of a message after user confirmation.
   * Displays a confirmation dialog before proceeding with the deletion.
   *
   * @param id - The ID of the message to be deleted
   */
  const handleDeleteMessage = async (id: number) => {
    const willDelete = await swal({
      title: "Are you sure?",
      text: 'You want to delete this message?',
      icon: 'warning',
      dangerMode: true,
      closeOnEsc: true,
      buttons: ["No", "Yes"],
    });

    if (willDelete) {
      const messageToDelete = messages.filter(msg => msg.id === id);

      if (messageToDelete.length > 0) {
        try {
          await deleteMessage(accessToken, messageToDelete[0].id);
          setEditingMessage(null);
          await fetchAllMessages();
        }
        catch (e: unknown) {
          handleAndDisplayError(e);
        }
      }
    }
  };

  /**
   * Fetches all messages from the API and updates the state.
   * This function is called when the component mounts and whenever the user validation status changes.
   */
  const fetchAllMessages = useCallback(async () => {
    if (userValidated) {
      try {
        const messagesFetched: Message[] = await getMessages(accessToken);
        setMessages(messagesFetched);
      } catch (e: unknown) {
        handleAndDisplayError(e);
      }
    }
  }, [userValidated, accessToken]);

  /**
   * Toggles the active status of a message by its ID.
   * If the message is currently active, it will be deactivated and vice versa.
   *
   * @param id - The ID of the message to toggle
   */
  const toggleMessageStatus = async (id: number) => {
    const messageToActivate = messages.filter(msg => msg.id === id);

    if (messageToActivate.length > 0) {
      try {
        messageToActivate[0].active = !messageToActivate[0].active;
        await updateMessage(accessToken, messageToActivate[0]);
        setEditingMessage(null);
        await fetchAllMessages();
      }
      catch (e: unknown) {
        handleAndDisplayError(e);
      }
    }
  };

  /**
   * Validates the user by checking if they are authenticated and signing them in or up if necessary.
   * If the user is invalid, it triggers a page change.
   */
  const validateUser = useCallback(async () => {
    try {
      await signInOrSignUpUser(accessToken)
      setUserValidated(true);

    }
    catch (e: unknown) {
      const err = e as Error;
      if (err.message === 'Invalid user!') {
        props.setPageChanged();
      }
      else {
        handleAndDisplayError(e);
      }
    }
  }, [props, accessToken]);

  /**
   * Creates a footer message string for each message, including the trigger days, last check-in, and next reminder.
   *
   * @param message - The message object containing details for the footer
   * @returns A formatted string with the footer information
   */
  const createFooterMessage = (message: Message): string => {
    const parts: string[] = [];
    parts.push(`Trigger every ${message.daysToTrigger} day(s); `);
    if (message.lastCheckIn) {
      parts.push(`Last check-in: ${message.lastCheckIn}; `);
    }
    else {
      parts.push('Last check-in: N/A; ');
    }
    parts.push(`Next reminder: ${message.nextReminder}`);
    return parts.join('');
  };

  /**
   * Handles user logout by calling the Auth0 logout function with the return URL.
   * This will redirect the user to the home page after logging out.
   */
  const handleLogout = async () => {
    await logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      props.setPageChanged();
    }

    if (!userValidated) {
      validateUser().then(() => {});
    }

    fetchAllMessages().then(() => {});
  }, [isAuthenticated, props, accessToken, userValidated, validateUser, fetchAllMessages]);

  return (
    <Fragment>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Silent Guard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAccountModal(true)}
                className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
              >
                <User className="w-5 h-5" />
                <span>Account</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-slate-700 hover:text-slate-900"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Messages</h2>
            <p className="text-slate-600">Manage your dead man's switch messages and monitoring settings.</p>
          </div>

          {/* New Message Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Create new scheduled message</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Message subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400"
              />
              <input
                type="email"
                placeholder="Recipient email (comma for multiple)"
                value={newMessage.recipients}
                onChange={(e) => setNewMessage({ ...newMessage, recipients: e.target.value.split(',') })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400"
              />
            </div>
            <div className="mt-4">
              <textarea
                placeholder="Message content"
                rows={4}
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400"
              />
              <RichTextEditor />
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-slate-700">Trigger every (days):</label>
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  max="365"
                  value={newMessage.daysToTrigger}
                  onChange={(e) => setNewMessage({ ...newMessage, daysToTrigger: parseInt(e.target.value) })}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={handleSaveMessage}
                disabled={!newMessage.subject || !newMessage.content || !newMessage.recipients}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Message</span>
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="grid gap-6">
            {messages.map((message) => (
              <div key={message.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {editingMessage?.id === message.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingMessage.subject}
                      onChange={(e) => setEditingMessage({ ...editingMessage, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400"
                    />
                    <input
                      type="email"
                      value={editingMessage.recipients.join(', ')}
                      onChange={(e) => setEditingMessage({ ...editingMessage, recipients: e.target.value.split(',') })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400"
                    />
                    <textarea
                      rows={4}
                      value={editingMessage.content}
                      onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-slate-700">Days:</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={editingMessage.daysToTrigger}
                          onChange={(e) => setEditingMessage({ ...editingMessage, daysToTrigger: parseInt(e.target.value) })}
                          className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-400"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveMessage}
                          className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingMessage(null)}
                          className="flex items-center space-x-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{message.subject}</h3>
                        <p className="text-sm text-slate-600">To: {message.recipients.join(', ')}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${message.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-800'
                          }`}>
                          {message.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-700 mb-4">{message.content}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        {createFooterMessage(message)}

                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleMessageStatus(message.id)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${message.active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                        >
                          {message.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setEditingMessage(message)}
                          className="flex items-center space-x-1 bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="flex items-center space-x-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
      <AccountModal
        show={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
        }}
        onSubmitAccount={() => { }}
        user={user}
      />
    </Fragment>
  );
}

export default DashboardPage;
