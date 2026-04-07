import { useState } from "react";
import "./App.css";

function App() {
  const [data, setData] = useState("");
  async function getData() {
    const url = "http://localhost:4500";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.num);
    } catch (error) {
      console.error(error);
    }
  }

  const sendData = async () => {
    const data = {
      num: 45,
    };

    try {
      const response = await fetch("http://localhost:4000/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Response from Go:", result);
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  return (
    <>
      <div style={{ backgroundColor: "gray", textAlign: "center" }}>
        <h1>Dashboard</h1>
        <button>{data}</button>
        <>
          <button onClick={getData}>GetData</button>
        </>
        <>
          <button onClick={sendData}>SendData</button>
        </>
      </div>
    </>
  );
}

export default App;
