import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider } from "./contexts/AuthContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Layout } from "./components/Layout"
import { Home } from "./pages/Home"
import { CreatePost } from "./pages/CreatePost"
import { Profile } from "./pages/Profile"
import { PostDetail } from "./pages/PostDetail"
import { ProfileSettings } from "./pages/ProfileSettings"
import { BlankPage } from "./pages/BlankPage"
import { Messages } from "./pages/Messages"
import { Chat } from "./pages/Chat"
import { ChatProvider } from "./contexts/ChatContext";
import CreateStatus from "./pages/CreateStatus";

function App() {
  return (
  <AuthProvider>
   <ChatProvider>
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
          <Route path="/compose" element={<ProtectedRoute><Layout><CreatePost /></Layout></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute>} />
          <Route path="/chat/:chatId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/post/:postId" element={<ProtectedRoute><Layout><PostDetail /></Layout></ProtectedRoute>} />
          <Route path="/settings/profile" element={<ProtectedRoute><Layout><ProfileSettings /></Layout></ProtectedRoute>} />
          <Route path="/create-status" element={<ProtectedRoute><CreateStatus /></ProtectedRoute>} />
          <Route path="*" element={<BlankPage />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
   </ChatProvider>
  </AuthProvider>
  )
}

export default App