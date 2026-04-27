'use client'
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Video,
  File,
  Upload,
  Save,
} from 'lucide-react';

interface LessonForm {
  title: string;
  description: string;
  content_type: 'video' | 'pdf' | 'text';
  video_url: string;
  mux_playback_id: string;
  pdf_url: string;
  text_content: string;
  duration_minutes: number;
  is_free_preview: boolean;
}

export default function LessonEditorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string; // 'new' or actual lesson ID
  const moduleId = searchParams.get('moduleId') ?? '';

  const isNew = lessonId === 'new';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [lessonForm, setLessonForm] = useState<LessonForm>({
    title: '',
    description: '',
    content_type: 'video',
    video_url: '',
    mux_playback_id: '',
    pdf_url: '',
    text_content: '',
    duration_minutes: 0,
    is_free_preview: false,
  });

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [muxUploadProgress, setMuxUploadProgress] = useState(0);
  const [muxUploadStatus, setMuxUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
  const [muxAbortController, setMuxAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    const init = async () => {
      // Load course name
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();
      if (courseData) setCourseName(courseData.title);

      if (!isNew) {
        const { data: lesson } = await supabase
          .from('course_lessons')
          .select('*')
          .eq('id', lessonId)
          .single();
        if (lesson) {
          setLessonForm({
            title: lesson.title,
            description: lesson.description || '',
            content_type: lesson.content_type,
            video_url: lesson.video_url || '',
            mux_playback_id: lesson.mux_playback_id || '',
            pdf_url: lesson.pdf_url || '',
            text_content: lesson.text_content || '',
            duration_minutes: lesson.duration_minutes || 0,
            is_free_preview: lesson.is_free_preview,
          });
        }
        setLoading(false);
      }
    };
    init();
  }, [courseId, lessonId]);

  const handleFileUpload = async (file: File, type: 'video' | 'pdf'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${courseId}/${type}s/${fileName}`;
    const { error } = await supabase.storage.from('lesson-content').upload(filePath, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('lesson-content').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const url = await handleFileUpload(file, 'video');
      setLessonForm(prev => ({ ...prev, video_url: url }));
    } catch (error) {
      logger.error('Error uploading video:', error);
      alert('Error al subir el video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleMuxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    muxAbortController?.abort();
    const abortCtrl = new AbortController();
    setMuxAbortController(abortCtrl);
    setMuxUploadStatus('uploading');
    setMuxUploadProgress(0);

    let xhr: XMLHttpRequest | null = null;
    abortCtrl.signal.addEventListener('abort', () => { xhr?.abort(); });

    try {
      const res = await fetch('/api/admin/mux/upload', { method: 'POST', signal: abortCtrl.signal });
      if (!res.ok) throw new Error('Error al crear upload');
      const { uploadUrl, uploadId } = await res.json();

      xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          setMuxUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr!.open('PUT', uploadUrl);
        xhr!.setRequestHeader('Content-Type', file.type);
        xhr!.onload = () => xhr!.status >= 200 && xhr!.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr!.status}`));
        xhr!.onerror = () => reject(new Error('Upload failed'));
        xhr!.onabort = () => reject(new Error('Upload cancelled'));
        xhr!.send(file);
      });

      setMuxUploadStatus('processing');
      let attempts = 0;
      const poll = async (): Promise<void> => {
        if (abortCtrl.signal.aborted) return;
        if (attempts >= 60) throw new Error('Timeout esperando el procesamiento del video');
        attempts++;
        const statusRes = await fetch(`/api/admin/mux/asset/${uploadId}`, { signal: abortCtrl.signal });
        if (!statusRes.ok) throw new Error('Error checking status');
        const data = await statusRes.json();
        if (data.status === 'ready' && data.playbackId) {
          setLessonForm(prev => ({
            ...prev,
            mux_playback_id: data.playbackId,
            ...(data.duration ? { duration_minutes: Math.ceil(data.duration / 60) } : {}),
          }));
          setMuxUploadStatus('ready');
          return;
        }
        if (data.status === 'errored') throw new Error('Error procesando el video en Mux');
        await new Promise(r => setTimeout(r, 5000));
        return poll();
      };
      await poll();
    } catch (error: unknown) {
      if (abortCtrl.signal.aborted) return;
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Upload cancelled')) return;
      logger.error('Mux upload error:', error);
      setMuxUploadStatus('error');
      alert(error instanceof Error ? error.message : 'Error al subir el video a Mux');
    } finally {
      setMuxAbortController(prev => prev === abortCtrl ? null : prev);
    }
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPDF(true);
    try {
      const url = await handleFileUpload(file, 'pdf');
      setLessonForm(prev => ({ ...prev, pdf_url: url }));
    } catch (error) {
      logger.error('Error uploading PDF:', error);
      alert('Error al subir el PDF');
    } finally {
      setUploadingPDF(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let youtubeVideoId: string | null = null;
      if (lessonForm.content_type === 'video' && lessonForm.video_url) {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
          /^([a-zA-Z0-9_-]{11})$/,
        ];
        for (const pattern of patterns) {
          const match = lessonForm.video_url.match(pattern);
          if (match?.[1]) { youtubeVideoId = match[1]; break; }
        }
      }

      const lessonData = {
        title: lessonForm.title,
        description: lessonForm.description,
        content_type: lessonForm.content_type,
        video_url: lessonForm.content_type === 'video' ? lessonForm.video_url : null,
        youtube_video_id: youtubeVideoId,
        mux_playback_id: lessonForm.content_type === 'video' && lessonForm.mux_playback_id ? lessonForm.mux_playback_id : null,
        pdf_url: lessonForm.content_type === 'pdf' ? lessonForm.pdf_url : null,
        text_content: lessonForm.content_type === 'text' ? lessonForm.text_content : null,
        duration_minutes: lessonForm.duration_minutes,
        is_free_preview: lessonForm.is_free_preview,
      };

      if (isNew) {
        // Get max position in module
        const { data: existingLessons } = await supabase
          .from('course_lessons')
          .select('position')
          .eq('module_id', moduleId)
          .order('position', { ascending: false })
          .limit(1);
        const maxPosition = existingLessons?.[0]?.position ?? -1;

        await supabase.from('course_lessons').insert({
          ...lessonData,
          module_id: moduleId,
          position: maxPosition + 1,
        });
      } else {
        await supabase.from('course_lessons').update(lessonData).eq('id', lessonId);
      }

      router.push(`/admin/courses/${courseId}/content`);
    } catch (error) {
      logger.error('Error saving lesson:', error);
      alert('Error al guardar la lección');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/admin/courses/${courseId}/content`)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#1a5744] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al contenido del curso</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a5744]">
          {isNew ? 'Nueva Lección' : 'Editar Lección'}
        </h1>
        {courseName && <p className="text-gray-500 mt-1">{courseName}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-[#1a5744] mb-2">
            Título de la Lección *
          </label>
          <input
            type="text"
            value={lessonForm.title}
            onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
            placeholder="Ej: Conceptos básicos"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-[#1a5744] mb-2">Descripción</label>
          <textarea
            rows={3}
            value={lessonForm.description}
            onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent resize-none"
          />
        </div>

        {/* Type + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">
              Tipo de Contenido *
            </label>
            <select
              value={lessonForm.content_type}
              onChange={(e) => setLessonForm(prev => ({ ...prev, content_type: e.target.value as any }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
            >
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="text">Texto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">
              Duración (minutos)
            </label>
            <input
              type="number"
              min="0"
              value={lessonForm.duration_minutes}
              onChange={(e) => setLessonForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
            />
          </div>
        </div>

        {/* Video Fields */}
        {lessonForm.content_type === 'video' && (
          <div className="space-y-5">
            {/* Mux upload */}
            <div>
              <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                ⭐ Subir Video a Mux (Recomendado)
              </label>

              {lessonForm.mux_playback_id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Video className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Video listo</span>
                    <span className="text-xs text-green-600 ml-auto font-mono">{lessonForm.mux_playback_id}</span>
                  </div>
                  <button type="button" onClick={() => { setLessonForm(prev => ({ ...prev, mux_playback_id: '' })); setMuxUploadStatus('idle'); }}
                    className="text-sm text-red-600 hover:text-red-700">
                    Eliminar video
                  </button>
                </div>
              ) : muxUploadStatus === 'uploading' ? (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#a4c639]" />
                    <span className="text-sm text-gray-700">Subiendo video... {muxUploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#a4c639] h-2 rounded-full transition-all duration-300" style={{ width: `${muxUploadProgress}%` }} />
                  </div>
                </div>
              ) : muxUploadStatus === 'processing' ? (
                <div className="flex items-center gap-3 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500" />
                  <span className="text-sm text-yellow-700">Procesando video en Mux... esto puede tomar unos minutos</span>
                </div>
              ) : muxUploadStatus === 'error' ? (
                <div className="space-y-2">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    Error al subir el video. Intenta de nuevo.
                  </div>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#a4c639] transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-600">Reintentar subida</span>
                    <input type="file" className="hidden" accept="video/*" onChange={handleMuxUpload} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#a4c639]/50 rounded-lg cursor-pointer hover:border-[#a4c639] transition-colors bg-green-50/30">
                  <Upload className="w-8 h-8 text-[#a4c639] mb-2" />
                  <span className="text-gray-700 font-medium">Subir video a Mux</span>
                  <span className="text-sm text-gray-400">MP4, MOV, MKV — streaming profesional con analytics</span>
                  <input type="file" className="hidden" accept="video/*" onChange={handleMuxUpload} />
                </label>
              )}

              {!lessonForm.mux_playback_id && muxUploadStatus === 'idle' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={lessonForm.mux_playback_id}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, mux_playback_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent text-sm"
                    placeholder="O pega un Playback ID existente"
                  />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400">o usa YouTube</span></div>
            </div>

            {/* YouTube URL */}
            <div>
              <label className="block text-sm font-semibold text-[#1a5744] mb-2">URL de YouTube</label>
              <input
                type="text"
                value={lessonForm.video_url}
                onChange={(e) => setLessonForm(prev => ({ ...prev, video_url: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Recomendado: Sube tu video a YouTube (puede ser unlisted) y pega aquí la URL.
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400">o sube un archivo</span></div>
            </div>

            {/* Direct video upload */}
            {lessonForm.video_url && !lessonForm.video_url.includes('youtube') && !lessonForm.video_url.includes('youtu.be') ? (
              <div className="space-y-2">
                <video src={lessonForm.video_url} controls className="w-full rounded-lg" />
                <button onClick={() => setLessonForm(prev => ({ ...prev, video_url: '' }))}
                  className="text-sm text-red-600 hover:text-red-700">Eliminar video</button>
              </div>
            ) : !lessonForm.video_url && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#a4c639] transition-colors">
                {uploadingVideo ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a4c639]" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-600">Subir video</span>
                    <span className="text-sm text-gray-400">MP4, MOV hasta 500MB</span>
                    <span className="text-xs text-red-400 mt-1">No recomendado — usa YouTube en su lugar</span>
                  </>
                )}
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={uploadingVideo} />
              </label>
            )}
          </div>
        )}

        {/* PDF Fields */}
        {lessonForm.content_type === 'pdf' && (
          <div>
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">PDF</label>
            {lessonForm.pdf_url ? (
              <div className="space-y-2">
                <a href={lessonForm.pdf_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#a4c639] hover:underline">
                  <File className="w-5 h-5" />
                  <span>Ver PDF</span>
                </a>
                <button onClick={() => setLessonForm(prev => ({ ...prev, pdf_url: '' }))}
                  className="text-sm text-red-600 hover:text-red-700">Eliminar PDF</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#a4c639] transition-colors">
                {uploadingPDF ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a4c639]" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-600">Subir PDF</span>
                    <span className="text-sm text-gray-400">PDF hasta 50MB</span>
                  </>
                )}
                <input type="file" accept=".pdf" onChange={handlePDFUpload} className="hidden" disabled={uploadingPDF} />
              </label>
            )}
          </div>
        )}

        {/* Text Fields */}
        {lessonForm.content_type === 'text' && (
          <div>
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">Contenido de Texto</label>
            <textarea
              rows={10}
              value={lessonForm.text_content}
              onChange={(e) => setLessonForm(prev => ({ ...prev, text_content: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent font-mono text-sm resize-y"
              placeholder="Escribe el contenido de la lección..."
            />
          </div>
        )}

        {/* Free preview */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="is_free_preview"
            checked={lessonForm.is_free_preview}
            onChange={(e) => setLessonForm(prev => ({ ...prev, is_free_preview: e.target.checked }))}
            className="w-4 h-4 text-[#a4c639] border-gray-300 rounded focus:ring-[#a4c639]"
          />
          <label htmlFor="is_free_preview" className="text-sm text-gray-700">
            Vista previa gratuita (visible sin comprar el curso)
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => router.push(`/admin/courses/${courseId}/content`)}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!lessonForm.title || uploadingVideo || uploadingPDF || saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#a4c639] text-white rounded-lg hover:bg-[#2d7a5f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar Lección</span>
          </button>
        </div>
      </div>
    </div>
  );
}
