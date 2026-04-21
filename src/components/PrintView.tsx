import { useState, useEffect } from 'react';
import { Printer, ChevronLeft } from 'lucide-react';
import { Exercise, User } from '../types';

export default function PrintView({ user, exerciseId, onNavigate }: { user: User, exerciseId: string | null, onNavigate: (page: string) => void }) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = '/server.cjs';
    // ใช้ timestamp เพื่อป้องกัน Cache
    fetch(`${apiBase}/api/exercises/${exerciseId}?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setExercise(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [exerciseId]);

  if (loading) return <div className="text-center py-20">กำลังจัดเตรียมไฟล์...</div>;
  if (!exercise) return <div className="text-center py-20">ไม่พบแบบฝึกหัด</div>;

  const content = JSON.parse(exercise.content);
  const f = content.fontSettings || { title: 18, indicators: 12, description: 14, question: 16, option: 16 };

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
        className="print-container bg-white text-black font-sarabun mx-auto"
      >
        <div className="printable-content p-12 min-h-[297mm] flex flex-col leading-normal">
          {/* Header Section */}
          <header className="border-b-2 border-slate-900 pb-4 mb-8">
            <div className="flex items-center text-[13px] font-bold w-full gap-6">
              <div className="flex items-center gap-2 flex-[2]">
                <span className="shrink-0">ชื่อ-นามสกุล:</span>
                <div className="border-b border-dotted border-black flex-1 h-4 min-w-[150px]"></div>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-[100px]">
                <span className="shrink-0">เลขที่:</span>
                <div className="border-b border-dotted border-black flex-1 h-4"></div>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-[130px]">
                <span className="shrink-0">ชั้น:</span>
                <div className="border-b border-dotted border-black flex-1 h-4"></div>
                <span className="shrink-0">/</span>
                <div className="border-b border-dotted border-black flex-1 h-4"></div>
              </div>
            </div>
          </header>

          {/* Instructions */}
          <div className="mb-8 border-b border-black pb-4 text-center">
            <h1 className="font-black mb-1 uppercase tracking-tighter" style={{ fontSize: `${f.title}pt` }}>{exercise.title}</h1>
            {(content.indicators || exercise.indicators) && (
              <p className="text-slate-500 font-bold italic mb-4" style={{ fontSize: `${f.indicators}pt` }}>
                มาตรฐาน/ตัวชี้วัด: {content.indicators || exercise.indicators}
              </p>
            )}
            <div className="bg-slate-50 p-4 border-l-4 border-black italic text-left leading-relaxed shadow-sm" style={{ fontSize: `${f.description}pt` }}>
              <span className="font-bold not-italic mr-2">คำชี้แจง:</span>
              {content.description}
            </div>
          </div>

          {/* Items */}
          <div className="printable-body">
            {content.sections ? (
              content.sections.map((sec: any, sIdx: number) => (
                <div key={sIdx} className="mb-12">
                  <h3 className="font-bold text-center border-b border-black pb-2 mb-6" style={{ fontSize: `${f.title}pt` }}>ตอนที่ {sIdx + 1}: {sec.title}</h3>
                  <div className="space-y-8">
                    {sec.items.map((item: any, idx: number) => (
                      <div key={idx} className="break-inside-avoid">
                        <div className="flex gap-4 mb-4" style={{ fontSize: `${f.question}pt` }}>
                          <span className="font-bold">{idx + 1}.</span>
                          <p className="font-bold leading-relaxed">{item.question}</p>
                        </div>
                        {item.options ? (
                          <div className="grid grid-cols-2 gap-x-12 gap-y-4 ml-10">
                            {item.options.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-3 italic" style={{ fontSize: `${f.option}pt` }}>
                                <div className="rounded-full border border-black flex items-center justify-center font-bold shrink-0" style={{ width: `${f.option * 1.8}px`, height: `${f.option * 1.8}px`, fontSize: `${f.option * 0.75}pt` }}>
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <span>{opt}</span>
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
                  <div className="flex gap-4 mb-4" style={{ fontSize: `${f.question}pt` }}>
                    <span className="font-bold">{idx + 1}.</span>
                    <p className="font-bold leading-relaxed">{item.question}</p>
                  </div>
                  {item.options ? (
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 ml-10">
                      {item.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className="flex items-center gap-3 italic" style={{ fontSize: `${f.option}pt` }}>
                          <div className="rounded-full border border-black flex items-center justify-center font-bold shrink-0" style={{ width: `${f.option * 1.8}px`, height: `${f.option * 1.8}px`, fontSize: `${f.option * 0.75}pt` }}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span>{opt}</span>
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
          <footer className="mt-auto pt-6 border-t border-black flex justify-between items-center text-[11px] font-bold">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="whitespace-nowrap">รายวิชา: {exercise.course}</span>
              <span className="whitespace-nowrap">สร้างโดย: {user.name} {user.surname}</span>
              <span className="whitespace-nowrap">ตำแหน่ง: {user.position || user.school || 'ครูผู้สอน'}</span>
            </div>
            <span className="text-[9px] text-slate-400 italic uppercase tracking-tighter shrink-0 ml-4">Generated by EduGen AI System</span>
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
            .print-container {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .printable-content {
              padding: 15mm !important;
              min-height: 297mm !important;
              width: 100% !important;
              background: white !important;
            }
            .printable-body {
              display: block !important;
              width: 100% !important;
            }
            @page { size: A4; margin: 0; }
          }
        `}</style>
      </div>

      {/* Answer Key - Not for Student */}
      <div className="bg-white p-12 rounded-3xl border border-slate-200 no-print max-w-[900px] mx-auto mb-12">
        <h2 className="text-xl font-black mb-6 text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2 flex justify-between items-end">
          <span>เฉลยแบบฝึกหัด (เฉพาะคุณครู)</span>
          <span className="text-[10px] text-slate-400 normal-case font-bold italic">มีคำอธิบายประกอบเพื่อใช้สื่อสารกับนักเรียน</span>
        </h2>
        <div className="space-y-6">
          {(content.sections 
            ? content.sections.flatMap((s: any) => s.items) 
            : content.items).map((item: any, idx: number) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black uppercase text-slate-400">คำตอบที่ถูกต้อง:</span>
                    <span className="text-lg font-black text-indigo-700">{item.answer}</span>
                  </div>
                  {item.explanation && (
                    <div className="text-sm bg-white p-3 rounded-lg border-l-4 border-indigo-500 text-slate-700 leading-relaxed shadow-sm italic">
                      <span className="font-black text-indigo-600 not-italic block mb-1 text-[10px] uppercase tracking-wider">คำอธิบายสำหรับครู:</span>
                      {item.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
