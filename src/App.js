/* global __firebase_config */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp, query } from 'firebase/firestore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Importante para o estilo do editor

// --- Fontes e Estilos Globais ---
const GlobalStyles = () => (
    <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
            :root {
                --c-background: #ffffff; --c-surface: #f8f9fa; --c-primary: #0d6efd; --c-secondary: #6c757d; --c-text-main: #212529;
                --c-text-head: #000000; --c-text-subtle: #6c757d; --c-border: #dee2e6; --c-shadow: rgba(0, 0, 0, 0.05);
            }
            .dark {
                --c-background: #121212; --c-surface: #1e1e1e; --c-primary: #4dabf7; --c-secondary: #adb5bd; --c-text-main: #e9ecef;
                --c-text-head: #ffffff; --c-text-subtle: #adb5bd; --c-border: #343a40; --c-shadow: rgba(255, 255, 255, 0.05);
            }
            body { font-family: 'Inter', sans-serif; background-color: var(--c-background); color: var(--c-text-main); transition: background-color 0.3s, color 0.3s; }
            .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            .input-styled { background-color: var(--c-surface); border: 1px solid var(--c-border); border-radius: 4px; padding: 0.5rem 0.75rem; color: var(--c-text-main); transition: border-color 0.2s, box-shadow 0.2s; }
            .input-styled:focus { outline: none; border-color: var(--c-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--c-primary) 30%, transparent); }
            .ql-toolbar { border-color: var(--c-border) !important; border-top-left-radius: 8px; border-top-right-radius: 8px; }
            .ql-container { border-color: var(--c-border) !important; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 16px; }
            .ql-editor { color: var(--c-text-main); min-height: 200px; }
            .dark .ql-toolbar, .dark .ql-container { border-color: var(--c-border) !important; }
            .dark .ql-editor { color: var(--c-text-main); }
            .dark .ql-snow .ql-stroke { stroke: var(--c-text-subtle); }
            .dark .ql-snow .ql-picker-label { color: var(--c-text-subtle) !important; }
            .dark .ql-snow .ql-picker-options { background-color: var(--c-surface); border-color: var(--c-border) !important; }
        `}</style>
    </>
);

// --- ÍCONES (SVG como componentes React) ---
const BookOpenIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const LightbulbIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 9 5c0 1.3.5 2.6 1.5 3.5.7.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>;
const LinkIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
const PlusIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const SearchIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const AlertTriangleIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const ClockIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const MenuIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const XIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const SunIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const TrashIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const ChevronRightIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 18 15 12 9 6"></polyline></svg>;
const LogOutIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

// --- COMPONENTES DA UI ---

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
            <div className="bg-[var(--c-surface)] rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 border border-[var(--c-border)] animate-fade-in">
                <h3 className="text-lg font-bold text-[var(--c-text-head)]">{title}</h3>
                <p className="text-base text-[var(--c-text-main)] mt-2">{message}</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onCancel} className="bg-transparent border border-[var(--c-border)] text-[var(--c-text-main)] font-semibold py-2 px-4 rounded-md hover:bg-[var(--c-border)]">Cancelar</button>
                    <button onClick={onConfirm} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-500">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const ConnectionsDisplay = ({ text, title, wikiArticles, onArticleLink }) => {
    const connectedArticles = useMemo(() => {
        const plainText = text.replace(/<[^>]*>/g, '').toLowerCase();
        const fullText = `${title.toLowerCase()} ${plainText}`;
        if (!fullText.trim() || !wikiArticles) return [];
        const connections = new Set();
        wikiArticles.forEach(article => { if (article.title) { const regex = new RegExp(`\\b${article.title.toLowerCase()}\\b`, 'g'); if (fullText.match(regex)) connections.add(article); } });
        return Array.from(connections);
    }, [text, title, wikiArticles]);

    if (connectedArticles.length === 0) return null;

    return (
        <div className="mt-4 border-t border-[var(--c-border)] pt-4">
            <h4 className="text-sm font-semibold text-[var(--c-text-subtle)] mb-2 flex items-center gap-2"><LinkIcon /> Conexões com a Wiki</h4>
            <div className="flex flex-wrap gap-2">
                {connectedArticles.map(article => <button key={article.id} onClick={() => onArticleLink(article)} className="text-xs bg-[color-mix(in_srgb,_var(--c-primary)_15%,_transparent)] text-[var(--c-primary)] hover:bg-[color-mix(in_srgb,_var(--c-primary)_25%,_transparent)] font-semibold px-2 py-1 rounded-full">{article.title}</button>)}
            </div>
        </div>
    );
};

// --- PARTE DA WIKI ---

const WikiContentRenderer = ({ htmlContent, articles, onLinkClick, onCreateNew }) => {
    const contentRef = useRef(null);

    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;
        const handleLinkClick = (event) => {
            const target = event.target.closest('a'); if (!target) return;
            const wikiLinkId = target.getAttribute('data-wiki-link-id');
            const wikiLinkCreate = target.getAttribute('data-wiki-link-create');
            if (wikiLinkId) { event.preventDefault(); const targetArticle = articles.find(a => a.id === wikiLinkId); if (targetArticle) onLinkClick(targetArticle); } 
            else if (wikiLinkCreate) { event.preventDefault(); onCreateNew(wikiLinkCreate); }
        };
        container.addEventListener('click', handleLinkClick);
        return () => container.removeEventListener('click', handleLinkClick);
    }, [htmlContent, articles, onLinkClick, onCreateNew]);

    const processedHtml = useMemo(() => {
        if (!htmlContent) return '';
        const articleMap = new Map();
        (articles || []).forEach(article => { if (article.title) { articleMap.set(article.title.toLowerCase(), article.id); } });
        return htmlContent.replace(/\[\[([^\]]+)\]\]/g, (match, linkTitle) => {
            const cleanTitle = linkTitle.trim();
            const targetId = articleMap.get(cleanTitle.toLowerCase());
            if (targetId) return `<a href="#" data-wiki-link-id="${targetId}" class="text-[var(--c-primary)] hover:underline">${cleanTitle}</a>`;
            return `<a href="#" data-wiki-link-create="${cleanTitle}" class="text-red-400 hover:underline">${cleanTitle} (criar)</a>`;
        });
    }, [htmlContent, articles]);

    return <div ref={contentRef} className="prose max-w-none text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: processedHtml }} />;
};

const ArticleDisplay = ({ article, onEdit, onLinkClick, onCreateNew, articles, userCanCreate }) => {
    const formatDate = (timestamp) => {
        if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleDateString('pt-BR');
        return 'agora mesmo';
    };

    const needsReview = useMemo(() => {
        const lastModified = article.updatedAt || article.createdAt;
        if (lastModified && typeof lastModified.toDate === 'function') {
            const lastModifiedDate = lastModified.toDate(); const reviewDate = new Date(lastModifiedDate);
            reviewDate.setMonth(reviewDate.getMonth() + 3); return new Date() >= reviewDate;
        }
        return false;
    }, [article.updatedAt, article.createdAt]);

    return (
        <div className="bg-[var(--c-surface)] p-6 md:p-8 rounded-lg shadow-xl border border-[var(--c-border)] animate-fade-in">
            <div className="flex justify-between items-start mb-2"><h1 className="text-4xl lg:text-5xl font-bold text-[var(--c-text-head)] leading-tight">{article.title}</h1>{userCanCreate && <button onClick={() => onEdit(article)} className="bg-transparent border border-[var(--c-primary)] text-[var(--c-primary)] font-semibold py-2 px-4 rounded-md hover:bg-[color-mix(in_srgb,_var(--c-primary)_10%,_transparent)] flex-shrink-0">Editar</button>}</div>
            <div className="text-xs text-[var(--c-text-subtle)] mb-6 border-b border-dashed border-[var(--c-border)] pb-4">Criado em {formatDate(article.createdAt)}{article.location && ` em ${article.location}`}{article.authorId && ` por ${article.authorId.substring(0, 8)}`}. Última atualização: {formatDate(article.updatedAt)}.</div>
            
            {needsReview && (<div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-4 rounded-md mb-6" role="alert"><div className="flex items-center"><ClockIcon className="h-5 w-5 mr-3 flex-shrink-0"/><p><span className="font-bold">Revisão necessária.</span> Este artigo pode estar desatualizado.</p></div></div>)}
            {!(article.references || '').trim() && (<div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 p-4 rounded-md mb-6" role="alert"><div className="flex items-center"><AlertTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0"/><p><span className="font-bold">Sem fontes.</span> Considere adicionar referências.</p></div></div>)}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8"><div className="lg:col-span-8"><div className="prose max-w-none text-lg leading-relaxed"><WikiContentRenderer htmlContent={article.content} articles={articles} onLinkClick={onLinkClick} onCreateNew={onCreateNew} /></div>{article.references && (<div className="mt-12 pt-6 border-t border-dashed border-[var(--c-border)]"><h2 className="text-2xl font-bold mb-4 text-[var(--c-text-head)]">Referências</h2><div className="prose prose-sm max-w-none whitespace-pre-wrap text-[var(--c-text-subtle)]">{article.references}</div></div>)}</div>
                <aside className="lg:col-span-4"><div className="sticky top-36 border border-[var(--c-border)] rounded-lg p-4 bg-[var(--c-background)]"><h3 className="text-xl font-bold mb-4 text-[var(--c-text-head)] border-b-2 border-[var(--c-primary)] pb-2">{article.title}</h3>{article.imageUrl && <img src={article.imageUrl} alt={article.title} className="w-full h-auto rounded-md mb-4 object-cover border border-[var(--c-border)]" onError={(e) => e.target.style.display = 'none'} />}{article.summary && <p className="text-base text-[var(--c-text-main)] mb-4 italic leading-snug">{article.summary}</p>}{(article.infobox || []).length > 0 && <hr className="mb-4 border-dashed border-[var(--c-border)]" />}<dl>{(article.infobox || []).map((item, index) => (item.key && <div key={index} className="flex justify-between text-sm mb-2 border-b border-dotted border-[var(--c-border)] pb-1"><dt className="font-semibold text-[var(--c-text-subtle)]">{item.key}</dt><dd className="text-[var(--c-text-main)] text-right">{item.value}</dd></div>))}</dl></div></aside>
            </div>
        </div>
    );
};

const ArticleEditor = ({ article, onSave, onCancel, onDelete }) => {
    const [title, setTitle] = useState(article?.title || '');
    const [topics, setTopics] = useState(article?.topics?.join(' > ') || '');
    const [content, setContent] = useState(article?.content || '');
    const [summary, setSummary] = useState(article?.summary || '');
    const [imageUrl, setImageUrl] = useState(article?.imageUrl || '');
    const [infobox, setInfobox] = useState(article?.infobox || []);
    const [references, setReferences] = useState(article?.references || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const modules = useMemo(() => ({
        toolbar: [['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet'}], [{ 'align': [] }], [{ 'script': 'sub'}, { 'script': 'super' }], ['link', 'image'], ['clean']],
    }), []);

    const handleInfoboxChange = (index, field, value) => { const n = [...infobox]; n[index][field] = value; setInfobox(n); };
    const addInfoboxItem = () => setInfobox([...infobox, { key: '', value: '' }]);
    const removeInfoboxItem = (index) => setInfobox(infobox.filter((_, i) => i !== index));
    const handleSubmit = (e) => { e.preventDefault(); const t = topics.split(';').map(p => p.trim().split('>').map(s => s.trim())).flat().filter(Boolean); if (!title) { alert("O título é obrigatório."); return; } onSave({ ...article, title, topics: t, content, summary, imageUrl, infobox: infobox.filter(i => i.key), references }); };

    return (
         <div className="bg-[var(--c-surface)] p-6 md:p-8 rounded-lg shadow-2xl border border-[var(--c-border)] animate-fade-in">
             <form onSubmit={handleSubmit}>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do Artigo" className="text-4xl font-bold text-[var(--c-text-head)] w-full bg-transparent outline-none mb-4" required />
                <input type="text" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Tópicos > Sub-tópicos (use ';' para múltiplos caminhos)" className="input-styled w-full mb-6" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6">
                    <div className="lg:col-span-8">
                        <h3 className="text-xl font-semibold mb-2 text-[var(--c-text-head)]">Conteúdo Principal</h3>
                        <div className="h-96 mb-12"><ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} className="h-full" /></div>
                    </div>
                    <div className="lg:col-span-4"><h3 className="text-xl font-semibold mb-2 text-[var(--c-text-head)]">Informações Gerais</h3><div className="space-y-4 p-4 border border-[var(--c-border)] rounded-lg bg-[var(--c-background)]"><div><label className="block text-sm font-semibold text-[var(--c-text-subtle)] mb-1">Resumo</label><textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows="3" placeholder="Um breve resumo." className="input-styled w-full text-sm" /></div><div><label className="block text-sm font-semibold text-[var(--c-text-subtle)] mb-1">URL da Imagem</label><input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="input-styled w-full text-sm" /></div><div><label className="block text-sm font-semibold text-[var(--c-text-subtle)] mb-2">Dados Importantes</label><div className="space-y-2">{infobox.map((item, index) => (<div key={index} className="flex items-center gap-2"><input type="text" value={item.key} onChange={(e) => handleInfoboxChange(index, 'key', e.target.value)} placeholder="Chave" className="input-styled w-1/2 text-sm" /><input type="text" value={item.value} onChange={(e) => handleInfoboxChange(index, 'value', e.target.value)} placeholder="Valor" className="input-styled w-1/2 text-sm" /><button type="button" onClick={() => removeInfoboxItem(index)} className="text-red-500 hover:text-red-400 p-1">&times;</button></div>))}</div><button type="button" onClick={addInfoboxItem} className="text-sm text-[var(--c-primary)] hover:underline mt-2">+ Adicionar</button></div></div></div>
                </div>
                <div><h3 className="text-xl font-semibold mb-2 text-[var(--c-text-head)]">Referências</h3><textarea value={references} onChange={(e) => setReferences(e.target.value)} placeholder="Liste suas fontes e referências aqui." rows="4" className="input-styled w-full font-mono text-sm" /></div>
                <div className="mt-8 flex justify-between"><div>{article?.id && <button type="button" onClick={() => setShowDeleteConfirm(true)} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-500">Excluir</button>}</div><div className="flex space-x-3"><button type="button" onClick={onCancel} className="bg-transparent border border-[var(--c-border)] text-[var(--c-text-main)] font-semibold py-2 px-4 rounded-md hover:bg-[var(--c-border)]">Cancelar</button><button type="submit" className="bg-[var(--c-primary)] text-white font-bold py-2 px-4 rounded-md hover:brightness-110">Salvar Artigo</button></div></div>
            </form>
            <ConfirmationModal isOpen={showDeleteConfirm} title="Excluir Artigo" message="Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita." onConfirm={() => { onDelete(article.id); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)} />
        </div>
    );
};

const TopicNode = ({ topicName, topicData, onSelectArticle, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasSubtopics = Object.keys(topicData.__subtopics).length > 0;
    const hasArticles = topicData.__articles.length > 0;

    if (!hasSubtopics && !hasArticles) return null;

    return (
        <div style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center w-full text-left p-1 rounded-md hover:bg-[var(--c-surface)]">
                {hasSubtopics && <ChevronRightIcon className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                <span className="font-bold text-[var(--c-text-head)]">{topicName}</span>
            </button>
            {isExpanded && (
                <div className="pl-2 border-l border-[var(--c-border)] ml-2">
                    {topicData.__articles.map(article => <button key={article.id} onClick={() => onSelectArticle(article)} className="block w-full text-left p-1 rounded-md text-[var(--c-text-main)] hover:bg-[var(--c-surface)]">{article.title}</button>)}
                    {Object.entries(topicData.__subtopics).sort(([a], [b]) => a.localeCompare(b)).map(([subTopicName, subTopicData]) => (
                        <TopicNode key={subTopicName} topicName={subTopicName} topicData={subTopicData} onSelectArticle={onSelectArticle} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const WikiSidebar = ({ isOpen, onClose, articles, onSelectArticle, onCreateNew, searchTerm, onSearchChange, userCanCreate }) => {
    const topicTree = useMemo(() => {
        const tree = { __subtopics: {}, __articles: [] };
        articles.forEach(article => {
            (article.topics || []).forEach(topicPath => {
                const parts = topicPath.split('>').map(p => p.trim());
                let currentNode = tree;
                parts.forEach(part => {
                    if (!currentNode.__subtopics[part]) {
                        currentNode.__subtopics[part] = { __subtopics: {}, __articles: [] };
                    }
                    currentNode = currentNode.__subtopics[part];
                });
                if (!currentNode.__articles.find(a => a.id === article.id)) {
                    currentNode.__articles.push(article);
                }
            });
        });
        return tree;
    }, [articles]);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) || (a.content && a.content.toLowerCase().includes(searchTerm.toLowerCase())));
    }, [searchTerm, articles]);

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <aside className={`fixed top-0 left-0 h-full w-80 bg-[var(--c-background)] border-r border-[var(--c-border)] shadow-2xl p-6 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-[var(--c-text-head)]">Navegação</h2><button onClick={onClose} className="text-[var(--c-text-subtle)] hover:text-[var(--c-primary)]"><XIcon /></button></div>
                <div className="relative mb-4"><SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--c-text-subtle)]" /><input type="search" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} placeholder="Pesquisar..." className="input-styled w-full pl-10"/></div>
                {userCanCreate && <button onClick={onCreateNew} className="w-full bg-[var(--c-primary)] text-white font-bold py-2 px-4 rounded-md hover:brightness-110 flex items-center justify-center gap-2 mb-4"><PlusIcon /> Novo Artigo</button>}
                <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                    {searchTerm ? (
                        <div><h3 className="font-bold text-[var(--c-text-head)] mb-2">Resultados</h3>{searchResults.map(article => <button key={article.id} onClick={() => onSelectArticle(article)} className="block w-full text-left text-[var(--c-primary)] hover:underline p-1">{article.title}</button>)}</div>
                    ) : (
                        Object.entries(topicTree.__subtopics).sort(([a], [b]) => a.localeCompare(b)).map(([topicName, topicData]) => (
                            <TopicNode key={topicName} topicName={topicName} topicData={topicData} onSelectArticle={onSelectArticle} />
                        ))
                    )}
                </div>
            </aside>
        </>
    );
};

const HomePage = ({ onCreateNew, onGoToNotes, userCanCreate }) => (
    <div className="text-center mt-10 sm:mt-20 p-6 animate-fade-in">
        <h1 className="text-5xl font-bold text-[var(--c-text-head)]">Seu Segundo Cérebro</h1>
        <p className="max-w-2xl mx-auto mt-4 text-lg text-[var(--c-text-subtle)]">
            Um espaço para capturar, conectar e cultivar seu conhecimento. Transforme pensamentos dispersos em uma rede de ideias interligadas.
        </p>
        <div className="mt-8 flex justify-center gap-4">
            {userCanCreate && <button onClick={() => onCreateNew()} className="bg-[var(--c-primary)] text-white font-bold py-3 px-6 rounded-md hover:brightness-110 transition-transform hover:scale-105">Criar Primeiro Artigo</button>}
            <button onClick={onGoToNotes} className="bg-transparent border border-[var(--c-border)] text-[var(--c-text-main)] font-semibold py-3 px-6 rounded-md hover:bg-[var(--c-surface)] transition-transform hover:scale-105">Ver Suas Notas</button>
        </div>
    </div>
);

const WikiView = ({ articles, onSave, onDelete, richTextLibs, selectedArticle, isEditing, editingArticle, onEdit, onLinkClick, onCreateNew, onCancelEdit, onGoToNotes, userCanCreate }) => (
    <div>
        <main>
            {isEditing && <ArticleEditor article={editingArticle} onSave={onSave} onCancel={onCancelEdit} onDelete={onDelete} richTextLibs={richTextLibs} />}
            {selectedArticle && !isEditing && <ArticleDisplay article={selectedArticle} articles={articles} onEdit={onEdit} onLinkClick={onLinkClick} onCreateNew={onCreateNew} userCanCreate={userCanCreate}/>}
            {!isEditing && !selectedArticle && <HomePage onCreateNew={onCreateNew} onGoToNotes={onGoToNotes} userCanCreate={userCanCreate}/>}
        </main>
    </div>
);

const NoteEditor = ({ note, onSave, onDelete, wikiArticles, onArticleLink, richTextLibs }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const { ReactQuill } = richTextLibs || {};

    const modules = useMemo(() => ({
        toolbar: [['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet'}], [{ 'align': [] }], [{ 'script': 'sub'}, { 'script': 'super' }], ['clean']],
    }), []);

    useEffect(() => {
        if (note) { setTitle(note.title || ''); setContent(note.content || ''); } 
        else { setTitle(''); setContent(''); }
    }, [note]);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
        if (note) onSave({ ...note, title: e.target.value, content });
    };

    const handleContentChange = (newContent) => {
        setContent(newContent);
        if (note) onSave({ ...note, title, content: newContent });
    };

    if (!ReactQuill) return <div className="text-center p-10">Carregando editor...</div>;

    return (
        <div className="bg-[var(--c-surface)] p-4 sm:p-6 rounded-lg shadow-xl border border-[var(--c-border)] h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-[var(--c-border)]">
                <input type="text" value={title} onChange={handleTitleChange} placeholder="Título da Nota" className="text-2xl font-bold bg-transparent outline-none w-full text-[var(--c-text-head)]" />
                <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full"><TrashIcon /></button>
            </div>
            <div className="flex-grow h-0"><ReactQuill theme="snow" value={content} onChange={handleContentChange} modules={modules} className="h-full" /></div>
            <div className="pt-6 mt-4"><ConnectionsDisplay text={content} title={title} wikiArticles={wikiArticles} onArticleLink={onArticleLink} /></div>
            <ConfirmationModal isOpen={showDeleteConfirm} title="Excluir Nota" message="Tem certeza que deseja excluir esta nota?" onConfirm={() => { onDelete(note.id); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)} />
        </div>
    );
};

const NotesView = ({ notes, wikiArticles, onSave, onDelete, onArticleLink, richTextLibs, userCanCreate }) => {
    const [selectedNote, setSelectedNote] = useState(null);

    useEffect(() => {
        if (!selectedNote && notes.length > 0) setSelectedNote(notes[0]);
        if(selectedNote && !notes.find(n => n.id === selectedNote.id)) setSelectedNote(notes.length > 0 ? notes[0] : null);
    }, [notes, selectedNote]);
    
    const handleCreateNewNote = async () => {
        const newNote = { title: 'Nova Nota', content: '', type:'note' };
        const newId = await onSave(newNote);
        if(newId) setSelectedNote({id: newId, ...newNote});
    };

    const handleDeleteNote = (noteId) => {
        onDelete(noteId);
        if(selectedNote?.id === noteId){
            const currentIndex = notes.findIndex(n => n.id === noteId);
            setSelectedNote(notes.length > 1 ? notes[currentIndex === 0 ? 1 : currentIndex - 1] : null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
            <aside className="md:col-span-1 bg-[var(--c-surface)] p-4 rounded-lg border border-[var(--c-border)] flex flex-col">
                <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-[var(--c-text-head)]">Todas as Notas</h2>{userCanCreate && <button onClick={handleCreateNewNote} className="p-2 text-[var(--c-text-subtle)] hover:text-[var(--c-primary)]"><PlusIcon /></button>}</div>
                <div className="flex-grow overflow-y-auto space-y-2">
                    {notes.map(note => (
                        <button key={note.id} onClick={() => setSelectedNote(note)} className={`w-full text-left p-3 rounded-md transition-colors ${selectedNote?.id === note.id ? 'bg-[color-mix(in_srgb,_var(--c-primary)_20%,_transparent)] text-[var(--c-text-head)]' : 'hover:bg-[var(--c-background)]'}`}>
                            <h3 className="font-semibold truncate">{note.title || 'Nota sem título'}</h3>
                            <p className="text-xs text-[var(--c-text-subtle)] truncate">{note.content.replace(/<[^>]*>/g, '') || 'Vazio'}</p>
                        </button>
                    ))}
                </div>
            </aside>
            <main className="md:col-span-3">
                {selectedNote ? <NoteEditor note={selectedNote} onSave={onSave} onDelete={handleDeleteNote} wikiArticles={wikiArticles} onArticleLink={onArticleLink} richTextLibs={richTextLibs} />
                : (<div className="flex items-center justify-center h-full bg-[var(--c-surface)] rounded-lg border-2 border-dashed border-[var(--c-border)]"><div className="text-center"><h2 className="text-xl font-semibold text-[var(--c-text-head)]">Nenhuma nota selecionada</h2><p className="mt-2 text-[var(--c-text-subtle)]">Crie uma nova nota ou selecione uma da lista para começar.</p></div></div>)}
            </main>
        </div>
    );
};

// --- TELA DE LOGIN (NOVO COMPONENTE) ---
const LoginScreen = ({ auth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Falha ao fazer login. Verifique seu e-mail e senha.');
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-[var(--c-surface)] rounded-lg shadow-xl border border-[var(--c-border)] animate-fade-in">
                <h1 className="text-3xl font-bold text-center text-[var(--c-text-head)]">Login</h1>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-[var(--c-text-subtle)]">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-styled w-full mt-1"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-[var(--c-text-subtle)]">Senha</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-styled w-full mt-1"/>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full bg-[var(--c-primary)] text-white font-bold py-2 px-4 rounded-md hover:brightness-110">Entrar</button>
                </form>
            </div>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL ---

export default function App() {
    const [theme, setTheme] = useState('dark');
    const [view, setView] = useState('wiki');
    const [allDocs, setAllDocs] = useState([]);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                const firebaseConfig = {
                  apiKey: "AIzaSyD3FkFfk_3_FmdHMMKDCVEeXU0Z4bzgBew",
                  authDomain: "meu-segundo-cerebro-9760b.firebaseapp.com",
                  projectId: "meu-segundo-cerebro-9760b",
                  storageBucket: "meu-segundo-cerebro-9760b.firebasestorage.app",
                  messagingSenderId: "1021335545563",
                  appId: "1:1021335545563:web:9a2b183edb1f769b6ecefe",
                  measurementId: "G-TCGP6JCETV"
                };

                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                setAuth(authInstance);
                setDb(getFirestore(app)); 
                await setPersistence(authInstance, browserLocalPersistence);
                
                onAuthStateChanged(authInstance, (user) => { 
                    setUser(user);
                });
            } catch (e) { console.error("Initialization error:", e); }
        };
        initialize();
    }, []);

    useEffect(() => {
        if (!db || !user) {
            setAllDocs([]);
            return;
        }
        const appId = 'personal-wiki-app-react-v2';
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'docs'));
        const unsub = onSnapshot(q, s => setAllDocs(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.error(e)); return unsub;
    }, [db, user]);

    useEffect(() => { document.documentElement.className = theme; }, [theme]);

    const handleSelectArticle = useCallback((article) => {
        setSelectedArticle(article); setIsEditing(false); setEditingArticle(null); setSearchTerm(''); setIsSidebarOpen(false);
    }, []);
    
    const handleLogout = async () => {
        if(auth) await signOut(auth);
    }

    const handleEdit = (article) => {
        setEditingArticle(article); setIsEditing(true); setSelectedArticle(null);
    };
    
    const handleCreateNew = (title = '') => {
        setEditingArticle({ title, topics: [], content: '', summary: '', imageUrl: '', infobox: [], references: '' });
        setIsEditing(true); setSelectedArticle(null); setIsSidebarOpen(false);
    };

    const handleCancelEdit = () => { setIsEditing(false); setEditingArticle(null); };

    const getDocsCollectionRef = useCallback(() => collection(db, 'personal-wiki-app-react-v2', 'users', user.uid, 'docs'), [db, user]);
    
    const handleSaveDoc = async (docData) => {
        if (!db || !user) return null;
        const { id, ...dataToSave } = docData; 
        const docType = dataToSave.type || (view === 'wiki' ? 'wiki' : 'note');
        let docToSave = { ...dataToSave, type: docType, updatedAt: serverTimestamp() };
        if (!id) docToSave = { ...docToSave, authorId: user.uid, location: 'Brasil', createdAt: serverTimestamp() };
        
        try { 
            if (id) { await setDoc(doc(getDocsCollectionRef(), id), docToSave, { merge: true }); return id; } 
            const ref = await addDoc(getDocsCollectionRef(), docToSave); 
            if (docType === 'wiki') { handleSelectArticle({ id: ref.id, ...docToSave, createdAt: new Date() }); }
            return ref.id; 
        } catch (e) { console.error(e); return null; }
    };

    const handleSaveFromEditor = async (articleData) => {
        await handleSaveDoc(articleData); setIsEditing(false); setEditingArticle(null);
    };

    const handleDeleteDoc = async (docId) => { 
        if (!db || !user || !docId) return; 
        if(selectedArticle?.id === docId) setSelectedArticle(null);
        try { await deleteDoc(doc(getDocsCollectionRef(), docId)); } catch (e) { console.error(e); } 
    };

    const handleArticleLink = (article) => { setView('wiki'); handleSelectArticle(article); };
    
    const wikiArticles = useMemo(() => allDocs.filter(d => d.type === 'wiki').sort((a,b) => (a.title || '').localeCompare(b.title || '')), [allDocs]);
    const ideaNotes = useMemo(() => allDocs.filter(d => d.type === 'note').sort((a,b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)), [allDocs]);

    if (!auth) {
        return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
    }
    
    if (!user) {
        return <LoginScreen auth={auth} />
    }
    
    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen">
                <header className="bg-[var(--c-surface)]/80 backdrop-blur-sm sticky top-0 z-20 border-b border-[var(--c-border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            {view === 'wiki' && <button onClick={() => setIsSidebarOpen(true)} className="text-[var(--c-text-subtle)] hover:text-[var(--c-primary)]"><MenuIcon /></button>}
                           <h1 className="text-xl font-bold text-[var(--c-text-head)]">Segundo Cérebro</h1>
                           <div className="bg-[var(--c-background)] p-1 rounded-md flex space-x-1 border border-[var(--c-border)]">
                                <button onClick={() => { setView('wiki'); setSelectedArticle(null); setIsEditing(false); }} className={`flex items-center gap-2 whitespace-nowrap py-1 px-3 rounded-md font-semibold text-sm transition-colors ${view === 'wiki' ? 'bg-[var(--c-surface)] text-[var(--c-text-head)] shadow-sm' : 'text-[var(--c-text-subtle)] hover:bg-[var(--c-surface)]/50'}`}><BookOpenIcon /> Wiki</button>
                                <button onClick={() => setView('notes')} className={`flex items-center gap-2 whitespace-nowrap py-1 px-3 rounded-md font-semibold text-sm transition-colors ${view === 'notes' ? 'bg-[var(--c-surface)] text-[var(--c-text-head)] shadow-sm' : 'text-[var(--c-text-subtle)] hover:bg-[var(--c-surface)]/50'}`}><LightbulbIcon /> Notas</button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="text-[var(--c-text-subtle)] hover:text-[var(--c-primary)] bg-[var(--c-surface)] p-2 rounded-full border border-[var(--c-border)]">
                                {theme === 'light' ? <MoonIcon/> : <SunIcon/>}
                            </button>
                            <div className="text-xs text-[var(--c-text-subtle)] flex items-center gap-2">
                               {user.email}
                               <button onClick={handleLogout} className="p-1 text-red-500 hover:text-red-400"><LogOutIcon /></button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {view === 'wiki' && (
                        <>
                             <WikiSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} articles={wikiArticles} onSelectArticle={handleSelectArticle} onCreateNew={handleCreateNew} searchTerm={searchTerm} onSearchChange={setSearchTerm} userCanCreate={true}/>
                             <WikiView articles={wikiArticles} onSave={handleSaveFromEditor} onDelete={handleDeleteDoc} richTextLibs={{ ReactQuill }} selectedArticle={selectedArticle} isEditing={isEditing} editingArticle={editingArticle} onEdit={handleEdit} onLinkClick={handleArticleLink} onCreateNew={handleCreateNew} onCancelEdit={handleCancelEdit} onGoToNotes={() => setView('notes')} userCanCreate={true}/>
                        </>
                    )}
                    {view === 'notes' && <NotesView notes={ideaNotes} wikiArticles={wikiArticles} onSave={handleSaveDoc} onDelete={handleDeleteDoc} onArticleLink={handleArticleLink} richTextLibs={{ ReactQuill }} userCanCreate={true} />}
                </main>
            </div>
        </>
    );
}