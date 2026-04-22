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

  const handlePrintNewWindow = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = document.getElementById('print-content')?.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            @page { size: A4; margin: 0; }

            body {
              margin: 0;
              font-family: 'Sarabun', sans-serif;
            }

            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 10mm;
              box-sizing: border-box;
              page-break-after: always;
            }

            .header { border-bottom: 2px solid black; padding-bottom: 4px; margin-bottom: 10px; }
            .header-row { display: flex; justify-content: space-between; font-weight: bold; }
            .student { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; }
            .title { text-align: center; margin-bottom: 10px; }
            .desc { border-left: 4px solid black; padding: 6px; margin-bottom: 10px; }
            .q-block { margin-bottom: 10mm; break-inside: avoid; }
            .q-title { font-weight: bold; }
            .options { display: grid; grid-template-columns: 1fr 1fr; margin-left: 10mm; margin-top: 5px; gap: 5px; }
            .essay div { border-bottom: 1px dotted black; height: 8mm; margin-top: 5px; }
            .footer { border-top: 1px solid black; padding-top: 5px; display: flex; justify-content: space-between; font-size: 10pt; }

            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div id="print-content">
            ${html}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    // Wait a bit for images/fonts if any
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
  // ===== PRINT PREVIEW MODE (FIXED VERSION) =====
if (isPrintPreview) {
  return (
    <div className="print-root font-sarabun">

      {/* ปุ่ม (ไม่พิมพ์) */}
      <div className="no-print fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 flex justify-between z-50">
        <button onClick={() => setIsPrintPreview(false)}>← กลับ</button>
        <button onClick={handlePrintNewWindow}>🖨 พิมพ์</button>
      </div>

      {/* เอกสาร */}
      <div id="print-content">
        {chunks.map((chunk, pageIdx) => (
          <div key={pageIdx} className="page">

            {/* HEADER */}
            <div className="header">
              <div className="header-row">
                <div>แบบฝึกหัด: {exercise.title}</div>
                <div>หน้า {pageIdx + 1}/{chunks.length}</div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="content">

              {pageIdx === 0 && (
                <>
                  <div className="student">
                    <div>ชื่อ-สกุล: ____________________________</div>
                    <div>เลขที่: ____</div>
                    <div>ชั้น: ____/____</div>
                  </div>

                  <div className="title">
                    <h1 style={{ fontSize: `${fontSettings.title}pt` }}>
                      {exercise.title}
                    </h1>
                    <p style={{ fontSize: `${fontSettings.indicators}pt` }}>
                      {contentData.indicators || exercise.indicators}
                    </p>
                  </div>

                  <div className="desc" style={{ fontSize: `${fontSettings.description}pt` }}>
                    <b>คำชี้แจง:</b> {contentData.description}
                  </div>
                </>
              )}

              {/* QUESTIONS */}
              <div className="questions">
                {chunk.map((item: any, idx: number) => {
                  const num = pageIdx * itemsPerPage + idx + 1;
                  return (
                    <div key={idx} className="q-block">

                      <div
                        className="q-title"
                        style={{ fontSize: `${fontSettings.question}pt` }}
                      >
                        {num}. {item.question}
                      </div>

                      {item.options ? (
                        <div className="options">
                          {item.options.map((opt: string, i: number) => (
                            <div
                              key={i}
                              style={{ fontSize: `${fontSettings.option}pt` }}
                            >
                              ○ {String.fromCharCode(65 + i)}. {opt}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="essay">
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FOOTER */}
            <div className="footer">
              <div>วิชา: {exercise.course} | ครู: {user.name}</div>
              <div>EduGen</div>
            </div>

          </div>
        ))}
      </div>

      {/* CSS PRODUCTION */}
      <style>{`
        .print-root {
          background: #eee;
        }

        #print-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 10mm;
          box-sizing: border-box;
          page-break-after: always;
        }

        .header {
          border-bottom: 2px solid black;
          padding-bottom: 4px;
          margin-bottom: 10px;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        }

        .student {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;
        }

        .title {
          text-align: center;
          margin-bottom: 10px;
        }

        .desc {
          border-left: 4px solid black;
          padding: 6px;
          margin-bottom: 10px;
        }

        .questions {
          flex: 1;
        }

        .q-block {
          margin-bottom: 10mm;
          break-inside: avoid;
        }

        .q-title {
          font-weight: bold;
        }

        .options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-left: 10mm;
          margin-top: 5px;
          gap: 5px;
        }

        .essay div {
          border-bottom: 1px dotted black;
          height: 8mm;
          margin-top: 5px;
        }

        .footer {
          border-top: 1px solid black;
          padding-top: 5px;
          display: flex;
          justify-content: space-between;
          font-size: 10pt;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          body {
            margin: 0;
          }

          .no-print {
            display: none !important;
          }

          .print-root {
            background: white;
          }

          #print-content {
            width: 210mm;
            margin: 0 auto;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            page-break-after: always;
          }

          * {
            box-sizing: border-box;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
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
