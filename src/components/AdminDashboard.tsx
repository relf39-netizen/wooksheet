import { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, Search, School, User as UserIcon } from 'lucide-react';
import { Teacher } from '../types';

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const apiBase = '/server.cjs';
    const res = await fetch(`${apiBase}/api/admin/teachers`);
    const data = await res.json();
    setTeachers(data);
    setLoading(false);
  };

  const handleApprove = async (id: number, status: 'active' | 'rejected' | 'pending') => {
    const apiBase = '/server.cjs';
    const res = await fetch(`${apiBase}/api/admin/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const data = await res.json();
    if (data.success) {
      fetchTeachers();
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(filter.toLowerCase()) || 
    t.school.toLowerCase().includes(filter.toLowerCase()) ||
    t.citizen_id.includes(filter)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Management</span>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">จัดการสมาชิกและการอนุมัติ</h1>
          <p className="text-slate-500 text-sm">ตรวจสอบและอนุมัติคุณครูเพื่อเข้าใช้งานระบบสร้างแบบฝึกหัด</p>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="text-slate-400 ml-2" size={20} />
        <input 
          type="text" 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="ค้นหาตามชื่อ, โรงเรียน, หรือเลขบัตรประชาชน..."
          className="flex-1 bg-transparent border-none outline-none py-2 text-sm placeholder:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-bold tracking-widest uppercase text-xs">กำลังโหลดข้อมูล...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs">
            ไม่พบข้อมูลสมาชิก
          </div>
        ) : (
          filteredTeachers.map(t => (
            <div key={t.id} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${
                  t.status === 'active' ? 'bg-green-600 text-white shadow-green-100' : 
                  t.status === 'rejected' ? 'bg-slate-900 text-white' : 'bg-indigo-500 text-white shadow-indigo-100'
                }`}>
                  <UserIcon size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-slate-900 leading-none">{t.name} {t.surname}</h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-widest ${
                       t.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 
                       t.status === 'rejected' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      {t.status === 'active' ? 'APPROVED' : t.status === 'rejected' ? 'REJECTED' : 'PENDING REVIEW'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <School size={14} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{t.school}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none">ID:</span>
                      <span className="font-mono">{t.citizen_id}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold uppercase text-indigo-600 tracking-tighter">
                      <span>{t.position}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {t.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleApprove(t.id, 'active')}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase text-xs tracking-widest"
                    >
                      <UserCheck size={16} />
                      <span>Approve</span>
                    </button>
                    <button 
                      onClick={() => handleApprove(t.id, 'rejected')}
                      className="bg-white text-slate-500 border border-slate-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all uppercase text-xs tracking-widest"
                    >
                      <UserX size={16} />
                      <span>Reject</span>
                    </button>
                  </>
                )}
                {t.status !== 'pending' && (
                  <button 
                    onClick={() => handleApprove(t.id, 'pending')}
                    className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-600 px-4 py-2 border border-transparent hover:border-indigo-100 rounded-lg transition-all"
                  >
                    Reset Review
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
