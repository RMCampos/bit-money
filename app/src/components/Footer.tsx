import React from 'react';
import {env} from "../env.ts";

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 px-6 py-4 border-t border-white/20 z-40">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-slate-400 text-sm">
          Silent Guard {env.VITE_BUILD}
        </p>
      </div>
    </footer>
  );
}

export default Footer;
