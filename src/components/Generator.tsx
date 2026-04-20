import { useState } from 'react';
import { Sparkles, Save, Printer, ChevronLeft, Loader2, Wand2, Type, CheckSquare, Layers, FileText } from 'lucide-react';
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

function ExerciseRender({ result, exerciseType, sectionIdx }: { result: any, exerciseType: string, sectionIdx?: number }) {
  return (
    <div className="mb-12 last:mb-0">
      <div className="text-center border-b border-black pb-4 mb-6">
        <h3 className="text-xl font-bold">
          {sectionIdx && <span>ตอนที่ {sectionIdx}: </span>}
          {result.title}
        </h3>
      </div>
      
      <div className="mb-6 bg-slate-50 p-4 border-l-4 border-black">
        <p className="text-sm font-bold leading-relaxed">{result.description}</p>
      </div>

      <div className="space-y-8">
        {result.items.map((item: any, idx: number) => (
          <div key={idx} className="space-y-4">
            <div className="text-base font-bold leading-relaxed flex gap-3">
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
                  <div key={oIdx} className="flex items-center gap-2 text-sm italic">
                    <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center text-[11px] font-bold shrink-0">
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {exerciseType === 'math_steps' && (
              <div className="pl-8 space-y-5">
                <p className="text-xs text-slate-500 font-bold">วิธีทำ:</p>
                <div className="space-y-4">
                  <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                  <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                  <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                  <div className="border-b border-dotted border-slate-400 h-8 w-full"></div>
                  <div className="flex items-end gap-3 pt-2">
                    <span className="text-xs font-black shrink-0">ตอบ:</span>
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

export default function Generator({ user, onNavigate }: { user: User, onNavigate: (page: string) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    grade: 'ป.1',
    indicators: '',
    type: 'multiple_choice' as ExerciseType,
    count: 5,
    topic: ''
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [combinedResults, setCombinedResults] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!user.ai_key) {
      alert('กรุณาตั้งค่า API Key ในแดชบอร์ดก่อนใช้งาน');
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: user.ai_key });
      
      const systemInstruction = `You are a professional educational content creator for Thai ministry of education. 
      Generate a set of exercises in Thai language based on the Thai curriculum standards.
      The output must be a valid JSON object matching the requested schema.
      Current Date: ${new Date().toISOString()}`;

      const prompt = `สร้างแบบฝึกหัดเรื่อง: "${formData.topic}" 
      สำหรับวิชา: ${formData.course} 
      ระดับชั้น: ${formData.grade} 
      ตัวชี้วัด/มาตรฐาน: ${formData.indicators}
      รูปแบบ: ${formData.type}
      จำนวนข้อ: ${formData.count} ข้อ
      
      คำแนะนำเพิ่มเติมตามรูปแบบ:
      - ถ้าเป็น 'matching' (จับคู่): ให้สร้างรายการฝั่งซ้ายและฝั่งขวาที่สอดคล้องกัน โดยใน items ให้มี field "left" และ "right"
      - ถ้าเป็น 'math_steps' (แสดงวิธีทำ): ให้สร้างโจทย์คณิตศาสตร์ที่เน้นการแสดงวิธีทำอย่างละเอียด
      
      ให้ตอบกลับเป็น JSON ภาษาไทยที่มีโครงสร้างดังนี้:
      {
        "title": "หัวข้อที่สร้าง",
        "description": "คำชี้แจงสำหรับนักเรียน (ให้สอดคล้องกับรูปแบบแบบฝึกหัดและหลักสูตรแกนกลาง)",
        "items": [
          {
            "question": "โจทย์คำถาม หรือ สิ่งที่อยู่ฝั่งซ้าย (ถ้าเป็นจับคู่)",
            "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"], // สำหรับปรนัยเท่านั้น
            "answer": "คำตอบที่ถูกต้อง หรือ สิ่งที่อยู่ฝั่งขวา (ถ้าเป็นจับคู่) หรือ เฉลยวิธีทำ (ถ้าเป็นคณิตศาสตร์)",
            "explanation": "คำอธิบายเหตุผลหรือขั้นตอน",
            "math_hint": "แนวทางการเขียนวิธีทำ (ถ้าเป็นคณิตศาสตร์)"
          }
        ]
      }`;

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
                  required: ["question", "answer"]
                }
              }
            },
            required: ["title", "description", "items"]
          }
        },
      });

      const data = JSON.parse(response.text);
      setResult(data);
    } catch (error: any) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการสร้าง: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const apiBase = '/server.cjs';
      const res = await fetch(`${apiBase}/api/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.title || formData.title,
          course: formData.course,
          grade: formData.grade,
          indicators: formData.indicators,
          content: result
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('บันทึกสำเร็จ');
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
      <div id="printable-area" className="w-full bg-white text-black p-12 max-w-[21cm] min-h-[29.7cm] flex flex-col font-['Sarabun']">
        {/* Student Fields Header */}
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex gap-4">
              <span className="shrink-0">ชื่อ-นามสกุล: ................................................................................................</span>
              <span className="shrink-0">เลขที่: .................</span>
            </div>
            <div className="flex gap-10">
              <span>ชั้นประถมศึกษาปีที่: ................. / .................</span>
              <span>วิชา: {formData.course}</span>
            </div>
          </div>
        </div>

        {/* Exercises Content */}
        <div className="flex-1">
          {combinedResults.length > 0 ? (
            combinedResults.map((res, rIdx) => (
              <ExerciseRender key={rIdx} result={res} exerciseType={res.type} sectionIdx={rIdx + 1} />
            ))
          ) : result ? (
            <ExerciseRender result={result} exerciseType={formData.type} />
          ) : null}
        </div>

        {/* Teacher Credits Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="text-right space-y-1">
            <p className="text-xs font-bold text-slate-900">ผู้สร้าง: {user.name}</p>
            <p className="text-[10px] text-slate-500">ตำแหน่ง: {user.school || 'ครูผู้สอน'}</p>
            <p className="text-[9px] text-slate-400 italic uppercase">Generated by EduGen AI</p>
          </div>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; background: white !important; }
            #printable-area, #printable-area * { visibility: visible; }
            #printable-area { position: absolute; left: 0; top: 0; width: 100% !important; margin: 0 !important; padding: 2cm !important; box-shadow: none !important; border: none !important; }
            button { display: none !important; }
          }
          @page { size: A4; margin: 0; }
        `}</style>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-all text-slate-500 shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Workspace</span>
            <h1 className="text-2xl font-bold text-slate-900">สร้างแบบฝึกหัดด้วย AI</h1>
          </div>
        </div>
        {!result && (
          <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Wand2 size={16} className="text-indigo-500" />
            <span className="text-xs font-bold text-slate-600">ระบบพร้อมประมวลผล</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Input Form (Left Column) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
              ตั้งค่าการสร้างแบบฝึก
            </h3>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">ระดับชั้น</label>
                  <select 
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">รายวิชา</label>
                  <div className="relative">
                    <input 
                      list="subjects"
                      value={formData.course}
                      onChange={(e) => setFormData({...formData, course: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="เลือกหรือระบุวิชา"
                    />
                    <datalist id="subjects">
                      {CORE_SUBJECTS.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">ตัวชี้วัดตามหลักสูตรแกนกลาง</label>
                <textarea 
                  value={formData.indicators}
                  onChange={(e) => setFormData({...formData, indicators: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  placeholder="ระบุรหัสตัวชี้วัด (ท 1.1 ป.6/1...)"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">หัวข้อบทเรียน</label>
                <input 
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="เช่น การแยกสาร, ร่างกายมนุษย์"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">รูปแบบ & จำนวน</label>
                <div className="flex gap-4">
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as ExerciseType})}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {EXERCISE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <input 
                    type="number"
                    min="1"
                    max="20"
                    value={formData.count}
                    onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})}
                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={generating || !formData.topic}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Wand2 size={20} />
                  )}
                  <span>{generating ? 'กำลังประมวลผล...' : 'สร้างอัตโนมัติด้วย AI'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area (Right Column) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col min-h-[600px]">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Document Preview</span>
              {result && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-[10px] font-bold uppercase transition-colors hover:bg-slate-50"
                  >
                    {saving ? 'Saving...' : 'บันทึกฐานข้อมูล'}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase transition-colors hover:bg-indigo-700"
                  >
                    พิมพ์ (PDF)
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-8 bg-slate-100 overflow-y-auto flex justify-center">
              {!result && !generating && combinedResults.length === 0 ? (
                <div className="self-center flex flex-col items-center text-slate-400 gap-4">
                  <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                    <Sparkles size={32} className="opacity-50" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest">Awaiting Generator</p>
                </div>
              ) : generating ? (
                <div className="w-full bg-white shadow-xl h-full p-10 max-w-[600px] animate-pulse flex flex-col gap-8">
                  <div className="h-10 bg-slate-100 rounded w-full mx-auto mb-8 border-b-2 border-slate-200 pb-4"></div>
                  <div className="space-y-6">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="space-y-3">
                        <div className="h-4 bg-slate-50 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-50 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {result && (
                    <div className="flex justify-center gap-2 mb-4 no-print">
                      <button 
                        onClick={handleAddSection}
                        className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Layers size={14} />
                        เพิ่มเป็นส่วนถัดไป (Add Section)
                      </button>
                      <button 
                        onClick={handleClear}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all"
                      >
                        ล้างข้อมูลทั้งหมด
                      </button>
                    </div>
                  )}
                  {printArea()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
