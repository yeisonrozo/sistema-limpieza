import { useState } from "react";
import { supabase } from "../services/supabase";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("ERROR SUPABASE:", error);
      setError("Correo electrónico o contraseña incorrectos.");
    }

    setLoading(false);
  };

  return (
    <div className="login-page">

      <div className="login-background-shape shape-one" />
      <div className="login-background-shape shape-two" />

      <div className="login-card">

        <div className="login-brand">

          <div className="login-logo">
            AH
          </div>

          <div>
            <h1>Aim High</h1>
            <span>Cleaners LLC</span>
          </div>

        </div>

        <div className="login-heading">
          <h2>Bienvenido</h2>

          <p>
            Ingresa a tu sistema administrativo
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          <div className="login-field">

            <label htmlFor="email">
              Correo electrónico
            </label>

            <div className="login-input-wrapper">

              <span>✉</span>

              <input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>

          </div>

          <div className="login-field">

            <label htmlFor="password">
              Contraseña
            </label>

            <div className="login-input-wrapper">

              <span>🔒</span>

              <input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

            </div>

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Ingresando..."
              : "Iniciar sesión"}
          </button>

        </form>

        <div className="login-footer">
          <span>
            Sistema administrativo
          </span>

          <span>
            © {new Date().getFullYear()} Aim High Cleaners LLC
          </span>
        </div>

      </div>

    </div>
  );
}

export default Login;