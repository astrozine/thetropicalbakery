'use client';

import ImagePicker from '@/components/ImagePicker';
import ToggleSwitch from '@/components/ToggleSwitch';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

export default function CoursesAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching courses:', error);
    else setCourses(data || []);
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!editingId) {
      setFormData({ ...formData, title, slug: generateSlug(title) });
    } else {
      setFormData({ ...formData, title });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `courses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      const { error } = await supabase
        .from('courses')
        .update(formData)
        .eq('id', editingId);
        
      if (error) alert('Erro ao atualizar curso: ' + error.message);
    } else {
      const { error } = await supabase
        .from('courses')
        .insert([{
          ...formData,
          is_active: formData.is_active ?? true,
        }]);
        
      if (error) alert('Erro ao criar curso: ' + error.message);
    }

    setEditingId(null);
    setFormData({});
    fetchCourses();
  };

  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setFormData(course);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
      
    if (error) alert('Erro ao deletar: ' + error.message);
    else fetchCourses();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando cursos...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem' }}>Cursos</h1>

      <div className="courses-layout">

      {/* Editor Form */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#3c2a21' }}>
          {editingId ? 'Editar Curso' : 'Adicionar Novo Curso'}
        </h2>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <ImagePicker label="Imagem da Capa" imageUrl={formData.image_url} uploading={uploading} onChange={handleImageUpload} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Título do Curso</label>
            <input 
              type="text" 
              required
              value={formData.title || ''} 
              onChange={handleTitleChange}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Slug (URL)</label>
            <input 
              type="text" 
              required
              value={formData.slug || ''} 
              onChange={e => setFormData({...formData, slug: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f6fa' }}
            />
            <small style={{ color: '#7f8c8d' }}>Ex: capacitacao-profissional</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Preço (R$)</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={formData.price || ''} 
              onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <ToggleSwitch
              checked={formData.is_active ?? true}
              onChange={v => setFormData({ ...formData, is_active: v })}
              label="Mostrar este curso no site"
              onText="Ativado — aparecendo no site"
              offText="Desativado — escondido do site"
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Descrição</label>
            <textarea 
              required
              value={formData.description || ''} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', minHeight: '120px' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" style={{ padding: '0.8rem 2rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {editingId ? 'Salvar Alterações' : 'Adicionar Curso'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{ padding: '0.8rem 2rem', background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancelar
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Courses: a slim column beside the form, one compact row per course */}
      <aside className="courses-column" aria-label="Cursos cadastrados">
        <h2 style={{ fontSize: '1.05rem', color: '#3c2a21', margin: '0 0 1rem' }}>
          Cursos cadastrados <span style={{ color: '#95a5a6', fontWeight: 500 }}>({courses.length})</span>
        </h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {courses.map(course => (
            <div key={course.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', padding: '0.75rem', outline: editingId === course.id ? '2px solid #d4af37' : 'none' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '76px', height: '76px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: '#f5f6fa' }}>
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bdc3c7', fontSize: '0.7rem', textAlign: 'center' }}>Sem foto</div>
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: '0.98rem', margin: '0 0 0.2rem', color: '#2c3e50', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</h3>
                  <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>
                    R$ {course.price.toFixed(2).replace('.', ',')}
                    {!course.is_active && (
                      <span style={{ marginLeft: '0.5rem', background: '#e74c3c', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', verticalAlign: 'middle' }}>Inativo</span>
                    )}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
                <button onClick={() => handleEdit(course)} style={{ flex: 1, padding: '0.4rem', background: '#f1c40f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(course.id)} style={{ flex: 1, padding: '0.4rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {courses.length === 0 && <p style={{ color: '#95a5a6', fontSize: '0.9rem' }}>Nenhum curso ainda.</p>}
        </div>
      </aside>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .courses-layout { display: grid; gap: 2rem; grid-template-columns: minmax(0, 1fr); align-items: start; }
        @media (min-width: 1100px) {
          .courses-layout { grid-template-columns: minmax(0, 1fr) 340px; }
          .courses-column { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow-y: auto; padding-right: 4px; }
        }
      ` }} />

    </div>
  );
}
