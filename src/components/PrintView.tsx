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

  const handlePrintNewWindow = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = document.getElementById('unified-print-area')?.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>EduGen AI - ${exercise.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Sarabun', sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            .page {
              width: 210mm;
              height: 297mm;
              display: block;
              position: relative;
              overflow: hidden;
              background: white;
              box-sizing: border-box;
              page-break-after: always;
            }

            .header { height: 30mm; width: 100%; border-bottom: 3px solid black; padding: 12mm 20mm 2mm 20mm; display: block; box-sizing: border-box; }
            .header-row { display: block; width: 100%; }
            .header-left { float: left; font-weight: 800; font-size: 15pt; }
            .header-right { float: right; font-weight: 800; font-size: 12pt; color: #666; }
            .clear { clear: both; }

            .content { height: 242mm; width: 100%; padding: 5mm 20mm; display: block; box-sizing: border-box; overflow: hidden; }
            .student { border-bottom: 2px solid black; padding-bottom: 4mm; margin-bottom: 8mm; font-size: 15pt; font-weight: 800; display: block; overflow: hidden; }
            .title-area { text-align: center; margin-bottom: 6mm; display: block; }
            .desc-box { border-left: 8px solid black; background: #f9f9f9; padding: 12pt; margin-bottom: 10mm; line-height: 1.6; display: block; }

            .q-block { margin-bottom: 10mm; display: block; page-break-inside: avoid; }
            .q-title { font-weight: 800; line-height: 1.5; display: block; }
            .options-container { margin-left: 10mm; margin-top: 4mm; display: block; overflow: hidden; }
            .option-item { width: 48%; float: left; vertical-align: top; margin-bottom: 4mm; line-height: 1.4; }

            .footer { height: 25mm; width: 100%; border-top: 2px solid black; padding: 4mm 20mm; display: block; box-sizing: border-box; position: absolute; bottom: 0; left: 0; }
            .footer-left { float: left; font-size: 12pt; font-weight: 800; }
            .footer-right { float: right; font-size: 10pt; opacity: 0.6; }

            * { box-sizing: border-box; }
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
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  if (loading) return <div className="text-center py-20">กำลังจัดเตรียมไฟล์...</div>;
  if (!exercise) return <div className="text-center py-20">ไม่พบแบบฝึกหัด</div>;

  const contentData = JSON.parse(exercise.content);
  const allItems = contentData.sections 
    ? contentData.sections.flatMap((s: any) => s.items) 
    : contentData.items;

  const chunks = [];
  for (let i = 0; i < allItems.length; i += itemsPerPage) {
    chunks.push(allItems.slice(i, i + itemsPerPage));
  }

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
            onClick={handlePrintNewWindow}
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

        {/* Right Preview Zone - Physical Block Logic Area */}
        <div className="flex-1 w-full bg-white/50 rounded-3xl border border-slate-200 h-full overflow-y-auto p-12 no-print">
          <div className="min-w-fit flex justify-center">
            <div 
              id="unified-print-area" 
              className="flex flex-col items-center gap-10"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              {chunks.map((chunk, pageIdx) => (
                <div 
                  key={pageIdx}
                  className="page shadow-2xl"
                  style={{ width: '210mm', height: '297mm', background: 'white', display: 'block', position: 'relative', overflow: 'hidden', marginBottom: '30px', border: '1px solid #eee' }}
                >
                  {/* HEADER 30mm */}
                  <div className="header">
                    <div className="header-row">
                      <div className="header-left">แบบฝึกหัด: {exercise.title}</div>
                      <div className="header-right">หน้า {pageIdx + 1}/{chunks.length}</div>
                      <div className="clear"></div>
                    </div>
                  </div>

                  {/* CONTENT 242mm */}
                  <div className="content">
                    {pageIdx === 0 && (
                      <>
                        <div className="student">
                          <div style={{ float: 'left', width: '60%' }}>ชื่อ-นามสกุล: ..................................................................................</div>
                          <div style={{ float: 'left', width: '15%' }}>เลขที่: .......</div>
                          <div style={{ float: 'right', width: '25%', textAlign: 'right' }}>ชั้น: ......... / .........</div>
                          <div className="clear"></div>
                        </div>

                        <div className="title-area">
                          <h1 style={{ fontSize: `${fontSettings.title + 2}pt`, fontWeight: '800', marginBottom: '4px' }}>{exercise.title}</h1>
                          <p style={{ fontSize: `${fontSettings.indicators + 2}pt`, fontWeight: 'bold', color: '#333' }}>
                            มฐ./ตัวชี้วัด: {contentData.indicators || exercise.indicators}
                          </p>
                        </div>

                        <div className="desc-box" style={{ fontSize: `${fontSettings.description + 1.5}pt` }}>
                          <b style={{ textDecoration: 'underline', marginRight: '10px' }}>คำชี้แจง:</b> {contentData.description}
                        </div>
                      </>
                    )}

                    <div className="questions">
                      {chunk.map((item: any, idx: number) => {
                        const globalIdx = (pageIdx * itemsPerPage) + idx + 1;
                        return (
                          <div key={idx} className="q-block">
                            <div className="q-title" style={{ fontSize: `${fontSettings.question + 1.5}pt` }}>
                              <span style={{ marginRight: '12pt' }}>{globalIdx}.</span>
                              {item.question}
                            </div>
                            {item.options ? (
                              <div className="options-container">
                                {item.options.map((opt: string, oIdx: number) => (
                                  <div key={oIdx} className="option-item" style={{ fontSize: `${fontSettings.option + 1.5}pt` }}>
                                    <div style={{ width: '26px', height: '26px', border: '2.5px solid black', borderRadius: '50%', display: 'inline-block', textAlign: 'center', lineHeight: '21px', fontWeight: '800', fontSize: '11pt', marginRight: '10pt', verticalAlign: 'middle' }}>
                                      {String.fromCharCode(65 + oIdx)}
                                    </div>
                                    <span style={{ verticalAlign: 'middle' }}>{opt}</span>
                                  </div>
                                ))}
                                <div className="clear"></div>
                              </div>
                            ) : (
                              <div className="options-container">
                                <div style={{ borderBottom: '1.5px dotted #000', height: '11mm', width: '96%' }}></div>
                                {(contentData.type === 'essay' || contentData.type === 'math_steps') && (
                                  <>
                                    <div style={{ borderBottom: '1.5px dotted #000', height: '11mm', width: '96%' }}></div>
                                    <div style={{ borderBottom: '1.5px dotted #000', height: '11mm', width: '96%' }}></div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* FOOTER 25mm */}
                  <div className="footer">
                    <div className="footer-left">รายวิชา: {exercise.course} | ผู้สอน: คร.{user.name} {user.surname}</div>
                    <div className="footer-right">EduGen Pro Tool</div>
                    <div className="clear"></div>
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
