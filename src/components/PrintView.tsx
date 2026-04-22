import { useState, useEffect } from 'react';
import { Printer, ChevronLeft, Settings, Save, Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
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
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [zoom, setZoom] = useState(0.7);

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
        if (content.itemsPerPage) {
          setItemsPerPage(content.itemsPerPage);
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
    const updatedContent = { ...content, fontSettings, itemsPerPage };
    
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
        alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
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
  const allItems = contentData.sections 
    ? contentData.sections.flatMap((s: any) => s.items) 
    : contentData.items;

  const printArea = () => {
    const f = fontSettings;

    // Split items into chunks for each page
    const chunks = [];
    for (let i = 0; i < allItems.length; i += itemsPerPage) {
      chunks.push(allItems.slice(i, i + itemsPerPage));
    }
    
    return (
      <div 
        id="printable-area" 
        className="flex flex-col items-center gap-10 no-print-bg transition-transform duration-300"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
      >
        {chunks.map((chunk, pageIdx) => (
          <div 
            key={pageIdx}
            className="a4-sheet bg-white text-black font-sarabun relative flex flex-col shadow-2xl overflow-hidden text-left"
            style={{ width: '210mm', height: '297mm', minHeight: '297mm' }}
          >
            {/* Page Header (Every page) */}
            <div className="h-[25mm] w-full flex flex-col justify-end px-[15mm]">
              <div className="flex justify-between items-end pb-1 pr-1">
                <div className="text-[14px] font-extrabold truncate uppercase pr-4">
                  ใบงาน/แบบฝึกหัด: {exercise.title}
                </div>
                <div className="text-[11px] font-bold shrink-0 text-slate-500">แผ่นที่ {pageIdx + 1} / {chunks.length}</div>
              </div>
              <div className="border-t-[3px] border-black mb-2"></div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-[15mm] py-4 flex flex-col overflow-hidden">
              {/* Student Info Box (Only on Page 1) */}
              {pageIdx === 0 && (
                <div className="border-b-2 border-black pb-4 mb-8 text-[13px] font-bold flex items-center gap-6">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="shrink-0">ชื่อ-นามสกุล:</span>
                    <div className="border-b border-dotted border-black flex-1 h-4"></div>
                  </div>
                  <div className="flex items-center gap-2 w-[80px] shrink-0">
                    <span className="shrink-0">เลขที่:</span>
                    <div className="border-b border-dotted border-black flex-1 h-4 text-center"></div>
                  </div>
                  <div className="flex items-center gap-2 w-[110px] shrink-0">
                    <span className="shrink-0">ชั้น:</span>
                    <div className="border-b border-dotted border-black w-10 h-4 text-center"></div>
                    <span className="shrink-0">/</span>
                    <div className="border-b border-dotted border-black w-10 h-4 text-center"></div>
                  </div>
                </div>
              )}

              {/* Main Content Title (Only on Page 1) */}
              {pageIdx === 0 && (
                <div className="mb-6 text-center">
                  <h1 className="font-extrabold mb-1 uppercase tracking-tighter" style={{ fontSize: `${f.title}pt` }}>{exercise.title}</h1>
                  <p className="text-slate-600 font-bold italic mb-4" style={{ fontSize: `${f.indicators}pt` }}>
                    มาตรฐาน/ตัวชี้วัด: {contentData.indicators || exercise.indicators}
                  </p>
                  <div className="bg-slate-50 p-4 border-l-8 border-black italic text-left leading-relaxed shadow-sm" style={{ fontSize: `${f.description}pt` }}>
                    <span className="font-extrabold not-italic mr-2">คำชี้แจง:</span>
                    {contentData.description}
                  </div>
                  <div className="mt-6 border-t-2 border-black w-full"></div>
                </div>
              )}

              {/* Questions List for this chunk */}
              <div className="space-y-6 flex-1">
                {chunk.map((item: any, idx: number) => {
                  const globalIdx = (pageIdx * itemsPerPage) + idx + 1;
                  return (
                    <div key={idx} className="break-inside-avoid">
                      <div className="flex gap-4 mb-4" style={{ fontSize: `${f.question}pt` }}>
                        <span className="font-bold shrink-0">{globalIdx}.</span>
                        <div className="font-bold leading-relaxed">{item.question}</div>
                      </div>
                      {item.options ? (
                        <div className="grid grid-cols-2 gap-x-12 gap-y-3 ml-10 text-slate-800">
                          {item.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="flex items-start gap-4 italic" style={{ fontSize: `${f.option}pt` }}>
                              <div className="rounded-full border-2 border-black flex items-center justify-center font-bold shrink-0 mt-1" style={{ width: `${f.option * 1.6}px`, height: `${f.option * 1.6}px`, fontSize: `${f.option * 0.7}pt` }}>
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                              <span className="leading-tight">{opt}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="ml-10 space-y-4 pr-6">
                          <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                          {(contentData.type === 'essay' || contentData.type === 'math_steps') && (
                            <>
                              <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                              <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Page Footer (Every page) */}
            <div className="h-[20mm] w-full flex flex-col justify-center px-[15mm]">
              <div className="border-t-2 border-black pt-3 flex justify-between items-center text-[11px] font-bold">
                <div className="flex flex-wrap items-center gap-x-6 uppercase">
                  <span>วิชา: {exercise.course}</span>
                  <span>ผู้สอน: คร.{user.name} {user.surname}</span>
                  <span>{user.position || user.school || 'ครูผู้สอน'}</span>
                </div>
                <span className="text-[9px] text-slate-400 italic">EduGen AI System</span>
              </div>
            </div>
          </div>
        ))}

        <style>{`
          @media screen {
            .a4-sheet {
              margin: 0 auto;
            }
          }
          @media print {
            @page { size: A4; margin: 0; }
            body { 
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            .no-print { display: none !important; }
            .a4-sheet {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              page-break-after: always !important;
              break-after: page !important;
            }
            #printable-area { gap: 0 !important; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto px-4">
      {/* UI Controls - Hidden on Print */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm no-print sticky top-4 z-[50]">
        <button onClick={() => onNavigate('history')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
          <ChevronLeft size={20} />
          <span>ย้อนกลับคลังแบบฝึกหัด</span>
        </button>

        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
            <button 
              onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
              title="ซูมออก"
            >
              <ZoomOut size={16} />
            </button>
            <div className="px-3 text-[11px] font-black text-slate-600 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            <button 
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
              title="ซูมเข้า"
            >
              <ZoomIn size={16} />
            </button>
            <button 
              onClick={() => setZoom(0.7)}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
              title="รีเซ็ต"
            >
              <Maximize size={16} />
            </button>
          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-6 py-3 bg-white text-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all border border-slate-200 disabled:opacity-50 shadow-sm"
          >
            {savingSettings ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <Save size={18} className="text-slate-400" />}
            <span>บันทึกตั้งค่า</span>
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

      <div className="flex flex-col lg:flex-row gap-8 items-start h-[calc(100vh-140px)]">
        {/* Left Sidebar: Font Settings (No individual scrollbar) */}
        <div className="w-full lg:w-[320px] no-print space-y-6 flex-shrink-0">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Settings size={24} className="text-indigo-500" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">จูนรูปเล่มเอกสาร</h3>
            <p className="text-[11px] text-slate-400 mb-8 leading-relaxed">
              คุณครูสามารถปรับจำนวนข้อต่อแผ่นและขนาดอักษร เพื่อให้แบบฝึกหัดออกมาสวยงามที่สุดครับ
            </p>
            
            <div className="space-y-8">
              {/* Pagination Control */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">จำนวนข้อต่อแผ่น</label>
                  <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{itemsPerPage} ข้อ</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button onClick={() => setItemsPerPage(Math.max(1, itemsPerPage - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 font-bold active:scale-95 text-slate-600">-</button>
                  <input 
                    type="range" min="1" max="15" value={itemsPerPage} onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <button onClick={() => setItemsPerPage(Math.min(20, itemsPerPage + 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 font-bold active:scale-95 text-slate-600">+</button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-6">
                <FontSizeInput label="ส่วนหัวข้อ" value={fontSettings.title} onChange={(v) => setFontSettings({...fontSettings, title: v})} />
                <FontSizeInput label="มาตรฐาน/ตัวชี้วัด" value={fontSettings.indicators} onChange={(v) => setFontSettings({...fontSettings, indicators: v})} />
                <FontSizeInput label="คำชี้แจง" value={fontSettings.description} onChange={(v) => setFontSettings({...fontSettings, description: v})} />
                <FontSizeInput label="โจทย์คำถาม" value={fontSettings.question} onChange={(v) => setFontSettings({...fontSettings, question: v})} />
                <FontSizeInput label="ตัวเลือก" value={fontSettings.option} onChange={(v) => setFontSettings({...fontSettings, option: v})} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: Scrollable Preview (Primary scrollbar) */}
        <div className="flex-1 w-full bg-white/50 rounded-3xl border border-slate-200 h-full overflow-y-auto p-12 no-print print:p-0 print:bg-transparent print:border-none print:overflow-visible">
          <div className="min-w-fit flex flex-col items-center">
            {printArea()}

            {/* Answer Key Section (Now moved inside scrollable area to prevent overlap) */}
            <div className="bg-white p-12 rounded-3xl border border-slate-200 no-print w-full max-w-[900px] mt-20 mb-12 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">?</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">เฉลยแบบฝึกหัด</h2>
                  <p className="text-xs text-slate-400 font-medium">เฉพาะสำหรับคุณครู</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allItems.map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">คำตอบ</span>
                      <span className="text-base font-black text-indigo-700">{item.answer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
