import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/client';
import { collection, onSnapshot, orderBy, query, where, doc, getDoc } from 'firebase/firestore';
import { subscribeAuthAndRole } from '../../lib/auth';
import { approveOrder, generateOrderNumber } from '../../lib/poApi';
import { 
  FileText, 
  CheckCircle, 
  ShoppingCart, 
  Package, 
  Clock, 
  AlertCircle,
  XCircle,
  Truck,
  Tag,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';

interface OrderItem {
  description?: string;
  quantity?: number;
  amount?: number;
  lineTotal?: number;
  receivedDate?: string;
  category?: string;
  itemStatus?: string;
  itemType?: string;
}

interface OrderData {
  id: string;
  orderNo: number;
  date: string;
  requesterName: string;
  requesterUid: string;
  total: number;
  status: Status;
  createdAt: any;
  items?: OrderItem[];
  itemsCategories?: Record<string, string>;
  itemsStatuses?: Record<string, string>;
}

export default function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrderData[]>([]);
  const [err, setErr] = useState('');
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | 'superadmin' | null>(null);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    orderId: string;
    approved: boolean;
    orderNo: number;
    requesterName: string;
  } | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    let offOrders: any;
    let offAuth: any;

    offAuth = subscribeAuthAndRole((authUser, userRole) => {
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      setUser(authUser);
      
      const detectRole = async () => {
        let detectedRole = userRole;
        
        if (!userRole || (authUser.email?.includes('tanza') && userRole === 'buyer')) {
          try {
            const userDoc = await getDoc(doc(db, 'users', authUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              detectedRole = userData.role;
            }
          } catch (error) {
            console.error('Error detecting role:', error);
          }
        }

        setRole(detectedRole);
        offOrders?.();

        let q;
        if (detectedRole === 'buyer') {
          q = query(
            collection(db, 'orders'),
            where('requesterUid', '==', authUser.uid),
            orderBy('createdAt', 'desc')
          );
        } else if (detectedRole === 'supervisor' || detectedRole === 'procurement') {
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
                itemsCategories: data.itemsCategories || {},
                itemsStatuses: data.itemsStatuses || {},
              };
            });
            
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

  const showApprovalModal = (orderId: string, approved: boolean, orderNo: number, requesterName: string) => {
    setConfirmData({
      orderId,
      approved,
      orderNo,
      requesterName
    });
    setShowConfirmModal(true);
  };

  const handleApproval = async () => {
    if (!confirmData) return;
    
    const { orderId, approved } = confirmData;
    const action = approved ? 'อนุมัติ' : 'ไม่อนุมัติ';

    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      setShowConfirmModal(false);
      
      console.log(`กำลัง${action}ใบขอซื้อ...`, orderId);
      
      await approveOrder(orderId, approved);
      
      console.log(`${action}ใบขอซื้อเรียบร้อยแล้ว`);
      
      setAlertData({
        type: 'success',
        message: `${action}ใบขอซื้อเรียบร้อยแล้ว`
      });
      setShowAlert(true);
      
      setTimeout(() => {
        setShowAlert(false);
        setAlertData(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error approving order:', error);
      
      const errorMessage = (error as any)?.message || '';
      const isPermissionError = errorMessage.includes('permission') || 
                               errorMessage.includes('insufficient') ||
                               errorMessage.includes('Missing') ||
                               errorMessage.includes('FirebaseError');
      
      if (isPermissionError) {
        console.warn('Permission warning occurred, checking if operation succeeded');
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        setAlertData({
          type: 'success',
          message: `${action}สำเร็จแล้ว กำลังอัปเดตข้อมูล...`
        });
        setShowAlert(true);
        
        setTimeout(() => {
          setShowAlert(false);
          setAlertData(null);
        }, 3000);
      } else {
        setAlertData({
          type: 'error',
          message: `เกิดข้อผิดพลาดใน${action}: ${errorMessage}`
        });
        setShowAlert(true);
        
        setTimeout(() => {
          setShowAlert(false);
          setAlertData(null);
        }, 5000);
      }
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      setConfirmData(null);
    }
  };

  const cancelApproval = () => {
    setShowConfirmModal(false);
    setConfirmData(null);
  };

  const getItemCategory = (order: OrderData, index: number): string => {
    const fromMap = order.itemsCategories?.[index.toString()];
    if (fromMap) return fromMap;
    
    const item = order.items?.[index];
    const category = item?.category || item?.itemType || 'วัตถุดิบ';
    
    return category;
  };

  const getItemStatus = (order: OrderData, index: number): string => {
    const fromMap = order.itemsStatuses?.[index.toString()];
    if (fromMap) return fromMap;
    
    const item = order.items?.[index];
    const status = item?.itemStatus || 'รอดำเนินการ';
    
    return status;
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'วัตถุดิบ':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Software':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'เครื่องมือ':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'วัสดุสิ้นเปลือง':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getItemStatusColor = (status: string): string => {
    switch (status) {
      case 'จัดซื้อ':
        return 'bg-yellow-100 text-yellow-800';
      case 'ของมาส่ง':
        return 'bg-blue-100 text-blue-800';
      case 'ส่งมอบของ':
        return 'bg-green-100 text-green-800';
      case 'สินค้าเข้าคลัง':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          </div>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {role === 'buyer' ? 'คุณยังไม่มีใบขอซื้อ' : 'ยังไม่มีใบขอซื้อในระบบ'}
          </h3>
          <p className="text-gray-600 mb-6">
            {role === 'buyer' ? 'เริ่มสร้างใบขอซื้อแรกได้เลย!' : 'รอใบขอซื้อจากผู้ใช้งาน'}
          </p>
          {role === 'buyer' && (
            <a 
              href="/orders/create"
              className="btn bg-[#64D1E3] hover:bg-[#2b9ccc] rounded-xl text-white"
            >
              สร้างใบขอซื้อ
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {role === 'buyer' ? 'ติดตามสถานะใบขอซื้อ' : 
           role === 'supervisor' ? 'ติดตามและอนุมัติใบขอซื้อ' :
           'ติดตามใบขอซื้อทั้งหมด'}
        </h2>
        {role === 'supervisor' && (
          <p className="text-sm text-gray-600 mt-1">
            หน้าจัดการตรวจสอบและอนุมัติใบขอซื้อทั้งหมดในระบบ
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
                    {generateOrderNumber(order.orderNo, order.date)}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      ชื่อผู้ขอ: {order.requesterName}
                    </span>
                    <span>วันที่: {order.date}</span>
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
                </div>
                
                <div className="text-right">
                  <div className="mb-3">
                    {getStatusBadge(order.status)}
                  </div>
                  
                  {role === 'supervisor' && (
                    <div className="space-y-2">
                      {order.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => showApprovalModal(order.id, true, order.orderNo, order.requesterName)}
                            disabled={processingOrders.has(order.id)}
                            className="btn btn-sm bg-green-500 text-white hover:bg-green-600"
                          >
                            {processingOrders.has(order.id) ? (
                              <span className="loading loading-spinner loading-xs mr-1"></span>
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => showApprovalModal(order.id, false, order.orderNo, order.requesterName)}
                            disabled={processingOrders.has(order.id)}
                            className="btn btn-sm bg-red-500 text-white hover:bg-red-600"
                          >
                            {processingOrders.has(order.id) ? (
                              <span className="loading loading-spinner loading-xs mr-1"></span>
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            ไม่อนุมัติ
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-4">ขั้นตอนการดำเนินงาน</h4>
                {renderProgressFlow(order.status)}
              </div>

              {order.items && order.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    รายการสินค้า ({order.items.length} รายการ)
                  </h4>
                  
                  <div className="space-y-3">
                    {order.items.map((item: OrderItem, idx: number) => {
                      const category = getItemCategory(order, idx);
                      const itemStatus = getItemStatus(order, idx);
                      
                      return (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  รายการที่ {idx + 1} : "{item.description}"
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}>
                                  <Tag className="w-3 h-3" />
                                  ประเภท: {category}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(itemStatus)}`}>
                                  <Activity className="w-3 h-3" />
                                  สถานะ: {itemStatus}
                                </span>
                              </div>
                              
                              {item.receivedDate && (
                                <div className="text-xs text-gray-500 mb-1">
                                  ต้องการรับ: {item.receivedDate}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right min-w-[120px]">
                              <div className="text-sm text-gray-600">
                                <div>จำนวน {item.quantity?.toLocaleString('th-TH')}</div>
                                <div>ราคาต่อหน่วย {item.amount?.toLocaleString('th-TH')} บาท</div>
                                <div>รวม {item.lineTotal?.toLocaleString('th-TH')} บาท
                                </div>
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>

                  <div className="divider"/>
                   <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                     สรุปรายการ
                   </h4>
                   <div className="mt-4 flex justify-end">
                     <div className="text-sm text-gray-600 text-right">
                       <div className="mb-1">
                         <span className="text-gray-700">จำนวนรายการทั้งหมด : </span>
                         <span className="font-medium">{order.items.length} รายการ</span>
                       </div>
                       <div>
                         <span className="text-gray-700">ยอดรวมทั้งสิ้น : </span>
                         <span className="text-lg font-bold text-[#64D1E3]">{order.total.toLocaleString('th-TH')} บาท</span>
                       </div>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <dialog className={`modal ${showConfirmModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            {confirmData?.approved ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                ยืนยันการอนุมัติ
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                ยืนยันการไม่อนุมัติ
              </>
            )}
          </h3>
          
          {confirmData && (
            <div className="py-4">
              <p className="text-base">
                คุณต้องการ{confirmData.approved ? 'อนุมัติ' : 'ไม่อนุมัติ'}ใบขอซื้อนี้หรือไม่?
              </p>
            </div>
          )}
          
          <div className="modal-action">
            <button 
              className="btn btn-ghost font-normal" 
              onClick={cancelApproval}
              disabled={processingOrders.has(confirmData?.orderId || '')}
            >
              ยกเลิก
            </button>
            <button 
              className={`btn text-white ${
                confirmData?.approved 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              onClick={handleApproval}
              disabled={processingOrders.has(confirmData?.orderId || '')}
            >
              {processingOrders.has(confirmData?.orderId || '') ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  {confirmData?.approved ? (
                    <>
                      ยืนยัน
                    </>
                  ) : (
                    <>
                      ยืนยัน
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={cancelApproval}>close</button>
        </form>
      </dialog>

      {showAlert && alertData && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div
            role="alert"
            className={`alert alert-${alertData.type} alert-soft shadow-lg border-0`}
          >
            {alertData.type === 'success' && (
              <CheckCircle2 className="h-6 w-6 shrink-0 stroke-current" />
            )}
            {alertData.type === 'warning' && (
              <AlertTriangle className="h-6 w-6 shrink-0 stroke-current" />
            )}
            {alertData.type === 'error' && (
              <XCircle className="h-6 w-6 shrink-0 stroke-current" />
            )}
            <span className="text-sm font-medium">{alertData.message}</span>
            <button
              onClick={() => {
                setShowAlert(false);
                setAlertData(null);
              }}
              className="btn btn-sm btn-ghost btn-circle ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadge(status: Status) {
  switch (status) {
    case 'pending':
      return (
        <div className="badge badge-soft badge-warning">
          <Clock className="w-3 h-3" />
          รออนุมัติ
        </div>
      );
    case 'approved':
      return (
        <div className="badge badge-soft badge-accent">
          <CheckCircle className="w-3 h-3" />
          อนุมัติแล้ว
        </div>
      );
    case 'rejected':
      return (
        <div className="badge badge-soft badge-error">
          <XCircle className="w-3 h-3" />
          ไม่อนุมัติ
        </div>
      );
    case 'in_progress':
      return (
        <div className="badge badge-soft badge-info">
          <Truck className="w-3 h-3" />
          กำลังดำเนินการ
        </div>
      );
    case 'delivered':
      return (
        <div className="badge badge-soft badge-success">
          <Package className="w-3 h-3" />
          ได้รับแล้ว
        </div>
      );
    default:
      return (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
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