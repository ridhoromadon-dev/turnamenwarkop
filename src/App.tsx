import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Phone, 
  User, 
  ShieldCheck,
  Search,
  Download,
  Image as ImageIcon,
  LogOut,
  Palette,
  Bell
} from 'lucide-react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  setDoc,
  getDoc,
  getDocs,
  where,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { cn, DEFAULT_THEMES, handleFirestoreError } from './lib/utils';
import { 
  ThemeType, 
  UserProfile, 
  Testimonial, 
  TournamentSettings, 
  OperationType,
  CustomTheme,
  ThemeConfig,
  Task,
  Notification
} from './types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Navbar ---
const Navbar = ({ theme, config, user, onLogout, setActiveView }: { 
  theme: ThemeType,
  config: ThemeConfig,
  user: UserProfile | null, 
  onLogout: () => void,
  setActiveView: (view: string) => void
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b", config.navbar)}>
      <div className="max-w-7xl mx-auto px-6 h-[80px] flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setActiveView('home')}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg transition-transform group-hover:scale-110", config.primary.split(' ')[0])}>T</div>
          <span className={cn("font-black text-xl tracking-tighter uppercase", config.text)}>Turnamate</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          {['Menu', 'Paket', 'Kategori', 'Jasa', 'Testimoni'].map((item) => (
            <button 
              key={item} 
              className={cn("text-sm font-semibold transition-colors hover:text-sky-400", config.text)}
              onClick={() => {
                if (item === 'Testimoni') setActiveView('testimonials');
                else setActiveView('home');
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono opacity-50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB (Jakarta)
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              {user.isAdmin && (
                <button 
                  onClick={() => setActiveView('admin')}
                  className={cn("p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors", config.text)}
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => setActiveView('profile')}
                className={cn("p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors flex items-center gap-2", config.text)}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-[10px] overflow-hidden", config.primary)}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className={cn("text-xs font-black", config.text)}>{user.username}</span>
                  <span className={cn("text-[10px] opacity-40 uppercase tracking-widest", config.text)}>#{user.id.slice(0, 4)}</span>
                </div>
              </button>
              <button 
                onClick={onLogout}
                className={cn("p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors", config.text)}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveView('registration')}
              className={cn("px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-0.5 active:scale-95", config.primary, "text-white")}
            >
              Daftar
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- HomeView ---
const HomeView = ({ theme, config, settings, setActiveView }: { 
  theme: ThemeType, 
  config: ThemeConfig,
  settings: TournamentSettings,
  setActiveView: (view: string) => void,
  key?: React.Key
}) => {
  const [stats, setStats] = useState({ total: 0, today: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, 'users'), limit(500));
        const snap = await getDocs(q);
        setStats({
          total: snap.size,
          today: snap.docs.filter(d => {
            const regDateStr = d.data().registration_date || d.data().registrationDate;
            if (!regDateStr) return false;
            const date = new Date(regDateStr);
            return date.toDateString() === new Date().toDateString();
          }).length
        });
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    fetchStats();
  }, []);
  
  return (
    <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-8 gap-5 md:h-[calc(100vh-160px)] min-h-[800px]">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn("md:col-span-7 md:row-span-5 p-10 border relative overflow-hidden flex flex-col justify-center bento-card", config.card)}
        >
          <div className="relative z-10 space-y-6">
            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border", config.accent, "bg-sky-500/5 border-sky-500/20")}>
              <Calendar className="w-3 h-3" />
              REGISTRATION OPEN: {new Date(settings.tournamentDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
            </div>
            
            <h1 className={cn("text-5xl lg:text-7xl font-black tracking-tight leading-[0.85] uppercase", config.text)}>
              E-Sports <br /> <span className={config.accent}>Champions</span> <br /> League.
            </h1>
            
            <p className={cn("text-base opacity-60 font-medium max-w-sm leading-relaxed", config.text)}>
              Tunjukkan skill terbaik tim kamu dan rebut total hadiah jutaan rupiah di turnamen paling bergengsi tahun ini.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={() => setActiveView('registration')}
                className={cn("w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95", config.primary, "text-white")}
              >
                Mulai Daftar
              </button>
              <button 
                onClick={() => setActiveView('check-status')}
                className={cn("w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all border bg-slate-500/5 hover:bg-slate-500/10 active:scale-95", config.text, "border-slate-500/20")}
              >
                Cek ID Saya
              </button>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-5 w-80 h-80 border-[40px] border-sky-500 rounded-full"></div>
        </motion.div>

        {/* Featured Card */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className={cn("md:col-span-5 md:row-span-4 border relative overflow-hidden group bento-card", config.card)}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 p-8 flex flex-col justify-end">
             <div className="w-fit mb-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black tracking-widest border border-emerald-500/20">GRAND FINAL</div>
             <h3 className="text-3xl font-black text-white leading-tight uppercase">Tournament <br /> Arena Nusantara</h3>
             <p className="text-sm text-slate-300 font-medium mt-1">Prize Pool: Rp 25.000.000</p>
          </div>
          <img 
            src={settings.posterPath || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"} 
            alt="Tournament" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
          />
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={cn("md:col-span-3 md:row-span-3 p-8 border flex flex-col justify-between bento-card", config.card)}
        >
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Pendaftar</div>
          <div className="flex items-end justify-between">
            <span className="text-6xl font-black tracking-tighter tabular-nums">{stats.total}</span>
            {stats.today > 0 && <span className="text-emerald-400 text-xs font-black mb-2 animate-bounce">+{stats.today} Today</span>}
          </div>
          <div className="w-full bg-slate-500/10 h-1.5 rounded-full overflow-hidden mt-4">
            <div className="bg-sky-500 h-full w-[65%] transition-all duration-1000"></div>
          </div>
        </motion.div>

        {/* Schedule Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={cn("md:col-span-5 md:row-span-3 p-8 border bento-card", config.card)}
        >
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6">Jadwal Turnamen</div>
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="bg-sky-500/10 text-sky-400 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black border border-sky-500/20">
                <span className="text-lg leading-none">15</span>
                <span className="text-[8px] uppercase">OCT</span>
              </div>
              <div>
                <p className="text-sm font-black uppercase">Qualifiers Round 1</p>
                <p className="text-[10px] opacity-50 font-medium">Online Battle • All Bracket</p>
              </div>
            </div>
            <div className="flex gap-4 items-center opacity-60">
              <div className="bg-slate-500/10 text-slate-400 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black border border-slate-500/20">
                <span className="text-lg leading-none">22</span>
                <span className="text-[8px] uppercase">OCT</span>
              </div>
              <div>
                <p className="text-sm font-black uppercase">Main Event Final</p>
                <p className="text-[10px] opacity-50 font-medium">Offline Arena • Jakarta</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Links Card */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.4 }}
           className={cn("md:col-span-2 md:row-span-4 p-8 border flex flex-col justify-center items-center gap-6 bento-card", config.card)}
        >
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black opacity-30 tracking-[0.3em] uppercase mb-1">Follow Us</span>
            <div className="h-px w-8 bg-sky-500/50"></div>
          </div>
          <div className="flex md:flex-col gap-6">
            <Users className="w-6 h-6 opacity-30 hover:opacity-100 hover:text-sky-400 transition-all cursor-pointer" />
            <MessageSquare className="w-6 h-6 opacity-30 hover:opacity-100 hover:text-sky-400 transition-all cursor-pointer" />
            <ShieldCheck className="w-6 h-6 opacity-30 hover:opacity-100 hover:text-sky-400 transition-all cursor-pointer" />
          </div>
        </motion.div>

        {/* Testimonial Mini Card */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.5 }}
           onClick={() => setActiveView('testimonials')}
           className={cn("md:col-span-2 md:row-span-4 p-8 border flex flex-col justify-center items-center cursor-pointer hover:bg-sky-500/5 transition-colors group bento-card", config.card)}
        >
           <MessageSquare className="w-8 h-8 opacity-40 mb-3 group-hover:scale-110 transition-transform" />
           <span className="text-[10px] font-black uppercase tracking-widest text-center">Baca <br /> Testimoni</span>
        </motion.div>
      </div>
    </div>
  );
};

// --- ProfileView ---
const ProfileView = ({ theme, config, user, onUpdate }: { 
  theme: ThemeType, 
  config: ThemeConfig, 
  user: UserProfile, 
  onUpdate: (updatedUser: UserProfile) => void,
  key?: React.Key
}) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: user.username,
    teamName: user.teamName || (user as any).team_name || ''
  });
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedData = {
        username: form.username,
        team_name: form.teamName,
        teamName: form.teamName,
        avatar_url: avatarPreview,
        avatarUrl: avatarPreview
      };
      await setDoc(doc(db, 'users', user.id), updatedData, { merge: true });
      onUpdate({ ...user, ...updatedData });
      setEditing(false);
      alert('Profil berhasil diperbarui!');
    } catch (error) {
      console.error(error);
      alert('Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto flex flex-col gap-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("p-10 rounded-3xl border shadow-2xl relative overflow-hidden", config.card)}
      >
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center md:items-start">
          <div className="relative group">
            <div className={cn("w-32 h-32 rounded-3xl flex items-center justify-center text-5xl font-black text-white shadow-2xl overflow-hidden", config.primary)}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            {editing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                <ImageIcon className="w-8 h-8 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>
          
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div>
              <h2 className={cn("text-4xl font-black tracking-tight", config.text)}>{user.username}</h2>
              <p className={cn("text-sm opacity-50 font-mono mt-1", config.text)}>USER ID: {user.id}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div className="space-y-1">
                <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", config.text)}>Username</label>
                {editing ? (
                  <input 
                    className={cn("w-full p-3 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-sky-500 outline-none", config.text, "border-slate-500/20")}
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                  />
                ) : (
                  <p className={cn("text-xl font-bold", config.text)}>{user.username}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", config.text)}>Nama Tim</label>
                {editing ? (
                  <input 
                    className={cn("w-full p-3 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-sky-500 outline-none", config.text, "border-slate-500/20")}
                    value={form.teamName}
                    onChange={e => setForm({...form, teamName: e.target.value})}
                  />
                ) : (
                  <p className={cn("text-xl font-bold", config.text)}>{user.teamName || (user as any).team_name || '-'}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", config.text)}>Nomor Telepon</label>
                <p className={cn("text-xl font-bold", config.text)}>{user.phone || '-'}</p>
              </div>

              <div className="space-y-1">
                <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", config.text)}>Role</label>
                <p className={cn("text-xl font-bold uppercase", user.isAdmin ? "text-emerald-500" : config.text)}>
                  {user.isAdmin ? 'Administrator' : 'Peserta'}
                </p>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              {editing ? (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className={cn("px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl", config.primary, loading && "opacity-50")}
                  >
                    {loading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                  <button 
                    onClick={() => { setEditing(false); setForm({ username: user.username, teamName: user.teamName || (user as any).team_name || '' }); }}
                    className={cn("px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all", config.text, "border-slate-500/20")}
                  >
                    Batal
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setEditing(true)}
                  className={cn("px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all hover:bg-slate-500/5", config.text, "border-slate-500/20")}
                >
                  Edit Profil
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <User className="w-40 h-40" />
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<TournamentSettings>({
    theme: 'dark',
    posterPath: '',
    tournamentDate: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'current'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as TournamentSettings;
        setSettings(data);
        setTheme(data.theme);
      } else {
        // Initialize default settings
        setDoc(doc(db, 'settings', 'current'), {
          theme: 'dark',
          posterPath: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
          tournamentDate: new Date().toISOString()
        });
      }
    });

    // Listen for custom themes
    const unsubThemes = onSnapshot(collection(db, 'themes'), (snap) => {
      const themes = snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomTheme));
      setCustomThemes(themes);
    });

    // Listen for auth
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({ 
              id: userDoc.id, 
              ...data,
              username: data.username,
              phone: data.phone,
              teamName: data.teamName || data.team_name,
              registrationDate: data.registrationDate || data.registration_date,
              avatarUrl: data.avatarUrl || data.avatar_url,
              totalWins: data.totalWins || data.total_wins || 0,
              role: data.role || (data.isAdmin ? 'SUPER_ADMIN' : 'USER'),
              isAdmin: data.isAdmin
            } as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubThemes();
      unsubAuth();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setActiveView('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate current theme config
  const allThemes: Record<string, ThemeConfig> = { ...DEFAULT_THEMES };
  customThemes.forEach(ct => {
    allThemes[ct.id] = {
      bg: ct.bg,
      text: ct.text,
      primary: ct.primary,
      card: ct.card,
      navbar: ct.navbar,
      accent: ct.accent
    };
  });

  const config = allThemes[theme] || DEFAULT_THEMES.dark;

  return (
    <div className={cn("min-h-screen transition-colors duration-500", config.bg)}>
      <Navbar 
        theme={theme} 
        config={config}
        user={user} 
        onLogout={handleLogout} 
        setActiveView={setActiveView} 
      />
      
      <main>
        <AnimatePresence mode="wait">
          {activeView === 'home' && <HomeView key="home" theme={theme} config={config} settings={settings} setActiveView={setActiveView} />}
          {activeView === 'registration' && <RegistrationView key="reg" theme={theme} config={config} onComplete={() => setActiveView('home')} />}
          {activeView === 'check-status' && <CheckStatusView key="check" theme={theme} config={config} />}
          {activeView === 'testimonials' && <TestimonialsView key="test" theme={theme} config={config} user={user} />}
          {activeView === 'profile' && user && <ProfileView key="profile" theme={theme} config={config} user={user} onUpdate={(updated) => setUser(updated)} />}
          {activeView === 'admin' && user?.isAdmin && <AdminDashboardView key="admin" theme={theme} config={config} user={user} settings={settings} customThemes={customThemes} />}
        </AnimatePresence>
      </main>

      <Footer theme={theme} config={config} />
    </div>
  );
}

// --- Footer ---
function Footer({ theme, config }: { theme: ThemeType, config: ThemeConfig }) {
  return (
    <footer className={cn("py-20 px-4 border-t", config.card)}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <Trophy className={cn("w-6 h-6", config.accent)} />
            <span className={cn("font-bold text-xl", config.text)}>Turnamen Pro</span>
          </div>
          <p className={cn("text-sm opacity-60 max-w-xs text-center md:text-left", config.text)}>
            Platform pendaftaran turnamen profesional terpercaya di Indonesia.
          </p>
        </div>
        
        <div className="flex items-center gap-8">
          <img src="https://via.placeholder.com/40" alt="Sponsor 1" className="grayscale opacity-50" />
          <img src="https://via.placeholder.com/40" alt="Sponsor 2" className="grayscale opacity-50" />
          <img src="https://via.placeholder.com/40" alt="Sponsor 3" className="grayscale opacity-50" />
        </div>

        <div className="flex items-center gap-4">
          <button className={cn("p-3 rounded-xl border", config.card, config.text)}>
            <Download className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className={cn("text-[10px] uppercase font-black tracking-widest opacity-50", config.text)}>Unduh App</span>
            <span className={cn("text-sm font-bold", config.text)}>Google Play</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// --- Form Views (Mini components within the same file for simplicity or split if needed) ---

function RegistrationView({ theme, config, onComplete }: { theme: ThemeType, config: ThemeConfig, onComplete: () => void, key?: React.Key }) {
  const [form, setForm] = useState({ phone: '', username: '', teamName: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // For simplicity in this demo, we'll use email as username@tournament.com
      const email = `${form.username.replace(/\s+/g, '').toLowerCase()}@tournament.com`;
      const userRes = await createUserWithEmailAndPassword(auth, email, form.password);
      
      const userData = {
        username: form.username,
        phone: form.phone,
        team_name: form.teamName,
        registration_date: new Date().toISOString(),
        total_wins: 0,
        role: 'USER',
        isAdmin: false
      };

      await setDoc(doc(db, 'users', userRes.user.uid), userData);
      
      // Trigger notification for admin
      await addDoc(collection(db, 'notifications'), {
        title: 'Pendaftaran Baru',
        message: `User ${form.username} baru saja mendaftar.`,
        type: 'success',
        read: false,
        created_at: new Date().toISOString()
      });

      alert(`Pendaftaran Berhasil! ID Anda: ${userRes.user.uid}`);
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pt-32 pb-20 px-4 flex justify-center"
    >
      <div className={cn("w-full max-w-md p-8 rounded-3xl border shadow-2xl", config.card)}>
        <h2 className={cn("text-3xl font-black mb-6", config.text)}>Pendaftaran</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={cn("text-xs font-bold uppercase tracking-widest opacity-50", config.text)}>Nomor Telepon</label>
            <input 
              required
              type="tel"
              className={cn("w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500", config.text, config.card)}
              placeholder="0812..."
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className={cn("text-xs font-bold uppercase tracking-widest opacity-50", config.text)}>Username</label>
            <input 
              required
              className={cn("w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500", config.text, config.card)}
              placeholder="Jawara_Esport"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className={cn("text-xs font-bold uppercase tracking-widest opacity-50", config.text)}>Nama Tim</label>
            <input 
              required
              className={cn("w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500", config.text, config.card)}
              placeholder="Garuda Muda"
              value={form.teamName}
              onChange={e => setForm({...form, teamName: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className={cn("text-xs font-bold uppercase tracking-widest opacity-50", config.text)}>Password</label>
            <input 
              required
              type="password"
              className={cn("w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500", config.text, config.card)}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button 
            disabled={loading}
            type="submit"
            className={cn("w-full py-4 rounded-xl font-black transition-all shadow-lg mt-4", config.primary, "text-white", loading && "opacity-50")}
          >
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function CheckStatusView({ theme, config }: { theme: ThemeType, config: ThemeConfig, key?: React.Key }) {
  const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchId) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const docRef = doc(db, 'users', searchId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setResult({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        setError('Data tidak ditemukan');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pt-32 pb-20 px-4 flex justify-center"
    >
      <div className={cn("w-full max-w-md p-8 rounded-3xl border shadow-2xl", config.card)}>
        <h2 className={cn("text-3xl font-black mb-6", config.text)}>Cek Status</h2>
        <div className="relative mb-6">
          <input 
            type="text"
            className={cn("w-full p-4 pr-12 rounded-xl border bg-transparent outline-none", config.text, config.card)}
            placeholder="Masukkan ID Pendaftaran"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
          />
          <button 
            onClick={handleSearch}
            className={cn("absolute right-2 top-2 p-2 rounded-lg", config.primary, "text-white")}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {loading && <div className={cn("text-center py-4", config.text)}>Mencari...</div>}
        {error && <p className="text-red-500 text-center font-bold mb-4">{error}</p>}
        {result && (
          <div className={cn("p-6 rounded-2xl border bg-blue-500/5 space-y-4", config.card)}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className={cn("font-black", config.text)}>Pendaftaran Terverifikasi</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="opacity-50">Username</p>
                <p className="font-bold">{result.username}</p>
              </div>
              <div>
                <p className="opacity-50">Tim</p>
                <p className="font-bold">{result.teamName || (result as any).team_name}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TestimonialsView({ theme, config, user }: { theme: ThemeType, config: ThemeConfig, user: UserProfile | null, key?: React.Key }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'testimonials'), orderBy('date_uploaded', 'desc'), limit(10));
    return onSnapshot(q, (snap) => {
      setTestimonials(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial)));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newContent) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        user_id: user.id,
        username: user.username,
        content: newContent,
        date_uploaded: new Date().toISOString()
      });
      setNewContent('');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'testimonials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <h2 className={cn("text-4xl font-black mb-10 text-center", config.text)}>Testimoni Peserta</h2>
      
      {user && (
        <form onSubmit={handleSubmit} className={cn("mb-12 p-8 rounded-3xl border shadow-xl", config.card)}>
          <textarea 
            required
            className={cn("w-full p-4 rounded-xl border bg-transparent min-h-[120px] outline-none", config.text, config.card)}
            placeholder="Bagikan pengalamanmu..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
          />
          <div className="flex justify-end mt-4">
            <button 
              disabled={loading}
              type="submit"
              className={cn("px-8 py-3 rounded-xl font-bold transition-all shadow-lg", config.primary, "text-white", loading && "opacity-50")}
            >
              {loading ? "Mengirim..." : "Kirim Testimoni"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6">
        {testimonials.map((t) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={t.id} 
            className={cn("p-6 rounded-2xl border shadow-sm", config.card)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center">
                <User className={cn("w-5 h-5", config.text)} />
              </div>
              <div>
                <p className={cn("font-bold text-sm", config.text)}>{t.username || "Anonim"}</p>
                <p className={cn("text-[10px] opacity-50", config.text)}>
                  {new Date(t.dateUploaded || (t as any).date_uploaded).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
            <p className={cn("text-sm leading-relaxed", config.text)}>{t.content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboardView({ theme, config, user: currentUser, settings, customThemes }: { theme: ThemeType, config: ThemeConfig, user: UserProfile, settings: TournamentSettings, customThemes: CustomTheme[], key?: React.Key }) {
  const [testUrl, setTestUrl] = useState(settings.posterPath);
  const [testDate, setTestDate] = useState(settings.tournamentDate.split('T')[0]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifSearchTerm, setNotifSearchTerm] = useState('');

  // Role permissions
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isManager = currentUser.role === 'MANAGER' || isSuperAdmin;
  const isStaff = currentUser.role === 'STAFF' || isManager;

  // Theme Editor State
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Partial<CustomTheme>>({
    name: '', bg: 'bg-[#0f172a]', text: 'text-slate-50', primary: 'bg-sky-600', card: 'bg-slate-800/40', navbar: 'bg-slate-900', accent: 'text-sky-400'
  });

  // Task Management State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [leaderboardSort, setLeaderboardSort] = useState<'wins' | 'date'>('wins');

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        createdAt: d.data().created_at 
      } as unknown as Notification)));
    });
    return () => unsub();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (e) { console.error('Failed to mark as read', e); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) { alert('Gagal hapus notifikasi'); }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(db, 'users'), limit(50));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        role: doc.data().role || (doc.data().isAdmin ? 'SUPER_ADMIN' : 'USER'),
        totalWins: doc.data().total_wins || 0 
      } as UserProfile)));
    };
    fetchUsers();
  }, []);

  const updateSettings = async (newTheme?: ThemeType) => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'current'), {
        theme: newTheme || settings.theme,
        posterPath: testUrl,
        tournamentDate: new Date(testDate).toISOString()
      });
      alert('Pengaturan diperbarui');
    } catch (err: any) {
      alert('Gagal memperbarui: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomTheme = async () => {
    if (!editingTheme.name) return alert('Nama tema wajib diisi');
    setLoading(true);
    try {
      if (editingTheme.id) {
        await setDoc(doc(db, 'themes', editingTheme.id), editingTheme);
      } else {
        await addDoc(collection(db, 'themes'), editingTheme);
      }
      setIsThemeEditorOpen(false);
      setEditingTheme({ name: '', bg: 'bg-[#0f172a]', text: 'text-slate-50', primary: 'bg-sky-600', card: 'bg-slate-800/40', navbar: 'bg-slate-900', accent: 'text-sky-400' });
    } catch (err) {
      alert('Gagal simpan tema');
    } finally {
      setLoading(false);
    }
  };

  const deleteTheme = async (id: string) => {
    if (!confirm('Hapus tema ini?')) return;
    try {
      await deleteDoc(doc(db, 'themes', id));
    } catch (err) {
      alert('Gagal hapus');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.teamName || (u as any).team_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadPDF = () => {
    const doc = new jsPDF();
    const title = searchTerm 
      ? `Data Pendaftaran Turnamen (Filter: ${searchTerm})` 
      : 'Data Pendaftaran Turnamen';
    
    doc.text(title, 14, 15);
    (doc as any).autoTable({
      head: [['ID', 'Username', 'Telepon', 'Tim']],
      body: filteredUsers.map(u => [u.id.slice(0,8), u.username, u.phone, u.teamName || (u as any).team_name]),
      startY: 20,
    });
    doc.save(`pendaftaran-turnamen${searchTerm ? '-' + searchTerm : ''}.pdf`);
  };

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        title: d.data().title,
        completed: d.data().completed,
        dueDate: d.data().due_date,
        createdAt: d.data().created_at
      } as unknown as Task)));
    });
    return () => unsub();
  }, []);

  const addTask = async () => {
    if (!newTaskTitle) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle,
        completed: false,
        created_at: new Date().toISOString()
      });
      setNewTaskTitle('');
    } catch (e) { alert('Gagal tambah tugas'); }
  };

  const toggleTask = async (task: Task) => {
    try {
      const newStatus = !task.completed;
      await setDoc(doc(db, 'tasks', task.id), { completed: newStatus }, { merge: true });
      
      if (newStatus) {
        await addDoc(collection(db, 'notifications'), {
          title: 'Tugas Selesai',
          message: `Tugas "${task.title}" telah diselesaikan.`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (e) { alert('Gagal update tugas'); }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (e) { alert('Gagal hapus tugas'); }
  };

  const updateWins = async (uid: string, wins: number) => {
    try {
      await setDoc(doc(db, 'users', uid), { total_wins: wins }, { merge: true });
      setUsers(users.map(u => u.id === uid ? { ...u, totalWins: wins } : u));
    } catch (e) { alert('Gagal update points'); }
  };

  const sortedLeaderboard = [...users].sort((a, b) => {
    if (leaderboardSort === 'wins') return (b.totalWins || 0) - (a.totalWins || 0);
    return new Date(b.registrationDate || (b as any).registration_date).getTime() - new Date(a.registrationDate || (a as any).registration_date).getTime();
  });

  const updateUserRole = async (uid: string, role: string) => {
    if (!isSuperAdmin) return;
    try {
      await setDoc(doc(db, 'users', uid), { 
        role, 
        isAdmin: ['SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role) 
      }, { merge: true });
      alert(`Role user diperbarui menjadi ${role}`);
      setUsers(users.map(u => u.id === uid ? { ...u, role: role as any, isAdmin: ['SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role) } : u));
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    }
  };

  const deleteUser = async (uid: string) => {
    if (!isSuperAdmin) return;
    if (!confirm('Hapus user ini?')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.id !== uid));
      alert('User berhasil dihapus');
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className={cn("text-4xl font-black", config.text)}>Admin Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase text-white", config.primary)}>
              {currentUser.role || 'ADMIN'}
            </span>
            <p className={cn("opacity-60 text-sm", config.text)}>Kelola turnamen dan data pendaftaran.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!users.some(u => u.role === 'SUPER_ADMIN' || u.isAdmin) && (
            <button 
              onClick={() => auth.currentUser && updateUserRole(auth.currentUser.uid, 'SUPER_ADMIN')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold"
            >
              Claim Super Admin (Demo)
            </button>
          )}
          {isManager && (
            <button 
              onClick={downloadPDF}
              className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg", config.primary, "text-white")}
            >
              <Download className="w-5 h-5" /> Export PDF
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className={cn("md:col-span-1 p-8 rounded-3xl border shadow-xl space-y-6", config.card)}>
          {isManager && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Palette className={cn("w-5 h-5", config.accent)} />
                <h3 className={cn("font-black", config.text)}>Tampilan & Tema</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {['dark', 'white', 'red', 'yellow'].map((t) => (
                  <button 
                    key={t}
                    onClick={() => updateSettings(t as ThemeType)}
                    className={cn(
                      "p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                      settings.theme === t ? config.primary + " text-white" : "border-slate-500/20 opacity-50 hover:opacity-100",
                      config.text
                    )}
                  >
                    {t}
                  </button>
                ))}
                {customThemes.map((ct) => (
                  <div key={ct.id} className="relative group">
                    <button 
                      onClick={() => updateSettings(ct.id)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        settings.theme === ct.id ? config.primary + " text-white" : "border-slate-500/20 opacity-50 hover:opacity-100",
                        config.text
                      )}
                    >
                      {ct.name}
                    </button>
                    <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                      <button onClick={() => { setEditingTheme(ct); setIsThemeEditorOpen(true); }} className="p-1 bg-sky-500 text-white rounded shadow-lg"><Settings className="w-3 h-3" /></button>
                      <button onClick={() => deleteTheme(ct.id)} className="p-1 bg-red-500 text-white rounded shadow-lg"><LogOut className="w-3 h-3 rotate-90" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => { setEditingTheme({ name: '', bg: 'bg-[#0f172a]', text: 'text-slate-50', primary: 'bg-sky-600', card: 'bg-slate-800/40', navbar: 'bg-slate-900', accent: 'text-sky-400' }); setIsThemeEditorOpen(true); }}
                className={cn("w-full py-3 rounded-xl border border-dashed text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-all", config.text)}
              >
                + Tambah Tema Kustom
              </button>

              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase opacity-50", config.text)}>URL Poster</label>
                <input 
                  className={cn("w-full p-3 rounded-lg border bg-transparent text-sm", config.text, config.card)}
                  value={testUrl}
                  onChange={e => setTestUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase opacity-50", config.text)}>Tanggal Turnamen</label>
                <input 
                  type="date"
                  className={cn("w-full p-3 rounded-lg border bg-transparent text-sm", config.text, config.card)}
                  value={testDate}
                  onChange={e => setTestDate(e.target.value)}
                />
              </div>

              <button 
                disabled={loading}
                onClick={() => updateSettings()}
                className={cn("w-full py-3 rounded-xl font-bold text-white", config.primary, loading && "opacity-50")}
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          )}

          {isStaff && (
            <div className="pt-6 border-t border-slate-500/10 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className={cn("w-5 h-5", config.accent)} />
                <h3 className={cn("font-black", config.text)}>Management Tasks</h3>
              </div>
              
              <div className="flex gap-2">
                <input 
                  className={cn("flex-1 p-2 rounded-lg border bg-transparent text-xs", config.text, config.card)}
                  placeholder="Tambah tugas baru..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
                <button 
                  onClick={addTask}
                  className={cn("px-3 py-2 rounded-lg text-white font-bold text-xs", config.primary)}
                >
                  +
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {tasks.map(task => (
                  <div key={task.id} className={cn("flex items-center justify-between p-3 rounded-xl border group", config.card)}>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleTask(task)}
                        className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors", task.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-500/30")}
                      >
                        {task.completed && <ShieldCheck className="w-3 h-3 text-white" />}
                      </button>
                      <span className={cn("text-xs font-medium transition-all", task.completed && "opacity-40 line-through")}>{task.title}</span>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all"
                    >
                      <LogOut className="w-3 h-3 rotate-90" />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-[10px] text-center opacity-40 py-4 italic">Belum ada tugas</p>}
              </div>
            </div>
          )}

          {isStaff && (
            <div className="pt-6 border-t border-slate-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className={cn("w-5 h-5", config.accent)} />
                  <h3 className={cn("font-black", config.text)}>Notifikasi</h3>
                </div>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
                  <input 
                    type="text"
                    placeholder="Cari notifikasi..."
                    className={cn("w-full pl-9 pr-4 py-2 rounded-lg border bg-transparent text-[10px] outline-none focus:ring-1 ring-sky-500/30", config.card, config.text)}
                    value={notifSearchTerm}
                    onChange={(e) => setNotifSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {notifications.filter(n => 
                    n.title.toLowerCase().includes(notifSearchTerm.toLowerCase()) || 
                    n.message.toLowerCase().includes(notifSearchTerm.toLowerCase())
                  ).map(notif => (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "relative p-3 rounded-xl border group transition-all", 
                      config.card,
                      notif.read ? "opacity-60" : "border-l-4 border-l-sky-500 bg-sky-500/5 shadow-sm"
                    )}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className="flex flex-col gap-1 pr-6">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[10px] font-black uppercase tracking-tight", 
                          notif.type === 'success' ? 'text-emerald-500' : 
                          notif.type === 'warning' ? 'text-amber-500' : 'text-sky-500'
                        )}>
                          {notif.title}
                        </span>
                        <span className="text-[8px] opacity-40">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className={cn("text-[11px] font-medium leading-tight", config.text)}>{notif.message}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-all"
                    >
                      <LogOut className="w-3 h-3 rotate-180" />
                    </button>
                  </div>
                ))}
                {notifications.length === 0 && <p className="text-[10px] text-center opacity-40 py-4 italic">Tidak ada notifikasi</p>}
                </div>
              </div>
            </div>
          )}
        </div>

      <div className={cn("md:col-span-2 p-8 rounded-3xl border shadow-xl", config.card)}>
          {isThemeEditorOpen ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className={cn("font-black text-xl", config.text)}>{editingTheme.id ? 'Edit Tema' : 'Buat Tema Baru'}</h3>
                <button onClick={() => setIsThemeEditorOpen(false)} className={cn("opacity-50 hover:opacity-100", config.text)}><LogOut className="w-5 h-5 rotate-180" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black opacity-50 uppercase">Nama Tema</label>
                  <input className={cn("w-full p-3 rounded-lg border bg-transparent", config.text, config.card)} value={editingTheme.name} onChange={e => setEditingTheme({...editingTheme, name: e.target.value})} placeholder="Neon Cyber" />
                </div>
                {['bg', 'text', 'primary', 'card', 'navbar', 'accent'].map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[10px] font-black opacity-50 uppercase">{field}</label>
                    <input 
                      className={cn("w-full p-3 rounded-lg border bg-transparent text-xs", config.text, config.card)} 
                      value={(editingTheme as any)[field]} 
                      onChange={e => setEditingTheme({...editingTheme, [field]: e.target.value})} 
                      placeholder="e.g. bg-slate-900"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={saveCustomTheme} className={cn("flex-1 py-3 rounded-xl font-black text-xs uppercase text-white shadow-xl", config.primary)}>Simpan Tema</button>
                <button onClick={() => setIsThemeEditorOpen(false)} className={cn("px-6 py-3 rounded-xl border font-black text-xs uppercase", config.text)}>Batal</button>
              </div>
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[10px] opacity-70">
                Gunakan Tailwind classes untuk styling (e.g. bg-[#hex], text-slate-50, shadow-lg, dll).
              </div>
            </div>
          ) : (
            <>
              {/* Leaderboard Section */}
              <div className="mb-12 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.primary, "text-white")}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn("font-black text-xl", config.text)}>Leaderboard Turnamen</h3>
                      <p className="text-[10px] opacity-50 uppercase font-bold tracking-wider">Peringkat Berdasarkan Performa</p>
                    </div>
                  </div>
                  <div className="flex bg-slate-500/10 p-1 rounded-xl">
                    <button 
                      onClick={() => setLeaderboardSort('wins')}
                      className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black transition-all", leaderboardSort === 'wins' ? config.primary + " text-white shadow-md" : "opacity-40")}
                    >
                      TOTAL KEMENANGAN
                    </button>
                    <button 
                      onClick={() => setLeaderboardSort('date')}
                      className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black transition-all", leaderboardSort === 'date' ? config.primary + " text-white shadow-md" : "opacity-40")}
                    >
                      PENDAFTARAN
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {sortedLeaderboard.slice(0, 5).map((u, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={u.id} 
                      className={cn("flex items-center justify-between p-4 rounded-2xl border group hover:shadow-lg transition-all", config.card)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg",
                          idx === 0 ? "bg-amber-400 text-white shadow-amber-400/50" : 
                          idx === 1 ? "bg-slate-300 text-slate-700 shadow-slate-300/50" :
                          idx === 2 ? "bg-orange-400 text-white shadow-orange-400/50" : 
                          "bg-slate-500/10 opacity-50"
                        )}>
                          #{idx + 1}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-black text-white text-xs overflow-hidden", config.primary)}>
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              u.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className={cn("font-black text-sm", config.text)}>{u.username}</p>
                            <p className="text-[10px] opacity-40 uppercase font-bold tracking-tight">{u.teamName || (u as any).team_name || 'Individual'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-lg font-black", config.text)}>{u.totalWins || 0}</p>
                        <p className="text-[8px] opacity-40 uppercase font-bold tracking-wider">Kemenangan</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Users className={cn("w-5 h-5", config.accent)} />
                  <h3 className={cn("font-black", config.text)}>Data Pendaftaran ({users.length})</h3>
                </div>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input 
                    type="text"
                    placeholder="Cari username atau tim..."
                    className={cn("w-full pl-10 pr-4 py-2 rounded-xl border bg-transparent text-xs outline-none transition-all focus:ring-2 ring-sky-500/20", config.card, config.text)}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

          {isManager && (
            <div className="mb-8 p-4 rounded-xl border-2 border-dashed border-slate-500/20">
              <h4 className="text-xs font-black uppercase mb-4 opacity-50">Tambah Peserta Manual</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input 
                  id="manual-username"
                  className={cn("p-2 rounded border bg-transparent text-xs", config.card)} 
                  placeholder="Username" 
                />
                <input 
                  id="manual-team"
                  className={cn("p-2 rounded border bg-transparent text-xs", config.card)} 
                  placeholder="Nama Tim" 
                />
                <button 
                  onClick={async () => {
                    const u = (document.getElementById('manual-username') as HTMLInputElement).value;
                    const t = (document.getElementById('manual-team') as HTMLInputElement).value;
                    if (!u || !t) return;
                    try {
                      await addDoc(collection(db, 'users'), {
                        username: u,
                        team_name: t,
                        phone: 'Admin Created',
                        registration_date: new Date().toISOString(),
                        total_wins: 0,
                        role: 'USER',
                        isAdmin: false
                      });
                      alert('User ditambahkan');
                      window.location.reload();
                    } catch (e) { alert('Gagal'); }
                  }}
                  className={cn("px-4 py-2 rounded font-bold text-xs text-white", config.primary)}
                >
                  Tambah
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                  <tr className={cn("border-b opacity-50", config.card)}>
                    <th className="pb-4 font-black">Username</th>
                    <th className="pb-4 font-black">Tim</th>
                    <th className="pb-4 font-black text-center">Wins</th>
                    <th className="pb-4 font-black text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={cn(config.text, "group")}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-6 h-6 rounded flex items-center justify-center font-black text-white text-[8px] overflow-hidden", config.primary)}>
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              u.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold">{u.username}</div>
                            <div className="opacity-50 text-[10px]">{u.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 opacity-70">{u.teamName || (u as any).team_name}</td>
                      <td className="py-4 text-center">
                        <input 
                          type="number"
                          disabled={!isManager}
                          className={cn("w-14 p-1 rounded-lg border bg-transparent text-center font-black outline-none transition-all", config.card, "border-slate-500/10 focus:border-sky-500/50", !isManager && "opacity-50 cursor-not-allowed")}
                          value={u.totalWins || 0}
                          onChange={(e) => updateWins(u.id, parseInt(e.target.value) || 0)}
                        />
                      </td>
      <td className="py-4">
                      <div className="flex justify-center gap-2">
                        {isSuperAdmin && (
                          <select 
                            className={cn("px-2 py-1 bg-slate-500/10 rounded font-bold text-[10px] outline-none", config.text)}
                            value={u.role || 'USER'}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                          >
                            <option value="USER">USER</option>
                            <option value="STAFF">STAFF</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="SUPER_ADMIN">SUPER ADMIN</option>
                          </select>
                        )}
                        {isSuperAdmin && (
                          <button 
                            onClick={() => deleteUser(u.id)}
                            className="px-2 py-1 bg-red-500/10 text-red-500 rounded font-bold hover:bg-red-500 hover:text-white transition-colors"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
