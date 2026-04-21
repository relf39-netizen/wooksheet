import { useState, useEffect, useRef } from 'react';
import { Sparkles, Printer, ChevronLeft, Loader2, Wand2, Type, CheckSquare, Layers, FileText, Settings, Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
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

function ExerciseRender({ 
  result, 
  exerciseType, 
  sectionIdx, 
  fonts, 
  startIdx = 1,
  editable = false,
  onUpdateItem,
  onAddItem,
  onAddAiItems,
  onRemoveItem,
  onUpdateHeader
}: { 
  result: any, 
  exerciseType: string, 
  sectionIdx?: number, 
  fonts?: any, 
  startIdx?: number,
  editable?: boolean,
  onUpdateItem?: (idx: number, field: string, value: any) => void,
  onAddItem?: () => void,
  onAddAiItems?: (topic: string, count: number) => void,
  onRemoveItem?: (idx: number) => void,
  onUpdateHeader?: (field: string, value: string) => void
}) {
  const f = fonts || { title: 18, indicators: 12, description: 14, question: 16, option: 16 };
  const [isAiToolsOpen, setIsAiToolsOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenItems = async () => {
    if (!aiTopic) return alert('กรุณาระบุหัวข้อที่ต้องการเพิ่มครับ');
    setIsGenerating(true);
    try {
      await onAddAiItems?.(aiTopic, aiCount);
      setIsAiToolsOpen(false);
      setAiTopic('');
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className={`mb-12 last:mb-0 relative group/section ${editable ? 'p-6 border-2 border-transparent hover:border-slate-100 rounded-3xl transition-all' : ''}`}>
      <div className="text-center border-b border-black pb-4 mb-6">
        {editable ? (
          <div className="space-y-2">
            <input 
              className="w-full text-center font-bold bg-transparent border-none outline-none focus:bg-white focus:ring-1 focus:ring-indigo-200 rounded px-2"
              style={{ fontSize: `${f.title}pt` }}
              value={result.title}
              onChange={(e) => onUpdateHeader?.('title', e.target.value)}
              placeholder="หัวข้อตอนที่..."
            />
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ตัวชี้วัด:</span>
              <input 
                className="flex-1 max-w-md text-center text-slate-600 font-bold italic bg-transparent border-none outline-none focus:bg-white focus:ring-1 focus:ring-indigo-200 rounded px-2"
                style={{ fontSize: `${f.indicators}pt` }}
                value={result.indicators || ''}
                onChange={(e) => onUpdateHeader?.('indicators', e.target.value)}
                placeholder="มาตรฐาน/ตัวชี้วัด..."
              />
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-bold" style={{ fontSize: `${f.title}pt` }}>
              {sectionIdx !== undefined && <span>ตอนที่ {sectionIdx}: </span>}
              {result.title}
            </h3>
            {result.indicators && (
              <div className="mt-1 text-slate-500 font-bold uppercase tracking-tight italic" style={{ fontSize: `${f.indicators}pt` }}>
                มาตรฐาน/ตัวชี้วัด: {result.indicators}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="mb-6 bg-slate-50 p-4 border-l-4 border-black relative">
        {editable ? (
          <textarea 
            className="w-full font-bold leading-relaxed bg-transparent border-none outline-none focus:bg-white focus:ring-1 focus:ring-indigo-200 rounded px-2 resize-none"
            style={{ fontSize: `${f.description}pt` }}
            value={result.description}
            onChange={(e) => onUpdateHeader?.('description', e.target.value)}
            placeholder="คำชี้แจง..."
            rows={1}
            onInput={(e: any) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
        ) : (
          <p className="font-bold leading-relaxed" style={{ fontSize: `${f.description}pt` }}>{result.description}</p>
        )}
      </div>

      <div className="space-y-8">
        {result.items.map((item: any, idx: number) => (
          <div key={idx} className={`space-y-4 relative group/item ${editable ? 'p-4 border border-transparent hover:border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all' : ''}`}>
            {editable && (
              <div className="absolute -left-12 top-4 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity no-print">
                <button 
                  onClick={() => onRemoveItem?.(idx)}
                  className="p-1.5 bg-white text-red-500 rounded-lg border border-red-100 hover:bg-red-500 hover:text-white shadow-sm transition-all"
                  title="ลบข้อนี้"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            
            <div className="font-bold leading-relaxed flex gap-3" style={{ fontSize: `${f.question}pt` }}>
              <span className="shrink-0">{startIdx + idx}.</span>
              <div className="flex-1">
                {editable ? (
                  <textarea 
                    className="w-full bg-transparent border-none outline-none focus:bg-white focus:ring-1 focus:ring-indigo-200 rounded px-2 resize-none"
                    value={item.question}
                    onChange={(e) => onUpdateItem?.(idx, 'question', e.target.value)}
                    placeholder="โจทย์คำถาม..."
                    rows={1}
                    onInput={(e: any) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                ) : (
                  exerciseType === 'matching' ? (
                    <div className="grid grid-cols-2 gap-24">
                      <div className="border-b border-black pb-1">{item.question}</div>
                      <div className="border-b border-black pb-1 text-right italic text-slate-300">....................................</div>
                    </div>
                  ) : (
                    <span>{item.question}</span>
                  )
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
                    {editable ? (
                      <input 
                        className="flex-1 bg-transparent border-none outline-none focus:bg-white focus:ring-1 focus:ring-indigo-200 rounded px-2"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...item.options];
                          newOpts[oIdx] = e.target.value;
                          onUpdateItem?.(idx, 'options', newOpts);
                        }}
                        placeholder={`ตัวเลือก ${String.fromCharCode(65 + oIdx)}...`}
                      />
                    ) : (
                      <span>{opt}</span>
                    )}
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

        {editable && (
          <div className="pt-8 flex flex-col items-center gap-4 no-print border-t border-slate-100 mt-8">
            {!isAiToolsOpen ? (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAiToolsOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95"
                >
                  <Sparkles size={16} />
                  เพิ่มข้อสอบด้วย AI (+หลายข้อ)
                </button>
                <button 
                  onClick={onAddItem}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase hover:bg-slate-200 transition-all border border-slate-200"
                >
                  <Plus size={16} />
                  เพิ่มแมนนวล (+1 ข้อ)
                </button>
              </div>
            ) : (
              <div className="w-full max-w-md bg-white p-6 rounded-3xl border-2 border-indigo-500 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-indigo-100">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="animate-pulse" /> ผู้ช่วย AI เพิ่มโจทย์
                  </h4>
                  <button onClick={() => setIsAiToolsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">หัวข้อ/เนื้อหาที่ต้องการให้ AI ช่วยเพิ่ม</label>
                    <input 
                      autoFocus
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                      placeholder="เช่น แม่กวง, โจทย์ปัญหาการคูณ, คำศัพท์สัตว์..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenItems()}
                    />
                    <p className="text-[9px] text-slate-400 italic ml-1">AI จะสร้างโจทย์เพิ่มให้ตามระดับชั้นและรูปแบบข้อสอบเดิมของส่วนนี้ครับ</p>
                  </div>
                  <div className="flex items-center justify-between gap-6 pt-2">
                    <div className="flex flex-col flex-1 gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">จำนวนข้อ</span>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{aiCount} ข้อ</span>
                      </div>
                      <input 
                        type="range" min="1" max="20" step="1" 
                        value={aiCount} 
                        onChange={(e) => setAiCount(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <button 
                      onClick={handleGenItems}
                      disabled={isGenerating}
                      className="shrink-0 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                    >
                      {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      {isGenerating ? 'กำลังสร้าง...' : 'สร้างเพิ่ม'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
  const [existingFontSettings, setExistingFontSettings] = useState<any>(null);

  useEffect(() => {
    if (exerciseId) {
      setResult(null);
      setCombinedResults([]);
      setIsEditing(false);
      const apiBase = '/server.cjs';
      fetch(`${apiBase}/api/exercises/${exerciseId}`)
        .then(res => res.json())
        .then(found => {
          if (found) {
            const content = JSON.parse(found.content);
            if (content.fontSettings) {
              setExistingFontSettings(content.fontSettings);
            }
            if (Array.isArray(content.sections)) {
              setCombinedResults(content.sections.map((s: any) => ({ ...s, indicators: s.indicators || found.indicators })));
            } else {
              setResult({ ...content, indicators: content.indicators || found.indicators });
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
    if (combinedResults.length === 0 && !result) {
      alert('คุณยังไม่ได้สร้างแบบฝึกหัด กรุณากดปุ่ม "สร้างด้วย AI" ก่อนครับ');
      return;
    }

    const finalContent: any = combinedResults.length > 0 
      ? { sections: combinedResults } 
      : { ...result };
    
    // รักษาค่า FontSettings เดิมไว้ (ถ้ามี)
    if (existingFontSettings) {
      finalContent.fontSettings = existingFontSettings;
    }
    
    setSaving(true);
    try {
      const apiBase = '/server.cjs';
      const isUpdating = isEditing && exerciseId;
      const url = isUpdating ? `${apiBase}/api/exercises/${exerciseId}/update` : `${apiBase}/api/exercises`;
      const res = await fetch(url, {
        method: 'POST',
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
        const data = await res.json();
        alert(isEditing ? 'อัปเดตสำเร็จ' : 'บันทึกสำเร็จ');
        const idToPrint = (isEditing && exerciseId) ? exerciseId : data.id;
        onNavigate('print', String(idToPrint));
      } else {
        const err = await res.text();
        console.error('Save failed:', err);
        alert('บันทรึกไม่สำเร็จ: ' + err);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = () => {
    if (result) {
      setCombinedResults([...combinedResults, { ...result, type: formData.type }]);
      setResult(null);
      setFormData({ ...formData, topic: '' }); // ล้างหัวข้อเพื่อเตรียมสร้างส่วนถัดไป
    }
  };

  const handleClear = () => {
    setCombinedResults([]);
    setResult(null);
  };

  const updateItem = (sectionIdx: number | null, itemIdx: number, field: string, value: any) => {
    if (sectionIdx === null) {
      if (!result) return;
      const newItems = [...result.items];
      newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
      setResult({ ...result, items: newItems });
    } else {
      const newSections = [...combinedResults];
      const newItems = [...newSections[sectionIdx].items];
      newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
      newSections[sectionIdx] = { ...newSections[sectionIdx], items: newItems };
      setCombinedResults(newSections);
    }
  };

  const addItemToSection = (sectionIdx: number | null) => {
    const defaultOptions = formData.type === 'multiple_choice' ? ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'] : undefined;
    const newItem = { question: 'ตั้งโจทย์ใหม่...', options: defaultOptions, answer: '', explanation: 'คำอธิบาย...' };
    
    if (sectionIdx === null) {
      if (!result) return;
      setResult({ ...result, items: [...result.items, newItem] });
    } else {
      const newSections = [...combinedResults];
      newSections[sectionIdx] = { ...newSections[sectionIdx], items: [...newSections[sectionIdx].items, newItem] };
      setCombinedResults(newSections);
    }
  };

  const removeItemFromSection = (sectionIdx: number | null, itemIdx: number) => {
    if (!confirm('ยืนยันการลบข้อสอบนี้?')) return;
    
    if (sectionIdx === null) {
      if (!result) return;
      const newItems = result.items.filter((_: any, i: number) => i !== itemIdx);
      setResult({ ...result, items: newItems });
    } else {
      const newSections = [...combinedResults];
      const newItems = newSections[sectionIdx].items.filter((_: any, i: number) => i !== itemIdx);
      newSections[sectionIdx] = { ...newSections[sectionIdx], items: newItems };
      setCombinedResults(newSections);
    }
  };

  const updateHeader = (sectionIdx: number | null, field: string, value: string) => {
    if (sectionIdx === null) {
      if (!result) return;
      setResult({ ...result, [field]: value });
    } else {
      const newSections = [...combinedResults];
      newSections[sectionIdx] = { ...newSections[sectionIdx], [field]: value };
      setCombinedResults(newSections);
    }
  };

  const handleAddAiItemsToSection = async (sectionIdx: number | null, topic: string, count: number) => {
    if (!user.ai_key) throw new Error('API Key Missing');

    const ai = new GoogleGenAI({ apiKey: user.ai_key });
    const systemInstruction = `You are a professional educational content creator for Thai ministry of education.`;
    
    // Determine the type for the section
    const currentType = sectionIdx === null ? formData.type : (combinedResults[sectionIdx].type || formData.type);
    const currentGrade = formData.grade;

    const prompt = `สร้างคำถามเพิ่มจำนวน ${count} ข้อ ในหัวข้อ: "${topic}" สำหรับระดับชั้น ${currentGrade} โดยเป็นข้อสอบรูปแบบ: ${currentType}. 
    เฉลยคำตอบในฟิลด์ answer และให้คำอธิบายใน explanation. ตอบเป็น JSON array ของ items เท่านั้น [{ "question": "...", "options": ["..."], "answer": "...", "explanation": "..." }]`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
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
    });

    const newItems = JSON.parse(response.text);
    
    if (sectionIdx === null) {
      if (!result) return;
      setResult({ ...result, items: [...result.items, ...newItems] });
    } else {
      const newSections = [...combinedResults];
      newSections[sectionIdx] = { ...newSections[sectionIdx], items: [...newSections[sectionIdx].items, ...newItems] };
      setCombinedResults(newSections);
    }
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
              combinedResults.map((res, rIdx) => {
                const prevItemsCount = combinedResults.slice(0, rIdx).reduce((acc, curr) => acc + curr.items.length, 0);
                const startIdx = prevItemsCount + 1;
                return (
                  <ExerciseRender 
                    key={rIdx} 
                    result={res} 
                    exerciseType={res.type || formData.type} 
                    sectionIdx={rIdx + 1} 
                    startIdx={startIdx} 
                    editable={true}
                    onUpdateItem={(iIdx, f, v) => updateItem(rIdx, iIdx, f, v)}
                    onAddItem={() => addItemToSection(rIdx)}
                    onAddAiItems={(t, c) => handleAddAiItemsToSection(rIdx, t, c)}
                    onRemoveItem={(iIdx) => removeItemFromSection(rIdx, iIdx)}
                    onUpdateHeader={(f, v) => updateHeader(rIdx, f, v)}
                  />
                );
              })
            ) : result ? (
              <ExerciseRender 
                result={result} 
                exerciseType={formData.type} 
                editable={true}
                onUpdateItem={(iIdx, f, v) => updateItem(null, iIdx, f, v)}
                onAddItem={() => addItemToSection(null)}
                onAddAiItems={(t, c) => handleAddAiItemsToSection(null, t, c)}
                onRemoveItem={(iIdx) => removeItemFromSection(null, iIdx)}
                onUpdateHeader={(f, v) => updateHeader(null, f, v)}
              />
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-300 font-bold uppercase tracking-widest text-sm">
                ยังไม่มีเนื้อหาแบบฝึกหัด
              </div>
            )}
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
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${combinedResults.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                {combinedResults.length} Sections
              </span>
            </div>
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><span className="w-1 h-4 bg-indigo-500 rounded-full"></span>ตั้งค่าส่วนที่ {combinedResults.length + 1}</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <input list="subjects" value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="วิชา" />
                <datalist id="subjects">{CORE_SUBJECTS.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">หัวข้อ/เนื้อหาที่ต้องการเน้น</label>
                <textarea 
                  value={formData.topic} 
                  onChange={(e) => setFormData({...formData, topic: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm h-24 resize-none" 
                  placeholder="เช่น มาตราตัวสะกดแม่กกา, การบวกเลขไม่เกิน 100" 
                />
              </div>
              <div className="flex gap-4">
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as ExerciseType})} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                  {EXERCISE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-400 mb-1">จำนวนข้อ</span>
                  <input type="number" min="1" max="20" value={formData.count} onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center text-sm" />
                </div>
              </div>
              
              <button 
                onClick={handleGenerate} 
                disabled={generating} 
                className={`w-full text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50 transition-all ${combinedResults.length > 0 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {generating ? <Loader2 className="animate-spin" size={20} /> : combinedResults.length > 0 ? <Plus size={20} /> : <Wand2 size={20} />}
                <span>{generating ? 'กำลังสร้าง...' : combinedResults.length > 0 ? `เพิ่มส่วนที่ ${combinedResults.length + 1}` : 'สร้างใบงานแรก'}</span>
              </button>
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
