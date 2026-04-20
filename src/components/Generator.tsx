import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, Printer, ChevronLeft, Loader2, Wand2, Type, CheckSquare, Layers, FileText } from 'lucide-react';
import { User, ExerciseType } from '../types';
import { GoogleGenAI, Type as GeminiType } from "@google/genai";

const EXERCISE_TYPES = [
  { id: 'multiple_choice', label: 'แบบปรนัย (ตัวเลือก)', icon: <CheckSquare size={18} /> },
  { id: 'subjective', label: 'แบบอัตนัย (เติมคำ)', icon: <Type size={18} /> },
  { id: 'matching', label: 'แบบจับคู่', icon: <Layers size={18} /> },
  { id: 'essay', label: 'แบบเขียนเรียงความ', icon: <FileText size={18} /> },
  { id: 'image_sentence', label: 'แบบแต่งประโยคจากภาพ', icon: <Sparkles size={18} /> },
];

const GRADES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3'];

export default function Generator({ user }: { user: User }) {
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
  const navigate = useNavigate();

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
      
      ให้ตอบกลับเป็น JSON ภาษาไทยที่มีโครงสร้างดังนี้:
      {
        "title": "หัวข้อที่สร้าง",
        "description": "คำชี้แจงสำหรับนักเรียน",
        "items": [
          {
            "question": "โจทย์คำถาม",
            "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"], // สำหรับปรนัยเท่านั้น ถ้าไม่ใช่ให้ข้ามไป
            "answer": "คำตอบที่ถูกต้องหรือแนวทางคำตอบ",
            "explanation": "คำอธิบายเหตุผล"
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
      const res = await fetch('/api/exercises', {
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
        navigate('/history');
      }
    } catch (err) {
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-all text-slate-500 shadow-sm">
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
                  <input 
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ระบุวิชา"
                  />
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
              {!result && !generating ? (
                <div className="self-center flex flex-col items-center text-slate-400 gap-4">
                  <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                    <Sparkles size={32} className="opacity-50" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest">Awaiting Generator</p>
                </div>
              ) : generating ? (
                <div className="w-full bg-white shadow-xl h-full p-10 max-w-[500px] animate-pulse flex flex-col gap-8">
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
                <div className="w-full bg-white shadow-2xl min-h-fit p-10 max-w-[550px] flex flex-col border border-slate-300 animate-in zoom-in-95 duration-300">
                  <div className="text-center border-b-2 border-slate-800 pb-4 mb-8">
                    <h2 className="text-xl font-bold uppercase tracking-tight">{result.title}</h2>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">
                      {formData.course} | {formData.grade} | {formData.indicators}
                    </p>
                  </div>
                  
                  <div className="mb-6 bg-slate-50 p-4 border-l-4 border-slate-900">
                    <p className="text-[10px] italic leading-relaxed text-slate-700">{result.description}</p>
                  </div>

                  <div className="space-y-8 flex-1">
                    {result.items.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-4">
                        <p className="text-sm font-bold leading-relaxed">
                          <span className="mr-2">{idx + 1}.</span>
                          {item.question}
                        </p>
                        
                        {item.options && (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 pl-6">
                            {item.options.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-2 text-xs">
                                <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold">
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {!item.options && (
                          <div className="ml-6 border-b border-dotted border-slate-300 h-6"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-20 pt-4 border-t border-slate-100 flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>EduGen AI Generation</span>
                    <span>Page 1/1</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
