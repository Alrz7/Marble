import { useState } from "react";
import "./styles/textBox.css";

export default function TextBox() {
  const [text, setText] = useState<string>("");
  // function clearBox() {
  //   setText("");
  // }

  async function sendData(text: string) {
    const data = {
      text: text,
    };

    try {
      // const response =
      await fetch("http://localhost:4000/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // const result = await response.json();
      // console.log("Response from Go:", result);
    } catch (error) {
      console.error("Error sending data:", error);
    }
  }

  return (
    <>
      <div className="editor-container">
        <textarea
          className="text-area"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="type your code here..."
        />
      </div>
      <div className="boxButtons">
        <button
          className="button save"
          onClick={() => {
            sendData(text);
          }}
        >
          Save
        </button>
        <button className="button reset">Restet</button>
      </div>
    </>
  );
}
