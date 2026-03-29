import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login        from './Login';
import Register     from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword  from './ResetPassword';
import Home         from './Home';
import Vault        from './Vault';
import Dashboard    from './Dashboard';
import CaseFiles    from './CaseFiles';
import Profile      from './Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/home"            element={<Dashboard />} />
        <Route path="/vault"           element={<Vault />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/casefiles"       element={<CaseFiles />} />
        <Route path="/chat"            element={<Home />} />
        <Route path="/profile"         element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
