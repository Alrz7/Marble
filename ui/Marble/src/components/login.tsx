import React, { useState } from "react";
import "./styles/login.css";
import * as internal from "../logic/internal/commonTtypes";
import { user } from "../logic/main";
export default function Login({
  setAuth,
  setUserData,
}: {
  setAuth: React.Dispatch<React.SetStateAction<internal.auth>>;
  setUserData: React.Dispatch<React.SetStateAction<user>>;
}) {
  const [email, setEmail] = useState("");
  const [emailText, setEmailText] = useState("Email");
  const [passText, setPassText] = useState("Password");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // loggin logic goes here
    console.log("Login:", email, password);
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
