import React, { useState, useEffect } from 'react';
import { ShoppingCart, LogOut, Package, ShieldAlert, BarChart3, AlertTriangle, CheckCircle, XCircle, Search, Edit3, Clock, ArrowDownCircle, ArrowUpCircle, AlertCircle, Box, TrendingUp, Truck, FileText, Activity, Calendar, CalendarDays, CalendarRange, DollarSign, Target, Download, Users, UserPlus, Wifi, WifiOff, Database, Printer, Trash2, Smartphone } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot, getDocs, limit, query, deleteDoc } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
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

const INITIAL_STAFF = [
  { id: 'CAJ-001', name: 'Administrador Principal', role: 'ADMIN', joined: '10/09/2026' }
];

export default function App() {
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
  
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [sales, setSales] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [topups, setTopups] = useState([]); 
  
  const [adminLoginModal, setAdminLoginModal] = useState(false);
  const [cashierLoginModal, setCashierLoginModal] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, action: null, payload: null, error: '' });
  const [successModal, setSuccessModal] = useState({ isOpen: false, sale: null, type: 'SALE' });
  const [alerts, setAlerts] = useState([]);
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, text: '', onConfirm: null });
  const [promptDialog, setPromptDialog] = useState({ isOpen: false, title: '', value: '', onConfirm: null });
  
  const [openingAmount, setOpeningAmount] = useState(''); 
  const [closingAmount, setClosingAmount] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  
  const [newStaffForm, setNewStaffForm] = useState({ name: '' });
  const [newProductForm, setNewProductForm] = useState({ name: '', category: '', price: '' });
  const [invoiceForm, setInvoiceForm] = useState({ supplier: '', document: '', productId: '', qty: '', lote: '', expDate: '', totalCost: '' });
  const [topupForm, setTopupForm] = useState({ phone: '', amount: '', provider: 'Yape' });
  
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { if (currentUser) localStorage.setItem('fs_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('fs_cash', JSON.stringify(cashSession)); }, [cashSession]);

  useEffect(() => {
    if (!db) {
       setDbStatus('LOCAL');
       return;
    }
    const initFirebase = async () => {
        try {
            await getDocs(query(collection(db, 'system_test'), limit(1)));
            setDbStatus('CONECTADO');
            
            const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
                setProducts(snap.docs.map(d => d.data()));
            });
            const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
                if (snap.empty) INITIAL_STAFF.forEach(s => setDoc(doc(db, 'staff', s.id), s));
                else setStaff(snap.docs.map(d => d.data()));
            });
            const unsubSales = onSnapshot(collection(db, 'sales'), (snap) => {
                const data = snap.docs.map(d => d.data());
                setSales(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
            });
            const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
                setInvoices(snap.docs.map(d => d.data()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))); 
            });
            const unsubAudit = onSnapshot(collection(db, 'auditLogs'), (snap) => {
                setAuditLogs(snap.docs.map(d => d.data()).sort((a,b) => b.logId.localeCompare(a.logId)));
            });
            const unsubTopups = onSnapshot(collection(db, 'topups'), (snap) => {
                setTopups(snap.docs.map(d => d.data()).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)));
            });

            return () => { unsubProducts(); unsubStaff(); unsubSales(); unsubInvoices(); unsubAudit(); unsubTopups(); };
        } catch (error) {
            setDbStatus('LOCAL');
            showAlert("Conexión rechazada. Reglas cerradas.", "error");
        }
    };
    initFirebase();
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

  const addAuditLog = async (action, detail) => {
    const { date, time } = getTimestamp();
    const logId = `L-${Date.now()}`;
    const newLog = { logId, date, time, user: currentUser?.name || 'SISTEMA', action, detail };
    if (dbStatus === 'CONECTADO') {
        try { await setDoc(doc(db, 'auditLogs', logId), newLog); } catch(e) {}
    }
  };

  const generateTicketHTML = (transaction, isTopup = false) => {
      if (isTopup) {
          return `
              <html>
                  <head>
                      <title>Ticket Recarga ${transaction.id}</title>
                      <style>
                          body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; color: #000; }
                          h2, h3 { text-align: center; margin: 5px 0; }
                          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                          .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px; }
                          .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
                          .footer { text-align: center; font-size: 10px; margin-top: 20px; }
                      </style>
                  </head>
                  <body>
                      <h2>FARMA SALUD</h2>
                      <h3>Recarga de Billetera</h3>
                      <div class="divider"></div>
                      <div><strong>Ticket:</strong> ${transaction.id}</div>
                      <div><strong>Fecha:</strong> ${transaction.date} ${transaction.time}</div>
                      <div><strong>Cajero:</strong> ${transaction.seller}</div>
                      <div><strong>Proveedor:</strong> ${transaction.provider}</div>
                      <div><strong>N° Celular:</strong> ${transaction.phone}</div>
                      <div class="divider"></div>
                      <div class="item">
                          <span>Monto Enviado:</span>
                          <span>S/ ${transaction.amount.toFixed(2)}</span>
                      </div>
                      <div class="item">
                          <span>Comisión de Servicio:</span>
                          <span>S/ ${transaction.fee.toFixed(2)}</span>
                      </div>
                      <div class="divider"></div>
                      <div class="total">TOTAL COBRADO: S/ ${transaction.total.toFixed(2)}</div>
                      <div class="footer">¡Operación exitosa!<br>Verifique el saldo en su celular.</div>
                  </body>
              </html>
          `;
      }
      return `
          <html>
              <head>
                  <title>Ticket ${transaction.id}</title>
                  <style>
                      body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; color: #000; }
                      h2, h3 { text-align: center; margin: 5px 0; }
                      .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                      .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px; }
                      .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
                      .footer { text-align: center; font-size: 10px; margin-top: 20px; }
                  </style>
              </head>
              <body>
                  <h2>FARMA SALUD</h2>
                  <h3>Comprobante de Venta</h3>
                  <div class="divider"></div>
                  <div><strong>Ticket:</strong> ${transaction.id}</div>
                  <div><strong>Fecha:</strong> ${transaction.date} ${transaction.time}</div>
                  <div><strong>Cajero:</strong> ${transaction.seller}</div>
                  <div class="divider"></div>
                  ${transaction.items.map(item => `
                      <div class="item">
                          <span style="width: 70%;">${item.qty}x ${item.name}</span>
                          <span style="width: 30%; text-align: right;">S/ ${item.subtotal.toFixed(2)}</span>
                      </div>
                  `).join('')}
                  <div class="divider"></div>
                  <div class="total">TOTAL: S/ ${transaction.total.toFixed(2)}</div>
                  <div class="footer">¡Gracias por su compra!<br>Conservar este comprobante.</div>
              </body>
          </html>
      `;
  };

  const handlePrintReal = (transaction, isTopup = false) => {
      const ticketWindow = window.open('', '_blank', 'width=400,height=600');
      if(!ticketWindow) return showAlert('Permita los pop-ups para imprimir.', 'error');
      ticketWindow.document.write(generateTicketHTML(transaction, isTopup));
      ticketWindow.document.close();
      ticketWindow.focus();
      setTimeout(() => { ticketWindow.print(); ticketWindow.close(); }, 250);
  };

  const handleDownloadPDF = (transaction, isTopup = false) => {
      showAlert(`Generando PDF...`, 'info');
      if (!window.html2pdf) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = () => executePDFDownload(transaction, isTopup);
          document.head.appendChild(script);
      } else {
          executePDFDownload(transaction, isTopup);
      }
  };

  const executePDFDownload = (transaction, isTopup) => {
      const element = document.createElement('div');
      element.innerHTML = generateTicketHTML(transaction, isTopup);
      const filename = isTopup ? `Recarga_${transaction.id}.pdf` : `Ticket_${transaction.id}.pdf`;
      const opt = { margin: 5, filename: filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: [80, 150], orientation: 'portrait' } };
      window.html2pdf().set(opt).from(element).save().then(() => showAlert('PDF descargado.', 'success'));
  };

  const handleOpenCashRegister = (e) => {
    e.preventDefault();
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) return showAlert("Monto inválido.", "error");
    const shiftId = `TURNO-${Date.now()}`;
    const newSession = { isOpen: true, openingAmount: amount, declaredAmount: null, result: null, shiftId };
    localStorage.setItem('fs_cash', JSON.stringify(newSession));
    setCashSession(newSession);
    addAuditLog("APERTURA CAJA", `Fondo inicial: S/ ${amount}`);
    setActiveTab('POS');
  };

  const handleCloseCashRegister = (e) => {
    e.preventDefault();
    if (!cashSession.shiftId) return;
    const declared = parseFloat(closingAmount);
    if (isNaN(declared) || declared < 0) return showAlert("Monto inválido.", "error");
    
    const completedSales = sales.filter(s => s.status === 'COMPLETADA' && s.shiftId === cashSession.shiftId);
    const totalSalesAmount = completedSales.reduce((acc, s) => acc + s.total, 0);
    
    const completedTopups = topups.filter(t => t.status === 'COMPLETADA' && t.shiftId === cashSession.shiftId);
    const totalTopupsAmount = completedTopups.reduce((acc, t) => acc + t.total, 0);

    const expected = cashSession.openingAmount + totalSalesAmount + totalTopupsAmount;
    const difference = declared - expected;
    
    const closedSession = { ...cashSession, isOpen: false, declaredAmount: declared, result: { expected, difference, totalSalesAmount, totalTopupsAmount } };
    localStorage.setItem('fs_cash', JSON.stringify(closedSession));
    setCashSession(closedSession);
    addAuditLog("CIERRE CAJA CIEGO", `Declaró S/ ${declared}. Diferencia: S/ ${difference}`);
    showAlert(`Cierre procesado.`, difference === 0 ? 'success' : 'error');
  };

  const handleArchiveShift = () => {
    const cleanSession = { isOpen: false, openingAmount: 0, declaredAmount: null, result: null, shiftId: null };
    localStorage.setItem('fs_cash', JSON.stringify(cleanSession));
    setCashSession(cleanSession);
    setActiveTab('OPEN_CASH');
    setClosingAmount('');
  };

  const handleLogout = () => {
      if (currentUser?.role === 'CAJERO' && cashSession.isOpen) {
          showAlert("¡Debe realizar el Cierre de Caja antes de salir!", "error");
          setActiveTab('CASH');
          return;
      }
      setCurrentUser(null);
      localStorage.removeItem('fs_user');
      setActiveTab('LOGIN');
  };

  const handleAdminLogin = () => {
      const adminUser = { id: 'ADMIN-ROOT', name: 'Administrador Principal', role: 'ADMIN' };
      setCurrentUser(adminUser);
      localStorage.setItem('fs_user', JSON.stringify(adminUser));
      setActiveTab('DASHBOARD');
      setAdminLoginModal(false);
  };

  const handleCashierLogin = (staffMember) => {
      const newUser = { id: staffMember.id, name: staffMember.name, role: staffMember.role };
      setCurrentUser(newUser);
      localStorage.setItem('fs_user', JSON.stringify(newUser));
      setActiveTab(cashSession.isOpen && !cashSession.result ? 'POS' : (!cashSession.isOpen && cashSession.result ? 'CASH' : 'OPEN_CASH'));
      setCashierLoginModal(false);
  };

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

  const handleAdminDeleteStaff = (staffId) => {
      if(staffId === 'CAJ-001') return showAlert('No puede eliminar al administrador principal.', 'error');
      setConfirmDialog({
          isOpen: true,
          text: `¿ESTÁ SEGURO? Eliminar este cajero lo borrará del sistema.`,
          onConfirm: async () => {
              if (dbStatus === 'CONECTADO') {
                  await deleteDoc(doc(db, 'staff', staffId));
                  addAuditLog("ELIMINA CAJERO", `Personal retirado: ID ${staffId}`);
                  showAlert('Cajero eliminado del sistema.', 'success');
              }
          }
      });
  };

  const handleTopupSubmit = async (e) => {
      e.preventDefault();
      if (!cashSession.isOpen) return showAlert("Abra la caja primero.", "error");
      if (dbStatus !== 'CONECTADO') return showAlert("No hay conexión a la base de datos.", "error");
      
      const sendAmount = parseFloat(topupForm.amount);
      if (isNaN(sendAmount) || sendAmount <= 0) return showAlert("Monto a enviar inválido.", "error");
      if (topupForm.phone.length < 9) return showAlert("Número de celular inválido.", "error");

      setIsProcessingCheckout(true);

      const fee = Math.ceil(sendAmount / 100); 
      const totalToCollect = sendAmount + fee;

      const { date, time } = getTimestamp();
      const recId = `REC-${(topups.length + 1).toString().padStart(5, '0')}`;
      const timestampInternal = Date.now();

      const newTopup = {
          id: recId, timestamp: timestampInternal, date, time, seller: currentUser.name, shiftId: cashSession.shiftId, provider: topupForm.provider, phone: topupForm.phone, amount: sendAmount, fee: fee, total: totalToCollect, status: 'COMPLETADA'
      };

      try {
          await setDoc(doc(db, 'topups', recId), newTopup);
          addAuditLog("RECARGA", `Procesó recarga ${recId} a ${topupForm.phone} por S/ ${sendAmount.toFixed(2)}`);
          setIsProcessingCheckout(false);
          setTopupForm({ phone: '', amount: '', provider: 'Yape' });
          setSuccessModal({ isOpen: true, sale: newTopup, type: 'TOPUP' });
      } catch (e) {
          setIsProcessingCheckout(false);
          showAlert("Error guardando recarga.", "error");
      }
  };

  const handleAdminDeleteTopup = (topupId) => {
      setConfirmDialog({
          isOpen: true,
          text: `¿ESTÁ SEGURO? Eliminar la recarga ${topupId} lo borrará para siempre de la base de datos.`,
          onConfirm: async () => {
              if(dbStatus === 'CONECTADO') {
                  await deleteDoc(doc(db, 'topups', topupId));
                  addAuditLog("ELIMINACIÓN ROOT", `Recarga ${topupId} borrada completamente.`);
                  showAlert(`Recarga ${topupId} eliminada.`, 'success');
              }
          }
      });
  };

  const addToCart = (product) => {
    if (!cashSession.isOpen) return showAlert("Abra la caja primero.", "error");
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
    if (dbStatus !== 'CONECTADO') return showAlert("No hay conexión a la base de datos.", "error");

    setIsProcessingCheckout(true);

    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const { date, time } = getTimestamp();
    const ticketNumber = (sales.length + 1).toString().padStart(7, '0');
    const saleId = `T-${ticketNumber}`;
    const timestampInternal = Date.now();

    const newSale = { id: saleId, timestamp: timestampInternal, date, time, seller: currentUser.name, shiftId: cashSession.shiftId, items: cart, total, status: 'COMPLETADA' };

    try {
        await setDoc(doc(db, 'sales', saleId), newSale);
        for (const cartItem of cart) {
            const product = products.find(p => p.id === cartItem.productId);
            if (product) {
                await setDoc(doc(db, 'products', product.id), { ...product, stock: product.stock - cartItem.qty });
            }
        }
        addAuditLog("VENTA", `Cobró ticket ${saleId}`);
        setCart([]);
        setIsProcessingCheckout(false);
        setSuccessModal({ isOpen: true, sale: newSale, type: 'SALE' });
    } catch (e) {
        setIsProcessingCheckout(false);
        showAlert("Error guardando venta.", "error");
    }
  };

  const requestVoid = (saleId) => setAuthModal({ isOpen: true, action: 'VOID_SALE', payload: saleId, error: '' });

  const executeVoid = async (saleId, reason) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    if (dbStatus === 'CONECTADO') {
        await setDoc(doc(db, 'sales', saleId), { ...sale, status: 'ANULADA', voidReason: reason, voidBy: currentUser.name });
        for (const cartItem of sale.items) {
             const product = products.find(p => p.id === cartItem.productId);
             if(product) {
                 await setDoc(doc(db, 'products', product.id), { ...product, stock: product.stock + cartItem.qty });
             }
        }
        addAuditLog("ANULACIÓN", `Anuló ticket ${saleId}`);
        showAlert(`Venta ${saleId} anulada.`, 'success');
    }
  };

  const handleAdminDeleteSale = (saleId) => {
      setConfirmDialog({
          isOpen: true,
          text: `¿ESTÁ SEGURO? Eliminar el ticket ${saleId} lo borrará para siempre de la base de datos y DEVOLVERÁ el stock si no estaba anulado.`,
          onConfirm: async () => {
              if(dbStatus === 'CONECTADO') {
                  const sale = sales.find(s => s.id === saleId);
                  if (sale && sale.status === 'COMPLETADA') {
                      for (const cartItem of sale.items) {
                          const product = products.find(p => p.id === cartItem.productId);
                          if(product) {
                              await setDoc(doc(db, 'products', product.id), { ...product, stock: product.stock + cartItem.qty });
                          }
                      }
                  }
                  await deleteDoc(doc(db, 'sales', saleId));
                  addAuditLog("ELIMINACIÓN ROOT", `Ticket ${saleId} borrado completamente.`);
                  showAlert(`Ticket ${saleId} eliminado de Firebase.`, 'success');
              }
          }
      });
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (formData.get('pin') !== '1234') {
        return setAuthModal(prev => ({ ...prev, error: 'PIN INCORRECTO.' }));
    }
    if (authModal.action === 'VOID_SALE') executeVoid(authModal.payload, formData.get('reason'));
    setAuthModal({ isOpen: false, action: null, payload: null, error: '' });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const newId = `P${Date.now().toString().slice(-5)}`;
    const newProd = { id: newId, name: newProductForm.name, category: newProductForm.category, price: parseFloat(newProductForm.price), stock: 0, lots: [] };
    if (dbStatus === 'CONECTADO') {
        await setDoc(doc(db, 'products', newId), newProd);
        showAlert('Producto añadido al catálogo.', 'success');
        setNewProductForm({ name: '', category: '', price: '' });
    }
  };

  const handleEditProductPrice = (product) => {
      setPromptDialog({
          isOpen: true,
          title: `Nuevo precio para ${product.name} (S/)`,
          value: product.price,
          onConfirm: async (val) => {
              const newPrice = parseFloat(val);
              if(isNaN(newPrice) || newPrice < 0) return showAlert('Precio inválido', 'error');
              if (dbStatus === 'CONECTADO') {
                  await setDoc(doc(db, 'products', product.id), { ...product, price: newPrice });
                  addAuditLog("EDITA PRECIO", `${product.name} a S/ ${newPrice}`);
                  showAlert('Precio actualizado', 'success');
              }
          }
      });
  };

  const handleDeleteProduct = (productId) => {
      setConfirmDialog({
          isOpen: true,
          text: `¿Estás seguro de borrar definitivamente este producto del catálogo?`,
          onConfirm: async () => {
              if (dbStatus === 'CONECTADO') {
                  await deleteDoc(doc(db, 'products', productId));
                  addAuditLog("BORRA PRODUCTO", `ID: ${productId}`);
                  showAlert('Producto eliminado', 'success');
              }
          }
      });
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    const { supplier, document: docNum, productId, qty, lote, expDate, totalCost } = invoiceForm;
    const numQty = parseInt(qty);
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newLotId = `L-${Date.now()}`;
    const newLot = { id: newLotId, lote: lote.trim().toUpperCase(), exp: expDate, qty: numQty };
    const updatedLots = product.lots ? [...product.lots, newLot] : [newLot];
    
    const invId = `INV-${Date.now()}`;
    const newInvoice = { 
        id: invId, timestamp: Date.now(), date: getTimestamp().date, supplier, document: docNum, 
        productId: product.id, product: product.name, qty: numQty, cost: parseFloat(totalCost || 0), 
        user: currentUser.name, lotId: newLotId, lote: newLot.lote 
    };

    if (dbStatus === 'CONECTADO') {
        await setDoc(doc(db, 'products', product.id), { ...product, stock: product.stock + numQty, lots: updatedLots });
        await setDoc(doc(db, 'invoices', invId), newInvoice);
        showAlert("Inventario actualizado.", "success");
        setInvoiceForm({ supplier: '', document: '', productId: '', qty: '', lote: '', expDate: '', totalCost: '' });
    }
  };

  const handleDeleteInvoice = (invoice) => {
      setConfirmDialog({
          isOpen: true,
          text: `¿Eliminar la factura ${invoice.document} y revertir el stock de ${invoice.qty} unidades?`,
          onConfirm: async () => {
              if (dbStatus === 'CONECTADO') {
                  const product = products.find(p => p.id === invoice.productId);
                  if (product) {
                      let updatedLots = [...(product.lots || [])];
                      if (invoice.lotId) {
                          updatedLots = updatedLots.filter(l => l.id !== invoice.lotId);
                      } else {
                          const lotIndex = updatedLots.findIndex(l => l.lote === invoice.lote && l.qty === invoice.qty);
                          if (lotIndex !== -1) updatedLots.splice(lotIndex, 1);
                      }
                      const newStock = Math.max(0, product.stock - invoice.qty);
                      await setDoc(doc(db, 'products', product.id), { ...product, stock: newStock, lots: updatedLots });
                  }
                  await deleteDoc(doc(db, 'invoices', invoice.id));
                  addAuditLog("ELIMINA FACTURA", `Revirtió ${invoice.document}`);
                  showAlert('Factura eliminada, lote borrado y stock revertido.', 'success');
              }
          }
      });
  };

  const handleDeleteLot = (productId, lotId, qty) => {
      setConfirmDialog({
          isOpen: true,
          text: `¿Eliminar este lote? Esto descontará ${qty} unidades del inventario actual y no se podrá recuperar.`,
          onConfirm: async () => {
              if (dbStatus === 'CONECTADO') {
                  const product = products.find(p => p.id === productId);
                  if (product) {
                      const updatedLots = (product.lots || []).filter(l => l.id !== lotId);
                      const newStock = Math.max(0, product.stock - qty);
                      await setDoc(doc(db, 'products', product.id), { ...product, stock: newStock, lots: updatedLots });
                      addAuditLog("ELIMINA LOTE", `Lote ${lotId} borrado. Inventario ajustado.`);
                      showAlert('Lote eliminado correctamente del sistema.', 'success');
                  }
              }
          }
      });
  };

  const getDashboardMetrics = () => {
      const todaySales = sales.filter(s => s.status === 'COMPLETADA');
      const dailyRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
      const totalInvestment = invoices.reduce((acc, inv) => acc + inv.cost, 0);
      
      const todayTopups = topups.filter(t => t.status === 'COMPLETADA');
      const totalTopupFees = todayTopups.reduce((acc, t) => acc + t.fee, 0); 

      const netProfit = (dailyRevenue + totalTopupFees) - totalInvestment;

      return { dailyRevenue, totalInvestment, netProfit, totalTopupFees, ticketsCount: todaySales.length, topupCount: todayTopups.length };
  };

  const metrics = getDashboardMetrics();
  const displayedProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-700 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-lg flex items-center justify-center">
              <img src="https://i.imgur.com/rMiaZmc.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-md" />
            </div>
            <div className="hidden sm:flex flex-col gap-1">
                <span className="text-[10px] font-bold bg-blue-900/50 text-blue-200 px-2 py-0.5 rounded border border-blue-700/50 tracking-wider uppercase w-max">Core System</span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-colors ${dbStatus === 'CONECTADO' ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50' : 'bg-red-900/50 text-red-400 border-red-700/50'}`}>
                    {dbStatus === 'CONECTADO' ? <Database size={10}/> : <WifiOff size={10}/>} BD: {dbStatus}
                </div>
            </div>
          </div>
          {currentUser && (
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-200">{currentUser.name}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${currentUser.role === 'ADMIN' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'}`}>{currentUser.role}</span>
              </div>
              <button onClick={handleLogout} className="bg-slate-800 p-2 rounded-lg hover:bg-red-900 text-white transition-all shadow-sm"><LogOut size={18} /></button>
            </div>
          )}
        </div>
      </header>

      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        {alerts.map(a => (
          <div key={a.id} className={`p-4 rounded-xl shadow-2xl border-l-4 font-bold text-sm max-w-sm flex items-center gap-3 animate-in slide-in-from-right-8 ${a.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-slate-900 border-emerald-500 text-emerald-400'}`}>
            {a.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>} {a.msg}
          </div>
        ))}
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col gap-4">
        {!currentUser && activeTab === 'LOGIN' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
              <div className="text-center mb-8"><img src="https://i.imgur.com/rMiaZmc.png" alt="Logo" className="h-20 mx-auto mb-4" /><h2 className="text-2xl font-black text-slate-800">Acceso al Sistema</h2></div>
              <div className="space-y-4">
                <button onClick={() => setCashierLoginModal(true)} className="w-full py-4 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all">Entrar como Cajero</button>
                <button onClick={() => setAdminLoginModal(true)} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all">Acceso Administrador</button>
              </div>
            </div>
          </div>
        )}

        {currentUser && activeTab !== 'OPEN_CASH' && activeTab !== 'LOGIN' && (
          <nav className="bg-white shadow-sm border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1">
            {currentUser.role === 'CAJERO' ? (
              <>
                <button onClick={() => setActiveTab('POS')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'POS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><ShoppingCart size={14} /> PUNTO DE VENTA</button>
                <button onClick={() => setActiveTab('TOPUP')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'TOPUP' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-purple-50'}`}><Smartphone size={14} /> RECARGAS</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Clock size={14} /> HIST. VENTAS</button>
                <button onClick={() => setActiveTab('TOPUPS_HIST')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'TOPUPS_HIST' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Smartphone size={14} /> HIST. RECARGAS</button>
                <button onClick={() => setActiveTab('CASH')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'CASH' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Activity size={14} /> CIERRE DE CAJA</button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'DASHBOARD' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><TrendingUp size={14} /> DASHBOARD</button>
                <button onClick={() => setActiveTab('ADMIN_PROD')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'ADMIN_PROD' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Box size={14} /> CATÁLOGO</button>
                <button onClick={() => setActiveTab('INVOICES')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'INVOICES' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Truck size={14} /> COMPRAS</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Clock size={14} /> HIST. VENTAS</button>
                <button onClick={() => setActiveTab('TOPUPS_HIST')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'TOPUPS_HIST' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Smartphone size={14} /> HIST. RECARGAS</button>
                <button onClick={() => setActiveTab('EXPIRIES')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'EXPIRIES' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><AlertTriangle size={14} /> VENCIMIENTOS</button>
                <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Users size={14} /> PERSONAL</button>
              </>
            )}
          </nav>
        )}

        {/* MODAL VENTA EXITOSA */}
        {successModal.isOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border-t-4 border-t-emerald-500 p-8 text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">¡Operación Exitosa!</h3>
                    <p className="text-sm text-slate-500 mb-6 font-mono">{successModal.sale?.id}</p>
                    <div className="space-y-3">
                        <button onClick={() => handlePrintReal(successModal.sale, successModal.type === 'TOPUP')} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl flex items-center justify-center gap-2 text-lg"><Printer size={20}/> IMPRIMIR TICKET</button>
                        <button onClick={() => setSuccessModal({ isOpen: false, sale: null, type: 'SALE' })} className="w-full py-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-widest">Siguiente Cliente</button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'OPEN_CASH' && (
           <div className="flex-1 flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 border-t-4 border-t-emerald-500 max-w-md w-full">
             <div className="text-center mb-6"><h2 className="text-xl font-black">Apertura de Turno</h2><p className="text-xs text-slate-500 mt-2">Declare el efectivo inicial.</p></div>
             <form onSubmit={handleOpenCashRegister} className="space-y-6">
                 <div className="relative"><span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">S/</span><input type="number" step="0.10" required value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-700 bg-slate-50 border rounded-xl outline-none" /></div>
               <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl">ABRIR CAJA</button>
             </form>
           </div>
         </div>
        )}

        {activeTab === 'POS' && (
          <div className="flex flex-col lg:flex-row gap-4 h-[75vh]">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="mb-4 relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={18} /><input type="text" placeholder="Buscar..." className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
              <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {displayedProducts.map(p => (
                        <div key={p.id} onClick={() => addToCart(p)} className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between aspect-square relative group">
                            {p.stock <= 5 && <div className="absolute top-2 right-2 bg-red-100 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded">POCO STOCK</div>}
                            <div><span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono block w-max">{p.id}</span><h4 className="font-bold text-sm text-slate-800 mt-2 leading-tight">{p.name}</h4></div>
                            <div className="mt-4 flex justify-between items-end border-t pt-2">
                                <div className="flex flex-col"><span className="text-[9px] text-slate-400 font-bold uppercase">Stock</span><span className={`font-black ${p.stock <= 5 ? 'text-red-600' : 'text-slate-700'}`}>{p.stock}</span></div>
                                <span className="font-black text-emerald-600">S/ {p.price.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                  </div>
              </div>
            </div>

            <div className="w-full lg:w-[400px] bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
              <h3 className="font-black text-slate-800 text-lg border-b pb-4 mb-4 flex items-center gap-2">🛒 Ticket Actual</h3>
              <div className="flex-1 overflow-y-auto pr-1">
                {cart.length === 0 ? <div className="text-center text-slate-400 mt-10 text-sm">Vacío</div> : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.productId} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="font-bold text-sm mb-2">{item.name}</div>
                        <div className="flex justify-between items-center">
                            <div className="text-xs font-bold text-slate-500 flex items-center bg-white border rounded"><button onClick={() => updateCartQty(item.productId, -1)} className="px-3 py-1 font-black">-</button><span className="px-2 w-6 text-center">{item.qty}</span><button onClick={() => updateCartQty(item.productId, 1)} className="px-3 py-1 font-black">+</button></div>
                            <div className="font-black text-emerald-600 text-lg">S/ {item.subtotal.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-6 border-t mt-4">
                <div className="flex justify-between items-end mb-6"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span><span className="text-4xl font-black text-slate-900">S/ {cart.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}</span></div>
                
                <button onClick={processCheckout} disabled={cart.length === 0 || isProcessingCheckout} className={`w-full py-4 text-white font-black rounded-xl text-lg shadow-md transition-all flex items-center justify-center gap-2 ${isProcessingCheckout ? 'bg-slate-400 cursor-wait' : 'bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400'}`}>
                    {isProcessingCheckout ? ( <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> PROCESANDO...</> ) : ( 'COBRAR TICKET' )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- RECARGAS (TOP-UP) --- */}
        {activeTab === 'TOPUP' && (
            <div className="flex items-center justify-center h-[75vh]">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-purple-500 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3"><Smartphone size={32} /></div>
                        <h2 className="text-xl font-black text-slate-800">Recarga de Billetera</h2>
                        <p className="text-xs text-slate-500 mt-1">El sistema calculará automáticamente la comisión a cobrar al cliente.</p>
                    </div>
                    <form onSubmit={handleTopupSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Billetera a Recargar</label>
                            <select value={topupForm.provider} onChange={e=>setTopupForm({...topupForm, provider: e.target.value})} className="w-full border rounded-lg p-3 outline-none text-sm font-bold bg-slate-50 mt-1">
                                <option value="Yape">Yape</option><option value="Plin">Plin</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Número de Celular</label>
                            <input type="tel" required maxLength="9" placeholder="Ej. 987654321" value={topupForm.phone} onChange={e=>setTopupForm({...topupForm, phone: e.target.value})} className="w-full border rounded-lg p-3 outline-none font-bold text-center tracking-widest mt-1" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monto a Enviar al Celular (S/)</label>
                            <div className="relative mt-1">
                                <span className="absolute left-4 top-3 text-xl font-bold text-slate-400">S/</span>
                                <input type="number" step="0.10" required value={topupForm.amount} onChange={e=>setTopupForm({...topupForm, amount: e.target.value})} className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-700 bg-slate-50 border rounded-xl outline-none focus:border-purple-500" placeholder="0.00" />
                            </div>
                        </div>

                        {topupForm.amount && parseFloat(topupForm.amount) > 0 && (
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Monto a enviar:</span><span className="font-bold">S/ {parseFloat(topupForm.amount).toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm mb-2"><span className="text-slate-600">Comisión del Agente:</span><span className="font-bold text-purple-600">+ S/ {Math.ceil(parseFloat(topupForm.amount) / 100).toFixed(2)}</span></div>
                                <div className="flex justify-between border-t border-purple-200 pt-2"><span className="font-bold uppercase text-[10px] tracking-widest text-slate-500 mt-1">Total a cobrar al cliente</span><span className="text-2xl font-black text-purple-800">S/ {(parseFloat(topupForm.amount) + Math.ceil(parseFloat(topupForm.amount) / 100)).toFixed(2)}</span></div>
                            </div>
                        )}

                        <button type="submit" disabled={isProcessingCheckout} className={`w-full py-4 text-white font-black rounded-xl text-lg shadow-md transition-all flex items-center justify-center gap-2 mt-4 ${isProcessingCheckout ? 'bg-slate-400' : 'bg-purple-700 hover:bg-purple-800'}`}>
                            {isProcessingCheckout ? 'PROCESANDO...' : 'REGISTRAR Y COBRAR'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* HISTORIAL GENERAL DE VENTAS FARMACIA */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[75vh]">
             <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock /> Historial de Ventas</h3>
             </div>
             <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 sticky top-0">
                         <tr><th className="p-4">Comprobante</th><th className="p-4">Fecha/Hora</th><th className="p-4">Cajero</th><th className="p-4 text-right">Monto</th><th className="p-4 text-center">Estado</th><th className="p-4 text-center">Acciones</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {sales.map(s => (
                             <tr key={s.id} className="hover:bg-slate-50">
                                 <td className="p-4 font-mono font-bold text-slate-700">{s.id}</td>
                                 <td className="p-4 text-slate-500 text-xs">{s.date} <span className="font-mono">{s.time}</span></td>
                                 <td className="p-4 font-bold text-slate-700">{s.seller}</td>
                                 <td className="p-4 text-right font-black text-slate-900">S/ {s.total.toFixed(2)}</td>
                                 <td className="p-4 text-center">{s.status === 'COMPLETADA' ? <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black">COMPLETO</span> : <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-[10px] font-black">ANULADA</span>}</td>
                                 <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handlePrintReal(s)} className="p-2 bg-white border shadow-sm hover:text-blue-600 rounded-lg"><Printer size={16}/></button>
                                        <button onClick={() => handleDownloadPDF(s)} className="p-2 bg-white border shadow-sm hover:text-emerald-600 rounded-lg"><Download size={16}/></button>
                                        {s.status === 'COMPLETADA' && <button onClick={() => requestVoid(s.id)} className="p-2 bg-white border shadow-sm text-red-500 hover:bg-red-50 rounded-lg" title="Anular"><XCircle size={16}/></button>}
                                        {currentUser.role === 'ADMIN' && <button onClick={() => handleAdminDeleteSale(s.id)} className="p-2 bg-white border border-red-200 shadow-sm text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors" title="BORRAR DEFINITIVAMENTE (ADMIN)"><Trash2 size={16}/></button>}
                                    </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
        )}

        {/* HISTORIAL RECARGAS (COMPARTIDO CAJERO Y ADMIN) */}
        {activeTab === 'TOPUPS_HIST' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[75vh]">
             <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Smartphone /> Historial de Recargas Billetera</h3>
             </div>
             <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 sticky top-0">
                         <tr><th className="p-4">Ticket</th><th className="p-4">Fecha/Hora</th><th className="p-4">Cajero</th><th className="p-4">Celular/Billetera</th><th className="p-4 text-right">Enviado</th><th className="p-4 text-right text-purple-600">Comisión</th><th className="p-4 text-right font-black">Total Cobrado</th><th className="p-4 text-center">Acciones</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {topups.map(t => (
                             <tr key={t.id} className="hover:bg-slate-50">
                                 <td className="p-4 font-mono font-bold text-slate-700">{t.id}</td>
                                 <td className="p-4 text-slate-500 text-xs">{t.date} <span className="font-mono">{t.time}</span></td>
                                 <td className="p-4 font-bold text-slate-700">{t.seller}</td>
                                 <td className="p-4 font-bold text-slate-700">{t.phone} <span className="text-[10px] bg-slate-100 px-1 rounded ml-1">{t.provider}</span></td>
                                 <td className="p-4 text-right font-medium">S/ {t.amount.toFixed(2)}</td>
                                 <td className="p-4 text-right font-bold text-purple-600">+ S/ {t.fee.toFixed(2)}</td>
                                 <td className="p-4 text-right font-black text-slate-900">S/ {t.total.toFixed(2)}</td>
                                 <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handlePrintReal(t, true)} className="p-2 bg-white border shadow-sm hover:text-blue-600 rounded-lg"><Printer size={16}/></button>
                                        <button onClick={() => handleDownloadPDF(t, true)} className="p-2 bg-white border shadow-sm hover:text-emerald-600 rounded-lg"><Download size={16}/></button>
                                        {currentUser.role === 'ADMIN' && <button onClick={() => handleAdminDeleteTopup(t.id)} className="p-2 bg-white border border-red-200 shadow-sm text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors" title="Eliminar Recarga"><Trash2 size={16}/></button>}
                                    </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
        )}

        {/* CIERRE DE CAJA DESGLOSADO */}
        {activeTab === 'CASH' && (
          <div className="flex items-center justify-center h-[75vh]">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
              <div className="text-center mb-6"><h2 className="text-xl font-black text-slate-800">Cierre Forzoso de Caja</h2><p className="text-xs mt-2">Fondo: {formatCurrency(cashSession.openingAmount)}</p></div>
              {!cashSession.result ? (
                <form onSubmit={handleCloseCashRegister} className="space-y-6">
                  <div className="relative"><span className="absolute left-4 top-3.5 text-xl font-bold">S/</span><input type="number" step="0.10" required value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} className="w-full pl-12 pr-4 py-3 text-2xl font-black bg-slate-50 border rounded-xl" /></div>
                  <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-xl">Cerrar Sesión</button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border text-sm space-y-2">
                    <div className="flex justify-between font-medium text-slate-500 text-xs"><span>Fondo Inicial:</span><span>{formatCurrency(cashSession.openingAmount)}</span></div>
                    <div className="flex justify-between font-medium text-slate-600 text-xs"><span>(+) Ventas Farmacia:</span><span>{formatCurrency(cashSession.result.totalSalesAmount)}</span></div>
                    <div className="flex justify-between font-medium text-purple-600 text-xs"><span>(+) Recargas Billetera:</span><span>{formatCurrency(cashSession.result.totalTopupsAmount)}</span></div>
                    <div className="border-t pt-2 mt-2"></div>
                    <div className="flex justify-between font-bold text-slate-800"><span>TOTAL ESPERADO:</span><span>{formatCurrency(cashSession.result.expected)}</span></div>
                    <div className="flex justify-between font-bold text-slate-800"><span>EFECTIVO DECLARADO:</span><span>{formatCurrency(cashSession.declaredAmount)}</span></div>
                    <div className="flex justify-between border-t border-slate-300 pt-2 mt-2 font-black text-lg">
                        <span>DIFERENCIA:</span><span className={cashSession.result.difference === 0 ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(cashSession.result.difference)}</span>
                    </div>
                  </div>
                  <button onClick={handleArchiveShift} className="w-full mt-4 py-4 bg-blue-600 text-white font-black rounded-xl">Iniciar Nuevo Turno</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VISTAS ADMIN --- */}
        {/* DASHBOARD ACTUALIZADO CON COMISIONES */}
        {activeTab === 'DASHBOARD' && currentUser.role === 'ADMIN' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-xl border flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={24}/></div><div><p className="text-[10px] font-bold text-slate-400">VENTAS FARMACIA</p><p className="text-lg font-black">{formatCurrency(metrics.dailyRevenue)}</p></div></div>
                <div className="bg-white p-5 rounded-xl border flex items-center gap-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Smartphone size={24}/></div><div><p className="text-[10px] font-bold text-slate-400">COMISIÓN RECARGAS</p><p className="text-lg font-black text-purple-700">{formatCurrency(metrics.totalTopupFees)}</p></div></div>
                <div className="bg-white p-5 rounded-xl border flex items-center gap-4"><div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><ArrowDownCircle size={24}/></div><div><p className="text-[10px] font-bold text-slate-400">INVERSIÓN COMPRAS</p><p className="text-lg font-black text-amber-700">{formatCurrency(metrics.totalInvestment)}</p></div></div>
                <div className="bg-white p-5 rounded-xl border flex items-center gap-4 col-span-1 sm:col-span-2"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Target size={24}/></div><div><p className="text-[10px] font-bold text-slate-400">GANANCIA NETA (Ventas + Comisiones - Inversión)</p><p className={`text-xl font-black ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(metrics.netProfit)}</p></div></div>
            </div>
        )}

        {activeTab === 'ADMIN_PROD' && currentUser.role === 'ADMIN' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6 h-fit">
                    <h3 className="font-black mb-4 border-b pb-4">Añadir Producto</h3>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                        <input type="text" required placeholder="Nombre" value={newProductForm.name} onChange={e=>setNewProductForm({...newProductForm, name: e.target.value})} className="w-full border p-2 text-sm rounded-lg" />
                        <select required value={newProductForm.category} onChange={e=>setNewProductForm({...newProductForm, category: e.target.value})} className="w-full border p-2 text-sm rounded-lg"><option value="">Categoría...</option><option value="Analgésicos">Analgésicos</option><option value="Antibióticos">Antibióticos</option><option value="Antiinflamatorios">Antiinflamatorios</option><option value="Insumos">Insumos</option></select>
                        <input type="number" step="0.10" required placeholder="Precio (S/)" value={newProductForm.price} onChange={e=>setNewProductForm({...newProductForm, price: e.target.value})} className="w-full border p-2 text-sm rounded-lg text-center font-bold" />
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-black rounded-lg">GUARDAR</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6 flex flex-col h-[75vh]">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-black">Catálogo Oficial</h3><input type="text" placeholder="Buscar..." className="border rounded-lg px-3 py-1 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 uppercase text-[10px] sticky top-0"><tr><th className="p-4">Cód</th><th className="p-4">Producto</th><th className="p-4 text-center">Stock</th><th className="p-4 text-right">Precio</th><th className="p-4 text-center">Acciones</th></tr></thead>
                            <tbody>
                                {displayedProducts.map(p => (
                                    <tr key={p.id} className="border-b"><td className="p-4 text-xs font-mono">{p.id}</td><td className="p-4 font-bold">{p.name}</td><td className="p-4 text-center font-black">{p.stock}</td><td className="p-4 text-right font-black text-emerald-600">{formatCurrency(p.price)}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={()=>handleEditProductPrice(p)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white" title="Editar Precio"><Edit3 size={16}/></button>
                                            <button onClick={()=>handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white" title="Eliminar Producto"><Trash2 size={16}/></button>
                                        </div>
                                    </td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'INVOICES' && currentUser.role === 'ADMIN' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6 h-fit">
                    <h3 className="font-black mb-4 border-b pb-4">Registrar Compra</h3>
                    <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                        <input type="text" required placeholder="Proveedor" value={invoiceForm.supplier} onChange={e=>setInvoiceForm({...invoiceForm, supplier: e.target.value})} className="w-full border p-2 text-sm rounded-lg" />
                        <input type="text" required placeholder="N° Doc" value={invoiceForm.document} onChange={e=>setInvoiceForm({...invoiceForm, document: e.target.value})} className="w-full border p-2 text-sm rounded-lg" />
                        <select required value={invoiceForm.productId} onChange={e=>setInvoiceForm({...invoiceForm, productId: e.target.value})} className="w-full border p-2 text-sm rounded-lg"><option value="">Producto...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                        <div className="flex gap-2"><input type="number" required placeholder="Cant." value={invoiceForm.qty} onChange={e=>setInvoiceForm({...invoiceForm, qty: e.target.value})} className="w-1/3 border p-2 text-sm rounded-lg text-center" /><input type="text" required placeholder="Lote" value={invoiceForm.lote} onChange={e=>setInvoiceForm({...invoiceForm, lote: e.target.value})} className="w-2/3 border p-2 text-sm rounded-lg" /></div>
                        <input type="date" required value={invoiceForm.expDate} onChange={e=>setInvoiceForm({...invoiceForm, expDate: e.target.value})} className="w-full border p-2 text-sm rounded-lg" />
                        <input type="number" step="0.10" required placeholder="Costo Total (S/)" value={invoiceForm.totalCost} onChange={e=>setInvoiceForm({...invoiceForm, totalCost: e.target.value})} className="w-full border p-2 text-sm rounded-lg font-bold" />
                        <button type="submit" className="w-full py-3 bg-slate-900 text-white font-black rounded-lg">REGISTRAR FACTURA</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6 h-[75vh] flex flex-col">
                    <h3 className="font-black mb-4 border-b pb-4">Historial de Compras</h3>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 uppercase text-[10px] sticky top-0"><tr><th className="p-4">Doc</th><th className="p-4">Fecha</th><th className="p-4">Detalle</th><th className="p-4 text-right">Inversión</th><th className="p-4 text-center">Eliminar</th></tr></thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="border-b"><td className="p-4 font-mono text-xs">{inv.document}</td><td className="p-4 text-xs">{inv.date}</td><td className="p-4 font-bold">+{inv.qty} {inv.product}</td><td className="p-4 text-right font-black text-amber-600">S/ {inv.cost.toFixed(2)}</td>
                                    <td className="p-4 text-center"><button onClick={() => handleDeleteInvoice(inv)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white" title="Eliminar factura y revertir stock"><Trash2 size={16}/></button></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- VENCIMIENTOS CON BOTÓN DE ELIMINAR LOTE --- */}
        {activeTab === 'EXPIRIES' && currentUser.role === 'ADMIN' && (
            <div className="bg-white rounded-xl shadow-sm border p-6 h-[75vh] flex flex-col">
                <h3 className="font-black mb-4 border-b pb-4">Control Analítico de Vencimientos</h3>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 uppercase text-[10px] sticky top-0"><tr><th className="p-4">Producto</th><th className="p-4">N° de Lote</th><th className="p-4 text-center">Unidades</th><th className="p-4 text-right">Caducidad</th><th className="p-4 text-center">Acciones</th></tr></thead>
                        <tbody>
                            {products
                                .flatMap(p => (p.lots || []).filter(l => l.qty > 0).map(l => ({ ...l, productId: p.id, prodName: p.name })))
                                .sort((a,b) => new Date(a.exp) - new Date(b.exp))
                                .map((lot, idx) => {
                                const isNear = (new Date(lot.exp) - new Date()) / (1000 * 60 * 60 * 24) <= 90;
                                return (
                                <tr key={idx} className="border-b"><td className="p-4 font-bold">{lot.prodName}</td><td className="p-4 font-mono text-xs">{lot.lote}</td><td className="p-4 text-center font-bold">{lot.qty}</td><td className={`p-4 text-right font-black ${isNear ? 'text-red-600' : 'text-emerald-600'}`}>{lot.exp}</td>
                                <td className="p-4 text-center"><button onClick={() => handleDeleteLot(lot.productId, lot.id, lot.qty)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white" title="Eliminar lote y descontar stock"><Trash2 size={16}/></button></td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- PERSONAL: RESTAURADO --- */}
        {activeTab === 'USERS' && currentUser.role === 'ADMIN' && (
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
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[75vh] overflow-y-auto">
                    <h3 className="font-black text-slate-800 mb-4 border-b pb-4">Personal Autorizado</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {staff.map(emp => (
                            <div key={emp.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm">
                                <div><div className="font-bold text-slate-800">{emp.name}</div><div className="text-[10px] text-slate-500 font-mono mt-0.5">Rol: {emp.role} • ID: {emp.id}</div></div>
                                <button onClick={() => handleAdminDeleteStaff(emp.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Eliminar cajero del sistema"><Trash2 size={20}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </main>

      {/* --- MODALES DE SEGURIDAD NATIVOS REACT (SAFE FOR IFRAME) --- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-t-4 border-red-500">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2"><AlertTriangle className="text-red-500"/> Confirmar Acción</h3>
            <p className="text-sm text-slate-600 mb-6 font-medium">{confirmDialog.text}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDialog({isOpen: false})} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600 hover:bg-slate-200">Cancelar</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({isOpen: false}); }} className="flex-1 py-3 bg-red-600 hover:bg-red-700 font-black text-white rounded-xl shadow-md">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {promptDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-t-4 border-blue-500">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Edit3 className="text-blue-500"/> {promptDialog.title}</h3>
            <div className="relative">
                <span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">S/</span>
                <input type="number" step="0.10" value={promptDialog.value} onChange={(e) => setPromptDialog({...promptDialog, value: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-lg text-xl font-bold mb-6 outline-none focus:border-blue-500" autoFocus />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPromptDialog({isOpen: false})} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600 hover:bg-slate-200">Cancelar</button>
              <button onClick={() => { promptDialog.onConfirm(promptDialog.value); setPromptDialog({isOpen: false}); }} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 font-black text-white rounded-xl shadow-md">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUTORIZACIÓN PIN */}
      {authModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border-t-4 border-t-red-500 p-6">
            <h3 className="text-lg font-black mb-2 flex items-center gap-2"><ShieldAlert className="text-red-500"/> Autorización Requerida</h3>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              {authModal.error && <div className="bg-red-50 text-red-600 text-[10px] p-2 rounded font-bold text-center border">{authModal.error}</div>}
              <input name="reason" type="text" required placeholder="Motivo de anulación..." className="w-full px-3 py-2 border rounded-lg text-sm" autoFocus />
              <input name="pin" type="password" required placeholder="PIN ADMIN (1234)" maxLength="4" className="w-full px-3 py-2 border rounded-lg text-xl text-center font-black" />
              <div className="flex gap-2"><button type="button" onClick={() => setAuthModal({ isOpen: false, action: null, payload: null, error: '' })} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-sm">CANCELAR</button><button type="submit" className="flex-1 py-3 bg-red-600 text-white font-black rounded-xl text-sm">AUTORIZAR</button></div>
            </form>
          </div>
        </div>
      )}

      {cashierLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border-t-4 border-emerald-500">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2"><Users className="text-emerald-500"/> Seleccione su Perfil</h3>
            <p className="text-xs text-slate-500 mb-4">Haga clic en su nombre para iniciar su turno.</p>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {staff.map(emp => (
                    <button key={emp.id} onClick={() => handleCashierLogin(emp)} className="w-full p-4 border rounded-xl flex flex-col text-left hover:border-emerald-500 hover:bg-emerald-50 group">
                        <span className="font-bold text-slate-800">{emp.name}</span><span className="text-[10px] text-slate-400 font-mono mt-0.5">Rol: {emp.role} • ID: {emp.id}</span>
                    </button>
                ))}
            </div>
            <button onClick={()=>setCashierLoginModal(false)} className="w-full mt-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">CANCELAR</button>
          </div>
        </div>
      )}

      {adminLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border-t-4 border-blue-500">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><ShieldAlert className="text-blue-500"/> Clave Administrativa</h3>
            <form onSubmit={(e) => { e.preventDefault(); if(new FormData(e.target).get('password') === '1234') handleAdminLogin(); else { showAlert('Clave incorrecta', 'error'); addAuditLog("SEGURIDAD", "Intento fallido Admin"); } }}>
              <input name="password" type="password" required placeholder="Ingrese 1234" className="w-full p-4 bg-slate-50 border rounded-xl text-center font-black text-2xl tracking-widest mb-4" autoFocus />
              <div className="flex gap-2">
                 <button type="button" onClick={()=>setAdminLoginModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">CANCELAR</button>
                 <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-black rounded-xl text-sm">INGRESAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}