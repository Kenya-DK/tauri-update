import { invoke } from "@tauri-apps/api";
import React, { createContext, useContext, useEffect, useState } from "react";
import WebSocket from "tauri-plugin-websocket-api";
import { SendNotificationToWindow } from "./App";

type SocketContextProps = {
  socket: WebSocket | undefined;
}

type SocketContextProviderProps = {
  children: React.ReactNode;
}

export const SocketContext = createContext<SocketContextProps>({
  socket: undefined,
});
export const useSocketContextContext = () => useContext(SocketContext);
export const SocketContextProvider = ({ children }: SocketContextProviderProps) => {
  const [socket, setSocket] = useState<WebSocket | undefined>();
  const DEVICE_ID = "";
  const SECRET = "";

  const GetMessages = async () => {
    try {
      const rep = await invoke("get_msg", { deviceId: DEVICE_ID, secret: SECRET }) as { messages: any[] };
      const messages = rep["messages"] as any[];
      // Get Last message
      const lastMessage = messages[messages.length - 1];
      console.log(lastMessage);

      SendNotificationToWindow(lastMessage["title"] || "Kenya", lastMessage["message"] || "NOPE", lastMessage["icon"], lastMessage["sound"]);
    } catch (error) {
      console.log(error);
    }
  };

  const [last_event_received, setLastEventReceived] = useState<Date | undefined>();

  const SetupSocket = async () => {
    const ws = await WebSocket.connect("wss://client.pushover.net/push");
    ws.addListener((cd) => {
      var message = cd.data?.toString();
      if (!message) return;
      switch (message) {
        // Keep-alive packet, no response needed
        case "35":
          console.log("Keep-alive packet, no response needed");
          break;
        // A new message has arrived; you should perform a sync
        case "33":
          GetMessages();
          break;
        //  Reload request; you should drop your connection and re-connect
        case "82":
          console.log("Reload request; you should drop your connection and re-connect");
          break;
        //  Error; a permanent problem occured and you should not automatically re-connect. Prompt the user to login again or re-enable the device.              
        case "69":
          console.log("Error; a permanent problem occured and you should not automatically re-connect. Prompt the user to login again or re-enable the device.");
          break;
        //  Error; the device logged in from another session and this session is being closed. Do not automatically re-connect.
        case "65":
          console.log("Error; the device logged in from another session and this session is being closed. Do not automatically re-connect.");
          break;
        default:
          console.log("Unknown message", message);
          break;
      }
    });
    setTimeout(() => {
      ws.send(`login:${DEVICE_ID}:${SECRET}\n`);
      // setLastEventReceived(new Date());
    }, 1000);
    return ws;
  }

  useEffect(() => {
    const reconnect = async () => {
      const ws = await SetupSocket();
      setSocket(ws);
    };
    reconnect().catch((_e) => {
      console.log("Error while connecting to socket", _e);
    });
  }, [last_event_received]);


  useEffect(() => {
    let tempDate = new Date();
    const interval = setInterval(() => {
      // if (last_event_received && (new Date().valueOf() - last_event_received.valueOf()) > 180000) {
      if (tempDate && (new Date().valueOf() - tempDate.valueOf()) > 180000) {
        // Disconnect socket if it exists
        setSocket((preSocket) => { if (preSocket) preSocket.disconnect(); return undefined; });
        console.log("Socket connection lost, reconnecting");
        tempDate = new Date();
        setLastEventReceived(tempDate);
      }
    }, 60000); // Update every second

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}


