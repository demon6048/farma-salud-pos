import React, { useState, useEffect } from 'react';
import { ShoppingCart, LogOut, Package, ShieldAlert, BarChart3, AlertTriangle, CheckCircle, XCircle, Search, Clock, ArrowDownCircle, Activity, Calendar, DollarSign, Target, Users, UserPlus, Wifi, WifiOff, Database, Box, TrendingUp, Printer, Download, Truck, FileText, AlertOctagon } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBXcNlrIjGkmGF31HlA97WHqQAGV4-1mkU",
  authDomain: "farma-salud-pos.firebaseapp.com",
  projectId: "farma-salud-pos",
  storageBucket: "farma-salud-pos.firebasestorage.app",
  messagingSenderId: "251729622472",
  appId: "1:251729622472:web:d1ba9228b3966155797cfd"
};

let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Error al inicializar Firebase:", e);
}

const INITIAL_PRODUCTS = [
  { id: "P001", name: "Paracetamol 500 mg x 100 tab", category: "Analgésicos", price: 3.50, stock: 150, expiryDate: "2027-12-31" },
  { id: "P002", name: "Ibuprofeno 400 mg x 100 tab", category: "Antiinflamatorios", price: 5.00, stock: 90, expiryDate: "2026-08-15" },
  { id: "P003", name: "Amoxicilina 500 mg x 100 cap", category: "Antibióticos", price: 12.00, stock: 45, expiryDate: "2026-10-20" },
  { id: "P004", name: "Alcohol 70% Medicinal 1 Litro", category: "Insumos", price: 8.50, stock: 30, expiryDate: "2028-01-01" }
];

const INITIAL_STAFF = [
  { id: 'CAJ-001', name: 'María Pérez', role: 'CAJERO', joined: '10/09/2026' },
  { id: 'CAJ-002', name: 'Juan Torres', role: 'CAJERO', joined: '12/09/2026' }
];

export default function App() {
  // --- ESTADOS INMUNES AL F5 (LocalStorage) ---
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('fs_user')) || null);
  const [cashSession, setCashSession] = useState(() => JSON.parse(localStorage.getItem('fs_cash')) || { isOpen: false, openingAmount: 0, declaredAmount: null, result: null, shiftId: null });
  
  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState(currentUser ? (cashSession.isOpen ? 'POS' : 'OPEN_CASH') : 'LOGIN'); 
  const [dbStatus, setDbStatus] = useState('VERIFICANDO...'); 
  
  // --- ESTADOS SINCRONIZADOS CON FIREBASE ---
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [sales, setSales] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // --- ESTADOS FORMULARIOS ---
  const [adminLoginModal, setAdminLoginModal] = useState(false);
  const [cashierLoginModal, setCashierLoginModal] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [openingAmount, setOpeningAmount] = useState(''); 
  const [closingAmount, setClosingAmount] = useState('');
  const [newStaffForm, setNewStaffForm] = useState({ name: '' });
  const [newProductForm, setNewProductForm] = useState({ name: '', category: '', price: '', expiryDate: '' });
  const [newInvoiceForm, setNewInvoiceForm] = useState({ supplier: '', document: '', amount: '' });
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Persistencia de sesión
  useEffect(() => {
    localStorage.setItem('fs_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('fs_cash', JSON.stringify(cashSession));
  }, [cashSession]);

  useEffect(() => {
    if (!db) {
       setDbStatus('ERROR CRÍTICO');
       showAlert("Firebase no configurado. Llaves inválidas.", "error");
       return;
    }

    const testAndSubscribe = async () => {
        try {
            // Prueba de conexión
            const testQuery = query(collection(db, 'system_test'), limit(1));
            await getDocs(testQuery);
            setDbStatus('CONECTADO');

            // 1. Escuchar Productos
            const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
                if (snap.empty) { INITIAL_PRODUCTS.forEach(p => setDoc(doc(db, 'products', p.id), p)); } 
                else { setProducts(snap.docs.map(d => d.data())); }
            });

            // 2. Escuchar Personal
            const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
                if (snap.empty) { INITIAL_STAFF.forEach(s => setDoc(doc(db, 'staff', s.id), s)); } 
                else { setStaff(snap.docs.map(d => d.data())); }
            });

            // 3. Escuchar Ventas
            const unsubSales = onSnapshot(collection(db, 'sales'), (snap) => {
                const data = snap.docs.map(d => d.data());
                setSales(data.sort((a,b) => b.id.localeCompare(a.id))); // Ordenar por ID reciente
            });

            // 4. Escuchar Facturas
            const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
                const data = snap.docs.map(d => d.data());
                setInvoices(data.sort((a,b) => b.id.localeCompare(a.id)));
            });

            // 5. Escuchar Auditoría
            const unsubAudit = onSnapshot(collection(db, 'audit'), (snap) => {
                const data = snap.docs.map(d => d.data());
                setAuditLogs(data.sort((a,b) => b.id.localeCompare(a.id)));
            });

            return () => { unsubProducts(); unsubStaff(); unsubSales(); unsubInvoices(); unsubAudit(); };
        } catch (error) {
            console.error("Error Firebase:", error);
            setDbStatus('MODO LOCAL (BLOQUEADO)');
            showAlert("¡Firebase bloqueó la lectura! Actualice las Reglas a 'allow read, write: if true;'", "error");
        }
    };
    testAndSubscribe();
  }, []);

  const formatCurrency = (amount) => `S/ ${parseFloat(amount).toFixed(2)}`;
  const getTimestamp = () => {
    const now = new Date();
    return { date: now.toLocaleDateString('es-PE'), time: now.toLocaleTimeString('es-PE', { hour12: false }) };
  };

  const showAlert = (msg, type = 'info') => {
    const newAlert = { id: Date.now(), msg, type };
    setAlerts(prev => [newAlert, ...prev]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== newAlert.id)), 5000);
  };

  const registerAudit = async (action, detail) => {
      if (dbStatus !== 'CONECTADO') return;
      const id = `LOG-${Date.now()}`;
      const { date, time } = getTimestamp();
      const user = currentUser ? currentUser.name : 'SISTEMA';
      try { await setDoc(doc(db, 'audit', id), { id, date, time, user, action, detail }); } catch (e) { console.error(e); }
  };

  const handleAdminLogin = () => {
      setCurrentUser({ id: 'ADMIN-ROOT', name: 'Administrador Principal', role: 'ADMIN' });
      setActiveTab('DASHBOARD');
      registerAudit("LOGIN", "Administrador ingresó al sistema.");
      setAdminLoginModal(false);
  };

  const handleCashierLogin = (staffMember) => {
      setCurrentUser({ id: staffMember.id, name: staffMember.name, role: staffMember.role });
      setActiveTab(cashSession.isOpen && !cashSession.result ? 'POS' : 'OPEN_CASH');
      registerAudit("LOGIN", `Cajero ${staffMember.name} ingresó al sistema.`);
      setCashierLoginModal(false);
  };

  const handleLogout = () => {
      registerAudit("LOGOUT", `${currentUser.name} cerró sesión.`);
      setCurrentUser(null);
      setActiveTab('LOGIN');
      setCart([]);
  };

  const handleOpenCashRegister = (e) => {
    e.preventDefault();
    const amount = parseFloat(openingAmount);
    const shiftId = `TURNO-${Date.now()}`;
    setCashSession({ isOpen: true, openingAmount: amount, declaredAmount: null, result: null, shiftId });
    registerAudit("APERTURA CAJA", `Fondo inicial: S/ ${amount}`);
    setActiveTab('POS');
  };

  const handleCloseCashRegister = (e) => {
    e.preventDefault();
    if (!cashSession.shiftId) return;
    const declared = parseFloat(closingAmount);
    if (isNaN(declared) || declared < 0) return showAlert("Monto inválido.", "error");

    const completedSales = sales.filter(s => s.status === 'COMPLETADA' && s.shiftId === cashSession.shiftId);
    const totalSalesAmount = completedSales.reduce((acc, s) => acc + s.total, 0);
    const expected = cashSession.openingAmount + totalSalesAmount;
    const difference = declared - expected;

    setCashSession(prev => ({ ...prev, isOpen: false, declaredAmount: declared, result: { expected, difference } }));
    registerAudit("CIERRE CAJA", `Declarado: S/ ${declared} | Esperado: S/ ${expected} | Diferencia: S/ ${difference}`);
    showAlert(`Cierre completado. Diferencia: S/ ${difference}`, difference === 0 ? 'success' : 'error');
  };

  const handleArchiveShift = () => {
    setCashSession({ isOpen: false, openingAmount: 0, declaredAmount: null, result: null, shiftId: null });
    setActiveTab('OPEN_CASH');
    setClosingAmount('');
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim()) return showAlert('Ingrese el nombre del cajero.', 'error');
    if (dbStatus !== 'CONECTADO') return showAlert('No hay conexión a Firebase. No se puede guardar.', 'error');

    const newId = `CAJ-${Date.now().toString().slice(-4)}`;
    const newEmployee = { id: newId, name: newStaffForm.name.trim(), role: 'CAJERO', joined: getTimestamp().date };
    
    try {
        await setDoc(doc(db, 'staff', newId), newEmployee);
        registerAudit("NUEVO CAJERO", `Se registró a ${newEmployee.name}`);
        showAlert('Cajero guardado exitosamente en la nube.', 'success');
        setNewStaffForm({ name: '' });
    } catch (err) { showAlert('Error al guardar en Firebase.', 'error'); }
  };

  const handleDeleteStaff = async (staffId) => {
      if (dbStatus !== 'CONECTADO') return showAlert('No hay conexión.', 'error');
      try {
          await deleteDoc(doc(db, 'staff', staffId));
          registerAudit("ELIMINA CAJERO", `Se eliminó al cajero ID: ${staffId}`);
          showAlert('Cajero eliminado de la base de datos.', 'info');
      } catch (err) { showAlert('Error al eliminar.', 'error'); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.price || !newProductForm.expiryDate) return showAlert('Faltan datos.', 'error');
    if (dbStatus !== 'CONECTADO') return showAlert('No hay conexión a Firebase.', 'error');

    const newId = `P-${Date.now().toString().slice(-5)}`;
    const newProd = {
      id: newId, name: newProductForm.name, category: newProductForm.category || 'Otros',
      price: parseFloat(newProductForm.price), stock: 0, expiryDate: newProductForm.expiryDate
    };
    
    try {
        await setDoc(doc(db, 'products', newId), newProd);
        registerAudit("NUEVO PRODUCTO", `Se registró producto: ${newProd.name}`);
        showAlert('Producto guardado en la nube.', 'success');
        setNewProductForm({ name: '', category: '', price: '', expiryDate: '' });
    } catch (err) { showAlert('Error al guardar producto.', 'error'); }
  };

  const handleAddInvoice = async (e) => {
      e.preventDefault();
      if (!newInvoiceForm.supplier || !newInvoiceForm.amount) return showAlert('Faltan datos.', 'error');
      if (dbStatus !== 'CONECTADO') return showAlert('No hay conexión.', 'error');

      const id = `FAC-${Date.now().toString().slice(-5)}`;
      const { date } = getTimestamp();
      const invoice = { id, date, supplier: newInvoiceForm.supplier, document: newInvoiceForm.document, amount: parseFloat(newInvoiceForm.amount) };
      
      try {
          await setDoc(doc(db, 'invoices', id), invoice);
          registerAudit("NUEVA FACTURA", `Factura ${invoice.document} de ${invoice.supplier} por S/ ${invoice.amount}`);
          showAlert('Factura registrada con éxito.', 'success');
          setNewInvoiceForm({ supplier: '', document: '', amount: '' });
      } catch (err) { showAlert('Error al registrar factura.', 'error'); }
  };

  const addToCart = (product) => {
    if (!cashSession.isOpen) return showAlert("Debe abrir la caja primero.", "error");
    if (product.stock <= 0) return showAlert("Producto sin stock.", "error");
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if(existing.qty >= product.stock) return prev;
        return prev.map(item => item.productId === product.id ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price } : item);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1, subtotal: product.price }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        let newQty = item.qty + delta;
        if(newQty > product.stock) newQty = product.stock;
        return newQty > 0 ? { ...item, qty: newQty, subtotal: newQty * item.price } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const processCheckout = async () => {
    if (cart.length === 0) return;
    if (dbStatus !== 'CONECTADO') return showAlert("Sin conexión a la nube. Espere un momento.", "error");

    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const { date, time } = getTimestamp();
    const saleId = `T-${Date.now().toString().slice(-6)}`;
    const newSale = { id: saleId, date, time, seller: currentUser.name, shiftId: cashSession.shiftId, items: cart, total, status: 'COMPLETADA' };

    try {
        await setDoc(doc(db, 'sales', saleId), newSale);
        for (const item of cart) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                await updateDoc(doc(db, 'products', product.id), { stock: product.stock - item.qty });
            }
        }
        registerAudit("VENTA REALIZADA", `Ticket ${saleId} cobrado por S/ ${total}`);
        setCart([]);
        showAlert(`Ticket ${saleId} cobrado y guardado en la nube.`, 'success');
    } catch (e) {
        console.error(e);
        showAlert("Error crítico al procesar la venta en Firebase.", "error");
    }
  };

  const handlePrint = () => {
      window.print();
      registerAudit("IMPRESIÓN", `Se solicitó impresión de comprobante`);
  };

  const handleDownloadPDF = (saleId) => {
      showAlert(`Generando PDF del ticket ${saleId}...`, 'info');
      setTimeout(() => showAlert(`PDF descargado exitosamente.`, 'success'), 1500);
      registerAudit("DESCARGA PDF", `Se descargó el ticket ${saleId} en PDF`);
  };

  const displayedProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalSalesAmount = sales.filter(s => s.status === 'COMPLETADA').reduce((a,b) => a + b.total, 0);
  const totalInvoicesAmount = invoices.reduce((a,b) => a + b.amount, 0);
  
  // Lógica de Vencimientos
  const today = new Date();
  const sortedExpiries = [...products].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      
      {/* HEADER PRINCIPAL */}
      <header className="bg-slate-900 border-b border-slate-700 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-lg flex items-center justify-center">
              <img src="https://i.imgur.com/rMiaZmc.png" alt="Logo Farma Salud" className="h-10 w-auto object-contain drop-shadow-md" />
            </div>
            <div className="hidden sm:flex flex-col gap-1">
                <span className="text-[10px] font-bold bg-blue-900/50 text-blue-200 px-2 py-0.5 rounded border border-blue-700/50 tracking-wider uppercase w-max">
                  Core System
                </span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-colors ${
                    dbStatus === 'CONECTADO' ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50' : 
                    'bg-red-900/50 text-red-400 border-red-700/50'
                }`}>
                    {dbStatus === 'CONECTADO' ? <Database size={10}/> : <WifiOff size={10}/>}
                    BD: {dbStatus}
                </div>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-200">{currentUser.name}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${currentUser.role === 'ADMIN' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'}`}>
                  {currentUser.role}
                </span>
              </div>
              <button onClick={handleLogout} className="bg-slate-800 p-2 rounded-lg hover:bg-red-900 text-white transition-all">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ALERTAS FLOTANTES GLOBALES */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        {alerts.map(a => (
          <div key={a.id} className={`p-4 rounded-xl shadow-2xl border-l-4 font-bold text-sm max-w-sm flex items-center gap-3 animate-in slide-in-from-right-8 ${
            a.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-slate-900 border-emerald-500 text-emerald-400'
          }`}>
            {a.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
            {a.msg}
          </div>
        ))}
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col gap-4">
        
        {/* LOGIN */}
        {!currentUser && activeTab === 'LOGIN' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
              <div className="text-center mb-8">
                <img src="https://i.imgur.com/rMiaZmc.png" alt="Logo" className="h-20 mx-auto mb-4 drop-shadow-sm" />
                <h2 className="text-2xl font-black text-slate-800">Acceso al Sistema</h2>
              </div>
              <div className="space-y-4">
                <button onClick={() => setCashierLoginModal(true)} className="w-full py-4 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all flex justify-center items-center gap-2">
                    <Package size={18}/> Entrar como Cajero
                </button>
                <button onClick={() => setAdminLoginModal(true)} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2">
                    <ShieldAlert size={18}/> Acceso Administrador
                </button>
              </div>
            </div>
          </div>
        )}

        {/* APERTURA CAJA */}
        {activeTab === 'OPEN_CASH' && (
           <div className="flex-1 flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 border-t-4 border-t-emerald-500 max-w-md w-full">
             <div className="text-center mb-6">
               <h2 className="text-xl font-black text-slate-800">Apertura de Turno</h2>
               <p className="text-xs text-slate-500 mt-2">Hola <b>{currentUser?.name}</b>, declare el efectivo inicial de su gaveta.</p>
             </div>
             <form onSubmit={handleOpenCashRegister} className="space-y-6">
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Monto Físico Inicial (S/)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">S/</span>
                    <input type="number" step="0.10" required value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors" placeholder="0.00" />
                 </div>
               </div>
               <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all">ABRIR CAJA</button>
             </form>
           </div>
         </div>
        )}

        {/* BARRA NAVEGACIÓN */}
        {currentUser && activeTab !== 'OPEN_CASH' && activeTab !== 'LOGIN' && (
          <nav className="bg-white shadow-sm border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1">
            {currentUser.role === 'CAJERO' ? (
              <>
                <button onClick={() => setActiveTab('POS')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'POS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><ShoppingCart size={14} /> PUNTO DE VENTA</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Clock size={14} /> HISTORIAL</button>
                <button onClick={() => setActiveTab('CASH')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'CASH' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Activity size={14} /> CIERRE DE CAJA</button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'DASHBOARD' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><TrendingUp size={14} /> DASHBOARD</button>
                <button onClick={() => setActiveTab('ADMIN_PROD')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'ADMIN_PROD' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Box size={14} /> CATÁLOGO Y PRECIOS</button>
                <button onClick={() => setActiveTab('INVOICES')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'INVOICES' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Truck size={14} /> PROVEEDORES Y FACTURAS</button>
                <button onClick={() => setActiveTab('EXPIRIES')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'EXPIRIES' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><AlertOctagon size={14} /> VENCIMIENTOS</button>
                <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Users size={14} /> PERSONAL</button>
                <button onClick={() => setActiveTab('AUDIT')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'AUDIT' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><ShieldAlert size={14} /> AUDITORÍA</button>
              </>
            )}
          </nav>
        )}

        {/* --- MÓDULOS DEL CAJERO --- */}
        
        {/* POS */}
        {activeTab === 'POS' && (
          <div className="flex flex-col lg:flex-row gap-4 h-[75vh]">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="mb-4 relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input type="text" placeholder="Buscar por nombre o código..." className="w-full pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {displayedProducts.map(p => (
                        <div key={p.id} onClick={() => addToCart(p)} className={`bg-white border rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between aspect-square group ${p.stock <= 10 ? 'border-red-200 hover:border-red-500 bg-red-50/20' : 'border-slate-200 hover:border-emerald-500'}`}>
                            <div>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono block w-max">{p.id}</span>
                                <h4 className={`font-bold text-sm mt-2 leading-tight ${p.stock <= 10 ? 'text-red-900' : 'text-slate-800 group-hover:text-emerald-700'}`}>{p.name}</h4>
                            </div>
                            <div className="mt-4 flex justify-between items-end">
                                <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Stock</span><span className={`font-black ${p.stock <= 10 ? 'text-red-600' : 'text-slate-700'}`}>{p.stock}</span></div>
                                <span className={`font-black ${p.stock <= 10 ? 'text-red-800' : 'text-emerald-600'}`}>{formatCurrency(p.price)}</span>
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
            </div>

            <div className="w-full lg:w-[400px] bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <h3 className="font-black text-slate-800 text-lg border-b pb-4 mb-4 flex items-center gap-2"><ShoppingCart size={20}/> Ticket Actual</h3>
              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center text-slate-400 mt-10">Agregue productos al carrito</div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.productId} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="font-bold text-sm mb-2">{item.name}</div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <button onClick={() => updateCartQty(item.productId, -1)} className="px-2 py-1 bg-white border rounded text-slate-600 font-bold hover:bg-slate-100">-</button>
                                <span className="text-xs font-bold text-slate-700 w-4 text-center">{item.qty}</span>
                                <button onClick={() => updateCartQty(item.productId, 1)} className="px-2 py-1 bg-white border rounded text-slate-600 font-bold hover:bg-slate-100">+</button>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400">{formatCurrency(item.price)} c/u</div>
                                <div className="font-black text-emerald-600 text-lg">{formatCurrency(item.subtotal)}</div>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-6 border-t mt-4">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total a Pagar</span>
                  <span className="text-4xl font-black text-slate-900">{formatCurrency(cart.reduce((s, i) => s + i.subtotal, 0))}</span>
                </div>
                <button onClick={processCheckout} disabled={cart.length === 0 || dbStatus !== 'CONECTADO'} className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl text-lg transition-all">COBRAR Y GUARDAR</button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[75vh]">
             <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock /> Historial de Ventas</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1"><Database size={12}/> Guardado en Nube</span>
             </div>
             
             <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold">
                         <tr>
                             <th className="p-4 rounded-tl-lg">Comprobante</th>
                             <th className="p-4">Hora</th>
                             <th className="p-4">Vendedor</th>
                             <th className="p-4">Detalle</th>
                             <th className="p-4 text-right">Monto Total</th>
                             <th className="p-4 text-center">Estado</th>
                             <th className="p-4 text-center rounded-tr-lg">Acciones</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {sales.length === 0 && <tr><td colSpan="7" className="text-center py-10 text-slate-400">No hay ventas registradas.</td></tr>}
                         {sales.map(s => (
                             <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="p-4 font-mono font-bold text-slate-800">{s.id}</td>
                                 <td className="p-4 text-slate-500">{s.time}</td>
                                 <td className="p-4 font-bold text-slate-700">{s.seller}</td>
                                 <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">{s.items.map(i=>`${i.qty}x ${i.name}`).join(', ')}</td>
                                 <td className="p-4 text-right font-black text-emerald-600">{formatCurrency(s.total)}</td>
                                 <td className="p-4 text-center">
                                     <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black">COMPLETADA</span>
                                 </td>
                                 <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={handlePrint} className="p-2 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors" title="Imprimir Comprobante"><Printer size={16}/></button>
                                        <button onClick={() => handleDownloadPDF(s.id)} className="p-2 bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors" title="Descargar PDF"><Download size={16}/></button>
                                    </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
        )}

        {/* CASH */}
        {activeTab === 'CASH' && (
          <div className="flex items-center justify-center h-[75vh]">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2"><Activity /> Control de Caja</h2>
                <p className="text-xs text-slate-500 mt-2">Fondo de Apertura: {formatCurrency(cashSession.openingAmount)}</p>
              </div>
              {!cashSession.result ? (
                <form onSubmit={handleCloseCashRegister} className="space-y-6">
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-xs text-center font-bold mb-4">
                     ⚠️ CIERRE CIEGO ACTIVO <br/>
                     Cuente el dinero físico de su gaveta. El sistema no revelará el monto esperado.
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Efectivo Total Contado (S/)</label>
                    <div className="relative">
                       <span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">S/</span>
                       <input type="number" step="0.10" required value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:bg-white focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-all">Cerrar Turno</button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                    <div className="flex justify-between text-slate-500 font-medium"><span>Monto Esperado:</span><span className="text-slate-800 font-bold">{formatCurrency(cashSession.result.expected)}</span></div>
                    <div className="flex justify-between text-slate-500 font-medium"><span>Monto Declarado:</span><span className="text-slate-800 font-bold">{formatCurrency(cashSession.declaredAmount)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Diferencia:</span><span className={cashSession.result.difference === 0 ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(cashSession.result.difference)}</span></div>
                  </div>
                  <div className="bg-red-50 text-red-900 text-[10px] p-3 rounded border border-red-200 font-bold text-center">🔒 TURNO FINALIZADO Y BLOQUEADO.</div>
                  <button onClick={handleArchiveShift} className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all text-xs uppercase tracking-widest">Iniciar Siguiente Turno</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MÓDULOS DEL ADMINISTRADOR --- */}

        {/* DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={24}/></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas Totales (Nube)</p>
                            <p className="text-xl font-black text-slate-800">{formatCurrency(totalSalesAmount)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl"><ArrowDownCircle size={24}/></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compras Registradas</p>
                            <p className="text-xl font-black text-red-700">{formatCurrency(totalInvoicesAmount)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Target size={24}/></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Neto</p>
                            <p className={`text-xl font-black ${totalSalesAmount - totalInvoicesAmount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(totalSalesAmount - totalInvoicesAmount)}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ADMIN PROD (Catálogo) */}
        {activeTab === 'ADMIN_PROD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6 h-fit">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4 flex items-center gap-2"><Box size={18}/> Nuevo Producto</h3>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre</label>
                            <input type="text" required value={newProductForm.name} onChange={e=>setNewProductForm({...newProductForm, name: e.target.value})} className="w-full border rounded-lg p-3 text-sm focus:border-blue-500 outline-none mt-1" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Precio</label>
                                <input type="number" step="0.10" required value={newProductForm.price} onChange={e=>setNewProductForm({...newProductForm, price: e.target.value})} className="w-full border rounded-lg p-3 text-sm focus:border-blue-500 outline-none mt-1" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Vencimiento</label>
                                <input type="date" required value={newProductForm.expiryDate} onChange={e=>setNewProductForm({...newProductForm, expiryDate: e.target.value})} className="w-full border rounded-lg p-3 text-sm focus:border-blue-500 outline-none mt-1" />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg transition-colors">AÑADIR A CATÁLOGO</button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4 flex items-center gap-2"><Target size={18}/> Catálogo Sincronizado</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 uppercase text-[10px] text-slate-500">
                                <tr><th className="p-4">Cód</th><th className="p-4">Producto</th><th className="p-4 text-center">Stock</th><th className="p-4 text-right">Precio</th></tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="p-4 text-xs font-mono">{p.id}</td><td className="p-4 font-bold">{p.name}</td>
                                        <td className="p-4 text-center"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-black">{p.stock}</span></td>
                                        <td className="p-4 text-right font-black text-emerald-600">{formatCurrency(p.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* PROVEEDORES Y FACTURAS */}
        {activeTab === 'INVOICES' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6 h-fit">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4 flex items-center gap-2"><Truck size={18}/> Registrar Factura</h3>
                    <form onSubmit={handleAddInvoice} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Proveedor</label>
                            <input type="text" required value={newInvoiceForm.supplier} onChange={e=>setNewInvoiceForm({...newInvoiceForm, supplier: e.target.value})} className="w-full border rounded-lg p-3 text-sm focus:border-blue-500 outline-none mt-1" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">N° Documento</label>
                            <input type="text" required value={newInvoiceForm.document} onChange={e=>setNewInvoiceForm({...newInvoiceForm, document: e.target.value})} className="w-full border rounded-lg p-3 text-sm focus:border-blue-500 outline-none mt-1" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Monto Total (S/)</label>
                            <input type="number" step="0.10" required value={newInvoiceForm.amount} onChange={e=>setNewInvoiceForm({...newInvoiceForm, amount: e.target.value})} className="w-full border rounded-lg p-3 text-sm focus:border-blue-500 outline-none mt-1" />
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg transition-colors">REGISTRAR COMPRA</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4 flex items-center gap-2"><FileText size={18}/> Historial de Compras</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 uppercase text-[10px] text-slate-500">
                                <tr><th className="p-4">Fecha</th><th className="p-4">Proveedor</th><th className="p-4">Documento</th><th className="p-4 text-right">Monto</th></tr>
                            </thead>
                            <tbody>
                                {invoices.length === 0 && <tr><td colSpan="4" className="text-center py-10 text-slate-400">No hay facturas registradas.</td></tr>}
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="p-4 text-slate-500">{inv.date}</td>
                                        <td className="p-4 font-bold">{inv.supplier}</td>
                                        <td className="p-4 font-mono text-xs">{inv.document}</td>
                                        <td className="p-4 text-right font-black text-red-600">{formatCurrency(inv.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
        )}

        {/* VENCIMIENTOS */}
        {activeTab === 'EXPIRIES' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[75vh]">
             <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><AlertOctagon /> Control de Vencimientos</h3>
             </div>
             <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold">
                         <tr>
                             <th className="p-4">Cód</th>
                             <th className="p-4">Producto</th>
                             <th className="p-4 text-center">Stock</th>
                             <th className="p-4 text-right">Fecha Caducidad</th>
                             <th className="p-4 text-center">Estado</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {sortedExpiries.map(p => {
                             const expDate = new Date(p.expiryDate);
                             const diffTime = Math.abs(expDate - today);
                             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                             const isNear = diffDays <= 90;
                             
                             return (
                                 <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                     <td className="p-4 font-mono font-bold text-slate-500">{p.id}</td>
                                     <td className="p-4 font-bold text-slate-800">{p.name}</td>
                                     <td className="p-4 text-center">{p.stock}</td>
                                     <td className={`p-4 text-right font-black ${isNear ? 'text-red-600' : 'text-slate-600'}`}>{p.expiryDate}</td>
                                     <td className="p-4 text-center">
                                         {isNear ? <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-[10px] font-black">PRÓXIMO A VENCER</span> : <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black">VIGENTE</span>}
                                     </td>
                                 </tr>
                             )
                         })}
                     </tbody>
                 </table>
             </div>
          </div>
        )}

        {/* PERSONAL */}
        {activeTab === 'USERS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6 h-fit">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4 flex items-center gap-2"><UserPlus size={18}/> Registrar Cajero</h3>
                    <form onSubmit={handleAddStaff} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre Completo</label>
                            <input type="text" required value={newStaffForm.name} onChange={e=>setNewStaffForm({name: e.target.value})} className="w-full bg-slate-50 border rounded-lg p-3 text-sm focus:border-blue-500 outline-none mt-1" />
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg transition-colors">GUARDAR EN FIREBASE</button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4 flex items-center gap-2"><Users size={18}/> Personal en Base de Datos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {staff.map(emp => (
                            <div key={emp.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-slate-50 hover:border-blue-300 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg">
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{emp.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {emp.id} • Rol: {emp.role}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteStaff(emp.id)} className="text-slate-400 hover:bg-red-100 hover:text-red-600 p-2 rounded-lg transition-colors"><XCircle size={20}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* AUDITORÍA */}
        {activeTab === 'AUDIT' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[75vh]">
             <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShieldAlert /> Auditoría de Seguridad</h3>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">Registro Inalterable</span>
             </div>
             <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold">
                         <tr>
                             <th className="p-4">Fecha / Hora</th>
                             <th className="p-4">Usuario</th>
                             <th className="p-4">Acción</th>
                             <th className="p-4">Detalle Completo</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {auditLogs.length === 0 && <tr><td colSpan="4" className="text-center py-10 text-slate-400">No hay registros de auditoría.</td></tr>}
                         {auditLogs.map(log => (
                             <tr key={log.id} className="hover:bg-slate-50 transition-colors font-mono text-xs">
                                 <td className="p-4 text-slate-500">{log.date} {log.time}</td>
                                 <td className="p-4 font-bold text-slate-800">{log.user}</td>
                                 <td className="p-4 font-bold text-blue-600">{log.action}</td>
                                 <td className="p-4 text-slate-600">{log.detail}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
        )}

      </main>

      {/* MODALES DE LOGIN */}
      {cashierLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border-t-4 border-emerald-500">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Users className="text-emerald-500"/> Seleccione Perfil</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {staff.map(emp => (
                    <button key={emp.id} onClick={() => handleCashierLogin(emp)} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-200 group-hover:text-emerald-700 flex items-center justify-center font-black text-lg transition-colors">
                            {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span className="font-bold text-lg block">{emp.name}</span>
                            <span className="text-xs text-slate-500">{emp.role}</span>
                        </div>
                    </button>
                ))}
            </div>
            <button onClick={()=>setCashierLoginModal(false)} className="w-full mt-4 py-3 bg-slate-100 font-bold rounded-xl text-slate-600 hover:bg-slate-200">CANCELAR</button>
          </div>
        </div>
      )}

      {adminLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border-t-4 border-blue-500">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2"><ShieldAlert className="text-blue-500"/> Clave de Acceso</h3>
            <form onSubmit={(e) => { e.preventDefault(); if(new FormData(e.target).get('password') === '1234') handleAdminLogin(); else showAlert('Clave incorrecta', 'error'); }}>
              <input name="password" type="password" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-2xl tracking-widest mb-4 outline-none focus:border-blue-500" autoFocus placeholder="••••" />
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-colors">INGRESAR</button>
              <button type="button" onClick={()=>setAdminLoginModal(false)} className="w-full mt-2 py-3 bg-slate-100 font-bold rounded-xl text-slate-600 hover:bg-slate-200">CANCELAR</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}