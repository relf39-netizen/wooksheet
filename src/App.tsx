import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  FilePlus, 
  List, 
  ShieldCheck, 
  LogOut, 
  BookOpen, 
  Library,
  ChevronRight,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from './types';

// Components (We will create these next)
import Login from './components/Login';
import Register from './components/Register';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import Generator from './components/Generator';
import ExerciseList from './components/ExerciseList';
import PrintView from './components/PrintView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // ใช้ตำแหน่งปัจจุบันเป็นหลัก และระบุไฟล์จุดเริ่มต้นของเซิร์ฟเวอร์
    const apiBase = '/server.cjs';
    fetch(`${apiBase}/api/auth/me`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    const apiBase = '/server.cjs';
    await fetch(`${apiBase}/api/auth/logout`, { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <AnimatePresence>
          {!user ? (
            <Routes>
              <Route path="/login" element={<Login onLogin={setUser} />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          ) : (
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <motion.aside 
                initial={false}
                animate={{ width: isSidebarOpen ? 256 : 80 }}
                className="bg-slate-900 text-white flex flex-col transition-all duration-300 relative z-20 border-r border-slate-700 shadow-xl"
              >
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl text-white">E</div>
                    {isSidebarOpen && (
                      <div>
                        <h1 className="font-bold text-lg leading-tight uppercase tracking-wider">EduGen AI</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mt-0.5">ระบบแบบฝึก AI</p>
                      </div>
                    )}
                  </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                  {user.role === 'teacher' && (
                    <>
                      <NavLink to="/" icon={<Library size={18} />} label="หน้าหลัก" isOpen={isSidebarOpen} />
                      <NavLink to="/generate" icon={<FilePlus size={18} />} label="สร้างแบบฝึกหัด" isOpen={isSidebarOpen} />
                      <NavLink to="/history" icon={<List size={18} />} label="คลังแบบฝึกหัด" isOpen={isSidebarOpen} />
                    </>
                  )}
                  {user.role === 'admin' && (
                    <NavLink to="/admin" icon={<ShieldCheck size={18} />} label="อนุมัติสมาชิก" isOpen={isSidebarOpen} />
                  )}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-700">
                  {isSidebarOpen && (
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
                      <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-widest">ครู: {user.name}</div>
                      <div className="flex items-center justify-between">
                        <code className="text-[10px] text-indigo-300 truncate w-32 font-mono">
                          {user.ai_key ? `••••${user.ai_key.slice(-4)}` : 'ยังไม่มี Key'}
                        </code>
                        <div className={`w-2 h-2 rounded-full ${user.ai_key ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-slate-600'}`}></div>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white transition-colors w-full text-left text-sm font-semibold rounded-lg hover:bg-slate-800"
                  >
                    <LogOut size={18} />
                    {isSidebarOpen && <span>ออกจากระบบ</span>}
                  </button>
                </div>

                <button 
                  onClick={() => setSidebarOpen(!isSidebarOpen)}
                  className="absolute -right-3 top-20 bg-white text-indigo-900 border border-indigo-100 rounded-full p-1 shadow-md hover:scale-110 transition-transform hidden md:block"
                >
                  <ChevronRight size={16} className={isSidebarOpen ? 'rotate-180' : ''} />
                </button>
              </motion.aside>

              {/* Main Content */}
              <main className="flex-1 overflow-y-auto relative bg-slate-50">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 transition-all">
                  <div className="flex items-center gap-4">
                    <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                      <Menu size={20} />
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">EDU GEN 3.0</span>
                      <h2 className="text-sm font-bold text-slate-900">
                        {user.role === 'admin' ? 'หน้าจัดการระบบ (Administrator)' : `สถานศึกษา: ${user.school || 'โรงเรียนไทย'}`}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">{user.name}</div>
                      <div className="text-[10px] text-green-600 font-bold uppercase tracking-wide">● ออนไลน์</div>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-indigo-600 font-bold">
                      {user.name?.[0] || 'U'}
                    </div>
                  </div>
                </header>

                <div className="p-8 max-w-6xl mx-auto">
                  <Routes>
                    {user.role === 'teacher' ? (
                      <>
                        <Route path="/" element={<TeacherDashboard user={user} />} />
                        <Route path="/generate" element={<Generator user={user} />} />
                        <Route path="/history" element={<ExerciseList />} />
                        <Route path="/print/:id" element={<PrintView />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </>
                    ) : (
                      <>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="*" element={<Navigate to="/admin" />} />
                      </>
                    )}
                  </Routes>
                </div>
              </main>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

function NavLink({ to, icon, label, isOpen }: { to: string, icon: any, label: string, isOpen: boolean }) {
  const isActive = window.location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${
        isActive 
          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' 
          : 'text-slate-400 hover:text-white border-transparent'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-transparent'}`}></div>
      <span className={isOpen ? 'text-sm font-semibold' : 'hidden'}>{label}</span>
      {!isOpen && <span className="sr-only">{label}</span>}
    </Link>
  );
}
