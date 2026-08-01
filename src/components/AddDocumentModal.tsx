import React, { useState } from 'react';
import { AgentDoc } from '../types';
import { X, FileText, Plus, Check } from 'lucide-react';

interface AddDocumentModalProps {
  agentName: string;
  roleName: string;
  onAddDoc: (doc: AgentDoc) => void;
  onClose: () => void;
}

export function AddDocumentModal({ agentName, roleName, onAddDoc, onClose }: AddDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [category, setCategory] = useState<AgentDoc['category']>('custom');
  const [content, setContent] = useState('');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!filename || filename === `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`) {
      const sanitized = val.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      setFilename(sanitized ? `${sanitized}.md` : '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalFilename = filename.trim();
    if (!finalFilename) {
      finalFilename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`;
    } else if (!finalFilename.endsWith('.md')) {
      finalFilename += '.md';
    }

    const defaultContent = content.trim() || `# ${title}\n\n**Author**: ${agentName} (${roleName})\n**Category**: ${category.toUpperCase()}\n\n## Overview\nDocument content goes here...`;

    const newDoc: AgentDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      filename: finalFilename,
      category,
      content: defaultContent,
      updatedAt: Date.now()
    };

    onAddDoc(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Add New Document</h3>
              <p className="text-xs text-neutral-500">For {agentName} ({roleName})</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              Document Title *
            </label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Procedural Safety Protocol, API Gateway Spec"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Filename (.md)
              </label>
              <input 
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="safety_protocol.md"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-mono outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AgentDoc['category'])}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
              >
                <option value="custom">Custom Markdown File</option>
                <option value="design_principles">Design Principles</option>
                <option value="architecture">Architecture Spec</option>
                <option value="procedural">Procedural Memory</option>
                <option value="episodic">Episodic Memory</option>
                <option value="sprint_planning">Sprint Planning</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              Initial Markdown Content (Optional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="# Initial Header&#10;&#10;Write initial markdown notes or documentation..."
              className="w-full bg-neutral-900 font-mono text-xs text-neutral-100 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
