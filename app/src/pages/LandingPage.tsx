import React, { useEffect, useState } from 'react';
import { Clock, Mail, Shield } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { checkInConfirmation } from '../services/apiService';
import { handleAndDisplayError } from '../utils/Utils';
import Footer from "../components/Footer.tsx";

/**
 * Renders the LandingPage component.
 *
 * @returns JXS Element rendered.
 */
const LandingPage: React.FC = () => {
  const [confirmationDone, setConfirmationDone] = useState<boolean>(false);
  const { loginWithRedirect } = useAuth0();

  /**
   * Initiates the login process by redirecting the user to the Auth0 login page.
   * It requests the 'openid', 'profile', and 'email' scopes, and sets the audience to the API.
   */
  const doSignIn = (): void => {
    loginWithRedirect({
      authorizationParams: {
        scope: "openid profile email",
        audience: "http://localhost:8080"
      }
    }).then(() => {});
  }

  /**
   * Checks the URL for a confirmation ID and validates it.
   * If a confirmation ID is found, it sends a request to the API to confirm the check-in.
   */
  const checkForConfirmationId = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const confirmation = urlParams.get('confirmation');
    if (!confirmation) {
      return;
    }

    const payload = { confirmation: confirmation };
    try {
      await checkInConfirmation(payload);
      setConfirmationDone(true);
    }
    catch (e) {
      handleAndDisplayError(e);
    }
  };

  useEffect(() => {
    async function callAsync() {
      await checkForConfirmationId();
    }
    callAsync().then(() => {});
  }, []);

  useEffect(() => {}, [confirmationDone]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Shield className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Silent Guard</h1>
        </div>
        <button 
          onClick={doSignIn}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Login
        </button>
      </header>

      {/* Confirmation Section */}
      {confirmationDone && (
        <main className="px-6 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-8 border border-green-400/30">
              <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                Check-in Confirmed
              </h2>
              
              <p className="text-lg text-slate-300 mb-6">
                Your check-in has been successfully recorded. Your Silent Guard monitoring 
                period has been reset and your messages will remain secure.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 mb-6">
                <p className="text-sm text-slate-300">
                  <span className="text-blue-400 font-semibold">Next check-in required by:</span>
                  <br />
                  <span className="text-white text-base font-medium">
                    {/* You can replace this with dynamic date */}
                    {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </p>
              </div>
              
              <button 
                onClick={doSignIn}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Access Dashboard
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Hero Section */}
      {!confirmationDone && (
        <main className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-white mb-6">
              Your Digital <span className="text-blue-400">Safety Net</span>
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
              Silent Guard is a dead man's switch service that automatically sends important messages 
              when you're unable to check in. Protect your loved ones with crucial information.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Automatic Monitoring</h3>
                <p className="text-slate-300">Set custom time intervals. If you don't check in, your messages are automatically sent.</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Secure Delivery</h3>
                <p className="text-slate-300">Encrypted messages delivered to your specified recipients when needed most.</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Complete Privacy</h3>
                <p className="text-slate-300">Your messages are encrypted and only accessible when the conditions are met.</p>
              </div>
            </div>

            <button 
              onClick={doSignIn}
              className="mt-12 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Started Today
            </button>
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
};

export default LandingPage;
