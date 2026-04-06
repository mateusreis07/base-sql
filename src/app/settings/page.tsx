'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, Save, ChevronRight, Briefcase, Plus, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { updateUserCargo, changeUserPassword } from '@/app/actions/user';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [cargo, setCargo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Estados para troca de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Visibilidade das senhas
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setCargo((session.user as any).cargo || '');
    }
  }, [session]);

  const handleSaveCargo = async () => {
    setIsSaving(true);
    try {
      await updateUserCargo(cargo);
      await update({ cargo });
      toast.success('Cargo atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = (pass: string) => {
    return {
      length: pass.length >= 8 && pass.length <= 12,
      hasUpper: /[A-Z]/.test(pass),
      hasLower: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass)
    };
  };

  const passwordValidity = validatePassword(passwordForm.newPassword);
  const isPasswordStrong = Object.values(passwordValidity).every(Boolean);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error('Preencha todos os campos de senha');
    }

    if (!isPasswordStrong) {
      return toast.error('A nova senha não atende aos requisitos de segurança');
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('As novas senhas não coincidem');
    }

    setIsChangingPassword(true);
    try {
      const result = await changeUserPassword(passwordForm);
      if (result.success) {
        toast.success('Senha alterada com sucesso!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 mb-2">
            <Link href="/" className="hover:text-blue-400 transition-colors text-xs font-bold uppercase tracking-widest">Início</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/perfil" className="hover:text-blue-400 transition-colors text-xs font-bold uppercase tracking-widest">Perfil</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">Configurações</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center justify-center md:justify-start gap-3">
          <Settings className="w-8 h-8 text-blue-500" />
          Ajustes de Conta
        </h1>
        <p className="text-slate-500 mt-1 text-sm font-medium uppercase tracking-wider">Gerencie sua identidade e segurança na plataforma.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Seção de Perfil / Cargo */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="max-w-2xl">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
               <Briefcase className="w-5 h-5 text-blue-500" />
               Identidade Profissional
            </h3>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Seu Cargo ou Atribuição Principal
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Desenvolvedor Senior, DBA..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium placeholder:text-slate-700"
                />
                <button 
                  onClick={handleSaveCargo}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap"
                >
                  {isSaving ? 'Salvando...' : 'Atualizar'}
                </button>
              </div>
              <p className="text-[10px] text-slate-600 italic">
                Este cargo será exibido publicamente no seu perfil para outros membros da equipe.
              </p>
            </div>
          </div>
        </div>

        {/* Seção de Segurança / Senha */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="max-w-2xl">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
               <Plus className="w-5 h-5 text-red-500 rotate-45" /> {/* Usando Plus rotacionado como X/Shield alternativo ou Lock se disponível */}
               Segurança da Conta
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha Atual</label>
                  <div className="relative group/field">
                    <input 
                      type={showCurrent ? "text" : "password"}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onMouseDown={() => setShowCurrent(true)}
                      onMouseUp={() => setShowCurrent(false)}
                      onMouseLeave={() => setShowCurrent(false)}
                      onTouchStart={() => setShowCurrent(true)}
                      onTouchEnd={() => setShowCurrent(false)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 p-1 transition-colors"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nova Senha</label>
                  <div className="relative">
                    <input 
                      type={showNew ? "text" : "password"}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className={`w-full bg-slate-950 border ${isPasswordStrong ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-slate-800 focus:border-blue-500'} rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium`}
                    />
                    <button
                      type="button"
                      onMouseDown={() => setShowNew(true)}
                      onMouseUp={() => setShowNew(false)}
                      onMouseLeave={() => setShowNew(false)}
                      onTouchStart={() => setShowNew(true)}
                      onTouchEnd={() => setShowNew(false)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 p-1 transition-colors"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password Composition Info */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight ${passwordValidity.length ? 'text-emerald-500' : 'text-slate-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordValidity.length ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                        Entre 8 e 12 caracteres
                    </div>
                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight ${passwordValidity.hasUpper ? 'text-emerald-500' : 'text-slate-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordValidity.hasUpper ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                        Letras Maiúsculas
                    </div>
                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight ${passwordValidity.hasLower ? 'text-emerald-500' : 'text-slate-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordValidity.hasLower ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                        Letras Minúsculas
                    </div>
                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight ${passwordValidity.hasNumber ? 'text-emerald-500' : 'text-slate-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordValidity.hasNumber ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                        Números
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input 
                      type={showConfirm ? "text" : "password"}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className={`w-full bg-slate-950 border ${passwordForm.confirmPassword ? (passwordForm.newPassword === passwordForm.confirmPassword ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-red-500/50 focus:border-red-500') : 'border-slate-800 focus:border-blue-500'} rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium`}
                    />
                    <button
                      type="button"
                      onMouseDown={() => setShowConfirm(true)}
                      onMouseUp={() => setShowConfirm(false)}
                      onMouseLeave={() => setShowConfirm(false)}
                      onTouchStart={() => setShowConfirm(true)}
                      onTouchEnd={() => setShowConfirm(false)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 p-1 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter mt-1 italic animate-in fade-in slide-in-from-top-1">
                      As senhas não coincidem
                    </p>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isChangingPassword}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all border border-slate-700 active:scale-95"
              >
                {isChangingPassword ? 'Alterando...' : (
                  <>
                    <Save className="w-4 h-4" />
                    Alterar Senha
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-slate-950/30 border border-dashed border-slate-800 rounded-3xl p-8 py-6 flex items-center justify-between opacity-60">
            <p className="text-xs text-slate-500 font-medium">Outras configurações de privacidade e notificações serão habilitadas em versões futuras.</p>
            <span className="text-[10px] font-black bg-slate-800 text-slate-500 px-2 py-1 rounded uppercase tracking-tighter">Versão 1.5.0</span>
        </div>
      </div>
    </div>
  );
}
