'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Settings, 
  Wine, 
  Tv, 
  Video, 
  Smartphone, 
  AlertCircle, 
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getFiestaActivaDeHoy, getFiestas } from '@/app/actions/fiesta-actual';

interface KioskSetupProps {
  defaultRole: 'barra' | 'muro-en-vivo' | 'plataforma-360' | 'totem';
}

export function KioskSetup({ defaultRole }: KioskSetupProps) {
  const router = useRouter();
  
  // Loading and State
  const [status, setStatus] = useState<'checking' | 'setup' | 'redirecting'>('checking');
  const [fiestas, setFiestas] = useState<any[]>([]);
  const [selectedFiestaId, setSelectedFiestaId] = useState('');
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Totem custom identifier
  const [totemId, setTotemId] = useState('totem-1');

  useEffect(() => {
    // 1. Check if device is already locked in localStorage
    const savedFiestaId = localStorage.getItem('kiosk_locked_fiesta_id');
    const savedRole = localStorage.getItem('kiosk_role');
    const savedTotemId = localStorage.getItem('kiosk_totem_id') || 'totem-1';

    if (savedFiestaId && savedRole) {
      setStatus('redirecting');
      navigateToRole(savedRole, savedFiestaId, savedTotemId);
      return;
    }

    // 2. Otherwise, check if today has an active event scheduled
    async function checkTodayEvent() {
      try {
        const result = await getFiestaActivaDeHoy();
        if (result.success && result.fiestaId) {
          setStatus('redirecting');
          navigateToRole(defaultRole, result.fiestaId, totemId);
        } else {
          // No event scheduled for today, enter setup mode
          loadFiestaOptions();
        }
      } catch (err) {
        console.error('Error auto-detecting today\'s event:', err);
        loadFiestaOptions();
      }
    }
    
    checkTodayEvent();
  }, [defaultRole]);

  const loadFiestaOptions = async () => {
    try {
      const allFiestas = await getFiestas(false);
      // Sort by date descending
      const sorted = [...allFiestas].sort((a, b) => 
        new Date(b.configuracion?.fechaEvento || 0).getTime() - 
        new Date(a.configuracion?.fechaEvento || 0).getTime()
      );
      setFiestas(sorted);
      if (sorted.length > 0) {
        setSelectedFiestaId(sorted[0].id);
      }
      setStatus('setup');
    } catch (err) {
      setErrorMessage('No se pudieron cargar los eventos del servidor.');
      setStatus('setup');
    }
  };

  const navigateToRole = (role: string, fiestaId: string, totem: string) => {
    if (role === 'totem') {
      router.push(`/evento/totem/${fiestaId}/${totem}`);
    } else {
      router.push(`/evento/${role}/${fiestaId}`);
    }
  };

  const handleLockDevice = () => {
    if (!selectedFiestaId) {
      setErrorMessage('Por favor selecciona un evento.');
      return;
    }
    
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setErrorMessage('El PIN debe ser de 4 dígitos numéricos.');
      return;
    }

    if (pin !== confirmPin) {
      setErrorMessage('Los PINs ingresados no coinciden.');
      return;
    }

    // Lock the configuration
    localStorage.setItem('kiosk_locked_fiesta_id', selectedFiestaId);
    localStorage.setItem('kiosk_role', selectedRole);
    localStorage.setItem('kiosk_pin', pin);
    if (selectedRole === 'totem') {
      localStorage.setItem('kiosk_totem_id', totemId);
    }

    setStatus('redirecting');
    navigateToRole(selectedRole, selectedFiestaId, totemId);
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center rounded-3xl bg-purple-500/10 border border-purple-500/30 shadow-2xl">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-widest uppercase text-purple-400">Modo Kiosco AK</h2>
            <p className="text-slate-400 max-w-sm">Detectando fiesta activa programada para hoy...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === 'redirecting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
          <p className="text-emerald-400 font-bold uppercase tracking-widest">Abriendo pantalla operativa...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#09090b_70%)] text-white flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <Card className="bg-slate-900/80 border-slate-800 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-white">Configuración de Kiosco</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Vincula esta tablet o pantalla a un rol específico del salón y bloquéala de forma segura.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Step 1: Select Fiesta */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Seleccionar Evento / Fiesta</label>
              {fiestas.length > 0 ? (
                <select
                  value={selectedFiestaId}
                  onChange={(e) => setSelectedFiestaId(e.target.value)}
                  className="w-full h-12 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-medium"
                >
                  {fiestas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.configuracion?.nombreEvento || 'Fiesta sin nombre'} ({f.configuracion?.fechaEvento || 'Sin fecha'})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-slate-500 text-xs py-2">No se encontraron eventos activos en el sistema.</p>
              )}
            </div>

            {/* Step 2: Choose Kiosk Role */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Rol del Dispositivo</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'barra', label: 'Barra de Tragos', icon: Wine, color: 'hover:border-rose-500/50 hover:bg-rose-500/5' },
                  { id: 'muro-en-vivo', label: 'Muro Social', icon: Tv, color: 'hover:border-blue-500/50 hover:bg-blue-500/5' },
                  { id: 'plataforma-360', label: 'Plataforma 360', icon: Video, color: 'hover:border-purple-500/50 hover:bg-purple-500/5' },
                  { id: 'totem', label: 'Tótem LED', icon: Smartphone, color: 'hover:border-emerald-500/50 hover:bg-emerald-500/5' }
                ].map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRole(role.id as any);
                        setErrorMessage('');
                      }}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border text-center transition-all ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5 text-purple-300' 
                          : 'border-slate-800 bg-slate-950 text-slate-400 ' + role.color
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Totem customization */}
            {selectedRole === 'totem' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Identificador del Tótem</label>
                <Input
                  value={totemId}
                  onChange={(e) => setTotemId(e.target.value)}
                  placeholder="ej. totem-principal o totem-entrada"
                  className="bg-slate-950 border-slate-800 text-sm h-12"
                />
              </motion.div>
            )}

            {/* Step 3: Set Security PIN */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                3. PIN de Administrador (4 dígitos)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nuevo PIN"
                  className="bg-slate-950 border-slate-800 text-center text-lg tracking-[0.2em] font-bold h-12"
                />
                <Input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirmar PIN"
                  className="bg-slate-950 border-slate-800 text-center text-lg tracking-[0.2em] font-bold h-12"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 pb-6 flex flex-col gap-3">
            <Button
              onClick={handleLockDevice}
              className="w-full h-14 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base shadow-xl shadow-purple-600/10 flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Bloquear y Lanzar Kiosco
            </Button>
            <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider">
              Una vez bloqueada, la app no mostrará navegación y requerirá este PIN para configurarla nuevamente.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
