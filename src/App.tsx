import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import {
  checkUpdate,
  // installUpdate,
  // onUpdaterEvent,
} from '@tauri-apps/api/updater'
// import { relaunch } from '@tauri-apps/api/process'

/**
 * Sends a notification to the user with the given title and body.
 * Throws an error if permission to send notifications has not been granted.
 * @param title The title of the notification.
 * @param body The body of the notification.
 */
export const SendNotificationToWindow = async (title: string, message: string, icon?: string, sound?: string) => {
  await invoke("show_notification", { title, message, icon, sound })
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }


  useEffect(() => {
    const checkForUpdates = async () => {
      // const unlisten = await onUpdaterEvent(({ error, status }) => {
      //   // This will log all updater events, including status updates and errors.
      //   console.log('Updater event', error, status)
      // })
      try {
        const { shouldUpdate, manifest } = await checkUpdate()

        if (shouldUpdate) {
          // You could show a dialog asking the user if they want to install the update here.
          console.log(
            `Installing update ${manifest?.version}, ${manifest?.date}, ${manifest?.body}`
          )

          // // Install the update. This will also restart the app on Windows!
          // await installUpdate()

          // // On macOS and Linux you will need to restart the app manually.
          // // You could use this step to display another confirmation dialog.
          // await relaunch()
        }
      } catch (error) {
        console.error(error)
      }
    }
    checkForUpdates();
  }, [])

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
