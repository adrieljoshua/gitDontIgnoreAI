"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [liveViewUrl, setLiveViewUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("idle");
  const [result, setResult] = useState(null);

  const taskExamples = [
    {
      title: "Test Module 1",
      description:
        "Sample task to test the module functionality.",
      task: "Go to example.com and click on the button",
    },
  ];

  const [task, setTask] = useState(taskExamples[0].task);

  const handleStart = async () => {
    setSessionStatus("creating");

    try {
      const sessionId = await start(task);
      setSessionId(sessionId);
    } catch (error) {
      console.error(error);
      setSessionStatus("idle");
    }
  };

  const start = async (task : string) => {
    let browserSessionId = "";
    let liveViewUrl = "";
    const browserCreateSession = await fetch("/browser/createSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!browserCreateSession.ok) {
      throw new Error("Failed to start anchorbrowser.");
    }
    setIsRunning(true);
    const { id, live_view_url } = await browserCreateSession.json();
    liveViewUrl = live_view_url;
    console.log("Starting anchorbrowser done!");
    console.log("anchorSessionId", id);
    console.log("liveViewUrl", liveViewUrl);
    setLiveViewUrl(liveViewUrl);
    browserSessionId = id;

    console.log("Starting session...");
    const createSessionResponse = await fetch("/session/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task,
        browserSessionId,
        liveViewUrl,
      }),
    });

    const { sessionId } = await createSessionResponse.json();
    console.log("sessionId", sessionId);
    console.log("Starting session done!");

    const headers = {
      "Content-Type": "application/json",
    };

    // Construct payload as expected by the endpoint
    const payload = {
      site_url: "https://www.rapidtables.com/tools/todo-list.html",
      modules: [
        {
          module: "Todo",
          submodules: [
            {
              title: "Add Task",
              description: "Ability to add new tasks",
              selected: true,
            },
            {
              title: "List Tasks",
              description: "Ability to display all tasks",
              selected: true,
            },
          ],
        },
      ],
      session_id: sessionId,
      anchor_session_id: browserSessionId,
    };

    // Send the payload and wait for response
    const response = await fetch(`http://localhost:8000/test-modules`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const jsonResult = await response.json();
    console.log("Test Modules result:", jsonResult);
    setResult(jsonResult);

    console.log("Done!!");
    return sessionId;
  };

  return (
    <div className="min-h-screen px-4 py-4 text-white">
      {!isRunning ? (
        <main className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto mt-20 text-center">
          <button
            onClick={handleStart}
            disabled={sessionStatus === "creating"}
            className="mt-4 w-full bg-white/80 text-black hover:bg-white cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sessionStatus === "creating" ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Start"
            )}
          </button>
        </main>
      ) : (
        <main className="flex flex-col-reverse lg:flex-row gap-x-6 gap-y-4 w-full max-w-7xl mx-auto lg:h-[calc(100vh-120px)]">
          <div className="w-full">
            <div className="w-full aspect-video">
              <iframe
                src={liveViewUrl || "about:blank"}
                title="Live View"
                className="w-full h-full rounded-md"
                allow="clipboard-read; clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock"
              />
            </div>
          </div>
          {result && (
            <div className="w-full p-4 bg-gray-800 rounded-md">
              <h2 className="mb-2 text-xl font-semibold">Test Modules Result</h2>
              <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
