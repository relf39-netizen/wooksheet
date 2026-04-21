import { useState, useEffect } from 'react';
import { Sparkles, Printer, ChevronLeft, Loader2, Wand2, Type, CheckSquare, Layers, FileText, Settings, Type as FontType } from 'lucide-react';
import { User, ExerciseType } from '../types';
import { GoogleGenAI, Type as GeminiType } from "@google/genai";

const EXERCISE_TYPES = [
  { id: 'multiple_choice', label: 'แบบปรนัย (ตัวเลือก)', icon: <CheckSquare size={18} /> },
  { id: 'subjective', label: 'แบบอัตนัย (เติมคำ)', icon: <Type size={18} /> },
  { id: 'matching', label: 'แบบจับคู่', icon: <Layers size={18} /> },
  { id: 'essay', label: 'แบบเขียนเรียงความ', icon: <FileText size={18} /> },
  { id: 'math_steps', label: 'โจทย์คณิตศาสตร์ (แสดงวิธีทำ)', icon: <Layers size={18} /> },
  { id: 'image_sentence', label: 'แบบแต่งประโยคจากภาพ', icon: <Sparkles size={18} /> },
];

interface FontSettings {
  title: number;
  indicators: number;
  description: number;
  question: number;
  option: number;
}

function ExerciseRender({ result, exerciseType, sectionIdx, fonts }: { result: any, exerciseType: string, sectionIdx?: number, fonts?: FontSettings }) {
  const f = fonts || { title: 18, indicators: 12, description: 14, question: 16, option: 16 };
  
  return (
    <div className="mb-12 last:mb-0">
      <div className="text-center border-b border-black pb-4 mb-6">
        <h3 className="font-bold" style={{ fontSize: `${f.title}pt` }}>
          {sectionIdx && <span>ตอนที่ {sectionIdx}: </span>}
          {result.title}
        </h3>
        {result.indicators && (
          <div className="mt-1 text-slate-500 font-bold uppercase tracking-tight italic" style={{ fontSize: `${f.indicators}pt` }}>
            มาตรฐาน/ตัวชี้วัด: {result.indicators}
          </div>
        )}
      </div>
      
      <div className="mb-6 bg-slate-50 p-4 border-l-4 border-black">
        <p className="font-bold leading-relaxed" style={{ fontSize: `${f.description}pt` }}>{result.description}</p>
      </div>

      <div className="space-y-8">
        {result.items.map((item: any, idx: number) => (
          <div key={idx} className="space-y-4">
            <div className="font-bold leading-relaxed flex gap-3" style={{ fontSize: `${f.question}pt` }}>
              <span className="shrink-0">{idx + 1}.</span>
              <div className="flex-1">
                {exerciseType === 'matching' ? (
                  <div className="grid grid-cols-2 gap-24">
                    <div className="border-b border-black pb-1">{item.question}</div>
                    <div className="border-b border-black pb-1 text-right italic text-slate-300">....................................</div>
                  </div>
                ) : (
                  <span>{item.question}</span>
                )}
              </div>
            </div>
            
            {exerciseType === 'multiple_choice' && item.options && (
              <div className="grid grid-cols-2 gap-x-12 gap-y-3 pl-8">
                {item.options.map((opt: string, oIdx: number) => (
                  <div key={oIdx} className="flex items-center gap-3 italic" style={{ fontSize: `${f.option}pt` }}>
                    <div className="rounded-full border border-black flex items-center justify-center font-bold shrink-0" style={{ width: `${f.option * 1.8}px`, height: `${f.option * 1.8}px`, fontSize: `${f.option * 0.75}pt` }}>
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {exerciseType === 'math_steps' && (
              <div className="pl-8 space-y-5">
                <p className="text-slate-500 font-bold" style={{ fontSize: `${f.description}pt` }}>วิธีทำ:</p>
                <div className="space-y-4">
                  <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                  <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                  <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                  <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                  <div className="flex items-end gap-3 pt-2">
                    <span className="font-black shrink-0" style={{ fontSize: `${f.description}pt` }}>ตอบ:</span>
                    <div className="border-b border-dotted border-slate-400 h-8 flex-1"></div>
                  </div>
                </div>
              </div>
            )}

            {(exerciseType === 'subjective' || exerciseType === 'essay' || exerciseType === 'image_sentence') && (
              <div className="pl-8 space-y-3">
                <div className="border-b border-dotted border-slate-400 h-8"></div>
                {exerciseType === 'essay' && (
                  <>
                    <div className="border-b border-dotted border-slate-400 h-8"></div>
                    <div className="border-b border-dotted border-slate-400 h-8"></div>
                    <div className="border-b border-dotted border-slate-400 h-8"></div>
                    <div className="border-b border-dotted border-slate-400 h-8"></div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const GRADES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3'];

const CORE_SUBJECTS = [
  'ภาษาไทย',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และเทคโนโลยี',
  'สังคมศึกษา ศาสนา และวัฒนธรรม',
  'สุขศึกษาและพลศึกษา',
  'ศิลปะ',
  'การงานอาชีพ',
  'ภาษาต่างประเทศ (ภาษาอังกฤษ)'
];

export default function Generator({ user, onNavigate, exerciseId }: { user: User, onNavigate: (page: string, param?: string) => void, exerciseId?: string | null }) {
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    grade: 'ป.1',
    type: 'multiple_choice' as ExerciseType,
    count: 5,
    topic: ''
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [combinedResults, setCombinedResults] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    title: 18,
    indicators: 12,
    description: 14,
    question: 16,
    option: 16
  });

  useEffect(() => {
    if (exerciseId) {
      const apiBase = '/server.cjs';
      fetch(`${apiBase}/api/exercises`)
        .then(res => res.json())
        .then(data => {
          const found = data.find((ex: any) => ex.id === Number(exerciseId));
          if (found) {
            const content = JSON.parse(found.content);
            if (content.fontSettings) {
              setFontSettings(content.fontSettings);
            }
            if (Array.isArray(content.sections)) {
              setCombinedResults(content.sections);
            } else {
              setResult(content);
            }
            setFormData({
              ...formData,
              title: found.title,
              course: found.course,
              grade: found.grade
            });
            setIsEditing(true);
          }
        });
    }
  }, [exerciseId]);

  const handleGenerate = async () => {
    if (!user.ai_key) {
      alert('กรุณาตั้งค่า API Key ในแดชบอร์ดก่อนใช้งาน');
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: user.ai_key });
      const systemInstruction = `You are a professional educational content creator for Thai ministry of education. Generate exercises in Thai based on the Thai Core Curriculum Standards.`;

      const prompt = `สร้างแบบฝึกหัดเรื่อง: "${formData.topic}" สำหรับวิชา: ${formData.course} ระดับชั้น: ${formData.grade} รูปแบบ: ${formData.type} จำนวน: ${formData.count} ข้อ 
      สำคัญ: 
      1. ให้ระบุ มาตรฐานและตัวชี้วัดแบบย่อ ในฟิลด์ indicators (ตัวอย่างเช่น "มาตรฐาน ค 1.1 ป.4/1, ป.4/2")
      2. ในส่วนของ explanation สำหรับครู ให้เขียนคำอธิบายเหตุผลของคำตอบที่ชัดเจนและเข้าใจง่าย เพื่อให้คุณครูนำไปใช้อธิบายให้นักเรียนฟังต่อได้
      ให้ตอบกลับเป็น JSON ภาษาไทย`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: GeminiType.OBJECT,
            properties: {
              title: { type: GeminiType.STRING },
              description: { type: GeminiType.STRING },
              indicators: { type: GeminiType.STRING, description: "ตัวอย่าง: มาตรฐาน ค 1.1 ป.4/1 อ่านและเขียนจำนวนนับได้" },
              items: {
                type: GeminiType.ARRAY,
                items: {
                  type: GeminiType.OBJECT,
                  properties: {
                    question: { type: GeminiType.STRING },
                    options: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } },
                    answer: { type: GeminiType.STRING },
                    explanation: { type: GeminiType.STRING }
                  },
                  required: ["question", "answer", "explanation"]
                }
              }
            },
            required: ["title", "description", "items", "indicators"]
          }
        },
      });

      setResult(JSON.parse(response.text));
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    const finalContent = combinedResults.length > 0 
      ? { sections: combinedResults, fontSettings } 
      : { ...result, fontSettings };
    
    if (!finalContent) return;
    
    setSaving(true);
    try {
      const apiBase = '/server.cjs';
      const url = isEditing ? `${apiBase}/api/exercises/${exerciseId}` : `${apiBase}/api/exercises`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || result?.title || combinedResults[0]?.title || 'แบบฝึกหัดใหม่',
          course: formData.course,
          grade: formData.grade,
          indicators: result?.indicators || combinedResults[0]?.indicators || 'อ้างอิงหลักสูตรแกนกลางอัตโนมัติ',
          content: finalContent
        })
      });
      if (res.ok) {
        alert(isEditing ? 'อัปเดตสำเร็จ' : 'บันทึกสำเร็จ');
        onNavigate('history');
      }
    } catch (err) {
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = () => {
    if (result) {
      setCombinedResults([...combinedResults, { ...result, type: formData.type }]);
      setResult(null);
    }
  };

  const handleClear = () => {
    setCombinedResults([]);
    setResult(null);
  };

  const printArea = () => {
    return (
      <div id="printable-area" className="print-container bg-white text-black font-sarabun">
        <div className="printable-content p-12 min-h-[297mm] flex flex-col text-[16pt] leading-normal">
          <div className="flex items-center border-b-2 border-black pb-4 mb-8 text-[13px] font-bold w-full gap-6">
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
          <div className="printable-body">
            {combinedResults.length > 0 ? (
              combinedResults.map((res, rIdx) => (
                <ExerciseRender key={rIdx} result={res} exerciseType={res.type} sectionIdx={rIdx + 1} fonts={fontSettings} />
              ))
            ) : result ? (
              <ExerciseRender result={result} exerciseType={formData.type} fonts={fontSettings} />
            ) : null}
          </div>
          <div className="mt-auto pt-6 border-t border-black">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="whitespace-nowrap">รายวิชา: {formData.course}</span>
                <span className="whitespace-nowrap">สร้างโดย: {user.name} {user.surname}</span>
                <span className="whitespace-nowrap">ตำแหน่ง: {user.position || user.school || 'ครูผู้สอน'}</span>
              </div>
              <span className="text-[9px] text-slate-400 italic uppercase tracking-tighter shrink-0 ml-4">Generated by EduGen AI System</span>
            </div>
          </div>
        </div>
        <style>{`
          @media screen {
            .print-container {
              width: 210mm;
              height: fit-content;
              box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
              transform: scale(0.6);
              transform-origin: top center;
              margin-bottom: -40%;
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
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-all text-slate-500 shadow-sm"><ChevronLeft size={20} /></button>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Workspace</span>
            <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'แก้ไขแบบฝึกหัด' : 'สร้างแบบฝึกหัดด้วย AI'}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 no-print">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><span className="w-1 h-4 bg-indigo-500 rounded-full"></span>ตั้งค่า</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <input list="subjects" value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="วิชา" />
                <datalist id="subjects">{CORE_SUBJECTS.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <input value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="หัวข้อบทเรียน" />
              <div className="flex gap-4">
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as ExerciseType})} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                  {EXERCISE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <input type="number" min="1" max="20" value={formData.count} onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})} className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <button onClick={handleGenerate} disabled={generating} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50">
                {generating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                <span>{generating ? 'กำลังสร้าง...' : 'สร้างด้วย AI'}</span>
              </button>
            </div>
          </div>

          {/* Font Settings - New Menu */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Settings size={18} className="text-indigo-500" />
              ปรับแต่งขนาดอักษร (Sarabun)
            </h3>
            <div className="space-y-4">
              <FontSizeInput label="ส่วนหัวข้อตอน/ชื่อแบบฝึก" value={fontSettings.title} onChange={(v) => setFontSettings({...fontSettings, title: v})} />
              <FontSizeInput label="ส่วนมาตรฐาน/ตัวชี้วัด" value={fontSettings.indicators} onChange={(v) => setFontSettings({...fontSettings, indicators: v})} />
              <FontSizeInput label="ส่วนคำชี้แจง/คำสั่ง" value={fontSettings.description} onChange={(v) => setFontSettings({...fontSettings, description: v})} />
              <FontSizeInput label="ส่วนโจทย์คำถาม" value={fontSettings.question} onChange={(v) => setFontSettings({...fontSettings, question: v})} />
              <FontSizeInput label="ส่วนตัวเลือกตอบ" value={fontSettings.option} onChange={(v) => setFontSettings({...fontSettings, option: v})} />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Document Preview</span>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase hover:bg-indigo-700 shadow-md transition-all">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก & ไปหน้าเครื่องพิมพ์'}
                </button>
              </div>
            </div>
            <div className="flex-1 p-8 bg-slate-100 overflow-y-auto flex justify-center">
              <div className="flex flex-col gap-4 print-root-container">
                {result && (
                  <div className="flex justify-center gap-2 mb-4 no-print grow-0">
                    <button onClick={handleAddSection} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                      <Layers size={14} /> เพิ่มเป็นส่วนถัดไป
                    </button>
                    <button onClick={handleClear} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all">ล้างข้อมูล</button>
                  </div>
                )}
                {printArea()}
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
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{value}pt</span>
      </div>
      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
        <button 
          onClick={() => onChange(Math.max(8, value - 0.5))} 
          className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all font-bold text-slate-600 active:scale-95"
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
          className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all font-bold text-slate-600 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}
