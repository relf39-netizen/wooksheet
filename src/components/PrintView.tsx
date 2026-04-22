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
  const [isPrintPreview, setIsPrintPreview] = useState(false);

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

  // Split items into chunks for each page
  const chunks = [];
  for (let i = 0; i < allItems.length; i += itemsPerPage) {
    chunks.push(allItems.slice(i, i + itemsPerPage));
  }

  // --- RENDER LOGIC ---

  // MODE A: Dedicated Print Preview Mode (The "Room" the user requested)
  // We render this as the ONLY content to ensure browsers can print it perfectly.
  if (isPrintPreview) {
    return (
      <div className="min-h-screen bg-slate-900 font-sarabun text-left print-mode-active">
        {/* Top Control Bar */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-900/90 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between no-print">
          <button 
            onClick={() => setIsPrintPreview(false)}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <ChevronLeft size={18} />
            <span>กลับไปแก้ไข</span>
          </button>
          
          <button 
            onClick={() => window.print()}
            className="bg-indigo-500 hover:bg-indigo-400 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all active:scale-95"
          >
            <Printer size={20} />
            <span>กดปุ่มนี้เพื่อพิมพ์จริง</span>
          </button>
        </div>

        {/* The Actual Sheets */}
        <div id="print-content" className="pt-24 pb-32 flex flex-col items-center gap-10 print:p-0 print:m-0 print:block">
          <div className="no-print bg-indigo-500/10 text-indigo-300 px-4 py-2 rounded-full text-[11px] font-bold mb-4 border border-indigo-500/20">
            ตัวอย่างก่อนพิมพ์ขนาด A4 (210mm x 297mm)
          </div>
          
          {chunks.map((chunk, pageIdx) => (
            <div 
              key={pageIdx}
              className="a4-sheet bg-white text-black shadow-2xl print:shadow-none"
              style={{ 
                display: 'block', // Use block instead of flex
                width: '210mm', 
                height: '297mm', 
                padding: '0',
                margin: '0 auto',
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
                backgroundColor: 'white',
                position: 'relative'
              }}
            >
              {/* HEADER BLOCK: Fixed 30mm height */}
              <div style={{ height: '30mm', width: '100%', padding: '0 20mm', display: 'block', boxSizing: 'border-box', paddingTop: '10mm' }}>
                <div style={{ borderBottom: '3px solid black', paddingBottom: '2mm', overflow: 'hidden' }}>
                  <div style={{ float: 'left', fontSize: '12pt', fontWeight: 'bold' }}>แบบฝึกหัด: {exercise.title}</div>
                  <div style={{ float: 'right', fontSize: '10pt', fontWeight: 'bold', color: '#666' }}>หน้า {pageIdx + 1} / {chunks.length}</div>
                  <div style={{ clear: 'both' }}></div>
                </div>
              </div>

              {/* CONTENT BLOCK: Main body with 20mm side padding */}
              <div style={{ padding: '5mm 20mm', height: '242mm', display: 'block', boxSizing: 'border-box', overflow: 'hidden' }}>
                {pageIdx === 0 && (
                  <div style={{ marginBottom: '8mm', display: 'block' }}>
                    {/* Name Entry Box */}
                    <div style={{ borderBottom: '2px solid black', paddingBottom: '4mm', marginBottom: '6mm', fontSize: '13pt', fontWeight: 'bold', display: 'block', overflow: 'hidden' }}>
                      <span style={{ float: 'left', width: '60%' }}>ชื่อ-นามสกุล: .....................................................................................</span>
                      <span style={{ float: 'left', width: '15%' }}>เลขที่: .......</span>
                      <span style={{ float: 'right', width: '25%', textAlign: 'right' }}>ชั้น: ......... / .........</span>
                      <div style={{ clear: 'both' }}></div>
                    </div>
                    {/* Title Section */}
                    <div style={{ textAlign: 'center', display: 'block', marginBottom: '5mm' }}>
                      <h1 style={{ fontSize: `${fontSettings.title}pt`, fontWeight: '800', marginBottom: '1mm', lineHeight: '1.2' }}>{exercise.title}</h1>
                      <p style={{ fontSize: `${fontSettings.indicators}pt`, fontWeight: 'bold', fontStyle: 'italic', color: '#444', marginBottom: '4mm' }}>
                        มาตรฐาน/ตัวชี้วัด: {contentData.indicators || exercise.indicators}
                      </p>
                      <div style={{ backgroundColor: '#f9f9f9', padding: '10pt', borderLeft: '8px solid black', fontStyle: 'italic', textAlign: 'left', lineHeight: '1.5', fontSize: `${fontSettings.description}pt` }}>
                        <span style={{ fontWeight: '800', fontStyle: 'normal', textDecoration: 'underline', marginRight: '5pt' }}>คำชี้แจง:</span>
                        {contentData.description}
                      </div>
                      <div style={{ marginTop: '5mm', borderTop: '2px solid black', opacity: '0.2' }}></div>
                    </div>
                  </div>
                )}

                {/* Question List: Standard Block Flow */}
                <div style={{ display: 'block' }}>
                  {chunk.map((item: any, idx: number) => {
                    const globalIdx = (pageIdx * itemsPerPage) + idx + 1;
                    return (
                      <div key={idx} style={{ marginBottom: '8mm', display: 'block', breakInside: 'avoid' }}>
                        <div style={{ fontSize: `${fontSettings.question}pt`, fontWeight: 'bold', marginBottom: '3mm', lineHeight: '1.4' }}>
                          <span style={{ marginRight: '10pt' }}>{globalIdx}.</span>
                          <span>{item.question}</span>
                        </div>
                        
                        {item.options ? (
                          <div style={{ marginLeft: '10mm', display: 'block' }}>
                            {item.options.map((opt: string, oIdx: number) => (
                              <div 
                                key={oIdx} 
                                style={{ 
                                  width: '48%', 
                                  display: 'inline-block', 
                                  fontSize: `${fontSettings.option}pt`, 
                                  marginBottom: '3mm',
                                  verticalAlign: 'top',
                                  lineHeight: '1.2'
                                }}
                              >
                                <div style={{ 
                                  width: '24px', 
                                  height: '24px', 
                                  border: '2px solid black', 
                                  borderRadius: '50%', 
                                  display: 'inline-block', 
                                  textAlign: 'center', 
                                  lineHeight: '20px', 
                                  fontWeight: 'bold', 
                                  fontSize: '10pt',
                                  marginRight: '8pt'
                                }}>
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <span style={{ display: 'inline-block', width: 'calc(100% - 35px)', verticalAlign: 'top' }}>{opt}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginLeft: '10mm', display: 'block' }}>
                            <div style={{ borderBottom: '1px dotted #333', height: '10mm', width: '95%' }}></div>
                            {(contentData.type === 'essay' || contentData.type === 'math_steps') && (
                              <>
                                <div style={{ borderBottom: '1px dotted #333', height: '10mm', width: '95%' }}></div>
                                <div style={{ borderBottom: '1px dotted #333', height: '10mm', width: '95%' }}></div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FOOTER BLOCK: Fixed 25mm height */}
              <div style={{ height: '25mm', width: '100%', padding: '0 20mm', display: 'block', boxSizing: 'border-box' }}>
                <div style={{ borderTop: '2px solid black', paddingTop: '3mm', fontSize: '10pt', fontWeight: 'bold', overflow: 'hidden' }}>
                  <div style={{ float: 'left' }}>
                    รายวิชา: {exercise.course} | ผู้สอน: คร.{user.name} {user.surname}
                  </div>
                  <div style={{ float: 'right', fontSize: '8pt', opacity: '0.6' }}>EduGen AI Tool</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // MODE B: Standard Editing Mode
  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto px-4 relative font-sarabun text-left">
      {/* 1. UI Controls - Screen Only */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm no-print sticky top-4 z-[100]">
        <button onClick={() => onNavigate('history')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
          <ChevronLeft size={20} />
          <span>ย้อนกลับคลังแบบฝึกหัด</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
            <button onClick={() => setZoom(Math.max(0.3, zoom - 0.1))} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm transition-all"><ZoomOut size={16} /></button>
            <div className="px-3 text-[11px] font-black text-slate-600 min-w-[50px] text-center">{Math.round(zoom * 100)}%</div>
            <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm transition-all"><ZoomIn size={16} /></button>
            <button onClick={() => setZoom(0.7)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm transition-all"><Maximize size={16} /></button>
          </div>

          <button onClick={handleSaveSettings} disabled={savingSettings} className="px-6 py-3 bg-white text-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 border border-slate-200 disabled:opacity-50 shadow-sm transition-all">
            {savingSettings ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <Save size={18} className="text-slate-400" />}
            <span>บันทึกตั้งค่า</span>
          </button>
          
          <button 
            onClick={() => setIsPrintPreview(true)}
            className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
          >
            <Printer size={18} />
            <span>เตรียมพิมพ์ (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Working Area */}
      <div className="flex flex-col lg:flex-row gap-8 items-stretch h-[850px] no-print">
        
        {/* Left Sidebar: Controls (Hidden on Print) */}
        <div className="w-full lg:w-[320px] no-print space-y-6 flex-shrink-0 text-left">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full overflow-y-auto no-scrollbar">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Settings size={24} className="text-indigo-500" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2 text-left">จูนรูปเล่มเอกสาร</h3>
            <p className="text-[11px] text-slate-400 mb-8 leading-relaxed text-left">ปรับแต่งขนาดตัวอักษรและจำนวนข้อต่อแผ่นเพื่อให้ได้รูปแบบที่ต้องการครับ</p>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">จำนวนข้อต่อแผ่น</label>
                  <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{itemsPerPage} ข้อ</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button onClick={() => setItemsPerPage(Math.max(1, itemsPerPage - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 font-bold active:scale-95 text-slate-600">-</button>
                  <input type="range" min="1" max="15" value={itemsPerPage} onChange={(e) => setItemsPerPage(parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
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

        {/* Right Preview Zone (Screen Only) */}
        <div className="flex-1 w-full bg-white/50 rounded-3xl border border-slate-200 h-full overflow-y-auto p-12 no-print">
          <div className="min-w-fit flex justify-center">
            <div 
              id="printable-area-screen" 
              className="flex flex-col items-center gap-10"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              {chunks.map((chunk, pageIdx) => (
                <div 
                  key={pageIdx}
                  className="a4-sheet bg-white text-black font-sarabun relative flex flex-col shadow-2xl overflow-hidden text-left"
                  style={{ width: '210mm', height: '297mm', minHeight: '297mm', boxSizing: 'border-box' }}
                >
                  <div className="h-[30mm] w-full flex flex-col justify-end px-[20mm]">
                    <div className="flex justify-between items-end pb-1 pr-1 font-bold">
                      <div className="text-[14px] truncate uppercase pr-4">แบบฝึกหัด: {exercise.title}</div>
                      <div className="text-[11px] shrink-0 text-slate-500">หน้า {pageIdx + 1} / {chunks.length}</div>
                    </div>
                    <div className="border-t-[3px] border-black mb-4"></div>
                  </div>

                  <div className="flex-1 px-[20mm] py-4 flex flex-col overflow-hidden">
                    {pageIdx === 0 && (
                      <>
                        <div className="border-b-2 border-black pb-4 mb-8 text-[13px] font-bold flex items-center gap-6">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="shrink-0">ชื่อ-นามสกุล:</span>
                            <div className="border-b border-dotted border-black flex-1 h-1 translate-y-2"></div>
                          </div>
                          <div className="flex items-center gap-2 w-[80px] shrink-0">
                            <span className="shrink-0">เลขที่:</span>
                            <div className="border-b border-dotted border-black flex-1 h-1 translate-y-2 text-center"></div>
                          </div>
                          <div className="flex items-center gap-2 w-[110px] shrink-0">
                            <span className="shrink-0">ชั้น:</span>
                            <div className="border-b border-dotted border-black w-8 h-1 translate-y-2 text-center"></div>
                            <span className="shrink-0">/</span>
                            <div className="border-b border-dotted border-black w-8 h-1 translate-y-2 text-center"></div>
                          </div>
                        </div>
                        <div className="mb-6 text-center">
                          <h1 className="font-extrabold mb-1" style={{ fontSize: `${fontSettings.title}pt` }}>{exercise.title}</h1>
                          <p className="text-slate-600 font-bold italic mb-4" style={{ fontSize: `${fontSettings.indicators}pt` }}>
                            มาตรฐาน/ตัวชี้วัด: {contentData.indicators || exercise.indicators}
                          </p>
                          <div className="bg-slate-50 p-4 border-l-8 border-black italic text-left leading-relaxed shadow-sm" style={{ fontSize: `${fontSettings.description}pt` }}>
                            <span className="font-extrabold not-italic mr-2 underline">คำชี้แจง:</span>
                            {contentData.description}
                          </div>
                          <div className="mt-6 border-t-2 border-black w-full opacity-30"></div>
                        </div>
                      </>
                    )}

                    <div className="space-y-6 flex-1">
                      {chunk.map((item: any, idx: number) => {
                        const globalIdx = (pageIdx * itemsPerPage) + idx + 1;
                        return (
                          <div key={idx} className="break-inside-avoid">
                            <div className="flex gap-4 mb-4" style={{ fontSize: `${fontSettings.question}pt` }}>
                              <span className="font-bold shrink-0">{globalIdx}.</span>
                              <div className="font-bold leading-relaxed">{item.question}</div>
                            </div>
                            {item.options ? (
                              <div className="grid grid-cols-2 gap-x-12 gap-y-3 ml-10 text-slate-800 text-left">
                                {item.options.map((opt: string, oIdx: number) => (
                                  <div key={oIdx} className="flex items-start gap-3" style={{ fontSize: `${fontSettings.option}pt` }}>
                                    <div className="rounded-full border-2 border-black flex items-center justify-center font-bold shrink-0 mt-1" style={{ width: '22px', height: '22px', fontSize: '10pt' }}>
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

                  <div className="h-[25mm] w-full flex flex-col justify-center px-[20mm] pb-4">
                    <div className="border-t-2 border-black pt-3 flex justify-between items-center text-[10px] font-bold">
                      <div className="flex flex-wrap items-center gap-x-6">
                        <span className="uppercase">รายวิชา: {exercise.course}</span>
                        <span>ผู้สอน: คร.{user.name} {user.surname}</span>
                        <span className="italic">{user.school || user.position || 'โรงเรียนคุณภาพ'}</span>
                      </div>
                      <span className="text-[8px] text-slate-400 opacity-50">EduGen AI Tool</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Key Section (Bottom) */}
      <div className="bg-white p-12 rounded-3xl border border-slate-200 no-print mt-12 shadow-sm text-left">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">?</div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">เฉลยแบบฝึกหัด</h2>
            <p className="text-xs text-slate-400 font-medium">เฉพาะสำหรับคุณครูใช้ตรวจงาน</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {allItems.map((item: any, idx: number) => (
            <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-indigo-200 hover:bg-white transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 transition-transform">{idx + 1}</div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5 tracking-widest">คำตอบที่ถูกต้อง</span>
                <span className="text-lg font-black text-indigo-700 leading-none">{item.answer}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
        .font-sarabun { font-family: 'Sarabun', sans-serif; }
        
        @media print {
          @page { size: A4; margin: 0 !important; }
          
          /* Hide everything except our print mode container */
          body > #root > div:not(.print-mode-active),
          header, nav, footer, .no-print {
            display: none !important;
          }

          /* Force correct print layout */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            background: white !important;
            overflow: visible !important;
          }

          /* Main Container Control - NO POSITION ABSOLUTE */
          #print-content {
            display: block !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
            visibility: visible !important;
          }

          .a4-sheet {
            display: block !important;
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            position: relative !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
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
      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100 italic">
        <button onClick={() => onChange(Math.max(8, value - 0.5))} className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 hover:text-indigo-600 transition-all font-bold active:scale-90">-</button>
        <input type="range" min="8" max="32" step="0.5" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        <button onClick={() => onChange(Math.min(48, value + 0.5))} className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 hover:text-indigo-600 transition-all font-bold active:scale-90">+</button>
      </div>
    </div>
  );
}
