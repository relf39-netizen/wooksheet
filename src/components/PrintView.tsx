import { useState, useEffect } from 'react';
import { Printer, ChevronLeft, Settings, Save, Loader2 } from 'lucide-react';
import { Exercise, User } from '../types';

export default function PrintView({ user, exerciseId, onNavigate }: { user: User, exerciseId: string | null, onNavigate: (page: string) => void }) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [fontSettings, setFontSettings] = useState({
    title: 18,
    indicators: 12,
    description: 14,
    question: 16,
    option: 16
  });

  useEffect(() => {
    const apiBase = '/server.cjs';
    fetch(`${apiBase}/api/exercises/${exerciseId}?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setExercise(data);
        const content = JSON.parse(data.content);
        if (content.fontSettings) {
          setFontSettings(content.fontSettings);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [exerciseId]);

  const handleSaveSettings = async () => {
    if (!exercise) return;
    setSavingSettings(true);
    const content = JSON.parse(exercise.content);
    const updatedContent = { ...content, fontSettings };
    
    const apiBase = '/server.cjs';
    try {
      const res = await fetch(`${apiBase}/api/exercises/${exercise.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: exercise.title,
          course: exercise.course,
          grade: exercise.grade,
          indicators: exercise.indicators,
          content: updatedContent
        })
      });
      if (res.ok) {
        setExercise({ ...exercise, content: JSON.stringify(updatedContent) });
        alert('บันทึกการตั้งค่าอักษรเรียบร้อยแล้ว');
      }
    } catch (err) {
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) return <div className="text-center py-20">กำลังจัดเตรียมไฟล์...</div>;
  if (!exercise) return <div className="text-center py-20">ไม่พบแบบฝึกหัด</div>;

  const contentData = JSON.parse(exercise.content);

  const printArea = () => {
    const f = fontSettings;
    
    return (
      <div id="printable-area" className="print-doc-container bg-white text-black font-sarabun mx-auto relative shadow-2xl">
        {/*
          THEAD/TFOOT logic is the most reliable way to handle repeating headers and footers 
          on multiple pages in modern browsers (especially Chrome/Edge).
        */}
        <table className="w-full border-collapse print-table">
          <thead className="table-header-group">
            <tr>
              <td className="p-0 border-none">
                {/* Header that repeats on every page */}
                <div className="repeating-header-box h-[25mm] w-full bg-white flex flex-col justify-end px-12 pb-4">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <div className="text-[14px] font-extrabold uppercase">
                      ใบงาน/แบบฝึกหัด: {exercise.title}
                    </div>
                    <div className="text-[12px] font-bold page-counter-indicator"></div>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          
          <tbody className="table-row-group">
            <tr>
              <td className="p-0 border-none">
                <div className="printable-content px-12 pt-6 pb-12 flex flex-col min-h-[200mm]">
                  {/* Name section: Only on the first page as it is inside tbody */}
                  <div className="border-b-2 border-black pb-4 mb-8 text-[13px] font-bold flex items-center gap-6 bg-white first-page-header-box">
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

                  <div className="printable-body text-[16pt] leading-normal flex-1">
                    {/* Header/Topic Info (Optional: only on page 1) */}
                    <div className="mb-8 border-b border-black pb-4 text-center first-page-topic">
                      <h1 className="font-black mb-1 uppercase tracking-tighter" style={{ fontSize: `${f.title}pt` }}>{exercise.title}</h1>
                      {(contentData.indicators || exercise.indicators) && (
                        <p className="text-slate-500 font-bold italic mb-4" style={{ fontSize: `${f.indicators}pt` }}>
                          มาตรฐาน/ตัวชี้วัด: {contentData.indicators || exercise.indicators}
                        </p>
                      )}
                      <div className="bg-slate-50 p-4 border-l-4 border-black italic text-left leading-relaxed shadow-sm" style={{ fontSize: `${f.description}pt` }}>
                        <span className="font-bold not-italic mr-2">คำชี้แจง:</span>
                        {contentData.description}
                      </div>
                    </div>

                    {/* Exercise Items */}
                    {contentData.sections ? (
                      contentData.sections.map((sec: any, sIdx: number) => {
                        const startIdx = contentData.sections.slice(0, sIdx).reduce((acc: number, curr: any) => acc + curr.items.length, 0) + 1;
                        return (
                          <div key={sIdx} className="mb-12 last:mb-0">
                            <h3 className="font-bold text-center border-b border-black pb-2 mb-6" style={{ fontSize: `${f.title}pt` }}>ตอนที่ {sIdx + 1}: {sec.title}</h3>
                            <div className="space-y-8">
                              {sec.items.map((item: any, idx: number) => (
                                <div key={idx} className="break-inside-avoid">
                                  <div className="flex gap-4 mb-4" style={{ fontSize: `${f.question}pt` }}>
                                    <span className="font-bold shrink-0">{startIdx + idx}.</span>
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
                                    <div className="ml-10 space-y-4">
                                      <div className="border-b border-dotted border-slate-300 h-10 w-full"></div>
                                      {(sec.type === 'essay' || sec.type === 'math_steps') && (
                                        <>
                                          <div className="border-b border-dotted border-slate-300 h-10 w-full"></div>
                                          <div className="border-b border-dotted border-slate-300 h-10 w-full"></div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="space-y-8">
                        {contentData.items.map((item: any, idx: number) => (
                          <div key={idx} className="break-inside-avoid">
                            <div className="flex gap-4 mb-4" style={{ fontSize: `${f.question}pt` }}>
                              <span className="font-bold shrink-0">{idx + 1}.</span>
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
                              <div className="ml-10 space-y-4">
                                <div className="border-b border-dotted border-slate-300 h-10 w-full"></div>
                                {(contentData.type === 'essay' || contentData.type === 'math_steps') && (
                                  <>
                                    <div className="border-b border-dotted border-slate-300 h-10 w-full"></div>
                                    <div className="border-b border-dotted border-slate-300 h-10 w-full"></div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          <tfoot className="table-footer-group">
            <tr>
              <td className="p-0 border-none">
                {/* Footer that repeats on every page */}
                <div className="repeating-footer-box h-[20mm] w-full bg-white flex flex-col justify-center px-12">
                  <div className="border-t border-black pt-3 flex justify-between items-center text-[11px] font-bold">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 uppercase">
                      <span>วิชา: {exercise.course}</span>
                      <span>ผู้สอน: {user.name} {user.surname}</span>
                      <span>{user.position || user.school || 'ครูผู้สอน'}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 italic font-normal">Generated by EduGen AI System</span>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>

        <style>{`
          /* VIRTUAL A4 PREVIEW (Screen only) */
          @media screen {
            .print-doc-container {
              width: 210mm;
              margin: 0 auto;
              background-color: white;
              position: relative;
              /* Simulate A4 page guide lines in preview */
              background-image: linear-gradient(to bottom, transparent 296mm, #eee 296mm, #eee 297mm, transparent 297mm);
              background-size: 100% 297mm;
            }
            .repeating-header-box, .repeating-footer-box {
              background-color: #fcfcfc !important; /* Slightly distinct in preview */
              border-left: 4px solid #6366f1;
            }
          }

          /* PRINT MODE */
          @media print {
            @page {
              size: A4;
              margin: 0;
            }

            body { 
              background: white !important; 
              counter-reset: page;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-doc-container {
              width: 210mm !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              box-shadow: none !important;
              display: block !important;
              position: static !important;
              background-image: none !important;
            }

            .no-print { display: none !important; }

            .print-table {
              width: 100%;
              border-spacing: 0;
              border-collapse: collapse;
              table-layout: fixed;
            }

            .table-header-group {
              display: table-header-group !important;
            }

            .table-footer-group {
              display: table-footer-group !important;
            }

            .page-counter-indicator::after {
              content: "หน้า " counter(page);
            }

            .break-inside-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            thead td, tfoot td {
              background-color: white !important;
            }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20 max-w-[1240px] mx-auto px-4">
      {/* UI Controls - Hidden on Print */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm no-print sticky top-4 z-[50]">
        <button onClick={() => onNavigate('history')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
          <ChevronLeft size={20} />
          <span>ย้อนกลับคลังแบบฝึกหัด</span>
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-6 py-3 bg-white text-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all border border-slate-200 disabled:opacity-50 shadow-sm"
          >
            {savingSettings ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <Save size={18} className="text-slate-400" />}
            <span>บันทึกการตั้งค่าอักษร</span>
          </button>
          
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Printer size={18} />
            <span>สั่งพิมพ์ (A4)</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar: Font Settings */}
        <div className="w-full lg:w-[350px] no-print space-y-6 sticky top-24">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Settings size={24} className="text-indigo-500" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">จูนขนาดอักษร (Sarabun)</h3>
            <p className="text-[11px] text-slate-400 mb-8 leading-relaxed">
              คุณครูสามารถปรับขนาดอักษรเพื่อจัดให้เนื้อหาพอดีกับหน้ากระดาษ A4 (สังเกตขีดสีเทาในพรีวิวคือจุดตัดหน้าครับ)
            </p>
            <div className="space-y-6">
              <FontSizeInput label="ส่วนหัวข้อ/ชื่อแบบฝึก" value={fontSettings.title} onChange={(v) => setFontSettings({...fontSettings, title: v})} />
              <FontSizeInput label="ส่วนมาตรฐาน/ตัวชี้วัด" value={fontSettings.indicators} onChange={(v) => setFontSettings({...fontSettings, indicators: v})} />
              <FontSizeInput label="ส่วนคำชี้แจง/คำสั่ง" value={fontSettings.description} onChange={(v) => setFontSettings({...fontSettings, description: v})} />
              <FontSizeInput label="ส่วนโจทย์คำถาม" value={fontSettings.question} onChange={(v) => setFontSettings({...fontSettings, question: v})} />
              <FontSizeInput label="ส่วนตัวเลือกตอบ" value={fontSettings.option} onChange={(v) => setFontSettings({...fontSettings, option: v})} />
            </div>
          </div>
        </div>

        {/* Right Content: The Printable Document */}
        <div className="flex-1 w-full overflow-x-auto pb-8 print:p-0">
          {printArea()}
        </div>
      </div>

      {/* Answer Key Section */}
      <div className="bg-white p-12 rounded-3xl border border-slate-200 no-print max-w-[900px] mx-auto mb-12 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">?</div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">เฉลยแบบฝึกหัด</h2>
            <p className="text-xs text-slate-400 font-medium">เฉพาะสำหรับคุณครูเพื่อใช้ตรวจงาน</p>
          </div>
        </div>
        <div className="space-y-6">
          {(contentData.sections 
            ? contentData.sections.flatMap((s: any) => s.items) 
            : contentData.items).map((item: any, idx: number) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">คำตอบ:</span>
                    <span className="text-lg font-black text-indigo-700">{item.answer}</span>
                  </div>
                  {item.explanation && (
                    <div className="text-sm bg-white p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed shadow-sm italic relative">
                      <div className="absolute -left-1 top-0 bottom-0 w-1 bg-indigo-500 rounded-full"></div>
                      <span className="font-bold text-indigo-600 not-italic block mb-1 text-[10px] uppercase tracking-wider">คำอธิบาย:</span>
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

function FontSizeInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</label>
        <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{value}pt</span>
      </div>
      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
        <button 
          onClick={() => onChange(Math.max(8, value - 0.5))} 
          className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all font-bold text-slate-600 active:scale-95"
        >
          -
        </button>
        <input 
          type="range" 
          min="8" 
          max="32" 
          step="0.5"
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))} 
          className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <button 
          onClick={() => onChange(Math.min(48, value + 0.5))} 
          className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all font-bold text-slate-600 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}
