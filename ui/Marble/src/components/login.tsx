import React, { useState } from "react";
import "./styles/login.css";
import * as internal from "../logic/internal/commonTypes";
import { login } from "../logic/auth/login";
import { getKeyFromArmored } from "../logic/enc/keyChain";
export default function Login({
  setAuth,
  setUserData,
}: {
  setAuth: React.Dispatch<React.SetStateAction<internal.auth>>;
  setUserData: React.Dispatch<React.SetStateAction<internal.User | null>>;
}) {
  const [name, setName] = useState("");
  const [id, setId] = useState(0);
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUserConfig = await login(name, id, password);
    if (newUserConfig) {
      const prvKey = await getKeyFromArmored(
        newUserConfig.identityKey.privateKey,
        null,
      );
      if (prvKey) {
        setUserData({ config: newUserConfig, prvIdentKey: prvKey });
      }
    }
    // loggin logic goes here
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo"></div>
          <h1>Marble</h1>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              placeholder="name"
              // value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label
              htmlFor="id"
              style={
                {
                  // color: idText == "Id" ? "#ffffffff" : "#e15d5dff",
                }
              }
            >
              Id
            </label>
            <input
              type="id"
              id="id"
              placeholder="id"
              // value={""}
              onChange={(e) => setId(Number(e.target.value))}
              required
            />
          </div>
          <div className="input-group">
            <label
              htmlFor="password"
              style={
                {
                  // color: idText == "Email" ? "#ffffffff" : "#e15d5dff",
                }
              }
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              // value={}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">
              Forgot Password?
            </a>
          </div>
          <button type="submit" className="login-btn">
            login
          </button>
        </form>
        <div className="login-footer">
          <p>
            No Account?
            <a
              href="#"
              onClick={() => {
                setAuth("signup");
              }}
            >
              Sign Up!
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
