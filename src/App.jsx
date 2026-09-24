import React, { useState, useEffect } from 'react';
import { ShoppingCart, LogOut, Package, ShieldAlert, BarChart3, AlertTriangle, CheckCircle, XCircle, Search, Edit3, Clock, ArrowDownCircle, ArrowUpCircle, AlertCircle, Box, TrendingUp, Truck, FileText, Activity, Calendar, CalendarDays, CalendarRange, DollarSign, Target, Download, Users, UserPlus, Wifi, WifiOff, Database, Printer } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot, getDocs, limit, query, deleteDoc } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE (Tus Llaves Exactas) ---
const firebaseConfig = {
  apiKey: "AIzaSyBXcNlrIjGkmGF31HlA97WHqQAGV4-1mkU",
  authDomain: "farma-salud-pos.firebaseapp.com",
  projectId: "farma-salud-pos",
  storageBucket: "farma-salud-pos.firebasestorage.app",
  messagingSenderId: "251729622472",
  appId: "1:251729622472:web:d1ba9228b3966155797cfd"
};

// Inicialización
let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Error al inicializar Firebase:", e);
}

const INITIAL_PRODUCTS = [
  { id: "P001", name: "Paracetamol 500 mg x 100 tab", category: "Analgésicos", price: 3.50, stock: 15, lots: [{ id: 'L1', lote: 'L-VENC-01', exp: '2026-08-15', qty: 15 }] },
  { id: "P002", name: "Ibuprofeno 400 mg x 100 tab", category: "Antiinflamatorios", price: 5.00, stock: 90, lots: [{ id: 'L2', lote: 'L-VENC-02', exp: '2026-09-10', qty: 90 }] },
  { id: "P003", name: "Amoxicilina 500 mg x 100 cap", category: "Antibióticos", price: 12.00, stock: 8, lots: [{ id: 'L3', lote: 'L-VENC-03', exp: '2025-12-31', qty: 8 }] },
  { id: "P004", name: "Alcohol 70% Medicinal 1 Litro", category: "Insumos", price: 8.50, stock: 30, lots: [{ id: 'L4', lote: 'L-PROX-01', exp: '2026-10-01', qty: 30 }] }
];

const INITIAL_STAFF = [
  { id: 'CAJ-001', name: 'Administrador Principal', role: 'ADMIN', joined: '10/09/2026' }
];

export default function App() {
  // App States
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('fs_user')) || null);
  const [cashSession, setCashSession] = useState(() => JSON.parse(localStorage.getItem('fs_cash')) || { isOpen: false, openingAmount: 0, declaredAmount: null, result: null, shiftId: null });
  const [activeTab, setActiveTab] = useState(() => {
      const savedUser = JSON.parse(localStorage.getItem('fs_user'));
      const savedCash = JSON.parse(localStorage.getItem('fs_cash')) || { isOpen: false, result: null };
      
      if (!savedUser) return 'LOGIN';
      if (savedUser.role === 'ADMIN') return 'DASHBOARD';
      if (savedCash.isOpen && !savedCash.result) return 'POS';
      if (!savedCash.isOpen && savedCash.result) return 'CASH';
      return 'OPEN_CASH';
  }); 

  const [dbStatus, setDbStatus] = useState('VERIFICANDO...'); 
  
  // Real-Time States (Sincronizados con Firebase)
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [sales, setSales] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  
  // UI & Form States
  const [adminLoginModal, setAdminLoginModal] = useState(false);
  const [cashierLoginModal, setCashierLoginModal] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, action: null, payload: null, error: '' });
  const [successCheckoutModal, setSuccessCheckoutModal] = useState({ isOpen: false, saleData: null }); // NUEVO ESTADO PARA EL MODAL POST-VENTA
  const [alerts, setAlerts] = useState([]);
  const [openingAmount, setOpeningAmount] = useState(''); 
  const [closingAmount, setClosingAmount] = useState('');
  
  const [newStaffForm, setNewStaffForm] = useState({ name: '' });
  const [newProductForm, setNewProductForm] = useState({ name: '', category: '', price: '' });
  const [invoiceForm, setInvoiceForm] = useState({ supplier: '', document: '', productId: '', qty: '', lote: '', expDate: '', totalCost: '' });
  const [priceEditForm, setPriceEditForm] = useState({ isOpen: false, product: null, newPrice: '', reason: '' });
  
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Persistencia de Sesión Local
  useEffect(() => {
    localStorage.setItem('fs_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('fs_cash', JSON.stringify(cashSession));
  }, [cashSession]);

  // --- 1. MOTOR DE SINCRONIZACIÓN FIREBASE (TIEMPO REAL) ---
  useEffect(() => {
    if (!db) {
       setDbStatus('LOCAL');
       showAlert("No se configuró Firebase. Operando offline.", "error");
       return;
    }

    const initFirebase = async () => {
        try {
            // Test connection
            const testQuery = query(collection(db, 'system_test'), limit(1));
            await getDocs(testQuery);
            setDbStatus('CONECTADO');
            
            // Listeners en Tiempo Real
            const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
                if (snap.empty) {
                    INITIAL_PRODUCTS.forEach(p => setDoc(doc(db, 'products', p.id), p));
                } else {
                    setProducts(snap.docs.map(d => d.data()));
                }
            });

            const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
                if (snap.empty) {
                    INITIAL_STAFF.forEach(s => setDoc(doc(db, 'staff', s.id), s));
                } else {
                    setStaff(snap.docs.map(d => d.data()));
                }
            });

            const unsubSales = onSnapshot(collection(db, 'sales'), (snap) => {
                const data = snap.docs.map(d => d.data());
                setSales(data.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0))); 
            });

            const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
                const data = snap.docs.map(d => d.data());
                setInvoices(data.sort((a,b) => b.id.localeCompare(a.id))); 
            });

            const unsubAudit = onSnapshot(collection(db, 'auditLogs'), (snap) => {
                const data = snap.docs.map(d => d.data());
                setAuditLogs(data.sort((a,b) => b.logId.localeCompare(a.logId)));
            });

            return () => { unsubProducts(); unsubStaff(); unsubSales(); unsubInvoices(); unsubAudit(); };
        } catch (error) {
            console.error(error);
            setDbStatus('LOCAL');
            showAlert("Conexión rechazada. Asegúrese de configurar las Reglas en Firebase a 'true'.", "error");
        }
    };

    initFirebase();
  }, []);

  // --- UTILIDADES ---
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

  const addAuditLog = async (action, detail) => {
    const { date, time } = getTimestamp();
    const logId = `L-${Date.now()}`;
    const newLog = { logId, date, time, user: currentUser?.name || 'SISTEMA', action, detail };
    if (dbStatus === 'CONECTADO') {
        try { await setDoc(doc(db, 'auditLogs', logId), newLog); } catch(e) { console.error(e); }
    } else {
        setAuditLogs(prev => [newLog, ...prev]); // Fallback memory
    }
  };

  // --- IMPRESIÓN Y PDF ---
  const generateTicketHTML = (sale) => {
      // Diseño optimizado para impresoras térmicas pequeñas (aprox 58mm/80mm)
      return `
          <html>
              <head>
                  <title>Ticket ${sale.id}</title>
                  <style>
                      body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; color: #000; }
                      h2, h3 { text-align: center; margin: 5px 0; }
                      .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                      .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                      .item-name { max-width: 65%; word-wrap: break-word; }
                      .item-price { max-width: 35%; text-align: right; }
                      .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
                      .footer { text-align: center; font-size: 10px; margin-top: 20px; }
                  </style>
              </head>
              <body>
                  <h2>FARMA SALUD</h2>
                  <h3>Comprobante de Venta</h3>
                  <div class="divider"></div>
                  <div><strong>Ticket:</strong> ${sale.id}</div>
                  <div><strong>Fecha:</strong> ${sale.date} ${sale.time}</div>
                  <div><strong>Cajero:</strong> ${sale.seller}</div>
                  <div class="divider"></div>
                  ${sale.items.map(item => `
                      <div class="item">
                          <span class="item-name">${item.qty}x ${item.name}</span>
                          <span class="item-price">S/ ${item.subtotal.toFixed(2)}</span>
                      </div>
                  `).join('')}
                  <div class="divider"></div>
                  <div class="total">TOTAL: S/ ${sale.total.toFixed(2)}</div>
                  <div class="footer">¡Gracias por su compra!<br>Conservar este comprobante en caso de devoluciones.</div>
              </body>
          </html>
      `;
  };

  const handlePrintReal = (sale) => {
      const ticketWindow = window.open('', '_blank', 'width=400,height=600');
      if(!ticketWindow) return showAlert('El navegador bloqueó la ventana emergente. Por favor, permita las ventanas emergentes (pop-ups) para imprimir.', 'error');
      
      ticketWindow.document.write(generateTicketHTML(sale));
      ticketWindow.document.close();
      ticketWindow.focus();
      
      setTimeout(() => {
          ticketWindow.print();
          ticketWindow.close();
      }, 250);
      addAuditLog("IMPRESIÓN TICKET", `Se imprimió el ticket térmico ${sale.id}.`);
  };

  const handleDownloadPDF = (sale) => {
      showAlert(`Generando PDF del ticket ${sale.id}...`, 'info');
      
      if (!window.html2pdf) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = () => executePDFDownload(sale);
          document.head.appendChild(script);
      } else {
          executePDFDownload(sale);
      }
  };

  const executePDFDownload = (sale) => {
      const element = document.createElement('div');
      element.innerHTML = generateTicketHTML(sale);
      
      const opt = {
          margin:       5,
          filename:     `Ticket_FarmaSalud_${sale.id}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'mm', format: [80, 150], orientation: 'portrait' } 
      };

      window.html2pdf().set(opt).from(element).save().then(() => {
          addAuditLog("DESCARGA PDF", `Se descargó el ticket ${sale.id} en PDF`);
          showAlert('PDF generado y descargado correctamente.', 'success');
      });
  };


  // --- GESTIÓN DE PERSONAL ---
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim()) return showAlert('Ingrese el nombre del cajero.', 'error');
    const newId = `CAJ-${Date.now().toString().slice(-4)}`;
    const newEmployee = { id: newId, name: newStaffForm.name.trim(), role: 'CAJERO', joined: getTimestamp().date };
    
    if (dbStatus === 'CONECTADO') {
        await setDoc(doc(db, 'staff', newId), newEmployee);
        addAuditLog("NUEVO CAJERO", `Cajero registrado: ${newEmployee.name}`);
        showAlert('Cajero registrado y guardado en la nube.', 'success');
        setNewStaffForm({ name: '' });
    }
  };

  const handleDeleteStaff = async (staffId) => {
      if(staffId === 'CAJ-001') return showAlert('No puede eliminar al administrador principal.', 'error');
      if (dbStatus === 'CONECTADO') {
          await deleteDoc(doc(db, 'staff', staffId));
          addAuditLog("ELIMINA CAJERO", `Personal retirado: ID ${staffId}`);
          showAlert('Cajero eliminado de la base de datos.', 'info');
      }
  };

  // --- MÓDULOS DE ADMINISTRADOR (PRODUCTOS Y COMPRAS) ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.category || !newProductForm.price) return showAlert('Llene todos los campos.', 'error');
    
    const newId = `P${Date.now().toString().slice(-5)}`;
    const newProd = {
      id: newId, name: newProductForm.name, category: newProductForm.category, price: parseFloat(newProductForm.price), stock: 0, lots: []
    };
    
    if (dbStatus === 'CONECTADO') {
        await setDoc(doc(db, 'products', newId), newProd);
        addAuditLog("NUEVO PRODUCTO", `Producto creado en catálogo: ${newProd.name}`);
        showAlert('Producto añadido al catálogo de Firebase.', 'success');
        setNewProductForm({ name: '', category: '', price: '' });
    }
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    const { supplier, document: docNum, productId, qty, lote, expDate, totalCost } = invoiceForm;
    const numQty = parseInt(qty);
    
    if(!supplier || !docNum || !productId || isNaN(numQty) || !lote || !expDate) return showAlert("Llene todos los campos de la compra.", "error");

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newLot = { id: `L-${Date.now()}`, lote: lote.trim().toUpperCase(), exp: expDate, qty: numQty };
    const updatedLots = [...product.lots, newLot];
    
    const invId = `INV-${Date.now()}`;
    const newInvoice = {
        id: invId, date: getTimestamp().date, supplier, document: docNum, product: product.name, qty: numQty, cost: parseFloat(totalCost || 0), user: currentUser.name
    };

    if (dbStatus === 'CONECTADO') {
        await setDoc(doc(db, 'products', product.id), { ...product, stock: product.stock + numQty, lots: updatedLots });
        await setDoc(doc(db, 'invoices', invId), newInvoice);
        addAuditLog("RECEPCIÓN MERCADERÍA", `Factura ${docNum}: +${numQty} unidades de ${product.name}`);
        showAlert("Inventario actualizado y guardado en la nube.", "success");
        setInvoiceForm({ supplier: '', document: '', productId: '', qty: '', lote: '', expDate: '', totalCost: '' });
    }
  };


  // --- LOGIN LOGIC ---
  const handleAdminLogin = () => {
      setCurrentUser({ id: 'ADMIN-ROOT', name: 'Administrador Principal', role: 'ADMIN' });
      setActiveTab('DASHBOARD');
      addAuditLog("INICIO SESIÓN", "Acceso Administrador Principal");
      setAdminLoginModal(false);
  };

  const handleCashierLogin = (staffMember) => {
      setCurrentUser({ id: staffMember.id, name: staffMember.name, role: staffMember.role });
      setActiveTab(cashSession.isOpen && !cashSession.result ? 'POS' : 'OPEN_CASH');
      addAuditLog("INICIO SESIÓN", `Acceso de personal: ${staffMember.name}`);
      setCashierLoginModal(false);
  };

  const handleLogout = () => {
      if (currentUser?.role === 'CAJERO' && cashSession.isOpen) {
          showAlert("¡ACCESO DENEGADO! Debe realizar el Cierre de Caja antes de cerrar sesión.", "error");
          setActiveTab('CASH');
          return;
      }
      addAuditLog("CIERRE SESIÓN", `${currentUser.name} cerró el sistema.`);
      setCurrentUser(null);
      setActiveTab('LOGIN');
  };

  // --- CAJA Y POS ---
  const handleOpenCashRegister = (e) => {
    e.preventDefault();
    const amount = parseFloat(openingAmount);
    const shiftId = `TURNO-${Date.now()}`;
    setCashSession({ isOpen: true, openingAmount: amount, declaredAmount: null, result: null, shiftId });
    addAuditLog("APERTURA CAJA", `Fondo inicial registrado: S/ ${amount}`);
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
    addAuditLog("CIERRE CAJA CIEGO", `Se declaró S/ ${declared}. Esperado: S/ ${expected}. Diferencia: S/ ${difference}`);
    showAlert(`Cierre procesado. Diferencia detectada: S/ ${difference}`, difference === 0 ? 'success' : 'error');
  };

  const handleArchiveShift = () => {
    setCashSession({ isOpen: false, openingAmount: 0, declaredAmount: null, result: null, shiftId: null });
    setActiveTab('OPEN_CASH');
    setClosingAmount('');
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
      return [...prev, { productId: product.id, name: product.name, price: product.price, category: product.category, qty: 1, subtotal: product.price }];
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
    if (dbStatus !== 'CONECTADO') return showAlert("Conexión perdida. No se puede grabar la venta.", "error");

    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const { date, time } = getTimestamp();
    const timestampInternal = Date.now();
    
    const ticketNumber = (sales.length + 1).toString().padStart(7, '0');
    const saleId = `T-${ticketNumber}`;
    
    const newSale = { 
        id: saleId, timestamp: timestampInternal, date, time, seller: currentUser.name, shiftId: cashSession.shiftId, items: cart, total, status: 'COMPLETADA' 
    };

    try {
        await setDoc(doc(db, 'sales', saleId), newSale);

        for (const cartItem of cart) {
            const product = products.find(p => p.id === cartItem.productId);
            if (product) {
                await setDoc(doc(db, 'products', product.id), { ...product, stock: product.stock - cartItem.qty });
            }
        }

        addAuditLog("VENTA COBRADA", `Ticket ${saleId} cobrado por S/ ${total.toFixed(2)}`);
        
        // Limpiamos el carrito, pero abrimos el modal de éxito pasando los datos de la venta recién hecha
        setCart([]);
        setSuccessCheckoutModal({ isOpen: true, saleData: newSale });

    } catch (e) {
        console.error(e);
        showAlert("Error crítico guardando venta.", "error");
    }
  };

  // --- ANULACIÓN LÓGICA DE TICKET (ACCESIBLE POR CAJERO + PIN DE ADMIN) ---
  const requestVoid = (saleId) => setAuthModal({ isOpen: true, action: 'VOID_SALE', payload: saleId, error: '' });

  const executeVoid = async (saleId, reason) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    if (dbStatus === 'CONECTADO') {
        // 1. Marcar el ticket como ANULADA (no se borra por auditoría, se anula y resta dinero)
        await setDoc(doc(db, 'sales', saleId), { ...sale, status: 'ANULADA', voidReason: reason, voidBy: currentUser.name });
        
        // 2. Devolver el stock a los productos
        for (const cartItem of sale.items) {
             const product = products.find(p => p.id === cartItem.productId);
             if(product) {
                 await setDoc(doc(db, 'products', product.id), { ...product, stock: product.stock + cartItem.qty });
             }
        }
        
        addAuditLog("ANULACIÓN", `Ticket ${saleId} anulado por devolucion. Cajero: ${currentUser.name}. Motivo: ${reason}`);
        showAlert(`Ticket ${saleId} anulado. Dinero restado y stock devuelto.`, 'success');
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    // Para anular una venta (devolver dinero), el cajero DEBE pedirle la clave a la dueña/admin
    if (formData.get('pin') !== '1234') {
        addAuditLog("ALERTA SEGURIDAD", `PIN incorrecto ingresado intentando anular venta.`);
        return setAuthModal(prev => ({ ...prev, error: 'PIN INCORRECTO. Operación bloqueada.' }));
    }
    if (authModal.action === 'VOID_SALE') executeVoid(authModal.payload, formData.get('reason'));
    setAuthModal({ isOpen: false, action: null, payload: null, error: '' });
  };


  // --- MÉTRICAS ADMIN ---
  const getDashboardMetrics = () => {
      const todaySales = sales.filter(s => s.status === 'COMPLETADA');
      const dailyRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
      const totalInvestment = invoices.reduce((acc, inv) => acc + inv.cost, 0);
      const netProfit = dailyRevenue - totalInvestment;
      const totalAnulaciones = sales.filter(s => s.status === 'ANULADA').reduce((acc, s) => acc + s.total, 0);
      
      const catSales = {};
      todaySales.forEach(sale => {
          sale.items.forEach(item => { catSales[item.category] = (catSales[item.category] || 0) + item.subtotal; });
      });
      const sortedCategories = Object.entries(catSales).sort((a, b) => b[1] - a[1]);

      return { dailyRevenue, totalInvestment, netProfit, totalAnulaciones, ticketsCount: todaySales.length, sortedCategories };
  };

  const metrics = getDashboardMetrics();
  const displayedProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-700 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-lg flex items-center justify-center">
              <img src="https://i.imgur.com/rMiaZmc.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-md" />
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
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${currentUser.role === 'ADMIN' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'}`}>
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

      {/* ALERTAS */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {alerts.map(a => (
          <div key={a.id} className={`p-4 rounded-xl shadow-2xl border-l-4 font-bold text-sm max-w-sm flex items-center gap-3 animate-in slide-in-from-right-8 pointer-events-auto ${
            a.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-slate-900 border-emerald-500 text-emerald-400'
          }`}>
            {a.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
            {a.msg}
          </div>
        ))}
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col gap-4">
        
        {/* LOGIN VIEW */}
        {!currentUser && activeTab === 'LOGIN' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
              <div className="text-center mb-8">
                <img src="https://i.imgur.com/rMiaZmc.png" alt="Logo" className="h-20 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-800">Acceso al Sistema</h2>
              </div>
              <div className="space-y-4">
                <button onClick={() => setCashierLoginModal(true)} className="w-full py-4 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all">Entrar como Cajero</button>
                <button onClick={() => setAdminLoginModal(true)} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all">Acceso Administrador</button>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN PRINCIPAL */}
        {currentUser && activeTab !== 'OPEN_CASH' && activeTab !== 'LOGIN' && (
          <nav className="bg-white shadow-sm border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1">
            {currentUser.role === 'CAJERO' ? (
              <>
                <button onClick={() => setActiveTab('POS')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'POS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><ShoppingCart size={14} /> PUNTO DE VENTA</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Clock size={14} /> HISTORIAL DE CAJA</button>
                <button onClick={() => setActiveTab('CASH')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'CASH' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Activity size={14} /> CIERRE DE CAJA</button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'DASHBOARD' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><TrendingUp size={14} /> DASHBOARD</button>
                <button onClick={() => setActiveTab('ADMIN_PROD')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'ADMIN_PROD' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Box size={14} /> CATÁLOGO & PRECIOS</button>
                <button onClick={() => setActiveTab('INVOICES')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'INVOICES' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Truck size={14} /> COMPRAS</button>
                <button onClick={() => setActiveTab('EXPIRIES')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'EXPIRIES' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><AlertTriangle size={14} /> VENCIMIENTOS</button>
                <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Users size={14} /> PERSONAL</button>
                <button onClick={() => setActiveTab('AUDIT')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'AUDIT' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><ShieldAlert size={14} /> AUDITORÍA</button>
              </>
            )}
          </nav>
        )}

        {/* --- VISTAS DEL CAJERO --- */}
        
        {/* APERTURA DE CAJA */}
        {activeTab === 'OPEN_CASH' && (
           <div className="flex-1 flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 border-t-4 border-t-emerald-500 max-w-md w-full">
             <div className="text-center mb-6">
               <h2 className="text-xl font-black text-slate-800">Apertura de Turno</h2>
               <p className="text-xs text-slate-500 mt-2">Hola <b>{currentUser?.name}</b>, declare el efectivo inicial de su gaveta.</p>
             </div>
             <form onSubmit={handleOpenCashRegister} className="space-y-6">
               <div>
                 <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">S/</span>
                    <input type="number" step="0.10" required value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-700 bg-slate-50 border rounded-xl outline-none" placeholder="0.00" />
                 </div>
               </div>
               <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl uppercase tracking-widest text-sm shadow-md">ABRIR CAJA E INICIAR</button>
             </form>
           </div>
         </div>
        )}

        {/* PUNTO DE VENTA (DISEÑO CUADRADITO Y CON SOMBRAS) */}
        {activeTab === 'POS' && (
          <div className="flex flex-col lg:flex-row gap-4 h-[75vh]">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="mb-4 relative">
                  <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input type="text" placeholder="Buscar por nombre o código..." className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none transition-colors" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {displayedProducts.map(p => (
                        <div key={p.id} onClick={() => addToCart(p)} className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between aspect-square group relative">
                            {p.stock <= 5 && <div className="absolute top-2 right-2 bg-red-100 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded">¡POCO STOCK!</div>}
                            <div>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono block w-max">{p.id}</span>
                                <h4 className="font-bold text-sm text-slate-800 mt-2 leading-tight group-hover:text-emerald-700 transition-colors">{p.name}</h4>
                            </div>
                            <div className="mt-4 flex justify-between items-end border-t border-slate-100 pt-2">
                                <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Stock</span><span className={`font-black ${p.stock <= 5 ? 'text-red-600' : 'text-slate-700'}`}>{p.stock}</span></div>
                                <span className="font-black text-emerald-600">S/ {p.price.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
            </div>

            {/* TICKET DE VENTA (CARRITO) */}
            <div className="w-full lg:w-[400px] bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <h3 className="font-black text-slate-800 text-lg border-b pb-4 mb-4 flex items-center gap-2">🛒 Ticket de Venta</h3>
              <div className="flex-1 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center text-slate-400 mt-10 text-sm">El carrito está vacío.</div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.productId} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="font-bold text-sm mb-2 text-slate-800 leading-tight">{item.name}</div>
                        <div className="flex justify-between items-center">
                            <div className="text-xs font-bold text-slate-500 flex items-center bg-white border rounded shadow-sm">
                                <button onClick={() => updateCartQty(item.productId, -1)} className="px-3 py-1 hover:bg-slate-100 text-slate-600 font-black">-</button>
                                <span className="px-2 w-6 text-center">{item.qty}</span>
                                <button onClick={() => updateCartQty(item.productId, 1)} className="px-3 py-1 hover:bg-slate-100 text-slate-600 font-black">+</button>
                            </div>
                            <div className="font-black text-emerald-600 text-lg">S/ {item.subtotal.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-6 border-t mt-4">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total a Pagar</span>
                  <span className="text-4xl font-black text-slate-900">S/ {cart.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}</span>
                </div>
                <button onClick={processCheckout} disabled={cart.length === 0} className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl text-lg shadow-md transition-all">COBRAR TICKET</button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORIAL (AHORA EL CAJERO TAMBIÉN PUEDE SOLICITAR ANULAR TICKET AQUÍ) */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[75vh]">
             <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock /> Historial de Turno</h3>
                <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">Sincronizado en Nube</span>
                </div>
             </div>
             <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 tracking-widest">
                         <tr>
                             <th className="p-4">Comprobante</th><th className="p-4">Fecha / Hora</th><th className="p-4">Cajero</th><th className="p-4 text-right">Monto Total</th><th className="p-4 text-center">Estado</th><th className="p-4 text-center">Acciones y Opciones</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {sales.length === 0 && <tr><td colSpan="6" className="text-center py-10 text-slate-400">No hay ventas registradas en la base de datos.</td></tr>}
                         {sales.map(s => (
                             <tr key={s.id} className="hover:bg-slate-50">
                                 <td className="p-4 font-mono font-bold text-slate-700">{s.id}</td>
                                 <td className="p-4 text-slate-500 text-xs">{s.date} <span className="font-mono">{s.time}</span></td>
                                 <td className="p-4 font-bold text-slate-700">{s.seller}</td>
                                 <td className="p-4 text-right font-black text-slate-900">S/ {s.total.toFixed(2)}</td>
                                 <td className="p-4 text-center">
                                     {s.status === 'COMPLETADA' ? (
                                         <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black">COMPLETADA</span>
                                     ) : (
                                         <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-[10px] font-black">ANULADA</span>
                                     )}
                                 </td>
                                 <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handlePrintReal(s)} className="p-2 bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Imprimir Ticket Térmico"><Printer size={16}/></button>
                                        <button onClick={() => handleDownloadPDF(s)} className="p-2 bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Descargar como PDF"><Download size={16}/></button>
                                        {/* ESTE ES EL BOTÓN QUE EL CAJERO Y EL ADMIN PUEDEN VER PARA ANULAR UNA VENTA */}
                                        {s.status === 'COMPLETADA' && (
                                            <button onClick={() => requestVoid(s.id)} className="p-2 bg-white border border-red-200 shadow-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px]" title="Anular y Devolver Dinero"><XCircle size={14}/> Anular</button>
                                        )}
                                    </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
        )}

        {/* CIERRE CIEGO DE CAJA */}
        {activeTab === 'CASH' && (
          <div className="flex items-center justify-center h-[75vh]">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2"><Activity /> Cierre Forzoso de Caja</h2>
                <p className="text-xs text-slate-500 mt-2">Fondo de Apertura: {formatCurrency(cashSession.openingAmount)}</p>
              </div>
              {!cashSession.result ? (
                <form onSubmit={handleCloseCashRegister} className="space-y-6">
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-xs text-center font-bold mb-4">⚠️ CIERRE CIEGO ACTIVO <br/>Por seguridad, declare el efectivo físico antes de ver el monto esperado del sistema.</div>
                  <div>
                    <div className="relative">
                       <span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">S/</span>
                       <input type="number" step="0.10" required value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white transition-colors" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl uppercase tracking-widest text-sm shadow-md transition-all">Confirmar Conteo y Cerrar</button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                    <div className="flex justify-between font-medium text-slate-600"><span>Monto Esperado:</span><span className="font-bold text-slate-800">{formatCurrency(cashSession.result.expected)}</span></div>
                    <div className="flex justify-between font-medium text-slate-600"><span>Monto Declarado:</span><span className="font-bold text-slate-800">{formatCurrency(cashSession.declaredAmount)}</span></div>
                    <div className="flex justify-between border-t pt-2 font-bold"><span>Diferencia Final:</span><span className={cashSession.result.difference === 0 ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(cashSession.result.difference)}</span></div>
                  </div>
                  <div className="text-center text-[10px] font-bold text-red-600 bg-red-50 py-2 rounded border border-red-100">🔒 CAJA CERRADA Y BLOQUEADA</div>
                  <button onClick={handleArchiveShift} className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl uppercase tracking-widest text-xs shadow-md transition-all">Iniciar Siguiente Turno (Nueva Caja)</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VISTAS DEL ADMINISTRADOR --- */}
        
        {/* DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={24}/></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingreso Diario</p><p className="text-xl font-black text-slate-800">{formatCurrency(metrics.dailyRevenue)}</p></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><ArrowDownCircle size={24}/></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Compras (Inv)</p><p className="text-xl font-black text-amber-700">{formatCurrency(metrics.totalInvestment)}</p></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Target size={24}/></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Neto</p><p className={`text-xl font-black ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(metrics.netProfit)}</p></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Activity size={24}/></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transacciones</p><p className="text-xl font-black text-slate-800">{metrics.ticketsCount} tickets</p></div>
                    </div>
                </div>
            </div>
        )}

        {/* CATÁLOGO Y PRECIOS ADMIN */}
        {activeTab === 'ADMIN_PROD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4">Añadir Producto a Nube</h3>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre</label>
                            <input type="text" required value={newProductForm.name} onChange={e=>setNewProductForm({...newProductForm, name: e.target.value})} className="w-full border rounded-lg p-2 mt-1 focus:border-blue-500 outline-none text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Categoría</label>
                            <select required value={newProductForm.category} onChange={e=>setNewProductForm({...newProductForm, category: e.target.value})} className="w-full border rounded-lg p-2 mt-1 focus:border-blue-500 outline-none text-sm">
                                <option value="">Seleccionar Categoría...</option><option value="Analgésicos">Analgésicos</option><option value="Antibióticos">Antibióticos</option><option value="Antiinflamatorios">Antiinflamatorios</option><option value="Insumos">Insumos</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Precio Fijo (S/)</label>
                            <input type="number" step="0.10" required value={newProductForm.price} onChange={e=>setNewProductForm({...newProductForm, price: e.target.value})} className="w-full border rounded-lg p-2 mt-1 focus:border-blue-500 outline-none text-sm font-bold text-center" />
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg shadow-sm transition-all mt-2">GUARDAR EN FIREBASE</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden flex flex-col h-[75vh]">
                    <div className="flex justify-between items-center mb-4 border-b pb-4">
                        <h3 className="font-black text-slate-800">Catálogo Oficial</h3>
                        <input type="text" placeholder="Buscar..." className="border rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 outline-none w-48" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 sticky top-0">
                                <tr><th className="p-4">Cód</th><th className="p-4">Producto</th><th className="p-4 text-center">Stock</th><th className="p-4 text-right">Precio</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="p-4 text-xs font-mono text-slate-400">{p.id}</td><td className="p-4 font-bold text-slate-700">{p.name} <div className="text-[9px] text-slate-400">{p.category}</div></td>
                                        <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-black ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{p.stock}</span></td>
                                        <td className="p-4 text-right font-black text-emerald-600">{formatCurrency(p.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* FACTURAS Y COMPRAS ADMIN */}
        {activeTab === 'INVOICES' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4">Registrar Compra e Ingresar Stock</h3>
                    <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                        <input type="text" required placeholder="Proveedor" value={invoiceForm.supplier} onChange={e=>setInvoiceForm({...invoiceForm, supplier: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none" />
                        <input type="text" required placeholder="N° Documento (Factura/Boleta)" value={invoiceForm.document} onChange={e=>setInvoiceForm({...invoiceForm, document: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none" />
                        <select required value={invoiceForm.productId} onChange={e=>setInvoiceForm({...invoiceForm, productId: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none">
                            <option value="">Seleccionar Producto...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <input type="number" required placeholder="Cant." value={invoiceForm.qty} onChange={e=>setInvoiceForm({...invoiceForm, qty: e.target.value})} className="w-1/3 border p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none text-center" />
                            <input type="text" required placeholder="Lote (L-XXX)" value={invoiceForm.lote} onChange={e=>setInvoiceForm({...invoiceForm, lote: e.target.value})} className="w-2/3 border p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Fecha de Vencimiento Lote</label>
                            <input type="date" required value={invoiceForm.expDate} onChange={e=>setInvoiceForm({...invoiceForm, expDate: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none mt-1" />
                        </div>
                        <input type="number" step="0.10" required placeholder="Inversión Total (S/)" value={invoiceForm.totalCost} onChange={e=>setInvoiceForm({...invoiceForm, totalCost: e.target.value})} className="w-full border p-2.5 rounded-lg text-sm font-bold text-center focus:border-blue-500 outline-none" />
                        <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg shadow-md transition-all mt-2 uppercase tracking-widest text-xs">REGISTRAR FACTURA</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden flex flex-col h-[75vh]">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4">Historial de Compras (Firebase)</h3>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 sticky top-0">
                                <tr><th className="p-4">Doc</th><th className="p-4">Fecha</th><th className="p-4">Proveedor</th><th className="p-4">Detalle</th><th className="p-4 text-right">Inversión</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-slate-400">No hay compras registradas en la base de datos.</td></tr>}
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-mono text-xs text-slate-500">{inv.document}</td>
                                        <td className="p-4 text-slate-500 text-xs">{inv.date}</td>
                                        <td className="p-4 font-bold text-slate-700">{inv.supplier}</td>
                                        <td className="p-4 text-xs font-semibold text-emerald-600">+{inv.qty} und. <span className="text-slate-600">{inv.product}</span></td>
                                        <td className="p-4 text-right font-black text-amber-600">S/ {inv.cost.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* VENCIMIENTOS ADMIN */}
        {activeTab === 'EXPIRIES' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[75vh] flex flex-col">
                <h3 className="font-black text-slate-800 mb-4 border-b pb-4">Control Analítico de Vencimientos</h3>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 sticky top-0">
                            <tr><th className="p-4">Producto</th><th className="p-4">N° de Lote</th><th className="p-4 text-center">Unidades en Riesgo</th><th className="p-4 text-right">Fecha de Caducidad</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.flatMap(p => p.lots.map(l => ({ ...l, prodName: p.name }))).sort((a,b) => new Date(a.exp) - new Date(b.exp)).map((lot, idx) => {
                                const expDate = new Date(lot.exp);
                                const isNear = (expDate - new Date()) / (1000 * 60 * 60 * 24) <= 90; // Menos de 3 meses
                                return (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-700">{lot.prodName}</td>
                                    <td className="p-4 font-mono text-xs text-slate-500">{lot.lote}</td>
                                    <td className="p-4 text-center font-bold text-slate-700">{lot.qty}</td>
                                    <td className={`p-4 text-right font-black ${isNear ? 'text-red-600 bg-red-50/50' : 'text-emerald-600'}`}>{lot.exp}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* PERSONAL Y CAJEROS ADMIN */}
        {activeTab === 'USERS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4">Registrar Personal Nuevo</h3>
                    <form onSubmit={handleAddStaff} className="space-y-4">
                        <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre del Cajero</label>
                           <input type="text" required placeholder="Ej. Juan Pérez" value={newStaffForm.name} onChange={e=>setNewStaffForm({name: e.target.value})} className="w-full border p-2.5 rounded-lg focus:border-blue-500 outline-none text-sm mt-1" />
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg shadow-sm transition-all mt-2">GUARDAR EN NUBE</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4">Personal Autorizado</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {staff.map(emp => (
                            <div key={emp.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm">
                                <div><div className="font-bold text-slate-800">{emp.name}</div><div className="text-[10px] text-slate-500 font-mono mt-0.5">Rol: {emp.role} • ID: {emp.id}</div></div>
                                <button onClick={() => handleDeleteStaff(emp.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><XCircle size={20}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* AUDITORÍA ADMIN */}
        {activeTab === 'AUDIT' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[75vh] flex flex-col">
                <h3 className="font-black text-slate-800 mb-4 border-b pb-4 flex items-center gap-2"><ShieldAlert className="text-red-600"/> Auditoría Inalterable (Nube)</h3>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900 text-slate-300 sticky top-0">
                            <tr><th className="p-3">ID Log</th><th className="p-3">Fecha/Hora</th><th className="p-3">Usuario</th><th className="p-3">Acción</th><th className="p-3">Detalle Técnico</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditLogs.map(log => (
                                <tr key={log.logId} className="hover:bg-slate-50">
                                    <td className="p-3 text-slate-400">{log.logId}</td><td className="p-3 text-slate-500 whitespace-nowrap">{log.date} {log.time}</td>
                                    <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{log.user}</td>
                                    <td className="p-3 font-bold text-blue-600 whitespace-nowrap">{log.action}</td><td className="p-3 text-slate-600">{log.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </main>

      {/* MODALES: PIN Y AUTORIZACIONES */}
      {authModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border-t-4 border-t-red-500 p-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2"><ShieldAlert className="text-red-500"/> Autorización Requerida</h3>
            <p className="text-xs text-slate-500 mb-4">Ingrese la clave de administrador y el motivo para proceder con la anulación o devolución del ticket {authModal.payload}.</p>
            
            <form onSubmit={handlePinSubmit} className="space-y-4">
              {authModal.error && <div className="bg-red-50 text-red-600 text-[10px] p-2 rounded font-bold text-center border border-red-200">{authModal.error}</div>}
              <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Motivo de la Devolución/Anulación</label>
                  <input name="reason" type="text" required placeholder="Ej. Cliente devolvió el producto" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-red-500 mt-1" autoFocus />
              </div>
              <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PIN de Autorización (Dueña/Admin)</label>
                  <input name="pin" type="password" required placeholder="••••" maxLength="4" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xl text-center tracking-widest font-black outline-none focus:border-red-500 mt-1" />
              </div>
              <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setAuthModal({ isOpen: false, action: null, payload: null, error: '' })} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200">CANCELAR</button>
                  <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm shadow-md">AUTORIZAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST-VENTA (IMPRIMIR O SEGUIR) */}
      {successCheckoutModal.isOpen && successCheckoutModal.saleData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border-t-4 border-t-emerald-500 p-6 text-center animate-in zoom-in duration-200">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">¡Venta Exitosa!</h3>
            <p className="text-sm text-slate-500 mb-6">El ticket <span className="font-bold text-slate-800">{successCheckoutModal.saleData.id}</span> ha sido guardado correctamente.</p>
            
            <div className="space-y-3">
                <button 
                    onClick={() => {
                        handlePrintReal(successCheckoutModal.saleData);
                        setSuccessCheckoutModal({ isOpen: false, saleData: null });
                    }} 
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-lg">
                    <Printer size={24} />
                    IMPRIMIR TICKET
                </button>
                
                <button 
                    onClick={() => setSuccessCheckoutModal({ isOpen: false, saleData: null })} 
                    className="w-full py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-all">
                    Siguiente Venta
                </button>
            </div>
          </div>
        </div>
      )}

      {cashierLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border-t-4 border-emerald-500">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2"><Users className="text-emerald-500"/> Seleccione su Perfil</h3>
            <p className="text-xs text-slate-500 mb-4">Haga clic en su nombre para iniciar o reanudar su turno.</p>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {staff.map(emp => (
                    <button key={emp.id} onClick={() => handleCashierLogin(emp)} className="w-full p-4 border border-slate-200 rounded-xl flex flex-col text-left hover:border-emerald-500 hover:bg-emerald-50 transition-colors group">
                        <span className="font-bold text-slate-800 group-hover:text-emerald-800">{emp.name}</span><span className="text-[10px] text-slate-400 font-mono mt-0.5">Rol: {emp.role} • ID: {emp.id}</span>
                    </button>
                ))}
            </div>
            <button onClick={()=>setCashierLoginModal(false)} className="w-full mt-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">CANCELAR</button>
          </div>
        </div>
      )}

      {adminLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border-t-4 border-blue-500">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><ShieldAlert className="text-blue-500"/> Clave Administrativa</h3>
            <form onSubmit={(e) => { e.preventDefault(); if(new FormData(e.target).get('password') === '1234') handleAdminLogin(); else { showAlert('Clave incorrecta', 'error'); addAuditLog("SEGURIDAD", "Intento fallido Admin"); } }}>
              <input name="password" type="password" required placeholder="Ingrese 1234" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-2xl tracking-widest mb-4 outline-none focus:border-blue-500" autoFocus />
              <div className="flex gap-2">
                 <button type="button" onClick={()=>setAdminLoginModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">CANCELAR</button>
                 <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md text-sm transition-colors">INGRESAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}