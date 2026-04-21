import { useState, useEffect } from 'react';
import { Printer, ChevronLeft } from 'lucide-react';
import { Exercise, User } from '../types';

export default function PrintView({ user, exerciseId, onNavigate }: { user: User, exerciseId: string | null, onNavigate: (page: string) => void }) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = '/server.cjs';
    fetch(`${apiBase}/api/exercises`)
      .then(res => res.json())
      .then(data => {
        const found = data.find((ex: Exercise) => ex.id === Number(exerciseId));
        setExercise(found);
        setLoading(false);
      });
  }, [exerciseId]);

  if (loading) return <div className="text-center py-20">กำลังจัดเตรียมไฟล์...</div>;
  if (!exercise) return <div className="text-center py-20">ไม่พบแบบฝึกหัด</div>;

  const content = JSON.parse(exercise.content);

  return (
    <div className="space-y-8 pb-20">
      {/* UI Controls - Hidden on Print */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm no-print">
        <button onClick={() => onNavigate('history')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
          <ChevronLeft size={20} />
          <span>ย้อนกลับคลังแบบฝึกหัด</span>
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Printer size={18} />
          <span>สั่งพิมพ์ไฟล์ (A4)</span>
        </button>
      </div>

      {/* The Printable Document */}
      <div 
        id="printable-area" 
        className="print-container bg-white text-black font-['Sarabun'] mx-auto"
      >
        <div className="printable-content p-12 min-h-[297mm] flex flex-col">
          {/* Header Section */}
          <header className="border-b-2 border-slate-900 pb-4 mb-8">
            <div className="flex justify-between items-center text-[13px] font-bold whitespace-nowrap overflow-hidden">
              <span className="shrink-0">ชื่อ-นามสกุล: ................................................................................................</span>
              <span className="shrink-0">เลขที่: .................</span>
              <span className="shrink-0">ชั้นประถมศึกษาปีที่: ................. / .................</span>
            </div>
          </header>

          {/* Instructions */}
          <div className="mb-8 border-b border-black pb-4 text-center">
            <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter">{exercise.title}</h1>
            <div className="bg-slate-50 p-4 border-l-4 border-black text-sm italic text-left">
              <span className="font-bold not-italic mr-2">คำชี้แจง:</span>
              {content.description}
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 space-y-10">
            {content.sections ? (
              content.sections.map((sec: any, sIdx: number) => (
                <div key={sIdx} className="mb-12">
                  <h3 className="text-xl font-bold text-center border-b border-black pb-2 mb-6">ตอนที่ {sIdx + 1}: {sec.title}</h3>
                  <div className="space-y-8">
                    {sec.items.map((item: any, idx: number) => (
                      <div key={idx} className="break-inside-avoid">
                        <div className="flex gap-4 mb-4">
                          <span className="font-bold text-lg">{idx + 1}.</span>
                          <p className="text-lg font-bold leading-relaxed">{item.question}</p>
                        </div>
                        {item.options ? (
                          <div className="grid grid-cols-2 gap-x-12 gap-y-4 ml-10">
                            {item.options.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center font-bold text-xs shrink-0">
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <span className="text-base italic">{opt}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="ml-10 border-b border-dotted border-slate-300 h-10 w-full mb-4"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              content.items.map((item: any, idx: number) => (
                <div key={idx} className="break-inside-avoid">
                  <div className="flex gap-4 mb-4">
                    <span className="font-bold text-lg">{idx + 1}.</span>
                    <p className="text-lg font-bold leading-relaxed">{item.question}</p>
                  </div>
                  {item.options ? (
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 ml-10">
                      {item.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center font-bold text-xs shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span className="text-base italic">{opt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ml-10 border-b border-dotted border-slate-300 h-10 w-full mb-4"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-black flex justify-between items-center text-[12px] font-bold">
            <div className="flex gap-4">
              <span>รายวิชา: {exercise.course}</span>
              <span>สร้างโดย: {user.name} {user.surname}</span>
              <span>ตำแหน่ง: {user.position || user.school || 'ครูผู้สอน'}</span>
            </div>
            <span className="text-[9px] text-slate-400 italic uppercase">EduGen AI System</span>
          </footer>
        </div>

        <style>{`
          @media screen {
            .print-container {
              width: 210mm;
              height: fit-content;
              box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
              margin-bottom: 50px;
            }
          }
          @media print {
            #printable-area { 
              display: block !important; 
              width: 210mm !important; 
              min-height: 297mm !important;
              margin: 0 !important; 
              padding: 0 !important;
              box-shadow: none !important;
              transform: none !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              visibility: visible !important;
              background: white !important;
              z-index: 9999 !important;
            }
            #printable-area * { visibility: visible !important; }
            @page { size: A4; margin: 0; }
          }
        `}</style>
      </div>

      {/* Answer Key - Not for Student */}
      <div className="bg-white p-12 rounded-3xl border border-slate-200 no-print max-w-[800px] mx-auto opacity-50 hover:opacity-100 transition-opacity">
        <h2 className="text-xl font-black mb-6 text-indigo-600 uppercase tracking-widest">เฉลยแบบฝึกหัด (เฉพาะครู)</h2>
        <div className="grid grid-cols-2 gap-4">
          {(content.sections ? content.sections.flatMap((s: any) => s.items) : content.items).map((item: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <span className="font-bold text-slate-400">{idx + 1}.</span>
              <span className="font-bold">{item.answer}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
