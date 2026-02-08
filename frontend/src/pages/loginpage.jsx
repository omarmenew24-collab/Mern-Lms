import React from 'react'
import { useState ,useEffect } from 'react';
import useStore from '../store/userstore';
import { Routes, Route, Navigate } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../api/auth';
import useUserStore from '../store/userstore';


const Login = () => {
  const {login , isPending , isError} = useLogin();
  const user  = useUserStore((state) => state.user);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
  });

  const navigate = useNavigate();

  

  const handleSubmit = async (e) => {
    // this implimntation is very slow
    e.preventDefault();
    await login(formData);

      if (user) {
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/');
    }

  };

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white-100 to-white-200 p-6">

      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 space-y-8">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 tracking-tight">Welcome Back</h2>
        <p className="text-center text-gray-500 text-sm">Please sign in to continue</p>

        <div>
          <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Jane Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-5 py-3 text-lg border border-gray-300 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-5 py-3 text-lg border border-gray-300 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-3 px-6 bg-blue-600 text-white text-lg font-semibold rounded-2xl hover:bg-blue-700 transition duration-200 shadow-md"
        >
         Login
        </button>      
      </form>
    </div>
  )
}

export default Login