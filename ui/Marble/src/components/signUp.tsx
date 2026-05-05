import React, { useState } from "react";
import "./styles/login.css";
import * as internal from "../logic/internal/commonTtypes";
import { createAccount } from "../logic/auth/signUp";
import { user } from "../logic/main";
import { GetKeyfromArmored } from "../logic/enc/encStoreManagement";
export default function SignUp({
  setAuth,
  setUserData,
}: {
  setAuth: React.Dispatch<React.SetStateAction<internal.auth>>;
  setUserData: React.Dispatch<React.SetStateAction<user>>;
}) {
  const [emailText, setEmailText] = useState("Email"); // for email input logic failiur
  const [passText, setPassText] = useState("Password"); // -same-
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const userConfig = await createAccount(name, email, password);
    if (userConfig != null) {
      const prvKey = await GetKeyfromArmored(userConfig.identityKey.privateKey);
      if (prvKey) {
        setUserData({ ...userConfig, prvIdentKey: prvKey });
      }
    }
    // signUp logic goes here
  }

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
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label
              htmlFor="email"
              style={{
                color: emailText == "Email" ? "#ffffffff" : "#e15d5dff",
              }}
            >
              {emailText}
            </label>
            <input
              type="email"
              id="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label
              htmlFor="password"
              style={{
                color: emailText == "Email" ? "#ffffffff" : "#e15d5dff",
              }}
            >
              {passText}
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
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
            Sign Up
          </button>
        </form>
        <div className="login-footer">
          <p>
            Have Account?
            <a
              href="#"
              onClick={() => {
                setAuth("login");
              }}
            >
              Login!
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
