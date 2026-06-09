import { createConnection, createLongLivedTokenAuth } from "home-assistant-js-websocket";

export const connectHA = async () => {
  const url = import.meta.env.VITE_HA_URL;
  const token = import.meta.env.VITE_HA_TOKEN;

  if (!url || !token) {
    throw new Error("Home Assistant URL of Token mist in de .env file.");
  }

  // De auth utility pakt de url en token om een websocket verbinding te authenticeren
  const auth = createLongLivedTokenAuth(url, token);
  
  // Creëer de verbinding
  const connection = await createConnection({ auth });
  
  return connection;
};
