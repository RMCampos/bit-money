import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

/**
 * TokenContextData defines the structure of the context data for the access token.
 * It includes the access token as a string or null if not available.
 */
interface TokenContextData {
  accessToken: string | null;
}

/**
 * TokenContext provides access to the access token used for API requests.
 * It is used to manage the access token state and provide it to components
 * that need to make authenticated requests.
 */
const TokenContext = createContext<TokenContextData | undefined>(undefined);

interface TokenProviderProps {
  children: React.ReactNode;
}

/**
 * TokenProvider component provides the access token context to its children.
 * It fetches the access token using Auth0's getAccessTokenSilently method
 * and updates the context value accordingly.
 *
 * @param props - The props for the TokenProvider component
 * @returns The rendered TokenProvider component with access token context
 */
const TokenProvider = ({ children }: TokenProviderProps) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated && !isLoading) {
        try {
          const token: string = await getAccessTokenSilently({
            authorizationParams: {
              scope: 'profile email',
              audience: 'http://localhost:8080',
            }
          });
          setAccessToken(token);
        } catch (error) {
          console.error(error);
        }
      }
    };

    getToken();
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  return (
    <TokenContext.Provider value={{ accessToken }}>
      {children}
    </TokenContext.Provider>
  );
};

/**
 * useToken hook provides access to the TokenContext.
 * It throws an error if used outside of a TokenProvider.
 *
 * @returns The current token context data
 */
const useToken = (): TokenContextData => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within TokenProvider');
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export { TokenProvider, useToken };
