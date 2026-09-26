import React, { useEffect } from 'react';

export const App: React.FC = () => {
  useEffect(() => {
    // Phaser needs its parent DOM element to exist before creating the Game.
    // Loading it here avoids React mounting over the canvas during startup.
    import('./PhaserGame');
  }, []);

  return <div id="phaser-game" className="App"></div>;
};
