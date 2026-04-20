import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Download, CheckCircle2 } from 'lucide-react';
import { Exercise } from '../types';

export default function PrintView() {
  const { id } = useParams();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => {
        const found = data.find((ex: Exercise) => ex.id === Number(id));
        setExercise(found);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-20">กำลังจัดเตรียมไฟล์...</div>;
  if (!exercise) return <div className="text-center py-20">ไม่พบแบบฝึกหัด</div>;

  const content = JSON.parse(exercise.content);

  return (
    <div className="space-y-8 print:space-y-0 print:m-0">
      {/* UI Controls - Hidden on Print */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
          <ChevronLeft size={20} />
          <span>ย้อนกลับ</span>
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Printer size={18} />
            <span>สั่งพิมพ์ไฟล์</span>
          </button>
        </div>
      </div>

      {/* The Printable Document */}
      <div id="print-document" className="bg-white p-12 md:p-16 rounded-[40px] shadow-sm border border-slate-50 min-h-[1000px] print:shadow-none print:border-none print:p-0 print:rounded-none mx-auto max-w-[800px]">
        {/* Header Section */}
        <header className="border-b-4 border-slate-900 pb-8 mb-12 text-center relative">
          <div className="absolute top-0 right-0 text-[10px] font-bold text-slate-400 print:hidden uppercase tracking-widest">EduGen System</div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">{exercise.title}</h1>
          <div className="flex justify-center flex-wrap gap-x-8 gap-y-2 text-sm font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span>วิชา:</span>
              <span className="text-slate-900">{exercise.course}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>ระดับชั้น:</span>
              <span className="text-slate-900">{exercise.grade}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>ผู้สร้าง:</span>
              <span className="text-slate-900 italic">คุณครู {exercise.id ? 'ผู้ทรงคุณวุฒิ' : ''}</span>
            </div>
          </div>
        </header>

        {/* Instructions */}
        <div className="mb-12 bg-slate-50 p-6 rounded-2xl border-l-8 border-slate-900 italic text-slate-700 font-medium">
          <span className="font-black not-italic text-sm mr-2 uppercase tracking-tighter">คำชี้แจง:</span>
          {content.description}
        </div>

        {/* Student Info Area */}
        <div className="grid grid-cols-2 gap-8 mb-16 pb-8 border-b border-dashed border-slate-200">
          <div className="flex items-end gap-2 text-sm">
            <span className="font-bold text-slate-400 whitespace-nowrap">ชื่อ-นามสกุล:</span>
            <div className="flex-1 border-b border-slate-900 min-h-[24px]"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-end gap-2 text-sm">
              <span className="font-bold text-slate-400 whitespace-nowrap">ชั้น:</span>
              <div className="flex-1 border-b border-slate-900 min-h-[24px]"></div>
            </div>
            <div className="flex items-end gap-2 text-sm">
              <span className="font-bold text-slate-400 whitespace-nowrap">เลขที่:</span>
              <div className="flex-1 border-b border-slate-900 min-h-[24px]"></div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-12">
          {content.items.map((item: any, idx: number) => (
            <div key={idx} className="break-inside-avoid">
              <div className="flex gap-4 mb-4">
                <span className="font-black text-2xl text-slate-900">{idx + 1}.</span>
                <p className="text-xl font-bold leading-relaxed text-slate-800">{item.question}</p>
              </div>

              {item.options ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 ml-10">
                  {item.options.map((opt: string, oIdx: number) => (
                    <div key={oIdx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <span className="text-lg">{opt}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-10 mt-6 h-20 border-b border-dashed border-slate-300"></div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-slate-100 flex justify-between items-center opacity-40 text-[10px] font-bold">
          <div>ตัวชี้วัด: {exercise.indicators}</div>
          <div>สร้างผ่านระบบ EduGen AI</div>
        </footer>
      </div>

      {/* Answer Key Section - Only on separate page for teacher */}
      <div className="page-break-before mt-12 bg-white p-16 rounded-[40px] shadow-sm border border-slate-50 print:shadow-none print:border-none print:p-0 print:rounded-none mx-auto max-w-[800px]">
        <h2 className="text-2xl font-black mb-8 pb-4 border-b-2 border-emerald-500 text-emerald-700">เฉลยแบบฝึกหัด (สำหรับคุณครู)</h2>
        <div className="space-y-6">
          {content.items.map((item: any, idx: number) => (
            <div key={idx} className="flex items-start gap-4">
              <span className="font-bold text-slate-400 w-6 shrink-0">{idx + 1}.</span>
              <div>
                <p className="font-bold text-emerald-700">{item.answer}</p>
                {item.explanation && <p className="text-sm text-slate-500 italic mt-1">{item.explanation}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
