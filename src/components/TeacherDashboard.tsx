import { useState, useEffect } from 'react';
import { Key, PlusCircle, History, UserCheck, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { User, Exercise } from '../types';

export default function TeacherDashboard({ user, onNavigate, onUserUpdate }: { user: User, onNavigate: (page: string, param?: string) => void, onUserUpdate: (updatedUser: User) => void }) {
  const [aiKey, setAiKey] = useState(user.ai_key || '');
  const [updating, setUpdating] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const apiBase = '/server.cjs';
    fetch(`${apiBase}/api/exercises`)
      .then(res => res.json())
      .then(data => setExercises(data))
      .catch(console.error);
  }, []);

  const handleUpdateKey = async () => {
    setUpdating(true);
    const apiBase = '/server.cjs';
    const res = await fetch(`${apiBase}/api/profile/key`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_key: aiKey })
    });
    
    if (res.ok) {
      onUserUpdate({ ...user, ai_key: aiKey });
      alert('บันทึก API Key สำเร็จ');
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
    
    setUpdating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <header className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">ยินดีต้อนรับกลับมา</span>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">คุณครู {user.name}</h1>
              <p className="text-slate-500 text-sm">จัดการข้อมูลและเครื่องมือสร้างสื่อการเรียนรู้ของคุณที่นี่</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActionCard 
              title="สร้างแบบฝึกหัดใหม่" 
              desc="ใช้ AI ช่วยวิเคราะห์และสร้างแบบฝึกหัดตามหลักสูตร"
              icon={<PlusCircle size={28} />}
              color="bg-indigo-600 shadow-indigo-100"
              onClick={() => onNavigate('generate')}
            />
            <ActionCard 
              title="คลังแบบฝึกหัด" 
              desc="เรียกดูหรือพิมพ์งานที่เคยสร้างไว้"
              icon={<History size={28} />}
              color="bg-slate-900 shadow-slate-200"
              onClick={() => onNavigate('history')}
            />
          </div>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                แบบฝึกหัดล่าสุด
              </h3>
              <button onClick={() => onNavigate('history')} className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-tight">ดูทั้งหมด</button>
            </div>
            
            {exercises.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 p-12 rounded-2xl text-center">
                <FileText className="mx-auto text-slate-200 mb-4" size={40} />
                <p className="text-slate-400 text-sm font-medium">ยังไม่พบข้อมูลแบบฝึกหัดที่คุณสร้าง</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exercises.slice(0, 4).map((ex) => (
                  <div key={ex.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group" onClick={() => onNavigate('print', String(ex.id))}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <FileText size={20} />
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200 uppercase tracking-tight">{ex.grade}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 truncate text-base">{ex.title}</h4>
                    <p className="text-[10px] uppercase text-indigo-500 font-bold tracking-widest">{ex.course}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Key size={18} />
              </div>
              <h3 className="font-bold uppercase tracking-wider text-sm">การเชื่อมต่อ AI</h3>
            </div>
            
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              ใส่ API Key เพื่อใช้ระบบอัตโนมัติ ข้อมูลนี้จะถูกเก็บเป็นความลับเฉพาะคุณ
            </p>
            
            <div className="mb-6">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center gap-1"
              >
                วิธีรับ API Key ฟรีจาก Google AI Studio
                <ChevronRight size={12} />
              </a>
              <p className="text-[10px] text-slate-500 mt-2 italic leading-tight">
                * คู่มือ: ล็อกอินด้วย Gmail → กดปุ่ม "Create API key" → คัดลอกรหัสที่ขึ้นต้นด้วย 'AIz...' มาวางด้านล่าง
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block tracking-widest">GEMINI API KEY</label>
                <input 
                  type="password"
                  value={aiKey}
                  onChange={(e) => setAiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-transparent border-none outline-none text-indigo-300 font-mono text-sm"
                />
              </div>
              <button 
                onClick={handleUpdateKey}
                disabled={updating}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/50"
              >
                {updating ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">สถิติระบบ</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tight">แบบฝึกที่บันทึก</div>
                <div className="text-2xl font-bold">{exercises.length}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tight">สถานะบัญชี</div>
                <div className="text-xs font-bold text-green-600 uppercase">ปกติ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`${color} text-white p-8 rounded-2xl shadow-lg transition-all hover:-translate-y-1 active:scale-95 text-left group`}
    >
      <div className="mb-8 group-hover:scale-110 transition-transform bg-white/10 w-fit p-3 rounded-xl">{icon}</div>
      <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">{title}</h3>
      <p className="text-white/60 text-xs">{desc}</p>
    </button>
  );
}
