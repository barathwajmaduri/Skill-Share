import React, { useState } from 'react';
import { User } from '../db';
import { X, GraduationCap, BookOpen, Save } from 'lucide-react';

interface EditSkillsModalProps {
  user: User;
  onClose: () => void;
  onSave: (skillsToTeach: string[], skillsToLearn: string[]) => void;
}

export default function EditSkillsModal({ user, onClose, onSave }: EditSkillsModalProps) {
  const [skillsToTeach, setSkillsToTeach] = useState<string[]>(user.skillsToTeach || []);
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>(user.skillsToLearn || []);
  const [newTeachSkill, setNewTeachSkill] = useState('');
  const [newLearnSkill, setNewLearnSkill] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSkill = (
    e: React.KeyboardEvent<HTMLInputElement>, 
    list: string[], 
    setList: (l: string[]) => void, 
    value: string, 
    setValue: (v: string) => void
  ) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      if (!list.includes(value.trim())) {
        setList([...list, value.trim()]);
      }
      setValue('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.filter(skill => skill !== skillToRemove));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Assuming we have an endpoint to update user profile
      const response = await fetch(`/api/users/${user.id}/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillsToTeach, skillsToLearn }),
      });

      if (response.ok) {
        onSave(skillsToTeach, skillsToLearn);
        onClose();
      } else {
        console.error('Failed to update skills');
      }
    } catch (error) {
      console.error('Error updating skills:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 font-jakarta">
      <div className="absolute inset-0 bg-earthy-dark/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-fraunces font-bold text-slate-900">Edit Your Skills</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-bold text-earthy-dark mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-earthy-green" />
                I can teach...
              </span>
              <div className="flex flex-wrap gap-2 p-3 border border-slate-200 bg-slate-50 rounded-xl focus-within:bg-white focus-within:border-earthy-green focus-within:ring-1 focus-within:ring-earthy-green transition-all">
                {skillsToTeach.map(skill => (
                  <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-earthy-green/10 text-earthy-green text-sm font-bold">
                    {skill}
                    <button 
                      className="hover:text-red-500 transition-colors flex items-center justify-center" 
                      type="button"
                      onClick={() => handleRemoveSkill(skill, skillsToTeach, setSkillsToTeach)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input 
                  className="flex-1 min-w-[150px] border-none focus:ring-0 text-sm py-1 px-2 outline-none bg-transparent" 
                  placeholder="Add a skill (Press Enter)..." 
                  type="text"
                  value={newTeachSkill}
                  onChange={(e) => setNewTeachSkill(e.target.value)}
                  onKeyDown={(e) => handleAddSkill(e, skillsToTeach, setSkillsToTeach, newTeachSkill, setNewTeachSkill)}
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-earthy-dark mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-earthy-rust" />
                I want to learn...
              </span>
              <div className="flex flex-wrap gap-2 p-3 border border-slate-200 bg-slate-50 rounded-xl focus-within:bg-white focus-within:border-earthy-rust focus-within:ring-1 focus-within:ring-earthy-rust transition-all">
                {skillsToLearn.map(skill => (
                  <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-earthy-rust/10 text-earthy-rust text-sm font-bold">
                    {skill}
                    <button 
                      className="hover:text-red-500 transition-colors flex items-center justify-center" 
                      type="button"
                      onClick={() => handleRemoveSkill(skill, skillsToLearn, setSkillsToLearn)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input 
                  className="flex-1 min-w-[150px] border-none focus:ring-0 text-sm py-1 px-2 outline-none bg-transparent" 
                  placeholder="Add a skill (Press Enter)..." 
                  type="text"
                  value={newLearnSkill}
                  onChange={(e) => setNewLearnSkill(e.target.value)}
                  onKeyDown={(e) => handleAddSkill(e, skillsToLearn, setSkillsToLearn, newLearnSkill, setNewLearnSkill)}
                />
              </div>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-earthy-dark text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
