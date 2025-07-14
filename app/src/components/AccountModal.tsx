import type { User } from '@auth0/auth0-react';
import { X } from 'lucide-react';
import React from 'react';

type Props = {
  show: boolean;
  onClose: () => void;
  onSubmitAccount: () => void;
  user: User | undefined
}

/**
 * AccountModal component displays a modal for account settings.
 * It includes a read-only email field and a close button.
 * The modal is shown based on the `show` prop.
 * The `onClose` prop is called when the modal is closed.
 * The `onSubmitAccount` prop is intended for future use to handle account updates.
 * The `user` prop provides the user information, specifically the email.
 *
 * @param props - The props for the AccountModal component
 * @returns The rendered AccountModal component or null if not shown
 */
const AccountModal: React.FC<Props> = (props): React.ReactNode => {
  return props.show
    ? (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Account Settings</h2>
            <button
              onClick={() => props.onClose()}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={props.user?.email}
                readOnly={true}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              onClick={(e) => {
                e.preventDefault();
                props.onClose();
              }}
            >
              Close
            </button>
          </form>
        </div>
      </div>
    ) : null;
}

export default AccountModal;
