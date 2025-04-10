// src/features/auth/routes/AuthRoutes.tsx

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '../pages';

const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
    </Routes>
  );
};

export default AuthRoutes;

