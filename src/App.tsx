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
import { cn, DEFAULT_THEMES, handleFirestoreError, logAdminAction } from './lib/utils';
import { 
  ThemeType, 
  UserProfile, 
  Testimonial, 
  TournamentSettings, 
  OperationType,
  CustomTheme,
  ThemeConfig,
  Task,
  Notification,
  RolePermissions,
  AdminLog
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
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveView('login')}
                className={cn("px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", config.text, "hover:bg-slate-500/10")}
              >
                Masuk
              </button>
              <button 
                onClick={() => setActiveView('registration')}
                className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-0.5 active:scale-95", config.primary, "text-white")}
              >
                Daftar
              </button>
            </div>
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
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={cn("md:col-span-7 md:row-span-5 p-10 border relative overflow-hidden flex flex-col justify-center bento-card group", config.card)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="relative z-10 space-y-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border", config.accent, "bg-sky-500/5 border-sky-500/20")}
            >
              <Calendar className="w-3 h-3" />
              REGISTRATION OPEN: {new Date(settings.tournamentDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
            </motion.div>
            
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn("text-5xl lg:text-8xl font-black tracking-tight leading-[0.8] uppercase", config.text)}
            >
              THE <span className={config.accent}>ELITE</span> <br /> ARENA <br /> DECLARED.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={cn("text-base opacity-60 font-medium max-w-sm leading-relaxed", config.text)}
            >
              Platform turnamen nomor satu untuk komunitas gamer Indonesia. Bersaing with para pro, bangun tim impian, dan jadilah legenda di arena Nusantara.
            </motion.p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={() => setActiveView('registration')}
                className={cn("w-full sm:w-auto px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95", config.primary, "text-white")}
              >
                Gabung Sekarang
              </button>
              <button 
                onClick={() => setActiveView('check-status')}
                className={cn("w-full sm:w-auto px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all border bg-slate-500/5 hover:bg-slate-500/10 active:scale-95", config.text, "border-slate-500/20")}
              >
                Lihat Jadwal
              </button>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-5 w-80 h-80 border-[40px] border-sky-500 rounded-full animate-pulse"></div>
          <div className="absolute top-10 right-10 opacity-10">
            <Trophy className="w-32 h-32 rotate-12" />
          </div>
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

      {/* Feature Sections - Website Version */}
      <div className="mt-40 space-y-40">
        {/* Public Leaderboard Mini */}
        <section className="space-y-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={cn("px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-sky-500/20 bg-sky-500/5", config.accent)}>Rankings</div>
            <h2 className={cn("text-4xl md:text-5xl font-black uppercase tracking-tighter", config.text)}>Leaderboard <span className={config.accent}>Elite</span></h2>
            <p className="opacity-50 text-sm max-w-lg">Pemain dengan perolehan kemenangan terbanyak musim ini. Terus bertanding untuk menempati posisi puncak!</p>
          </div>
          
          <PublicLeaderboard config={config} />
        </section>

        {/* Why Choose Us Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: "Fair Play", desc: "Sistem anti-cheat tingkat tinggi dan moderasi ketat untuk memastikan kompetisi yang sehat." },
            { icon: Trophy, title: "Prize Pool", desc: "Total hadiah jutaan rupiah dibayar instan setelah turnamen berakhir tanpa potongan." },
            { icon: Users, title: "Community", desc: "Bergabunglah dengan ribuan player lain dan kembangkan jaringan tim pro kamu." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn("p-10 rounded-3xl border shadow-xl flex flex-col items-start gap-6 hover:-translate-y-2 transition-transform", config.card)}
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", config.primary)}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className={cn("text-2xl font-black uppercase tracking-tight", config.text)}>{feature.title}</h3>
              <p className="text-sm opacity-50 leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* CTA Banner */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={cn("p-12 md:p-20 rounded-[40px] border shadow-2xl relative overflow-hidden flex flex-col items-center text-center gap-10", config.primary)}
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
            <Trophy className="w-64 h-64 text-white" />
          </div>
          <div className="absolute bottom-0 left-0 p-10 opacity-10 -rotate-12">
            <Users className="w-64 h-64 text-white" />
          </div>
          
          <div className="relative z-10 space-y-6 max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black text-white leading-none uppercase italic tracking-tighter">
              SIAP JADI <br /> JUARA NUSANTARA?
            </h2>
            <p className="text-white/80 text-base md:text-lg font-medium leading-relaxed">
              Pendaftaran akan segera ditutup. Pastikan tim kamu tidak ketinggalan momen bersejarah ini.
            </p>
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={() => setActiveView('registration')}
              className="px-12 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              Daftar Sekarang
            </button>
            <button 
              onClick={() => setActiveView('testimonials')}
              className="px-12 py-5 rounded-2xl border-2 border-white/30 text-white font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
            >
              Lihat Testimoni
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

// --- Public Leaderboard Component ---
const PublicLeaderboard = ({ config }: { config: ThemeConfig }) => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchTopUsers = async () => {
      const q = query(collection(db, 'users'), orderBy('total_wins', 'desc'), limit(5));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchTopUsers();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {users.map((u, i) => (
        <motion.div 
          key={u.id}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={cn("p-6 rounded-3xl border flex flex-col items-center gap-4 text-center relative overflow-hidden transition-all hover:border-sky-500/50", config.card)}
        >
          <div className="absolute top-2 left-3 text-[40px] font-black opacity-5 italic tracking-tighter">#{i + 1}</div>
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl overflow-hidden", config.primary)}>
            {u.avatar_url || u.avatarUrl ? (
              <img src={u.avatar_url || u.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : u.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className={cn("text-lg font-black uppercase truncate max-w-[120px]", config.text)}>{u.username}</h4>
            <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{u.teamName || u.team_name || 'No Team'}</p>
          </div>
          <div className="px-4 py-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
            <span className={cn("text-xs font-black", config.accent)}>{u.total_wins || u.totalWins || 0} Wins</span>
          </div>
        </motion.div>
      ))}
      {users.length === 0 && <p className="col-span-full text-center opacity-30 italic py-10">Memuat peringkat terbaik...</p>}
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

  useEffect(() => {
    if (!editing) {
      setAvatarPreview(user.avatarUrl || '');
      setForm({
        username: user.username,
        teamName: user.teamName || (user as any).team_name || ''
      });
    }
  }, [user, editing]);

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
            <div className={cn("w-32 h-32 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-2xl overflow-hidden border-4 border-white/10", config.primary)}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            {editing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon className="w-8 h-8 text-white" />
                  <span className="text-[10px] font-black uppercase text-white tracking-widest">Ganti</span>
                </div>
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
                    onClick={() => { 
                      setEditing(false); 
                      setForm({ username: user.username, teamName: user.teamName || (user as any).team_name || '' }); 
                      setAvatarPreview(user.avatarUrl || '');
                    }}
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
        
        {editing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-8 border-t border-slate-500/10 space-y-4"
          >
            <div className="space-y-1">
              <label className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", config.text)}>Avatar URL (atau Upload Gambar)</label>
              <div className="flex gap-4">
                <input 
                  className={cn("flex-1 p-3 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-sky-500 outline-none", config.text, "border-slate-500/20")}
                  value={avatarPreview}
                  placeholder="https://..."
                  onChange={e => setAvatarPreview(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
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
  const [roleConfigs, setRoleConfigs] = useState<RolePermissions[]>([]);
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
      } else if (user?.isAdmin) {
        // Initialize default settings only if admin
        setDoc(doc(db, 'settings', 'current'), {
          theme: 'dark',
          posterPath: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
          tournamentDate: new Date().toISOString()
        }).catch(e => console.error("Initial settings fail", e));
      }
    }, (err) => {
      console.warn("Settings listener error (likely unauthenticated):", err.message);
    });

    // Listen for custom themes
    const unsubThemes = onSnapshot(collection(db, 'themes'), (snap) => {
      const themes = snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomTheme));
      setCustomThemes(themes);
    }, (err) => {
      console.warn("Themes listener error:", err.message);
    });

    // Listen for role configs
    const unsubRoles = onSnapshot(collection(db, 'role_configs'), (snap) => {
      const configs = snap.docs.map(d => ({ id: d.id, ...d.data() } as RolePermissions));
      if (configs.length === 0 && user?.isAdmin) {
        // Initialize default roles only if admin
        const defaults = [
          { id: 'MANAGER', canEditTheme: true, canManageTasks: false, canManageNotifications: true, canExportData: true, canEditWins: true, canManageUsers: false },
          { id: 'STAFF', canEditTheme: false, canManageTasks: true, canManageNotifications: true, canExportData: false, canEditWins: false, canManageUsers: false },
          { id: 'USER', canEditTheme: false, canManageTasks: false, canManageNotifications: false, canExportData: false, canEditWins: false, canManageUsers: false }
        ];
        defaults.forEach(d => setDoc(doc(db, 'role_configs', d.id), d).catch(e => console.error("Role init fail", e)));
      }
      setRoleConfigs(configs);
    }, (err) => {
      console.warn("Roles listener error:", err.message);
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
      unsubRoles();
      unsubAuth();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setActiveView('home');
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      alert('Link reset password telah dikirim ke email Anda.');
    } catch (err: any) {
      alert('Gagal mengirim email reset: ' + err.message);
    }
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
          {activeView === 'registration' && <AuthView key="reg" theme={theme} config={config} onComplete={() => setActiveView('home')} initialMode="register" sendReset={sendPasswordReset} />}
          {activeView === 'login' && <AuthView key="login" theme={theme} config={config} onComplete={() => setActiveView('home')} initialMode="login" sendReset={sendPasswordReset} />}
          {activeView === 'check-status' && <CheckStatusView key="check" theme={theme} config={config} />}
          {activeView === 'testimonials' && <TestimonialsView key="test" theme={theme} config={config} user={user} />}
          {activeView === 'profile' && user && <ProfileView key="profile" theme={theme} config={config} user={user} onUpdate={(updated) => setUser(updated)} />}
          {activeView === 'admin' && user?.isAdmin && <AdminDashboardView key="admin" theme={theme} config={config} user={user} settings={settings} customThemes={customThemes} roleConfigs={roleConfigs} />}
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

function AuthView({ theme, config, onComplete, initialMode = 'login', sendReset }: { 
  theme: ThemeType, 
  config: ThemeConfig, 
  onComplete: () => void, 
  initialMode?: 'login' | 'register' | 'forgot',
  sendReset: (email: string) => Promise<void>,
  key?: React.Key 
}) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [form, setForm] = useState({ phone: '', username: '', teamName: '', password: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (mode === 'forgot') {
        await sendReset(form.email);
        setMode('login');
      } else if (mode === 'register') {
        const email = `${form.username.replace(/\s+/g, '').toLowerCase()}@tournament.com`;
        const userRes = await createUserWithEmailAndPassword(auth, email, form.password);
        
        const userData = {
          username: form.username,
          phone: form.phone,
          team_name: form.teamName,
          registration_date: new Date().toISOString(),
          total_wins: 0,
          role: 'USER',
          isAdmin: false,
          avatar_url: ''
        };

        await setDoc(doc(db, 'users', userRes.user.uid), userData);
        
        await addDoc(collection(db, 'notifications'), {
          title: 'Pendaftaran Baru',
          message: `User ${form.username} baru saja mendaftar.`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        });

        alert(`Pendaftaran Berhasil! ID Anda: ${userRes.user.uid}`);
        onComplete();
      } else {
        // Login mode
        // For simplicity, we assume username as email
        const email = form.username.includes('@') ? form.username : `${form.username.replace(/\s+/g, '').toLowerCase()}@tournament.com`;
        await signInWithEmailAndPassword(auth, email, form.password);
        onComplete();
      }
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
        <h2 className={cn("text-3xl font-black mb-6", config.text)}>
          {mode === 'login' ? 'Masuk' : mode === 'register' ? 'Pendaftaran' : 'Lupa Password'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'forgot' ? (
            <div className="space-y-1">
              <label className={cn("text-xs font-bold uppercase tracking-widest opacity-50", config.text)}>Email Terdaftar</label>
              <input 
                required
                type="email"
                className={cn("w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500", config.text, config.card)}
                placeholder="email@contoh.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
              />
            </div>
          ) : (
            <>
              {mode === 'register' && (
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
              )}
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
              {mode === 'register' && (
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
              )}
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
            </>
          )}

          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          
          <button 
            disabled={loading}
            type="submit"
            className={cn("w-full py-4 rounded-xl font-black transition-all shadow-lg mt-4", config.primary, "text-white", loading && "opacity-50")}
          >
            {loading ? "Memproses..." : mode === 'login' ? 'Masuk' : mode === 'register' ? 'Daftar' : 'Kirim Link Reset'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center text-xs">
          {mode === 'login' && (
            <>
              <button 
                onClick={() => setMode('register')}
                className={cn("font-bold hover:underline", config.accent)}
              >
                Belum punya akun? Daftar di sini
              </button>
              <button 
                onClick={() => setMode('forgot')}
                className="opacity-50 hover:opacity-100"
              >
                Lupa password?
              </button>
            </>
          )}
          {(mode === 'register' || mode === 'forgot') && (
            <button 
              onClick={() => setMode('login')}
              className={cn("font-bold hover:underline", config.accent)}
            >
              Kembali ke Login
            </button>
          )}
        </div>
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
        image_url: user.avatarUrl || '',
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
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-xs overflow-hidden", config.primary)}>
                {t.imageUrl || (t as any).image_url ? (
                  <img src={t.imageUrl || (t as any).image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (t.username || "A").charAt(0).toUpperCase()
                )}
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

function AdminDashboardView({ theme, config, user: currentUser, settings, customThemes, roleConfigs }: { theme: ThemeType, config: ThemeConfig, user: UserProfile, settings: TournamentSettings, customThemes: CustomTheme[], roleConfigs: RolePermissions[], key?: React.Key }) {
  const [testUrl, setTestUrl] = useState(settings.posterPath);
  const [testDate, setTestDate] = useState(settings.tournamentDate.split('T')[0]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifSearchTerm, setNotifSearchTerm] = useState('');
  const [notifTypeFilter, setNotifTypeFilter] = useState<'all' | 'info' | 'success' | 'warning'>('all');
  const [notifStatusFilter, setNotifStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'roles' | 'notifications' | 'logs'>('overview');
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);

  // Password Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Role permissions dynamic helper
  const hasPermission = (permission: keyof RolePermissions) => {
    if (currentUser.role === 'SUPER_ADMIN') return true;
    const config = roleConfigs.find(c => c.id === currentUser.role);
    if (!config) return false;
    return !!config[permission];
  };

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isManager = hasPermission('canEditTheme') || isSuperAdmin;
  const isStaff = hasPermission('canManageTasks') || isManager;
  const canEditWins = hasPermission('canEditWins');
  const canExport = hasPermission('canExportData');
  const canManageRoles = isSuperAdmin; // Only Super Admin for now by definition or hasPermission('canManageUsers')
  const canManageNotifs = hasPermission('canManageNotifications');

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
    const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        createdAt: d.data().created_at 
      } as unknown as Notification)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    });
    return () => unsub();
  }, []);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(unread.map(n => setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
      await logAdminAction(
        currentUser.username, 
        'UPDATE_SETTINGS', 
        `Updated settings: Theme=${newTheme || settings.theme}, Date=${testDate}`,
        'settings/current'
      );
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
        await logAdminAction(currentUser.username, 'UPDATE_THEME', `Updated custom theme: ${editingTheme.name}`, editingTheme.id);
      } else {
        const res = await addDoc(collection(db, 'themes'), editingTheme);
        await logAdminAction(currentUser.username, 'CREATE_THEME', `Created custom theme: ${editingTheme.name}`, res.id);
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
      await logAdminAction(currentUser.username, 'DELETE_THEME', `Theme ID ${id} deleted`, id);
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
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tasks');
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
      const task = tasks.find(t => t.id === id);
      await logAdminAction(currentUser.username, 'DELETE_TASK', `Task deleted: ${task?.title || id}`, id);
    } catch (e) { alert('Gagal hapus tugas'); }
  };

  const updateWins = async (uid: string, wins: number) => {
    try {
      await setDoc(doc(db, 'users', uid), { total_wins: wins }, { merge: true });
      const user = users.find(u => u.id === uid);
      await logAdminAction(currentUser.username, 'UPDATE_WINS', `Updated wins for ${user?.username || uid} to ${wins}`, uid);
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
      await logAdminAction(currentUser.username, 'UPDATE_USER_ROLE', `Role for ${uid} set to ${role}`, uid);
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
      const user = users.find(u => u.id === uid);
      await logAdminAction(currentUser.username, 'DELETE_USER', `User deleted: ${user?.username || uid}`, uid);
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
        <div className="flex bg-slate-500/10 p-1 rounded-xl">
          {[
            { id: 'overview', label: 'Overview', icon: Trophy },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'roles', label: 'Roles', icon: ShieldCheck },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'logs', label: 'System Logs', icon: Download },
          ].map(tab => {
            const unreadCount = tab.id === 'notifications' ? notifications.filter(n => !n.read).length : 0;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all relative",
                  activeTab === tab.id ? config.primary + " text-white shadow-md" : "opacity-40"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label.toUpperCase()}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <button 
              onClick={() => auth.currentUser && updateUserRole(auth.currentUser.uid, 'SUPER_ADMIN')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold"
            >
              Claim Super Admin (Demo)
            </button>
          )}
          {canExport && (
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
        {activeTab === 'overview' && (
          <>
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

              {hasPermission('canManageTasks') && (
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

              {hasPermission('canManageNotifications') && (
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

            <div className={cn("md:col-span-2 p-8 rounded-3xl border shadow-xl flex flex-col gap-8", config.card)}>
                {isThemeEditorOpen && (
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
                  </div>
                )}
                
                {/* Leaderboard Mini Version */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", config.primary, "text-white")}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h3 className={cn("font-black text-xl", config.text)}>Top Performers</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sortedLeaderboard.slice(0, 4).map((u, idx) => (
                      <div key={u.id} className={cn("flex items-center justify-between p-4 rounded-2xl border", config.card)}>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs", config.primary)}>#{idx + 1}</div>
                          <div>
                            <p className="font-bold text-sm">{u.username}</p>
                            <p className="text-[10px] opacity-40 uppercase font-bold">{u.totalWins || 0} Wins</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          </>
        )}

        {(activeTab === 'users' || activeTab === 'roles' || activeTab === 'notifications' || activeTab === 'logs') && (
          <div className={cn("md:col-span-3 p-8 rounded-3xl border shadow-xl space-y-8", config.card)}>
            {activeTab === 'logs' && (
              <div className="space-y-6 text-sm">
                <div className="flex items-center gap-3">
                  <Download className={cn("w-6 h-6", config.accent)} />
                  <h3 className={cn("font-black text-2xl", config.text)}>Audit Logs</h3>
                </div>
                <div className="overflow-x-auto border rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-500/5">
                      <tr>
                        <th className="px-4 py-3 opacity-50 uppercase font-black">Timestamp</th>
                        <th className="px-4 py-3 opacity-50 uppercase font-black">Admin</th>
                        <th className="px-4 py-3 opacity-50 uppercase font-black">Action</th>
                        <th className="px-4 py-3 opacity-50 uppercase font-black">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/10">
                      {adminLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                          <td className="px-4 py-3 opacity-60 font-mono">
                            {new Date(log.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-3 font-bold">{log.username}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 font-bold uppercase text-[10px] shadow-sm">{log.action}</span>
                          </td>
                          <td className="px-4 py-3 opacity-80">{log.details}</td>
                        </tr>
                      ))}
                      {adminLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center opacity-40 italic">Belum ada riwayat aktivitas admin.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Bell className={cn("w-6 h-6", config.accent)} />
                      <h3 className={cn("font-black text-2xl", config.text)}>System Notifications</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {notifications.some(n => !n.read) && (
                        <button 
                          onClick={markAllAsRead}
                          className={cn("px-4 py-2.5 rounded-xl border-2 border-sky-500/20 bg-sky-500/5 text-[10px] font-black uppercase tracking-widest hover:bg-sky-500/10 transition-all", config.accent)}
                        >
                          Tandai Semua Dibaca
                        </button>
                      )}
                      <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                        <input 
                          type="text"
                          className={cn("w-full pl-10 pr-4 py-2.5 rounded-xl border bg-transparent text-sm outline-none", config.card, config.text)}
                          placeholder="Cari notifikasi..."
                          value={notifSearchTerm}
                          onChange={e => setNotifSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <select 
                        value={notifTypeFilter}
                        onChange={(e) => setNotifTypeFilter(e.target.value as any)}
                        className={cn("px-4 py-2.5 rounded-xl border bg-transparent text-xs font-bold outline-none", config.card, config.text)}
                      >
                        <option value="all">Semua Tipe</option>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                      </select>

                      <select 
                        value={notifStatusFilter}
                        onChange={(e) => setNotifStatusFilter(e.target.value as any)}
                        className={cn("px-4 py-2.5 rounded-xl border bg-transparent text-xs font-bold outline-none", config.card, config.text)}
                      >
                        <option value="all">Semua Status</option>
                        <option value="unread">Belum Dibaca</option>
                        <option value="read">Sudah Dibaca</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {notifications.filter(n => {
                    const matchesSearch = n.title.toLowerCase().includes(notifSearchTerm.toLowerCase()) || 
                                         n.message.toLowerCase().includes(notifSearchTerm.toLowerCase());
                    const matchesType = notifTypeFilter === 'all' || n.type === notifTypeFilter;
                    const matchesStatus = notifStatusFilter === 'all' || 
                                         (notifStatusFilter === 'unread' && !n.read) || 
                                         (notifStatusFilter === 'read' && n.read);
                    return matchesSearch && matchesType && matchesStatus;
                  }).map(notif => (
                    <motion.div
                      layout
                      key={notif.id}
                      className={cn(
                        "relative p-5 rounded-2xl border transition-all flex items-start gap-4",
                        config.card,
                        notif.read ? "opacity-60" : "border-l-4 border-l-sky-500 shadow-sm"
                      )}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                    >
                      <div className={cn(
                        "p-3 rounded-xl",
                        notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                        notif.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-sky-500/10 text-sky-500'
                      )}>
                        {notif.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 pr-8">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-black text-sm uppercase tracking-tight">{notif.title}</h4>
                          <span className="text-[10px] opacity-40 font-bold">{new Date(notif.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed">{notif.message}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="absolute top-4 right-4 text-red-500/30 hover:text-red-500 transition-all"
                      >
                        <LogOut className="w-4 h-4 rotate-180" />
                      </button>
                    </motion.div>
                  ))}
                  {notifications.length === 0 && <p className="text-sm text-center opacity-40 py-12 italic">Tidak ada notifikasi sistem</p>}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Users className={cn("w-6 h-6", config.accent)} />
                    <h3 className={cn("font-black text-2xl", config.text)}>User Management</h3>
                  </div>
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input 
                      type="text"
                      className={cn("w-full pl-10 pr-4 py-2.5 rounded-xl border bg-transparent text-sm outline-none", config.card, config.text)}
                      placeholder="Cari user atau tim..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                {isManager && (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-500/20 bg-slate-500/5">
                    <h4 className="text-[10px] font-black uppercase mb-4 opacity-50 tracking-widest">Registrasi Manual</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input id="man-user" placeholder="Username" className={cn("p-3 rounded-xl border bg-transparent text-sm", config.card)} />
                      <input id="man-team" placeholder="Team Name" className={cn("p-3 rounded-xl border bg-transparent text-sm", config.card)} />
                      <button 
                        onClick={async () => {
                          const u = (document.getElementById('man-user') as HTMLInputElement).value;
                          const t = (document.getElementById('man-team') as HTMLInputElement).value;
                          if (!u || !t) return alert('Wajib diisi');
                          try {
                            await addDoc(collection(db, 'users'), { username: u, team_name: t, phone: 'Manual', registration_date: new Date().toISOString(), total_wins: 0, role: 'USER', isAdmin: false });
                            alert('Berhasil');
                            window.location.reload();
                          } catch (e) { alert('Gagal'); }
                        }}
                        className={cn("px-6 py-3 rounded-xl font-bold text-white", config.primary)}
                      >
                        Tambah User
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-500/10 opacity-50 text-[10px] font-black uppercase tracking-widest">
                        <th className="pb-4">Profile</th>
                        <th className="pb-4">Team</th>
                        <th className="pb-4 text-center">Stats</th>
                        <th className="pb-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/10">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="group">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs overflow-hidden", config.primary)}>
                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm tracking-tight">{u.username}</p>
                                <p className="text-[10px] opacity-40">{u.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-sm opacity-60">
                             {u.teamName || (u as any).team_name || 'Individual'}
                          </td>
                          <td className="py-4">
                             <div className="flex flex-col items-center">
                                <input 
                                  type="number"
                                  disabled={!canEditWins}
                                  className={cn("w-16 p-2 rounded-lg border bg-transparent text-center font-black outline-none transition-all", config.card, "border-slate-500/10 focus:ring-2 ring-sky-500/20", !canEditWins && "opacity-40")}
                                  value={u.totalWins || 0}
                                  onChange={e => updateWins(u.id, parseInt(e.target.value) || 0)}
                                />
                             </div>
                          </td>
                          <td className="py-4">
                            <div className="flex justify-center gap-2">
                               {isSuperAdmin && (
                                 <select 
                                  className={cn("px-3 py-2 bg-slate-500/10 rounded-lg font-bold text-[10px] outline-none", config.text)}
                                  value={u.role || 'USER'}
                                  onChange={e => updateUserRole(u.id, e.target.value)}
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
                                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <LogOut className="w-4 h-4" />
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

            {activeTab === 'roles' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={cn("w-6 h-6", config.accent)} />
                  <h3 className={cn("font-black text-2xl", config.text)}>Roles & Permissions</h3>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {roleConfigs.map(role => (
                    <div key={role.id} className={cn("p-6 rounded-3xl border shadow-lg relative overflow-hidden", config.card)}>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white", config.primary)}>
                            {role.id.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-xl">{role.id}</h4>
                            <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Role Configuration</p>
                          </div>
                        </div>
                        {isSuperAdmin && role.id !== 'SUPER_ADMIN' && role.id !== 'USER' && (
                          <span className="text-[10px] font-black px-3 py-1 bg-sky-500/10 text-sky-500 rounded-full">Configurable</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                        {[
                          { key: 'canEditTheme', label: 'Edit Themes & Settings' },
                          { key: 'canManageTasks', label: 'Manage Tasks' },
                          { key: 'canManageNotifications', label: 'Manage Notifications' },
                          { key: 'canExportData', label: 'Export Data (PDF)' },
                          { key: 'canEditWins', label: 'Edit Player Wins' },
                          { key: 'canManageUsers', label: 'Delete Users' },
                        ].map(perm => (
                          <div key={perm.key} className="flex items-center justify-between">
                            <span className="text-sm font-medium opacity-70">{perm.label}</span>
                            <div 
                              onClick={() => {
                                if (!isSuperAdmin) return;
                                const updated = { ...role, [perm.key]: !(role as any)[perm.key] };
                                setDoc(doc(db, 'role_configs', role.id), updated, { merge: true });
                              }}
                              className={cn(
                                "w-10 h-5 rounded-full p-1 cursor-pointer transition-all flex items-center",
                                (role as any)[perm.key] ? "bg-emerald-500" : "bg-slate-500/20"
                              )}
                            >
                               <div className={cn("w-3 h-3 rounded-full bg-white transition-all transform", (role as any)[perm.key] ? "translate-x-5" : "translate-x-0")}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {role.id === 'SUPER_ADMIN' && (
                        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                          <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                          <p className="text-[10px] font-medium leading-tight opacity-70 italic">
                             SUPER_ADMIN memiliki akses penuh ke seluruh fitur sistem dan tidak dapat dibatasi. Perubahan role ini hanya berdampak visual di dashboard.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
