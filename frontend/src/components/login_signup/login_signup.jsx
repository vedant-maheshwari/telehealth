import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './login_signup.css';
import { login, registerPatient, getCurrentUser, registerDoctor, registerFamily } from '../../services/api';

const LoginSignup = () => {
    const [action, setAction] = useState("Login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [dob, setDob] = useState("");
    const [role, setRole] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();
    const [medicalLicense, setMedicalLicense] = useState("");

    const handleLogin = async () => {
        setErrorMsg("");
        try {
            const data = await login(email, password);

            sessionStorage.setItem("token", data.access_token);
            sessionStorage.setItem("role", data.role);
            sessionStorage.setItem("user_id", data.user_id);

            const user = await getCurrentUser(data.access_token);
            sessionStorage.setItem("user_name", user.name);
            sessionStorage.setItem("user_email", user.email);

            // Redirect based on role
            if (data.role === "doctor") navigate("/doctor-dashboard");
            else if (data.role === "patient") navigate("/");
            else if (data.role === "family") navigate("/family-dashboard");
            else navigate("/login"); // fallback
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message);
        }
    };

    const handleSignUp = async () => {
        setErrorMsg("");

        if (!name || !email || !password || !dob || !role) {
            setErrorMsg("All fields are required");
            return;
        }

        // Doctor-specific validation
        if (role === "doctor" && !medicalLicense) {
            setErrorMsg("Doctor registration requires a medical license number.");
            return;
        }

        try {
            let payload = {
                name,
                email,
                password,
                date_of_birth: dob
            };

            if (role === "patient") {
                await registerPatient(payload);
            } else if (role === "doctor") {
                payload = {
                    ...payload,
                    medical_license: medicalLicense
                };
                await registerDoctor(payload);
            } else if (role === "family") {
                await registerFamily(payload);
            }

            alert("SignUp successful! Please login.");
            setAction("Login");
            // Clear form
            setName("");
            setEmail("");
            setPassword("");
            setDob("");
            setRole("");
            setMedicalLicense("");
        } catch (err) {
            console.error(err);
            const errorDetail = err.response?.data?.detail?.[0]?.msg || err.message || JSON.stringify(err);
            setErrorMsg(`Registration failed: ${errorDetail}`);
        }
    };

    const handleSubmit = () => {
        if (action === "Login") handleLogin();
        else handleSignUp();
    };

    // Icon components as SVGs
    const EmailIcon = () => (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#999"/>
        </svg>
    );

    const PasswordIcon = () => (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M12,17c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,17,12,17z M15.1,8H8.9V6c0-1.71,1.39-3.1,3.1-3.1s3.1,1.39,3.1,3.1V8z" fill="#999"/>
        </svg>
    );

    const UserIcon = () => (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" fill="#999" />
        </svg>
    );

    const CalendarIcon = () => (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z" fill="#999" />
        </svg>
    );

    const CertificateIcon = () => (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M13,21L15,20L13,19L14.5,17.5L12.5,16.5L14.5,14.5L12,13.5L14,12L12,10.5L13.5,9L12,7.5L13.5,6L12,4.5L13,3H11L10.5,1.5L9,3H7L6.5,4.5L5,6L6.5,7.5L5,9L6.5,10.5L5,12L7,13.5L4.5,14.5L6.5,16.5L4.5,17.5L6,19L4,20L6,21L7.5,22.5L9,21H11L12.5,22.5L13,21M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10Z" fill="#999" />
        </svg>
    );

    return (
        <div className='container'>
            <div className="header">
                <div className="text">{action}</div>
                <div className="underline"></div>
            </div>

            <div className="inputs">
                {action === "SignUp" && (
                    <>
                        <div className="input">
                            <UserIcon />
                            <input 
                                type="text" 
                                placeholder='Name' 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                            />
                        </div>
                        <div className="input">
                            <CalendarIcon />
                            <input 
                                type="date" 
                                value={dob} 
                                onChange={(e) => setDob(e.target.value)} 
                            />
                        </div>
                        <div className="input">
                            <select 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="">Select Role</option>
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                                <option value="family">Family</option>
                            </select>
                        </div>
                        {role === "doctor" && (
                            <div className="input">
                                <CertificateIcon />
                                <input 
                                    type="text" 
                                    placeholder='Medical License Number' 
                                    value={medicalLicense} 
                                    onChange={(e) => setMedicalLicense(e.target.value)} 
                                />
                            </div>
                        )}
                    </>
                )}

                <div className="input">
                    <EmailIcon />
                    <input 
                        type="email" 
                        placeholder='Email id' 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                </div>

                <div className="input">
                    <PasswordIcon />
                    <input 
                        type="password" 
                        placeholder='Password' 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                </div>
            </div>

            {action === "Login" && (
                <div className="forgot-password">
                    Lost Password? <span>Click Here</span>
                </div>
            )}

            {errorMsg && (
                <div className="error">
                    {errorMsg}
                </div>
            )}

            <div className="switch-action">
                {action === "Login" ? (
                    <p>
                        Don't have an account? <span onClick={() => setAction("SignUp")}>SignUp</span>
                    </p>
                ) : (
                    <p>
                        Already have an account? <span onClick={() => setAction("Login")}>Login</span>
                    </p>
                )}
            </div>

            <div className="submit-container">
                <div className="submit" onClick={handleSubmit}>
                    {action}
                </div>
            </div>
        </div>
    );
};

export default LoginSignup;