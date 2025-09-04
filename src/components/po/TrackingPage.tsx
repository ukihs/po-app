import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, onSnapshot, orderBy, query, where, doc, getDoc } from 'firebase/firestore';
import { approveOrder } from '../../lib/poApi';
import { subscribeAuthAndRole } from '../../lib/auth';
import { 
  FileText, 
  CheckCircle, 
  ShoppingCart, 
  Package, 
  Clock, 
  AlertCircle,
  XCircle,
  Truck,
  User
} from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';

interface OrderData {
  id: string;
  orderNo: number;
  date: string;
  requesterName: string;
  requesterUid: string;
  total: number;
  status: Status;
  createdAt: any;
  items?: any[];
}

export default function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrderData[]>([]);
  const [err, setErr] = useState('');
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | null>(null);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    let offOrders: any;
    let offAuth: any;

    // Subscribe to auth and role changes
    offAuth = subscribeAuthAndRole((authUser, userRole) => {
      console.log('TrackingPage - User:', authUser?.email, 'Role:', userRole);
      
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      setUser(authUser);
      
      // Manual role detection with fallback
      const detectRole = async () => {
        let detectedRole = userRole;
        
        // Fallback: check Firestore directly if role is null or suspicious
        if (!userRole || (authUser.email?.includes('tanza') && userRole === 'buyer')) {
          try {
            const userDoc = await getDoc(doc(db, 'users', authUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              detectedRole = userData.role;
              console.log('Manual role detection:', detectedRole);
            }
          } catch (error) {
            console.error('Error detecting role:', error);
          }
        }

        setRole(detectedRole);
        setDebugInfo(`User: ${authUser.email} | Role: ${detectedRole} | Auth Role: ${userRole}`);

        // Clean up previous listener
        offOrders?.();

        let q;
        if (detectedRole === 'buyer') {
          // Buyer: เห็นแค่ order ของตัวเอง
          q = query(
            collection(db, 'orders'),
            where('requesterUid', '==', authUser.uid),
            orderBy('createdAt', 'desc')
          );
        } else if (detectedRole === 'supervisor' || detectedRole === 'procurement') {
          // Supervisor/Procurement: เห็น order ทั้งหมด
          q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
          );
        } else {
          setLoading(false);
          setErr('ไม่พบ role ในระบบ กรุณาตรวจสอบการตั้งค่า role ใน Firestore');
          return;
        }

        offOrders = onSnapshot(
          q,
          (snap) => {
            const list = snap.docs.map((d) => {
              const data = d.data() as any;
              return {
                id: d.id,
                orderNo: data.orderNo || 0,
                date: data.date || '',
                requesterName: data.requesterName || '',
                requesterUid: data.requesterUid || '',
                total: Number(data.total || 0),
                status: (data.status || 'pending') as Status,
                createdAt: data.createdAt,
                items: data.items || [],
              };
            });
            
            console.log('Orders loaded:', list.length, 'orders');
            setRows(list);
            setErr('');
            setLoading(false);
          },
          (e) => {
            console.error('Orders query error:', e);
            setErr(String(e?.message || e));
            setLoading(false);
          }
        );
      };

      detectRole();
    });

    return () => {
      offOrders?.();
      offAuth?.();
    };
  }, []);

  const handleApproval = async (orderId: string, approved: boolean) => {
    const action = approved ? 'อนุมัติ' : 'ไม่อนุมัติ';
    console.log(`${action} order:`, orderId);
    
    if (!confirm(`คุณต้องการ${action}ใบสั่งซื้อนี้หรือไม่?`)) {
      return;
    }

    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      await approveOrder(orderId, approved);
      alert(`${action}ใบสั่งซื้อเรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error approving order:', error);
      alert(`เกิดข้อผิดพลาดใน${action}: ` + (error as any)?.message);
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="alert alert-error">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h3 className="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
            <div className="text-sm">{err}</div>
            <div className="text-xs mt-2">Debug: {debugInfo}</div>
          </div>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 p-3 bg-blue-100 rounded text-sm">
          <strong>Debug Info:</strong> {debugInfo} | Orders: {rows.length}
        </div>
        
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {role === 'buyer' ? 'ยังไม่มีใบสั่งซื้อ' : 'ยังไม่มีใบสั่งซื้อในระบบ'}
          </h3>
          <p className="text-gray-600 mb-6">
            {role === 'buyer' ? 'เริ่มต้นสร้างใบสั่งซื้อแรกของคุณ' : 'รอใบสั่งซื้อจากผู้ใช้งาน'}
          </p>
          {role === 'buyer' && (
            <a 
              href="/orders/create"
              className="btn btn-primary rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200"
              style={{ backgroundColor: '#64D1E3', borderColor: '#64D1E3', color: 'white' }}
            >
              สร้างใบสั่งซื้อแรก
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Debug Info */}
      <div className="mb-4 p-3 bg-blue-100 rounded text-sm">
        <strong>Debug Info:</strong> {debugInfo} | Orders: {rows.length}
        <div className="text-xs mt-1">
          Pending: {rows.filter(o => o.status === 'pending').length} | 
          Approved: {rows.filter(o => o.status === 'approved').length} | 
          Rejected: {rows.filter(o => o.status === 'rejected').length}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {role === 'buyer' ? 'ติดตามสถานะใบสั่งซื้อ' : 
           role === 'supervisor' ? 'ติดตามและอนุมัติใบสั่งซื้อ' :
           'ติดตามใบสั่งซื้อทั้งหมด'}
        </h2>
        {role === 'supervisor' && (
          <p className="text-sm text-gray-600 mt-1">
            คุณสามารถดูและอนุมัติใบสั่งซื้อทั้งหมดในระบบ
          </p>
        )}
      </div>

      <div className="space-y-6">
        {rows.map((order) => (
          <div key={order.id} className="card bg-white shadow-lg border border-gray-200">
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    PO-{new Date().getFullYear()}{(new Date().getMonth() + 1).toString().padStart(2, '0')}{new Date().getDate().toString().padStart(2, '0')}-{order.orderNo.toString().padStart(4, '0')}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      ผู้ขอ: {order.requesterName}
                    </span>
                    <span>วันที่: {order.date}</span>
                    <span>จำนวนเงิน: {order.total.toLocaleString('th-TH')} บาท</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    สร้างเมื่อ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : '—'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Debug: Status = {order.status} | ID = {order.id.substring(0, 8)}...
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="mb-3">
                    {getStatusBadge(order.status)}
                  </div>
                  
                  {/* Supervisor approval buttons */}
                  {role === 'supervisor' && (
                    <div className="space-y-2">
                      {order.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproval(order.id, true)}
                            disabled={processingOrders.has(order.id)}
                            className="btn btn-sm rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                            style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                          >
                            {processingOrders.has(order.id) ? (
                              <span className="loading loading-spinner loading-xs mr-1"></span>
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleApproval(order.id, false)}
                            disabled={processingOrders.has(order.id)}
                            className="btn btn-sm rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                            style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                          >
                            {processingOrders.has(order.id) ? (
                              <span className="loading loading-spinner loading-xs mr-1"></span>
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            ไม่อนุมัติ
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 px-3 py-1 bg-gray-100 rounded">
                          {order.status === 'approved' ? '✓ อนุมัติแล้ว' :
                           order.status === 'rejected' ? '✗ ไม่อนุมัติ' :
                           `สถานะ: ${order.status}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">ขั้นตอนการดำเนินงาน</h4>
                {renderProgressFlow(order.status)}
              </div>

              {order.items && order.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">รายการสินค้า</h4>
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{item.description}</span>
                          {item.receivedDate && (
                            <span className="text-xs text-gray-500 ml-2">
                              (ต้องการรับ: {item.receivedDate})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            <div>จำนวน: {item.quantity}</div>
                            <div>ราคาต่อหน่วย: {item.amount?.toLocaleString('th-TH')} บาท</div>
                            <div className="font-semibold text-gray-900 mt-1">
                              รวม: {item.lineTotal?.toLocaleString('th-TH')} บาท
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusBadge(status: Status) {
  switch (status) {
    case 'pending':
      return (
        <div className="badge badge-warning flex items-center gap-1">
          <Clock className="w-3 h-3" />
          รออนุมัติ
        </div>
      );
    case 'approved':
      return (
        <div className="badge badge-success flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          อนุมัติแล้ว
        </div>
      );
    case 'rejected':
      return (
        <div className="badge badge-error flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          ไม่อนุมัติ
        </div>
      );
    case 'in_progress':
      return (
        <div className="badge badge-info flex items-center gap-1">
          <Truck className="w-3 h-3" />
          กำลังดำเนินการ
        </div>
      );
    case 'delivered':
      return (
        <div className="badge badge-success flex items-center gap-1">
          <Package className="w-3 h-3" />
          ได้รับแล้ว
        </div>
      );
    default:
      return (
        <div className="badge badge-neutral flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {status}
        </div>
      );
  }
}

function renderProgressFlow(status: Status) {
  const getStepClass = (stepKey: string, orderStatus: Status) => {
    if (stepKey === 'submitted') {
      return 'step step-primary';
    }
    
    const stepStatus = getStepStatus(stepKey, orderStatus);
    
    switch (stepStatus) {
      case 'completed':
        return 'step step-primary';
      case 'current':
        return 'step step-primary';
      default:
        return 'step';
    }
  };

  return (
    <ul className="steps steps-vertical lg:steps-horizontal w-full">
      <li className={getStepClass('submitted', status)}>
        <span className="step-icon">
          <FileText className="w-4 h-4" />
        </span>
        <div className="flex flex-col">
          <span className="font-medium">ผู้ขอซื้อ</span>
          <span className="text-xs text-success mt-1">เสร็จสิ้น</span>
        </div>
      </li>
      <li className={getStepClass('approval', status)}>
        <span className="step-icon">
          <CheckCircle className="w-4 h-4" />
        </span>
        <div className="flex flex-col">
          <span className="font-medium">หัวหน้าอนุมัติ</span>
          {getStepStatus('approval', status) === 'current' && (
            <span className="text-xs text-warning mt-1">รอดำเนินการ</span>
          )}
          {getStepStatus('approval', status) === 'completed' && (
            <span className="text-xs text-success mt-1">เสร็จสิ้น</span>
          )}
          {status === 'rejected' && (
            <span className="text-xs text-error mt-1">ไม่อนุมัติ</span>
          )}
        </div>
      </li>
      <li className={getStepClass('procurement', status)}>
        <span className="step-icon">
          <ShoppingCart className="w-4 h-4" />
        </span>
        <div className="flex flex-col">
          <span className="font-medium">ฝ่ายจัดซื้อ</span>
          {getStepStatus('procurement', status) === 'current' && (
            <span className="text-xs text-warning mt-1">รอดำเนินการ</span>
          )}
          {getStepStatus('procurement', status) === 'completed' && (
            <span className="text-xs text-success mt-1">เสร็จสิ้น</span>
          )}
        </div>
      </li>
      <li className={getStepClass('delivered', status)}>
        <span className="step-icon">
          <Package className="w-4 h-4" />
        </span>
        <div className="flex flex-col">
          <span className="font-medium">ส่งมอบ</span>
          {getStepStatus('delivered', status) === 'current' && (
            <span className="text-xs text-warning mt-1">รอดำเนินการ</span>
          )}
          {getStepStatus('delivered', status) === 'completed' && (
            <span className="text-xs text-success mt-1">เสร็จสิ้น</span>
          )}
        </div>
      </li>
    </ul>
  );
}

function getStepStatus(step: string, orderStatus: Status): 'completed' | 'current' | 'pending' {
  switch (step) {
    case 'approval':
      if (orderStatus === 'pending') return 'current';
      if (['approved', 'in_progress', 'delivered'].includes(orderStatus)) return 'completed';
      return 'pending';
    case 'procurement':
      if (orderStatus === 'approved') return 'current';
      if (['in_progress', 'delivered'].includes(orderStatus)) return 'completed';
      return 'pending';
    case 'delivered':
      if (orderStatus === 'in_progress') return 'current';
      if (orderStatus === 'delivered') return 'completed';
      return 'pending';
    default:
      return 'pending';
  }
}