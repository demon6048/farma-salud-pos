import React, { useState, useEffect } from 'react';
import { ShoppingCart, LogOut, Package, ShieldAlert, BarChart3, AlertTriangle, CheckCircle, XCircle, Search, Edit3, Clock, ArrowDownCircle, ArrowUpCircle, AlertCircle, Box, TrendingUp, Truck, FileText, Activity, Calendar, CalendarDays, CalendarRange, DollarSign, Target, Download } from 'lucide-react';

const INITIAL_PRODUCTS = [
  // 10 PRODUCTOS CON VENCIMIENTO CRÍTICO (Para demostración del Panel Vencimientos)
  { id: "P001", name: "Paracetamol 500 mg x 100 tab", category: "Analgésicos", price: 3.50, stock: 15, lots: [{ id: 'L1', lote: 'L-VENC-01', exp: '2026-08-15', qty: 15 }] }, // Vencido
  { id: "P002", name: "Ibuprofeno 400 mg x 100 tab", category: "Antiinflamatorios", price: 5.00, stock: 90, lots: [{ id: 'L2', lote: 'L-VENC-02', exp: '2026-09-10', qty: 90 }] }, // Vencido
  { id: "P003", name: "Amoxicilina 500 mg x 100 cap", category: "Antibióticos", price: 12.00, stock: 8, lots: [{ id: 'L3', lote: 'L-VENC-03', exp: '2025-12-31', qty: 8 }] }, // Vencido
  { id: "P004", name: "Alcohol 70% Medicinal 1 Litro", category: "Insumos", price: 8.50, stock: 30, lots: [{ id: 'L4', lote: 'L-PROX-01', exp: '2026-10-01', qty: 30 }] }, // Próximo
  { id: "P005", name: "Naproxeno 550 mg x 100 tab", category: "Antiinflamatorios", price: 7.00, stock: 80, lots: [{ id: 'L5', lote: 'L-PROX-02', exp: '2026-10-15', qty: 80 }] }, // Próximo
  { id: "P006", name: "Azitromicina 500 mg x 3 tab", category: "Antibióticos", price: 15.00, stock: 25, lots: [{ id: 'L6', lote: 'L-PROX-03', exp: '2026-11-05', qty: 25 }] }, // Próximo
  { id: "P007", name: "Mascarillas Quirúrgicas x 50", category: "Insumos", price: 10.00, stock: 100, lots: [{ id: 'L7', lote: 'L-PROX-04', exp: '2026-11-20', qty: 100 }] }, // Próximo
  { id: "P008", name: "Omeprazol 20 mg x 30 cap", category: "Gastrointestinales", price: 9.50, stock: 60, lots: [{ id: 'L8', lote: 'L-PROX-05', exp: '2026-12-01', qty: 60 }] }, // Próximo
  { id: "P009", name: "Losartán 50 mg x 30 tab", category: "Antihipertensivos", price: 18.00, stock: 45, lots: [{ id: 'L9', lote: 'L-PROX-06', exp: '2026-09-30', qty: 45 }] }, // Próximo
  { id: "P010", name: "Vitamina C 1g x 10 tab ef", category: "Vitaminas", price: 14.50, stock: 5, lots: [{ id: 'L10', lote: 'L-PROX-07', exp: '2026-11-30', qty: 5 }] }, // Próximo (y Stock Crítico)

  // 40 PRODUCTOS CON VENCIMIENTO VIGENTE (2027 - 2028)
  { id: "P011", name: "Cetirizina 10 mg x 100 tab", category: "Antialérgicos", price: 8.00, stock: 120, lots: [{ id: 'L11', lote: 'L-NOR-01', exp: '2028-05-15', qty: 120 }] },
  { id: "P012", name: "Loratadina 10 mg x 100 tab", category: "Antialérgicos", price: 7.50, stock: 95, lots: [{ id: 'L12', lote: 'L-NOR-02', exp: '2027-10-10', qty: 95 }] },
  { id: "P013", name: "Dexametasona 4 mg ampolla", category: "Antiinflamatorios", price: 4.50, stock: 50, lots: [{ id: 'L13', lote: 'L-NOR-03', exp: '2027-12-30', qty: 50 }] },
  { id: "P014", name: "Diclofenaco 50 mg x 100 tab", category: "Antiinflamatorios", price: 5.50, stock: 150, lots: [{ id: 'L14', lote: 'L-NOR-04', exp: '2028-01-20', qty: 150 }] },
  { id: "P015", name: "Ciprofloxacino 500 mg x 100 tab", category: "Antibióticos", price: 25.00, stock: 40, lots: [{ id: 'L15', lote: 'L-NOR-05', exp: '2027-08-11', qty: 40 }] },
  { id: "P016", name: "Cefalexina 500 mg x 100 cap", category: "Antibióticos", price: 22.00, stock: 60, lots: [{ id: 'L16', lote: 'L-NOR-06', exp: '2027-09-05', qty: 60 }] },
  { id: "P017", name: "Algodón Hidrófilo 100g", category: "Insumos", price: 3.00, stock: 200, lots: [{ id: 'L17', lote: 'L-NOR-07', exp: '2029-12-31', qty: 200 }] },
  { id: "P018", name: "Jeringa 5ml con aguja x 100", category: "Insumos", price: 15.00, stock: 35, lots: [{ id: 'L18', lote: 'L-NOR-08', exp: '2028-11-20', qty: 35 }] },
  { id: "P019", name: "Gasas estériles 10x10cm x 100", category: "Insumos", price: 12.00, stock: 80, lots: [{ id: 'L19', lote: 'L-NOR-09', exp: '2028-06-15', qty: 80 }] },
  { id: "P020", name: "Agua oxigenada 120ml", category: "Insumos", price: 2.50, stock: 110, lots: [{ id: 'L20', lote: 'L-NOR-10', exp: '2027-11-01', qty: 110 }] },
  { id: "P021", name: "Enalapril 20 mg x 30 tab", category: "Antihipertensivos", price: 6.00, stock: 75, lots: [{ id: 'L21', lote: 'L-NOR-11', exp: '2027-07-20', qty: 75 }] },
  { id: "P022", name: "Captopril 25 mg x 30 tab", category: "Antihipertensivos", price: 5.50, stock: 85, lots: [{ id: 'L22', lote: 'L-NOR-12', exp: '2027-05-15', qty: 85 }] },
  { id: "P023", name: "Amlodipino 5 mg x 30 tab", category: "Antihipertensivos", price: 8.50, stock: 65, lots: [{ id: 'L23', lote: 'L-NOR-13', exp: '2028-02-28', qty: 65 }] },
  { id: "P024", name: "Atorvastatina 20 mg x 30 tab", category: "Cardiovasculares", price: 12.00, stock: 55, lots: [{ id: 'L24', lote: 'L-NOR-14', exp: '2028-04-10', qty: 55 }] },
  { id: "P025", name: "Simvastatina 20 mg x 30 tab", category: "Cardiovasculares", price: 10.00, stock: 45, lots: [{ id: 'L25', lote: 'L-NOR-15', exp: '2027-09-30', qty: 45 }] },
  { id: "P026", name: "Metformina 850 mg x 100 tab", category: "Antidiabéticos", price: 15.00, stock: 130, lots: [{ id: 'L26', lote: 'L-NOR-16', exp: '2027-12-12', qty: 130 }] },
  { id: "P027", name: "Glibenclamida 5 mg x 100 tab", category: "Antidiabéticos", price: 8.00, stock: 90, lots: [{ id: 'L27', lote: 'L-NOR-17', exp: '2028-01-15', qty: 90 }] },
  { id: "P028", name: "Insulina NPH 100 UI frasco", category: "Antidiabéticos", price: 45.00, stock: 12, lots: [{ id: 'L28', lote: 'L-NOR-18', exp: '2027-03-20', qty: 12 }] },
  { id: "P029", name: "Pantoprazol 40 mg x 30 tab", category: "Gastrointestinales", price: 18.50, stock: 50, lots: [{ id: 'L29', lote: 'L-NOR-19', exp: '2027-10-05', qty: 50 }] },
  { id: "P030", name: "Ranitidina 150 mg x 100 tab", category: "Gastrointestinales", price: 14.00, stock: 70, lots: [{ id: 'L30', lote: 'L-NOR-20', exp: '2028-05-20', qty: 70 }] },
  { id: "P031", name: "Bismuto subsalicilato frasco", category: "Gastrointestinales", price: 16.00, stock: 25, lots: [{ id: 'L31', lote: 'L-NOR-21', exp: '2027-11-15', qty: 25 }] },
  { id: "P032", name: "Loperamida 2 mg x 100 tab", category: "Gastrointestinales", price: 10.00, stock: 85, lots: [{ id: 'L32', lote: 'L-NOR-22', exp: '2028-02-10', qty: 85 }] },
  { id: "P033", name: "Complejo B x 100 tab", category: "Vitaminas", price: 20.00, stock: 110, lots: [{ id: 'L33', lote: 'L-NOR-23', exp: '2027-08-30', qty: 110 }] },
  { id: "P034", name: "Ácido Fólico 1 mg x 100 tab", category: "Vitaminas", price: 9.00, stock: 65, lots: [{ id: 'L34', lote: 'L-NOR-24', exp: '2028-04-25', qty: 65 }] },
  { id: "P035", name: "Sulfato Ferroso frasco jarabe", category: "Vitaminas", price: 12.50, stock: 40, lots: [{ id: 'L35', lote: 'L-NOR-25', exp: '2027-09-18', qty: 40 }] },
  { id: "P036", name: "Calcio + Vitamina D3 x 60 tab", category: "Vitaminas", price: 25.00, stock: 55, lots: [{ id: 'L36', lote: 'L-NOR-26', exp: '2028-01-10', qty: 55 }] },
  { id: "P037", name: "Salbutamol inhalador 200 dosis", category: "Respiratorios", price: 18.00, stock: 35, lots: [{ id: 'L37', lote: 'L-NOR-27', exp: '2027-06-30', qty: 35 }] },
  { id: "P038", name: "Bromhexina jarabe adulto", category: "Respiratorios", price: 11.00, stock: 45, lots: [{ id: 'L38', lote: 'L-NOR-28', exp: '2027-05-20', qty: 45 }] },
  { id: "P039", name: "Dextrometorfano jarabe", category: "Respiratorios", price: 13.50, stock: 30, lots: [{ id: 'L39', lote: 'L-NOR-29', exp: '2027-10-12', qty: 30 }] },
  { id: "P040", name: "Clorfenamina 4 mg x 100 tab", category: "Antialérgicos", price: 5.00, stock: 140, lots: [{ id: 'L40', lote: 'L-NOR-30', exp: '2028-07-22', qty: 140 }] },
  { id: "P041", name: "Ketorolaco 10 mg x 100 tab", category: "Analgésicos", price: 15.00, stock: 75, lots: [{ id: 'L41', lote: 'L-NOR-31', exp: '2027-08-05', qty: 75 }] },
  { id: "P042", name: "Tramadol 50 mg x 100 cap", category: "Analgésicos", price: 28.00, stock: 40, lots: [{ id: 'L42', lote: 'L-NOR-32', exp: '2027-11-25', qty: 40 }] },
  { id: "P043", name: "Meloxicam 15 mg x 100 tab", category: "Antiinflamatorios", price: 19.00, stock: 65, lots: [{ id: 'L43', lote: 'L-NOR-33', exp: '2028-02-14', qty: 65 }] },
  { id: "P044", name: "Prednisona 5 mg x 100 tab", category: "Antiinflamatorios", price: 12.00, stock: 80, lots: [{ id: 'L44', lote: 'L-NOR-34', exp: '2027-04-18', qty: 80 }] },
  { id: "P045", name: "Clotrimazol crema 1% tubo", category: "Dermatológicos", price: 8.50, stock: 55, lots: [{ id: 'L45', lote: 'L-NOR-35', exp: '2027-09-10', qty: 55 }] },
  { id: "P046", name: "Ketoconazol 200 mg x 100 tab", category: "Antimicóticos", price: 22.00, stock: 45, lots: [{ id: 'L46', lote: 'L-NOR-36', exp: '2028-03-30', qty: 45 }] },
  { id: "P047", name: "Fluconazol 150 mg x 2 cap", category: "Antimicóticos", price: 6.00, stock: 90, lots: [{ id: 'L47', lote: 'L-NOR-37', exp: '2027-12-01', qty: 90 }] },
  { id: "P048", name: "Levofloxacino 500 mg x 7 tab", category: "Antibióticos", price: 18.00, stock: 35, lots: [{ id: 'L48', lote: 'L-NOR-38', exp: '2027-07-15', qty: 35 }] },
  { id: "P049", name: "Esparadrapo tela 5x5", category: "Insumos", price: 4.50, stock: 120, lots: [{ id: 'L49', lote: 'L-NOR-39', exp: '2029-01-01', qty: 120 }] },
  { id: "P050", name: "Guantes de látex talla M x 100", category: "Insumos", price: 25.00, stock: 25, lots: [{ id: 'L50', lote: 'L-NOR-40', exp: '2028-08-20', qty: 25 }] }
];

const PROVEEDORES_BASE = [
  "Química Suiza S.A.", "Droguería INCA", "Farmindustria", "Bayer Perú", "Genéricos del Pacífico",
  "Laboratorios Portugal", "Medifarma S.A.", "Distribuidora Albis", "Sanofi Aventis", "Teva Perú",
  "Laboratorios AC Farma", "Hersil S.A.", "Eurofarma", "Droguería Los Andes", "Corporación Infarmasa",
  "Pfizer Perú", "Bagó del Perú", "Laboratorios Lansier", "Grunenthal Peruana", "Terbol S.A."
];

const INITIAL_LOGS = [
  { id: "L-101", date: "15/09/2026", time: "08:00:00", user: "SISTEMA", action: "INICIO SISTEMA", detail: "Plataforma Farma Salud iniciada bajo protocolo estricto Antifraude." }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cashSession, setCashSession] = useState({ isOpen: false, openingAmount: 0, declaredAmount: null, result: null, shiftId: null });
  const [activeTab, setActiveTab] = useState('LOGIN'); 
  const [adminLoginModal, setAdminLoginModal] = useState(false);
  
  // Modals, UI & Form States
  const [authModal, setAuthModal] = useState({ isOpen: false, action: null, payload: null, error: '' });
  const [alerts, setAlerts] = useState([]);
  const [openingAmount, setOpeningAmount] = useState(''); 
  const [closingAmount, setClosingAmount] = useState('');
  const [sortBy, setSortBy] = useState('STOCK_ASC');
  
  const [invoiceForm, setInvoiceForm] = useState({ supplier: '', document: '', productId: '', qty: '', lote: '', expDate: '', totalCost: '' });
  const [viewLotsModal, setViewLotsModal] = useState({ isOpen: false, product: null });

  // NUEVOS ESTADOS PARA CATÁLOGO Y PRECIOS
  const [newProductForm, setNewProductForm] = useState({ name: '', category: '', price: '' });
  const [priceEditForm, setPriceEditForm] = useState({ isOpen: false, product: null, newPrice: '', reason: '' });

  // Utilidades
  const formatCurrency = (amount) => `S/ ${parseFloat(amount).toFixed(2)}`;
  const getTimestamp = () => {
    const now = new Date();
    return { 
      date: now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }), 
      time: now.toLocaleTimeString('es-PE', { hour12: false }) 
    };
  };

  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [sales, setSales] = useState([]);
  const [auditLogs, setAuditLogs] = useState(INITIAL_LOGS);
  const [invoices, setInvoices] = useState([
      { id: "INV-001", date: "10/09/2026", supplier: "Química Suiza S.A.", document: "F001-4432", product: "Paracetamol 500 mg x 100 tab", qty: 50, cost: 120.00, user: "ADMIN01" }
  ]);
  
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const addAuditLog = (action, detail) => {
    const { date, time } = getTimestamp();
    const newLog = { id: `L-${100 + auditLogs.length + 1}`, date, time, user: currentUser?.id || 'SISTEMA', action, detail };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const showAlert = (msg, type = 'info') => {
    const newAlert = { id: Date.now(), msg, type };
    setAlerts(prev => [newAlert, ...prev]);
    setTimeout(() => { setAlerts(prev => prev.filter(a => a.id !== newAlert.id)); }, 5000);
  };

  const handleOpenCashRegister = (e) => {
    e.preventDefault();
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) return showAlert("Monto inválido.", "error");
    
    setCashSession({ isOpen: true, openingAmount: amount, declaredAmount: null, result: null, shiftId: Date.now() });
    addAuditLog("APERTURA CAJA", `Fondo inicial: ${formatCurrency(amount)} físico.`);
    setActiveTab('POS');
    showAlert("Caja abierta. Sesión de ventas iniciada.", "success");
  };

  const handleCloseCashRegister = (e) => {
    e.preventDefault();
    const declared = parseFloat(closingAmount);
    if (isNaN(declared) || declared < 0) return showAlert("Monto inválido.", "error");

    const completedSales = sales.filter(s => s.status === 'COMPLETADA' && s.shiftId === cashSession.shiftId);
    const totalSalesAmount = completedSales.reduce((acc, s) => acc + s.total, 0);
    
    const expected = cashSession.openingAmount + totalSalesAmount;
    const difference = declared - expected;

    setCashSession(prev => ({ ...prev, declaredAmount: declared, result: { expected, difference } }));
    
    let statusText = difference === 0 ? "CUADRE EXACTO" : (difference > 0 ? "SOBRANTE" : "FALTANTE");
    addAuditLog("CIERRE DE CAJA CIEGO", `Cajero ${currentUser.id} declaró: ${formatCurrency(declared)}. Esperado: ${formatCurrency(expected)}. Dif: ${formatCurrency(difference)} (${statusText})`);
    showAlert(`Cierre completado. ${statusText}`, difference === 0 ? 'success' : 'error');
  };

  const handleLogin = (role) => {
    if (role === 'ADMIN') {
      setCurrentUser({ id: 'ADMIN01', name: 'Administrador', role: 'ADMIN' });
      setActiveTab('DASHBOARD');
      addAuditLog("INICIO SESIÓN", "Acceso Administrador (ADMIN01)");
      setAdminLoginModal(false);
    } else {
      setCurrentUser({ id: 'CAJA01', name: 'María Pérez', role: 'CAJERO' });
      
      if (cashSession.isOpen && !cashSession.result) {
        // La caja ya está abierta y activa (Reanudar turno)
        setActiveTab('POS');
        addAuditLog("INICIO SESIÓN", "Acceso Cajero (CAJA01). Turno reanudado. Caja mantenida.");
      } else if (cashSession.isOpen && cashSession.result) {
        // La caja ya fue cerrada mediante cierre ciego (Ir a pantalla de caja bloqueada)
        setActiveTab('CASH');
        addAuditLog("INICIO SESIÓN", "Acceso Cajero (CAJA01). Ingreso a caja cerrada/bloqueada.");
      } else {
        // Primera vez abriendo caja
        setActiveTab('OPEN_CASH');
        addAuditLog("INICIO SESIÓN", "Acceso Cajero (CAJA01). Pendiente apertura.");
      }
    }
  };

  const handleLogout = () => {
    addAuditLog("FIN SESIÓN", `Usuario ${currentUser.id} cerró sesión.`);
    setCurrentUser(null);
    setActiveTab('LOGIN');
    // NOTA: Ya no borramos el estado de 'cashSession' aquí para que sea persistente durante el día.
  };

  const addToCart = (product) => {
    if (!cashSession.isOpen) return showAlert("Debe abrir la caja primero.", "error");
    if (cashSession.result) return showAlert("La caja ya fue cerrada. Turno finalizado.", "error");
    if (product.stock <= 0) return showAlert("Producto sin stock.", "error");
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if(existing.qty >= product.stock) { showAlert("No hay más stock disponible", "error"); return prev; }
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
        if(newQty > product.stock) { showAlert("Límite de stock alcanzado", "error"); newQty = product.stock; }
        return newQty > 0 ? { ...item, qty: newQty, subtotal: newQty * item.price } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const processCheckout = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const { date, time } = getTimestamp();
    const saleId = `T-${1000 + sales.length}`;
    
    let updatedProducts = [...products];
    let cartClone = JSON.parse(JSON.stringify(cart));

    cartClone.forEach(cartItem => {
        let pIndex = updatedProducts.findIndex(p => p.id === cartItem.productId);
        if (pIndex !== -1) {
            let product = updatedProducts[pIndex];
            let qtyToDeduct = cartItem.qty;
            product.lots.sort((a, b) => new Date(`${a.exp}T00:00:00`) - new Date(`${b.exp}T00:00:00`));

            for (let i = 0; i < product.lots.length; i++) {
                if (qtyToDeduct <= 0) break;
                if (product.lots[i].qty > 0) {
                    let deducted = Math.min(qtyToDeduct, product.lots[i].qty);
                    product.lots[i].qty -= deducted;
                    qtyToDeduct -= deducted;
                }
            }
            product.stock = product.lots.reduce((sum, l) => sum + l.qty, 0);
        }
    });
    setProducts(updatedProducts);

    const newSale = { id: saleId, date, time, seller: currentUser.id, shiftId: cashSession.shiftId, items: cart, total, status: 'COMPLETADA' };
    setSales(prev => [newSale, ...prev]);
    addAuditLog("VENTA COBRADA", `Comprobante ${saleId} emitido por ${formatCurrency(total)}.`);
    setCart([]);
    showAlert(`Venta ${saleId} registrada exitosamente.`, 'success');
  };

  const handleInvoiceSubmit = (e) => {
    e.preventDefault();
    const { supplier, document, productId, qty, lote, expDate, totalCost } = invoiceForm;
    const numQty = parseInt(qty);
    
    if(!supplier || !document || !productId || isNaN(numQty) || !lote || !expDate) {
        return showAlert("Llene todos los campos de la factura.", "error");
    }

    let updatedProducts = [...products];
    let pIndex = updatedProducts.findIndex(p => p.id === productId);
    let productName = "Producto Desconocido";

    if (pIndex !== -1) {
        updatedProducts[pIndex].lots.push({ id: `L-${Date.now()}`, lote: lote.trim().toUpperCase(), exp: expDate, qty: numQty });
        updatedProducts[pIndex].stock += numQty;
        productName = updatedProducts[pIndex].name;
    }

    setProducts(updatedProducts);

    const { date } = getTimestamp();
    const newInvoice = {
        id: `INV-${Date.now().toString().slice(-4)}`, date, supplier, document, product: productName, qty: numQty, cost: parseFloat(totalCost || 0), user: currentUser.id
    };
    setInvoices(prev => [newInvoice, ...prev]);

    addAuditLog("RECEPCIÓN FACTURA", `Ingreso de Factura ${document} de ${supplier}. Producto: ${productName} (+${numQty} und, Lote: ${lote}).`);
    showAlert("Factura registrada e inventario actualizado.", "success");
    setInvoiceForm({ supplier: '', document: '', productId: '', qty: '', lote: '', expDate: '', totalCost: '' });
  };

  const requestVoid = (saleId) => setAuthModal({ isOpen: true, action: 'VOID_SALE', payload: saleId, error: '' });

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const pin = formData.get('pin');
    const reason = formData.get('reason');

    if (pin !== '1234') {
      addAuditLog("ALERTA SEGURIDAD", `Intento fallido de PIN por ${currentUser.id}`);
      return setAuthModal(prev => ({ ...prev, error: 'PIN INCORRECTO. Registrado en auditoría.' }));
    }
    if (!reason.trim()) return setAuthModal(prev => ({ ...prev, error: 'MOTIVO OBLIGATORIO.' }));

    if (authModal.action === 'VOID_SALE') executeVoid(authModal.payload, reason);
    setAuthModal({ isOpen: false, action: null, payload: null, error: '' });
  };

  const executeVoid = (saleId, reason) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'ANULADA', voidReason: reason, voidBy: 'ADMIN01' } : s));
    const sale = sales.find(s => s.id === saleId);
    
    let updatedProducts = [...products];
    sale.items.forEach(item => {
        let pIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
            let product = updatedProducts[pIndex];
            if(product.lots.length === 0) product.lots.push({ id: `L-REV-${Date.now()}`, lote: 'L-REVERSION', exp: '2099-12-31', qty: item.qty });
            else product.lots[0].qty += item.qty; 
            product.stock = product.lots.reduce((sum, l) => sum + l.qty, 0);
        }
    });
    setProducts(updatedProducts);

    addAuditLog("ANULACIÓN AUTORIZADA", `Venta ${saleId} anulada. Motivo: ${reason}. Aut: ADMIN01.`);
    showAlert(`Venta ${saleId} anulada. Stock devuelto.`, 'error');
  };

  const printTicket = (saleId) => {
     addAuditLog("REIMPRESIÓN TICKET", `Usuario ${currentUser.id} imprimió copia de ticket ${saleId}.`);
     showAlert(`Imprimiendo ticket ${saleId}...`, 'info');
  };

  const downloadTicketPDF = (saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    addAuditLog("DESCARGA PDF", `Usuario ${currentUser.id} generó documento PDF del ticket ${saleId}.`);
    showAlert(`Generando documento PDF para ${saleId}...`, 'info');

    // Generador de ticket digital formato PDF (via print-to-pdf nativo)
    const printWindow = window.open('', '_blank');
    const html = `
        <html>
            <head>
                <title>Ticket_${saleId}.pdf</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #1e293b; max-width: 400px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 15px; }
                    .header h2 { margin: 0 0 10px 0; font-size: 24px; font-weight: 900; }
                    .info { font-size: 12px; margin-bottom: 5px; color: #64748b; }
                    .item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: bold; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
                    .item-name { flex: 1; padding-right: 10px; }
                    .total-section { border-top: 2px dashed #cbd5e1; margin-top: 20px; padding-top: 15px; }
                    .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; }
                    .footer { text-align: center; font-size: 11px; margin-top: 40px; color: #94a3b8; }
                    .status { font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 10px; }
                    .status.COMPLETADA { background: #dcfce7; color: #166534; }
                    .status.ANULADA { background: #fee2e2; color: #991b1b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>FARMA SALUD</h2>
                    <div class="info">Documento de Venta Digital</div>
                    <div class="info">Ticket: <b>${sale.id}</b></div>
                    <div class="info">Fecha: ${sale.date} - Hora: ${sale.time}</div>
                    <div class="info">Cajero: ${sale.seller}</div>
                    <div class="status ${sale.status}">${sale.status}</div>
                </div>
                <div class="items">
                    ${sale.items.map(item => `
                        <div class="item">
                            <div class="item-name">${item.qty}x ${item.name}</div>
                            <div>S/ ${item.subtotal.toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="total-section">
                    <div class="total-row">
                        <span>TOTAL A PAGAR:</span>
                        <span>S/ ${sale.total.toFixed(2)}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>¡Gracias por su compra!</p>
                    <p>¡Gracias por su preferencia y confianza!</p>
                </div>
                <script>
                    window.onload = () => { window.print(); }
                </script>
            </body>
        </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.category || !newProductForm.price) return showAlert('Llene todos los campos.', 'error');
    
    const newId = `P${String(products.length + 1).padStart(3, '0')}`;
    const newProd = {
      id: newId,
      name: newProductForm.name,
      category: newProductForm.category,
      price: parseFloat(newProductForm.price),
      stock: 0,
      lots: []
    };
    
    setProducts([newProd, ...products]);
    addAuditLog("NUEVO PRODUCTO", `Producto creado: ${newProd.name}. Precio inicial: ${formatCurrency(newProd.price)}`);
    showAlert('Producto creado exitosamente. Stock en 0.', 'success');
    setNewProductForm({ name: '', category: '', price: '' });
  };

  const submitPriceChange = (e) => {
    e.preventDefault();
    const { product, newPrice, reason } = priceEditForm;
    const parsedPrice = parseFloat(newPrice);
    
    if (isNaN(parsedPrice) || parsedPrice <= 0) return showAlert('Precio inválido.', 'error');
    if (!reason.trim()) return showAlert('El motivo es obligatorio (Regla de Auditoría).', 'error');

    const oldPrice = product.price;
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, price: parsedPrice } : p));
    
    addAuditLog("MODIFICACIÓN PRECIO", `Precio de ${product.name} modificado de ${formatCurrency(oldPrice)} a ${formatCurrency(parsedPrice)}. Motivo: ${reason}`);
    showAlert(`Precio actualizado a ${formatCurrency(parsedPrice)}`, 'success');
    setPriceEditForm({ isOpen: false, product: null, newPrice: '', reason: '' });
  };

  const getDashboardMetrics = () => {
      const todaySales = sales.filter(s => s.status === 'COMPLETADA');
      const dailyRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
      
      // Saldos acumulados exactos (inversión en compras vs ingresos reales por ventas)
      const totalInvestment = invoices.reduce((acc, inv) => acc + inv.cost, 0);
      const netProfit = dailyRevenue - totalInvestment;

      const totalAnulaciones = sales.filter(s => s.status === 'ANULADA').reduce((acc, s) => acc + s.total, 0);
      const ticketsCount = todaySales.length;

      const catSales = {};
      todaySales.forEach(sale => {
          sale.items.forEach(item => {
              catSales[item.category] = (catSales[item.category] || 0) + item.subtotal;
          });
      });

      const sortedCategories = Object.entries(catSales).sort((a, b) => b[1] - a[1]);

      return { dailyRevenue, totalInvestment, netProfit, totalAnulaciones, ticketsCount, sortedCategories };
  };

  const metrics = getDashboardMetrics();

  let displayedProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()));
  if (sortBy === 'STOCK_ASC') displayedProducts.sort((a, b) => a.stock - b.stock);
  else if (sortBy === 'STOCK_DESC') displayedProducts.sort((a, b) => b.stock - a.stock);
  else if (sortBy === 'AZ') displayedProducts.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === 'ZA') displayedProducts.sort((a, b) => b.name.localeCompare(a.name));

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col selection:bg-blue-200">
      
      {/* HEADER METÁLICO/TECH */}
      <header className="bg-slate-900 border-b border-slate-700 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-slate-700 relative group cursor-pointer" title="Logotipo Farma Salud">
                <img src="https://placehold.co/100x100/1e293b/a3e635?text=FS" alt="Logo Farma Salud" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
              FARMA SALUD
            </span>
            <span className="hidden sm:inline-block bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono border border-slate-700 uppercase tracking-widest">
              Core System
            </span>
          </div>

          {currentUser && (
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-200">{currentUser.name}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${currentUser.role === 'ADMIN' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'}`}>
                  {currentUser.role}
                </span>
              </div>
              <button onClick={handleLogout} className="bg-slate-800 hover:bg-red-900 border border-slate-700 hover:border-red-700 p-2 rounded-lg transition-all shadow-sm text-slate-300 hover:text-white" title="Cerrar Sesión">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ALERTAS GLOBALES */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-4 rounded-xl shadow-2xl border-l-4 font-bold text-sm max-w-sm pointer-events-auto flex items-center gap-3 backdrop-blur-md ${
            alert.type === 'error' ? 'bg-white/90 border-red-500 text-red-700' : 
            alert.type === 'success' ? 'bg-slate-900/90 border-emerald-500 text-emerald-400' : 
            'bg-blue-50/90 border-blue-500 text-blue-800'
          }`}>
            {alert.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
            {alert.msg}
          </div>
        ))}
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col gap-4">
        
        {/* LOGIN VIEW */}
        {!currentUser && activeTab === 'LOGIN' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 max-w-md w-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
              <div className="text-center mb-8">
                <div className="bg-slate-50 text-slate-400 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm overflow-hidden">
                  <img src="https://placehold.co/150x150/f8fafc/94a3b8?text=FS" alt="Logo Farma Salud" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Acceso Seguro</h2>
                <p className="text-xs text-slate-500 mt-2 font-medium">Plataforma Auditada Farma Salud</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => handleLogin('CAJERO')} className="w-full py-3.5 px-4 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all flex justify-between items-center group">
                  <div className="flex flex-col text-left">
                    <span>Entrar como Cajero</span>
                    <span className="text-[10px] text-slate-400 font-normal">Terminal POS (Acceso Libre)</span>
                  </div>
                  <Package className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </button>
                <button onClick={() => setAdminLoginModal(true)} className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex justify-between items-center group">
                  <div className="flex flex-col text-left">
                    <span>Administrador</span>
                    <span className="text-[10px] text-slate-400 font-normal">Requiere Clave de Acceso</span>
                  </div>
                  <ShieldAlert className="text-slate-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* APERTURA CAJA CAJERO */}
        {activeTab === 'OPEN_CASH' && (
           <div className="flex-1 flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 border-t-4 border-t-emerald-500 max-w-md w-full">
             <div className="text-center mb-6">
               <h2 className="text-xl font-black text-slate-800">Apertura de Turno</h2>
               <p className="text-xs text-slate-500 mt-2">Declare el efectivo inicial en su caja.</p>
             </div>
             <form onSubmit={handleOpenCashRegister} className="space-y-6">
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Monto Físico (S/)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">S/</span>
                    <input 
                      type="number" step="0.10" required value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                    />
                 </div>
               </div>
               <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all">
                 ABRIR CAJA
               </button>
             </form>
           </div>
         </div>
        )}

        {/* NAVIGATION MENUS */}
        {currentUser && (activeTab !== 'OPEN_CASH' && activeTab !== 'LOGIN') && (
          <nav className="bg-white shadow-sm border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1">
            {currentUser.role === 'CAJERO' ? (
              <>
                <button onClick={() => setActiveTab('POS')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'POS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><ShoppingCart size={14} /> PUNTO DE VENTA</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Clock size={14} /> HISTORIAL</button>
                <button onClick={() => setActiveTab('CASH')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'CASH' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Activity size={14} /> CAJA & CIERRE</button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'DASHBOARD' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><TrendingUp size={14} /> DASHBOARD</button>
                <button onClick={() => setActiveTab('ADMIN')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'ADMIN' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Box size={14} /> CATÁLOGO & PRECIOS</button>
                <button onClick={() => setActiveTab('INVOICES')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'INVOICES' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><Truck size={14} /> PROVEEDORES & FACTURAS</button>
                <button onClick={() => setActiveTab('EXPIRIES')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'EXPIRIES' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}><AlertTriangle size={14} /> VENCIMIENTOS</button>
                <button onClick={() => setActiveTab('AUDIT')} className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'AUDIT' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><ShieldAlert size={14} /> AUDITORÍA</button>
              </>
            )}
          </nav>
        )}

        {/* --- MÓDULO 1: DASHBOARD CON SALDOS EXACTOS Y GANANCIAS (ADMIN) --- */}
        {activeTab === 'DASHBOARD' && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"><Calendar size={80}/></div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl relative z-10"><DollarSign size={24}/></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingreso Diario Acumulado</p>
                            <p className="text-xl font-black text-slate-800">{formatCurrency(metrics.dailyRevenue)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"><Truck size={80}/></div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl relative z-10"><ArrowDownCircle size={24}/></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inversión Total Compras</p>
                            <p className="text-xl font-black text-amber-700">{formatCurrency(metrics.totalInvestment)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"><TrendingUp size={80}/></div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl relative z-10"><Target size={24}/></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Neto (Ganancia/Pérdida)</p>
                            <p className={`text-xl font-black ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(metrics.netProfit)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"><BarChart3 size={80}/></div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl relative z-10"><Activity size={24}/></div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Transacciones</p>
                            <p className="text-xl font-black text-slate-800">{metrics.ticketsCount} <span className="text-xs font-bold text-slate-400">tickets</span></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl"><FileText size={24}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facturas Registradas</p>
                                <p className="text-2xl font-black text-slate-800">{invoices.length} <span className="text-sm font-bold text-slate-400">proveedores</span></p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={24}/></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto Anulado (Pérdida)</p>
                                <p className="text-2xl font-black text-red-600">{formatCurrency(metrics.totalAnulaciones)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={18}/> Rendimiento por Categoría (Ventas Acumuladas)</h3>
                        
                        {metrics.sortedCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                <TrendingUp size={48} strokeWidth={1} className="mb-2 opacity-50"/>
                                <p className="text-sm italic">Esperando las primeras ventas para generar métricas.</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {metrics.sortedCategories.map(([cat, amount], idx) => {
                                    const maxAmount = metrics.sortedCategories[0][1];
                                    const percentage = Math.round((amount / maxAmount) * 100);
                                    return (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{cat}</span>
                                                <span className="text-xs font-black text-slate-800">{formatCurrency(amount)}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- MÓDULO 1.5: CATÁLOGO Y PRECIOS (ADMIN) --- */}
        {activeTab === 'ADMIN' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
                    <div className="bg-slate-900 p-4 border-b border-slate-800">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2"><Box size={16}/> Registrar Nuevo Producto</h3>
                        <p className="text-[10px] text-slate-400 mt-1">El stock inicial será 0. Se abastece por facturas.</p>
                    </div>
                    <form onSubmit={handleAddProduct} className="p-5 space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nombre y Presentación</label>
                            <input type="text" required placeholder="Ej. Paracetamol 500mg x 100 tab" value={newProductForm.name} onChange={e=>setNewProductForm({...newProductForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Categoría Farmacéutica</label>
                            <select required value={newProductForm.category} onChange={e=>setNewProductForm({...newProductForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none">
                                <option value="">Seleccionar...</option>
                                <option value="Analgésicos">Analgésicos</option>
                                <option value="Antibióticos">Antibióticos</option>
                                <option value="Antiinflamatorios">Antiinflamatorios</option>
                                <option value="Antialérgicos">Antialérgicos</option>
                                <option value="Gastrointestinales">Gastrointestinales</option>
                                <option value="Respiratorios">Respiratorios</option>
                                <option value="Antihipertensivos">Antihipertensivos</option>
                                <option value="Cardiovasculares">Cardiovasculares</option>
                                <option value="Antidiabéticos">Antidiabéticos</option>
                                <option value="Vitaminas">Vitaminas</option>
                                <option value="Dermatológicos">Dermatológicos</option>
                                <option value="Antimicóticos">Antimicóticos</option>
                                <option value="Insumos">Insumos y Material Médico</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Precio Fijo Venta (S/)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">S/</span>
                                <input type="number" step="0.10" required placeholder="0.00" value={newProductForm.price} onChange={e=>setNewProductForm({...newProductForm, price: e.target.value})} className="w-full pl-8 pr-4 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm font-bold focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                        <button type="submit" className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-all">CREAR PRODUCTO</button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[75vh]">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Target size={16}/> Catálogo y Precios Oficiales</h3>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2 text-slate-400" size={14} />
                            <input type="text" placeholder="Buscar producto..." className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-white sticky top-0 border-b border-slate-200">
                                <tr className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                                    <th className="p-4">Cód</th>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4 text-center">Stock</th>
                                    <th className="p-4 text-right">Precio Actual</th>
                                    <th className="p-4 text-center">Gestión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedProducts.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 text-xs">No se encontraron productos.</td></tr>
                                ) : (
                                    displayedProducts.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="p-4 text-xs font-mono text-slate-500">{p.id}</td>
                                            <td className="p-4 font-bold text-slate-800 text-xs">
                                                {p.name}
                                                <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{p.category}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-black ${p.stock <= 10 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{p.stock}</span>
                                            </td>
                                            <td className="p-4 font-black text-emerald-600 text-right">{formatCurrency(p.price)}</td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => setPriceEditForm({ isOpen: true, product: p, newPrice: p.price, reason: '' })} className="px-3 py-1.5 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded shadow-sm text-[10px] font-bold transition-all">EDITAR PRECIO</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- MÓDULO 2: COMPRAS, PROVEEDORES Y FACTURAS (ADMIN) --- */}
        {activeTab === 'INVOICES' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
                    <div className="bg-slate-900 p-4 border-b border-slate-800">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2"><Truck size={16}/> Recepción de Facturas</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Alimenta el inventario y lotes automáticamente.</p>
                    </div>
                    <form onSubmit={handleInvoiceSubmit} className="p-5 space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proveedor</label>
                            <select required value={invoiceForm.supplier} onChange={e=>setInvoiceForm({...invoiceForm, supplier: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none">
                                <option value="">Seleccionar...</option>
                                {PROVEEDORES_BASE.map((p,i) => <option key={i} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">N° Factura</label>
                            <input type="text" required placeholder="F001-XXXX" value={invoiceForm.document} onChange={e=>setInvoiceForm({...invoiceForm, document: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none uppercase" />
                        </div>
                        <div className="border-t border-slate-100 pt-3 mt-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Producto Recibido</label>
                            <select required value={invoiceForm.productId} onChange={e=>setInvoiceForm({...invoiceForm, productId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:border-blue-500 outline-none">
                                <option value="">Seleccione el producto...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lote</label>
                                <input type="text" required value={invoiceForm.lote} onChange={e=>setInvoiceForm({...invoiceForm, lote: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm focus:border-blue-500 outline-none uppercase" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Vence</label>
                                <input type="date" required value={invoiceForm.expDate} onChange={e=>setInvoiceForm({...invoiceForm, expDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cant. Total</label>
                                <input type="number" min="1" required value={invoiceForm.qty} onChange={e=>setInvoiceForm({...invoiceForm, qty: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm font-bold text-center focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Costo Fac (S/)</label>
                                <input type="number" step="0.10" value={invoiceForm.totalCost} onChange={e=>setInvoiceForm({...invoiceForm, totalCost: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm font-bold text-right focus:border-blue-500 outline-none" placeholder="0.00" />
                            </div>
                        </div>
                        <button type="submit" className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all">REGISTRAR FACTURA</button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[75vh]">
                    <div className="bg-slate-50 p-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FileText size={16}/> Historial de Compras y Recepciones</h3>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-white sticky top-0 border-b border-slate-200">
                                <tr className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Factura</th>
                                    <th className="p-4">Proveedor</th>
                                    <th className="p-4">Ingreso de Producto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-slate-400 text-xs">No hay facturas registradas.</td></tr>
                                ) : (
                                    invoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-slate-50">
                                            <td className="p-4 text-xs font-mono text-slate-500">{inv.date}</td>
                                            <td className="p-4 font-bold text-slate-800 text-xs">{inv.document}</td>
                                            <td className="p-4 text-xs text-slate-600 font-semibold">{inv.supplier}</td>
                                            <td className="p-4 text-xs">
                                                <div className="font-bold text-blue-700">{inv.product}</div>
                                                <div className="text-slate-500 mt-0.5">+ {inv.qty} unidades ingresadas</div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- VISTA: PUNTO DE VENTA (CAJERO) --- */}
        {activeTab === 'POS' && (
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[75vh]">
              <div className="flex flex-col sm:flex-row gap-3 mb-5 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input 
                    type="text" placeholder="Buscar producto..." 
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm font-medium transition-colors"
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg outline-none focus:border-blue-500 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <option value="STOCK_ASC">Prioridad: Menor Stock</option>
                    <option value="STOCK_DESC">Prioridad: Mayor Stock</option>
                    <option value="AZ">A - Z</option>
                    <option value="ZA">Z - A</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
                {displayedProducts.map(p => {
                    const isCritical = p.stock <= 10;
                    return (
                        <div key={p.id} onClick={() => addToCart(p)} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all flex flex-col justify-between relative group ${isCritical ? 'bg-red-50/30 border-red-200 hover:border-red-400' : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20'}`}>
                            {isCritical && <div className="absolute top-2 right-2 text-red-500 animate-pulse"><AlertTriangle size={14}/></div>}
                            <div>
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono block w-max mb-1.5 tracking-wider">{p.id}</span>
                                <h4 className={`font-bold text-xs leading-tight mb-2 ${isCritical ? 'text-red-900' : 'text-slate-800'}`}>{p.name}</h4>
                            </div>
                            <div className="flex justify-between items-end mt-3 border-t border-slate-100 pt-2">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Stock</span>
                                    <span className={`font-black text-sm ${isCritical ? 'text-red-600' : 'text-slate-700'}`}>{p.stock}</span>
                                </div>
                                <span className={`font-black text-sm ${isCritical ? 'text-red-800' : 'text-emerald-600'}`}>{formatCurrency(p.price)}</span>
                            </div>
                        </div>
                    );
                })}
              </div>
            </div>

            <div className="w-full lg:w-[400px] bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-[75vh]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">🛒 Ticket</h3>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-200">Precios Fijos</span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3">
                    <ShoppingCart size={48} strokeWidth={1} />
                    <p className="text-sm font-medium">Carrito vacío</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.productId} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="font-bold text-slate-700 text-xs mb-2 leading-tight">{item.name}</div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
                                <button onClick={() => updateCartQty(item.productId, -1)} className="px-3 py-1 hover:bg-slate-100 text-slate-500 font-black">-</button>
                                <span className="w-8 text-center font-bold text-xs">{item.qty}</span>
                                <button onClick={() => updateCartQty(item.productId, 1)} className="px-3 py-1 hover:bg-slate-100 text-slate-500 font-black">+</button>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] text-slate-400 font-mono mb-0.5">{formatCurrency(item.price)} c/u</div>
                                <div className="font-black text-emerald-600 text-sm">{formatCurrency(item.subtotal)}</div>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-5 border-t border-slate-100 mt-2">
                <div className="flex justify-between items-baseline mb-5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total a Pagar</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(cart.reduce((s, i) => s + i.subtotal, 0))}</span>
                </div>
                <button onClick={processCheckout} disabled={cart.length === 0} className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-white font-black rounded-xl shadow-lg transition-all text-sm tracking-widest">
                  COBRAR TICKET
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA: HISTORIAL (CAJERO) --- */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[75vh]">
            <div className="bg-slate-50 p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Clock size={16}/> Comprobantes Emitidos</h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white sticky top-0 border-b border-slate-200">
                  <tr className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                    <th className="p-4">Ticket</th>
                    <th className="p-4">Fecha/Hora</th>
                    <th className="p-4 text-right">Total</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.length === 0 ? (<tr><td colSpan="5" className="p-8 text-center text-slate-400 text-xs">Sin registros.</td></tr>) : 
                   sales.map(s => (
                    <tr key={s.id} className={s.status === 'ANULADA' ? 'bg-red-50/30' : 'hover:bg-slate-50'}>
                      <td className="p-4 font-mono font-bold text-slate-700 text-xs">{s.id}</td>
                      <td className="p-4 text-xs text-slate-500">{s.time}</td>
                      <td className="p-4 font-black text-slate-900 text-right">{formatCurrency(s.total)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${s.status === 'COMPLETADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{s.status}</span>
                      </td>
                      <td className="p-4 text-center">
                        {s.status === 'COMPLETADA' ? (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => printTicket(s.id)} className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 rounded shadow-sm transition-all" title="Imprimir Ticket (Impresora Térmica)"><span className="text-sm">🖨️</span></button>
                            <button onClick={() => downloadTicketPDF(s.id)} className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 rounded shadow-sm transition-all flex items-center justify-center" title="Generar / Descargar PDF"><Download size={14} /></button>
                            <button onClick={() => requestVoid(s.id)} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-[10px] font-bold shadow-sm transition-all">ANULAR</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 justify-center">
                             <button onClick={() => printTicket(s.id)} className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded shadow-sm" title="Imprimir Ticket"><span className="text-sm">🖨️</span></button>
                             <button onClick={() => downloadTicketPDF(s.id)} className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 rounded shadow-sm flex items-center justify-center" title="Generar / Descargar PDF"><Download size={14} /></button>
                            <div className="text-[9px] text-red-600 text-left leading-tight"><b>Aut:</b> {s.voidBy}</div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VISTA: CAJA Y CIERRE (CAJERO) --- */}
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
                     Cuente el dinero físico de su gaveta. El sistema no revelará el monto esperado hasta que confirme su declaración.
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Efectivo Total Contado (S/)</label>
                    <div className="relative">
                       <span className="absolute left-4 top-3.5 text-xl font-bold text-slate-400">S/</span>
                       <input 
                         type="number" step="0.10" required value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)}
                         className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:bg-white focus:outline-none transition-colors"
                       />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-all uppercase tracking-widest text-sm">
                    Confirmar Conteo y Cerrar
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                    <div className="flex justify-between text-slate-500 font-medium"><span>Monto Esperado:</span><span className="text-slate-800 font-bold">{formatCurrency(cashSession.result.expected)}</span></div>
                    <div className="flex justify-between text-slate-500 font-medium"><span>Monto Declarado:</span><span className="text-slate-800 font-bold">{formatCurrency(cashSession.declaredAmount)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Diferencia:</span><span className={cashSession.result.difference === 0 ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(cashSession.result.difference)}</span></div>
                  </div>
                  <div className="bg-red-50 text-red-900 text-[10px] p-3 rounded border border-red-200 font-bold text-center">
                     🔒 TURNO FINALIZADO Y BLOQUEADO. REPORTADO A AUDITORÍA.
                  </div>
                  <button 
                    onClick={() => {
                        setCashSession({ isOpen: false, openingAmount: 0, declaredAmount: null, result: null, shiftId: null });
                        setActiveTab('OPEN_CASH');
                        setClosingAmount('');
                        addAuditLog("NUEVO TURNO", `Caja liberada para iniciar un nuevo turno o día de trabajo.`);
                    }} 
                    className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md shadow-blue-600/20 transition-all text-xs uppercase tracking-widest"
                  >
                    Iniciar Siguiente Turno (Nueva Caja)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MÓDULO: VENCIMIENTOS (ADMIN) --- */}
        {activeTab === 'EXPIRIES' && (() => {
          const allLots = products.flatMap(p => p.lots.filter(l => l.qty > 0).map(lot => {
              const expDate = new Date(`${lot.exp}T00:00:00`);
              const now = new Date();
              const threem = new Date(); threem.setMonth(now.getMonth() + 3);
              let status = 'VIGENTE';
              if (expDate <= now) status = 'VENCIDO';
              else if (expDate <= threem) status = 'PRÓXIMO';
              return { ...lot, pId: p.id, pName: p.name, status, expDateObj: expDate };
          })).sort((a,b) => a.expDateObj - b.expDateObj);
          
          return (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[75vh]">
                <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><AlertTriangle size={16}/> Control de Caducidades (FEFO)</h3>
                </div>
                <div className="overflow-x-auto flex-1 p-4">
                     <table className="w-full text-left text-sm border-collapse">
                        <thead className="border-b border-slate-200">
                           <tr className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                               <th className="p-3">Estado</th><th className="p-3">Lote</th><th className="p-3">Producto</th><th className="p-3">Vence</th><th className="p-3">Cant</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {allLots.map((l, idx) => (
                               <tr key={idx}>
                                   <td className="p-3"><span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${l.status==='VENCIDO'?'bg-red-50 text-red-700 border-red-200':l.status==='PRÓXIMO'?'bg-amber-50 text-amber-700 border-amber-200':'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{l.status}</span></td>
                                   <td className="p-3 font-mono font-bold text-xs">{l.lote}</td>
                                   <td className="p-3 font-semibold text-xs">{l.pName}</td>
                                   <td className="p-3 font-mono text-xs">{l.exp}</td>
                                   <td className="p-3 font-black text-sm">{l.qty}</td>
                               </tr>
                           ))}
                        </tbody>
                     </table>
                </div>
             </div>
          );
        })()}

        {/* --- VISTA: AUDITORÍA (ADMIN) --- */}
        {activeTab === 'AUDIT' && (
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col h-[75vh]">
            <div className="bg-black/40 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><ShieldAlert size={16} className="text-emerald-400"/> Bitácora Inalterable</h3>
              <div className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border border-red-900/50 flex items-center gap-1">Solo Lectura</div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/50 sticky top-0 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest">
                  <tr><th className="p-4">Hora</th><th className="p-4">Usuario</th><th className="p-4">Evento</th><th className="p-4">Detalle Extendido</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/50">
                      <td className="p-4 text-slate-500">{log.time}</td>
                      <td className="p-4 text-slate-400 font-bold">{log.user}</td>
                      <td className="p-4"><span className="text-[9px] px-2 py-1 rounded border border-slate-700 bg-slate-800 uppercase tracking-wider">{log.action}</span></td>
                      <td className="p-4">{log.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* --- MODALS (PIN Y LOTES) --- */}
      {authModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border-t-4 border-t-red-500 p-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4"><ShieldAlert className="text-red-500"/> Autorización PIN</h3>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input name="reason" type="text" required placeholder="Motivo de la acción" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-red-500 outline-none" />
              <input name="pin" type="password" required maxLength="4" placeholder="••••" className="w-full text-center tracking-widest px-4 py-4 text-2xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:border-red-500 outline-none" autoFocus />
              {authModal.error && <div className="text-[10px] font-bold text-red-600 text-center uppercase">{authModal.error}</div>}
              <div className="flex gap-2 pt-2">
                  <button type="button" onClick={()=>setAuthModal({...authModal, isOpen: false})} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">CANCELAR</button>
                  <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm">APROBAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewLotsModal.isOpen && viewLotsModal.product && (() => {
          const product = viewLotsModal.product;
          return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-sm font-black text-slate-800">Detalle de Lotes</h3><div className="text-xs text-slate-500 mt-0.5">{product.name}</div></div>
              <button onClick={() => setViewLotsModal({ isOpen: false, product: null })} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
                 {product.lots.filter(l => l.qty > 0).map(lot => (
                     <div key={lot.id} className="p-3 rounded-lg border bg-slate-50 border-slate-200 flex justify-between items-center">
                         <div><div className="text-xs font-mono font-bold">{lot.lote}</div><div className="text-[10px] text-slate-500 mt-1">Exp: {lot.exp}</div></div>
                         <div className="text-center"><div className="text-[9px] text-slate-400 uppercase font-bold">Stock</div><div className="font-black text-sm">{lot.qty}</div></div>
                     </div>
                 ))}
                 {product.lots.length === 0 && <div className="text-xs text-center text-slate-400 py-4">Sin lotes registrados.</div>}
            </div>
          </div>
        </div>
      )})}

      {/* --- MODAL: CLAVE DE ADMINISTRADOR --- */}
      {adminLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border-t-4 border-t-blue-500 p-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4"><ShieldAlert className="text-blue-500"/> Clave de Administrador</h3>
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const pwd = formData.get('password');
                if(pwd === '1234') {
                    handleLogin('ADMIN');
                } else {
                    showAlert('Clave incorrecta. Intento registrado.', 'error');
                    addAuditLog("ALERTA SEGURIDAD", "Intento fallido de acceso al panel Administrador.");
                }
            }} className="space-y-4">
              <input name="password" type="password" required placeholder="Ingrese la clave..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none text-center tracking-widest font-black" autoFocus />
              <div className="text-[10px] text-slate-400 text-center uppercase">Para la presentación use la clave: 1234</div>
              <div className="flex gap-2 pt-2">
                  <button type="button" onClick={()=>setAdminLoginModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200">CANCELAR</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-md shadow-blue-600/20">INGRESAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDICIÓN DE PRECIOS --- */}
      {priceEditForm.isOpen && priceEditForm.product && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border-t-4 border-t-blue-500 p-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2"><Edit3 className="text-blue-500"/> Editar Precio</h3>
            <div className="text-sm font-bold text-slate-700 mb-1">{priceEditForm.product.name}</div>
            <div className="text-xs text-slate-500 mb-4">Precio Actual: {formatCurrency(priceEditForm.product.price)}</div>
            
            <form onSubmit={submitPriceChange} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nuevo Precio (S/)</label>
                <input type="number" step="0.10" required value={priceEditForm.newPrice} onChange={e=>setPriceEditForm({...priceEditForm, newPrice: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black focus:border-blue-500 outline-none text-center" autoFocus />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Motivo del Cambio (Obligatorio)</label>
                <input type="text" required placeholder="Ej. Aumento de costo de distribuidora" value={priceEditForm.reason} onChange={e=>setPriceEditForm({...priceEditForm, reason: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
              </div>
              
              <div className="flex gap-2 pt-2">
                  <button type="button" onClick={()=>setPriceEditForm({isOpen: false, product: null, newPrice: '', reason: ''})} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200">CANCELAR</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-md shadow-blue-600/20">ACTUALIZAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}