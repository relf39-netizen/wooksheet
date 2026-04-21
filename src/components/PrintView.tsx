import { useState, useEffect } from 'react';
import { Printer, ChevronLeft, Download, CheckCircle2 } from 'lucide-react';
import { Exercise } from '../types';

export default function PrintView({ exerciseId, onNavigate }: { exerciseId: string | null, onNavigate: (page: string) => void }) {
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
    <div className="space-y-8 print:space-y-0 print:m-0">
      {/* UI Controls - Hidden on Print */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <button onClick={() => onNavigate('history')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
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
        <header className="border-b-2 border-slate-900 pb-4 mb-8">
          <div className="flex justify-between items-center text-[13px] font-bold whitespace-nowrap overflow-hidden">
            <span className="shrink-0">ชื่อ-นามสกุล: ................................................................................................</span>
            <span className="shrink-0">เลขที่: .................</span>
            <span className="shrink-0">ชั้นประถมศึกษาปีที่: ................. / .................</span>
          </div>
        </header>

        {/* Instructions */}
        <div className="mb-8 border-b border-black pb-4">
          <h1 className="text-2xl font-black text-center mb-4">{exercise.title}</h1>
          <div className="bg-slate-50 p-4 border-l-4 border-black text-sm italic">
            <span className="font-bold not-italic mr-2">คำชี้แจง:</span>
            {content.description}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-12">
          {content.sections ? (
            content.sections.map((sec: any, sIdx: number) => (
              <div key={sIdx} className="mb-12">
                <h3 className="text-xl font-bold text-center border-b border-black pb-2 mb-4">ตอนที่ {sIdx + 1}: {sec.title}</h3>
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
            <span>ระดับชั้น: {exercise.grade}</span>
          </div>
          <span className="text-[9px] text-slate-400 italic uppercase">EduGen AI System</span>
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
